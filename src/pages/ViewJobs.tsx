
import { useState } from "react";
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
import { Search, FileText } from "lucide-react";

// Sample data based on the fields you provided
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
  },
];

export default function ViewJobs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [jobs] = useState(sampleJobs);

  const filteredJobs = jobs.filter(job =>
    job.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.consigneeDetails.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.shipperDetails.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.rmName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Jobs
          </CardTitle>
          <CardDescription>
            View and manage all logistics jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              Export
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-50">
                  <TableHead className="font-semibold">Job Number</TableHead>
                  <TableHead className="font-semibold">Booking No</TableHead>
                  <TableHead className="font-semibold">Shipping Line</TableHead>
                  <TableHead className="font-semibold">Consignee</TableHead>
                  <TableHead className="font-semibold">Shipper</TableHead>
                  <TableHead className="font-semibold">Mode</TableHead>
                  <TableHead className="font-semibold">Port of Loading</TableHead>
                  <TableHead className="font-semibold">Final Destination</TableHead>
                  <TableHead className="font-semibold">ETA POD</TableHead>
                  <TableHead className="font-semibold">RM Name</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Created</TableHead>
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
                    <TableCell className="max-w-[200px] truncate">
                      {job.consigneeDetails}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {job.shipperDetails}
                    </TableCell>
                    <TableCell>{job.modeOfShipment}</TableCell>
                    <TableCell>{job.portOfLoading}</TableCell>
                    <TableCell>{job.finalDestination}</TableCell>
                    <TableCell>{job.etaPod}</TableCell>
                    <TableCell>{job.rmName}</TableCell>
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
              <p className="text-gray-500">No jobs found matching your search.</p>
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
