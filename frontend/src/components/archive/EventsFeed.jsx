import React, { useState } from 'react';
import { ScrollText } from 'lucide-react';
import Input from '../ui/Input';
import EmptyState from '../ui/EmptyState';

export function EventsFeed({ events = [], selectedYear }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEvents = events.filter((e) => {
    const text = `${e.title || ''} ${e.description || ''} ${e.badgeLabel || ''} ${e.eventType || ''}`;
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (!events || events.length === 0) {
    return <EmptyState title="No historical events" description={`No major events recorded for Year ${selectedYear}.`} icon={ScrollText} />;
  }

  return (
    <div className="space-y-4">
      {/* Header & Filter */}
      <div className="flex items-center justify-between gap-4">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Filter events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <span className="text-xs font-mono text-ink-muted">
          {filteredEvents.length} EVENT{filteredEvents.length === 1 ? '' : 'S'} IN YEAR {selectedYear}
        </span>
      </div>

      {filteredEvents.length === 0 ? (
        <EmptyState title="No events match filter" description={`No events found matching "${searchTerm}".`} />
      ) : (
        <div className="relative border-l-2 border-rule ml-4 pl-6 space-y-6 py-2">
          {filteredEvents.map((eventObj, idx) => {
            const badgeLabel = eventObj.badgeLabel || eventObj.eventType || 'Event';
            const badgeColor = eventObj.badgeColor || '#3b82f6';

            return (
              <div key={eventObj.id || idx} className="relative group">
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-paper border-2 border-black group-hover:scale-125 transition-transform" />

                <div className="bg-paper border border-rule rounded-card p-4 shadow-2xs hover:border-ink/20 transition-all">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold text-white uppercase tracking-wider"
                        style={{ backgroundColor: badgeColor }}
                      >
                        {badgeLabel}
                      </span>
                      <span className="text-xs font-mono text-ink-muted">
                        YEAR {selectedYear} {eventObj.quarter ? `• Q${eventObj.quarter}` : ''}
                      </span>
                    </div>
                  </div>

                  {eventObj.title && (
                    <h4 className="font-serif font-bold text-base text-ink mb-1">{eventObj.title}</h4>
                  )}

                  <p className="text-sm font-sans text-ink leading-relaxed font-medium">
                    {eventObj.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default EventsFeed;
