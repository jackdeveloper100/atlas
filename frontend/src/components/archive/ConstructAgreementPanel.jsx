import React from 'react';
import { MessageSquare, Plus, ArrowLeftRight } from 'lucide-react';

/**
 * ConstructAgreementPanel Component
 * Interactive agreement construction drawer matching Figma Group 84 & Projection on nation click.png
 */
export function ConstructAgreementPanel({ entityName = 'Amber Vale', onClose }) {
  return (
    <div className="bg-paper border border-rule rounded-card p-6 space-y-6 shadow-lg max-w-xl text-ink font-sans text-xs">
      {/* Header Row */}
      <div className="flex items-center justify-between border-b border-rule pb-3">
        <div className="flex items-center gap-2 font-bold text-sm text-ink">
          <MessageSquare className="w-4 h-4 text-ink-muted" />
          <span>Construct Agreement</span>
        </div>
        <div className="text-xs text-ink-muted">
          Linked to <strong className="text-ink">{entityName}</strong>
        </div>
      </div>

      {/* Form Card 1: Regional Author */}
      <div className="bg-ground/40 border border-rule rounded-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <select className="bg-paper border border-rule rounded px-3 py-1.5 font-medium text-xs text-ink focus:outline-none w-64">
            <option>{entityName} (regional author)</option>
          </select>
          <button className="px-3 py-1 border border-dashed border-rule rounded text-ink-muted hover:border-ink transition-colors">
            + Commitment
          </button>
        </div>
        <p className="text-[11px] text-ink-faint">Regional government</p>
        <p className="text-[11px] italic text-ink-muted">No commitment.</p>
      </div>

      {/* Form Card 2: Opposition */}
      <div className="bg-ground/40 border border-rule rounded-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <select className="bg-paper border border-rule rounded px-3 py-1.5 font-medium text-xs text-ink focus:outline-none w-64">
            <option>Grassroots Congress</option>
          </select>
          <button className="px-3 py-1 border border-dashed border-rule rounded text-ink-muted hover:border-ink transition-colors">
            + Commitment
          </button>
        </div>
        <p className="text-[11px] text-ink-faint">Opposition 19.4%</p>
        <p className="text-[11px] italic text-ink-muted">No commitment.</p>
      </div>

      {/* Add Party Button */}
      <div>
        <button className="px-4 py-2 border border-dashed border-rule rounded text-xs font-medium text-ink hover:border-ink transition-colors">
          + Add Party
        </button>
      </div>

      {/* Term & Visibility Options */}
      <div className="bg-ground/40 border border-rule rounded-card p-4 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-medium text-ink-muted mb-1">Term</label>
            <select className="w-full bg-paper border border-rule rounded px-3 py-1.5 font-medium text-xs text-ink">
              <option>8 quarters</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-ink-muted mb-1">Visibility</label>
            <select className="w-full bg-paper border border-rule rounded px-3 py-1.5 font-medium text-xs text-ink">
              <option>Public</option>
            </select>
          </div>
        </div>
        <p className="text-[11px] text-ink-faint">Longer terms raise enactment cost, lower per-quarter burden.</p>
      </div>

      {/* Dark Slate Execution Box matching Figma Group 84 */}
      <div className="bg-[#383838] text-white rounded-card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">TO ENACT</span>
            <span className="font-bold text-sm mt-0.5 block">-</span>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">TO REVOKE</span>
            <span className="font-bold text-sm mt-0.5 block">-</span>
            <span className="text-[10px] text-neutral-400 block">once in force</span>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">TO SUSTAIN</span>
            <span className="font-bold text-sm mt-0.5 block">-</span>
            <span className="text-[10px] text-neutral-400 block">at expiry</span>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">TERM</span>
            <span className="font-bold text-sm mt-0.5 block">8 quarters</span>
            <span className="text-[10px] text-neutral-400 block">lapses after 8</span>
          </div>
        </div>

        <button className="w-full bg-white text-black font-bold py-3 rounded text-xs hover:bg-neutral-100 transition-colors shadow-xs">
          Table for Vote
        </button>
      </div>

      {/* Visibility Filters */}
      <div className="flex gap-2">
        <button className="px-4 py-1.5 border border-ink rounded text-xs font-semibold bg-paper text-ink">Public</button>
        <button className="px-4 py-1.5 border border-transparent rounded text-xs font-medium text-ink-muted bg-ground">Covert</button>
      </div>

      {/* Proposals under Vote */}
      <div className="space-y-3">
        <h4 className="font-bold text-ink">Proposals under Vote</h4>
        <div className="bg-ground/50 border border-rule rounded-card p-4 space-y-3">
          <div className="flex items-center gap-1.5 font-semibold text-xs text-ink">
            <span>{entityName} (regional authority)</span>
            <ArrowLeftRight className="w-3.5 h-3.5 text-ink-muted" />
            <span>Cooperative Circle</span>
          </div>
          <p className="text-[11px] text-ink-faint">2 parties • 8 quarters</p>
          <div className="space-y-1 text-[11px] text-ink-muted">
            <p>&rarr; {entityName} &rarr; Cooperative Circle: Sector directorship (industry)</p>
            <p>&rarr; Cooperative Circle &rarr; {entityName}: Meet production quota (Vantor-IV MBT, 60 units/qtr)</p>
          </div>

          {/* Voting Ratio Progress Bar */}
          <div className="w-full h-3 rounded overflow-hidden flex">
            <div className="bg-emerald-600 h-full w-[55%]" />
            <div className="bg-rose-700 h-full w-[45%]" />
          </div>

          <div className="flex gap-2 justify-center pt-1">
            <button className="px-4 py-1.5 border border-rule rounded bg-paper text-ink font-medium hover:bg-ground">Support</button>
            <button className="px-4 py-1.5 border border-rule rounded bg-paper text-ink font-medium hover:bg-ground">Resist</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConstructAgreementPanel;
