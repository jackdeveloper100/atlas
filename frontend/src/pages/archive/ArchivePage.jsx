import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Shield, MapPin, Crown, ScrollText } from 'lucide-react';
import useSnapshot from '../../hooks/useSnapshot';
import YearDisplay from '../../components/archive/YearDisplay';
import YearScrubber from '../../components/archive/YearScrubber';
import NationsTable from '../../components/archive/NationsTable';
import RegionsTable from '../../components/archive/RegionsTable';
import LeadersTable from '../../components/archive/LeadersTable';
import EventsFeed from '../../components/archive/EventsFeed';
import EntityDetailModal from '../../components/archive/EntityDetailModal';
import Tabs from '../../components/ui/Tabs';
import Skeleton, { TableSkeleton } from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import LockedState from '../../components/ui/LockedState';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

/**
 * ArchivePage Main View Component
 * Full year-scrubbing Archive UI consuming published simulation snapshot data.
 */
export function ArchivePage() {
  const { year: yearParam } = useParams();
  const navigate = useNavigate();
  const parsedYearParam = yearParam !== undefined ? parseInt(yearParam, 10) : NaN;

  const {
    selectedYear,
    setSelectedYear,
    publishedYears,
    currentSnapshot,
    isLoading,
    isLoadingYears,
    error,
    minYear,
    maxYear,
    refreshSnapshot,
  } = useSnapshot(Number.isNaN(parsedYearParam) ? 0 : parsedYearParam);

  const [activeTab, setActiveTab] = useState('nations');
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedEntityType, setSelectedEntityType] = useState('nation');

  // Sync the :year route param -> selected year (deep-linking into /archive/:year)
  const didInitFromParam = useRef(false);
  useEffect(() => {
    if (didInitFromParam.current) return;
    if (!Number.isNaN(parsedYearParam) && parsedYearParam !== selectedYear) {
      setSelectedYear(parsedYearParam);
    }
    didInitFromParam.current = true;
  }, [parsedYearParam, selectedYear, setSelectedYear]);

  // Sync selected year -> URL, so scrubbing is shareable/deep-linkable
  useEffect(() => {
    if (!didInitFromParam.current) return;
    navigate(`/archive/${selectedYear}`, { replace: true });
  }, [selectedYear, navigate]);

  const handleOpenDetail = (entity, type) => {
    setSelectedEntity(entity);
    setSelectedEntityType(type);
  };

  const handleCloseDetail = () => {
    setSelectedEntity(null);
  };

  // Real snapshot shape: nations/regions/leaders/politicalStates/events are
  // top-level siblings of `world` (which only holds aggregate counts) — see
  // engine/src/snapshots/SNAPSHOT_SCHEMA.md.
  const nations = currentSnapshot?.nations || [];
  const regions = currentSnapshot?.regions || [];
  const leaders = currentSnapshot?.leaders || [];
  const politicalStates = currentSnapshot?.politicalStates || [];
  const events = currentSnapshot?.events || [];

  const nationMap = useMemo(() => {
    const map = {};
    nations.forEach((n) => {
      map[n.id] = n;
    });
    return map;
  }, [nations]);

  const leaderMap = useMemo(() => {
    const map = {};
    leaders.forEach((l) => {
      map[l.id] = l;
    });
    return map;
  }, [leaders]);

  const politicalStateMap = useMemo(() => {
    const map = {};
    politicalStates.forEach((p) => {
      map[p.nationId] = p;
    });
    return map;
  }, [politicalStates]);

  const tabsConfig = [
    { id: 'nations', label: 'Nations', icon: Shield, count: nations.length },
    { id: 'regions', label: 'Regions', icon: MapPin, count: regions.length },
    { id: 'leaders', label: 'Leaders', icon: Crown, count: leaders.length },
    { id: 'events', label: 'Events Feed', icon: ScrollText, count: events.length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-300">
      {/* Top Floating Control Bar matching Figma */}
      <div className="flex justify-center sticky top-20 z-30 pt-2">
        <YearScrubber
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          publishedYears={publishedYears}
          minYear={minYear}
          maxYear={maxYear}
          isLoading={isLoading}
        />
      </div>

      {/* Map Backdrop Container matching Figma sage green canvas */}
      <div className="bg-[#b8c5a8] rounded-card border border-rule p-6 min-h-[300px] relative flex flex-col justify-between overflow-hidden shadow-inner">
        <div className="flex items-center justify-between text-xs font-mono font-bold text-ink/70 z-10">
          <span>MAP CANVAS · REGION GEOGRAPHY NOT YET AVAILABLE</span>
          <span>YEAR {selectedYear} • {events.length} EVENTS RECORDED</span>
        </div>

        {/* Decorative Map SVG Outlines */}
        <div className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-center">
          <svg className="w-full h-full text-ink" viewBox="0 0 800 400" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M150 100 Q 250 50, 350 120 T 550 100 T 700 200 Q 600 320, 450 280 T 200 300 Z" />
            <path d="M100 250 Q 180 200, 280 260 T 400 350 Z" />
          </svg>
        </div>

        {/* Year Summary Metric Display */}
        {!isLoadingYears && (
          <div className="z-10 mt-auto">
            <YearDisplay
              selectedYear={selectedYear}
              snapshot={currentSnapshot}
            />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {error ? (
        error.includes('403') || error.toLowerCase().includes('subscriber') || error.toLowerCase().includes('subscription') ? (
          <LockedState
            title="ARCHIVE PRO FEATURE"
            description="Access to full historical snapshot timelines is reserved for active ATLAS Pro subscribers."
            buttonText="Upgrade to Pro"
            redirectPath="/pricing"
          />
        ) : (
          <ErrorState
            title="Unable to load snapshot data"
            message={error}
            onRetry={refreshSnapshot}
          />
        )
      ) : isLoading ? (
        <TableSkeleton rows={6} cols={4} />
      ) : (
        <div className="space-y-6">
          {/* View Selection Black Pill Tabs */}
          <div className="flex justify-center">
            <Tabs
              tabs={tabsConfig}
              activeTab={activeTab}
              onChange={setActiveTab}
              variant="pills"
            />
          </div>

          {/* Tab Panes */}
          <div className="pt-2">
            {activeTab === 'nations' && (
              <NationsTable
                nations={nations}
                leaders={leaders}
                politicalStates={politicalStates}
                onSelectNation={(n) =>
                  handleOpenDetail(
                    {
                      ...n,
                      politicalState: politicalStateMap[n.id],
                      currentLeader: leaderMap[n.currentLeaderId],
                    },
                    'nation'
                  )
                }
              />
            )}

            {activeTab === 'regions' && (
              <RegionsTable
                regions={regions}
                nations={nations}
                onSelectRegion={(r) =>
                  handleOpenDetail({ ...r, nation: nationMap[r.nationId] }, 'region')
                }
              />
            )}

            {activeTab === 'leaders' && (
              <LeadersTable
                leaders={leaders}
                nations={nations}
                currentYear={selectedYear}
                onSelectLeader={(l) =>
                  handleOpenDetail({ ...l, nation: nationMap[l.nationId] }, 'leader')
                }
              />
            )}

            {activeTab === 'events' && (
              <EventsFeed
                events={events}
                selectedYear={selectedYear}
              />
            )}
          </div>
        </div>
      )}

      {/* Entity Detail Drilldown Modal */}
      <EntityDetailModal
        entity={selectedEntity}
        type={selectedEntityType}
        currentYear={selectedYear}
        isOpen={Boolean(selectedEntity)}
        onClose={handleCloseDetail}
      />
    </div>
  );
}

export default ArchivePage;
