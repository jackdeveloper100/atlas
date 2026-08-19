import React, { useState, useMemo } from 'react';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';
import MetricCard from './MetricCard';
import {
  Shield,
  MapPin,
  Crown,
  FileQuestion,
  Zap,
  Activity,
  Pickaxe,
  Scale,
  Sliders,
  AlertTriangle,
} from 'lucide-react';

const DEFAULT_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'political', label: 'Political' },
  { id: 'economy', label: 'Economy' },
  { id: 'health', label: 'Health' },
  { id: 'justice', label: 'Justice' },
  { id: 'military', label: 'Military' },
];

export function EntityDetailModal({ entity, entityData, type = 'region', currentYear, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');

  // Combined entity info and relational details
  const entityDetails = entityData || entity;

  const governanceBadges = entityDetails?.governanceBadges || [];
  const riskTags = entityDetails?.riskTags || [];
  const cultureBreakdown = entityDetails?.cultureBreakdown || [];
  const metricsMap = entityDetails?.metrics || {};
  const currentTabMetrics = metricsMap[activeTab] || [];

  const tabs = useMemo(() => {
    if (Array.isArray(entityDetails?.tabs) && entityDetails.tabs.length > 0) {
      return entityDetails.tabs.map((t) => ({
        id: t.tabKey || t.id,
        label: t.label,
      }));
    }
    return DEFAULT_TABS;
  }, [entityDetails]);

  const riskTagsToDisplay = useMemo(() => {
    if (riskTags.length > 0) return riskTags;
    if (type === 'region' && activeTab === 'overview') {
      return [
        { label: 'Energy shortfall', color: 'red' },
        { label: 'Extremist activity', color: 'amber' },
        { label: 'Resource endowment', color: 'green' },
        { label: 'Bloc deadlock risk', color: 'amber' },
        { label: 'Quotas met', color: 'green' },
      ];
    }
    return [];
  }, [riskTags, type, activeTab]);

  const cultureBreakdownToDisplay = useMemo(() => {
    if (cultureBreakdown.length > 0) return cultureBreakdown;
    if (type === 'region' && activeTab === 'overview') {
      return [
        { group: 'Ashen Native', percentage: 70 },
        { group: 'Imperial Merchant', percentage: 30 },
      ];
    }
    return [];
  }, [cultureBreakdown, type, activeTab]);

  const displayMetrics = useMemo(() => {
    if (activeTab !== 'overview' || type !== 'region') {
      return currentTabMetrics;
    }

    const mapByLabel = {};
    currentTabMetrics.forEach((m) => {
      const key = (m.label || '').toUpperCase();
      mapByLabel[key] = m;
    });

    const rawGdpVal = entityDetails?.gdp || entityDetails?.numericValue || (currentTabMetrics[0]?.value ? String(currentTabMetrics[0].value).replace(/USD/i, '').trim() : '111,663');
    const formattedGdp = typeof rawGdpVal === 'number' ? rawGdpVal.toLocaleString() : String(rawGdpVal).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    const gdpMetric = mapByLabel['REGIONAL GDP'] || mapByLabel['GROSS REGIONAL PRODUCT'] || {
      id: 'gdp',
      label: 'REGIONAL GDP',
      value: formattedGdp,
      description: '-1.4% this quarter',
    };

    const reservesMetric = mapByLabel['RESERVES'] || {
      id: 'reserves',
      label: 'RESERVES',
      value: entityDetails?.reserves ? Number(entityDetails.reserves).toLocaleString() : '6,410',
      description: 'drawn down twice this year',
    };

    const militaryMetric = mapByLabel['MILITARY CAPABILITY'] || mapByLabel['MILITARY'] || {
      id: 'military',
      label: 'MILITARY CAPABILITY',
      value: entityDetails?.militaryCapability ? Number(entityDetails.militaryCapability).toLocaleString() : '2,847',
      description: 'combat value · 18,870 personnel',
    };

    const stabilityMetric = mapByLabel['STABILITY'] || {
      id: 'stability',
      label: 'STABILITY',
      value: entityDetails?.stability !== undefined && entityDetails?.stability !== null ? String(entityDetails.stability) : '0.58',
      description: 'falling – energy and extremism',
    };

    return [
      { ...gdpMetric, label: 'REGIONAL GDP', value: String(gdpMetric.value).replace(/USD/i, '').trim(), description: gdpMetric.description || '-1.4% this quarter' },
      { ...reservesMetric, label: 'RESERVES', description: reservesMetric.description || 'drawn down twice this year' },
      { ...militaryMetric, label: 'MILITARY CAPABILITY', description: militaryMetric.description || 'combat value · 18,870 personnel' },
      { ...stabilityMetric, label: 'STABILITY', description: stabilityMetric.description || 'falling – energy and extremism' },
    ];
  }, [activeTab, type, currentTabMetrics, entityDetails]);

  // ALL HOOKS HAVE BEEN EXECUTED BEFORE THIS CONDITIONAL RETURN
  if (!entity || !isOpen) return null;

  const title = entityDetails?.name || entityDetails?.title || 'Entity Details';

  const getCleanCode = () => {
    if (entityDetails?.code) return entityDetails.code;
    if (entityDetails?.dossierCode) return entityDetails.dossierCode;
    if (entityDetails?.id) {
      const str = String(entityDetails.id);
      if (str.includes('-')) return str.split('-')[0].toUpperCase();
      return str.toUpperCase();
    }
    return 'AV-22';
  };

  const dossierCode = getCleanCode();
  const dossierTypeLabel = type ? type.toUpperCase() : 'REGIONAL';

  const renderSubtitle = () => {
    if (type === 'region') {
      const parts = [];
      const nationName = entityDetails?.nationName || entityDetails?.nation || 'Ashen Run';
      const totalRegions = entityDetails?.totalRegionsCount || entityDetails?.totalRegions || 9;

      parts.push(
        <span key="regions">
          One of <strong className="font-semibold text-stone-900">{totalRegions} regions</strong> of{' '}
          <strong className="font-semibold text-stone-900">{nationName}</strong>
        </span>
      );

      if (entityDetails?.population) {
        parts.push(
          <span key="pop">
            <strong className="font-semibold text-stone-900">{Number(entityDetails.population).toLocaleString()}</strong> population
          </span>
        );
      }

      if (entityDetails?.area) {
        parts.push(
          <span key="area">
            <strong className="font-semibold text-stone-900">{Number(entityDetails.area).toLocaleString()} km²</strong>
          </span>
        );
      }

      if (entityDetails?.subregionsCount || entityDetails?.subregions) {
        parts.push(
          <span key="sub">
            <strong className="font-semibold text-stone-900">{entityDetails.subregionsCount || entityDetails.subregions} subregions</strong>
          </span>
        );
      }

      if (entityDetails?.meanElevation || entityDetails?.elevation) {
        parts.push(
          <span key="elev">
            mean elevation <strong className="font-semibold text-stone-900">{entityDetails.meanElevation || entityDetails.elevation} m</strong>
          </span>
        );
      }

      return (
        <p className="text-xs sm:text-sm text-stone-600 font-sans leading-relaxed mt-1 mb-3">
          {parts.reduce((acc, curr, idx) => (idx === 0 ? [curr] : [...acc, ' · ', curr]), [])}
        </p>
      );
    }

    if (type === 'nation') {
      return (
        <p className="text-xs sm:text-sm text-stone-600 font-sans leading-relaxed mt-1 mb-3">
          Nation · <strong className="font-semibold text-stone-900">{entityDetails?.governmentType || 'Sovereign Republic'}</strong>
          {entityDetails?.population ? (
            <> · <strong className="font-semibold text-stone-900">{Number(entityDetails.population).toLocaleString()}</strong> population</>
          ) : null}
        </p>
      );
    }

    return (
      <p className="text-xs sm:text-sm text-stone-600 font-sans leading-relaxed mt-1 mb-3">
        <strong className="font-semibold text-stone-900">{entityDetails?.title || 'Leader'}</strong>
        {entityDetails?.nationName ? <> · <strong className="font-semibold text-stone-900">{entityDetails.nationName}</strong></> : null}
      </p>
    );
  };

  const renderTagIcon = (labelStr) => {
    const l = (labelStr || '').toLowerCase();
    if (l.includes('energy') || l.includes('shortfall') || l.includes('zap')) {
      return <Zap className="w-3.5 h-3.5 inline mr-1 text-[#A6402A]" />;
    }
    if (l.includes('extremist') || l.includes('activity') || l.includes('conflict')) {
      return <Activity className="w-3.5 h-3.5 inline mr-1 text-[#7E652B]" />;
    }
    if (l.includes('resource') || l.includes('endowment') || l.includes('mining')) {
      return <Pickaxe className="w-3.5 h-3.5 inline mr-1 text-[#3E6C3A]" />;
    }
    if (l.includes('deadlock') || l.includes('bloc') || l.includes('risk') || l.includes('banditry') || l.includes('friction')) {
      return <Scale className="w-3.5 h-3.5 inline mr-1 text-[#7E652B]" />;
    }
    if (l.includes('quota') || l.includes('met') || l.includes('trade')) {
      return <Sliders className="w-3.5 h-3.5 inline mr-1 text-[#3E6C3A]" />;
    }
    return <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-stone-500" />;
  };

  const getTagColorClass = (labelStr, colorProp) => {
    if (colorProp === 'red' || colorProp === 'danger') return 'bg-[#FDF2EF] border-[#F8D2C7] text-[#A6402A]';
    if (colorProp === 'amber' || colorProp === 'warning') return 'bg-[#FAF5EA] border-[#EBDCB9] text-[#7E652B]';
    if (colorProp === 'green' || colorProp === 'success') return 'bg-[#F1F6F0] border-[#CBE0C7] text-[#3E6C3A]';

    const l = (labelStr || '').toLowerCase();
    if (l.includes('shortfall') || l.includes('danger')) return 'bg-[#FDF2EF] border-[#F8D2C7] text-[#A6402A]';
    if (l.includes('extremist') || l.includes('deadlock') || l.includes('friction') || l.includes('risk') || l.includes('banditry')) {
      return 'bg-[#FAF5EA] border-[#EBDCB9] text-[#7E652B]';
    }
    if (l.includes('resource') || l.includes('quota') || l.includes('met') || l.includes('endowment')) {
      return 'bg-[#F1F6F0] border-[#CBE0C7] text-[#3E6C3A]';
    }
    return 'bg-white/80 border-[#DCD6CA] text-stone-700';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-[580px]" variant="dossier">
      <div className="space-y-3 text-stone-900">
        {/* Top Header Badge */}
        <div>
          <span className="inline-flex items-center px-2 py-0.5 rounded border border-[#DCD6CA] bg-white/70 text-[10px] font-mono font-bold tracking-wider text-stone-500 uppercase">
            {dossierTypeLabel} DOSSIER · {dossierCode}
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight leading-tight mt-1">
            {title}
          </h2>
          {renderSubtitle()}
        </div>

        {/* Governance Badges & Alert Notice Pills */}
        {(governanceBadges.length > 0 || entityDetails?.governmentType || entityDetails?.rulingParty || entityDetails?.notice) && (
          <div className="flex flex-wrap gap-2 pt-0.5">
            {governanceBadges.map((badge, idx) => {
              const label = typeof badge === 'object' ? badge.label : badge;
              const color = typeof badge === 'object' ? badge.color : 'default';
              const isNotice = color === 'red' || (typeof label === 'string' && (label.includes('legislative') || label.includes('enacted')));

              if (isNotice) {
                return (
                  <div
                    key={idx}
                    className="w-full px-3 py-1 rounded-md border border-[#F3C7B8] bg-[#FBF0EC] text-xs font-medium text-[#9E3E26]"
                  >
                    {label}
                  </div>
                );
              }

              return (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-md border border-[#DCD6CA] bg-white/80 text-[11px] font-medium text-stone-800 shadow-2xs"
                >
                  {label}
                </span>
              );
            })}
            {governanceBadges.length === 0 && (
              <>
                {entityDetails?.governmentType && (
                  <span className="px-2.5 py-0.5 rounded-md border border-[#DCD6CA] bg-white/80 text-[11px] font-medium text-stone-800 shadow-2xs">
                    Government type: {entityDetails.governmentType}
                  </span>
                )}
                {entityDetails?.rulingParty && (
                  <span className="px-2.5 py-0.5 rounded-md border border-[#DCD6CA] bg-white/80 text-[11px] font-medium text-stone-800 shadow-2xs">
                    Ruling party: {entityDetails.rulingParty}
                  </span>
                )}
                {entityDetails?.notice && (
                  <div className="w-full px-3 py-1 rounded-md border border-[#F3C7B8] bg-[#FBF0EC] text-xs font-medium text-[#9E3E26]">
                    {entityDetails.notice}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Section Divider */}
        <hr className="border-t border-[#E6E0D6] my-2.5" />

        {/* Category Navigation Tabs */}
        <div className="flex items-center gap-5 sm:gap-6 border-b border-[#E6E0D6] pb-0 mb-3 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`pb-2 text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${isActive
                    ? 'text-stone-900 font-bold border-b-2 border-stone-900'
                    : 'text-stone-400 hover:text-stone-700'
                  }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Risk / Alert Status Pills (above Metrics) */}
        {riskTagsToDisplay.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-0.5 pb-0.5 mb-2">
            {riskTagsToDisplay.map((tag, idx) => {
              const label = typeof tag === 'object' ? tag.label : tag;
              const color = typeof tag === 'object' ? tag.color : undefined;
              const colorClass = getTagColorClass(label, color);
              return (
                <span
                  key={idx}
                  className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[11px] font-semibold shadow-2xs ${colorClass}`}
                >
                  {renderTagIcon(label)}
                  {label}
                </span>
              );
            })}
          </div>
        )}

        {/* Metrics Grid for active tab */}
        {displayMetrics.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {displayMetrics.map((m) => (
              <MetricCard key={m.id || m.metricKey} metric={m} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FileQuestion}
            title="No telemetry available"
            description="No metrics or telemetry recorded for this section in the current year."
            className="p-5 bg-white/60 border border-[#E6E0D6] rounded-2xl text-xs"
          />
        )}

        {/* Culture / Factions breakdown (Overview tab if present) */}
        {activeTab === 'overview' && cultureBreakdownToDisplay.length > 0 && (
          <div className="bg-white/90 border border-[#E6E0D6] rounded-2xl p-4.5 space-y-2 mt-3 p-4">
            <div className="flex items-center justify-between border-b border-[#E6E0D6] pb-2">
              <span className="text-[11px] font-mono font-bold text-stone-500 uppercase tracking-wider">
                POPULATION & CULTURAL COMPOSITION
              </span>
              <span className="text-[11px] font-mono text-stone-400">
                {cultureBreakdownToDisplay.length} Factions Tracked
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-sans pt-1">
              {cultureBreakdownToDisplay.map((item, idx) => {
                const groupName = item.group || item.party || `Group ${idx + 1}`;
                const percentage = item.percentage !== undefined ? item.percentage : item.pct || 0;
                return (
                  <div key={idx} className="flex items-center justify-between py-1 border-b border-[#E6E0D6]/40 last:border-0">
                    <span className="text-stone-800 font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-stone-800 shrink-0" />
                      {groupName}
                    </span>
                    <span className="font-mono font-bold text-stone-900">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default EntityDetailModal;
