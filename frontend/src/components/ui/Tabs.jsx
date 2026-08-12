import React from 'react';

/**
 * Reusable Tabs Component
 * Clean horizontal navigation bar for switching views.
 */
export function Tabs({ tabs = [], activeTab, onChange, variant = 'pills', className = '' }) {
  if (variant === 'pills') {
    return (
      <div className={`flex items-center justify-center gap-4 flex-wrap ${className}`}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-hover whitespace-nowrap select-none ${
                isActive
                  ? 'bg-black text-white font-semibold shadow-xs'
                  : 'bg-transparent text-ink hover:bg-ground/60'
              }`}
            >
              {Icon && <Icon className="w-4 h-4 shrink-0 inline mr-2" />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`ml-2 text-xs font-mono px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-ground text-ink-muted'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`border-b border-rule flex items-center gap-2 overflow-x-auto no-scrollbar ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap select-none ${
              isActive
                ? 'border-ink text-ink font-semibold'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-rule'
            }`}
          >
            {Icon && <Icon className="w-4 h-4 shrink-0" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`ml-1 text-xs font-mono px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-ink/10 text-ink' : 'bg-ground text-ink-muted'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
