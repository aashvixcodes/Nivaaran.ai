---
title: Nivaaran.ai
emoji: 🚦
colorFrom: red
colorTo: orange
sdk: streamlit
sdk_version: 1.35.0
app_file: app.py
pinned: true
license: mit
---

# Nivaaran.ai — Event-Driven Congestion Predictive Dispatch Engine

Nivaaran.ai is an AI-powered smart city platform designed to forecast urban traffic congestion surge and optimize operational resource dispatch for Bengaluru. It translates real-time traffic incidents (planned and unplanned) into structured, actionable directives using a dual-model machine learning ensemble.

---

## Key Features

**Advanced Feature Engineering**
- Asset proximity buffers: distance to metro stations, commercial markets, and major intersections
- Vulnerability tiers: strategic weights for road corridors
- Event recurrence: incident frequency per road segment and cause type
- Resolution intelligence: historical resolution times and delay ratios
- Incident overlap scoring: spatio-temporal event density analysis

**Double-Model Ensemble**
- LightGBM (primary) + XGBoost (secondary) regressors
- Out-of-Fold target encoding to prevent data leakage
- Validation accuracy exceeding 98% R²

**Dynamic Dispatch Optimizer**
- Rule-based manpower estimation and barricading blueprints (Tier 1–3)
- Context-aware modifiers for rush hour, junction proximity, and corridor priority
- Live Variable Message Sign (VMS) broadcast generation

**Interactive Dashboard**
- Dark-themed Streamlit UI with live KPIs
- Interactive spatial scatter map and 3D PyDeck hotspot visualizer
- Feature analytics deep-dive and live sandbox simulator
- Fully responsive on mobile and tablets

---

## Tech Stack

| Layer | Technology |
|---|---|
| Dashboard | Streamlit, HTML5, Vanilla CSS |
| Machine Learning | LightGBM, XGBoost, Scikit-learn |
| Data Engineering | Pandas, NumPy |
| Visualizations | Plotly, PyDeck |

---

## Getting Started

```bash
pip install -r requirements.txt
streamlit run app.py
```

App runs at `http://localhost:8501` by default.

---

## Project Structure

```
app.py                  - Streamlit UI and frontend styles
backend_engine.py       - Data ingestion, feature engineering, column resolver
regression_models.py    - LightGBM/XGBoost training, OOF encoding, prediction
dispatch_solver.py      - Barricade tiers, manpower allocation, VMS generation
hotspot_clustering.py   - DBSCAN clustering for incident hotspot extraction
requirements.txt        - Python dependencies
```
