import React, { useState, useMemo } from 'react';
import { Search, Crown, UserCheck } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../ui/Table';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';

/**
 * LeadersTable Component
 * Tabular view of historical leaders, monarchs, and state directors in the snapshot.
 */
export function LeadersTable({ leaders = [], nations = [], currentYear, onSelectLeader }) {
  const [searchTerm, setSearchTerm] = useState('');

  const nationMap = useMemo(() => {
    const map = {};
    nations.forEach((n) => {
      map[n.id] = n.name;
    });
    return map;
  }, [nations]);

  const filteredLeaders = useMemo(() => {
    return leaders.filter((l) => {
      const name = l.name || l.title || '';
      const nation = nationMap[l.nationId] || '';
      return (
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nation.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [leaders, searchTerm, nationMap]);

  if (!leaders || leaders.length === 0) {
    return <EmptyState title="No leaders registered" description="No national leadership figures recorded for this year." />;
  }

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search leaders or nations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={Search}
          />
        </div>
        <span className="text-xs font-mono text-ink-muted">
          {filteredLeaders.length} LEADER{filteredLeaders.length === 1 ? '' : 'S'}
        </span>
      </div>

      {filteredLeaders.length === 0 ? (
        <EmptyState title="No leaders match search" description={`No leadership figures found matching "${searchTerm}".`} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Leader Name</TableHead>
              <TableHead>Title / Office</TableHead>
              <TableHead>Nation</TableHead>
              <TableHead className="text-right">Age</TableHead>
              <TableHead className="text-right">Legitimacy</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {filteredLeaders.map((leader) => {
              const nationName = nationMap[leader.nationId] || 'Independent Sovereign';
              const age =
                typeof currentYear === 'number' && typeof leader.birthYear === 'number'
                  ? currentYear - leader.birthYear
                  : null;

              return (
                <TableRow
                  key={leader.id}
                  onClick={() => onSelectLeader && onSelectLeader(leader)}
                  className="group hover:bg-ground"
                >
                  <TableCell className="font-medium text-ink font-serif text-base group-hover:text-accent transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                        <Crown className="w-3.5 h-3.5" />
                      </div>
                      <span>{leader.name || 'Anonymous Sovereign'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-ink-muted">
                    {leader.title || leader.office || 'Head of State'}
                  </TableCell>
                  <TableCell className="font-medium text-ink">
                    <Badge variant="default" size="sm">
                      {nationName}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {age !== null ? `${age} yrs` : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {typeof leader.legitimacy === 'number'
                      ? `${Math.round(leader.legitimacy * 100)}%`
                      : 'N/A'}
                  </TableCell>
                </TableRow>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}

export default LeadersTable;
