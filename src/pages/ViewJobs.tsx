
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Download, Search, Filter, RefreshCw, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Job } from "@/types/job";

const ALL_COLUMNS = [
  { key: 'jobNumber', label: 'Job Number', visible: true },
  { key: 'bookingNo', label: 'Booking No', visible: true },
  { key: 'invoiceNo', label: 'Invoice No', visible: true },
  { key: 'status', label: 'Status', visible: true },
  { key: 'airShippingLine', label: 'Air/Shipping Line', visible: true },
  { key: 'modeOfShipment', label: 'Mode', visible: true },
  { key: 'shipmentType', label: 'Type', visible: true },
  { key: 'lclFclAir', label: 'LCL/FCL/Air', visible: true },
  { key: 'containerFlightNumbers', label: 'Container/Flight No', visible: true },
  { key: 'portOfLoading', label: 'Port of Loading', visible: true },
  { key: 'finalDestination', label: 'Final Destination', visible: true },
  { key: 'etaPod', label: 'ETA POD', visible: true },
  { key: 'grossWeight', label: 'Gross Weight', visible: true },
  { key: 'netWeight', label: 'Net Weight', visible: true },
  { key: 'totalPackages', label: 'Total Packages', visible: true },
  { key: 'terms', label: 'Terms', visible: true },
  { key: 'hblNo', label: 'HBL No', visible: true },
  { key: 'hblDate', label: 'HBL Date', visible: true },
  { key: 'mblNo', label: 'MBL No', visible: true },
  { key: 'mblDate', label: 'MBL Date', visible: true },
  { key: 'rmName', label: 'RM Name', visible: true },
  { key: 'vesselVoyDetails', label: 'Vessel/Voyage Details', visible: true },
  { key: 'consigneeDetails', label: 'Consignee Details', visible: true },
  { key: 'shipperDetails', label: 'Shipper Details', visible: true },
  { key: 'overseasAgentDetails', label: 'Overseas Agent Details', visible: true },
  { key: 'remarks', label: 'Remarks', visible: true },
  { key: 'createdAt', label: 'Created', visible: true },
];

export default function ViewJobs() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [columnSettings, setColumnSettings] = useState(ALL_COLUMNS);
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "jobs"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const jobsData: Job[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        jobsData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Job);
      });
      setJobs(jobsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching jobs:", error);
      toast({
        title: "Error",
        description: "Failed to load jobs. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  useEffect(() => {
    let filtered = jobs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.bookingNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.consigneeDetails.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.shipperDetails.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    // Mode filter
    if (modeFilter !== "all") {
      filtered = filtered.filter(job => job.modeOfShipment === modeFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(job => job.shipmentType === typeFilter);
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, statusFilter, modeFilter, typeFilter]);

  const toggleColumn = (columnKey: string) => {
    setColumnSettings(prev => 
      prev.map(col => 
        col.key === columnKey ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const exportToCSV = () => {
    if (filteredJobs.length === 0) {
      toast({
        title: "No Data",
        description: "No jobs to export.",
        variant: "destructive",
      });
      return;
    }

    const visibleColumns = columnSettings.filter(col => col.visible);
    const headers = visibleColumns.map(col => col.label);

    const csvContent = [
      headers.join(","),
      ...filteredJobs.map(job => visibleColumns.map(col => {
        let value = '';
        switch (col.key) {
          case 'containerFlightNumbers':
            value = Array.isArray(job.containerFlightNumbers) ? job.containerFlightNumbers.join('; ') : '';
            break;
          case 'createdAt':
            value = job.createdAt?.toLocaleDateString() || '';
            break;
          default:
            value = (job as any)[col.key] || '';
        }
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `jobs_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Exported ${filteredJobs.length} jobs to CSV.`,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Active: "default",
      Pending: "secondary",
      Completed: "outline",
      Cancelled: "destructive"
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const renderCellValue = (job: Job, columnKey: string) => {
    switch (columnKey) {
      case 'status':
        return getStatusBadge(job.status);
      case 'containerFlightNumbers':
        return Array.isArray(job.containerFlightNumbers) 
          ? job.containerFlightNumbers.join(', ') 
          : '';
      case 'createdAt':
        return job.createdAt?.toLocaleDateString();
      default:
        return (job as any)[columnKey] || '';
    }
  };

  const visibleColumns = columnSettings.filter(col => col.visible);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading jobs...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                View Jobs ({filteredJobs.length})
              </CardTitle>
              <CardDescription>
                Manage and track all logistics jobs
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowColumnSettings(!showColumnSettings)} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Columns
              </Button>
              <Button onClick={exportToCSV} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Column Settings */}
          {showColumnSettings && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium mb-3">Show/Hide Columns</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {columnSettings.map((column) => (
                  <div key={column.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={column.key}
                      checked={column.visible}
                      onCheckedChange={() => toggleColumn(column.key)}
                    />
                    <Label htmlFor={column.key} className="text-sm">
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="search" className="text-sm font-medium">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mode" className="text-sm font-medium">Mode</Label>
              <Select value={modeFilter} onValueChange={setModeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Modes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="Sea">Sea</SelectItem>
                  <SelectItem value="Air">Air</SelectItem>
                  <SelectItem value="Road">Road</SelectItem>
                  <SelectItem value="Rail">Rail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-medium">Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Import">Import</SelectItem>
                  <SelectItem value="Export">Export</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Actions</Label>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setModeFilter("all");
                  setTypeFilter("all");
                }}
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Jobs Table */}
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.map((column) => (
                    <TableHead key={column.key}>{column.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length} className="text-center py-8 text-gray-500">
                      No jobs found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobs.map((job) => (
                    <TableRow key={job.id}>
                      {visibleColumns.map((column) => (
                        <TableCell key={column.key} className={column.key === 'jobNumber' ? 'font-medium' : ''}>
                          {renderCellValue(job, column.key)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
