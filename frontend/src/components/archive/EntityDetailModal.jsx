import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Tabs from '../ui/Tabs';
import EmptyState from '../ui/EmptyState';
import { Shield, MapPin, Crown, FileQuestion, TrendingUp, TrendingDown, Users } from 'lucide-react';

function Sparkline({ data = [] }) {
  const pointsList = data.length > 0 ? data : [100, 105, 102, 110, 108, 113.6];
  const max = Math.max(...pointsList);
  const min = Math.min(...pointsList);
  const range = max - min || 1;
  const width = 160;
  const height = 40;
  const points = pointsList
    .map((val, idx) => {
      const x = (idx / (pointsList.length - 1 || 1)) * width;
      const y = height - ((val - min) / range) * (height - 10) - 5;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="flex items-center justify-end">
      <svg className="w-36 h-10 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <polyline fill="none" stroke="#111111" strokeWidth="1.75" strokeLinecap="round" points={points} />
      </svg>
    </div>
  );
}

function MetricCardWithSparkline({ label, value, sublabel, sparkline = [] }) {
  return (
    <div className="bg-ground/50 border border-rule rounded-card p-4 flex items-center justify-between">
      <div>
        <span className="text-[10px] font-mono font-bold text-ink/60 uppercase tracking-wider block">
          {label}
        </span>
        {sublabel && <span className="text-xs text-ink/60 block mt-0.5">{sublabel}</span>}
        <span className="font-mono text-2xl font-bold text-ink mt-1.5 block">
          {value}
        </span>
      </div>
      <Sparkline data={sparkline} />
    </div>
  );
}

function NotTracked({ label }) {
  return (
    <EmptyState
      icon={FileQuestion}
      title={`${label} telemetry not tracked`}
      description={`This simulation epoch does not currently generate ${label.toLowerCase()} sub-metrics.`}
      className="p-6"
    />
  );
}

const pct = (v) => (typeof v === 'number' ? `${Math.round(v * 100)}%` : null);

/**
 * EntityDetailModal Component
 * Full slide-over region/nation inspector panel matching Figma "Archive on click.png".
 */
export function EntityDetailModal({ entity, type = 'region', currentYear, isOpen, onClose }) {
  const [subTab, setSubTab] = useState('overview');

  if (!entity || !isOpen) return null;

  const title = entity.name || entity.title || 'Amber Vale';

  const categoryTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'political', label: 'Political' },
    { id: 'economy', label: 'Economy' },
    { id: 'health', label: 'Health' },
    { id: 'justice', label: 'Justice' },
    { id: 'military', label: 'Military' },
  ];

  const Icon = type === 'nation' ? Shield : type === 'region' ? MapPin : Crown;

  const subtitle =
    type === 'region'
      ? entity.nation?.name
        ? `One of 9 regions of ${entity.nation.name}`
        : 'One of 9 regions of Ashen Run'
      : type === 'leader'
      ? entity.nation?.name
        ? `${entity.title || 'Leader'} of ${entity.nation.name}`
        : entity.title || 'Leader'
      : `Nation · founded ${typeof entity.foundedYear === 'number' ? entity.foundedYear : 'year unknown'}`;

  // Dynamic Badges & Tags (Fallback to Figma defaults if unconfigured)
  const governanceBadges = entity.governanceBadges?.length
    ? entity.governanceBadges
    : ['Military Junta', 'Cooperative Circle', 'No has legislative authority'];

  const riskTags = entity.riskTags?.length
    ? entity.riskTags
    : ['Bloc Deadlock Risk', 'Extremist Activity', 'Resource Endowment', 'Quotas Met', 'Energy Shortfall'];

  const cultureBreakdown = entity.cultureBreakdown?.length
    ? entity.cultureBreakdown
    : [
        { party: 'Cooperative Circle', pct: 24.8 },
        { party: 'Grassroots Congress', pct: 19.4 },
        { party: 'People\'s Congress', pct: 9.0 },
        { party: 'Federal Order', pct: 7.9 },
        { party: 'Voluntary Congress', pct: 7.5 },
      ];

  const gdpVal = entity.gdpValue ? entity.gdpValue.toLocaleString() : (entity.population ? Math.round(entity.population * 1.5).toLocaleString() : '113,663');
  const gdpSub = entity.gdpChangePct ? `${entity.gdpChangePct}% this quarter` : '-1.4% this quarter';

  const milVal = entity.militaryCapability ? entity.militaryCapability.toLocaleString() : '2,847';
  const milSub = entity.personnelCount ? `${entity.personnelCount.toLocaleString()} personnel` : '18,870 personnel';

  const resVal = entity.reservesValue ? entity.reservesValue.toLocaleString() : '6,410';
  const resSub = entity.reservesNote || 'Drawn down twice this year';

  const stabVal = entity.stabilityValue !== undefined ? entity.stabilityValue : (entity.politicalState?.stability || 0.58);
  const stabSub = entity.stabilityTrend || 'Falling';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-3xl">
      <div className="space-y-6 text-ink">
        {/* Category Sub-Tabs matching Figma */}
        <div className="flex justify-center border-b border-rule pb-3">
          <Tabs tabs={categoryTabs} activeTab={subTab} onChange={setSubTab} variant="pills" />
        </div>

        {/* Entity Title & Governance Badges matching Figma */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-lg bg-paper border border-rule flex items-center justify-center shrink-0 shadow-2xs">
            <Icon className="w-8 h-8 text-ink/70" />
          </div>
          <div className="space-y-2 flex-1">
            <div>
              <h3 className="font-display text-2xl font-bold text-ink">{title}</h3>
              <p className="text-xs text-ink/60 font-sans mt-0.5">{subtitle}</p>
            </div>

            {/* Governance Badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              {governanceBadges.map((badge, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold border ${
                    badge.toLowerCase().includes('no has') || badge.toLowerCase().includes('no legislative')
                      ? 'border-red-300 text-red-700 bg-red-50'
                      : 'border-rule bg-paper text-ink'
                  }`}
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Tag Pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          {riskTags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 rounded bg-ground/80 border border-rule text-[11px] font-medium text-ink/70"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Sub-tab Content */}
        {subTab === 'overview' && (
          <div className="space-y-6 pt-2">
            {/* 4 Telemetry Sparkline Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MetricCardWithSparkline
                label="REGIONAL GDP"
                value={gdpVal}
                sublabel={gdpSub}
                sparkline={entity.gdpSparkline}
              />
              <MetricCardWithSparkline
                label="MILITARY CAPABILITY"
                value={milVal}
                sublabel={milSub}
                sparkline={entity.militarySparkline}
              />
              <MetricCardWithSparkline
                label="RESERVES"
                value={resVal}
                sublabel={resSub}
                sparkline={entity.reservesSparkline}
              />
              <MetricCardWithSparkline
                label="STABILITY"
                value={stabVal}
                sublabel={stabSub}
                sparkline={entity.stabilitySparkline}
              />
            </div>

            {/* Population Composition / Culture Section */}
            <div className="bg-paper border border-rule rounded-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-rule pb-3">
                <span className="text-xs font-mono font-bold text-ink/70 uppercase tracking-wider">
                  Population Composition & Culture
                </span>
                <span className="text-xs font-mono text-ink/50">
                  {cultureBreakdown.length} Factions Tracked
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                {/* Donut Circle Representative Graphic */}
                <div className="flex items-center justify-center p-4">
                  <div className="w-32 h-32 rounded-full border-8 border-ink/10 flex items-center justify-center bg-ground text-center p-3">
                    <span className="text-xs font-semibold text-ink/70 italic">
                      "Keep the same colours"
                    </span>
                  </div>
                </div>

                {/* Faction Percentages List */}
                <div className="space-y-2 text-xs font-sans">
                  {cultureBreakdown.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1 border-b border-rule/40">
                      <span className="text-ink/80 font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-ink/40" />
                        {item.party}
                      </span>
                      <span className="font-mono font-bold text-ink">{item.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {subTab === 'political' && (
          <div className="space-y-4 text-xs font-sans">
            <div className="bg-paper border border-rule rounded-card p-4 space-y-2">
              <h4 className="font-semibold text-sm text-ink">Political Structure</h4>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-ground rounded border border-rule">
                  <span className="text-[10px] uppercase font-mono font-bold text-ink/60 block">Government Type</span>
                  <span className="text-sm font-bold text-ink mt-1 block">{entity.politicalState?.governmentType || 'Regional Assembly'}</span>
                </div>
                <div className="p-3 bg-ground rounded border border-rule">
                  <span className="text-[10px] uppercase font-mono font-bold text-ink/60 block">Centralized Power</span>
                  <span className="text-sm font-bold text-ink mt-1 block">{pct(entity.politicalState?.centralizedPower) ?? '72%'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {(subTab === 'economy' || subTab === 'health' || subTab === 'justice' || subTab === 'military') && (
          <NotTracked label={subTab.charAt(0).toUpperCase() + subTab.slice(1)} />
        )}
      </div>
    </Modal>
  );
}

export default EntityDetailModal;
