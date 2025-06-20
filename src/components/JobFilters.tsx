
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';
import { FilterableSelect } from '@/components/FilterableSelect';
import { JobFilters as JobFiltersType } from '@/utils/jobFilters';

interface JobFiltersProps {
  filters: JobFiltersType;
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  uniqueValues: {
    rmNames: string[];
    shippers: string[];
    consignees: string[];
    overseasAgents: string[];
    portsOfLoading: string[];
    finalDestinations: string[];
  };
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;
}

export const JobFilters: React.FC<JobFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  uniqueValues,
  filtersOpen,
  setFiltersOpen
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="border-gray-300 hover:border-blue-500"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters {Object.values(filters).some(v => v) && <Badge className="ml-2 bg-blue-100 text-blue-800">Active</Badge>}
        </Button>
      </div>
      
      {filtersOpen && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div>
              <Label className="text-sm font-medium text-gray-700">RM Name</Label>
              <FilterableSelect
                options={uniqueValues.rmNames.map(name => ({ value: name, label: name }))}
                value={filters.rmName}
                onValueChange={(value) => onFilterChange('rmName', value)}
                placeholder="All RMs"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Shipment Type</Label>
              <FilterableSelect
                options={[
                  { value: 'Import', label: 'Import' },
                  { value: 'Export', label: 'Export' }
                ]}
                value={filters.shipmentType}
                onValueChange={(value) => onFilterChange('shipmentType', value)}
                placeholder="All Types"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Mode</Label>
              <FilterableSelect
                options={[
                  { value: 'Air', label: 'Air' },
                  { value: 'Sea', label: 'Sea' },
                  { value: 'Road', label: 'Road' },
                  { value: 'Rail', label: 'Rail' }
                ]}
                value={filters.modeOfShipment}
                onValueChange={(value) => onFilterChange('modeOfShipment', value)}
                placeholder="All Modes"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Status</Label>
              <FilterableSelect
                options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Completed', label: 'Completed' },
                  { value: 'Cancelled', label: 'Cancelled' }
                ]}
                value={filters.status}
                onValueChange={(value) => onFilterChange('status', value)}
                placeholder="All Status"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">From Date</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => onFilterChange('dateFrom', e.target.value)}
                className="text-sm border-gray-300 focus:border-blue-500"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">To Date</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => onFilterChange('dateTo', e.target.value)}
                className="text-sm border-gray-300 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <Label className="text-sm font-medium text-gray-700">Shipper</Label>
              <FilterableSelect
                options={uniqueValues.shippers.map(name => ({ value: name, label: name }))}
                value={filters.shipper}
                onValueChange={(value) => onFilterChange('shipper', value)}
                placeholder="All Shippers"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Consignee</Label>
              <FilterableSelect
                options={uniqueValues.consignees.map(name => ({ value: name, label: name }))}
                value={filters.consignee}
                onValueChange={(value) => onFilterChange('consignee', value)}
                placeholder="All Consignees"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Overseas Agent</Label>
              <FilterableSelect
                options={uniqueValues.overseasAgents.map(name => ({ value: name, label: name }))}
                value={filters.overseasAgent}
                onValueChange={(value) => onFilterChange('overseasAgent', value)}
                placeholder="All Agents"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Port of Loading</Label>
              <FilterableSelect
                options={uniqueValues.portsOfLoading.map(name => ({ value: name, label: name }))}
                value={filters.portOfLoading}
                onValueChange={(value) => onFilterChange('portOfLoading', value)}
                placeholder="All Ports"
              />
            </div>
            
            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="w-full border-red-300 text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
