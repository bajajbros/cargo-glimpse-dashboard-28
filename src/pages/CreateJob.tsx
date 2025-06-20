
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/config/firebase";
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

interface JobFormData {
  rmName: string;
  shipmentType: string;
  modeOfShipment: string;
  shipperDetails: string;
  consigneeDetails: string;
  overseasAgentDetails: string;
  bookingNo: string;
  invoiceNo: string;
  grossWeight: string;
  netWeight: string;
  totalPackages: string;
  portOfLoading: string;
  etaPod: string;
  finalDestination: string;
  vesselVoyDetails: string;
  airShippingLine: string;
  containerFlightNumbers: string[];
  mblNo: string;
  mblDate: string;
  hblNo: string;
  hblDate: string;
  terms: string;
  remarks: string;
}

export default function CreateJob() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<JobFormData>({
    rmName: "",
    shipmentType: "",
    modeOfShipment: "",
    shipperDetails: "",
    consigneeDetails: "",
    overseasAgentDetails: "",
    bookingNo: "",
    invoiceNo: "",
    grossWeight: "",
    netWeight: "",
    totalPackages: "",
    portOfLoading: "",
    etaPod: "",
    finalDestination: "",
    vesselVoyDetails: "",
    airShippingLine: "",
    containerFlightNumbers: [],
    mblNo: "",
    mblDate: "",
    hblNo: "",
    hblDate: "",
    terms: "",
    remarks: "",
  });

  const [newContainerNumber, setNewContainerNumber] = useState("");
  const [previousTerms, setPreviousTerms] = useState<string[]>([]);

  // Entity options for dropdowns
  const [shippers, setShippers] = useState<Entity[]>([]);
  const [consignees, setConsignees] = useState<Entity[]>([]);
  const [overseasAgents, setOverseasAgents] = useState<Entity[]>([]);
  const [rmUsers, setRmUsers] = useState<RMUser[]>([]);

  useEffect(() => {
    fetchEntities();
    fetchRMUsers();
    fetchPreviousTerms();
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

  const fetchPreviousTerms = async () => {
    try {
      const jobsSnapshot = await getDocs(collection(db, 'jobs'));
      const termsSet = new Set<string>();
      jobsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.terms && data.terms.trim()) {
          termsSet.add(data.terms.trim());
        }
      });
      setPreviousTerms(Array.from(termsSet).sort());
    } catch (error) {
      console.error('Error fetching previous terms:', error);
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

  const addContainerNumber = () => {
    if (newContainerNumber.trim()) {
      setFormData(prev => ({
        ...prev,
        containerFlightNumbers: [...prev.containerFlightNumbers, newContainerNumber.trim()]
      }));
      setNewContainerNumber("");
    }
  };

  const removeContainerNumber = (index: number) => {
    setFormData(prev => ({
      ...prev,
      containerFlightNumbers: prev.containerFlightNumbers.filter((_, i) => i !== index)
    }));
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
        status: "Active",
        lclFclAir: "",
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
        rmName: "",
        shipmentType: "",
        modeOfShipment: "",
        shipperDetails: "",
        consigneeDetails: "",
        overseasAgentDetails: "",
        bookingNo: "",
        invoiceNo: "",
        grossWeight: "",
        netWeight: "",
        totalPackages: "",
        portOfLoading: "",
        etaPod: "",
        finalDestination: "",
        vesselVoyDetails: "",
        airShippingLine: "",
        containerFlightNumbers: [],
        mblNo: "",
        mblDate: "",
        hblNo: "",
        hblDate: "",
        terms: "",
        remarks: "",
      });
      setNewContainerNumber("");
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
      <Card className="max-w-7xl mx-auto shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Grid Layout for Maximum Space Utilization */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              
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
                <Label htmlFor="modeOfShipment" className="text-xs font-medium">Mode of Shipment</Label>
                <FilterableSelect
                  options={[
                    { value: "Air", label: "Air" },
                    { value: "Sea", label: "Sea" }
                  ]}
                  value={formData.modeOfShipment}
                  onValueChange={(value) => handleInputChange("modeOfShipment", value)}
                  placeholder="Select mode"
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="shipperDetails" className="text-xs font-medium">Shipper Name</Label>
                <FilterableSelect
                  options={shipperOptions}
                  value={formData.shipperDetails}
                  onValueChange={(value) => handleInputChange("shipperDetails", value)}
                  placeholder="Select shipper"
                  searchPlaceholder="Search shippers..."
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="consigneeDetails" className="text-xs font-medium">Consignee</Label>
                <FilterableSelect
                  options={consigneeOptions}
                  value={formData.consigneeDetails}
                  onValueChange={(value) => handleInputChange("consigneeDetails", value)}
                  placeholder="Select consignee"
                  searchPlaceholder="Search consignees..."
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="overseasAgentDetails" className="text-xs font-medium">Overseas Agent</Label>
                <FilterableSelect
                  options={agentOptions}
                  value={formData.overseasAgentDetails}
                  onValueChange={(value) => handleInputChange("overseasAgentDetails", value)}
                  placeholder="Select overseas agent"
                  searchPlaceholder="Search overseas agents..."
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="bookingNo" className="text-xs font-medium">Booking No</Label>
                <Input
                  id="bookingNo"
                  value={formData.bookingNo}
                  onChange={(e) => handleInputChange("bookingNo", e.target.value)}
                  placeholder="Enter booking number"
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="invoiceNo" className="text-xs font-medium">Invoice No</Label>
                <Input
                  id="invoiceNo"
                  value={formData.invoiceNo}
                  onChange={(e) => handleInputChange("invoiceNo", e.target.value)}
                  placeholder="Enter invoice number"
                  className="h-8 text-sm"
                />
              </div>

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
                <Label htmlFor="portOfLoading" className="text-xs font-medium">Port Of Loading</Label>
                <Input
                  id="portOfLoading"
                  value={formData.portOfLoading}
                  onChange={(e) => handleInputChange("portOfLoading", e.target.value)}
                  placeholder="KAOHSIUNG"
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

              <div className="space-y-1 lg:col-span-2">
                <Label htmlFor="vesselVoyDetails" className="text-xs font-medium">Vessel And Voy Details</Label>
                <Input
                  id="vesselVoyDetails"
                  value={formData.vesselVoyDetails}
                  onChange={(e) => handleInputChange("vesselVoyDetails", e.target.value)}
                  placeholder="EVER EAGLE - 188W"
                  className="h-8 text-sm"
                />
              </div>

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
                <Label htmlFor="mblNo" className="text-xs font-medium">MBL/MAWB No</Label>
                <Input
                  id="mblNo"
                  value={formData.mblNo}
                  onChange={(e) => handleInputChange("mblNo", e.target.value)}
                  placeholder="ONEYTPEF2627600"
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="mblDate" className="text-xs font-medium">MBL/MAWB Date</Label>
                <Input
                  id="mblDate"
                  type="date"
                  value={formData.mblDate}
                  onChange={(e) => handleInputChange("mblDate", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="hblNo" className="text-xs font-medium">HBL/HAWB No</Label>
                <Input
                  id="hblNo"
                  value={formData.hblNo}
                  onChange={(e) => handleInputChange("hblNo", e.target.value)}
                  placeholder="TPENDL25040858"
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="hblDate" className="text-xs font-medium">HBL/HAWB Date</Label>
                <Input
                  id="hblDate"
                  type="date"
                  value={formData.hblDate}
                  onChange={(e) => handleInputChange("hblDate", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="terms" className="text-xs font-medium">Terms</Label>
                <Input
                  id="terms"
                  value={formData.terms}
                  onChange={(e) => handleInputChange("terms", e.target.value)}
                  placeholder="Enter terms"
                  className="h-8 text-sm"
                  list="terms-suggestions"
                />
                <datalist id="terms-suggestions">
                  {previousTerms.map((term, index) => (
                    <option key={index} value={term} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Container/Flight Numbers Section */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Container No/Flight No</Label>
              <div className="flex gap-2">
                <Input
                  value={newContainerNumber}
                  onChange={(e) => setNewContainerNumber(e.target.value)}
                  placeholder="Enter container/flight number"
                  className="h-8 text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addContainerNumber())}
                />
                <Button
                  type="button"
                  onClick={addContainerNumber}
                  size="sm"
                  className="h-8 px-3"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.containerFlightNumbers.length > 0 && (
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex flex-wrap gap-2">
                    {formData.containerFlightNumbers.map((number, index) => (
                      <div key={index} className="flex items-center gap-1 bg-white px-2 py-1 rounded border text-sm">
                        <span>{number}</span>
                        <button
                          type="button"
                          onClick={() => removeContainerNumber(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Remarks Section */}
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

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-2">
              <Button type="button" variant="outline" size="sm">
                Save as Draft
              </Button>
              <Button type="submit" size="sm" className="bg-gray-900 hover:bg-gray-800">
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
