import streamlit as st
import pandas as pd
import numpy as np
import os, pickle, json
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import pydeck as pdk
from datetime import datetime

from backend_engine import (preprocess_and_feature_engineer, generate_mock_data,
                             haversine_distance, METRO_STATIONS, COMMERCIAL_MARKETS,
                             INTERSECTIONS, CORRIDOR_VULNERABILITY)
from hotspot_clustering import fit_hotspots, get_hotspot_summary
from regression_models import predict_surge
from dispatch_solver import solve_dispatch

# ── Page Config ────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Nivaaran.ai — Congestion Dispatch Engine",
    page_icon="🛑",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ── Global CSS ─────────────────────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap');

html, body, [class*="css"] { font-family: 'Outfit', sans-serif; }

.brand-wrap   { display:flex; align-items:center; gap:16px; margin-bottom:6px; }
.brand-logo   { font-size:2.6rem; }
.brand-title  { font-size:2.8rem; font-weight:900;
                background:linear-gradient(135deg,#FF4B4B 0%,#FF9054 40%,#FFD166 100%);
                -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.brand-sub    { font-size:1.05rem; color:#8B949E; margin-bottom:28px; letter-spacing:0.3px; }
.brand-badge  { display:inline-block; padding:3px 10px; border-radius:50px; font-size:0.72rem;
                font-weight:700; letter-spacing:1.5px; text-transform:uppercase;
                background:rgba(255,75,75,0.15); color:#FF4B4B;
                border:1px solid rgba(255,75,75,0.4); margin-left:8px; vertical-align:middle; }

.kpi          { background:#0D1117; border:1px solid #21262D; border-radius:16px;
                padding:22px 20px; text-align:center; transition:all .25s;
                box-shadow:0 4px 16px rgba(0,0,0,.4); }
.kpi:hover    { border-color:#FF4B4B; transform:translateY(-4px);
                box-shadow:0 8px 24px rgba(255,75,75,.18); }
.kpi-val      { font-size:2.5rem; font-weight:800; margin:4px 0; }
.kpi-val-red  { background:linear-gradient(90deg,#FF4B4B,#FF9054);
                -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.kpi-val-grn  { background:linear-gradient(90deg,#00CC99,#00E5B3);
                -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.kpi-val-ylw  { background:linear-gradient(90deg,#FFAB00,#FFD166);
                -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.kpi-val-blu  { background:linear-gradient(90deg,#4D9FFF,#80C3FF);
                -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.kpi-lbl      { font-size:.78rem; font-weight:700; color:#6E7681;
                text-transform:uppercase; letter-spacing:1.4px; }
.kpi-hint     { font-size:.72rem; color:#484F58; margin-top:4px; }

.badge { display:inline-block; padding:6px 16px; border-radius:50px;
         font-weight:800; font-size:.85rem; letter-spacing:1px; text-transform:uppercase; }
.badge-critical { background:rgba(255,75,75,.12); color:#FF4B4B;
                  border:2px solid #FF4B4B; box-shadow:0 0 18px rgba(255,75,75,.25); }
.badge-warning  { background:rgba(255,171,0,.12); color:#FFAB00;
                  border:2px solid #FFAB00; box-shadow:0 0 18px rgba(255,171,0,.25); }
.badge-normal   { background:rgba(0,204,153,.12); color:#00CC99;
                  border:2px solid #00CC99; box-shadow:0 0 18px rgba(0,204,153,.25); }

.dispatch-card { background:#0D1117; border:1px solid #21262D; border-radius:14px;
                 padding:20px; margin:8px 0; }
.dispatch-section { font-size:.82rem; font-weight:700; color:#6E7681;
                    text-transform:uppercase; letter-spacing:1.2px; margin-bottom:10px; }
.directive-item { display:flex; align-items:flex-start; gap:8px;
                  padding:7px 0; border-bottom:1px solid #161B22; font-size:.9rem; }
.vms-box { font-family:'JetBrains Mono',monospace; background:#0D1117; color:#00E5B3;
           border:1px solid #00CC99; border-radius:10px; padding:14px 18px;
           font-size:.9rem; font-weight:700; letter-spacing:.5px; margin-top:8px; }
.modifier-note { background:rgba(255,171,0,.08); border-left:3px solid #FFAB00;
                 padding:8px 12px; border-radius:0 8px 8px 0; margin:5px 0;
                 font-size:.85rem; color:#FFAB00; }
.stat-row { display:flex; justify-content:space-between; align-items:center;
            padding:8px 0; border-bottom:1px solid #161B22; }
.stat-key { font-size:.82rem; color:#6E7681; }
.stat-val { font-size:.88rem; font-weight:700; color:#CDD9E5; }

.stTabs [data-baseweb="tab-list"] { gap:8px; }
.stTabs [data-baseweb="tab"]      { border-radius:8px; padding:8px 20px;
                                    background:#0D1117; border:1px solid #21262D; }

section[data-testid="stSidebar"] { background:#010409; border-right:1px solid #21262D; }

@media (max-width: 768px) {
  [data-testid="column"] {
    width: 100% !important;
    flex: 1 1 100% !important;
    min-width: 100% !important;
    margin-bottom: 16px;
  }
  .brand-title { font-size: 1.8rem !important; }
  .brand-logo { font-size: 1.8rem !important; }
  .brand-sub { font-size: 0.9rem !important; margin-bottom: 16px !important; }
  .kpi { padding: 16px 12px !important; }
  .kpi-val { font-size: 1.8rem !important; }
  .kpi-lbl { font-size: 0.7rem !important; letter-spacing: 0.8px !important; }
}
</style>
"""+f"", unsafe_allow_html=True)

# ── File paths ──────────────────────────────────────────────────────────────
RAW    = "Astram event data_anonymized.csv.csv"
PKL    = "model_payload.pkl"
PROC   = "processed_parking_congestion_data.csv"

if not os.path.exists(RAW):
    st.info("Raw dataset not found — generating mock dataset...")
    RAW = generate_mock_data(n_samples=2500)

if not os.path.exists(PKL) or not os.path.exists(PROC):
    with st.spinner("Nivaaran.ai is initialising — training models..."):
        from test_pipeline import run_pipeline
        run_pipeline()

@st.cache_data
def load_data():
    df = pd.read_csv(PROC)
    df['start_datetime'] = pd.to_datetime(df['start_datetime'])
    return df

@st.cache_resource
def load_model():
    with open(PKL, 'rb') as f:
        return pickle.load(f)

df_all = load_data()
model  = load_model()
stored_metrics = model.get('metrics', {})

# ── Sidebar ─────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("""
    <div style='text-align:center; padding:12px 0 20px'>
      <div style='font-size:2.2rem'>🛑</div>
      <div style='font-size:1.3rem; font-weight:900; color:#FF4B4B;'>Nivaaran.ai</div>
      <div style='font-size:.7rem; color:#484F58; letter-spacing:2px;'>CONGESTION INTELLIGENCE</div>
    </div>
    """, unsafe_allow_html=True)

    nav = st.radio("Navigation", [
        "📊 Traffic Overview",
        "🗺️ Congestion Map",
        "🔬 Traffic Insights",
        "🚨 Live Resource Dispatcher",
        "⚙️ AI Model Metrics"
    ], label_visibility="collapsed")

    st.markdown("---")
    st.markdown("**Temporal Filters**")
    hour_range = st.slider("Hour window", 0, 23, (0, 23))
    
    st.markdown("**Event Filters**")
    all_causes = sorted(df_all['event_cause'].dropna().unique().tolist())
    sel_causes = st.multiselect("Incident causes", all_causes, default=all_causes)
    
    sel_type = st.multiselect("Event type", ["planned", "unplanned"],
                              default=["planned", "unplanned"])
    sel_pri  = st.multiselect("Priority", ["High", "Low"], default=["High", "Low"])

    st.markdown("---")
    st.markdown("**DBSCAN Clustering**")
    eps_m      = st.slider("Cluster radius (m)", 50, 300, 100, 10)
    min_samp   = st.slider("Min cluster size",   2, 10,  3)

# ── Filtered data ────────────────────────────────────────────────────────────
@st.cache_data
def filtered_clustered(causes, types, priorities, h_lo, h_hi, eps, msamp):
    mask = (
        df_all['event_cause'].isin(causes) &
        df_all['event_type'].isin(types) &
        df_all['priority'].isin(priorities) &
        (df_all['hour'] >= h_lo) & (df_all['hour'] <= h_hi)
    )
    d = df_all[mask].copy()
    if d.empty:
        return d, pd.DataFrame()
    d   = fit_hotspots(d, eps_meters=eps, min_samples=msamp)
    hs  = get_hotspot_summary(d)
    return d, hs

df, hs = filtered_clustered(
    sel_causes, sel_type, sel_pri,
    hour_range[0], hour_range[1], eps_m, min_samp
)

# ══════════════════════════════════════════════════════════════════════════════
# PAGE 1 — COMMAND DASHBOARD
# ══════════════════════════════════════════════════════════════════════════════
if nav == "📊 Traffic Overview":
    st.markdown("""
    <div class='brand-wrap'>
      <div class='brand-logo'>🛑</div>
      <div>
        <span class='brand-title'>Nivaaran.ai</span>
        <span class='brand-badge'>LIVE</span>
      </div>
    </div>
    <div class='brand-sub'>
      Event-Driven Congestion Predictive Dispatch Engine &mdash;
      Bengaluru Smart City Command Interface
    </div>
    """, unsafe_allow_html=True)

    if df.empty:
        st.warning("No data matched. Loosen your sidebar filters.")
        st.stop()

    # KPIs
    n_incidents = len(df)
    n_hotspots  = len(hs)
    mean_surge  = df['congestion_surge_index'].mean()
    n_critical  = (df['congestion_surge_index'] > 65).sum()
    mean_res    = df['time_to_resolution_minutes'].mean()
    high_risk   = (df['historical_risk_score'] > 0.5).sum()

    c1, c2, c3, c4, c5, c6 = st.columns(6)
    cards = [
        (c1, f"{n_incidents:,}",     "kpi-val-red", "Monitored Incidents",    "Filtered event logs"),
        (c2, f"{n_hotspots}",        "kpi-val-ylw", "Active Hotspots",        "DBSCAN density zones"),
        (c3, f"{mean_surge:.1f}%",   "kpi-val-red", "Mean Surge Index",       "Network gridlock avg"),
        (c4, f"{n_critical:,}",      "kpi-val-red", "Critical Zones",         "Surge > 65%"),
        (c5, f"{mean_res:.0f} min",  "kpi-val-grn", "Avg Resolution Time",    "Historical closure data"),
        (c6, f"{high_risk:,}",       "kpi-val-blu", "High-Risk Roads",        "Risk score > 0.5"),
    ]
    for col, val, cls, lbl, hint in cards:
        col.markdown(f"""
        <div class='kpi'>
          <div class='kpi-lbl'>{lbl}</div>
          <div class='kpi-val {cls}'>{val}</div>
          <div class='kpi-hint'>{hint}</div>
        </div>""", unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)

    # ── Row 1: Surge distribution + Hourly profile ─────────────────────────
    col_a, col_b = st.columns([1,1])

    with col_a:
        st.markdown("#### Congestion Surge Distribution")
        fig_hist = go.Figure()
        for label, rng, color in [
            ("Normal (<35%)",   (0,35),   "#00CC99"),
            ("Warning (35–65%)", (35,65), "#FFAB00"),
            ("Critical (>65%)",  (65,101),"#FF4B4B"),
        ]:
            subset = df[df['congestion_surge_index'].between(rng[0], rng[1])]
            fig_hist.add_trace(go.Histogram(
                x=subset['congestion_surge_index'],
                name=label, marker_color=color,
                opacity=0.85, nbinsx=20
            ))
        fig_hist.update_layout(
            template="plotly_dark", barmode="stack",
            margin=dict(t=10,b=30,l=0,r=0), height=260,
            legend=dict(orientation="h", yanchor="bottom", y=1.02),
            xaxis_title="Surge Index (%)", yaxis_title="Incidents"
        )
        st.plotly_chart(fig_hist, use_container_width=True)

    with col_b:
        st.markdown("#### Hourly Surge Profile")
        hourly = df.groupby('hour')['congestion_surge_index'].agg(['mean','max']).reset_index()
        fig_hr = go.Figure()
        fig_hr.add_trace(go.Scatter(
            x=hourly['hour'], y=hourly['mean'],
            mode='lines+markers', name='Avg Surge',
            line=dict(color='#FF4B4B', width=2.5),
            fill='tozeroy', fillcolor='rgba(255,75,75,.12)'
        ))
        fig_hr.add_trace(go.Scatter(
            x=hourly['hour'], y=hourly['max'],
            mode='lines', name='Max Surge',
            line=dict(color='#FFAB00', width=1.5, dash='dot')
        ))
        # Rush bands
        for x0, x1, label in [(8,10,"Morning Rush"), (17,20,"Evening Rush")]:
            fig_hr.add_vrect(x0=x0, x1=x1, fillcolor="rgba(255,75,75,0.12)",
                             layer="below", line_width=0,
                             annotation_text=label, annotation_position="top left",
                             annotation_font_color="#FF4B4B", annotation_font_size=10)
        fig_hr.update_layout(
            template="plotly_dark", height=260,
            margin=dict(t=10,b=30,l=0,r=0),
            xaxis_title="Hour of Day", yaxis_title="Surge Index (%)",
            legend=dict(orientation="h", yanchor="bottom", y=1.02)
        )
        st.plotly_chart(fig_hr, use_container_width=True)

    # ── Row 2: Cause breakdown + Resolution heatmap ────────────────────────
    col_c, col_d = st.columns([1,1])

    with col_c:
        st.markdown("#### Surge by Event Cause")
        cause_stats = df.groupby('event_cause').agg(
            mean_surge=('congestion_surge_index','mean'),
            count=('id','count')
        ).reset_index().sort_values('mean_surge', ascending=True).tail(10)
        fig_cause = go.Figure(go.Bar(
            x=cause_stats['mean_surge'], y=cause_stats['event_cause'],
            orientation='h',
            marker=dict(
                color=cause_stats['mean_surge'],
                colorscale='Hot', showscale=False
            ),
            text=cause_stats['count'].apply(lambda x: f"{x} incidents"),
            textposition='outside'
        ))
        fig_cause.update_layout(
            template="plotly_dark", height=280,
            margin=dict(t=10,b=10,l=0,r=80),
            xaxis_title="Mean Surge Index (%)"
        )
        st.plotly_chart(fig_cause, use_container_width=True)

    with col_d:
        st.markdown("#### Resolution Time Heatmap (by Cause × Hour)")
        pivot = (df.groupby(['event_cause','hour'])['time_to_resolution_minutes']
                   .mean().reset_index()
                   .pivot(index='event_cause', columns='hour',
                          values='time_to_resolution_minutes'))
        fig_heat = go.Figure(go.Heatmap(
            z=pivot.values,
            x=[str(h) for h in pivot.columns],
            y=pivot.index.tolist(),
            colorscale='Hot', showscale=True,
            colorbar=dict(title="Mins", thickness=12)
        ))
        fig_heat.update_layout(
            template="plotly_dark", height=280,
            margin=dict(t=10,b=10,l=0,r=0),
            xaxis_title="Hour of Day"
        )
        st.plotly_chart(fig_heat, use_container_width=True)

    # ── Row 3: Weekend vs Weekday + Recurrence ────────────────────────────
    col_e, col_f = st.columns([1,1])

    with col_e:
        st.markdown("#### Planned vs Unplanned — Surge by Day Type")
        day_type = df.groupby(['weekend_flag','event_type'])['congestion_surge_index'].mean().reset_index()
        day_type['Day Type'] = day_type['weekend_flag'].map({0:'Weekday',1:'Weekend'})
        fig_day = px.bar(day_type, x='Day Type', y='congestion_surge_index',
                         color='event_type', barmode='group',
                         color_discrete_map={'planned':'#FFAB00','unplanned':'#FF4B4B'},
                         labels={'congestion_surge_index':'Mean Surge Index (%)'})
        fig_day.update_layout(template="plotly_dark", height=230,
                              margin=dict(t=10,b=10,l=0,r=0),
                              legend_title="Event Type")
        st.plotly_chart(fig_day, use_container_width=True)

    with col_f:
        st.markdown("#### Event Recurrence vs Historical Risk Score")
        fig_rec = px.scatter(
            df.sample(min(2000, len(df))),
            x='event_recurrence_frequency', y='historical_risk_score',
            color='congestion_surge_index',
            color_continuous_scale='Hot', size_max=8,
            opacity=0.7,
            labels={
                'event_recurrence_frequency': 'Event Recurrence (normalised)',
                'historical_risk_score': 'Historical Risk Score',
                'congestion_surge_index': 'Surge %'
            }
        )
        fig_rec.update_layout(template="plotly_dark", height=230,
                              margin=dict(t=10,b=10,l=0,r=0))
        st.plotly_chart(fig_rec, use_container_width=True)


# ══════════════════════════════════════════════════════════════════════════════
# PAGE 2 — SPATIAL INTELLIGENCE
# ══════════════════════════════════════════════════════════════════════════════
elif nav == "🗺️ Congestion Map":
    st.markdown("### Spatial Congestion Intelligence Map")

    if df.empty:
        st.warning("No data matched. Loosen filters.")
        st.stop()

    left, right = st.columns([1, 3])

    with left:
        map_style_label = st.selectbox("Map style", [
            "Dark (Carto)", "Light (Carto)", "OpenStreetMap"])
        style_map = {
            "Dark (Carto)": "carto-darkmatter",
            "Light (Carto)": "carto-positron",
            "OpenStreetMap": "open-street-map"
        }
        color_metric = st.selectbox("Colour metric", [
            "congestion_surge_index", "historical_risk_score",
            "estimated_impact_scale", "time_to_resolution_minutes",
            "event_recurrence_frequency"
        ])
        size_metric = st.selectbox("Marker size", [
            "estimated_impact_scale", "cause_priority_interaction",
            "multi_incident_overlap_score"
        ])
        st.markdown("---")
        show_metro   = st.checkbox("Metro stations", True)
        show_market  = st.checkbox("Commercial hubs", True)
        show_isect   = st.checkbox("Intersections", True)
        st.markdown("---")
        st.markdown("**Legend**")
        for label, color in [("Normal (<35%)", "#00CC99"),
                              ("Warning (35–65%)", "#FFAB00"),
                              ("Critical (>65%)", "#FF4B4B")]:
            st.markdown(
                f"<span style='background:{color};width:10px;height:10px;"
                f"display:inline-block;border-radius:50%;margin-right:6px'></span>"
                f"<span style='font-size:.85rem;color:#CDD9E5'>{label}</span>",
                unsafe_allow_html=True
            )

    with right:
        fig_map = px.scatter_map(
            df,
            lat="latitude", lon="longitude",
            color=color_metric,
            size=size_metric,
            color_continuous_scale="Hot",
            size_max=14, zoom=11,
            map_style=style_map[map_style_label],
            hover_name="road_name",
            hover_data={
                "event_cause": True,
                "congestion_surge_index": ":.1f",
                "historical_risk_score": ":.3f",
                "time_to_resolution_minutes": ":.0f",
                "event_recurrence_frequency": ":.3f",
                "corridor_vulnerability_tier": True,
                "hotspot_id": True
            },
            height=520
        )

        # Infrastructure overlays
        overlay_cfg = [
            (show_metro,  METRO_STATIONS,  "#00FFCC", "Metro"),
            (show_market, COMMERCIAL_MARKETS, "#FFD166", "Market"),
            (show_isect,  INTERSECTIONS,  "#80AAFF", "Junction"),
        ]
        for show, src, color, label in overlay_cfg:
            if show:
                pts = pd.DataFrame(
                    [{"name": k, "lat": v[0], "lon": v[1]} for k, v in src.items()]
                )
                overlay = px.scatter_map(
                    pts, lat="lat", lon="lon", hover_name="name",
                    color_discrete_sequence=[color]
                )
                fig_map.add_trace(overlay.data[0])

        fig_map.update_layout(margin=dict(r=0,t=0,l=0,b=0))
        st.plotly_chart(fig_map, use_container_width=True)

    # 3-D PyDeck hotspot columns
    st.markdown("### 3D Hotspot Intensity Volume (PyDeck)")
    col3d, col3d_txt = st.columns([3, 1])

    with col3d_txt:
        st.markdown("**Reading the 3D View**")
        st.write("Column height → cumulative surge index of the cluster.  "
                 "Brighter red → higher incident density.")
        if not hs.empty:
            st.dataframe(
                hs[['hotspot_id','incident_count','mean_surge_index','total_surge_index']]
                  .sort_values('total_surge_index', ascending=False).head(10),
                height=260
            )

    with col3d:
        if hs.empty:
            st.info("No hotspots found with current cluster settings.")
        else:
            col_layer = pdk.Layer(
                "ColumnLayer",
                data=hs,
                get_position="[centroid_longitude, centroid_latitude]",
                get_elevation="total_surge_index",
                get_fill_color="[255, 75, 75, 190]",
                radius=eps_m, elevation_scale=0.12,
                pickable=True, extruded=True,
            )
            st.pydeck_chart(pdk.Deck(
                layers=[col_layer],
                initial_view_state=pdk.ViewState(
                    latitude=hs['centroid_latitude'].mean(),
                    longitude=hs['centroid_longitude'].mean(),
                    zoom=11, pitch=48, bearing=-10
                ),
                map_style="mapbox://styles/mapbox/dark-v9",
                tooltip={
                    "html": "<b>Hotspot #{hotspot_id}</b><br/>"
                            "Incidents: {incident_count}<br/>"
                            "Mean Surge: {mean_surge_index:.1f}%<br/>"
                            "Total Surge: {total_surge_index:.0f}%",
                    "style": {"background":"#1a1a2e","color":"white","fontSize":"13px"}
                }
            ))


# ══════════════════════════════════════════════════════════════════════════════
# PAGE 3 — FEATURE ANALYTICS
# ══════════════════════════════════════════════════════════════════════════════
elif nav == "🔬 Traffic Insights":
    st.markdown("### Post-Event Learning & Feature Deep Dive")

    if df.empty:
        st.warning("No data matched.")
        st.stop()

    tab1, tab2, tab3 = st.tabs([
        "Post-Event Learning Loop",
        "Resolution Intelligence",
        "Planned Event Analysis"
    ])

    with tab1:
        st.markdown("#### Historical Risk Score & Event Recurrence")
        c1, c2 = st.columns(2)
        with c1:
            top_roads = (df.groupby('road_name')['historical_risk_score']
                           .first().sort_values(ascending=False).head(15).reset_index())
            fig_risk = go.Figure(go.Bar(
                x=top_roads['historical_risk_score'],
                y=top_roads['road_name'],
                orientation='h',
                marker=dict(color=top_roads['historical_risk_score'],
                            colorscale='Reds', showscale=False)
            ))
            fig_risk.update_layout(
                template="plotly_dark", height=350,
                title="Top 15 High-Risk Road Segments",
                margin=dict(t=30,b=10,l=0,r=0),
                xaxis_title="Historical Risk Score (normalised)"
            )
            st.plotly_chart(fig_risk, use_container_width=True)

        with c2:
            top_rec = (df.groupby('road_cause_key')['event_recurrence_frequency']
                         .first().sort_values(ascending=False).head(15).reset_index())
            top_rec['road'] = top_rec['road_cause_key'].str.split('||').str[0].str[:25]
            top_rec['cause'] = top_rec['road_cause_key'].str.split('||').str[1]
            fig_rec = px.bar(top_rec, x='event_recurrence_frequency',
                             y='road', color='cause', orientation='h',
                             color_discrete_sequence=px.colors.qualitative.Bold)
            fig_rec.update_layout(
                template="plotly_dark", height=350,
                title="Top 15 Road+Cause Recurrence Pairs",
                margin=dict(t=30,b=10,l=0,r=0),
                xaxis_title="Recurrence Frequency (normalised)"
            )
            st.plotly_chart(fig_rec, use_container_width=True)

        st.markdown("#### Multi-Incident Spatial Overlap vs Surge")
        fig_ov = px.scatter(
            df.sample(min(3000, len(df))),
            x='multi_incident_overlap_score', y='congestion_surge_index',
            color='corridor_vulnerability_tier',
            color_continuous_scale='Plasma',
            opacity=0.65, size_max=8,
            labels={'multi_incident_overlap_score':'Spatial Overlap Score',
                    'congestion_surge_index':'Surge Index (%)'},
        )
        fig_ov.update_layout(template="plotly_dark", height=280,
                             margin=dict(t=10,b=10))
        st.plotly_chart(fig_ov, use_container_width=True)

    with tab2:
        st.markdown("#### Historical Resolution Time Analysis")
        c3, c4 = st.columns(2)

        with c3:
            cause_res = (df[df['time_to_resolution_minutes'] > 0]
                           .groupby('event_cause')['time_to_resolution_minutes']
                           .describe()[['mean','50%','75%','max']]
                           .round(1).rename(columns={'50%':'median','75%':'p75'}))
            st.markdown("**Mean Resolution Time by Cause (minutes)**")
            st.dataframe(cause_res, height=280)

        with c4:
            delay_ratio = df[df['resolution_delay_ratio'].notna()].copy()
            fig_dr = px.box(
                delay_ratio, x='event_cause', y='resolution_delay_ratio',
                color='event_cause',
                color_discrete_sequence=px.colors.qualitative.Bold,
                labels={'resolution_delay_ratio': 'Delay Ratio (actual/mean)',
                        'event_cause': 'Cause'}
            )
            fig_dr.add_hline(y=1.0, line_dash="dash", line_color="#00CC99",
                             annotation_text="Mean Baseline",
                             annotation_position="bottom right")
            fig_dr.add_hline(y=1.5, line_dash="dot", line_color="#FFAB00",
                             annotation_text="Modifier Threshold",
                             annotation_position="top right")
            fig_dr.update_layout(template="plotly_dark", height=280,
                                 showlegend=False,
                                 margin=dict(t=10,b=10),
                                 title="Resolution Delay Ratio (>1.5 triggers extra officers)")
            st.plotly_chart(fig_dr, use_container_width=True)

        # Corridor vulnerability
        st.markdown("#### Corridor Vulnerability Tier vs Surge")
        corr_stats = df.groupby('corridor').agg(
            tier=('corridor_vulnerability_tier','first'),
            mean_surge=('congestion_surge_index','mean'),
            incidents=('id','count')
        ).reset_index().sort_values('mean_surge', ascending=False)
        fig_corr = px.bar(
            corr_stats, x='corridor', y='mean_surge',
            color='tier', color_continuous_scale='Reds',
            text='incidents',
            labels={'mean_surge':'Mean Surge Index (%)','tier':'Vulnerability Tier'}
        )
        fig_corr.update_layout(template="plotly_dark", height=280,
                               margin=dict(t=10,b=10))
        st.plotly_chart(fig_corr, use_container_width=True)

    with tab3:
        st.markdown("#### Planned vs Unplanned Event Intelligence")
        planned = df[df['event_type'] == 'planned'].copy()

        c5, c6 = st.columns(2)
        with c5:
            if not planned.empty:
                fig_lt = px.histogram(
                    planned[planned['planned_event_lead_time_hours'] > 0],
                    x='planned_event_lead_time_hours', nbins=30,
                    color_discrete_sequence=['#FFAB00'],
                    labels={'planned_event_lead_time_hours': 'Lead Time (hours)'}
                )
                fig_lt.update_layout(template="plotly_dark", height=260,
                                     title="Planned Event Lead Time Distribution",
                                     margin=dict(t=30,b=10))
                st.plotly_chart(fig_lt, use_container_width=True)
                
                avg_lead = planned['planned_event_lead_time_hours'].mean()
                st.metric("Average Lead Time (Planned Events)", f"{avg_lead:.1f} hours")

        with c6:
            comp = df.groupby('event_type').agg(
                mean_surge=('congestion_surge_index','mean'),
                mean_resolution=('time_to_resolution_minutes','mean'),
                count=('id','count')
            ).reset_index()
            st.dataframe(comp.round(2), height=160)

            fig_comp = px.scatter(
                df.sample(min(3000, len(df))),
                x='planned_event_lead_time_hours',
                y='congestion_surge_index',
                color='event_type',
                opacity=0.7,
                color_discrete_map={'planned':'#FFAB00','unplanned':'#FF4B4B'},
                labels={'planned_event_lead_time_hours':'Lead Time (h)',
                        'congestion_surge_index':'Surge Index (%)'}
            )
            fig_comp.update_layout(template="plotly_dark", height=220,
                                   margin=dict(t=10,b=10),
                                   title="Lead Time vs Surge (Planned Events get advance warning)")
            st.plotly_chart(fig_comp, use_container_width=True)


# ══════════════════════════════════════════════════════════════════════════════
# PAGE 4 — DISPATCH SIMULATOR
# ══════════════════════════════════════════════════════════════════════════════
elif nav == "🚨 Live Resource Dispatcher":
    st.markdown("### Live Incident Dispatch Simulator")
    st.write("Inject any event onto the smart city grid — Nivaaran.ai predicts surge, "
             "applies all modifiers, and outputs a full barricade + manpower directive.")

    col_in, col_out = st.columns([1, 1])

    with col_in:
        st.markdown("#### Incident Configuration")

        road_options = sorted(df_all['road_name'].dropna().unique().tolist())
        sim_road  = st.selectbox("Road / Location", road_options)
        sim_cause = st.selectbox("Event Cause", all_causes)
        sim_type  = st.selectbox("Event Type", ["unplanned", "planned"])
        sim_pri   = st.selectbox("Priority", ["High", "Low"])
        sim_stat  = st.selectbox("Status", ["active", "closed", "resolved"])
        sim_corr  = st.selectbox("Corridor", list(CORRIDOR_VULNERABILITY.keys()))

        road_data = df_all[df_all['road_name'] == sim_road]
        def_lat   = float(road_data['latitude'].mean())  if not road_data.empty else 12.9716
        def_lon   = float(road_data['longitude'].mean()) if not road_data.empty else 77.5946

        c_la, c_lo = st.columns(2)
        sim_lat = c_la.number_input("Latitude",  12.5, 13.5, def_lat, format="%.5f")
        sim_lon = c_lo.number_input("Longitude", 77.0, 78.0, def_lon, format="%.5f")

        sim_scale  = st.slider("Estimated Impact Scale (Footprint)", 1.0, 10.0, 5.0, 0.5)
        sim_closure= st.checkbox("Requires road closure")

        c_ti, c_dy = st.columns(2)
        sim_time   = c_ti.time_input("Start time", datetime.now().time())
        sim_day    = c_dy.selectbox("Day",
                         ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"])

        sim_lead   = 0.0
        if sim_type == "planned":
            sim_lead = st.number_input("Lead time (hours before event)", 0.0, 720.0, 12.0)

        go_btn = st.button("🚨  Run Nivaaran.ai Prediction", use_container_width=True,
                           type="primary")

    with col_out:
        st.markdown("#### Prediction & Dispatch Output")

        if go_btn:
            # ── Build feature row ──────────────────────────────────────────
            days_map = dict(Monday=0,Tuesday=1,Wednesday=2,Thursday=3,
                            Friday=4,Saturday=5,Sunday=6)
            hour = sim_time.hour
            dow  = days_map[sim_day]
            rush = 1 if (8 <= hour <= 10 or 17 <= hour <= 20) else 0
            wknd = 1 if dow >= 5 else 0

            dm = min(haversine_distance(sim_lat, sim_lon, v[0], v[1])
                     for v in METRO_STATIONS.values())
            dk = min(haversine_distance(sim_lat, sim_lon, v[0], v[1])
                     for v in COMMERCIAL_MARKETS.values())
            di = min(haversine_distance(sim_lat, sim_lon, v[0], v[1])
                     for v in INTERSECTIONS.values())
            dhub = min(dm, dk)
            near_isect = 1 if di <= 50.0 else 0
            spill = 1.5 if rush and dk <= 500 else 1.0
            corr_tier = CORRIDOR_VULNERABILITY.get(sim_corr, 1)

            # Lookup historical features from dataset
            road_rows  = df_all[df_all['road_name'] == sim_road]
            hist_risk  = float(road_rows['historical_risk_score'].mean()) if not road_rows.empty else 0.05
            rec_freq   = float(road_rows.query(f"event_cause=='{sim_cause}'")
                               ['event_recurrence_frequency'].mean()
                               if not road_rows.empty else 0.05) or 0.05
            mean_res_c = float(df_all.query(f"event_cause=='{sim_cause}'")
                               ['mean_resolution_by_cause'].mean()
                               if len(df_all.query(f"event_cause=='{sim_cause}'")) > 0 else 60.0)
            res_ratio  = 1.0   # unknown at dispatch time

            # Hour density
            hour_density = float(df_all[df_all['hour'] == hour].shape[0] / max(len(df_all), 1))

            from backend_engine import CORRIDOR_VULNERABILITY as CV
            CAUSE_SEV = {
                'vehicle_breakdown':3,'accident':8,'water_logging':6,'pot_holes':2,
                'construction':4,'congestion':3,'tree_fall':5,'road_conditions':3,
                'vip_movement':9,'public_event':7,'procession':7,'protest':8,
                'others':2,'Unknown':1
            }
            csev = CAUSE_SEV.get(sim_cause, 2)
            pwt  = 2 if sim_pri == "High" else 1
            cpi  = csev * pwt

            row_df = pd.DataFrame([{
                'road_name': sim_road, 'police_station': 'Unknown',
                'hour': hour, 'day_of_week': dow, 'month': datetime.now().month,
                'is_rush_hour': rush, 'weekend_flag': wknd,
                'hour_sin': np.sin(2*np.pi*hour/24), 'hour_cos': np.cos(2*np.pi*hour/24),
                'dow_sin': np.sin(2*np.pi*dow/7),    'dow_cos': np.cos(2*np.pi*dow/7),
                'distance_to_metro': dm, 'distance_to_market': dk,
                'distance_to_intersection': di, 'distance_to_hub': dhub,
                'is_near_intersection': near_isect, 'spillover_multiplier': spill,
                'historical_risk_score': hist_risk,
                'event_recurrence_frequency': rec_freq,
                'time_to_resolution_minutes': mean_res_c,
                'mean_resolution_by_cause': mean_res_c,
                'resolution_delay_ratio': res_ratio,
                'planned_event_lead_time_hours': sim_lead,
                'multi_incident_overlap_score': hour_density * 3,
                'temporal_density_score': hour_density,
                'corridor_vulnerability_tier': corr_tier,
                'cause_severity_score': csev,
                'priority_weight': pwt,
                'cause_priority_interaction': cpi,
                'estimated_impact_scale': sim_scale,
                'event_cause': sim_cause, 'event_type': sim_type,
                'priority': sim_pri, 'status': sim_stat, 'corridor': sim_corr,
                'congestion_surge_index': 50.0,   # dummy for OOF enc reference
            }])

            pred_ens, pred_lgb, pred_xgb = predict_surge(row_df, model)
            surge = float(pred_lgb[0])   # primary LightGBM output

            disp = solve_dispatch(
                surge, location_name=sim_road, cause=sim_cause,
                resolution_delay_ratio=res_ratio,
                is_near_intersection=near_isect,
                corridor_tier=corr_tier, is_rush_hour=rush
            )
            plan = disp['dispatch_plan']
            sev  = disp['status']

            badge_cls = {'CRITICAL':'badge-critical','WARNING':'badge-warning','NORMAL':'badge-normal'}[sev]
            st.markdown(
                f"<div style='margin-bottom:12px'>"
                f"Severity: <span class='badge {badge_cls}'>{sev}</span>"
                f"</div>",
                unsafe_allow_html=True
            )

            # Metrics row
            m1, m2, m3 = st.columns(3)
            m1.metric("LightGBM Surge", f"{surge:.1f}%")
            m2.metric("XGBoost Surge",  f"{float(pred_xgb[0]):.1f}%")
            m3.metric("Ensemble Surge", f"{float(pred_ens[0]):.1f}%")

            # Gauge chart
            fig_gauge = go.Figure(go.Indicator(
                mode="gauge+number+delta",
                value=surge,
                domain={'x':[0,1],'y':[0,1]},
                title={'text':"Congestion Surge Index", 'font':{'color':'#CDD9E5','size':14}},
                delta={'reference': 35, 'increasing':{'color':'#FF4B4B'},
                       'decreasing':{'color':'#00CC99'}},
                gauge={
                    'axis':{'range':[0,100],'tickcolor':'#484F58'},
                    'bar':{'color': '#FF4B4B' if surge>65 else '#FFAB00' if surge>35 else '#00CC99'},
                    'steps':[
                        {'range':[0,35],  'color':'rgba(0,204,153,.15)'},
                        {'range':[35,65], 'color':'rgba(255,171,0,.15)'},
                        {'range':[65,100],'color':'rgba(255,75,75,.15)'},
                    ],
                    'threshold':{'line':{'color':'white','width':2},'thickness':.8,'value':surge}
                }
            ))
            fig_gauge.update_layout(
                template="plotly_dark", height=220,
                margin=dict(t=20,b=0,l=20,r=20),
                font={'color':'#CDD9E5'}
            )
            st.plotly_chart(fig_gauge, use_container_width=True)

            # Dispatch details
            st.markdown("<div class='dispatch-card'>", unsafe_allow_html=True)

            st.markdown("<div class='dispatch-section'>Manpower Allocation</div>",
                        unsafe_allow_html=True)
            for k, v in [
                ("Traffic Officers", plan['manpower']['traffic_officers']),
                ("Supervisors",      plan['manpower']['supervisors']),
                ("Base Officers",    plan['manpower']['base_officers']),
                ("Modifier Officers",plan['manpower']['modifier_officers']),
            ]:
                st.markdown(
                    f"<div class='stat-row'><span class='stat-key'>{k}</span>"
                    f"<span class='stat-val'>{v}</span></div>",
                    unsafe_allow_html=True
                )

            st.markdown("<br><div class='dispatch-section'>Barricading Blueprint</div>",
                        unsafe_allow_html=True)
            st.markdown(
                f"<div class='stat-row'><span class='stat-key'>Blueprint</span>"
                f"<span class='stat-val'>{plan['barricading']['blueprint_tier']}</span></div>"
                f"<div class='stat-row'><span class='stat-key'>Cones Required</span>"
                f"<span class='stat-val'>{plan['barricading']['cones_required']}</span></div>",
                unsafe_allow_html=True
            )

            st.markdown("<br><div class='dispatch-section'>Diversion Matrix</div>",
                        unsafe_allow_html=True)
            for route in plan['diversion_matrix']:
                st.markdown(f"<div class='directive-item'>🔀 {route}</div>",
                            unsafe_allow_html=True)

            st.markdown("<br><div class='dispatch-section'>Operational Directives</div>",
                        unsafe_allow_html=True)
            for d_item in plan['operational_directives']:
                st.markdown(f"<div class='directive-item'>✅ {d_item}</div>",
                            unsafe_allow_html=True)

            if plan['modifier_notes']:
                st.markdown("<br><div class='dispatch-section'>Modifier Adjustments</div>",
                            unsafe_allow_html=True)
                for note in plan['modifier_notes']:
                    st.markdown(f"<div class='modifier-note'>{note}</div>",
                                unsafe_allow_html=True)

            st.markdown("<br><div class='dispatch-section'>VMS Broadcast</div>",
                        unsafe_allow_html=True)
            st.markdown(f"<div class='vms-box'>{plan['vms_broadcast']}</div>",
                        unsafe_allow_html=True)

            st.markdown("</div>", unsafe_allow_html=True)

            with st.expander("📋 Full JSON Dispatch Payload"):
                st.json(disp)
        else:
            st.info("Configure the incident on the left and click **Run Nivaaran.ai Prediction**.")


# ══════════════════════════════════════════════════════════════════════════════
# PAGE 5 — MODEL CONSOLE
# ══════════════════════════════════════════════════════════════════════════════
elif nav == "⚙️ AI Model Metrics":
    st.markdown("### Model Architecture & Performance Console")

    # Validation metrics
    st.markdown("#### Ensemble Validation Metrics")
    m = stored_metrics
    cols = st.columns(6)
    metric_pairs = [
        ("LightGBM RMSE",  m.get('lgb',{}).get('rmse', '—'),  "#FF4B4B"),
        ("LightGBM R²",    m.get('lgb',{}).get('r2',   '—'),  "#00CC99"),
        ("XGBoost RMSE",   m.get('xgb',{}).get('rmse', '—'),  "#FF4B4B"),
        ("XGBoost R²",     m.get('xgb',{}).get('r2',   '—'),  "#00CC99"),
        ("Ensemble RMSE",  m.get('ensemble',{}).get('rmse','—'), "#FFAB00"),
        ("Ensemble R²",    m.get('ensemble',{}).get('r2',  '—'), "#FFAB00"),
    ]
    for col, (lbl, val, color) in zip(cols, metric_pairs):
        v_str = f"{val:.4f}" if isinstance(val, float) else str(val)
        col.markdown(
            f"<div class='kpi'><div class='kpi-lbl'>{lbl}</div>"
            f"<div style='font-size:1.8rem;font-weight:800;color:{color}'>{v_str}</div></div>",
            unsafe_allow_html=True
        )

    st.markdown("<br>", unsafe_allow_html=True)

    # Feature importances
    c_imp1, c_imp2 = st.columns(2)

    with c_imp1:
        st.markdown("#### LightGBM Feature Importances")
        lgb_model   = model['lgb_model']
        feat_cols   = model['feature_cols']
        importances = lgb_model.feature_importances_
        n = min(len(feat_cols), len(importances))
        fi_df = pd.DataFrame({
            'Feature': feat_cols[:n], 'Importance': importances[:n]
        }).sort_values('Importance', ascending=True).tail(20)
        fig_fi = go.Figure(go.Bar(
            x=fi_df['Importance'], y=fi_df['Feature'], orientation='h',
            marker=dict(color=fi_df['Importance'], colorscale='Hot', showscale=False)
        ))
        fig_fi.update_layout(template="plotly_dark", height=450,
                             margin=dict(t=10,b=10,l=0,r=0),
                             xaxis_title="Importance Score")
        st.plotly_chart(fig_fi, use_container_width=True)

    with c_imp2:
        st.markdown("#### Feature Engineering Summary")
        feat_table = [
            ("historical_risk_score",        "Road segment incident frequency (normalised)"),
            ("event_recurrence_frequency",   "Same cause+road pair recurrence (normalised)"),
            ("time_to_resolution_minutes",   "Actual historical closure time"),
            ("resolution_delay_ratio",       "Actual / mean resolution time"),
            ("planned_event_lead_time_hours","Hours of advance notice for planned events"),
            ("multi_incident_overlap_score", "Concurrent incidents in same grid cell & hour"),
            ("temporal_density_score",       "Global density of events in same hour"),
            ("corridor_vulnerability_tier",  "Strategic corridor weight (1=low, 3=high)"),
            ("cause_priority_interaction",   "Cause severity × priority weight product"),
            ("weekend_flag",                 "Binary weekend indicator"),
            ("dow_sin / dow_cos",            "Day-of-week cyclical encoding"),
            ("spillover_multiplier",         "Rush-hour × near-market interaction boost"),
            ("distance_to_hub",              "Min distance to metro or market (m)"),
        ]
        feat_df = pd.DataFrame(feat_table, columns=["Feature", "Description"])
        st.dataframe(feat_df, height=420, use_container_width=True)

    # Schema audit
    st.markdown("---")
    st.markdown("#### Adaptive Column Resolver Output")
    from backend_engine import dynamic_column_resolver
    raw_df = pd.read_csv("Astram event data_anonymized.csv.csv", nrows=1) \
             if os.path.exists("Astram event data_anonymized.csv.csv") \
             else pd.DataFrame()
    if not raw_df.empty:
        resolved = dynamic_column_resolver(raw_df)
        st.json(resolved)
    st.markdown(f"**Total features used in training:** `{len(model['feature_cols'])}`")
    st.code("\n".join(model['feature_cols']), language="text")
