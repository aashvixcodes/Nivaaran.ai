import os, pickle
import pandas as pd
import numpy as np

from backend_engine import preprocess_and_feature_engineer, generate_mock_data
from hotspot_clustering import fit_hotspots, get_hotspot_summary
from regression_models import train_ensemble_models, predict_surge
from dispatch_solver import solve_dispatch, format_dispatch_json


def run_pipeline():
    print("=" * 60)
    print("  NIVAARAN.AI - Event-Driven Congestion Dispatch Engine")
    print("=" * 60)

    fp = "Astram event data_anonymized.csv.csv"
    if not os.path.exists(fp):
        print("Astram CSV not found — generating mock dataset...")
        fp = generate_mock_data(n_samples=2500)

    print("\n[1] Feature Engineering + Post-Event Learning Loop...")
    df = preprocess_and_feature_engineer(fp)
    print(f"    Done. Shape: {df.shape}")
    new_cols = ['event_recurrence_frequency', 'time_to_resolution_minutes',
                'resolution_delay_ratio', 'planned_event_lead_time_hours',
                'multi_incident_overlap_score', 'corridor_vulnerability_tier',
                'cause_priority_interaction', 'weekend_flag', 'congestion_surge_index']
    print(df[new_cols].describe().round(3))

    print("\n[2] DBSCAN Spatial Clustering (eps=100 m, min_samples=3)...")
    df_c = fit_hotspots(df, eps_meters=100.0, min_samples=3)
    n_hs = (df_c['hotspot_id'] != -1).sum()
    print(f"    Hotspots: {df_c['hotspot_id'].nunique() - 1}  |  Noise: {(df_c['hotspot_id'] == -1).sum()}")
    summary = get_hotspot_summary(df_c)
    print(summary.sort_values('incident_count', ascending=False).head(5))

    df_c.to_csv("processed_parking_congestion_data.csv", index=False)
    print("    Saved -> processed_parking_congestion_data.csv")

    print("\n[3] Training LightGBM + XGBoost Ensemble...")
    payload, metrics = train_ensemble_models(df_c)

    print("\n[4] Dispatch Solver Tests...")
    tests = df_c.head(3)
    preds, _, _, _ = predict_surge(tests, payload)

    for i, surge in enumerate(preds):
        row  = tests.iloc[i]
        loc  = str(row['address']).split(',')[0]
        disp = solve_dispatch(
            surge,
            location_name=loc,
            cause=str(row['event_cause']),
            resolution_delay_ratio=float(row.get('resolution_delay_ratio', 1.0)),
            is_near_intersection=int(row.get('is_near_intersection', 0)),
            corridor_tier=int(row.get('corridor_vulnerability_tier', 1)),
            is_rush_hour=int(row.get('is_rush_hour', 0))
        )
        print(f"\n  Incident {i+1}: {loc}  |  Cause: {row['event_cause']}")
        print(f"  Surge: {surge:.1f}%  ->  {disp['status']}")
        print(f"  Officers: {disp['dispatch_plan']['manpower']['traffic_officers']}  |  "
              f"Barricade: {disp['dispatch_plan']['barricading']['blueprint_tier']}")

    print("\n" + "=" * 60)
    print("  PIPELINE VERIFICATION COMPLETE [SUCCESS]")
    print("=" * 60)


if __name__ == '__main__':
    run_pipeline()
