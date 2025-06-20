
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
    'jobNumber', 'rmName', 'shipmentType', 'modeOfShipment', 'shipperDetails', 'consigneeDetails', 'overseasAgentDetails', 'bookingNo', 'invoiceNo', 'grossWeight', 'netWeight', 'totalPackages', 'portOfLoading', 'etaPod', 'finalDestination', 'vesselVoyDetails', 'airShippingLine', 'containerFlightNumbers', 'mblNo', 'mblDate', 'hblNo', 'hblDate', 'terms', 'remarks'
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
    switch (columnKey) {
      case 'containerFlightNumbers':
        return Array.isArray(job.containerFlightNumbers) 
          ? job.containerFlightNumbers.join(', ') 
          : '';
      case 'createdAt':
        return job.createdAt instanceof Date ? job.createdAt.toLocaleDateString() : '';
      case 'hblDate':
      case 'mblDate':
        const dateValue = (job as any)[columnKey];
        if (dateValue instanceof Date) {
          return dateValue.toLocaleDateString();
        }
        return dateValue || '';
      default:
        const value = (job as any)[columnKey];
        if (value && typeof value === 'object') {
          return JSON.stringify(value);
        }
        return value || '';
    }
  };

  return (
    <div className="p-4 h-full overflow-auto">
      <Card className="max-w-full mx-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="w-6 h-6" />
                Jobs Management ({filteredJobs.length})
              </CardTitle>
            </div>
            <div className="flex items-center space-x-3">
              <Input
                type="search"
                placeholder="Search jobs..."
                className="max-w-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={exportToExcel}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                onClick={fetchJobs}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          {/* Filters */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFiltersOpen(!filtersOpen)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters {Object.values(filters).some(v => v) && <Badge className="ml-2">Active</Badge>}
              </Button>
              <div className="flex items-center space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Columns
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4">
                    <div className="max-h-60 overflow-y-auto">
                      {allColumns.map(column => (
                        <div key={column} className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            id={column}
                            checked={selectedColumns.includes(column)}
                            onCheckedChange={() => handleColumnSelection(column)}
                          />
                          <Label htmlFor={column} className="text-sm capitalize">
                            {column}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            {filtersOpen && (
              <div className="bg-gray-50 p-4 rounded-lg border space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div>
                    <Label className="text-sm">RM Name</Label>
                    <FilterableSelect
                      options={uniqueValues.rmNames.map(name => ({ value: name, label: name }))}
                      value={filters.rmName}
                      onValueChange={(value) => handleFilterChange('rmName', value)}
                      placeholder="All RMs"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm">Shipment Type</Label>
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
                    <Label className="text-sm">Mode</Label>
                    <FilterableSelect
                      options={[
                        { value: 'Air', label: 'Air' },
                        { value: 'Sea', label: 'Sea' }
                      ]}
                      value={filters.modeOfShipment}
                      onValueChange={(value) => handleFilterChange('modeOfShipment', value)}
                      placeholder="All Modes"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm">Status</Label>
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
                    <Label className="text-sm">From Date</Label>
                    <Input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm">To Date</Label>
                    <Input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  <div>
                    <Label className="text-sm">Shipper</Label>
                    <FilterableSelect
                      options={uniqueValues.shippers.map(name => ({ value: name, label: name }))}
                      value={filters.shipper}
                      onValueChange={(value) => handleFilterChange('shipper', value)}
                      placeholder="All Shippers"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm">Consignee</Label>
                    <FilterableSelect
                      options={uniqueValues.consignees.map(name => ({ value: name, label: name }))}
                      value={filters.consignee}
                      onValueChange={(value) => handleFilterChange('consignee', value)}
                      placeholder="All Consignees"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm">Overseas Agent</Label>
                    <FilterableSelect
                      options={uniqueValues.overseasAgents.map(name => ({ value: name, label: name }))}
                      value={filters.overseasAgent}
                      onValueChange={(value) => handleFilterChange('overseasAgent', value)}
                      placeholder="All Agents"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm">Port of Loading</Label>
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
                      className="w-full"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  {selectedColumns.map(column => (
                    <TableHead key={column} className="px-3 py-2 text-sm font-medium">
                      {column}
                    </TableHead>
                  ))}
                  <TableHead className="px-3 py-2 text-sm font-medium">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map(job => (
                  <TableRow key={job.id} className="hover:bg-gray-50">
                    {selectedColumns.map(column => (
                      <TableCell key={`${job.id}-${column}`} className="px-3 py-2 text-sm">
                        {formatCellValue(job, column)}
                      </TableCell>
                    ))}
                    <TableCell className="px-3 py-2 text-sm">
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setViewingJob(job)}>
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Job Details - {job.jobNumber}</DialogTitle>
                            </DialogHeader>
                            {viewingJob && (
                              <div className="grid grid-cols-2 gap-4 py-4">
                                {allColumns.map(column => (
                                  <div key={column} className="space-y-1">
                                    <Label className="text-sm font-medium capitalize">{column}</Label>
                                    <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
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
        </CardContent>
      </Card>
    </div>
  );
}
