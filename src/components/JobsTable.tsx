
import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Eye, Edit, FileText } from 'lucide-react';
import { Job } from '@/types/job';
import { formatCellValue } from '@/utils/jobFormatters';

interface JobsTableProps {
  jobs: Job[];
  selectedColumns: string[];
  allColumns: string[];
  onEditJob: (job: Job) => void;
}

export const JobsTable: React.FC<JobsTableProps> = ({
  jobs,
  selectedColumns,
  allColumns,
  onEditJob
}) => {
  const [viewingJob, setViewingJob] = React.useState<Job | null>(null);

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No jobs found</p>
        <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border rounded-lg shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100">
            {selectedColumns.map(column => (
              <TableHead key={column} className="px-4 py-3 text-sm font-semibold text-gray-700 border-r last:border-r-0">
                {column.replace(/([A-Z])/g, ' $1').trim()}
              </TableHead>
            ))}
            <TableHead className="px-4 py-3 text-sm font-semibold text-gray-700 text-center">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job, index) => (
            <TableRow key={job.id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
              {selectedColumns.map(column => (
                <TableCell key={`${job.id}-${column}`} className="px-4 py-3 text-sm border-r last:border-r-0 max-w-32 truncate">
                  {formatCellValue(job, column)}
                </TableCell>
              ))}
              <TableCell className="px-4 py-3 text-sm text-center">
                <div className="flex justify-center space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => setViewingJob(job)} className="text-blue-600 hover:bg-blue-100">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-800">Job Details - {job.jobNumber}</DialogTitle>
                      </DialogHeader>
                      {viewingJob && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
                          {allColumns.map(column => (
                            <div key={column} className="space-y-2">
                              <Label className="text-sm font-semibold text-gray-700 capitalize">
                                {column.replace(/([A-Z])/g, ' $1').trim()}
                              </Label>
                              <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-md border min-h-[2.5rem] flex items-center">
                                {formatCellValue(viewingJob, column) || 'N/A'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onEditJob(job)}
                    className="text-green-600 hover:bg-green-100"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
