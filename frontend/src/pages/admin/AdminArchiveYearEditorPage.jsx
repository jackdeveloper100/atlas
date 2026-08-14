/**
 * AdminArchiveYearEditorPage.jsx
 *
 * Tabbed administration interface for a single archive year (/admin/archive/years/:year).
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Shield, MapPin, Crown, ScrollText, Layers, ExternalLink } from 'lucide-react';
import adminService from '../../services/admin.service';
import Button from '../../components/ui/Button';
import Tabs from '../../components/ui/Tabs';
import ArchiveGeneralForm from '../../components/admin/archive/ArchiveGeneralForm';
import ArchiveNationsManager from '../../components/admin/archive/ArchiveNationsManager';
import ArchiveRegionsManager from '../../components/admin/archive/ArchiveRegionsManager';
import ArchiveLeadersManager from '../../components/admin/archive/ArchiveLeadersManager';
import ArchiveEventsManager from '../../components/admin/archive/ArchiveEventsManager';
import ArchiveTabsManager from '../../components/admin/archive/ArchiveTabsManager';
import ArchiveRegionDetailEditor from '../../components/admin/archive/ArchiveRegionDetailEditor';

export default function AdminArchiveYearEditorPage() {
  const { year: yearParam } = useParams();
  const navigate = useNavigate();
  const year = parseInt(yearParam, 10);

  const [yearData, setYearData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  // Active entity drilldown for details/metrics editing
  const [detailEntity, setDetailEntity] = useState(null); // { type, entity }

  const loadYearData = useCallback(async () => {
    if (isNaN(year)) return;
    try {
      setLoading(true);
      setError('');
      const res = await adminService.getArchiveYear(year);
      if (res.success && res.data) {
        setYearData(res.data);
      } else {
        setError(res.error || `Failed to load data for Year ${year}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch year data');
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    loadYearData();
  }, [loadYearData]);

  if (isNaN(year)) {
    return <div className="p-8 text-center text-red-600">Invalid Year Parameter</div>;
  }

  const editorTabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'nations', label: `Nations (${yearData?.nations?.length || 0})`, icon: Shield },
    { id: 'regions', label: `Regions (${yearData?.regions?.length || 0})`, icon: MapPin },
    { id: 'leaders', label: `Leaders (${yearData?.leaders?.length || 0})`, icon: Crown },
    { id: 'events', label: `Events (${yearData?.events?.length || 0})`, icon: ScrollText },
    { id: 'tabs', label: 'Modal Tabs', icon: Layers },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-paper p-4 border border-rule rounded-xl shadow-2xs">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/archive')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Years
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold text-ink">
              {yearData?.year?.title || `Year ${year}`}
            </h1>
            <p className="text-xs font-mono text-ink/60">
              Year {year} · Status: <span className="uppercase font-bold">{yearData?.year?.status || 'draft'}</span>
            </p>
          </div>
        </div>

        <a
          href={`/archive/${year}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 bg-ground hover:bg-paper border border-rule rounded-lg text-xs font-semibold text-ink flex items-center gap-1.5 self-start sm:self-auto"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Preview Live Page</span>
        </a>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>
      ) : loading ? (
        <div className="p-12 text-center text-sm text-ink/50 animate-pulse">Loading year configuration...</div>
      ) : detailEntity ? (
        <ArchiveRegionDetailEditor
          year={year}
          entityType={detailEntity.type}
          entity={detailEntity.entity}
          tabs={yearData?.tabs || []}
          onBack={() => setDetailEntity(null)}
          onUpdate={loadYearData}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex justify-start border-b border-rule pb-2">
            <Tabs tabs={editorTabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />
          </div>

          <div className="pt-2">
            {activeTab === 'general' && (
              <ArchiveGeneralForm year={year} yearData={yearData} onUpdate={loadYearData} />
            )}

            {activeTab === 'nations' && (
              <ArchiveNationsManager
                year={year}
                nations={yearData?.nations || []}
                onUpdate={loadYearData}
                onEditEntityDetails={(type, entity) => setDetailEntity({ type, entity })}
              />
            )}

            {activeTab === 'regions' && (
              <ArchiveRegionsManager
                year={year}
                regions={yearData?.regions || []}
                nations={yearData?.nations || []}
                onUpdate={loadYearData}
                onEditEntityDetails={(type, entity) => setDetailEntity({ type, entity })}
              />
            )}

            {activeTab === 'leaders' && (
              <ArchiveLeadersManager
                year={year}
                leaders={yearData?.leaders || []}
                nations={yearData?.nations || []}
                onUpdate={loadYearData}
                onEditEntityDetails={(type, entity) => setDetailEntity({ type, entity })}
              />
            )}

            {activeTab === 'events' && (
              <ArchiveEventsManager
                year={year}
                events={yearData?.events || []}
                nations={yearData?.nations || []}
                regions={yearData?.regions || []}
                onUpdate={loadYearData}
              />
            )}

            {activeTab === 'tabs' && (
              <ArchiveTabsManager
                year={year}
                tabs={yearData?.tabs || []}
                onUpdate={loadYearData}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
