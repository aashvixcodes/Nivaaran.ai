# Nivaaran.ai — Event-Driven Congestion Predictive Dispatch Engine

Nivaaran.ai is an enterprise-grade AI-powered smart city solutions platform designed to forecast urban traffic congestion surge and optimize operational resource dispatch. Powered by a combination of unsupervised spatial clustering and supervised tree-based regressors, the system translates real-time traffic incidents (planned and unplanned) into structured, actionable directives.

---

## 🚀 Key Features

### 1. Advanced Feature Engineering & Domain Logic
The engine extracts and scales features directly tied to operational urban realities, including:
- **Asset Proximity Buffers:** Distance to metro stations, commercial markets, and major intersections.
- **Vulnerability Tiers:** Categorized weights based on the strategic priority of road corridors.
- **Event Recurrence:** Frequency of specific incident types occurring repeatedly on same road segments.
- **Resolution Intelligence:** Historical resolution times per cause and delay ratio computation.
- **Lead Time Tracking:** Pre-planning lead time calculation for planned events (e.g., rallies, protests).
- **Incident Overlap Score:** Spatio-temporal event density analysis.

### 2. Double-Model Ensemble
- Dual-model machine learning architecture leveraging optimized **LightGBM** (primary) and **XGBoost** (secondary) regressors.
- Target-encoded categoricals with Out-of-Fold validation to prevent data leakage.
- High accuracy: Out-of-fold validation scores exceed **98% R²**.

### 3. Dynamic Dispatch Optimizer
- Rule-based manpower estimation and physical barricading blueprints (Tier 1-3).
- Context-aware modifiers (rush hour, junction proximity, resolution delay, and corridor priority adjustments).
- Live Variable Message Sign (VMS) broadcast directives.

### 4. Interactive Command Center UI
- Deployed via a premium dark-themed Streamlit dashboard.
- Features: Live KPIs, interactive spatial scatter map, 3D PyDeck hotspot visualizer, feature analytics deep-dive tabs, and a live sandbox simulator.
- Fully responsive on mobile and tablets.

---

## 🛠️ Tech Stack
- **Dashboard:** Streamlit, HTML5, Vanilla CSS
- **Machine Learning:** LightGBM, XGBoost, Scikit-learn
- **Data Engineering:** Pandas, Numpy
- **Data Visualizations:** Plotly, PyDeck, Mapbox
- **Persistence:** Pickle

---

## 📦 Getting Started

### 1. Install Dependencies
Make sure you have Python 3.8+ installed. Run the following to install all requirements:
```bash
pip install -r requirements.txt
```

### 2. Run the Engine & Server
Run the Streamlit application to start the interactive web UI:
```bash
streamlit run app.py
```
By default, the application will be hosted at `http://localhost:8501`.

---

## 📂 Project Structure
- `app.py`: Streamlit-based web interface and responsive frontend stylesheets.
- `backend_engine.py`: Data ingestion pipeline, column resolver, memory downcasting, and feature engineering.
- `regression_models.py`: Model definition, out-of-fold encoding, LightGBM/XGBoost training, and ensemble prediction.
- `dispatch_solver.py`: Operational dispatch solver implementing barricade tiers, manpower allocation, and VMS generation.
- `hotspot_clustering.py`: DBSCAN unsupervised clustering for incident density hotspot extraction.
- `test_pipeline.py`: End-to-end integration test of the machine learning pipeline.
- `requirements.txt`: Python dependencies.
