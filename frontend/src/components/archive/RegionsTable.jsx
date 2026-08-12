import React, { useState, useMemo } from 'react';
import { Search, MapPin } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../ui/Table';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';

/**
 * RegionsTable Component
 * Tabular view of territorial regions in the snapshot.
 */
export function RegionsTable({ regions = [], nations = [], onSelectRegion }) {
  const [searchTerm, setSearchTerm] = useState('');

  const nationMap = useMemo(() => {
    const map = {};
    nations.forEach((n) => {
      map[n.id] = n.name;
    });
    return map;
  }, [nations]);

  const filteredRegions = useMemo(() => {
    return regions.filter(
      (r) =>
        r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (nationMap[r.nationId] && nationMap[r.nationId].toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [regions, searchTerm, nationMap]);

  if (!regions || regions.length === 0) {
    return <EmptyState title="No regions registered" description="No territorial region data available for this year." />;
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search regions or nations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={Search}
          />
        </div>
        <span className="text-xs font-mono text-ink-muted">
          {filteredRegions.length} REGION{filteredRegions.length === 1 ? '' : 'S'}
        </span>
      </div>

      {filteredRegions.length === 0 ? (
        <EmptyState title="No regions match search" description={`No regions found matching "${searchTerm}".`} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Region Name</TableHead>
              <TableHead>Controlling Nation</TableHead>
              <TableHead>Urbanization</TableHead>
              <TableHead className="text-right">Population</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {filteredRegions.map((region) => {
              const controllingNation = nationMap[region.nationId] || 'Unclaimed Territory';
              return (
                <TableRow
                  key={region.id}
                  onClick={() => onSelectRegion && onSelectRegion(region)}
                  className="group hover:bg-ground"
                >
                  <TableCell className="font-medium text-ink font-serif text-base group-hover:text-accent transition-colors">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-ink-muted shrink-0" />
                      <span>{region.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Badge variant={controllingNation === 'Unclaimed Territory' ? 'default' : 'accent'} size="sm">
                      {controllingNation}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-ink-muted">
                    {typeof region.urbanization === 'number'
                      ? `${Math.round(region.urbanization * 100)}%`
                      : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {region.population ? region.population.toLocaleString() : 'N/A'}
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

export default RegionsTable;
