import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN

def fit_hotspots(df, eps_meters=100.0, min_samples=3):
    df_clust = df.copy()
    coords_rad = np.radians(df_clust[['latitude', 'longitude']].values)
    eps_rad = eps_meters / 6371000.0
    
    db = DBSCAN(eps=eps_rad, min_samples=min_samples, metric='haversine')
    df_clust['hotspot_id'] = db.fit_predict(coords_rad)
    return df_clust

def get_hotspot_summary(df):
    hotspots = df[df['hotspot_id'] != -1]
    if hotspots.empty:
        return pd.DataFrame(columns=['hotspot_id', 'centroid_latitude', 'centroid_longitude', 'incident_count', 'mean_surge_index', 'total_surge_index'])
        
    summary = hotspots.groupby('hotspot_id').agg(
        centroid_latitude=('latitude', 'mean'),
        centroid_longitude=('longitude', 'mean'),
        incident_count=('id', 'count'),
        mean_surge_index=('congestion_surge_index', 'mean'),
        total_surge_index=('congestion_surge_index', 'sum')
    ).reset_index()
    
    return summary
