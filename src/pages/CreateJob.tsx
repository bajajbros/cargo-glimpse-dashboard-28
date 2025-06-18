import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/config/firebase";
import { JobFormData } from "@/types/job";
import { FilterableSelect } from "@/components/FilterableSelect";

interface Entity {
  id: string;
  name: string;
}

interface RMUser {
  id: string;
  firstName: string;
  lastName: string;
  shortName: string;
}

export default function CreateJob() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<JobFormData>({
    bookingNo: "",
    consigneeDetails: "",
    containerFlightNo: "",
    etaPod: "",
    finalDestination: "",
    grossWeight: "",
    hblDate: "",
    hblNo: "",
    invoiceNo: "",
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
    airShippingLine: "",
  });

  // Entity options for dropdowns
  const [shippers, setShippers] = useState<Entity[]>([]);
  const [consignees, setConsignees] = useState<Entity[]>([]);
  const [overseasAgents, setOverseasAgents] = useState<Entity[]>([]);
  const [rmUsers, setRmUsers] = useState<RMUser[]>([]);

  useEffect(() => {
    fetchEntities();
    fetchRMUsers();
  }, []);

  const fetchEntities = async () => {
    try {
      // Fetch shippers
      const shippersSnapshot = await getDocs(collection(db, 'shippers'));
      const shippersList: Entity[] = [];
      shippersSnapshot.forEach((doc) => {
        shippersList.push({ id: doc.id, name: doc.data().name });
      });
      setShippers(shippersList.sort((a, b) => a.name.localeCompare(b.name)));

      // Fetch consignees
      const consigneesSnapshot = await getDocs(collection(db, 'consignees'));
      const consigneesList: Entity[] = [];
      consigneesSnapshot.forEach((doc) => {
        consigneesList.push({ id: doc.id, name: doc.data().name });
      });
      setConsignees(consigneesList.sort((a, b) => a.name.localeCompare(b.name)));

      // Fetch overseas agents
      const agentsSnapshot = await getDocs(collection(db, 'overseas_agents'));
      const agentsList: Entity[] = [];
      agentsSnapshot.forEach((doc) => {
        agentsList.push({ id: doc.id, name: doc.data().name });
      });
      setOverseasAgents(agentsList.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error fetching entities:', error);
    }
  };

  const fetchRMUsers = async () => {
    try {
      const rmSnapshot = await getDocs(collection(db, 'relationship_managers'));
      const rmList: RMUser[] = [];
      rmSnapshot.forEach((doc) => {
        const data = doc.data();
        rmList.push({
          id: doc.id,
          firstName: data.firstName,
          lastName: data.lastName,
          shortName: data.shortName,
        });
      });
      setRmUsers(rmList.sort((a, b) => a.firstName.localeCompare(b.firstName)));
    } catch (error) {
      console.error('Error fetching RM users:', error);
    }
  };

  const generateJobNumber = async (): Promise<string> => {
    try {
      // Get the current year
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;
      const yearSuffix = `${currentYear.toString().slice(-2)}-${nextYear.toString().slice(-2)}`;
      
      // Get the latest job number for this year
      const jobsQuery = query(
        collection(db, 'jobs'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      
      const snapshot = await getDocs(jobsQuery);
      let nextNumber = 10010; // Starting number
      
      if (!snapshot.empty) {
        const latestJob = snapshot.docs[0].data();
        const latestJobNumber = latestJob.jobNumber as string;
        
        // Extract number from format like "FF-10010/25-26"
        const match = latestJobNumber.match(/FF-(\d+)\/\d{2}-\d{2}/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      return `FF-${nextNumber}/${yearSuffix}`;
    } catch (error) {
      console.error('Error generating job number:', error);
      // Fallback to timestamp-based number
      const timestamp = Date.now().toString().slice(-5);
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;
      const yearSuffix = `${currentYear.toString().slice(-2)}-${nextYear.toString().slice(-2)}`;
      return `FF-${10000 + parseInt(timestamp)}/${yearSuffix}`;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create jobs.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Generate job number
      const jobNumber = await generateJobNumber();
      
      const jobData = {
        ...formData,
        jobNumber,
        createdBy: user.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "jobs"), jobData);
      
      toast({
        title: "Job Created Successfully",
        description: `Job ${jobNumber} has been created.`,
      });
      
      // Reset form
      setFormData({
        bookingNo: "",
        consigneeDetails: "",
        containerFlightNo: "",
        etaPod: "",
        finalDestination: "",
        grossWeight: "",
        hblDate: "",
        hblNo: "",
        invoiceNo: "",
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
        airShippingLine: "",
      });
    } catch (error) {
      console.error("Error creating job:", error);
      toast({
        title: "Error",
        description: "Failed to create job. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Convert entities to dropdown options
  const shipperOptions = shippers.map(s => ({ value: s.name, label: s.name }));
  const consigneeOptions = consignees.map(c => ({ value: c.name, label: c.name }));
  const agentOptions = overseasAgents.map(a => ({ value: a.name, label: a.name }));
  const rmOptions = rmUsers.map(rm => ({ 
    value: `${rm.firstName} ${rm.lastName}`, 
    label: `${rm.firstName} ${rm.lastName} (${rm.shortName})` 
  }));

  return (
    <div className="p-3 h-full overflow-auto">
      <Card className="max-w-7xl mx-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
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
              {/* Row 1 - Job Number removed, other fields remain */}
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
                <FilterableSelect
                  options={[
                    { value: "Active", label: "Active" },
                    { value: "Pending", label: "Pending" },
                    { value: "Completed", label: "Completed" },
                    { value: "Cancelled", label: "Cancelled" }
                  ]}
                  value={formData.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                  placeholder="Select status"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="rmName" className="text-xs font-medium">RM Name</Label>
                <FilterableSelect
                  options={rmOptions}
                  value={formData.rmName}
                  onValueChange={(value) => handleInputChange("rmName", value)}
                  placeholder="Select RM"
                  searchPlaceholder="Search RMs..."
                  className="h-8 text-sm"
                />
              </div>

              {/* Continue with remaining fields... */}
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
                <FilterableSelect
                  options={[
                    { value: "Sea", label: "Sea" },
                    { value: "Air", label: "Air" },
                    { value: "Road", label: "Road" },
                    { value: "Rail", label: "Rail" }
                  ]}
                  value={formData.modeOfShipment}
                  onValueChange={(value) => handleInputChange("modeOfShipment", value)}
                  placeholder="Select mode"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="shipmentType" className="text-xs font-medium">Shipment Type</Label>
                <FilterableSelect
                  options={[
                    { value: "Import", label: "Import" },
                    { value: "Export", label: "Export" }
                  ]}
                  value={formData.shipmentType}
                  onValueChange={(value) => handleInputChange("shipmentType", value)}
                  placeholder="Select type"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lclFclAir" className="text-xs font-medium">LCL/FCL/Air</Label>
                <FilterableSelect
                  options={[
                    { value: "LCL", label: "LCL" },
                    { value: "FCL", label: "FCL" },
                    { value: "Air", label: "Air" }
                  ]}
                  value={formData.lclFclAir}
                  onValueChange={(value) => handleInputChange("lclFclAir", value)}
                  placeholder="Select option"
                  className="h-8 text-sm"
                />
              </div>

              {/* Continue with more fields... keeping the existing layout but using FilterableSelect where appropriate */}
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
                <FilterableSelect
                  options={[
                    { value: "FOB", label: "FOB" },
                    { value: "CIF", label: "CIF" },
                    { value: "CFR", label: "CFR" },
                    { value: "EXW", label: "EXW" }
                  ]}
                  value={formData.terms}
                  onValueChange={(value) => handleInputChange("terms", value)}
                  placeholder="Select terms"
                  className="h-8 text-sm"
                />
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
              <div className="space-y-1 lg:col-span-4">
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

            {/* Full Width Fields with Entity Dropdowns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="consigneeDetails" className="text-xs font-medium">Consignee Details</Label>
                <FilterableSelect
                  options={consigneeOptions}
                  value={formData.consigneeDetails}
                  onValueChange={(value) => handleInputChange("consigneeDetails", value)}
                  placeholder="Select or search consignee"
                  searchPlaceholder="Search consignees..."
                  className="h-8 text-sm w-full"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="shipperDetails" className="text-xs font-medium">Shipper Details</Label>
                <FilterableSelect
                  options={shipperOptions}
                  value={formData.shipperDetails}
                  onValueChange={(value) => handleInputChange("shipperDetails", value)}
                  placeholder="Select or search shipper"
                  searchPlaceholder="Search shippers..."
                  className="h-8 text-sm w-full"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="overseasAgentDetails" className="text-xs font-medium">Overseas Agent Details</Label>
                <FilterableSelect
                  options={agentOptions}
                  value={formData.overseasAgentDetails}
                  onValueChange={(value) => handleInputChange("overseasAgentDetails", value)}
                  placeholder="Select or search overseas agent"
                  searchPlaceholder="Search overseas agents..."
                  className="h-8 text-sm w-full"
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
