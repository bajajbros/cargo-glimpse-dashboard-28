
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Plus, X, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit, doc, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { FilterableSelect } from "@/components/FilterableSelect";
import { useLocation, useNavigate } from "react-router-dom";
import { Job } from "@/types/job";

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
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Check if we're in edit mode
  const editJob = location.state?.editJob as Job | undefined;
  const isEditMode = !!editJob;
  
  const [formData, setFormData] = useState<JobFormData>({
    rmName: editJob?.rmName || "",
    shipmentType: editJob?.shipmentType || "",
    modeOfShipment: editJob?.modeOfShipment || "",
    shipperDetails: editJob?.shipperDetails || "",
    consigneeDetails: editJob?.consigneeDetails || "",
    overseasAgentDetails: editJob?.overseasAgentDetails || "",
    bookingNo: editJob?.bookingNo || "",
    invoiceNo: editJob?.invoiceNo || "",
    grossWeight: editJob?.grossWeight || "",
    netWeight: editJob?.netWeight || "",
    totalPackages: editJob?.totalPackages || "",
    portOfLoading: editJob?.portOfLoading || "",
    etaPod: editJob?.etaPod || "",
    finalDestination: editJob?.finalDestination || "",
    vesselVoyDetails: editJob?.vesselVoyDetails || "",
    airShippingLine: editJob?.airShippingLine || "",
    containerFlightNumbers: editJob?.containerFlightNumbers || [],
    mblNo: editJob?.mblNo || "",
    mblDate: editJob?.mblDate || "",
    hblNo: editJob?.hblNo || "",
    hblDate: editJob?.hblDate || "",
    terms: editJob?.terms || "",
    remarks: editJob?.remarks || "",
  });

  const [newContainerNumber, setNewContainerNumber] = useState("");
  const [previousTerms, setPreviousTerms] = useState<string[]>([]);
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
      const shippersSnapshot = await getDocs(collection(db, 'shippers'));
      const shippersList: Entity[] = [];
      shippersSnapshot.forEach((doc) => {
        shippersList.push({ id: doc.id, name: doc.data().name });
      });
      setShippers(shippersList.sort((a, b) => a.name.localeCompare(b.name)));

      const consigneesSnapshot = await getDocs(collection(db, 'consignees'));
      const consigneesList: Entity[] = [];
      consigneesSnapshot.forEach((doc) => {
        consigneesList.push({ id: doc.id, name: doc.data().name });
      });
      setConsignees(consigneesList.sort((a, b) => a.name.localeCompare(b.name)));

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
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;
      const yearSuffix = `${currentYear.toString().slice(-2)}-${nextYear.toString().slice(-2)}`;
      
      const jobsQuery = query(
        collection(db, 'jobs'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      
      const snapshot = await getDocs(jobsQuery);
      let nextNumber = 10010;
      
      if (!snapshot.empty) {
        const latestJob = snapshot.docs[0].data();
        const latestJobNumber = latestJob.jobNumber as string;
        
        const match = latestJobNumber.match(/FF-(\d+)\/\d{2}-\d{2}/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      return `FF-${nextNumber}/${yearSuffix}`;
    } catch (error) {
      console.error('Error generating job number:', error);
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
      if (isEditMode && editJob) {
        // Update existing job
        const jobRef = doc(db, 'jobs', editJob.id);
        await updateDoc(jobRef, {
          ...formData,
          updatedAt: serverTimestamp(),
        });
        
        toast({
          title: "Job Updated Successfully",
          description: `Job ${editJob.jobNumber} has been updated.`,
        });
        
        navigate('/view-jobs');
      } else {
        // Create new job
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
        
        // Reset form for new job creation
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
      }
    } catch (error) {
      console.error("Error saving job:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? 'update' : 'create'} job. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const shipperOptions = shippers.map(s => ({ value: s.name, label: s.name }));
  const consigneeOptions = consignees.map(c => ({ value: c.name, label: c.name }));
  const agentOptions = overseasAgents.map(a => ({ value: a.name, label: a.name }));
  const rmOptions = rmUsers.map(rm => ({ 
    value: `${rm.firstName} ${rm.lastName}`, 
    label: `${rm.firstName} ${rm.lastName} (${rm.shortName})` 
  }));

  if (isLoading) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-auto">
      <Card className="max-w-full mx-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isEditMode && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/view-jobs')}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <div>
                <CardTitle className="text-xl">
                  {isEditMode ? `Edit Job - ${editJob?.jobNumber}` : 'Create New Job'}
                </CardTitle>
                <CardDescription>
                  {isEditMode ? 'Update job details' : 'Complete all fields to create a new logistics job'}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Grid Layout for all fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* RM Name */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">RM Name *</Label>
                <FilterableSelect
                  options={rmOptions}
                  value={formData.rmName}
                  onValueChange={(value) => handleInputChange("rmName", value)}
                  placeholder="Select RM"
                />
              </div>

              {/* Shipment Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Shipment Type *</Label>
                <FilterableSelect
                  options={[
                    { value: "Import", label: "Import" },
                    { value: "Export", label: "Export" }
                  ]}
                  value={formData.shipmentType}
                  onValueChange={(value) => handleInputChange("shipmentType", value)}
                  placeholder="Select type"
                />
              </div>

              {/* Mode of Shipment */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Mode of Shipment *</Label>
                <FilterableSelect
                  options={[
                    { value: "Air", label: "Air" },
                    { value: "Sea", label: "Sea" }
                  ]}
                  value={formData.modeOfShipment}
                  onValueChange={(value) => handleInputChange("modeOfShipment", value)}
                  placeholder="Select mode"
                />
              </div>

              {/* Shipper Name */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Shipper Name</Label>
                <FilterableSelect
                  options={shipperOptions}
                  value={formData.shipperDetails}
                  onValueChange={(value) => handleInputChange("shipperDetails", value)}
                  placeholder="Select shipper"
                />
              </div>

              {/* Consignee */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Consignee</Label>
                <FilterableSelect
                  options={consigneeOptions}
                  value={formData.consigneeDetails}
                  onValueChange={(value) => handleInputChange("consigneeDetails", value)}
                  placeholder="Select consignee"
                />
              </div>

              {/* Overseas Agent */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Overseas Agent</Label>
                <FilterableSelect
                  options={agentOptions}
                  value={formData.overseasAgentDetails}
                  onValueChange={(value) => handleInputChange("overseasAgentDetails", value)}
                  placeholder="Select agent"
                />
              </div>

              {/* Booking No */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Booking No</Label>
                <Input
                  value={formData.bookingNo}
                  onChange={(e) => handleInputChange("bookingNo", e.target.value)}
                  placeholder="Enter booking number"
                />
              </div>

              {/* Invoice No */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Invoice No</Label>
                <Input
                  value={formData.invoiceNo}
                  onChange={(e) => handleInputChange("invoiceNo", e.target.value)}
                  placeholder="Enter invoice number"
                />
              </div>

              {/* Gross Weight */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Gross Weight</Label>
                <Input
                  value={formData.grossWeight}
                  onChange={(e) => handleInputChange("grossWeight", e.target.value)}
                  placeholder="Enter gross weight"
                />
              </div>

              {/* Net Weight */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Net Weight</Label>
                <Input
                  value={formData.netWeight}
                  onChange={(e) => handleInputChange("netWeight", e.target.value)}
                  placeholder="Enter net weight"
                />
              </div>

              {/* Total Packages */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Total Packages</Label>
                <Input
                  value={formData.totalPackages}
                  onChange={(e) => handleInputChange("totalPackages", e.target.value)}
                  placeholder="Enter total packages"
                />
              </div>

              {/* Port Of Loading */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Port Of Loading</Label>
                <Input
                  value={formData.portOfLoading}
                  onChange={(e) => handleInputChange("portOfLoading", e.target.value)}
                  placeholder="Enter port"
                />
              </div>

              {/* ETA POD */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">ETA POD</Label>
                <Input
                  type="date"
                  value={formData.etaPod}
                  onChange={(e) => handleInputChange("etaPod", e.target.value)}
                />
              </div>

              {/* Final Destination */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Final Destination</Label>
                <Input
                  value={formData.finalDestination}
                  onChange={(e) => handleInputChange("finalDestination", e.target.value)}
                  placeholder="Enter destination"
                />
              </div>

              {/* Vessel And Voy Details */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Vessel And Voy Details</Label>
                <Input
                  value={formData.vesselVoyDetails}
                  onChange={(e) => handleInputChange("vesselVoyDetails", e.target.value)}
                  placeholder="Enter vessel details"
                />
              </div>

              {/* Air/Shipping Line */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Air/Shipping Line</Label>
                <Input
                  value={formData.airShippingLine}
                  onChange={(e) => handleInputChange("airShippingLine", e.target.value)}
                  placeholder="Enter shipping line"
                />
              </div>

              {/* MBL/MAWB No */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">MBL/MAWB No</Label>
                <Input
                  value={formData.mblNo}
                  onChange={(e) => handleInputChange("mblNo", e.target.value)}
                  placeholder="Enter MBL/MAWB number"
                />
              </div>

              {/* MBL/MAWB Date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">MBL/MAWB Date</Label>
                <Input
                  type="date"
                  value={formData.mblDate}
                  onChange={(e) => handleInputChange("mblDate", e.target.value)}
                />
              </div>

              {/* HBL/HAWB No */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">HBL/HAWB No</Label>
                <Input
                  value={formData.hblNo}
                  onChange={(e) => handleInputChange("hblNo", e.target.value)}
                  placeholder="Enter HBL/HAWB number"
                />
              </div>

              {/* HBL/HAWB Date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">HBL/HAWB Date</Label>
                <Input
                  type="date"
                  value={formData.hblDate}
                  onChange={(e) => handleInputChange("hblDate", e.target.value)}
                />
              </div>

              {/* Terms */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Terms</Label>
                <Input
                  value={formData.terms}
                  onChange={(e) => handleInputChange("terms", e.target.value)}
                  placeholder="Enter terms"
                  list="terms-suggestions"
                />
                <datalist id="terms-suggestions">
                  {previousTerms.map((term, index) => (
                    <option key={index} value={term} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Container Numbers and Remarks - Full width sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Container No/Flight No */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Container No/Flight No</Label>
                <div className="flex gap-2">
                  <Input
                    value={newContainerNumber}
                    onChange={(e) => setNewContainerNumber(e.target.value)}
                    placeholder="Enter container/flight number"
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addContainerNumber())}
                  />
                  <Button
                    type="button"
                    onClick={addContainerNumber}
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.containerFlightNumbers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.containerFlightNumbers.map((number, index) => (
                      <div key={index} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm">
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
                )}
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Remarks</Label>
                <Textarea
                  value={formData.remarks}
                  onChange={(e) => handleInputChange("remarks", e.target.value)}
                  placeholder="Enter remarks"
                  className="min-h-[100px]"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-6">
              <Button 
                type="submit" 
                size="lg" 
                className="px-8"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEditMode ? 'Updating Job...' : 'Creating Job...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isEditMode ? 'Update Job' : 'Create Job'}
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
