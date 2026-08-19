import React, { useState } from 'react';
import { X, Zap, Activity, Pickaxe, Scale, Sliders } from 'lucide-react';

const INSPECTOR_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'political', label: 'Political' },
  { id: 'economy', label: 'Economy' },
  { id: 'health', label: 'Health' },
  { id: 'justice', label: 'Justice' },
  { id: 'military', label: 'Military' },
];

const FACTIONS_DATA = [
  { name: 'Cooperative Circle', pct: '24.8%', color: '#333333' },
  { name: 'Grassroots Congress', pct: '19.4%', color: '#666666' },
  { name: 'People\'s Congress', pct: '9.0%', color: '#888888' },
  { name: 'Federal Order', pct: '7.9%', color: '#AAAAAA' },
  { name: 'Voluntary Congress', pct: '7.5%', color: '#CCCCCC' },
  { name: 'Workers\' Bloc', pct: '6.8%', color: '#999999' },
];

export function ProjectionInspectorPanel({ region, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');

  const regionName = region?.name || 'Amber Vale';
  const nationName = region?.nation || 'Ashen Run';
  const gdp = region?.gdp || '113,663';
  const military = region?.military || '2,847';
  const reserves = region?.reserves || '6,410';
  const stability = region?.stability || '0.58';

  return (
    <div className="w-full max-w-sm sm:max-w-md bg-white/95 backdrop-blur-md border border-stone-300 rounded-2xl shadow-xl p-5 text-stone-900 font-sans space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar">
      {/* Close Button & Tab Nav */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-2">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
          {INSPECTOR_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`text-xs font-semibold pb-1 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive ? 'border-stone-900 text-stone-900 font-bold' : 'border-transparent text-stone-400 hover:text-stone-700'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Region Header Section */}
      <div className="flex items-start gap-4 pt-1">
        <div className="w-16 h-16 bg-stone-200 rounded-xl shrink-0 flex items-center justify-center text-stone-400 font-bold text-xl">
          {regionName.charAt(0)}
        </div>
        <div className="space-y-1">
          <h2 className="font-serif font-extrabold text-2xl text-stone-900 leading-tight">
            {regionName}
          </h2>
          <p className="text-xs text-stone-500 font-sans">
            One of <strong className="text-stone-800 font-semibold">9 regions</strong> of{' '}
            <strong className="text-stone-800 font-semibold">{nationName}</strong>
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="px-2 py-0.5 border border-stone-300 bg-stone-50 rounded text-[10px] font-semibold text-stone-700">
              Military Junta
            </span>
            <span className="px-2 py-0.5 border border-stone-300 bg-stone-50 rounded text-[10px] font-semibold text-stone-700">
              Cooperative Circle
            </span>
            <span className="px-2 py-0.5 border border-rose-300 bg-rose-50 rounded text-[10px] font-semibold text-rose-700">
              No has legislative authority
            </span>
          </div>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-1.5">
        <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-[11px] font-semibold text-amber-800 inline-flex items-center gap-1">
          <Scale className="w-3 h-3 text-amber-700" />
          Bloc Deadlock Risk
        </span>
        <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-[11px] font-semibold text-amber-800 inline-flex items-center gap-1">
          <Activity className="w-3 h-3 text-amber-700" />
          Extremist Activity
        </span>
        <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] font-semibold text-emerald-800 inline-flex items-center gap-1">
          <Pickaxe className="w-3 h-3 text-emerald-700" />
          Resource Endowment
        </span>
        <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] font-semibold text-emerald-800 inline-flex items-center gap-1">
          <Sliders className="w-3 h-3 text-emerald-700" />
          Quotas Met
        </span>
        <span className="px-2.5 py-1 bg-rose-50 border border-rose-200 rounded-lg text-[11px] font-semibold text-rose-800 inline-flex items-center gap-1">
          <Zap className="w-3 h-3 text-rose-700" />
          Energy Shortfall
        </span>
      </div>

      {/* 4 Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-2.5 pt-1">
        {/* REGIONAL GDP */}
        <div className="bg-stone-50/80 border border-stone-200 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
              <span>REGIONAL GDP</span>
              <span className="text-rose-600 font-sans font-medium text-[11px]">-1.4% this quarter</span>
            </div>
            <div className="text-2xl font-mono font-bold text-stone-900 mt-1">{gdp}</div>
          </div>
          <div className="w-28 h-8">
            <svg viewBox="0 0 100 30" className="w-full h-full stroke-stone-700 fill-stone-200/50 stroke-[1.5]">
              <path d="M 0,25 Q 50,2 100,25 Z" />
            </svg>
          </div>
        </div>

        {/* MILITARY CAPABILITY */}
        <div className="bg-stone-50/80 border border-stone-200 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
              <span>MILITARY CAPABILITY</span>
              <span className="text-stone-500 font-sans font-normal text-[11px]">18,870 personnel</span>
            </div>
            <div className="text-2xl font-mono font-bold text-stone-900 mt-1">{military}</div>
          </div>
          <div className="w-28 h-8">
            <svg viewBox="0 0 100 30" className="w-full h-full stroke-stone-700 fill-stone-200/50 stroke-[1.5]">
              <path d="M 0,25 Q 50,5 100,25 Z" />
            </svg>
          </div>
        </div>

        {/* RESERVES */}
        <div className="bg-stone-50/80 border border-stone-200 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
              <span>RESERVES</span>
              <span className="text-rose-600 font-sans font-medium text-[11px]">Drawn down twice this year</span>
            </div>
            <div className="text-2xl font-mono font-bold text-stone-900 mt-1">{reserves}</div>
          </div>
          <div className="w-28 h-8">
            <svg viewBox="0 0 100 30" className="w-full h-full stroke-stone-700 fill-stone-200/50 stroke-[1.5]">
              <path d="M 0,25 Q 50,8 100,25 Z" />
            </svg>
          </div>
        </div>

        {/* STABILITY */}
        <div className="bg-stone-50/80 border border-stone-200 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
              <span>STABILITY</span>
              <span className="text-rose-600 font-sans font-medium text-[11px]">Falling</span>
            </div>
            <div className="text-2xl font-mono font-bold text-stone-900 mt-1">{stability}</div>
          </div>
          <div className="w-28 h-8">
            <svg viewBox="0 0 100 30" className="w-full h-full stroke-stone-700 fill-stone-200/50 stroke-[1.5]">
              <path d="M 0,25 Q 50,10 100,25 Z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Population Composition Section */}
      <div className="bg-stone-50/80 border border-stone-200 rounded-xl p-4 space-y-3">
        <div className="text-[11px] font-mono font-bold text-stone-500 uppercase tracking-wider">
          Population Composition
        </div>
        <div className="flex items-center justify-between border-b border-stone-200 pb-1 text-xs">
          <span className="font-semibold text-stone-700">Culture</span>
          <span className="text-stone-400 font-mono">17 Parties</span>
        </div>

        <div className="flex items-center gap-4 pt-1">
          {/* Donut Chart Graphics */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#E5E5E5"
                strokeWidth="3.8"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#333333"
                strokeWidth="3.8"
                strokeDasharray="25, 100"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#666666"
                strokeWidth="3.8"
                strokeDasharray="19, 100"
                strokeDashoffset="-25"
              />
            </svg>
            <span className="absolute text-[9px] text-center text-stone-500 font-mono leading-tight px-1">
              "Keep the same colours"
            </span>
          </div>

          {/* Factions Legend List */}
          <div className="flex-1 space-y-1 text-xs">
            {FACTIONS_DATA.map((f, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-stone-700 truncate">
                  <span className="w-2 h-2 rounded-xs shrink-0" style={{ backgroundColor: f.color }} />
                  <span className="truncate">{f.name}</span>
                </div>
                <span className="font-mono font-bold text-stone-900 shrink-0 ml-1">{f.pct}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectionInspectorPanel;
