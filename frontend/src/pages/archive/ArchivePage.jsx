import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Shield, MapPin, Crown, ScrollText } from 'lucide-react';
import useArchiveYear from '../../hooks/useArchiveYear';
import YearDisplay from '../../components/archive/YearDisplay';
import YearScrubber from '../../components/archive/YearScrubber';
import NationsTable from '../../components/archive/NationsTable';
import RegionsTable from '../../components/archive/RegionsTable';
import LeadersTable from '../../components/archive/LeadersTable';
import EventsFeed from '../../components/archive/EventsFeed';
import EntityDetailModal from '../../components/archive/EntityDetailModal';
import InteractiveWorldMap from '../../components/archive/InteractiveWorldMap';
import Tabs from '../../components/ui/Tabs';
import { TableSkeleton } from '../../components/ui/Skeleton';
import ErrorState from '../../components/ui/ErrorState';
import LockedState from '../../components/ui/LockedState';

export function ArchivePage() {
  const { year: yearParam } = useParams();
  const navigate = useNavigate();
  const parsedYearParam = yearParam !== undefined ? parseInt(yearParam, 10) : NaN;

  const {
    selectedYear,
    setSelectedYear,
    publishedYears,
    currentArchiveData,
    isLoading,
    error,
    minYear,
    maxYear,
    refreshSnapshot,
  } = useArchiveYear(Number.isNaN(parsedYearParam) ? 0 : parsedYearParam);

  const [activeTab, setActiveTab] = useState('nations');
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedEntityType, setSelectedEntityType] = useState('nation');

  const didInitFromParam = useRef(false);
  useEffect(() => {
    if (didInitFromParam.current) return;
    if (!Number.isNaN(parsedYearParam) && parsedYearParam !== selectedYear) {
      setSelectedYear(parsedYearParam);
    }
    didInitFromParam.current = true;
  }, [parsedYearParam, selectedYear, setSelectedYear]);

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

  const nations = currentArchiveData?.nations || [];
  const regions = currentArchiveData?.regions || [];
  const leaders = currentArchiveData?.leaders || [];
  const events = currentArchiveData?.events || [];
  const entityDetailsMap = currentArchiveData?.entities || {};

  const nationMap = useMemo(() => {
    const map = {};
    nations.forEach((n) => {
      map[n.id] = n;
    });
    return map;
  }, [nations]);

  const tabsConfig = [
    { id: 'nations', label: 'Nations', icon: Shield, count: nations.length },
    { id: 'regions', label: 'Regions', icon: MapPin, count: regions.length },
    { id: 'leaders', label: 'Leaders', icon: Crown, count: leaders.length },
    { id: 'events', label: 'Events Feed', icon: ScrollText, count: events.length },
  ];

  // Compose full data object for EntityDetailModal from entities map
  const selectedEntityFullData = useMemo(() => {
    if (!selectedEntity || !selectedEntity.id) return null;
    const key = `${selectedEntityType}:${selectedEntity.id}`;
    const extra = entityDetailsMap[key] || {};
    return {
      ...selectedEntity,
      nationName: selectedEntity.nationId ? nationMap[selectedEntity.nationId]?.name : null,
      tabs: currentArchiveData?.tabs || [],
      ...extra,
    };
  }, [selectedEntity, selectedEntityType, entityDetailsMap, nationMap, currentArchiveData]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-300">
      {/* Top Floating Control Bar */}
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

      {/* Year Overview Display Card */}
      <YearDisplay selectedYear={selectedYear} snapshot={currentArchiveData} />

      {/* Interactive World Map */}
      <InteractiveWorldMap
        regions={regions}
        nations={nations}
        selectedRegionId={selectedEntity?.id}
        onSelectRegion={(reg) => handleOpenDetail(reg, 'region')}
      />

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
          <div className="flex justify-center">
            <Tabs
              tabs={tabsConfig}
              activeTab={activeTab}
              onChange={setActiveTab}
              variant="pills"
            />
          </div>

          <div className="pt-2">
            {activeTab === 'nations' && (
              <NationsTable
                nations={nations}
                leaders={leaders}
                onSelectNation={(n) => handleOpenDetail(n, 'nation')}
              />
            )}

            {activeTab === 'regions' && (
              <RegionsTable
                regions={regions}
                nations={nations}
                onSelectRegion={(r) => handleOpenDetail(r, 'region')}
              />
            )}

            {activeTab === 'leaders' && (
              <LeadersTable
                leaders={leaders}
                nations={nations}
                currentYear={selectedYear}
                onSelectLeader={(l) => handleOpenDetail(l, 'leader')}
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
        entityData={selectedEntityFullData}
        type={selectedEntityType}
        currentYear={selectedYear}
        isOpen={Boolean(selectedEntity)}
        onClose={handleCloseDetail}
      />
    </div>
  );
}

export default ArchivePage;
