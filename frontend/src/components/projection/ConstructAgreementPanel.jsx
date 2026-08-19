import React, { useState } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { useToast } from '../ui/Toast';

export function ConstructAgreementPanel({ region, onClose }) {
  const { addToast } = useToast();

  const regionTitle = region?.name || 'Amber Vale';

  const [partyA, setPartyA] = useState('Grassroots Congress');
  const [partyB, setPartyB] = useState('Cooperative Circle');
  const [termQuarters, setTermQuarters] = useState('8 quarters');
  const [visibility, setVisibility] = useState('Public');
  const [proposalTab, setProposalTab] = useState('Public');

  const handleTableForVote = () => {
    addToast({
      type: 'success',
      title: 'Proposal Tabled',
      message: `Agreement between ${partyA} and ${partyB} tabled for vote in ${regionTitle}.`,
    });
  };

  return (
    <div className="w-full max-w-lg bg-[#FAF7F2] border border-[#E6E0D6] rounded-3xl shadow-2xl p-5 sm:p-6 text-stone-900 font-sans space-y-5 max-h-[88vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-stone-300/80">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#E6E0D6] pb-3">
        <h2 className="font-serif text-2xl font-extrabold text-stone-900 tracking-tight">
          Construct agreement
        </h2>
        <span className="text-xs font-mono text-stone-500">
          linked to <strong className="font-bold text-stone-900">{regionTitle}</strong>
        </span>
      </div>

      {/* Party A Card */}
      <div className="bg-white border border-[#E6E0D6] border-l-4 border-l-[#7A4B22] rounded-2xl p-4 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <span className="font-mono text-xs font-bold text-stone-400">A</span>
            <div className="relative flex-1">
              <select
                value={partyA}
                onChange={(e) => setPartyA(e.target.value)}
                className="w-full bg-white border border-[#E6E0D6] rounded-xl px-3 py-2 text-sm font-bold text-stone-900 appearance-none pr-8 cursor-pointer focus:outline-none focus:border-stone-500"
              >
                <option>Grassroots Congress</option>
                <option>Amber Vale (regional authority)</option>
                <option>Cooperative Circle</option>
                <option>People's Congress</option>
              </select>
              <ChevronDown className="w-4 h-4 text-stone-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 border border-dashed border-stone-300 rounded-lg text-xs font-mono font-bold text-stone-700 hover:bg-stone-50 transition-all cursor-pointer whitespace-nowrap"
          >
            + Commitment
          </button>
        </div>
        <div className="text-xs font-mono text-stone-500 pl-5">
          opposition · 19.4%
        </div>
        <div className="text-xs font-sans italic text-stone-400 pl-5">
          No commitment.
        </div>
      </div>

      {/* Party B Card */}
      <div className="bg-white border border-[#E6E0D6] border-l-4 border-l-[#2B4C7E] rounded-2xl p-4 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <span className="font-mono text-xs font-bold text-stone-400">B</span>
            <div className="relative flex-1">
              <select
                value={partyB}
                onChange={(e) => setPartyB(e.target.value)}
                className="w-full bg-white border border-[#E6E0D6] rounded-xl px-3 py-2 text-sm font-bold text-stone-900 appearance-none pr-8 cursor-pointer focus:outline-none focus:border-stone-500"
              >
                <option>Cooperative Circle</option>
                <option>Amber Vale (regional authority)</option>
                <option>Grassroots Congress</option>
                <option>People's Congress</option>
              </select>
              <ChevronDown className="w-4 h-4 text-stone-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 border border-dashed border-stone-300 rounded-lg text-xs font-mono font-bold text-stone-700 hover:bg-stone-50 transition-all cursor-pointer whitespace-nowrap"
          >
            + Commitment
          </button>
        </div>
        <div className="text-xs font-mono text-stone-500 pl-5">
          ruling regional party · 24.8%
        </div>
        <div className="text-xs font-sans italic text-stone-400 pl-5">
          No commitment.
        </div>
      </div>

      {/* Add Party Row */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="px-3.5 py-1.5 border border-dashed border-stone-300 rounded-xl text-xs font-bold text-stone-800 hover:bg-stone-50 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add party</span>
        </button>
        <span className="text-xs text-stone-400 font-sans">2 of 5 parties</span>
      </div>

      {/* Term & Visibility Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-3">
          <div>
            <label className="block text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider mb-1">
              TERM
            </label>
            <div className="relative">
              <select
                value={termQuarters}
                onChange={(e) => setTermQuarters(e.target.value)}
                className="bg-white border border-[#E6E0D6] rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-stone-900 appearance-none pr-8 cursor-pointer focus:outline-none"
              >
                <option>4 quarters</option>
                <option>8 quarters</option>
                <option>12 quarters</option>
                <option>16 quarters</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-stone-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider mb-1">
              VISIBILITY
            </label>
            <div className="relative">
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="bg-white border border-[#E6E0D6] rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-stone-900 appearance-none pr-8 cursor-pointer focus:outline-none"
              >
                <option>Public</option>
                <option>Covert</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-stone-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
        <p className="text-xs text-stone-500 font-sans leading-snug max-w-xs">
          Longer terms raise enactment cost, lower per-quarter burden.
        </p>
      </div>

      {/* Dark Summary Container */}
      <div className="bg-[#1C1C1E] rounded-2xl p-4.5 text-white space-y-3.5 shadow-md border border-stone-800 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="block text-[10px] font-mono font-bold uppercase text-stone-400">TO ENACT</span>
            <span className="font-mono text-sm font-bold text-stone-100">–</span>
            <span className="block text-[10px] text-stone-400 mt-0.5">name parties, add commitments</span>
          </div>
          <div>
            <span className="block text-[10px] font-mono font-bold uppercase text-stone-400">TO REVOKE</span>
            <span className="font-mono text-sm font-bold text-stone-100">–</span>
            <span className="block text-[10px] text-stone-400 mt-0.5">once in force</span>
          </div>
          <div>
            <span className="block text-[10px] font-mono font-bold uppercase text-stone-400">TO SUSTAIN</span>
            <span className="font-mono text-sm font-bold text-stone-100">–</span>
            <span className="block text-[10px] text-stone-400 mt-0.5">at expiry</span>
          </div>
          <div>
            <span className="block text-[10px] font-mono font-bold uppercase text-stone-400">TERM</span>
            <span className="font-mono text-sm font-bold text-stone-100">{termQuarters.split(' ')[0]} qtr</span>
            <span className="block text-[10px] text-stone-400 mt-0.5">lapses after {termQuarters.split(' ')[0]}</span>
          </div>
        </div>

        <hr className="border-t border-stone-800 my-2" />

        <div className="text-xs font-mono text-stone-400">
          Name at least two parties and add one commitment.
        </div>

        <button
          type="button"
          onClick={handleTableForVote}
          className="w-full py-2.5 bg-[#4A4A4D] hover:bg-[#5A5A5D] text-stone-200 font-bold text-sm rounded-xl transition-all shadow-xs text-center cursor-pointer"
        >
          Table for vote
        </button>
      </div>

      {/* Proposals Filter Pill: Public | Covert */}
      <div className="pt-2">
        <div className="inline-flex items-center gap-1 bg-white border border-[#E6E0D6] p-1 rounded-full text-xs shadow-2xs">
          <button
            type="button"
            onClick={() => setProposalTab('Public')}
            className={`px-4 py-1 rounded-full font-bold transition-all cursor-pointer ${proposalTab === 'Public' ? 'bg-black text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
          >
            Public
          </button>
          <button
            type="button"
            onClick={() => setProposalTab('Covert')}
            className={`px-4 py-1 rounded-full font-bold transition-all cursor-pointer ${proposalTab === 'Covert' ? 'bg-black text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
          >
            Covert
          </button>
        </div>
      </div>

      {/* Proposals under vote Section */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-stone-900">
            Proposals under vote
          </h3>
          <span className="px-2 py-0.5 border border-[#E6E0D6] bg-white rounded text-xs font-mono font-bold text-stone-500">
            1
          </span>
        </div>

        {/* Proposals under vote Card */}
        <div className="bg-white border border-[#E6E0D6] rounded-2xl p-4 space-y-3 shadow-2xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-serif font-bold text-base text-stone-900">
                Amber Vale (regional authority) ⇄ Cooperative Circle
              </h4>
              <p className="text-xs text-stone-500 font-sans mt-0.5">
                2 parties · 8 quarters
              </p>
            </div>
            <span className="px-2 py-0.5 rounded border border-[#EBDCB9] bg-[#FAF5EA] text-[#7E652B] font-mono text-[10px] font-bold uppercase shrink-0">
              UNDER VOTE
            </span>
          </div>

          {/* Commitments List */}
          <div className="space-y-1 text-xs text-stone-700 font-sans leading-relaxed">
            <p>→ Amber Vale (regional authority) → Cooperative Circle: Sector directorship (Industry)</p>
            <p>→ Cooperative Circle → Amber Vale (regional authority): Meet production quota (Vantor-IV MBT, 60 units/qtr)</p>
          </div>

          {/* Vote Progress Bar */}
          <div className="space-y-1">
            <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden flex">
              <div className="bg-[#4E6C3A] h-full" style={{ width: '71%' }} />
              <div className="bg-[#9E3E26] h-full flex-1" />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-stone-500">
              <span>For 0.71</span>
              <span className="text-stone-400">needs 1.62</span>
              <span>0.29 Against</span>
            </div>
          </div>

          {/* Metrics & Action Buttons Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-[#E6E0D6]/60">
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <div>
                <span className="text-stone-400 block text-[9px]">NET</span>
                <span className="font-bold text-stone-900">+0.42</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[9px]">MOMENTUM</span>
                <span className="font-bold text-stone-900">+0.11/qtr</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[9px]">PROJECTION</span>
                <span className="font-bold text-stone-900">~11 qtr</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg border border-[#3E6C3A] text-[#3E6C3A] hover:bg-emerald-50 text-xs font-bold transition-colors cursor-pointer"
              >
                Lend weight
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg border border-[#9E3E26] text-[#9E3E26] hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
              >
                Move against
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active proposals Section */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-stone-900">
            Active proposals
          </h3>
          <span className="px-2 py-0.5 border border-[#E6E0D6] bg-white rounded text-xs font-mono font-bold text-stone-500">
            1
          </span>
        </div>

        {/* Active proposals Card */}
        <div className="bg-white border border-[#E6E0D6] rounded-2xl p-4 space-y-3 shadow-2xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-serif font-bold text-base text-stone-900">
                Continental Trust ⇄ Ashen Run (capital)
              </h4>
              <p className="text-xs text-stone-500 font-sans mt-0.5">
                2 parties · 20 quarters
              </p>
            </div>
            <span className="px-2 py-0.5 rounded border border-[#CBE0C7] bg-[#F1F6F0] text-[#3E6C3A] font-mono text-[10px] font-bold uppercase shrink-0">
              IN FORCE
            </span>
          </div>

          {/* Commitments List */}
          <div className="space-y-1 text-xs text-stone-700 font-sans leading-relaxed">
            <p>→ Continental Trust → Ashen Run (capital): Cede to state control (Heavy manufacturing, 30 % state-held)</p>
            <p>→ Ashen Run (capital) → Continental Trust: Capital investment (2400 total)</p>
          </div>

          {/* Vote Progress Bar */}
          <div className="space-y-1">
            <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden flex">
              <div className="bg-[#4E6C3A] h-full" style={{ width: '92%' }} />
              <div className="bg-[#9E3E26] h-full flex-1" />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-stone-500">
              <span>For 2.10</span>
              <span className="text-stone-400">needs 1.94</span>
              <span>0.16 Against</span>
            </div>
          </div>

          {/* Metrics & Action Buttons Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-[#E6E0D6]/60">
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <div>
                <span className="text-stone-400 block text-[9px]">NET</span>
                <span className="font-bold text-stone-900">+1.94</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[9px]">MOMENTUM</span>
                <span className="font-bold text-stone-900">+0.18/qtr</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[9px]">PROJECTION</span>
                <span className="font-bold text-stone-900">–</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg border border-[#9E3E26] text-[#9E3E26] hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
              >
                Revoke (1.40)
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg border border-[#7E652B] text-[#7E652B] hover:bg-amber-50 text-xs font-bold transition-colors cursor-pointer"
              >
                Sustain (0.74)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConstructAgreementPanel;
