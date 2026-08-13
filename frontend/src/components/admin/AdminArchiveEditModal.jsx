/**
 * AdminArchiveEditModal.jsx
 *
 * Administrator modal for dynamically editing year-specific region metrics,
 * governance badges, risk tags, sparklines, and culture breakdowns.
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, Save, X, Plus, Trash2, MapPin } from 'lucide-react';
import adminService from '../../services/admin.service';

export default function AdminArchiveEditModal({ isOpen, onClose, year, regions = [], nations = [] }) {
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form Fields
  const [governanceBadges, setGovernanceBadges] = useState('');
  const [riskTags, setRiskTags] = useState('');

  const [gdpValue, setGdpValue] = useState('');
  const [gdpChangePct, setGdpChangePct] = useState('');
  const [gdpSparkline, setGdpSparkline] = useState('100, 105, 110, 113.6');

  const [militaryCapability, setMilitaryCapability] = useState('');
  const [personnelCount, setPersonnelCount] = useState('');
  const [militarySparkline, setMilitarySparkline] = useState('2000, 2400, 2847');

  const [reservesValue, setReservesValue] = useState('');
  const [reservesNote, setReservesNote] = useState('');
  const [reservesSparkline, setReservesSparkline] = useState('5000, 5800, 6410');

  const [stabilityValue, setStabilityValue] = useState('');
  const [stabilityTrend, setStabilityTrend] = useState('');
  const [stabilitySparkline, setStabilitySparkline] = useState('0.8, 0.7, 0.58');

  const [cultureItems, setCultureItems] = useState([
    { party: 'Cooperative Circle', pct: 24.8 },
    { party: 'Grassroots Congress', pct: 19.4 },
    { party: 'People\'s Congress', pct: 9.0 },
    { party: 'Federal Order', pct: 7.9 },
  ]);

  useEffect(() => {
    if (regions.length > 0 && !selectedRegionId) {
      setSelectedRegionId(regions[0].id);
    }
  }, [regions, selectedRegionId]);

  useEffect(() => {
    if (selectedRegionId && year !== undefined) {
      loadRegionDetails(year, selectedRegionId);
    }
  }, [selectedRegionId, year]);

  async function loadRegionDetails(yr, regId) {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      const res = await adminService.getArchiveRegionDetails(yr, regId);
      if (res.success && res.data?.details) {
        const d = res.data.details;
        setGovernanceBadges((d.governance_badges || []).join(', '));
        setRiskTags((d.risk_tags || []).join(', '));

        setGdpValue(d.gdp_value !== null && d.gdp_value !== undefined ? d.gdp_value : '');
        setGdpChangePct(d.gdp_change_pct !== null && d.gdp_change_pct !== undefined ? d.gdp_change_pct : '');
        setGdpSparkline((d.gdp_sparkline || []).join(', ') || '100, 105, 110, 113.6');

        setMilitaryCapability(d.military_capability !== null && d.military_capability !== undefined ? d.military_capability : '');
        setPersonnelCount(d.personnel_count !== null && d.personnel_count !== undefined ? d.personnel_count : '');
        setMilitarySparkline((d.military_sparkline || []).join(', ') || '2000, 2400, 2847');

        setReservesValue(d.reserves_value !== null && d.reserves_value !== undefined ? d.reserves_value : '');
        setReservesNote(d.reserves_note || '');
        setReservesSparkline((d.reserves_sparkline || []).join(', ') || '5000, 5800, 6410');

        setStabilityValue(d.stability_value !== null && d.stability_value !== undefined ? d.stability_value : '');
        setStabilityTrend(d.stability_trend || '');
        setStabilitySparkline((d.stability_sparkline || []).join(', ') || '0.8, 0.7, 0.58');

        if (d.culture_breakdown && d.culture_breakdown.length > 0) {
          setCultureItems(d.culture_breakdown);
        }
      } else {
        // Defaults for selected region from snapshot
        const reg = regions.find((r) => r.id === regId);
        setGovernanceBadges('Military Junta, Cooperative Circle, No has legislative authority');
        setRiskTags('Bloc Deadlock Risk, Extremist Activity, Resource Endowment, Quotas Met');
        setGdpValue(reg?.population ? Math.round(reg.population * 1.5) : 113663);
        setGdpChangePct(-1.4);
        setGdpSparkline('100, 105, 110, 113.6');
        setMilitaryCapability(2847);
        setPersonnelCount(18870);
        setMilitarySparkline('2000, 2400, 2847');
        setReservesValue(6410);
        setReservesNote('Drawn down twice this year');
        setReservesSparkline('5000, 5800, 6410');
        setStabilityValue(0.58);
        setStabilityTrend('Falling');
        setStabilitySparkline('0.8, 0.7, 0.58');
      }
    } catch (err) {
      console.error('Failed to load region details:', err);
    } finally {
      setLoading(false);
    }
  }

  function parseNumberList(str) {
    return str
      .split(',')
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));
  }

  function parseStringList(str) {
    return str
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!selectedRegionId) return;

    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      const targetReg = regions.find((r) => r.id === selectedRegionId);

      const payload = {
        nation_id: targetReg?.nationId || null,
        region_name: targetReg?.name || selectedRegionId,
        governance_badges: parseStringList(governanceBadges),
        risk_tags: parseStringList(riskTags),
        gdp_value: gdpValue !== '' ? parseFloat(gdpValue) : null,
        gdp_change_pct: gdpChangePct !== '' ? parseFloat(gdpChangePct) : null,
        gdp_sparkline: parseNumberList(gdpSparkline),
        military_capability: militaryCapability !== '' ? parseFloat(militaryCapability) : null,
        personnel_count: personnelCount !== '' ? parseFloat(personnelCount) : null,
        military_sparkline: parseNumberList(militarySparkline),
        reserves_value: reservesValue !== '' ? parseFloat(reservesValue) : null,
        reserves_note: reservesNote,
        reserves_sparkline: parseNumberList(reservesSparkline),
        stability_value: stabilityValue !== '' ? parseFloat(stabilityValue) : null,
        stability_trend: stabilityTrend,
        stability_sparkline: parseNumberList(stabilitySparkline),
        culture_breakdown: cultureItems,
      };

      const res = await adminService.updateArchiveRegionDetails(year, selectedRegionId, payload);
      if (res.success) {
        setMessage({ type: 'success', text: `Dynamic region details updated for Year ${year}.` });
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to save changes.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Error saving changes.' });
    } finally {
      setSaving(false);
    }
  }

  const addCultureItem = () => {
    setCultureItems([...cultureItems, { party: 'New Party', pct: 5.0 }]);
  };

  const removeCultureItem = (index) => {
    setCultureItems(cultureItems.filter((_, i) => i !== index));
  };

  const updateCultureItem = (index, field, value) => {
    const updated = [...cultureItems];
    updated[index][field] = field === 'pct' ? parseFloat(value) || 0 : value;
    setCultureItems(updated);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-paper border border-rule rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-ink">
        {/* Header */}
        <div className="px-6 py-4 border-b border-rule flex items-center justify-between bg-ground/40">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-black text-white rounded-lg">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-ink">
                Dynamic Region Details — Year {year}
              </h3>
              <p className="text-xs text-ink/60">
                Configure inspector modal metrics, badges, sparklines, and culture charts.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-ink/60 hover:text-ink hover:bg-black/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto flex-1">
          {message.text && (
            <div
              className={`p-3 rounded text-xs border ${
                message.type === 'error'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Region Selector */}
          <div>
            <label className="block text-xs uppercase font-semibold text-ink/60 mb-1">
              Select Target Region
            </label>
            <select
              value={selectedRegionId}
              onChange={(e) => setSelectedRegionId(e.target.value)}
              className="w-full px-4 py-2 border border-rule rounded bg-paper text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black"
            >
              {regions.map((r) => {
                const nation = nations.find((n) => n.id === r.nationId);
                return (
                  <option key={r.id} value={r.id}>
                    {r.name || r.id} ({nation?.name || 'Unclaimed Region'})
                  </option>
                );
              })}
            </select>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-ink/50 animate-pulse">
              Loading region details...
            </div>
          ) : (
            <>
              {/* Badges & Tags Section */}
              <div className="space-y-4 pt-2 border-t border-rule">
                <h4 className="text-xs uppercase font-bold text-ink/70 tracking-wider">
                  Governance Badges & Tag Pills
                </h4>

                <div>
                  <label className="block text-xs text-ink/60 mb-1">
                    Governance Badges (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={governanceBadges}
                    onChange={(e) => setGovernanceBadges(e.target.value)}
                    placeholder="Military Junta, Cooperative Circle, No legislative authority"
                    className="w-full px-3 py-2 border border-rule rounded text-xs focus:outline-none focus:ring-2 focus:ring-black font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs text-ink/60 mb-1">
                    Risk / Feature Tag Pills (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={riskTags}
                    onChange={(e) => setRiskTags(e.target.value)}
                    placeholder="Bloc Deadlock Risk, Extremist Activity, Resource Endowment, Quotas Met"
                    className="w-full px-3 py-2 border border-rule rounded text-xs focus:outline-none focus:ring-2 focus:ring-black font-mono"
                  />
                </div>
              </div>

              {/* Telemetry Metrics Section */}
              <div className="space-y-4 pt-4 border-t border-rule">
                <h4 className="text-xs uppercase font-bold text-ink/70 tracking-wider">
                  Telemetry Metrics & Sparklines
                </h4>

                {/* Regional GDP */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-ground/50 border border-rule rounded-lg">
                  <div>
                    <label className="block text-[11px] font-semibold text-ink/70 uppercase">Regional GDP</label>
                    <input
                      type="number"
                      value={gdpValue}
                      onChange={(e) => setGdpValue(e.target.value)}
                      placeholder="113663"
                      className="w-full px-2.5 py-1.5 border border-rule rounded text-xs bg-paper font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-ink/70 uppercase">GDP Change %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={gdpChangePct}
                      onChange={(e) => setGdpChangePct(e.target.value)}
                      placeholder="-1.4"
                      className="w-full px-2.5 py-1.5 border border-rule rounded text-xs bg-paper font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-ink/70 uppercase">Sparkline Values</label>
                    <input
                      type="text"
                      value={gdpSparkline}
                      onChange={(e) => setGdpSparkline(e.target.value)}
                      placeholder="100, 105, 110, 113.6"
                      className="w-full px-2.5 py-1.5 border border-rule rounded text-xs bg-paper font-mono"
                    />
                  </div>
                </div>

                {/* Military Capability */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-ground/50 border border-rule rounded-lg">
                  <div>
                    <label className="block text-[11px] font-semibold text-ink/70 uppercase">Military Rating</label>
                    <input
                      type="number"
                      value={militaryCapability}
                      onChange={(e) => setMilitaryCapability(e.target.value)}
                      placeholder="2847"
                      className="w-full px-2.5 py-1.5 border border-rule rounded text-xs bg-paper font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-ink/70 uppercase">Personnel Count</label>
                    <input
                      type="number"
                      value={personnelCount}
                      onChange={(e) => setPersonnelCount(e.target.value)}
                      placeholder="18870"
                      className="w-full px-2.5 py-1.5 border border-rule rounded text-xs bg-paper font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-ink/70 uppercase">Sparkline Values</label>
                    <input
                      type="text"
                      value={militarySparkline}
                      onChange={(e) => setMilitarySparkline(e.target.value)}
                      placeholder="2000, 2400, 2847"
                      className="w-full px-2.5 py-1.5 border border-rule rounded text-xs bg-paper font-mono"
                    />
                  </div>
                </div>

                {/* Reserves & Stability */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-ground/50 border border-rule rounded-lg space-y-2">
                    <label className="block text-[11px] font-semibold text-ink/70 uppercase">Reserves Value & Note</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={reservesValue}
                        onChange={(e) => setReservesValue(e.target.value)}
                        placeholder="6410"
                        className="px-2.5 py-1.5 border border-rule rounded text-xs bg-paper font-mono"
                      />
                      <input
                        type="text"
                        value={reservesNote}
                        onChange={(e) => setReservesNote(e.target.value)}
                        placeholder="Drawn down twice"
                        className="px-2.5 py-1.5 border border-rule rounded text-xs bg-paper"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-ground/50 border border-rule rounded-lg space-y-2">
                    <label className="block text-[11px] font-semibold text-ink/70 uppercase">Stability Value & Trend</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={stabilityValue}
                        onChange={(e) => setStabilityValue(e.target.value)}
                        placeholder="0.58"
                        className="px-2.5 py-1.5 border border-rule rounded text-xs bg-paper font-mono"
                      />
                      <input
                        type="text"
                        value={stabilityTrend}
                        onChange={(e) => setStabilityTrend(e.target.value)}
                        placeholder="Falling / Rising"
                        className="px-2.5 py-1.5 border border-rule rounded text-xs bg-paper"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Culture & Faction Composition Breakdown */}
              <div className="space-y-3 pt-4 border-t border-rule">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs uppercase font-bold text-ink/70 tracking-wider">
                    Culture & Faction Composition
                  </h4>
                  <button
                    type="button"
                    onClick={addCultureItem}
                    className="text-xs text-ink hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Party
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {cultureItems.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={item.party}
                        onChange={(e) => updateCultureItem(idx, 'party', e.target.value)}
                        placeholder="Party name"
                        className="flex-1 px-3 py-1.5 border border-rule rounded text-xs bg-paper"
                      />
                      <input
                        type="number"
                        step="0.1"
                        value={item.pct}
                        onChange={(e) => updateCultureItem(idx, 'pct', e.target.value)}
                        placeholder="%"
                        className="w-24 px-3 py-1.5 border border-rule rounded text-xs bg-paper font-mono"
                      />
                      <span className="text-xs text-ink/50">%</span>
                      <button
                        type="button"
                        onClick={() => removeCultureItem(idx)}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="pt-4 flex justify-end space-x-2 border-t border-rule">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium border border-rule rounded hover:bg-black/5"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={saving || loading}
              className="px-5 py-2 text-xs font-medium bg-black text-white rounded hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <Save className="w-3.5 h-3.5" />
              Save Dynamic Region Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
