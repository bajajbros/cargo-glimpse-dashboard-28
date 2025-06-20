
import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Eye, Edit, FileText, Printer } from 'lucide-react';
import { Job } from '@/types/job';
import { formatCellValue, formatContainerNumbers } from '@/utils/jobFormatters';

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

  const handlePrint = () => {
    window.print();
  };

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No jobs found</p>
        <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
      </div>
    );
  }

  const renderCellValue = (job: Job, column: string) => {
    if (column === 'containerFlightNumbers') {
      return formatContainerNumbers(job);
    }
    return formatCellValue(job, column);
  };

  return (
    <div className="w-full">
      {/* Horizontal scroll area that's always visible */}
      <ScrollArea className="w-full">
        <div className="overflow-x-auto border rounded-lg shadow-sm">
          {/* Vertical scroll area for table body */}
          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-white shadow-sm">
                <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100">
                  {selectedColumns.map(column => (
                    <TableHead key={column} className="px-4 py-3 text-sm font-semibold text-gray-700 border-r last:border-r-0 whitespace-nowrap">
                      {column.replace(/([A-Z])/g, ' $1').trim()}
                    </TableHead>
                  ))}
                  <TableHead className="px-4 py-3 text-sm font-semibold text-gray-700 text-center sticky right-0 bg-gradient-to-r from-gray-50 to-gray-100 border-l">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job, index) => (
                  <TableRow key={job.id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    {selectedColumns.map(column => (
                      <TableCell 
                        key={`${job.id}-${column}`} 
                        className={`px-4 py-3 text-sm border-r last:border-r-0 whitespace-pre-wrap ${
                          column === 'containerFlightNumbers' ? 'min-h-[4rem]' : 'max-w-32 truncate'
                        }`}
                      >
                        {renderCellValue(job, column)}
                      </TableCell>
                    ))}
                    <TableCell className="px-4 py-3 text-sm text-center sticky right-0 bg-white border-l">
                      <div className="flex justify-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setViewingJob(job)} className="text-blue-600 hover:bg-blue-100">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible">
                            <DialogHeader className="flex flex-row items-center justify-between">
                              <DialogTitle className="text-xl font-bold text-gray-800">Job Details - {job.jobNumber}</DialogTitle>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handlePrint}
                                className="print:hidden"
                              >
                                <Printer className="w-4 h-4 mr-2" />
                                Print
                              </Button>
                            </DialogHeader>
                            {viewingJob && (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4 print:grid-cols-2">
                                {allColumns.map(column => (
                                  <div key={column} className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700 capitalize">
                                      {column.replace(/([A-Z])/g, ' $1').trim()}
                                    </Label>
                                    <div className={`text-sm text-gray-600 p-3 bg-gray-50 rounded-md border min-h-[2.5rem] flex items-start ${
                                      column === 'containerFlightNumbers' ? 'whitespace-pre-wrap' : ''
                                    }`}>
                                      {column === 'containerFlightNumbers' 
                                        ? formatContainerNumbers(viewingJob) || 'N/A'
                                        : formatCellValue(viewingJob, column) || 'N/A'
                                      }
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
        </div>
      </ScrollArea>
    </div>
  );
};
