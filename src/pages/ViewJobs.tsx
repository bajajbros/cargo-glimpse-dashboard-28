
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Search, FileText, Filter, ChevronDown } from "lucide-react";

// Extended sample data with all fields
const sampleJobs = [
  {
    id: 1,
    jobNumber: "FF-10010/25-26",
    bookingNo: "3426",
    airShippingLine: "ONE",
    consigneeDetails: "CROWNWELL INTERNATIONAL",
    containerFlightNo: "ONEU0044026",
    etaPod: "25/04/2025",
    finalDestination: "ICD TKD",
    grossWeight: "10148.00",
    hblNo: "TPENDL25040858",
    invoiceNo: "3426",
    modeOfShipment: "Sea",
    netWeight: "9800",
    overseasAgentDetails: "ORIENTAL VANGUARD LOGISTICS CO LTD",
    portOfLoading: "KAOHSIUNG",
    rmName: "Manish Kumar",
    shipmentType: "Import",
    shipperDetails: "GINKO FILM",
    status: "Active",
    terms: "FOB",
    totalPackages: "15 PLTS",
    vesselVoyDetails: "EVER EAGLE - 188W",
    mblNo: "ONEYTPEF2627600",
    remarks: "BILL AS PER QUOTE",
    createdAt: "17 May 2025",
    lclFclAir: "FCL",
    hblDate: "25/04/2025",
    mblDate: "25/04/2025",
  },
  {
    id: 2,
    jobNumber: "FF-10011/25-26",
    bookingNo: "3427",
    airShippingLine: "MSC",
    consigneeDetails: "GLOBAL TRADERS LTD",
    containerFlightNo: "MSCU1234567",
    etaPod: "28/04/2025",
    finalDestination: "ICD DADRI",
    grossWeight: "8500.00",
    hblNo: "MSCBL25040859",
    invoiceNo: "3427",
    modeOfShipment: "Sea",
    netWeight: "8000",
    overseasAgentDetails: "PACIFIC LOGISTICS PTE LTD",
    portOfLoading: "SINGAPORE",
    rmName: "Priya Sharma",
    shipmentType: "Import",
    shipperDetails: "TECH COMPONENTS INC",
    status: "Pending",
    terms: "CIF",
    totalPackages: "20 CTNS",
    vesselVoyDetails: "MSC GAYANE - 142E",
    mblNo: "MSCUYTEF2627601",
    remarks: "HANDLE WITH CARE",
    createdAt: "18 May 2025",
    lclFclAir: "LCL",
    hblDate: "26/04/2025",
    mblDate: "26/04/2025",
  },
  {
    id: 3,
    jobNumber: "FF-10012/25-26",
    bookingNo: "3428",
    airShippingLine: "MAERSK",
    consigneeDetails: "INDUSTRIAL SOLUTIONS PVT LTD",
    containerFlightNo: "MAEU7654321",
    etaPod: "30/04/2025",
    finalDestination: "ICD TKD",
    grossWeight: "12000.00",
    hblNo: "MAERBL25040860",
    invoiceNo: "3428",
    modeOfShipment: "Sea",
    netWeight: "11500",
    overseasAgentDetails: "HAMBURG SUD LOGISTICS",
    portOfLoading: "HAMBURG",
    rmName: "Rajesh Gupta",
    shipmentType: "Import",
    shipperDetails: "EUROPEAN MACHINERY GMBH",
    status: "Completed",
    terms: "FOB",
    totalPackages: "5 PACKAGES",
    vesselVoyDetails: "MAERSK ESSEX - 201W",
    mblNo: "MAEUYTEF2627602",
    remarks: "FRAGILE ITEMS",
    createdAt: "19 May 2025",
    lclFclAir: "FCL",
    hblDate: "27/04/2025",
    mblDate: "27/04/2025",
  },
  {
    id: 4,
    jobNumber: "FF-10013/25-26",
    bookingNo: "3429",
    airShippingLine: "COSCO",
    consigneeDetails: "FASHION HOUSE INDIA",
    containerFlightNo: "COSU9876543",
    etaPod: "02/05/2025",
    finalDestination: "ICD BANGALORE",
    grossWeight: "6500.00",
    hblNo: "COSBL25040861",
    invoiceNo: "3429",
    modeOfShipment: "Sea",
    netWeight: "6000",
    overseasAgentDetails: "CHINA SHIPPING AGENT",
    portOfLoading: "SHANGHAI",
    rmName: "Anita Singh",
    shipmentType: "Import",
    shipperDetails: "TEXTILE MANUFACTURING CO",
    status: "Active",
    terms: "CIF",
    totalPackages: "50 BALES",
    vesselVoyDetails: "COSCO PRIDE - 305E",
    mblNo: "COSUYTEF2627603",
    remarks: "TEXTILE GOODS",
    createdAt: "20 May 2025",
    lclFclAir: "LCL",
    hblDate: "28/04/2025",
    mblDate: "28/04/2025",
  },
  {
    id: 5,
    jobNumber: "FF-10014/25-26",
    bookingNo: "3430",
    airShippingLine: "CMA CGM",
    consigneeDetails: "AUTOMOBILE PARTS LTD",
    containerFlightNo: "CMAU5555555",
    etaPod: "05/05/2025",
    finalDestination: "ICD CHENNAI",
    grossWeight: "9200.00",
    hblNo: "CMABL25040862",
    invoiceNo: "3430",
    modeOfShipment: "Sea",
    netWeight: "8800",
    overseasAgentDetails: "FRENCH LOGISTICS SARL",
    portOfLoading: "LE HAVRE",
    rmName: "Vikram Patel",
    shipmentType: "Import",
    shipperDetails: "AUTO COMPONENTS FRANCE",
    status: "Pending",
    terms: "FOB",
    totalPackages: "25 CRATES",
    vesselVoyDetails: "CMA CGM MARCO POLO - 410W",
    mblNo: "CMAUYTEF2627604",
    remarks: "AUTO PARTS - URGENT",
    createdAt: "21 May 2025",
    lclFclAir: "FCL",
    hblDate: "29/04/2025",
    mblDate: "29/04/2025",
  },
  {
    id: 6,
    jobNumber: "FF-10015/25-26",
    bookingNo: "3431",
    airShippingLine: "HAPAG LLOYD",
    consigneeDetails: "ELECTRONICS INDIA PVT LTD",
    containerFlightNo: "HLCU1111111",
    etaPod: "08/05/2025",
    finalDestination: "ICD MUMBAI",
    grossWeight: "7800.00",
    hblNo: "HLBL25040863",
    invoiceNo: "3431",
    modeOfShipment: "Sea",
    netWeight: "7400",
    overseasAgentDetails: "GERMAN SHIPPING GMBH",
    portOfLoading: "BREMEN",
    rmName: "Kavita Joshi",
    shipmentType: "Import",
    shipperDetails: "ELECTRONIC DEVICES GMBH",
    status: "Cancelled",
    terms: "CIF",
    totalPackages: "30 BOXES",
    vesselVoyDetails: "HAPAG EXPRESS - 515E",
    mblNo: "HLCUYTEF2627605",
    remarks: "CANCELLED DUE TO DELAY",
    createdAt: "22 May 2025",
    lclFclAir: "LCL",
    hblDate: "30/04/2025",
    mblDate: "30/04/2025",
  },
  {
    id: 7,
    jobNumber: "FF-10016/25-26",
    bookingNo: "3432",
    airShippingLine: "EVERGREEN",
    consigneeDetails: "PHARMACEUTICAL CORP",
    containerFlightNo: "EVGU2222222",
    etaPod: "10/05/2025",
    finalDestination: "ICD HYDERABAD",
    grossWeight: "5500.00",
    hblNo: "EVBL25040864",
    invoiceNo: "3432",
    modeOfShipment: "Sea",
    netWeight: "5200",
    overseasAgentDetails: "TAIWAN LOGISTICS CO",
    portOfLoading: "KAOHSIUNG",
    rmName: "Arjun Reddy",
    shipmentType: "Import",
    shipperDetails: "MEDICAL SUPPLIES TAIWAN",
    status: "Active",
    terms: "FOB",
    totalPackages: "100 VIALS",
    vesselVoyDetails: "EVER GIVEN - 620W",
    mblNo: "EVGUYTEF2627606",
    remarks: "TEMPERATURE CONTROLLED",
    createdAt: "23 May 2025",
    lclFclAir: "Air",
    hblDate: "01/05/2025",
    mblDate: "01/05/2025",
  },
  {
    id: 8,
    jobNumber: "FF-10017/25-26",
    bookingNo: "3433",
    airShippingLine: "YANG MING",
    consigneeDetails: "CONSTRUCTION MATERIALS LTD",
    containerFlightNo: "YMLU3333333",
    etaPod: "12/05/2025",
    finalDestination: "ICD PUNE",
    grossWeight: "15000.00",
    hblNo: "YMBL25040865",
    invoiceNo: "3433",
    modeOfShipment: "Sea",
    netWeight: "14500",
    overseasAgentDetails: "TAIWAN FREIGHT FORWARDERS",
    portOfLoading: "KEELUNG",
    rmName: "Deepak Kumar",
    shipmentType: "Import",
    shipperDetails: "BUILDING MATERIALS TAIWAN",
    status: "Completed",
    terms: "CIF",
    totalPackages: "10 PALLETS",
    vesselVoyDetails: "YM EXCELLENCE - 725E",
    mblNo: "YMLUYTEF2627607",
    remarks: "HEAVY MACHINERY PARTS",
    createdAt: "24 May 2025",
    lclFclAir: "FCL",
    hblDate: "02/05/2025",
    mblDate: "02/05/2025",
  },
  {
    id: 9,
    jobNumber: "EX-10001/25-26",
    bookingNo: "3434",
    airShippingLine: "EMIRATES",
    consigneeDetails: "MIDDLE EAST TRADING LLC",
    containerFlightNo: "EK445",
    etaPod: "15/05/2025",
    finalDestination: "DUBAI AIRPORT",
    grossWeight: "2500.00",
    hblNo: "EMBL25040866",
    invoiceNo: "3434",
    modeOfShipment: "Air",
    netWeight: "2300",
    overseasAgentDetails: "DUBAI CARGO SERVICES",
    portOfLoading: "MUMBAI",
    rmName: "Neha Agarwal",
    shipmentType: "Export",
    shipperDetails: "GEMS & JEWELRY EXPORTS",
    status: "Active",
    terms: "FOB",
    totalPackages: "5 CASES",
    vesselVoyDetails: "EMIRATES FLIGHT EK445",
    mblNo: "EMYTEF2627608",
    remarks: "HIGH VALUE CARGO",
    createdAt: "25 May 2025",
    lclFclAir: "Air",
    hblDate: "03/05/2025",
    mblDate: "03/05/2025",
  },
  {
    id: 10,
    jobNumber: "EX-10002/25-26",
    bookingNo: "3435",
    airShippingLine: "LUFTHANSA",
    consigneeDetails: "EUROPEAN DISTRIBUTORS GMBH",
    containerFlightNo: "LH764",
    etaPod: "18/05/2025",
    finalDestination: "FRANKFURT AIRPORT",
    grossWeight: "3200.00",
    hblNo: "LHBL25040867",
    invoiceNo: "3435",
    modeOfShipment: "Air",
    netWeight: "3000",
    overseasAgentDetails: "GERMAN AIR CARGO",
    portOfLoading: "DELHI",
    rmName: "Rohit Sharma",
    shipmentType: "Export",
    shipperDetails: "SPICES & FOOD PRODUCTS",
    status: "Pending",
    terms: "CIF",
    totalPackages: "20 BAGS",
    vesselVoyDetails: "LUFTHANSA FLIGHT LH764",
    mblNo: "LHYTEF2627609",
    remarks: "FOOD GRADE PRODUCTS",
    createdAt: "26 May 2025",
    lclFclAir: "Air",
    hblDate: "04/05/2025",
    mblDate: "04/05/2025",
  },
];

type FilterType = {
  [key: string]: string[];
};

export default function ViewJobs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [jobs] = useState(sampleJobs);
  const [filters, setFilters] = useState<FilterType>({});
  const [activeFilters, setActiveFilters] = useState<FilterType>({});

  // Get unique values for each column for filtering
  const getUniqueValues = (key: keyof typeof sampleJobs[0]) => {
    return [...new Set(jobs.map(job => job[key] as string))].sort();
  };

  const columnFilters = useMemo(() => ({
    status: getUniqueValues('status'),
    modeOfShipment: getUniqueValues('modeOfShipment'),
    shipmentType: getUniqueValues('shipmentType'),
    airShippingLine: getUniqueValues('airShippingLine'),
    finalDestination: getUniqueValues('finalDestination'),
    portOfLoading: getUniqueValues('portOfLoading'),
    rmName: getUniqueValues('rmName'),
    terms: getUniqueValues('terms'),
    lclFclAir: getUniqueValues('lclFclAir'),
  }), [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      // Text search filter
      const matchesSearch = searchTerm === "" || 
        Object.values(job).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );

      // Column filters
      const matchesFilters = Object.entries(activeFilters).every(([column, values]) => {
        if (values.length === 0) return true;
        return values.includes(job[column as keyof typeof job] as string);
      });

      return matchesSearch && matchesFilters;
    });
  }, [jobs, searchTerm, activeFilters]);

  const toggleFilter = (column: string, value: string) => {
    setActiveFilters(prev => {
      const currentValues = prev[column] || [];
      const isSelected = currentValues.includes(value);
      
      if (isSelected) {
        const newValues = currentValues.filter(v => v !== value);
        if (newValues.length === 0) {
          const { [column]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [column]: newValues };
      } else {
        return { ...prev, [column]: [...currentValues, value] };
      }
    });
  };

  const clearFilters = () => {
    setActiveFilters({});
    setSearchTerm("");
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const FilterDropdown = ({ column, label, values }: { column: string; label: string; values: string[] }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          {label}
          {(activeFilters[column]?.length || 0) > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
              {activeFilters[column]?.length}
            </Badge>
          )}
          <ChevronDown className="ml-1 h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel>{label} Filters</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {values.map((value) => (
          <DropdownMenuCheckboxItem
            key={value}
            checked={activeFilters[column]?.includes(value) || false}
            onCheckedChange={() => toggleFilter(column, value)}
          >
            {value}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Jobs
          </CardTitle>
          <CardDescription>
            View and manage all logistics jobs with advanced filtering
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search all fields..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button variant="outline">
                Export
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <FilterDropdown column="status" label="Status" values={columnFilters.status} />
              <FilterDropdown column="modeOfShipment" label="Mode" values={columnFilters.modeOfShipment} />
              <FilterDropdown column="shipmentType" label="Type" values={columnFilters.shipmentType} />
              <FilterDropdown column="airShippingLine" label="Shipping Line" values={columnFilters.airShippingLine} />
              <FilterDropdown column="finalDestination" label="Destination" values={columnFilters.finalDestination} />
              <FilterDropdown column="portOfLoading" label="Port" values={columnFilters.portOfLoading} />
              <FilterDropdown column="rmName" label="RM Name" values={columnFilters.rmName} />
              <FilterDropdown column="terms" label="Terms" values={columnFilters.terms} />
              <FilterDropdown column="lclFclAir" label="LCL/FCL/Air" values={columnFilters.lclFclAir} />
            </div>

            {Object.keys(activeFilters).length > 0 && (
              <div className="flex flex-wrap gap-1">
                {Object.entries(activeFilters).map(([column, values]) =>
                  values.map((value) => (
                    <Badge
                      key={`${column}-${value}`}
                      variant="secondary"
                      className="text-xs"
                    >
                      {column}: {value}
                      <button
                        className="ml-1 hover:text-red-500"
                        onClick={() => toggleFilter(column, value)}
                      >
                        ×
                      </button>
                    </Badge>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="rounded-md border mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-50">
                  <TableHead className="font-semibold min-w-[120px]">Job Number</TableHead>
                  <TableHead className="font-semibold min-w-[100px]">Booking No</TableHead>
                  <TableHead className="font-semibold min-w-[120px]">Shipping Line</TableHead>
                  <TableHead className="font-semibold min-w-[180px]">Consignee</TableHead>
                  <TableHead className="font-semibold min-w-[180px]">Shipper</TableHead>
                  <TableHead className="font-semibold min-w-[80px]">Mode</TableHead>
                  <TableHead className="font-semibold min-w-[80px]">Type</TableHead>
                  <TableHead className="font-semibold min-w-[120px]">Container/Flight</TableHead>
                  <TableHead className="font-semibold min-w-[120px]">Port of Loading</TableHead>
                  <TableHead className="font-semibold min-w-[120px]">Final Destination</TableHead>
                  <TableHead className="font-semibold min-w-[100px]">ETA POD</TableHead>
                  <TableHead className="font-semibold min-w-[100px]">Gross Weight</TableHead>
                  <TableHead className="font-semibold min-w-[100px]">Net Weight</TableHead>
                  <TableHead className="font-semibold min-w-[120px]">Total Packages</TableHead>
                  <TableHead className="font-semibold min-w-[120px]">HBL No</TableHead>
                  <TableHead className="font-semibold min-w-[100px]">HBL Date</TableHead>
                  <TableHead className="font-semibold min-w-[120px]">MBL No</TableHead>
                  <TableHead className="font-semibold min-w-[100px]">MBL Date</TableHead>
                  <TableHead className="font-semibold min-w-[180px]">Vessel/Voyage</TableHead>
                  <TableHead className="font-semibold min-w-[180px]">Overseas Agent</TableHead>
                  <TableHead className="font-semibold min-w-[100px]">RM Name</TableHead>
                  <TableHead className="font-semibold min-w-[80px]">Terms</TableHead>
                  <TableHead className="font-semibold min-w-[100px]">LCL/FCL/Air</TableHead>
                  <TableHead className="font-semibold min-w-[100px]">Invoice No</TableHead>
                  <TableHead className="font-semibold min-w-[150px]">Remarks</TableHead>
                  <TableHead className="font-semibold min-w-[80px]">Status</TableHead>
                  <TableHead className="font-semibold min-w-[100px]">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map((job) => (
                  <TableRow key={job.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-blue-600">
                      {job.jobNumber}
                    </TableCell>
                    <TableCell>{job.bookingNo}</TableCell>
                    <TableCell>{job.airShippingLine}</TableCell>
                    <TableCell className="max-w-[180px] truncate">
                      {job.consigneeDetails}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate">
                      {job.shipperDetails}
                    </TableCell>
                    <TableCell>{job.modeOfShipment}</TableCell>
                    <TableCell>{job.shipmentType}</TableCell>
                    <TableCell>{job.containerFlightNo}</TableCell>
                    <TableCell>{job.portOfLoading}</TableCell>
                    <TableCell>{job.finalDestination}</TableCell>
                    <TableCell>{job.etaPod}</TableCell>
                    <TableCell>{job.grossWeight}</TableCell>
                    <TableCell>{job.netWeight}</TableCell>
                    <TableCell>{job.totalPackages}</TableCell>
                    <TableCell>{job.hblNo}</TableCell>
                    <TableCell>{job.hblDate}</TableCell>
                    <TableCell>{job.mblNo}</TableCell>
                    <TableCell>{job.mblDate}</TableCell>
                    <TableCell className="max-w-[180px] truncate">
                      {job.vesselVoyDetails}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate">
                      {job.overseasAgentDetails}
                    </TableCell>
                    <TableCell>{job.rmName}</TableCell>
                    <TableCell>{job.terms}</TableCell>
                    <TableCell>{job.lclFclAir}</TableCell>
                    <TableCell>{job.invoiceNo}</TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {job.remarks}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(job.status)} variant="secondary">
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{job.createdAt}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredJobs.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No jobs found matching your search criteria.</p>
            </div>
          )}

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-600">
              Showing {filteredJobs.length} of {jobs.length} jobs
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
