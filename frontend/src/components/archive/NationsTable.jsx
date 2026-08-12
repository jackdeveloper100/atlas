import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, Shield } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../ui/Table';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';

/**
 * NationsTable Component
 * Tabular view of nations in the selected snapshot.
 */
export function NationsTable({ nations = [], leaders = [], politicalStates = [], onSelectNation }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Map leader IDs to leader objects
  const leaderMap = useMemo(() => {
    const map = {};
    leaders.forEach((l) => {
      map[l.id] = l;
      if (l.nationId) map[l.nationId] = l;
    });
    return map;
  }, [leaders]);

  // Government type lives on politicalStates (one per nation), not on the nation itself
  const politicalStateMap = useMemo(() => {
    const map = {};
    politicalStates.forEach((p) => {
      map[p.nationId] = p;
    });
    return map;
  }, [politicalStates]);

  const filteredNations = useMemo(() => {
    return nations
      .map((n) => ({ ...n, governmentType: politicalStateMap[n.id]?.governmentType }))
      .filter((n) => n.name?.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        let valA = a[sortField] || '';
        let valB = b[sortField] || '';
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [nations, politicalStateMap, searchTerm, sortField, sortAsc]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  if (!nations || nations.length === 0) {
    return <EmptyState title="No nations registered" description="No national entity data available for this year." />;
  }

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search nations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={Search}
          />
        </div>
        <span className="text-xs font-mono text-ink-muted">
          {filteredNations.length} NATION{filteredNations.length === 1 ? '' : 'S'}
        </span>
      </div>

      {/* Nations Data Table */}
      {filteredNations.length === 0 ? (
        <EmptyState title="No nations match search" description={`No nations found matching "${searchTerm}".`} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort('name')} className="cursor-pointer hover:text-ink">
                <div className="flex items-center gap-1">
                  <span>Nation Name</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('population')} className="cursor-pointer hover:text-ink text-right">
                <div className="flex items-center justify-end gap-1">
                  <span>Population</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('governmentType')} className="cursor-pointer hover:text-ink">
                <div className="flex items-center gap-1">
                  <span>Government</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </TableHead>
              <TableHead>Head of State</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {filteredNations.map((nation) => {
              const leader = leaderMap[nation.leaderId] || leaderMap[nation.id];
              return (
                <TableRow
                  key={nation.id}
                  onClick={() => onSelectNation && onSelectNation(nation)}
                  className="group hover:bg-ground"
                >
                  <TableCell className="font-medium text-ink font-serif text-base group-hover:text-accent transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-ground border border-rule flex items-center justify-center text-ink-muted text-xs">
                        <Shield className="w-3.5 h-3.5" />
                      </div>
                      <span>{nation.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {nation.population ? nation.population.toLocaleString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={nation.governmentType ? 'default' : 'ink'} size="sm">
                      {nation.governmentType || 'Not recorded'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-ink-muted font-medium text-xs">
                    {leader ? (
                      <span>{leader.name || leader.title}</span>
                    ) : (
                      <span className="italic text-ink-muted/60">State Council</span>
                    )}
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

export default NationsTable;
