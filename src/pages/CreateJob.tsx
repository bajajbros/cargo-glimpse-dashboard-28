
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Plus, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CreateJob() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    airShippingLine: "",
    bookingNo: "",
    consigneeDetails: "",
    containerFlightNo: "",
    etaPod: "",
    finalDestination: "",
    grossWeight: "",
    hblDate: "",
    hblNo: "",
    invoiceNo: "",
    jobNumber: "",
    lclFclAir: "",
    mblDate: "",
    mblNo: "",
    modeOfShipment: "",
    netWeight: "",
    overseasAgentDetails: "",
    portOfLoading: "",
    remarks: "",
    rmName: "",
    shipmentType: "",
    shipperDetails: "",
    status: "",
    terms: "",
    totalPackages: "",
    vesselVoyDetails: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    toast({
      title: "Job Created Successfully",
      description: `Job ${formData.jobNumber || 'New Job'} has been created.`,
    });
    
    // Reset form
    setFormData({
      airShippingLine: "",
      bookingNo: "",
      consigneeDetails: "",
      containerFlightNo: "",
      etaPod: "",
      finalDestination: "",
      grossWeight: "",
      hblDate: "",
      hblNo: "",
      invoiceNo: "",
      jobNumber: "",
      lclFclAir: "",
      mblDate: "",
      mblNo: "",
      modeOfShipment: "",
      netWeight: "",
      overseasAgentDetails: "",
      portOfLoading: "",
      remarks: "",
      rmName: "",
      shipmentType: "",
      shipperDetails: "",
      status: "",
      terms: "",
      totalPackages: "",
      vesselVoyDetails: "",
    });
  };

  return (
    <div className="p-3 h-full overflow-auto">
      <Card className="max-w-7xl mx-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="h-4 w-4" />
                Create New Job
              </CardTitle>
              <CardDescription className="text-sm">
                Enter job details for logistics management
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              Draft
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Grid Layout for Maximum Space Utilization */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Row 1 */}
              <div className="space-y-1">
                <Label htmlFor="jobNumber" className="text-xs font-medium">Job Number</Label>
                <Input
                  id="jobNumber"
                  value={formData.jobNumber}
                  onChange={(e) => handleInputChange("jobNumber", e.target.value)}
                  placeholder="FF-10010/25-26"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bookingNo" className="text-xs font-medium">Booking Number</Label>
                <Input
                  id="bookingNo"
                  value={formData.bookingNo}
                  onChange={(e) => handleInputChange("bookingNo", e.target.value)}
                  placeholder="3426"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="invoiceNo" className="text-xs font-medium">Invoice Number</Label>
                <Input
                  id="invoiceNo"
                  value={formData.invoiceNo}
                  onChange={(e) => handleInputChange("invoiceNo", e.target.value)}
                  placeholder="3426"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="status" className="text-xs font-medium">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Row 2 */}
              <div className="space-y-1">
                <Label htmlFor="airShippingLine" className="text-xs font-medium">Air/Shipping Line</Label>
                <Input
                  id="airShippingLine"
                  value={formData.airShippingLine}
                  onChange={(e) => handleInputChange("airShippingLine", e.target.value)}
                  placeholder="ONE"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="modeOfShipment" className="text-xs font-medium">Mode of Shipment</Label>
                <Select value={formData.modeOfShipment} onValueChange={(value) => handleInputChange("modeOfShipment", value)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sea">Sea</SelectItem>
                    <SelectItem value="Air">Air</SelectItem>
                    <SelectItem value="Road">Road</SelectItem>
                    <SelectItem value="Rail">Rail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="shipmentType" className="text-xs font-medium">Shipment Type</Label>
                <Select value={formData.shipmentType} onValueChange={(value) => handleInputChange("shipmentType", value)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Import">Import</SelectItem>
                    <SelectItem value="Export">Export</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="lclFclAir" className="text-xs font-medium">LCL/FCL/Air</Label>
                <Select value={formData.lclFclAir} onValueChange={(value) => handleInputChange("lclFclAir", value)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LCL">LCL</SelectItem>
                    <SelectItem value="FCL">FCL</SelectItem>
                    <SelectItem value="Air">Air</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Row 3 */}
              <div className="space-y-1">
                <Label htmlFor="containerFlightNo" className="text-xs font-medium">Container/Flight No</Label>
                <Input
                  id="containerFlightNo"
                  value={formData.containerFlightNo}
                  onChange={(e) => handleInputChange("containerFlightNo", e.target.value)}
                  placeholder="ONEU0044026"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="portOfLoading" className="text-xs font-medium">Port of Loading</Label>
                <Input
                  id="portOfLoading"
                  value={formData.portOfLoading}
                  onChange={(e) => handleInputChange("portOfLoading", e.target.value)}
                  placeholder="KAOHSIUNG"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="finalDestination" className="text-xs font-medium">Final Destination</Label>
                <Input
                  id="finalDestination"
                  value={formData.finalDestination}
                  onChange={(e) => handleInputChange("finalDestination", e.target.value)}
                  placeholder="ICD TKD"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="etaPod" className="text-xs font-medium">ETA POD</Label>
                <Input
                  id="etaPod"
                  type="date"
                  value={formData.etaPod}
                  onChange={(e) => handleInputChange("etaPod", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>

              {/* Row 4 */}
              <div className="space-y-1">
                <Label htmlFor="grossWeight" className="text-xs font-medium">Gross Weight</Label>
                <Input
                  id="grossWeight"
                  value={formData.grossWeight}
                  onChange={(e) => handleInputChange("grossWeight", e.target.value)}
                  placeholder="10148.00"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="netWeight" className="text-xs font-medium">Net Weight</Label>
                <Input
                  id="netWeight"
                  value={formData.netWeight}
                  onChange={(e) => handleInputChange("netWeight", e.target.value)}
                  placeholder="9800"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="totalPackages" className="text-xs font-medium">Total Packages</Label>
                <Input
                  id="totalPackages"
                  value={formData.totalPackages}
                  onChange={(e) => handleInputChange("totalPackages", e.target.value)}
                  placeholder="15 PLTS"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="terms" className="text-xs font-medium">Terms</Label>
                <Select value={formData.terms} onValueChange={(value) => handleInputChange("terms", value)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FOB">FOB</SelectItem>
                    <SelectItem value="CIF">CIF</SelectItem>
                    <SelectItem value="CFR">CFR</SelectItem>
                    <SelectItem value="EXW">EXW</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Row 5 */}
              <div className="space-y-1">
                <Label htmlFor="hblNo" className="text-xs font-medium">HBL Number</Label>
                <Input
                  id="hblNo"
                  value={formData.hblNo}
                  onChange={(e) => handleInputChange("hblNo", e.target.value)}
                  placeholder="TPENDL25040858"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="hblDate" className="text-xs font-medium">HBL Date</Label>
                <Input
                  id="hblDate"
                  type="date"
                  value={formData.hblDate}
                  onChange={(e) => handleInputChange("hblDate", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="mblNo" className="text-xs font-medium">MBL Number</Label>
                <Input
                  id="mblNo"
                  value={formData.mblNo}
                  onChange={(e) => handleInputChange("mblNo", e.target.value)}
                  placeholder="ONEYTPEF2627600"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="mblDate" className="text-xs font-medium">MBL Date</Label>
                <Input
                  id="mblDate"
                  type="date"
                  value={formData.mblDate}
                  onChange={(e) => handleInputChange("mblDate", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>

              {/* Row 6 */}
              <div className="space-y-1">
                <Label htmlFor="rmName" className="text-xs font-medium">RM Name</Label>
                <Input
                  id="rmName"
                  value={formData.rmName}
                  onChange={(e) => handleInputChange("rmName", e.target.value)}
                  placeholder="Manish Kumar"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1 lg:col-span-3">
                <Label htmlFor="vesselVoyDetails" className="text-xs font-medium">Vessel/Voyage Details</Label>
                <Input
                  id="vesselVoyDetails"
                  value={formData.vesselVoyDetails}
                  onChange={(e) => handleInputChange("vesselVoyDetails", e.target.value)}
                  placeholder="EVER EAGLE - 188W"
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Full Width Fields */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="consigneeDetails" className="text-xs font-medium">Consignee Details</Label>
                <Textarea
                  id="consigneeDetails"
                  value={formData.consigneeDetails}
                  onChange={(e) => handleInputChange("consigneeDetails", e.target.value)}
                  placeholder="CROWNWELL INTERNATIONAL"
                  className="min-h-[60px] text-sm resize-none"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="shipperDetails" className="text-xs font-medium">Shipper Details</Label>
                <Textarea
                  id="shipperDetails"
                  value={formData.shipperDetails}
                  onChange={(e) => handleInputChange("shipperDetails", e.target.value)}
                  placeholder="GINKO FILM"
                  className="min-h-[60px] text-sm resize-none"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="overseasAgentDetails" className="text-xs font-medium">Overseas Agent Details</Label>
                <Textarea
                  id="overseasAgentDetails"
                  value={formData.overseasAgentDetails}
                  onChange={(e) => handleInputChange("overseasAgentDetails", e.target.value)}
                  placeholder="ORIENTAL VANGUARD LOGISTICS CO LTD"
                  className="min-h-[60px] text-sm resize-none"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="remarks" className="text-xs font-medium">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => handleInputChange("remarks", e.target.value)}
                  placeholder="BILL AS PER QUOTE"
                  className="min-h-[60px] text-sm resize-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-2">
              <Button type="button" variant="outline" size="sm">
                Save as Draft
              </Button>
              <Button type="submit" size="sm">
                <Save className="w-3 h-3 mr-1" />
                Create Job
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
