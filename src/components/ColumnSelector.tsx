
import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Eye } from 'lucide-react';

interface ColumnSelectorProps {
  allColumns: string[];
  selectedColumns: string[];
  onColumnSelection: (column: string) => void;
}

export const ColumnSelector: React.FC<ColumnSelectorProps> = ({
  allColumns,
  selectedColumns,
  onColumnSelection
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="border-gray-300 hover:border-blue-500">
          <Eye className="w-4 h-4 mr-2" />
          Columns ({selectedColumns.length})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 max-h-96 overflow-y-auto">
        <div className="space-y-2">
          {allColumns.map(column => (
            <div key={column} className="flex items-center space-x-2">
              <Checkbox
                id={column}
                checked={selectedColumns.includes(column)}
                onCheckedChange={() => onColumnSelection(column)}
              />
              <Label htmlFor={column} className="text-sm capitalize cursor-pointer">
                {column.replace(/([A-Z])/g, ' $1').trim()}
              </Label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
