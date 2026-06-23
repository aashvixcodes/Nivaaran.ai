import Link from 'next/link';
import { Cpu, MapPin, ShieldAlert, ScanEye, LayoutDashboard } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center px-6 py-20">

      {/* Hero Section */}
      <div className="max-w-3xl text-center animate-slide-up">

        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-[#E5E7EB] rounded-full mb-8">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">
            Bengaluru Traffic Command Interface
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-6xl font-bold leading-[1.08] tracking-tight text-[#111111] mb-6">
          Predict Congestion.
          <br />
          Optimize Resource Dispatch.
        </h1>

        {/* Subheadline */}
        <p className="text-base md:text-lg text-[#6B7280] max-w-xl mx-auto leading-relaxed mb-10">
          Nivaaran.ai computes real-time traffic surge impacts using a custom-trained
          LightGBM &amp; XGBoost ensemble, generating automated lane-diversion blueprints
          and police deployments.
        </p>

        {/* CTA Buttons */}
        <div className="flex items-center justify-center gap-4 flex-wrap mb-20">
          <Link
            href="/predict"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#111111] text-white text-sm font-medium rounded-lg hover:scale-[1.02] transition-all duration-200"
          >
            <ScanEye size={18} />
            <span>Open Predictor</span>
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 border border-[#E5E7EB] text-[#111111] text-sm font-medium rounded-lg bg-white hover:shadow-sm hover:scale-[1.02] transition-all duration-200"
          >
            <LayoutDashboard size={18} />
            <span>System Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Card 1 — Dual-Model Ensemble */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-center w-10 h-10 border border-[#E5E7EB] rounded-lg mb-4 text-[#111111]">
            <Cpu size={20} />
          </div>
          <h3 className="text-sm font-semibold text-[#111111] mb-2 text-left">
            Dual-Model Ensemble
          </h3>
          <p className="text-xs text-[#6B7280] text-left leading-relaxed">
            Combines gradient boosting models (LGBM &amp; XGBoost) trained on historic
            incidents to achieve a validation RMSE of &lt;3.1.
          </p>
        </div>

        {/* Card 2 — DBSCAN Hotspot Mapping */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-center w-10 h-10 border border-[#E5E7EB] rounded-lg mb-4 text-[#111111]">
            <MapPin size={20} />
          </div>
          <h3 className="text-sm font-semibold text-[#111111] mb-2 text-left">
            DBSCAN Hotspot Mapping
          </h3>
          <p className="text-xs text-[#6B7280] text-left leading-relaxed">
            Group active incidents into spatial hotspots using adaptive density-based
            clustering, identifying micro-congestion bottlenecks.
          </p>
        </div>

        {/* Card 3 — Automated Barricade Plans */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-center w-10 h-10 border border-[#E5E7EB] rounded-lg mb-4 text-[#111111]">
            <ShieldAlert size={20} />
          </div>
          <h3 className="text-sm font-semibold text-[#111111] mb-2 text-left">
            Automated Barricade Plans
          </h3>
          <p className="text-xs text-[#6B7280] text-left leading-relaxed">
            Generates exact manpower allocations, cone counts, dynamic diversion routes,
            and VMS messaging protocols automatically.
          </p>
        </div>
      </div>

    </main>
  );
}
