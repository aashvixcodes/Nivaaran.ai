import Link from 'next/link';
import { ScanEye, LayoutDashboard, Cpu, MapPin, ShieldAlert, Award } from 'lucide-react';

export default function Home() {
  return (
    <main className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 120px)', textAlign: 'center' }}>
      
      {/* Decorative Glow Grid */}
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(45,212,212,0.06) 0%, transparent 70%)',
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: -1,
        pointerEvents: 'none'
      }}></div>

      <div style={{ maxWidth: '800px', animation: 'fade-up 0.6s ease forwards' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'var(--accent-signal-bg)', border: '1px solid rgba(45, 212, 212, 0.2)', borderRadius: '99px', marginBottom: '24px' }}>
          <Award size={14} className="text-accent-signal" style={{ color: 'var(--accent-signal)' }} />
          <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-signal)' }}>
            Bengaluru Traffic Command Interface
          </span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 6vw, 56px)', fontWeight: '700', lineHeight: '1.1', letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '16px' }}>
          Predict Congestion.<br />
          <span style={{ background: 'linear-gradient(135deg, #2dd4d4 0%, #0ea5e9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Optimize Resource Dispatch.
          </span>
        </h1>

        <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: 'var(--text-secondary)', maxWidth: '620px', margin: '0 auto 40px', lineHeight: '1.6' }}>
          Nivaaran.ai computes real-time traffic surge impacts using a custom-trained LightGBM & XGBoost ensemble, generating automated lane-diversion blueprints and police deployments.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', width: '100%', maxWidth: '440px', margin: '0 auto 64px' }}>
          <Link href="/predict" className="btn btn-primary" style={{ flex: '1', minWidth: '180px', height: '48px' }}>
            <ScanEye size={18} />
            <span>Open Predictor</span>
          </Link>
          <Link href="/dashboard" className="btn btn-secondary" style={{ flex: '1', minWidth: '180px', height: '48px' }}>
            <LayoutDashboard size={18} />
            <span>System Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Feature Marquee Cards */}
      <div className="dashboard-grid" style={{ width: '100%', maxWidth: '1000px', marginTop: '16px' }}>
        <div className="card col-4">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '16px', color: 'var(--accent-signal)' }}>
            <Cpu size={20} />
          </div>
          <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '8px', textAlign: 'left' }}>Dual-Model Ensemble</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'left', lineHeight: '1.5' }}>
            Combines gradient boosting models (LGBM & XGBoost) trained on historic incidents to achieve a validation RMSE of &lt;3.1.
          </p>
        </div>

        <div className="card col-4">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '16px', color: 'var(--accent-signal)' }}>
            <MapPin size={20} />
          </div>
          <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '8px', textAlign: 'left' }}>DBSCAN Hotspot Mapping</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'left', lineHeight: '1.5' }}>
            Group active incidents into spatial hotspots using adaptive density-based clustering, identifying micro-congestion bottlenecks.
          </p>
        </div>

        <div className="card col-4">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '16px', color: 'var(--accent-signal)' }}>
            <ShieldAlert size={20} />
          </div>
          <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '8px', textAlign: 'left' }}>Automated Barricade Plans</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'left', lineHeight: '1.5' }}>
            Generates exact manpower allocations, cone counts, dynamic diversion routes, and VMS messaging protocols automatically.
          </p>
        </div>
      </div>

    </main>
  );
}
