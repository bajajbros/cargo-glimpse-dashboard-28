import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save, Plus, X, Loader2 } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    setIsLoading(true);
    Promise.all([fetchEntities(), fetchRMUsers(), fetchPreviousTerms()])
      .finally(() => setIsLoading(false));
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

    setIsSubmitting(true);

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
    } finally {
      setIsSubmitting(false);
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

  if (isLoading) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-auto bg-gray-50">
      <Card className="max-w-8xl mx-auto shadow-lg bg-white">
        <CardHeader className="pb-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-2xl text-gray-900 font-semibold">
                Create New Job
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Enter comprehensive job details for logistics management
              </CardDescription>
            </div>
            <Badge variant="outline" className="px-3 py-1">
              Draft
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Grid Layout - Organized in logical sections */}
            
            {/* Basic Information Section */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium mb-4 text-gray-800">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="rmName" className="text-sm font-medium text-gray-700">RM Name</Label>
                  <FilterableSelect
                    options={rmOptions}
                    value={formData.rmName}
                    onValueChange={(value) => handleInputChange("rmName", value)}
                    placeholder="Select RM"
                    searchPlaceholder="Search RMs..."
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shipmentType" className="text-sm font-medium text-gray-700">Shipment Type</Label>
                  <FilterableSelect
                    options={[
                      { value: "Import", label: "Import" },
                      { value: "Export", label: "Export" }
                    ]}
                    value={formData.shipmentType}
                    onValueChange={(value) => handleInputChange("shipmentType", value)}
                    placeholder="Select type"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modeOfShipment" className="text-sm font-medium text-gray-700">Mode of Shipment</Label>
                  <FilterableSelect
                    options={[
                      { value: "Air", label: "Air" },
                      { value: "Sea", label: "Sea" }
                    ]}
                    value={formData.modeOfShipment}
                    onValueChange={(value) => handleInputChange("modeOfShipment", value)}
                    placeholder="Select mode"
                    className="h-10 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Party Details Section */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium mb-4 text-gray-800">Party Details</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="shipperDetails" className="text-sm font-medium text-gray-700">Shipper Name</Label>
                  <FilterableSelect
                    options={shipperOptions}
                    value={formData.shipperDetails}
                    onValueChange={(value) => handleInputChange("shipperDetails", value)}
                    placeholder="Select shipper"
                    searchPlaceholder="Search shippers..."
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consigneeDetails" className="text-sm font-medium text-gray-700">Consignee</Label>
                  <FilterableSelect
                    options={consigneeOptions}
                    value={formData.consigneeDetails}
                    onValueChange={(value) => handleInputChange("consigneeDetails", value)}
                    placeholder="Select consignee"
                    searchPlaceholder="Search consignees..."
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="overseasAgentDetails" className="text-sm font-medium text-gray-700">Overseas Agent</Label>
                  <FilterableSelect
                    options={agentOptions}
                    value={formData.overseasAgentDetails}
                    onValueChange={(value) => handleInputChange("overseasAgentDetails", value)}
                    placeholder="Select overseas agent"
                    searchPlaceholder="Search overseas agents..."
                    className="h-10 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Booking & Invoice Section */}
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium mb-4 text-gray-800">Booking & Invoice Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="bookingNo" className="text-sm font-medium text-gray-700">Booking No</Label>
                  <Input
                    id="bookingNo"
                    value={formData.bookingNo}
                    onChange={(e) => handleInputChange("bookingNo", e.target.value)}
                    placeholder="Enter booking number"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoiceNo" className="text-sm font-medium text-gray-700">Invoice No</Label>
                  <Input
                    id="invoiceNo"
                    value={formData.invoiceNo}
                    onChange={(e) => handleInputChange("invoiceNo", e.target.value)}
                    placeholder="Enter invoice number"
                    className="h-10 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Weight & Package Details Section */}
            <div className="bg-yellow-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium mb-4 text-gray-800">Weight & Package Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="grossWeight" className="text-sm font-medium text-gray-700">Gross Weight</Label>
                  <Input
                    id="grossWeight"
                    value={formData.grossWeight}
                    onChange={(e) => handleInputChange("grossWeight", e.target.value)}
                    placeholder="10148.00"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="netWeight" className="text-sm font-medium text-gray-700">Net Weight</Label>
                  <Input
                    id="netWeight"
                    value={formData.netWeight}
                    onChange={(e) => handleInputChange("netWeight", e.target.value)}
                    placeholder="9800"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalPackages" className="text-sm font-medium text-gray-700">Total Packages</Label>
                  <Input
                    id="totalPackages"
                    value={formData.totalPackages}
                    onChange={(e) => handleInputChange("totalPackages", e.target.value)}
                    placeholder="15 PLTS"
                    className="h-10 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Location Details Section */}
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium mb-4 text-gray-800">Location Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="portOfLoading" className="text-sm font-medium text-gray-700">Port Of Loading</Label>
                  <Input
                    id="portOfLoading"
                    value={formData.portOfLoading}
                    onChange={(e) => handleInputChange("portOfLoading", e.target.value)}
                    placeholder="KAOHSIUNG"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="etaPod" className="text-sm font-medium text-gray-700">ETA POD</Label>
                  <Input
                    id="etaPod"
                    type="date"
                    value={formData.etaPod}
                    onChange={(e) => handleInputChange("etaPod", e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="finalDestination" className="text-sm font-medium text-gray-700">Final Destination</Label>
                  <Input
                    id="finalDestination"
                    value={formData.finalDestination}
                    onChange={(e) => handleInputChange("finalDestination", e.target.value)}
                    placeholder="ICD TKD"
                    className="h-10 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Transport Details Section */}
            <div className="bg-orange-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium mb-4 text-gray-800">Transport Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="vesselVoyDetails" className="text-sm font-medium text-gray-700">Vessel And Voy Details</Label>
                  <Input
                    id="vesselVoyDetails"
                    value={formData.vesselVoyDetails}
                    onChange={(e) => handleInputChange("vesselVoyDetails", e.target.value)}
                    placeholder="EVER EAGLE - 188W"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="airShippingLine" className="text-sm font-medium text-gray-700">Air/Shipping Line</Label>
                  <Input
                    id="airShippingLine"
                    value={formData.airShippingLine}
                    onChange={(e) => handleInputChange("airShippingLine", e.target.value)}
                    placeholder="ONE"
                    className="h-10 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Container/Flight Numbers Section */}
            <div className="bg-indigo-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium mb-4 text-gray-800">Container No/Flight No</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    value={newContainerNumber}
                    onChange={(e) => setNewContainerNumber(e.target.value)}
                    placeholder="Enter container/flight number"
                    className="h-10 text-sm flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addContainerNumber())}
                  />
                  <Button
                    type="button"
                    onClick={addContainerNumber}
                    size="sm"
                    className="h-10 px-4"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.containerFlightNumbers.length > 0 && (
                  <div className="border rounded-lg p-4 bg-white">
                    <div className="flex flex-wrap gap-2">
                      {formData.containerFlightNumbers.map((number, index) => (
                        <div key={index} className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-md border text-sm">
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
            </div>

            {/* Document Details Section */}
            <div className="bg-pink-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium mb-4 text-gray-800">Document Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="mblNo" className="text-sm font-medium text-gray-700">MBL/MAWB No</Label>
                  <Input
                    id="mblNo"
                    value={formData.mblNo}
                    onChange={(e) => handleInputChange("mblNo", e.target.value)}
                    placeholder="ONEYTPEF2627600"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mblDate" className="text-sm font-medium text-gray-700">MBL/MAWB Date</Label>
                  <Input
                    id="mblDate"
                    type="date"
                    value={formData.mblDate}
                    onChange={(e) => handleInputChange("mblDate", e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hblNo" className="text-sm font-medium text-gray-700">HBL/HAWB No</Label>
                  <Input
                    id="hblNo"
                    value={formData.hblNo}
                    onChange={(e) => handleInputChange("hblNo", e.target.value)}
                    placeholder="TPENDL25040858"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hblDate" className="text-sm font-medium text-gray-700">HBL/HAWB Date</Label>
                  <Input
                    id="hblDate"
                    type="date"
                    value={formData.hblDate}
                    onChange={(e) => handleInputChange("hblDate", e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Terms & Remarks Section */}
            <div className="bg-teal-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium mb-4 text-gray-800">Additional Information</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="terms" className="text-sm font-medium text-gray-700">Terms</Label>
                  <Input
                    id="terms"
                    value={formData.terms}
                    onChange={(e) => handleInputChange("terms", e.target.value)}
                    placeholder="Enter terms"
                    className="h-10 text-sm"
                    list="terms-suggestions"
                  />
                  <datalist id="terms-suggestions">
                    {previousTerms.map((term, index) => (
                      <option key={index} value={term} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remarks" className="text-sm font-medium text-gray-700">Remarks</Label>
                  <Textarea
                    id="remarks"
                    value={formData.remarks}
                    onChange={(e) => handleInputChange("remarks", e.target.value)}
                    placeholder="BILL AS PER QUOTE"
                    className="min-h-[80px] text-sm resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-end pt-6 border-t">
              <Button 
                type="submit" 
                size="lg" 
                className="bg-gray-900 hover:bg-gray-800 px-8 h-12"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Job...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Job
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
