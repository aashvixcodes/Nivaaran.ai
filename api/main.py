import os
import sys
import pickle
import math
from datetime import datetime
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

# Add parent directory to sys.path so we can import from workspace root if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

app = FastAPI(title="Nivaaran.ai API", version="2.0")

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PKL_PATH = os.path.join(ROOT_DIR, "model_payload.pkl")
CSV_PATH = os.path.join(ROOT_DIR, "processed_parking_congestion_data.csv")

# Global variables to cache model and dataset
model_payload = None
df_all = None

def load_resources():
    global model_payload, df_all
    if not os.path.exists(PKL_PATH):
        raise FileNotFoundError(f"Model payload pickle not found at {PKL_PATH}")
    with open(PKL_PATH, "rb") as f:
        model_payload = pickle.load(f)
    
    if os.path.exists(CSV_PATH):
        df_all = pd.read_csv(CSV_PATH)
        df_all['start_datetime'] = pd.to_datetime(df_all['start_datetime'])
    else:
        raise FileNotFoundError(f"Processed CSV not found at {CSV_PATH}")

try:
    load_resources()
except Exception as e:
    print(f"Error loading model resources: {e}")

# Constants
METRO_STATIONS = {
    "Majestic":       (12.9756, 77.5729),
    "Indiranagar":    (12.9783, 77.6413),
    "MG Road":        (12.9754, 77.6067),
    "Jayanagar":      (12.9287, 77.5833),
    "Yeshwanthpur":   (13.0240, 77.5499),
    "Rajajinagar":    (12.9929, 77.5479),
    "Nagasandra":     (13.0324, 77.5148),
    "Baiyappanahalli":(12.9985, 77.6483)
}

COMMERCIAL_MARKETS = {
    "Commercial Street":      (12.9822, 77.6084),
    "Brigade Road":           (12.9739, 77.6074),
    "KR Market":              (12.9647, 77.5768),
    "Phoenix Marketcity":     (12.9959, 77.6963),
    "Forum Mall Koramangala": (12.9344, 77.6113),
    "Mantri Mall Malleshwaram":(13.0025, 77.5695),
    "Garuda Mall MG Road":    (12.9717, 77.6099),
    "ECity Town Centre":      (12.8447, 77.6601)
}

INTERSECTIONS = {
    "Silk Board":          (12.9187, 77.6215),
    "Hebbal Flyover":      (13.0419, 77.5947),
    "Urvashi Junction":    (12.9556, 77.5857),
    "Lalbagh Main Gate":   (12.9540, 77.5852),
    "Ibblur Junction":     (12.9200, 77.6656),
    "Town Hall Junction":  (12.9640, 77.5830),
    "KR Circle":           (12.9747, 77.5937),
    "Marathahalli Bridge": (12.9570, 77.6963),
    "Tin Factory":         (13.0053, 77.6521),
    "Mekhri Circle":       (13.0067, 77.5843)
}

CORRIDOR_VULNERABILITY = {
    "Mysore Road":       3,
    "Bellary Road 1":    3,
    "Bellary Road 2":    3,
    "Hosur Road":        3,
    "Tumkur Road":       2,
    "Old Madras Road":   2,
    "ORR East 1":        3,
    "ORR East 2":        3,
    "ORR North 1":       2,
    "ORR North 2":       2,
    "Magadi Road":       2,
    "Non-corridor":      1,
    "Unknown":           1
}

CAUSE_SEV = {
    'vehicle_breakdown': 3, 'accident': 8, 'water_logging': 6, 'pot_holes': 2,
    'construction': 4, 'congestion': 3, 'tree_fall': 5, 'road_conditions': 3,
    'vip_movement': 9, 'public_event': 7, 'procession': 7, 'protest': 8,
    'others': 2, 'Unknown': 1
}

def api_haversine(lat1, lon1, lat2, lon2):
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2.0)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2.0)**2
    return 2.0 * math.asin(math.sqrt(a)) * 6371000.0

from dispatch_solver import solve_dispatch
from regression_models import prepare_features, ResidualMLP
from hotspot_clustering import fit_hotspots, get_hotspot_summary
import torch

class PredictRequest(BaseModel):
    road_name: str
    latitude: float
    longitude: float
    event_type: str
    event_cause: str
    priority: str
    status: str
    corridor: str
    estimated_impact_scale: float
    requires_road_closure: bool
    start_time: str
    day_of_week: str
    planned_event_lead_time_hours: float = 0.0

class AnalyticsFilterRequest(BaseModel):
    causes: Optional[List[str]] = []
    types: Optional[List[str]] = []
    priorities: Optional[List[str]] = []
    hour_lo: int = 0
    hour_hi: int = 23
    eps_m: float = 100.0
    min_samp: int = 3

@app.get("/metadata")
def get_metadata():
    if df_all is None:
        raise HTTPException(status_code=503, detail="Dataset not loaded")
    
    roads = sorted(df_all['road_name'].dropna().unique().tolist())
    causes = sorted(df_all['event_cause'].dropna().unique().tolist())
    corridors = sorted(list(CORRIDOR_VULNERABILITY.keys()))
    police_stations = sorted(df_all['police_station'].dropna().unique().tolist())
    
    road_coords = {}
    for r in roads:
        r_df = df_all[df_all['road_name'] == r]
        road_coords[r] = {
            "latitude": float(r_df['latitude'].mean()),
            "longitude": float(r_df['longitude'].mean()),
            "corridor": str(r_df['corridor'].iloc[0]) if not r_df.empty and 'corridor' in r_df.columns else "Non-corridor",
            "police_station": str(r_df['police_station'].iloc[0]) if not r_df.empty and 'police_station' in r_df.columns else "Unknown"
        }

    return {
        "roads": roads,
        "road_coords": road_coords,
        "causes": causes,
        "corridors": corridors,
        "police_stations": police_stations
    }

@app.post("/predict")
def predict_endpoint(req: PredictRequest):
    if model_payload is None or df_all is None:
        raise HTTPException(status_code=503, detail="Models or dataset not loaded")
    
    try:
        try:
            t = datetime.strptime(req.start_time, "%H:%M")
        except ValueError:
            try:
                t = datetime.strptime(req.start_time.split("T")[-1][:5], "%H:%M")
            except Exception:
                t = datetime.now()

        hour = t.hour
        days_map = {
            "Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3,
            "Friday": 4, "Saturday": 5, "Sunday": 6
        }
        dow = days_map.get(req.day_of_week, datetime.now().weekday())
        rush = 1 if (8 <= hour <= 10 or 17 <= hour <= 20) else 0
        wknd = 1 if dow >= 5 else 0

        dm = min(api_haversine(req.latitude, req.longitude, v[0], v[1]) for v in METRO_STATIONS.values())
        dk = min(api_haversine(req.latitude, req.longitude, v[0], v[1]) for v in COMMERCIAL_MARKETS.values())
        di = min(api_haversine(req.latitude, req.longitude, v[0], v[1]) for v in INTERSECTIONS.values())
        dhub = min(dm, dk)
        near_isect = 1 if di <= 50.0 else 0
        spill = 1.5 if rush and dk <= 500 else 1.0
        corr_tier = CORRIDOR_VULNERABILITY.get(req.corridor, 1)

        road_rows = df_all[df_all['road_name'] == req.road_name]
        hist_risk = float(road_rows['historical_risk_score'].mean()) if not road_rows.empty else 0.05
        hist_risk = 0.05 if pd.isna(hist_risk) else hist_risk

        rec_freq_s = road_rows[road_rows['event_cause'] == req.event_cause]['event_recurrence_frequency'] if not road_rows.empty else pd.Series()
        rec_freq = float(rec_freq_s.mean()) if not rec_freq_s.empty else 0.05
        rec_freq = 0.05 if pd.isna(rec_freq) else rec_freq

        mean_res_s = df_all[df_all['event_cause'] == req.event_cause]['mean_resolution_by_cause']
        mean_res_c = float(mean_res_s.mean()) if not mean_res_s.empty else 60.0
        mean_res_c = 60.0 if pd.isna(mean_res_c) else mean_res_c

        actual_res_s = road_rows[road_rows['event_cause'] == req.event_cause]['time_to_resolution_minutes'] if not road_rows.empty else pd.Series()
        actual_res = float(actual_res_s.mean()) if not actual_res_s.empty else mean_res_c
        actual_res = mean_res_c if pd.isna(actual_res) else actual_res
        res_ratio = round(actual_res / mean_res_c, 3) if mean_res_c > 0 else 1.0

        hour_density = float(df_all[df_all['hour'] == hour].shape[0] / max(len(df_all), 1))

        csev = CAUSE_SEV.get(req.event_cause, 2)
        pwt = 2 if req.priority == "High" else 1
        cpi = csev * pwt

        road_mean_surge = float(road_rows['congestion_surge_index'].mean()) if not road_rows.empty else 50.0
        road_mean_surge = 50.0 if pd.isna(road_mean_surge) else road_mean_surge

        row_dict = {
            'road_name': req.road_name, 'police_station': 'Unknown',
            'hour': hour, 'day_of_week': dow, 'month': datetime.now().month,
            'is_rush_hour': rush, 'weekend_flag': wknd,
            'hour_sin': math.sin(2*math.pi*hour/24), 'hour_cos': math.cos(2*math.pi*hour/24),
            'dow_sin':  math.sin(2*math.pi*dow/7),   'dow_cos':  math.cos(2*math.pi*dow/7),
            'distance_to_metro': dm, 'distance_to_market': dk,
            'distance_to_intersection': di, 'distance_to_hub': dhub,
            'is_near_intersection': near_isect, 'spillover_multiplier': spill,
            'historical_risk_score': hist_risk,
            'event_recurrence_frequency': rec_freq,
            'time_to_resolution_minutes': actual_res,
            'mean_resolution_by_cause': mean_res_c,
            'resolution_delay_ratio': res_ratio,
            'planned_event_lead_time_hours': req.planned_event_lead_time_hours,
            'multi_incident_overlap_score': hour_density * 3,
            'temporal_density_score': hour_density,
            'corridor_vulnerability_tier': corr_tier,
            'cause_severity_score': csev,
            'priority_weight': pwt,
            'cause_priority_interaction': cpi,
            'estimated_impact_scale': req.estimated_impact_scale,
            'event_cause': req.event_cause, 'event_type': req.event_type,
            'priority': req.priority, 'status': req.status, 'corridor': req.corridor,
            'congestion_surge_index': road_mean_surge,
        }

        df_input = pd.DataFrame([row_dict])
        
        d_feat, _, _ = prepare_features(df_input, is_train=False, road_name_mapping=model_payload['road_mapping'])
        feature_cols = model_payload['feature_cols']
        
        for col in feature_cols:
            if col not in d_feat.columns:
                d_feat[col] = 0.0
                
        X = d_feat[feature_cols]

        lgb_model = model_payload['lgb_model']
        xgb_model = model_payload['xgb_model']
        
        p_lgb = float(np.clip(lgb_model.predict(X)[0], 5.0, 100.0))
        p_xgb = float(np.clip(xgb_model.predict(X)[0], 5.0, 100.0))

        # PyTorch Deep Learning (ResidualMLP) inference
        p_pytorch = 0.0
        has_pytorch = ('pytorch_model_state' in model_payload and
                       model_payload['pytorch_model_state'] is not None and
                       'pytorch_scaler' in model_payload and
                       model_payload['pytorch_scaler'] is not None)

        if has_pytorch:
            try:
                pytorch_scaler = model_payload['pytorch_scaler']
                X_scaled = pytorch_scaler.transform(X)
                X_tensor = torch.tensor(X_scaled, dtype=torch.float32)

                input_dim = X.shape[1]
                dl_model = ResidualMLP(input_dim, hidden_dim=128, n_blocks=3, dropout=0.15)
                dl_model.load_state_dict(model_payload['pytorch_model_state'])
                dl_model.eval()
                with torch.no_grad():
                    p_pytorch = float(np.clip(dl_model(X_tensor).numpy().flatten()[0] * 100.0, 5.0, 100.0))

                # 3-Model Ensemble: 50% LightGBM + 30% XGBoost + 20% PyTorch
                surge = 0.5 * p_lgb + 0.3 * p_xgb + 0.2 * p_pytorch
            except Exception as e:
                print(f"[WARN] PyTorch inference failed, falling back to 2-model ensemble: {e}")
                surge = 0.6 * p_lgb + 0.4 * p_xgb
        else:
            surge = 0.6 * p_lgb + 0.4 * p_xgb

        dispatch = solve_dispatch(
            surge,
            location_name=req.road_name,
            cause=req.event_cause,
            resolution_delay_ratio=res_ratio,
            is_near_intersection=near_isect,
            corridor_tier=corr_tier,
            is_rush_hour=rush
        )

        return {
            "prediction": {
                "ensemble": float(round(surge, 2)),
                "lightgbm": float(round(p_lgb, 2)),
                "xgboost": float(round(p_xgb, 2)),
                "pytorch": float(round(p_pytorch, 2))
            },
            "dispatch": dispatch
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/analytics-data")
def get_analytics_data(filters: AnalyticsFilterRequest):
    if df_all is None:
        raise HTTPException(status_code=503, detail="Dataset not loaded")
    
    # 1. Apply Sidebar Filters
    df = df_all.copy()
    
    if filters.causes:
        df = df[df['event_cause'].isin(filters.causes)]
    if filters.types:
        df = df[df['event_type'].isin(filters.types)]
    if filters.priorities:
        df = df[df['priority'].isin(filters.priorities)]
        
    df = df[(df['hour'] >= filters.hour_lo) & (df['hour'] <= filters.hour_hi)]
    
    if df.empty:
        return {
            "summary": {"total_incidents": 0, "average_surge": 0, "high_priority_pct": 0, "hotspots_count": 0},
            "by_cause": [], "by_hour": [], "by_corridor": [], "top_roads": [],
            "incidents": [], "hotspots": [], "insights": {}
        }
        
    # 2. Fit Hotspots via DBSCAN
    df_clustered = fit_hotspots(df, eps_meters=filters.eps_m, min_samples=filters.min_samp)
    hs = get_hotspot_summary(df_clustered)
    
    # 3. Overview KPIs
    total_incidents = len(df)
    avg_surge = float(df['congestion_surge_index'].mean())
    high_priority_pct = float((df['priority'] == 'High').sum() / total_incidents * 100) if total_incidents > 0 else 0
    hotspots_count = len(hs)
    
    # Overview charts
    cause_counts = df['event_cause'].value_counts().to_dict()
    hour_counts = df['hour'].value_counts().sort_index().to_dict()
    corridor_counts = df['corridor'].value_counts().to_dict()
    
    top_roads_grouped = df.groupby('road_name')['congestion_surge_index'].mean().sort_values(ascending=False).head(10).to_dict()
    
    # 4. Map Incidents & Hotspots lists
    incidents_list = []
    # Sample down active map incidents if too large, to keep client rendering lightning-fast
    df_map_sample = df_clustered.sample(min(800, len(df_clustered)), random_state=42)
    for _, row in df_map_sample.iterrows():
        incidents_list.append({
            "id": str(row['id']),
            "road_name": str(row['road_name']),
            "latitude": float(row['latitude']),
            "longitude": float(row['longitude']),
            "congestion_surge_index": float(row['congestion_surge_index']),
            "event_cause": str(row['event_cause']),
            "event_type": str(row['event_type']),
            "priority": str(row['priority']),
            "historical_risk_score": float(row.get('historical_risk_score', 0.05)),
            "time_to_resolution_minutes": float(row.get('time_to_resolution_minutes', 60.0)),
            "event_recurrence_frequency": float(row.get('event_recurrence_frequency', 0.05)),
            "corridor_vulnerability_tier": int(row.get('corridor_vulnerability_tier', 1)),
            "hotspot_id": int(row['hotspot_id'])
        })
        
    hotspots_list = []
    for _, row in hs.iterrows():
        hotspots_list.append({
            "hotspot_id": int(row['hotspot_id']),
            "centroid_latitude": float(row['centroid_latitude']),
            "centroid_longitude": float(row['centroid_longitude']),
            "incident_count": int(row['incident_count']),
            "mean_surge_index": float(row['mean_surge_index']),
            "total_surge_index": float(row['total_surge_index'])
        })

    # 5. Insights Metrics
    # Risk roads
    top_risk = df.groupby('road_name')['historical_risk_score'].first().sort_values(ascending=False).head(15)
    top_risk_list = [{"road_name": k, "risk_score": float(v)} for k, v in top_risk.items()]

    # Recurrence
    top_rec = df.groupby('road_cause_key')['event_recurrence_frequency'].first().sort_values(ascending=False).head(15)
    top_rec_list = []
    for k, v in top_rec.items():
        parts = k.split("||")
        top_rec_list.append({
            "road_name": parts[0],
            "cause": parts[1] if len(parts) > 1 else "Unknown",
            "recurrence_frequency": float(v)
        })

    # Spatial Overlap
    overlap_sample = df.sample(min(500, len(df)), random_state=42)
    overlap_list = []
    for _, r in overlap_sample.iterrows():
        overlap_list.append({
            "overlap_score": float(r.get('multi_incident_overlap_score', 0)),
            "surge_index": float(r['congestion_surge_index']),
            "corridor_tier": int(r.get('corridor_vulnerability_tier', 1))
        })

    # Resolution by cause (mean, median, p75, max)
    res_stats = []
    valid_res = df[df['time_to_resolution_minutes'] > 0]
    for cause in valid_res['event_cause'].unique():
        c_df = valid_res[valid_res['event_cause'] == cause]['time_to_resolution_minutes']
        if not c_df.empty:
            res_stats.append({
                "cause": cause,
                "mean": float(c_df.mean()),
                "median": float(c_df.median()),
                "p75": float(c_df.quantile(0.75)),
                "max": float(c_df.max())
            })

    # Corridor vulnerability vs surge
    corr_stats = df.groupby('corridor').agg(
        tier=('corridor_vulnerability_tier', 'first'),
        mean_surge=('congestion_surge_index', 'mean'),
        incidents=('id', 'count')
    ).reset_index()
    corr_list = []
    for _, r in corr_stats.iterrows():
        corr_list.append({
            "corridor": str(r['corridor']),
            "tier": int(r['tier']),
            "mean_surge": float(r['mean_surge']),
            "incidents": int(r['incidents'])
        })

    # Planned Event Lead Time Distribution
    planned = df[df['event_type'] == 'planned']
    planned_lead_times = planned[planned['planned_event_lead_time_hours'] > 0]['planned_event_lead_time_hours'].tolist() if not planned.empty else []
    avg_lead_time = float(planned['planned_event_lead_time_hours'].mean()) if not planned.empty else 0.0

    # Planned vs Unplanned comparison
    comp_stats = df.groupby('event_type').agg(
        mean_surge=('congestion_surge_index', 'mean'),
        mean_resolution=('time_to_resolution_minutes', 'mean'),
        incidents=('id', 'count')
    ).reset_index()
    comp_list = []
    for _, r in comp_stats.iterrows():
        comp_list.append({
            "event_type": str(r['event_type']),
            "mean_surge": float(r['mean_surge']),
            "mean_resolution": float(r['mean_resolution']),
            "incidents": int(r['incidents'])
        })

    return {
        "summary": {
            "total_incidents": total_incidents,
            "average_surge": round(avg_surge, 1),
            "high_priority_pct": round(high_priority_pct, 1),
            "hotspots_count": hotspots_count
        },
        "by_cause": [{"name": k, "value": int(v)} for k, v in cause_counts.items()],
        "by_hour": [{"hour": int(k), "count": int(v)} for k, v in hour_counts.items()],
        "by_corridor": [{"name": k, "value": int(v)} for k, v in corridor_counts.items()],
        "top_roads": [{"name": k, "surge": float(round(v, 1))} for k, v in top_roads_grouped.items()],
        "incidents": incidents_list,
        "hotspots": hotspots_list,
        "insights": {
            "top_risk_roads": top_risk_list,
            "top_recurrence": top_rec_list,
            "spatial_overlap": overlap_list,
            "resolution_by_cause": res_stats,
            "corridor_vulnerability_surge": corr_list,
            "planned_lead_times": planned_lead_times[:1000],  # cap list for transport speed
            "avg_lead_time": round(avg_lead_time, 1),
            "planned_vs_unplanned": comp_list
        }
    }

@app.get("/model-metrics")
def get_model_metrics():
    if model_payload is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    lgb_model = model_payload['lgb_model']
    feature_cols = model_payload['feature_cols']
    importances = lgb_model.feature_importances_
    
    feat_imp = []
    for col, imp in zip(feature_cols, importances):
        feat_imp.append({"feature": col, "importance": float(imp)})
    
    feat_imp = sorted(feat_imp, key=lambda x: x['importance'], reverse=True)[:20]

    # Resolve dynamic column names
    from backend_engine import dynamic_column_resolver
    raw_csv = os.path.join(ROOT_DIR, "Astram event data_anonymized.csv.csv")
    resolved = {}
    if os.path.exists(raw_csv):
        try:
            raw_df = pd.read_csv(raw_csv, nrows=1)
            resolved = dynamic_column_resolver(raw_df)
        except Exception:
            pass
            
    if not resolved:
        resolved = {
            "latitude": "latitude",
            "longitude": "longitude",
            "id": "id",
            "status": "status",
            "address": "address"
        }

    return {
        "metrics": model_payload['metrics'],
        "feature_importances": feat_imp,
        "feature_cols": feature_cols,
        "resolved_columns": resolved
    }

if __name__ == '__main__':
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
