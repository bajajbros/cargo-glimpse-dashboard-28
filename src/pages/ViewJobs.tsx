
import React, { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Eye, Search, Filter, Download, Edit, Calendar, X, FileText, RefreshCw } from 'lucide-react';
import { Job } from '@/types/job';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FilterableSelect } from '@/components/FilterableSelect';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ViewJobs() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'jobNumber', 'rmName', 'shipmentType', 'modeOfShipment', 'shipperDetails', 'consigneeDetails', 'bookingNo', 'invoiceNo', 'grossWeight', 'netWeight', 'totalPackages', 'portOfLoading', 'etaPod', 'finalDestination'
  ]);
  const [allColumns, setAllColumns] = useState<string[]>([
    'jobNumber', 'rmName', 'shipmentType', 'modeOfShipment', 'shipperDetails', 'consigneeDetails', 'overseasAgentDetails', 'bookingNo', 'invoiceNo', 'grossWeight', 'netWeight', 'totalPackages', 'portOfLoading', 'etaPod', 'finalDestination', 'vesselVoyDetails', 'airShippingLine', 'containerFlightNumbers', 'mblNo', 'mblDate', 'hblNo', 'hblDate', 'terms', 'remarks'
  ]);

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

  // Edit dialog state
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Job>>({});
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

  const handleSaveEdit = async () => {
    if (!editingJob) return;

    try {
      const jobRef = doc(db, 'jobs', editingJob.id);
      await updateDoc(jobRef, {
        ...editFormData,
        updatedAt: new Date()
      });

      // Update local state
      setJobs(prev => prev.map(job => 
        job.id === editingJob.id ? { ...job, ...editFormData } : job
      ));

      setEditingJob(null);
      setEditFormData({});

      toast({
        title: "Job Updated",
        description: "Job details have been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating job:', error);
      toast({
        title: "Error",
        description: "Failed to update job. Please try again.",
        variant: "destructive",
      });
    }
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
    <div className="p-2 h-full overflow-auto bg-gradient-to-br from-gray-50 to-blue-50">
      <Card className="max-w-full mx-auto shadow-xl bg-white border-0">
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <FileText className="w-5 h-5" />
                Jobs Management ({filteredJobs.length})
              </CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                type="search"
                placeholder="Search jobs..."
                className="max-w-xs h-8 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/70"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
                className="h-8 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchJobs}
                className="h-8 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-3">
          {/* Compact Filters */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="h-7 text-xs"
              >
                <Filter className="w-3 h-3 mr-1" />
                Filters {Object.values(filters).some(v => v) && <Badge className="ml-1 h-4 px-1 text-xs">Active</Badge>}
              </Button>
              <div className="flex items-center space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      <Eye className="w-3 h-3 mr-1" />
                      Columns
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-3">
                    <div className="max-h-60 overflow-y-auto">
                      {allColumns.map(column => (
                        <div key={column} className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            id={column}
                            checked={selectedColumns.includes(column)}
                            onCheckedChange={() => handleColumnSelection(column)}
                          />
                          <Label htmlFor={column} className="text-xs font-medium capitalize">
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
              <div className="bg-gray-50 p-3 rounded-lg border">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-2">
                  <div>
                    <Label className="text-xs">RM Name</Label>
                    <FilterableSelect
                      options={uniqueValues.rmNames.map(name => ({ value: name, label: name }))}
                      value={filters.rmName}
                      onValueChange={(value) => handleFilterChange('rmName', value)}
                      placeholder="All RMs"
                      className="h-7 text-xs"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Shipment Type</Label>
                    <FilterableSelect
                      options={[
                        { value: 'Import', label: 'Import' },
                        { value: 'Export', label: 'Export' }
                      ]}
                      value={filters.shipmentType}
                      onValueChange={(value) => handleFilterChange('shipmentType', value)}
                      placeholder="All Types"
                      className="h-7 text-xs"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Mode</Label>
                    <FilterableSelect
                      options={[
                        { value: 'Air', label: 'Air' },
                        { value: 'Sea', label: 'Sea' }
                      ]}
                      value={filters.modeOfShipment}
                      onValueChange={(value) => handleFilterChange('modeOfShipment', value)}
                      placeholder="All Modes"
                      className="h-7 text-xs"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Status</Label>
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
                      className="h-7 text-xs"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">From Date</Label>
                    <Input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">To Date</Label>
                    <Input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  <div>
                    <Label className="text-xs">Shipper</Label>
                    <FilterableSelect
                      options={uniqueValues.shippers.map(name => ({ value: name, label: name }))}
                      value={filters.shipper}
                      onValueChange={(value) => handleFilterChange('shipper', value)}
                      placeholder="All Shippers"
                      className="h-7 text-xs"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Consignee</Label>
                    <FilterableSelect
                      options={uniqueValues.consignees.map(name => ({ value: name, label: name }))}
                      value={filters.consignee}
                      onValueChange={(value) => handleFilterChange('consignee', value)}
                      placeholder="All Consignees"
                      className="h-7 text-xs"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Overseas Agent</Label>
                    <FilterableSelect
                      options={uniqueValues.overseasAgents.map(name => ({ value: name, label: name }))}
                      value={filters.overseasAgent}
                      onValueChange={(value) => handleFilterChange('overseasAgent', value)}
                      placeholder="All Agents"
                      className="h-7 text-xs"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs">Port of Loading</Label>
                    <FilterableSelect
                      options={uniqueValues.portsOfLoading.map(name => ({ value: name, label: name }))}
                      value={filters.portOfLoading}
                      onValueChange={(value) => handleFilterChange('portOfLoading', value)}
                      placeholder="All Ports"
                      className="h-7 text-xs"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="h-7 w-full text-xs"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Compact Table */}
          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  {selectedColumns.map(column => (
                    <TableHead key={column} className="px-2 py-2 text-xs font-medium text-gray-600 uppercase tracking-wider">
                      {column}
                    </TableHead>
                  ))}
                  <TableHead className="px-2 py-2 text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map(job => (
                  <TableRow key={job.id} className="hover:bg-gray-50 transition-colors">
                    {selectedColumns.map(column => (
                      <TableCell key={`${job.id}-${column}`} className="px-2 py-2 text-xs text-gray-600">
                        {formatCellValue(job, column)}
                      </TableCell>
                    ))}
                    <TableCell className="px-2 py-2 text-xs font-medium">
                      <div className="flex space-x-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setViewingJob(job)}>
                              <Eye className="w-3 h-3 mr-1" />
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
                          className="h-6 px-2 text-xs" 
                          onClick={() => handleEditJob(job)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
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
