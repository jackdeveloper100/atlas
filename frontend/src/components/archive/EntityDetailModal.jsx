import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Tabs from '../ui/Tabs';
import EmptyState from '../ui/EmptyState';
import { Shield, MapPin, Crown, FileQuestion } from 'lucide-react';

function MetricCard({ label, value, sublabel }) {
  return (
    <div className="bg-paper border border-rule rounded-card p-4">
      <span className="text-[11px] font-mono font-semibold text-ink-muted uppercase tracking-wider block">
        {label}
      </span>
      {sublabel && <span className="text-xs text-ink-faint block">{sublabel}</span>}
      <span className="font-mono text-xl font-bold text-ink mt-1 block">{value}</span>
    </div>
  );
}

function NotTracked({ label }) {
  return (
    <EmptyState
      icon={FileQuestion}
      title={`${label} not tracked`}
      description={`This simulation does not currently generate ${label.toLowerCase()} data.`}
      className="p-6"
    />
  );
}

const pct = (v) => (typeof v === 'number' ? `${Math.round(v * 100)}%` : null);

/**
 * EntityDetailModal Component
 * Shows only fields the snapshot schema actually provides (see
 * engine/src/snapshots/SNAPSHOT_SCHEMA.md). No invented metrics.
 */
export function EntityDetailModal({ entity, type = 'nation', currentYear, isOpen, onClose }) {
  const [subTab, setSubTab] = useState('overview');

  if (!entity || !isOpen) return null;

  const title = entity.name || entity.title || 'Entity Details';

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
        ? `Region of ${entity.nation.name}`
        : 'Region · controlling nation unknown'
      : type === 'leader'
      ? entity.nation?.name
        ? `${entity.title || 'Leader'} of ${entity.nation.name}`
        : entity.title || 'Leader'
      : `Nation · founded ${typeof entity.foundedYear === 'number' ? entity.foundedYear : 'year unknown'}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-2xl">
      <div className="space-y-6">
        {/* Category Sub-Tabs */}
        <div className="flex justify-center border-b border-rule pb-3">
          <Tabs tabs={categoryTabs} activeTab={subTab} onChange={setSubTab} variant="pills" />
        </div>

        {/* Entity Header Banner */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-md bg-ground border border-rule flex items-center justify-center shrink-0">
            <Icon className="w-8 h-8 text-ink-muted" />
          </div>
          <div className="space-y-2 flex-1">
            <div>
              <h3 className="font-sans text-xl font-bold text-ink">{title}</h3>
              <p className="text-xs text-ink-muted font-sans">{subtitle}</p>
            </div>

            {type === 'nation' && entity.politicalState?.governmentType && (
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="default" size="sm">{entity.politicalState.governmentType}</Badge>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Sub-tab Content */}
        {subTab === 'overview' && (
          <div className="space-y-4">
            {type === 'nation' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MetricCard
                  label="Population"
                  value={entity.population ? entity.population.toLocaleString() : 'N/A'}
                />
                <MetricCard
                  label="Founded"
                  value={typeof entity.foundedYear === 'number' ? `Year ${entity.foundedYear}` : 'N/A'}
                />
                <MetricCard
                  label="Current Leader"
                  value={entity.currentLeader?.name || 'Vacant / unrecorded'}
                  sublabel={entity.currentLeader?.title}
                />
                <MetricCard
                  label="Stability"
                  value={pct(entity.politicalState?.stability) ?? 'N/A'}
                />
              </div>
            )}

            {type === 'region' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MetricCard
                  label="Population"
                  value={entity.population ? entity.population.toLocaleString() : 'N/A'}
                />
                <MetricCard label="Area" value={entity.area ? `${entity.area.toLocaleString()} units²` : 'N/A'} />
                <MetricCard label="Urbanization" value={pct(entity.urbanization) ?? 'N/A'} />
                <MetricCard label="Controlling Nation" value={entity.nation?.name || 'Unclaimed'} />
              </div>
            )}

            {type === 'leader' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MetricCard
                  label="Age"
                  value={
                    typeof currentYear === 'number' && typeof entity.birthYear === 'number'
                      ? `${currentYear - entity.birthYear} yrs`
                      : 'N/A'
                  }
                  sublabel={typeof entity.birthYear === 'number' ? `Born year ${entity.birthYear}` : undefined}
                />
                <MetricCard
                  label="Ruling Since"
                  value={typeof entity.startedRulingYear === 'number' ? `Year ${entity.startedRulingYear}` : 'N/A'}
                  sublabel={
                    entity.endedRulingYear === null || entity.endedRulingYear === undefined
                      ? 'Still in power'
                      : `Until year ${entity.endedRulingYear}`
                  }
                />
                <MetricCard label="Legitimacy" value={pct(entity.legitimacy) ?? 'N/A'} />
                <MetricCard label="Influence" value={pct(entity.influence) ?? 'N/A'} />
              </div>
            )}
          </div>
        )}

        {subTab === 'political' && (
          <div className="space-y-4 text-xs font-sans">
            {type === 'nation' ? (
              <div className="bg-paper border border-rule rounded-card p-4 space-y-2">
                <h4 className="font-semibold text-sm text-ink">Government</h4>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <MetricCard
                    label="Government Type"
                    value={entity.politicalState?.governmentType || 'N/A'}
                  />
                  <MetricCard label="Centralized Power" value={pct(entity.politicalState?.centralizedPower) ?? 'N/A'} />
                </div>
                <p className="text-ink-muted pt-2">
                  {entity.politicalState?.activePolicies?.length
                    ? entity.politicalState.activePolicies.join(', ')
                    : 'No active policies recorded for this nation.'}
                </p>
              </div>
            ) : (
              <EmptyState
                icon={FileQuestion}
                title="Not tracked at this level"
                description="Political data (government type, stability, centralized power) is only tracked per-nation in this simulation, not per-region or per-leader."
                className="p-6"
              />
            )}
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
