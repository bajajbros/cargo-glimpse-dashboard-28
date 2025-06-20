
import React, { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Eye, Search, Filter, Download, Edit, X, FileText, RefreshCw } from 'lucide-react';
import { Job } from '@/types/job';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FilterableSelect } from '@/components/FilterableSelect';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ViewJobs() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Show all columns by default
  const [allColumns] = useState<string[]>([
    'jobNumber', 'status', 'rmName', 'shipmentType', 'modeOfShipment', 'lclFclAir', 'shipperDetails', 'consigneeDetails', 'overseasAgentDetails', 'bookingNo', 'invoiceNo', 'grossWeight', 'netWeight', 'totalPackages', 'portOfLoading', 'etaPod', 'finalDestination', 'vesselVoyDetails', 'airShippingLine', 'containerFlightNumbers', 'mblNo', 'mblDate', 'hblNo', 'hblDate', 'terms', 'remarks', 'createdAt'
  ]);
  
  const [selectedColumns, setSelectedColumns] = useState<string[]>(allColumns);

  // Filter states
  const [filters, setFilters] = useState({
    rmName: '',
    shipmentType: '',
    modeOfShipment: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    shipper: '',
    consignee: '',
    overseasAgent: '',
    portOfLoading: '',
    finalDestination: ''
  });

  // Unique values for filter dropdowns
  const [uniqueValues, setUniqueValues] = useState({
    rmNames: [] as string[],
    shippers: [] as string[],
    consignees: [] as string[],
    overseasAgents: [] as string[],
    portsOfLoading: [] as string[],
    finalDestinations: [] as string[]
  });

  const [viewingJob, setViewingJob] = useState<Job | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jobs, searchQuery, filters]);

  const fetchJobs = async () => {
    try {
      const jobsQuery = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(jobsQuery);
      const jobsList: Job[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
        } as Job;
      });
      setJobs(jobsList);
      extractUniqueValues(jobsList);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const extractUniqueValues = (jobsList: Job[]) => {
    const rmNames = [...new Set(jobsList.map(job => job.rmName).filter(Boolean))].sort();
    const shippers = [...new Set(jobsList.map(job => job.shipperDetails).filter(Boolean))].sort();
    const consignees = [...new Set(jobsList.map(job => job.consigneeDetails).filter(Boolean))].sort();
    const overseasAgents = [...new Set(jobsList.map(job => job.overseasAgentDetails).filter(Boolean))].sort();
    const portsOfLoading = [...new Set(jobsList.map(job => job.portOfLoading).filter(Boolean))].sort();
    const finalDestinations = [...new Set(jobsList.map(job => job.finalDestination).filter(Boolean))].sort();

    setUniqueValues({
      rmNames,
      shippers,
      consignees,
      overseasAgents,
      portsOfLoading,
      finalDestinations
    });
  };

  const applyFilters = () => {
    let filtered = jobs;

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(job => {
        const searchableValues = [
          job.jobNumber,
          job.bookingNo,
          job.invoiceNo,
          job.shipperDetails,
          job.consigneeDetails,
          job.rmName,
          job.modeOfShipment,
          job.shipmentType,
          job.portOfLoading,
          job.finalDestination
        ];
        return searchableValues.some(value => 
          value && value.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    // Apply filters
    if (filters.rmName) {
      filtered = filtered.filter(job => job.rmName === filters.rmName);
    }
    if (filters.shipmentType) {
      filtered = filtered.filter(job => job.shipmentType === filters.shipmentType);
    }
    if (filters.modeOfShipment) {
      filtered = filtered.filter(job => job.modeOfShipment === filters.modeOfShipment);
    }
    if (filters.status) {
      filtered = filtered.filter(job => job.status === filters.status);
    }
    if (filters.shipper) {
      filtered = filtered.filter(job => job.shipperDetails === filters.shipper);
    }
    if (filters.consignee) {
      filtered = filtered.filter(job => job.consigneeDetails === filters.consignee);
    }
    if (filters.overseasAgent) {
      filtered = filtered.filter(job => job.overseasAgentDetails === filters.overseasAgent);
    }
    if (filters.portOfLoading) {
      filtered = filtered.filter(job => job.portOfLoading === filters.portOfLoading);
    }
    if (filters.finalDestination) {
      filtered = filtered.filter(job => job.finalDestination === filters.finalDestination);
    }

    // Apply date filters
    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter(job => {
        const jobDate = job.createdAt;
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const toDate = filters.dateTo ? new Date(filters.dateTo) : null;
        
        if (fromDate && toDate) {
          return jobDate >= fromDate && jobDate <= toDate;
        } else if (fromDate) {
          return jobDate >= fromDate;
        } else if (toDate) {
          return jobDate <= toDate;
        }
        return true;
      });
    }

    setFilteredJobs(filtered);
  };

  const handleColumnSelection = (column: string) => {
    setSelectedColumns(prev =>
      prev.includes(column) ? prev.filter(c => c !== column) : [...prev, column]
    );
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      rmName: '',
      shipmentType: '',
      modeOfShipment: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      shipper: '',
      consignee: '',
      overseasAgent: '',
      portOfLoading: '',
      finalDestination: ''
    });
    setSearchQuery('');
  };

  const exportToExcel = () => {
    const headers = selectedColumns.join(',');
    const csvContent = filteredJobs.map(job => 
      selectedColumns.map(column => {
        const value = formatCellValue(job, column);
        return `"${value}"`;
      }).join(',')
    ).join('\n');
    
    const fullCsv = headers + '\n' + csvContent;
    const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `jobs_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Successful",
      description: "Jobs data has been exported to CSV file.",
    });
  };

  const handleEditJob = (job: Job) => {
    // Navigate to create job page with job data in state
    navigate('/create-job', { state: { editJob: job } });
  };

  const formatCellValue = (job: Job, columnKey: string) => {
    const value = (job as any)[columnKey];
    
    // Handle null/undefined values
    if (value == null) {
      return '';
    }
    
    // Handle specific column types
    switch (columnKey) {
      case 'containerFlightNumbers':
        return Array.isArray(value) ? value.join(', ') : '';
      
      case 'createdAt':
      case 'updatedAt':
        if (value instanceof Date) {
          return value.toLocaleDateString();
        }
        // Handle Firestore Timestamp objects
        if (value && typeof value === 'object' && value.seconds) {
          return new Date(value.seconds * 1000).toLocaleDateString();
        }
        return value ? new Date(value).toLocaleDateString() : '';
      
      case 'hblDate':
      case 'mblDate':
      case 'etaPod':
        if (value instanceof Date) {
          return value.toLocaleDateString();
        }
        // Handle Firestore Timestamp objects
        if (value && typeof value === 'object' && value.seconds) {
          return new Date(value.seconds * 1000).toLocaleDateString();
        }
        // Handle string dates
        if (typeof value === 'string' && value) {
          const date = new Date(value);
          return !isNaN(date.getTime()) ? date.toLocaleDateString() : value;
        }
        return value || '';
      
      default:
        // Handle objects (but not dates)
        if (value && typeof value === 'object' && !(value instanceof Date)) {
          // Check if it's a Firestore Timestamp
          if (value.seconds && value.nanoseconds) {
            return new Date(value.seconds * 1000).toLocaleDateString();
          }
          return JSON.stringify(value);
        }
        return String(value || '');
    }
  };

  const extractUniqueValues = (jobsList: Job[]) => {
    const rmNames = [...new Set(jobsList.map(job => job.rmName).filter(Boolean))].sort();
    const shippers = [...new Set(jobsList.map(job => job.shipperDetails).filter(Boolean))].sort();
    const consignees = [...new Set(jobsList.map(job => job.consigneeDetails).filter(Boolean))].sort();
    const overseasAgents = [...new Set(jobsList.map(job => job.overseasAgentDetails).filter(Boolean))].sort();
    const portsOfLoading = [...new Set(jobsList.map(job => job.portOfLoading).filter(Boolean))].sort();
    const finalDestinations = [...new Set(jobsList.map(job => job.finalDestination).filter(Boolean))].sort();

    setUniqueValues({
      rmNames,
      shippers,
      consignees,
      overseasAgents,
      portsOfLoading,
      finalDestinations
    });
  };

  const applyFilters = () => {
    let filtered = jobs;

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(job => {
        const searchableValues = [
          job.jobNumber,
          job.bookingNo,
          job.invoiceNo,
          job.shipperDetails,
          job.consigneeDetails,
          job.rmName,
          job.modeOfShipment,
          job.shipmentType,
          job.portOfLoading,
          job.finalDestination
        ];
        return searchableValues.some(value => 
          value && value.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    // Apply filters
    if (filters.rmName) {
      filtered = filtered.filter(job => job.rmName === filters.rmName);
    }
    if (filters.shipmentType) {
      filtered = filtered.filter(job => job.shipmentType === filters.shipmentType);
    }
    if (filters.modeOfShipment) {
      filtered = filtered.filter(job => job.modeOfShipment === filters.modeOfShipment);
    }
    if (filters.status) {
      filtered = filtered.filter(job => job.status === filters.status);
    }
    if (filters.shipper) {
      filtered = filtered.filter(job => job.shipperDetails === filters.shipper);
    }
    if (filters.consignee) {
      filtered = filtered.filter(job => job.consigneeDetails === filters.consignee);
    }
    if (filters.overseasAgent) {
      filtered = filtered.filter(job => job.overseasAgentDetails === filters.overseasAgent);
    }
    if (filters.portOfLoading) {
      filtered = filtered.filter(job => job.portOfLoading === filters.portOfLoading);
    }
    if (filters.finalDestination) {
      filtered = filtered.filter(job => job.finalDestination === filters.finalDestination);
    }

    // Apply date filters
    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter(job => {
        const jobDate = job.createdAt;
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const toDate = filters.dateTo ? new Date(filters.dateTo) : null;
        
        if (fromDate && toDate) {
          return jobDate >= fromDate && jobDate <= toDate;
        } else if (fromDate) {
          return jobDate >= fromDate;
        } else if (toDate) {
          return jobDate <= toDate;
        }
        return true;
      });
    }

    setFilteredJobs(filtered);
  };

  const handleColumnSelection = (column: string) => {
    setSelectedColumns(prev =>
      prev.includes(column) ? prev.filter(c => c !== column) : [...prev, column]
    );
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      rmName: '',
      shipmentType: '',
      modeOfShipment: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      shipper: '',
      consignee: '',
      overseasAgent: '',
      portOfLoading: '',
      finalDestination: ''
    });
    setSearchQuery('');
  };

  return (
    <div className="p-6 h-full overflow-auto bg-gray-50">
      <Card className="max-w-full mx-auto shadow-lg">
        <CardHeader className="pb-4 bg-white border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl font-bold text-gray-800">
                <FileText className="w-7 h-7 text-blue-600" />
                Jobs Management ({filteredJobs.length})
              </CardTitle>
            </div>
            <div className="flex items-center space-x-3">
              <Input
                type="search"
                placeholder="Search jobs..."
                className="max-w-xs border-gray-300 focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={exportToExcel}
                className="border-green-500 text-green-600 hover:bg-green-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                onClick={fetchJobs}
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 bg-white">
          {/* Compact Filters */}
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
              <div className="flex items-center space-x-2">
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
                            onCheckedChange={() => handleColumnSelection(column)}
                          />
                          <Label htmlFor={column} className="text-sm capitalize cursor-pointer">
                            {column.replace(/([A-Z])/g, ' $1').trim()}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            {filtersOpen && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">RM Name</Label>
                    <FilterableSelect
                      options={uniqueValues.rmNames.map(name => ({ value: name, label: name }))}
                      value={filters.rmName}
                      onValueChange={(value) => handleFilterChange('rmName', value)}
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
                      onValueChange={(value) => handleFilterChange('shipmentType', value)}
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
                      onValueChange={(value) => handleFilterChange('modeOfShipment', value)}
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
                      onValueChange={(value) => handleFilterChange('status', value)}
                      placeholder="All Status"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">From Date</Label>
                    <Input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                      className="text-sm border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">To Date</Label>
                    <Input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
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
                      onValueChange={(value) => handleFilterChange('shipper', value)}
                      placeholder="All Shippers"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Consignee</Label>
                    <FilterableSelect
                      options={uniqueValues.consignees.map(name => ({ value: name, label: name }))}
                      value={filters.consignee}
                      onValueChange={(value) => handleFilterChange('consignee', value)}
                      placeholder="All Consignees"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Overseas Agent</Label>
                    <FilterableSelect
                      options={uniqueValues.overseasAgents.map(name => ({ value: name, label: name }))}
                      value={filters.overseasAgent}
                      onValueChange={(value) => handleFilterChange('overseasAgent', value)}
                      placeholder="All Agents"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Port of Loading</Label>
                    <FilterableSelect
                      options={uniqueValues.portsOfLoading.map(name => ({ value: name, label: name }))}
                      value={filters.portOfLoading}
                      onValueChange={(value) => handleFilterChange('portOfLoading', value)}
                      placeholder="All Ports"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
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

          {/* Enhanced Table */}
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
                {filteredJobs.map((job, index) => (
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
                          onClick={() => handleEditJob(job)}
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

          {filteredJobs.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No jobs found</p>
              <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
