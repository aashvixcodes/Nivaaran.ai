import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, KFold
from sklearn.metrics import mean_squared_error, r2_score
import lightgbm as lgb
import xgboost as xgb
import pickle

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

def train_ensemble_models(df):
    d, feature_cols, road_mapping = prepare_features(df, is_train=True)
    X = d[feature_cols]
    y = d['congestion_surge_index']

    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

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

    xgb_reg = xgb.XGBRegressor(
        n_estimators=1000, learning_rate=0.05, max_depth=6,
        subsample=0.8, colsample_bytree=0.8,
        early_stopping_rounds=50, random_state=42
    )
    xgb_reg.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)

    yp_lgb = lgb_reg.predict(X_val)
    yp_xgb = xgb_reg.predict(X_val)
    yp_ens = 0.6 * yp_lgb + 0.4 * yp_xgb

    metrics = {
        'lgb':      {'rmse': float(np.sqrt(mean_squared_error(y_val, yp_lgb))),
                     'r2':   float(r2_score(y_val, yp_lgb))},
        'xgb':      {'rmse': float(np.sqrt(mean_squared_error(y_val, yp_xgb))),
                     'r2':   float(r2_score(y_val, yp_xgb))},
        'ensemble': {'rmse': float(np.sqrt(mean_squared_error(y_val, yp_ens))),
                     'r2':   float(r2_score(y_val, yp_ens))},
    }

    print("=== Model Validation Metrics ===")
    for name, m in metrics.items():
        print(f"  {name:<10} RMSE: {m['rmse']:.4f}   R2: {m['r2']:.4f}")

    payload = {
        'lgb_model':    lgb_reg,
        'xgb_model':    xgb_reg,
        'feature_cols': feature_cols,
        'road_mapping': road_mapping,
        'metrics':      metrics,
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
    return 0.6 * p_lgb + 0.4 * p_xgb, p_lgb, p_xgb

predict_delay = predict_surge
