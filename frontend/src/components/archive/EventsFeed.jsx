import React, { useState } from 'react';
import { Activity, Clock, ShieldAlert, Sparkles, ScrollText } from 'lucide-react';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import EmptyState from '../ui/EmptyState';

/**
 * EventsFeed Component
 * Timeline feed displaying historical events for the selected simulation year.
 */
export function EventsFeed({ events = [], selectedYear }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEvents = events.filter((e) => {
    const text = typeof e === 'string' ? e : e.description || e.title || e.type || '';
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getEventBadge = (type = '') => {
    const lower = String(type).toLowerCase();
    if (lower.includes('war') || lower.includes('conflict')) return <Badge variant="danger" size="sm">CONFLICT</Badge>;
    if (lower.includes('succession') || lower.includes('leader')) return <Badge variant="warning" size="sm">SUCCESSION</Badge>;
    if (lower.includes('init') || lower.includes('founding')) return <Badge variant="accent" size="sm">FOUNDING</Badge>;
    if (lower.includes('reform') || lower.includes('policy')) return <Badge variant="success" size="sm">REFORM</Badge>;
    return <Badge variant="default" size="sm">HISTORICAL EVENT</Badge>;
  };

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
          {filteredEvents.map((event, idx) => {
            const eventObj = typeof event === 'string' ? { description: event, type: 'Historical' } : event;
            return (
              <div key={idx} className="relative group">
                {/* Timeline Circle Bullet */}
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-paper border-2 border-black group-hover:scale-125 transition-transform" />

                <div className="bg-paper border border-rule rounded-card p-4 shadow-2xs hover:border-ink/20 transition-all">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      {getEventBadge(eventObj.type || eventObj.category)}
                      <span className="text-xs font-mono text-ink-muted">
                        YEAR {selectedYear} {eventObj.quarter ? `• Q${eventObj.quarter}` : ''}
                      </span>
                    </div>
                    {eventObj.nation && (
                      <span className="text-xs font-serif font-medium text-ink-muted">
                        {eventObj.nation}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-sans text-ink leading-relaxed font-medium">
                    {eventObj.description || eventObj.title || JSON.stringify(eventObj)}
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
