import React, { useState, useMemo } from 'react';
import Modal from '../ui/Modal';
import Tabs from '../ui/Tabs';
import EmptyState from '../ui/EmptyState';
import MetricCard from './MetricCard';
import { Shield, MapPin, Crown, FileQuestion } from 'lucide-react';

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

  const tabs = useMemo(() => {
    if (Array.isArray(entityDetails?.tabs) && entityDetails.tabs.length > 0) {
      return entityDetails.tabs.map((t) => ({
        id: t.tabKey || t.id,
        label: t.label,
      }));
    }
    return DEFAULT_TABS;
  }, [entityDetails]);

  if (!entity || !isOpen) return null;

  const title = entityDetails.name || entityDetails.title || 'Entity Details';
  const Icon = type === 'nation' ? Shield : type === 'region' ? MapPin : Crown;

  const subtitle =
    type === 'region'
      ? entityDetails.nationName ? `Region of ${entityDetails.nationName}` : 'Region'
      : type === 'leader'
      ? entityDetails.title ? `${entityDetails.title}` : 'Leader'
      : entityDetails.governmentType ? `Nation · ${entityDetails.governmentType}` : 'Nation';

  const governanceBadges = entityDetails.governanceBadges || [];
  const riskTags = entityDetails.riskTags || [];
  const cultureBreakdown = entityDetails.cultureBreakdown || [];
  const metricsMap = entityDetails.metrics || {};
  const currentTabMetrics = metricsMap[activeTab] || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-3xl">
      <div className="space-y-6 text-ink">
        {/* Category Tabs */}
        <div className="flex justify-center border-b border-rule pb-3">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />
        </div>

        {/* Entity Title & Badges */}
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
            {governanceBadges.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {governanceBadges.map((badge, idx) => {
                  const label = typeof badge === 'object' ? badge.label : badge;
                  const color = typeof badge === 'object' ? badge.color : 'default';
                  return (
                    <span
                      key={idx}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold border ${
                        color === 'red' || color === 'amber'
                          ? 'border-red-300 text-red-700 bg-red-50'
                          : 'border-rule bg-paper text-ink'
                      }`}
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Risk Tags */}
        {riskTags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {riskTags.map((tag, idx) => {
              const label = typeof tag === 'object' ? tag.label : tag;
              return (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded bg-ground/80 border border-rule text-[11px] font-medium text-ink/70"
                >
                  {label}
                </span>
              );
            })}
          </div>
        )}

        {/* Metrics Grid for active tab */}
        {currentTabMetrics.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {currentTabMetrics.map((m) => (
              <MetricCard key={m.id || m.metricKey} metric={m} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FileQuestion}
            title="No telemetry available"
            description="No metrics or telemetry recorded for this section in the current year."
            className="p-6"
          />
        )}

        {/* Culture / Factions breakdown (Overview tab if present) */}
        {activeTab === 'overview' && cultureBreakdown.length > 0 && (
          <div className="bg-paper border border-rule rounded-card p-5 space-y-4 mt-4">
            <div className="flex items-center justify-between border-b border-rule pb-3">
              <span className="text-xs font-mono font-bold text-ink/70 uppercase tracking-wider">
                Population & Cultural Composition
              </span>
              <span className="text-xs font-mono text-ink/50">
                {cultureBreakdown.length} Factions Tracked
              </span>
            </div>

            <div className="space-y-2 text-xs font-sans">
              {cultureBreakdown.map((item, idx) => {
                const groupName = item.group || item.party || `Group ${idx + 1}`;
                const percentage = item.percentage !== undefined ? item.percentage : item.pct || 0;
                return (
                  <div key={idx} className="flex items-center justify-between py-1 border-b border-rule/40">
                    <span className="text-ink/80 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-accent" />
                      {groupName}
                    </span>
                    <span className="font-mono font-bold text-ink">{percentage}%</span>
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
