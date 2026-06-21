import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, KFold
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler
import lightgbm as lgb
import xgboost as xgb
import pickle
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import TensorDataset, DataLoader

# ─── Residual Block for Deep Learning Model ───
class ResidualBlock(nn.Module):
    """A single residual block with LayerNorm, SiLU activation, and skip connection."""
    def __init__(self, dim, dropout=0.15):
        super().__init__()
        self.block = nn.Sequential(
            nn.LayerNorm(dim),
            nn.Linear(dim, dim),
            nn.SiLU(),
            nn.Dropout(dropout),
            nn.Linear(dim, dim),
        )

    def forward(self, x):
        return x + self.block(x)   # Skip connection


class ResidualMLP(nn.Module):
    """
    Deep Residual MLP for congestion surge regression.
    Architecture: Linear projection → N residual blocks → output head.
    Uses LayerNorm, SiLU activations, Dropout, and skip connections.
    """
    def __init__(self, input_dim, hidden_dim=128, n_blocks=3, dropout=0.15):
        super().__init__()
        self.input_proj = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.SiLU(),
        )
        self.res_blocks = nn.Sequential(
            *[ResidualBlock(hidden_dim, dropout) for _ in range(n_blocks)]
        )
        self.head = nn.Sequential(
            nn.LayerNorm(hidden_dim),
            nn.Linear(hidden_dim, 64),
            nn.SiLU(),
            nn.Dropout(dropout * 0.5),
            nn.Linear(64, 1),
        )

    def forward(self, x):
        x = self.input_proj(x)
        x = self.res_blocks(x)
        return self.head(x)


# Backward compatibility alias for loading old pickled models
MLPRegressor = ResidualMLP


def out_of_fold_target_encoding(df, cat_col, target_col, n_splits=5, random_state=42):
    encoded = np.full(len(df), np.nan)
    global_mean = df[target_col].mean()
    kf = KFold(n_splits=n_splits, shuffle=True, random_state=random_state)
    for tr_idx, val_idx in kf.split(df):
        cat_means = df.iloc[tr_idx].groupby(cat_col)[target_col].mean()
        encoded[val_idx] = df.iloc[val_idx][cat_col].map(cat_means).fillna(global_mean)
    full_mapping = df.groupby(cat_col)[target_col].mean().to_dict()
    full_mapping['__global_mean__'] = global_mean
    return pd.Series(encoded, index=df.index).fillna(global_mean), full_mapping

def prepare_features(df, is_train=True, road_name_mapping=None):
    d = df.copy()

    if is_train:
        d['road_name_enc'], road_mapping = out_of_fold_target_encoding(d, 'road_name', 'congestion_surge_index')
    else:
        gm = road_name_mapping.get('__global_mean__', 40.0)
        d['road_name_enc'] = d['road_name'].map(road_name_mapping).fillna(gm)
        road_mapping = road_name_mapping

    if is_train:
        d['station_enc'], station_mapping = out_of_fold_target_encoding(d, 'police_station', 'congestion_surge_index')
    else:
        gm2 = road_name_mapping.get('__station_global_mean__', 40.0)
        sm  = road_name_mapping.get('__station_mapping__', {})
        d['station_enc'] = d['police_station'].map(sm).fillna(gm2)
        station_mapping = sm

    base_features = [
        'hour', 'day_of_week', 'month', 'is_rush_hour', 'weekend_flag',
        'hour_sin', 'hour_cos', 'dow_sin', 'dow_cos',
        'distance_to_metro', 'distance_to_market',
        'distance_to_intersection', 'distance_to_hub',
        'is_near_intersection', 'spillover_multiplier',
        'historical_risk_score', 'event_recurrence_frequency',
        'time_to_resolution_minutes', 'mean_resolution_by_cause',
        'resolution_delay_ratio', 'planned_event_lead_time_hours',
        'multi_incident_overlap_score', 'temporal_density_score',
        'corridor_vulnerability_tier',
        'cause_severity_score', 'priority_weight', 'cause_priority_interaction',
        'estimated_impact_scale',
        'road_name_enc', 'station_enc',
    ]

    cat_onehot = ['event_cause', 'event_type', 'priority', 'status', 'corridor']
    feature_cols = list(base_features)
    for col in cat_onehot:
        if col in d.columns:
            dummies = pd.get_dummies(d[col], prefix=col, dtype=float)
            d = pd.concat([d, dummies], axis=1)
            feature_cols.extend(dummies.columns.tolist())

    if is_train:
        road_mapping['__station_global_mean__'] = d['station_enc'].mean()
        road_mapping['__station_mapping__'] = station_mapping

    return d, feature_cols, road_mapping

def train_pytorch_mlp(X_train, y_train, X_val, y_val, epochs=120, batch_size=128, lr=0.0015):
    """Train a Residual MLP deep learning model with LR scheduling and early stopping."""
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)

    X_tr_t = torch.tensor(X_train_scaled, dtype=torch.float32)
    y_tr_t = torch.tensor(y_train.values / 100.0, dtype=torch.float32).view(-1, 1)
    X_val_t = torch.tensor(X_val_scaled, dtype=torch.float32)
    y_val_t = torch.tensor(y_val.values / 100.0, dtype=torch.float32).view(-1, 1)

    dataset = TensorDataset(X_tr_t, y_tr_t)
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

    input_dim = X_train.shape[1]
    model = ResidualMLP(input_dim, hidden_dim=128, n_blocks=3, dropout=0.15)
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=10)

    best_loss = float('inf')
    best_state = None
    patience_counter = 0
    patience_limit = 25  # Early stopping patience

    for epoch in range(epochs):
        model.train()
        for bx, by in loader:
            optimizer.zero_grad()
            pred = model(bx)
            loss = criterion(pred, by)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)  # Gradient clipping
            optimizer.step()

        model.eval()
        with torch.no_grad():
            val_pred = model(X_val_t)
            val_loss = criterion(val_pred, y_val_t).item()

        scheduler.step(val_loss)

        if val_loss < best_loss:
            best_loss = val_loss
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}
            patience_counter = 0
        else:
            patience_counter += 1
            if patience_counter >= patience_limit:
                print(f"  [PyTorch] Early stopping at epoch {epoch+1}/{epochs} (best val_loss: {best_loss:.6f})")
                break

    if best_state is not None:
        model.load_state_dict(best_state)

    model.eval()
    with torch.no_grad():
        val_preds = (model(X_val_t).numpy().flatten()) * 100.0

    return best_state, scaler, val_preds

def train_ensemble_models(df):
    d, feature_cols, road_mapping = prepare_features(df, is_train=True)
    X = d[feature_cols]
    y = d['congestion_surge_index']

    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

    # 1. Train LightGBM
    lgb_reg = lgb.LGBMRegressor(
        n_estimators=1000, learning_rate=0.05, max_depth=7,
        num_leaves=63, subsample=0.8, colsample_bytree=0.8,
        min_child_samples=20, random_state=42, verbosity=-1
    )
    lgb_reg.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        callbacks=[lgb.early_stopping(50, verbose=False)]
    )

    # 2. Train XGBoost
    xgb_reg = xgb.XGBRegressor(
        n_estimators=1000, learning_rate=0.05, max_depth=6,
        subsample=0.8, colsample_bytree=0.8,
        early_stopping_rounds=50, random_state=42
    )
    xgb_reg.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)

    # 3. Train PyTorch MLP
    pytorch_state, pytorch_scaler, yp_torch = train_pytorch_mlp(X_train, y_train, X_val, y_val)

    yp_lgb = lgb_reg.predict(X_val)
    yp_xgb = xgb_reg.predict(X_val)
    
    # 3-Model Ensemble: 50% LightGBM, 30% XGBoost, 20% PyTorch
    yp_ens = 0.5 * yp_lgb + 0.3 * yp_xgb + 0.2 * yp_torch

    metrics = {
        'lgb':      {'rmse': float(np.sqrt(mean_squared_error(y_val, yp_lgb))),
                     'r2':   float(r2_score(y_val, yp_lgb))},
        'xgb':      {'rmse': float(np.sqrt(mean_squared_error(y_val, yp_xgb))),
                     'r2':   float(r2_score(y_val, yp_xgb))},
        'pytorch':  {'rmse': float(np.sqrt(mean_squared_error(y_val, yp_torch))),
                     'r2':   float(r2_score(y_val, yp_torch))},
        'ensemble': {'rmse': float(np.sqrt(mean_squared_error(y_val, yp_ens))),
                     'r2':   float(r2_score(y_val, yp_ens))},
    }

    print("=== Model Validation Metrics ===")
    for name, m in metrics.items():
        print(f"  {name:<10} RMSE: {m['rmse']:.4f}   R2: {m['r2']:.4f}")

    payload = {
        'lgb_model':           lgb_reg,
        'xgb_model':           xgb_reg,
        'pytorch_model_state': pytorch_state,
        'pytorch_scaler':      pytorch_scaler,
        'feature_cols':        feature_cols,
        'road_mapping':        road_mapping,
        'metrics':             metrics,
    }
    with open('model_payload.pkl', 'wb') as f:
        pickle.dump(payload, f)

    return payload, metrics

def predict_surge(df_input, model_payload):
    d, _, _ = prepare_features(df_input, is_train=False, road_name_mapping=model_payload['road_mapping'])
    feature_cols = model_payload['feature_cols']
    for col in feature_cols:
        if col not in d.columns:
            d[col] = 0.0
    X = d[feature_cols]

    p_lgb = model_payload['lgb_model'].predict(X)
    p_xgb = model_payload['xgb_model'].predict(X)
    
    p_torch = np.zeros(len(X))
    if 'pytorch_model_state' in model_payload:
        scaler = model_payload['pytorch_scaler']
        X_scaled = scaler.transform(X)
        X_t = torch.tensor(X_scaled, dtype=torch.float32)
        
        input_dim = X.shape[1]
        model = ResidualMLP(input_dim, hidden_dim=128, n_blocks=3, dropout=0.15)
        model.load_state_dict(model_payload['pytorch_model_state'])
        model.eval()
        with torch.no_grad():
            p_torch = (model(X_t).numpy().flatten()) * 100.0
            
        p_ens = 0.5 * p_lgb + 0.3 * p_xgb + 0.2 * p_torch
    else:
        p_ens = 0.6 * p_lgb + 0.4 * p_xgb
        
    return p_ens, p_lgb, p_xgb, p_torch

predict_delay = predict_surge
