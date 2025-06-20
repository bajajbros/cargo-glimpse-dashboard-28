
import React, { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Search, RefreshCw, FileText } from 'lucide-react';
import { Job } from '@/types/job';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { JobFilters } from '@/components/JobFilters';
import { JobsTable } from '@/components/JobsTable';
import { ColumnSelector } from '@/components/ColumnSelector';
import { applyJobFilters, extractUniqueValues, JobFilters as JobFiltersType } from '@/utils/jobFilters';
import { formatCellValue } from '@/utils/jobFormatters';

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
  const [filters, setFilters] = useState<JobFiltersType>({
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

  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    const filtered = applyJobFilters(jobs, searchQuery, filters);
    setFilteredJobs(filtered);
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
      setUniqueValues(extractUniqueValues(jobsList));
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
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
          <JobFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
            uniqueValues={uniqueValues}
            filtersOpen={filtersOpen}
            setFiltersOpen={setFiltersOpen}
          />

          <div className="flex items-center justify-end mb-4">
            <ColumnSelector
              allColumns={allColumns}
              selectedColumns={selectedColumns}
              onColumnSelection={handleColumnSelection}
            />
          </div>

          <JobsTable
            jobs={filteredJobs}
            selectedColumns={selectedColumns}
            allColumns={allColumns}
            onEditJob={handleEditJob}
          />
        </CardContent>
      </Card>
    </div>
  );
}
