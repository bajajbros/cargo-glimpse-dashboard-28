import React, { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Eye, Search, Filter, Download } from 'lucide-react';
import { Job } from '@/types/job';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function ViewJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'jobNumber', 'rmName', 'shipmentType', 'modeOfShipment', 'shipperDetails', 'consigneeDetails', 'overseasAgentDetails', 'bookingNo', 'invoiceNo', 'grossWeight', 'netWeight', 'totalPackages', 'portOfLoading', 'etaPod', 'finalDestination', 'vesselVoyDetails', 'airShippingLine', 'containerFlightNumbers', 'mblNo', 'mblDate', 'hblNo', 'hblDate', 'terms', 'remarks'
  ]);
  const [allColumns, setAllColumns] = useState<string[]>([
    'jobNumber', 'rmName', 'shipmentType', 'modeOfShipment', 'shipperDetails', 'consigneeDetails', 'overseasAgentDetails', 'bookingNo', 'invoiceNo', 'grossWeight', 'netWeight', 'totalPackages', 'portOfLoading', 'etaPod', 'finalDestination', 'vesselVoyDetails', 'airShippingLine', 'containerFlightNumbers', 'mblNo', 'mblDate', 'hblNo', 'hblDate', 'terms', 'remarks'
  ]);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const jobsQuery = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(jobsQuery);
      const jobsList: Job[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      setJobs(jobsList);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const handleColumnSelection = (column: string) => {
    setSelectedColumns(prev =>
      prev.includes(column) ? prev.filter(c => c !== column) : [...prev, column]
    );
  };

  const filteredJobs = jobs.filter(job => {
    const searchableValues = [
      job.jobNumber,
      job.bookingNo,
      job.invoiceNo,
      job.shipperDetails,
      job.consigneeDetails,
      job.rmName,
      job.modeOfShipment,
      job.shipmentType,
    ];
    return searchableValues.some(value => value && value.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const formatCellValue = (job: Job, columnKey: string) => {
    switch (columnKey) {
      case 'containerFlightNumbers':
        return Array.isArray(job.containerFlightNumbers) 
          ? job.containerFlightNumbers.join(', ') 
          : '';
      case 'createdAt':
        if (job.createdAt) {
          // Handle Firebase Timestamp objects
          if (typeof job.createdAt === 'object' && 'toDate' in job.createdAt && typeof job.createdAt.toDate === 'function') {
            return job.createdAt.toDate().toLocaleDateString();
          }
          if (job.createdAt instanceof Date) {
            return job.createdAt.toLocaleDateString();
          }
        }
        return '';
      case 'hblDate':
      case 'mblDate':
        const dateValue = (job as any)[columnKey];
        if (dateValue) {
          // Handle Firebase Timestamp objects
          if (typeof dateValue === 'object' && 'toDate' in dateValue && typeof dateValue.toDate === 'function') {
            return dateValue.toDate().toLocaleDateString();
          }
          if (dateValue instanceof Date) {
            return dateValue.toLocaleDateString();
          }
          // Handle string dates
          if (typeof dateValue === 'string') {
            return dateValue;
          }
        }
        return '';
      default:
        const value = (job as any)[columnKey];
        // Ensure we never render objects directly
        if (value && typeof value === 'object') {
          return JSON.stringify(value);
        }
        return value || '';
    }
  };

  return (
    <div className="p-3 h-full overflow-auto">
      <Card className="max-w-7xl mx-auto shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                View Jobs
              </CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                type="search"
                placeholder="Search jobs..."
                className="max-w-md h-8 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Columns
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3">
                  {allColumns.map(column => (
                    <div key={column} className="flex items-center space-x-2">
                      <Checkbox
                        id={column}
                        checked={selectedColumns.includes(column)}
                        onCheckedChange={() => handleColumnSelection(column)}
                      />
                      <Label htmlFor={column} className="text-sm font-medium capitalize">{column}</Label>
                    </div>
                  ))}
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {selectedColumns.map(column => (
                    <th key={column} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {column}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredJobs.map(job => (
                  <tr key={job.id}>
                    {selectedColumns.map(column => (
                      <td key={`${job.id}-${column}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCellValue(job, column)}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
