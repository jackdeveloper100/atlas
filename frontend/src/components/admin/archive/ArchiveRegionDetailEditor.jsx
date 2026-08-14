import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, ArrowLeft, Save, Edit2 } from 'lucide-react';
import adminService from '../../../services/admin.service';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import TagListEditor from '../../ui/TagListEditor';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { useToast } from '../../ui/Toast';

export function ArchiveRegionDetailEditor({ year, entityType, entity, tabs = [], onBack, onUpdate }) {
  const { addToast } = useToast();
  const [activeTabKey, setActiveTabKey] = useState(tabs[0]?.tabKey || 'overview');

  const [governanceBadges, setGovernanceBadges] = useState([]);
  const [riskTags, setRiskTags] = useState([]);
  const [cultureBreakdown, setCultureBreakdown] = useState([]);
  const [savingDetails, setSavingDetails] = useState(false);

  // Metrics for entity
  const [metrics, setMetrics] = useState([]);
  const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState(null);
  const [deleteMetricId, setDeleteMetricId] = useState(null);

  // Metric Form State
  const [metricKey, setMetricKey] = useState('');
  const [label, setLabel] = useState('');
  const [val, setVal] = useState('');
  const [numericVal, setNumericVal] = useState('');
  const [unit, setUnit] = useState('');
  const [displayType, setDisplayType] = useState('number');
  const [seriesPoints, setSeriesPoints] = useState([]);

  useEffect(() => {
    loadDetailsAndMetrics();
  }, [year, entityType, entity]);

  async function loadDetailsAndMetrics() {
    try {
      const yearRes = await adminService.getArchiveYear(year);
      if (yearRes.success && yearRes.data) {
        const entityKey = `${entityType}:${entity.id}`;
        const entObj = yearRes.data.entities?.[entityKey] || {};
        setGovernanceBadges(entObj.governanceBadges || []);
        setRiskTags(entObj.riskTags || []);
        setCultureBreakdown(entObj.cultureBreakdown || []);

        const allMetrics = [];
        if (entObj.metrics) {
          Object.keys(entObj.metrics).forEach((tk) => {
            const tabObj = tabs.find((t) => (t.tabKey || t.id) === tk);
            entObj.metrics[tk].forEach((m) => {
              allMetrics.push({ ...m, tabKey: tk, tabId: tabObj?.id || tk });
            });
          });
        }
        setMetrics(allMetrics);
      }
    } catch (err) {
      console.error('[ArchiveRegionDetailEditor] Error loading details:', err);
    }
  }

  const handleSaveDetails = async () => {
    try {
      setSavingDetails(true);
      const res = await adminService.updateEntityDetails(year, entityType, entity.id, {
        governanceBadges,
        riskTags,
        cultureBreakdown,
      });

      if (res.success) {
        addToast('Entity details (badges/tags/culture) saved.', 'success');
        if (onUpdate) onUpdate();
      } else {
        addToast(res.error || 'Failed to save details.', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Failed to save details.', 'error');
    } finally {
      setSavingDetails(false);
    }
  };

  const openCreateMetric = () => {
    setEditingMetric(null);
    setMetricKey(`metric_${Date.now()}`);
    setLabel('');
    setVal('');
    setNumericVal('');
    setUnit('');
    setDisplayType('number');
    setSeriesPoints([]);
    setIsMetricModalOpen(true);
  };

  const openEditMetric = (m) => {
    setEditingMetric(m);
    setMetricKey(m.metricKey || '');
    setLabel(m.label || '');
    setVal(m.value || '');
    setNumericVal(m.numericValue !== null && m.numericValue !== undefined ? m.numericValue : '');
    setUnit(m.unit || '');
    setDisplayType(m.displayType || 'number');
    setSeriesPoints(m.series || []);
    setIsMetricModalOpen(true);
  };

  const handleSaveMetric = async (e) => {
    e.preventDefault();
    const currentTabObj = tabs.find((t) => (t.tabKey || t.id) === activeTabKey);
    const payload = {
      tabId: currentTabObj?.id || activeTabKey,
      metricKey,
      label,
      value: val || String(numericVal),
      numericValue: numericVal !== '' ? Number(numericVal) : null,
      unit,
      displayType,
      series: seriesPoints,
    };

    try {
      let res;
      if (editingMetric) {
        res = await adminService.updateMetric(year, editingMetric.id, payload);
      } else {
        res = await adminService.createMetric(year, entityType, entity.id, payload);
      }

      if (res.success) {
        addToast(editingMetric ? 'Metric updated.' : 'Metric created.', 'success');
        setIsMetricModalOpen(false);
        loadDetailsAndMetrics();
        if (onUpdate) onUpdate();
      } else {
        addToast(res.error || 'Metric save failed.', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Metric save failed.', 'error');
    }
  };

  const handleDeleteMetric = async () => {
    if (!deleteMetricId) return;
    try {
      const res = await adminService.deleteMetric(year, deleteMetricId);
      if (res.success) {
        addToast('Metric deleted.', 'success');
        loadDetailsAndMetrics();
        if (onUpdate) onUpdate();
      } else {
        addToast(res.error || 'Delete failed.', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Delete failed.', 'error');
    }
  };

  const currentTabMetrics = metrics.filter((m) => m.tabKey === activeTabKey);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action */}
      <div className="flex justify-between items-center bg-paper p-4 border border-rule rounded-card">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <h2 className="text-xl font-bold font-display text-ink">{entity.name || entity.title} Details</h2>
            <p className="text-xs text-ink/60 capitalize">{entityType} · Year {year}</p>
          </div>
        </div>
        <Button onClick={handleSaveDetails} disabled={savingDetails}>
          <Save className="w-4 h-4 mr-1" /> Save Badges & Lore
        </Button>
      </div>

      {/* Badges, Risk Tags, Culture Breakdown Editor */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TagListEditor
          label="Governance Badges"
          mode="badge"
          items={governanceBadges}
          onChange={setGovernanceBadges}
        />
        <TagListEditor
          label="Risk & Lore Tags"
          mode="string"
          items={riskTags}
          onChange={setRiskTags}
        />
        <TagListEditor
          label="Population Composition"
          mode="culture"
          items={cultureBreakdown}
          onChange={setCultureBreakdown}
        />
      </div>

      {/* Tabs & Metrics Builder Section */}
      <div className="bg-paper p-6 border border-rule rounded-card space-y-4">
        <div className="flex justify-between items-center border-b border-rule pb-3">
          <div className="flex gap-2">
            {tabs.map((t) => {
              const k = t.tabKey || t.id;
              const isAct = k === activeTabKey;
              return (
                <button
                  key={k}
                  onClick={() => setActiveTabKey(k)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    isAct ? 'bg-black text-white border-black' : 'bg-ground text-ink border-rule hover:bg-paper'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <Button size="sm" onClick={openCreateMetric}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Metric to {tabs.find((t) => (t.tabKey || t.id) === activeTabKey)?.label}
          </Button>
        </div>

        {/* Current Tab Metrics List */}
        {currentTabMetrics.length === 0 ? (
          <div className="p-8 text-center text-xs text-ink/50">
            No custom metrics configured for section "{activeTabKey}". Click above to add one.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentTabMetrics.map((m) => (
              <div key={m.id} className="bg-ground/50 p-4 border border-rule rounded-lg flex justify-between items-start">
                <div>
                  <div className="text-[10px] font-mono uppercase text-ink/60 font-bold">{m.label}</div>
                  <div className="text-xl font-bold font-serif text-ink mt-1">
                    {m.value || m.numericValue} {m.unit}
                  </div>
                  <div className="text-[11px] font-mono text-ink/50 mt-1">
                    Display: {m.displayType} · Points: {m.series?.length || 0}
                  </div>
                </div>

                <div className="flex gap-1">
                  <button onClick={() => openEditMetric(m)} className="p-1 hover:bg-paper rounded">
                    <Edit2 className="w-4 h-4 text-ink/70" />
                  </button>
                  <button onClick={() => setDeleteMetricId(m.id)} className="p-1 hover:bg-rose-50 rounded">
                    <Trash2 className="w-4 h-4 text-rose-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* METRIC MODAL VIA PORTAL */}
      {isMetricModalOpen &&
        createPortal(
          <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
            <div className="w-full max-w-lg bg-paper border border-rule rounded-2xl p-6 text-ink shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold font-display">{editingMetric ? 'Edit Metric' : 'Add Metric'}</h3>
              <form onSubmit={handleSaveMetric} className="space-y-3">
                <div>
                  <label className="block text-xs uppercase font-mono mb-1">Metric Label</label>
                  <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Gross Regional Product" required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs uppercase font-mono mb-1">Display Value (Text)</label>
                    <Input value={val} onChange={(e) => setVal(e.target.value)} placeholder="e.g. 113,663" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-mono mb-1">Numeric Value</label>
                    <Input type="number" value={numericVal} onChange={(e) => setNumericVal(e.target.value)} placeholder="113663" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs uppercase font-mono mb-1">Unit</label>
                    <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. USD, Troops, %" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-mono mb-1">Display Type</label>
                    <select
                      value={displayType}
                      onChange={(e) => setDisplayType(e.target.value)}
                      className="w-full text-xs font-mono p-2 bg-paper border border-rule rounded"
                    >
                      <option value="number">Number</option>
                      <option value="percentage">Percentage</option>
                      <option value="currency">Currency</option>
                      <option value="progress">Progress Bar</option>
                      <option value="sparkline">Sparkline Chart</option>
                      <option value="bar">Bar Chart</option>
                      <option value="line">Line Chart</option>
                      <option value="badge">Badge</option>
                      <option value="text">Text</option>
                    </select>
                  </div>
                </div>

                {/* Sparkline Points Sequence Editor */}
                {(displayType === 'sparkline' || displayType === 'bar' || displayType === 'line') && (
                  <TagListEditor
                    label="Chart Series Points Sequence"
                    mode="series"
                    items={seriesPoints}
                    onChange={setSeriesPoints}
                  />
                )}

                <div className="pt-4 flex justify-end gap-2 border-t border-rule">
                  <Button variant="ghost" type="button" onClick={() => setIsMetricModalOpen(false)}>Cancel</Button>
                  <Button type="submit">Save Metric</Button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      <ConfirmDialog
        isOpen={deleteMetricId !== null}
        onClose={() => setDeleteMetricId(null)}
        onConfirm={handleDeleteMetric}
        title="Delete Metric?"
        message="Are you sure you want to delete this metric?"
      />
    </div>
  );
}

export default ArchiveRegionDetailEditor;
