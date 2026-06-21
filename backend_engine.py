import numpy as np
import pandas as pd
import os

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

def haversine_distance(lat1, lon1, lat2, lon2):
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = np.sin(dlat / 2.0)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2.0)**2
    return 2.0 * np.arcsin(np.sqrt(a)) * 6371000.0

def dynamic_column_resolver(df):
    mapping = {}
    cols = df.columns.tolist()

    exclude_lat = ['end', 'resolved', 'endlat']
    lat_cols = [c for c in cols if 'lat' in c.lower() and not any(e in c.lower() for e in exclude_lat)]
    lon_cols = [c for c in cols if ('lon' in c.lower() or 'lng' in c.lower()) and not any(e in c.lower() for e in ['end', 'resolved', 'endlon'])]
    if lat_cols:
        mapping['latitude'] = lat_cols[0]
    if lon_cols:
        mapping['longitude'] = lon_cols[0]

    id_bad = ['created', 'modified', 'client', 'police', 'closed', 'resolved', 'citizen', 'assigned']
    id_cols = [c for c in cols if 'id' in c.lower() and not any(b in c.lower() for b in id_bad)]
    if id_cols:
        id_exact = [c for c in id_cols if c.lower() in ('id', 'fkid')]
        mapping['id'] = id_exact[0] if id_exact else id_cols[0]

    status_exact = [c for c in cols if c.lower() in ('status', 'state', 'event_status')]
    if status_exact:
        mapping['status'] = status_exact[0]
    else:
        status_like = [c for c in cols if 'status' in c.lower() or 'state' in c.lower()]
        if status_like:
            mapping['status'] = status_like[0]

    addr_exact = [c for c in cols if c.lower() in ('address', 'location', 'road_name', 'street')]
    if addr_exact:
        mapping['address'] = addr_exact[0]
    else:
        addr_like = [c for c in cols if 'addr' in c.lower() or 'loc' in c.lower()]
        if addr_like:
            mapping['address'] = addr_like[0]

    for key, default in [('latitude', 'latitude'), ('longitude', 'longitude'),
                          ('id', 'id'), ('status', 'status'), ('address', 'address')]:
        if key not in mapping and default in df.columns:
            mapping[key] = default

    return mapping

def downcast_memory(df):
    for col in df.select_dtypes(include=[np.number]).columns:
        c_min, c_max = df[col].min(), df[col].max()
        col_type = str(df[col].dtype)
        if col_type.startswith('int') or col_type.startswith('bool'):
            for t in [np.int8, np.int16, np.int32, np.int64]:
                if c_min >= np.iinfo(t).min and c_max <= np.iinfo(t).max:
                    df[col] = df[col].astype(t)
                    break
        elif col_type.startswith('float'):
            if c_min >= np.finfo(np.float32).min and c_max <= np.finfo(np.float32).max:
                df[col] = df[col].astype(np.float32)
    return df

def calculate_min_distance(df, target_coords_dict):
    min_dist = pd.Series(np.inf, index=df.index)
    for _, coords in target_coords_dict.items():
        d = haversine_distance(df['latitude'], df['longitude'], coords[0], coords[1])
        min_dist = np.minimum(min_dist, d)
    return min_dist

def preprocess_and_feature_engineer(filepath):
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Dataset path '{filepath}' not found.")

    df = pd.read_csv(filepath)

    col_mapping = dynamic_column_resolver(df)
    std = df.copy().rename(columns={v: k for k, v in col_mapping.items()})

    for col, default in [('latitude', 12.9716), ('longitude', 77.5946)]:
        if col not in std.columns:
            std[col] = default
    if 'id' not in std.columns:
        std['id'] = [f"FKID{i:06d}" for i in range(len(std))]
    for col in ('status', 'address'):
        if col not in std.columns:
            std[col] = 'Unknown'

    std['road_name'] = std['address'].fillna('Unknown').apply(
        lambda x: str(x).split(',')[0].strip()[:60]
    )

    for col in ['event_cause', 'event_type', 'priority', 'status',
                'police_station', 'corridor', 'junction']:
        if col in std.columns:
            std[col] = std[col].fillna('Unknown').astype(str)
        else:
            std[col] = 'Unknown'

    for col in std.select_dtypes(include=[np.number]).columns:
        if col not in ('latitude', 'longitude'):
            med = std[col].median()
            std[col] = std[col].fillna(0.0 if pd.isna(med) else med)

    std['latitude']  = std['latitude'].fillna(12.9716)
    std['longitude'] = std['longitude'].fillna(77.5946)

    def parse_dt(col_name):
        if col_name in std.columns:
            s = pd.to_datetime(std[col_name], errors='coerce')
            if s.dt.tz is not None:
                s = s.dt.tz_convert(None)
            return s
        return pd.Series(pd.NaT, index=std.index)

    std['start_datetime']   = parse_dt('start_datetime').fillna(pd.Timestamp.now())
    std['closed_datetime']  = parse_dt('closed_datetime')
    std['created_date']     = parse_dt('created_date')

    std['hour']         = std['start_datetime'].dt.hour
    std['day_of_week']  = std['start_datetime'].dt.dayofweek
    std['month']        = std['start_datetime'].dt.month
    std['weekend_flag'] = (std['day_of_week'] >= 5).astype(int)

    std['is_rush_hour'] = np.where(
        ((std['hour'] >= 8) & (std['hour'] <= 10)) |
        ((std['hour'] >= 17) & (std['hour'] <= 20)),
        1, 0
    )

    std['hour_sin'] = np.sin(2.0 * np.pi * std['hour'] / 24.0)
    std['hour_cos'] = np.cos(2.0 * np.pi * std['hour'] / 24.0)
    std['dow_sin'] = np.sin(2.0 * np.pi * std['day_of_week'] / 7.0)
    std['dow_cos'] = np.cos(2.0 * np.pi * std['day_of_week'] / 7.0)

    std['lat_node']     = std['latitude'].round(3)
    std['lon_node']     = std['longitude'].round(3)
    std['grid_cell_id'] = "node_" + std['lat_node'].astype(str) + "_" + std['lon_node'].astype(str)

    std['distance_to_metro']        = calculate_min_distance(std, METRO_STATIONS)
    std['distance_to_market']       = calculate_min_distance(std, COMMERCIAL_MARKETS)
    std['distance_to_intersection'] = calculate_min_distance(std, INTERSECTIONS)
    std['distance_to_hub']          = np.minimum(std['distance_to_metro'], std['distance_to_market'])

    std['is_near_intersection'] = np.where(
        (std['distance_to_intersection'] <= 50.0) | (std['junction'] != 'Unknown'),
        1, 0
    )
    std['spillover_multiplier'] = np.where(
        (std['is_rush_hour'] == 1) & (std['distance_to_market'] <= 500.0),
        1.5, 1.0
    )

    road_counts = std['road_name'].value_counts()
    max_freq    = road_counts.max() if not road_counts.empty else 1.0
    std['historical_risk_score'] = std['road_name'].map(road_counts).fillna(1.0) / max_freq

    std['road_cause_key'] = std['road_name'] + "||" + std['event_cause']
    road_cause_counts     = std['road_cause_key'].value_counts()
    max_rc_freq           = road_cause_counts.max() if not road_cause_counts.empty else 1.0
    std['event_recurrence_frequency'] = (
        std['road_cause_key'].map(road_cause_counts).fillna(1.0) / max_rc_freq
    )

    std['time_to_resolution_minutes'] = np.nan
    mask_closed = std['closed_datetime'].notna() & std['start_datetime'].notna()
    diff_mins = (
        std.loc[mask_closed, 'closed_datetime'] -
        std.loc[mask_closed, 'start_datetime']
    ).dt.total_seconds() / 60.0
    diff_mins = diff_mins.clip(lower=0, upper=1440)
    std.loc[mask_closed, 'time_to_resolution_minutes'] = diff_mins

    mean_res_by_cause = std.groupby('event_cause')['time_to_resolution_minutes'].mean()
    std['mean_resolution_by_cause'] = std['event_cause'].map(mean_res_by_cause).fillna(60.0)

    std['time_to_resolution_minutes'] = std['time_to_resolution_minutes'].fillna(
        std['mean_resolution_by_cause']
    ).fillna(60.0)

    std['resolution_delay_ratio'] = (
        std['time_to_resolution_minutes'] /
        std['mean_resolution_by_cause'].replace(0, np.nan).fillna(60.0)
    ).clip(0.1, 10.0)

    std['planned_event_lead_time_hours'] = 0.0
    mask_planned = (std['event_type'] == 'planned') & std['created_date'].notna()
    lead = (
        std.loc[mask_planned, 'start_datetime'] -
        std.loc[mask_planned, 'created_date']
    ).dt.total_seconds() / 3600.0
    std.loc[mask_planned, 'planned_event_lead_time_hours'] = lead.clip(0, 720)

    hour_grid_counts = std.groupby(['hour', 'grid_cell_id'])['id'].transform('count')
    max_hg = hour_grid_counts.max() if hour_grid_counts.max() > 0 else 1.0
    std['multi_incident_overlap_score'] = (hour_grid_counts / max_hg).astype(float)

    hour_density = std['hour'].value_counts(normalize=True)
    std['temporal_density_score'] = std['hour'].map(hour_density).fillna(0.0)

    std['corridor_vulnerability_tier'] = std['corridor'].map(CORRIDOR_VULNERABILITY).fillna(1)

    CAUSE_SEVERITY = {
        'vehicle_breakdown': 3,  'accident': 8, 'water_logging': 6,
        'pot_holes': 2,          'construction': 4, 'congestion': 3,
        'tree_fall': 5,          'road_conditions': 3, 'vip_movement': 9,
        'public_event': 7,       'procession': 7, 'protest': 8,
        'others': 2,             'Unknown': 1
    }
    PRIORITY_WEIGHT = {'High': 2, 'Low': 1, 'Unknown': 1}
    std['cause_severity_score']     = std['event_cause'].map(CAUSE_SEVERITY).fillna(2)
    std['priority_weight']          = std['priority'].map(PRIORITY_WEIGHT).fillna(1)
    std['cause_priority_interaction']= std['cause_severity_score'] * std['priority_weight']

    def compute_impact_scale(row):
        base = CAUSE_SEVERITY.get(str(row['event_cause']).lower(), 2)
        base += 2 if str(row['priority']).lower() == 'high' else 0
        if str(row.get('requires_road_closure', 'false')).lower() == 'true':
            base += 3
        base += row['corridor_vulnerability_tier']
        if row['is_near_intersection'] == 1:
            base += 1.5
        return float(np.clip(base, 1.0, 10.0))

    std['estimated_impact_scale'] = std.apply(compute_impact_scale, axis=1)

    np.random.seed(42)
    impact_factor   = (std['estimated_impact_scale'] ** 1.3) * 4.0
    risk_factor     = std['historical_risk_score'] * 30.0
    rush_factor     = std['is_rush_hour'] * 15.0
    recurrence_f    = std['event_recurrence_frequency'] * 12.0
    overlap_f       = std['multi_incident_overlap_score'] * 10.0
    interaction     = (std['estimated_impact_scale']
                       * std['historical_risk_score']
                       * std['is_rush_hour'] * 1.5)
    resolution_pen  = np.where(std['resolution_delay_ratio'] > 1.5, 5.0, 0.0)
    noise           = np.random.normal(0.0, 3.0, len(std))

    surge = (5.0 + impact_factor + risk_factor + rush_factor
             + recurrence_f + overlap_f + interaction + resolution_pen + noise)
    std['congestion_surge_index'] = np.clip(surge, 5.0, 100.0).astype(float)

    std = downcast_memory(std)
    return std

def generate_mock_data(n_samples=1000):
    np.random.seed(42)
    causes = ['vehicle_breakdown', 'accident', 'pot_holes', 'water_logging',
              'construction', 'others', 'vip_movement', 'public_event', 'protest', 'tree_fall']
    probs  = [0.40, 0.14, 0.09, 0.08, 0.08, 0.06, 0.05, 0.04, 0.03, 0.03]
    event_causes = np.random.choice(causes, n_samples, p=probs)
    planned_set  = {'construction', 'public_event', 'vip_movement', 'protest'}
    event_types  = np.where(np.isin(event_causes, list(planned_set)), 'planned', 'unplanned')

    start_dates = pd.date_range(start='2026-05-01', end='2026-06-21', freq='h')
    datetimes   = np.random.choice(start_dates, n_samples)

    streets = ['MG Road', 'Indiranagar 100ft Rd', 'Hosur Road', 'ORR Marathahalli',
               'Whitefield Main Rd', 'Bannerghatta Rd', 'Richmond Road', 'Brigade Road',
               'Bellary Road', 'Mysore Road', 'Tumkur Road', 'Old Airport Road']
    addresses = [f"{np.random.choice(streets)}, Bangalore, Karnataka, India" for _ in range(n_samples)]

    close_offsets = np.random.randint(20, 240, n_samples)
    closed_mask   = np.random.random(n_samples) < 0.70
    closed_dts    = [
        pd.Timestamp(datetimes[i]) + pd.Timedelta(minutes=int(close_offsets[i]))
        if closed_mask[i] else np.nan
        for i in range(n_samples)
    ]

    df = pd.DataFrame({
        'id': [f"FKID{i:06d}" for i in range(n_samples)],
        'event_type': event_types,
        'latitude': np.random.normal(12.97, 0.05, n_samples),
        'longitude': np.random.normal(77.59, 0.05, n_samples),
        'address': addresses,
        'event_cause': event_causes,
        'requires_road_closure': np.random.choice([True, False], n_samples, p=[0.08, 0.92]),
        'start_datetime': datetimes,
        'closed_datetime': closed_dts,
        'created_date': [
            pd.Timestamp(datetimes[i]) - pd.Timedelta(hours=np.random.randint(1, 48))
            for i in range(n_samples)
        ],
        'priority': np.random.choice(['High', 'Low'], n_samples, p=[0.6, 0.4]),
        'status': np.random.choice(['closed', 'active', 'resolved'], n_samples, p=[0.8, 0.15, 0.05]),
        'corridor': np.random.choice(
            ['Non-corridor', 'Mysore Road', 'Bellary Road 1', 'Tumkur Road', 'ORR East 1', 'Hosur Road'],
            n_samples
        ),
        'police_station': np.random.choice(
            ['Yelahanka', 'HAL Old Airport', 'Sadashivanagar', 'Halasuru Gate', 'Yeshwanthpura'],
            n_samples
        ),
        'junction': np.random.choice(
            ['Unknown', 'UrvashiJunction', 'LalbaghMainGateJunc', 'QueensStatueCircle', 'SilkBoardJunc'],
            n_samples, p=[0.85, 0.04, 0.04, 0.04, 0.03]
        )
    })
    path = "mock_astram_event_data.csv"
    df.to_csv(path, index=False)
    return path

if __name__ == '__main__':
    fp = ("Astram event data_anonymized.csv.csv"
          if os.path.exists("Astram event data_anonymized.csv.csv")
          else generate_mock_data())
    df = preprocess_and_feature_engineer(fp)
    print(f"Shape: {df.shape}")
    new_feats = [
        'event_recurrence_frequency', 'time_to_resolution_minutes',
        'resolution_delay_ratio', 'planned_event_lead_time_hours',
        'multi_incident_overlap_score', 'temporal_density_score',
        'corridor_vulnerability_tier', 'cause_priority_interaction',
        'weekend_flag', 'congestion_surge_index'
    ]
    print(df[new_feats].describe())
