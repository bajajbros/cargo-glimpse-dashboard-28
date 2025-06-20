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
        <div className="text-center animate-fade-in">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <div className="space-y-2">
            <div className="h-2 bg-gray-200 rounded animate-pulse w-32 mx-auto"></div>
            <div className="h-2 bg-gray-200 rounded animate-pulse w-24 mx-auto"></div>
          </div>
          <p className="text-muted-foreground mt-4">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 h-full overflow-auto bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="max-w-full mx-auto shadow-xl bg-white border-0">
        <CardHeader className="pb-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isEditMode && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/view-jobs')}
                  className="text-white hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <div>
                <CardTitle className="text-xl font-bold">
                  {isEditMode ? `Edit Job - ${editJob?.jobNumber}` : 'Create New Job'}
                </CardTitle>
                <CardDescription className="text-blue-100 mt-1">
                  {isEditMode ? 'Update job details' : 'Complete all fields to create a new logistics job'}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Compact Grid Layout - All fields in organized rows */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Row 1 */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">RM Name *</Label>
                <FilterableSelect
                  options={rmOptions}
                  value={formData.rmName}
                  onValueChange={(value) => handleInputChange("rmName", value)}
                  placeholder="Select RM"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Shipment Type *</Label>
                <FilterableSelect
                  options={[
                    { value: "Import", label: "Import" },
                    { value: "Export", label: "Export" }
                  ]}
                  value={formData.shipmentType}
                  onValueChange={(value) => handleInputChange("shipmentType", value)}
                  placeholder="Select type"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Mode of Shipment *</Label>
                <FilterableSelect
                  options={[
                    { value: "Air", label: "Air" },
                    { value: "Sea", label: "Sea" }
                  ]}
                  value={formData.modeOfShipment}
                  onValueChange={(value) => handleInputChange("modeOfShipment", value)}
                  placeholder="Select mode"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Shipper Name</Label>
                <FilterableSelect
                  options={shipperOptions}
                  value={formData.shipperDetails}
                  onValueChange={(value) => handleInputChange("shipperDetails", value)}
                  placeholder="Select shipper"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Consignee</Label>
                <FilterableSelect
                  options={consigneeOptions}
                  value={formData.consigneeDetails}
                  onValueChange={(value) => handleInputChange("consigneeDetails", value)}
                  placeholder="Select consignee"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Overseas Agent</Label>
                <FilterableSelect
                  options={agentOptions}
                  value={formData.overseasAgentDetails}
                  onValueChange={(value) => handleInputChange("overseasAgentDetails", value)}
                  placeholder="Select agent"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Booking No</Label>
                <Input
                  value={formData.bookingNo}
                  onChange={(e) => handleInputChange("bookingNo", e.target.value)}
                  placeholder="Enter booking number"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Invoice No</Label>
                <Input
                  value={formData.invoiceNo}
                  onChange={(e) => handleInputChange("invoiceNo", e.target.value)}
                  placeholder="Enter invoice number"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Gross Weight</Label>
                <Input
                  value={formData.grossWeight}
                  onChange={(e) => handleInputChange("grossWeight", e.target.value)}
                  placeholder="Enter gross weight"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Net Weight</Label>
                <Input
                  value={formData.netWeight}
                  onChange={(e) => handleInputChange("netWeight", e.target.value)}
                  placeholder="Enter net weight"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Total Packages</Label>
                <Input
                  value={formData.totalPackages}
                  onChange={(e) => handleInputChange("totalPackages", e.target.value)}
                  placeholder="Enter total packages"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Port Of Loading</Label>
                <Input
                  value={formData.portOfLoading}
                  onChange={(e) => handleInputChange("portOfLoading", e.target.value)}
                  placeholder="Enter port"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Row 4 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">ETA POD</Label>
                <Input
                  type="date"
                  value={formData.etaPod}
                  onChange={(e) => handleInputChange("etaPod", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Final Destination</Label>
                <Input
                  value={formData.finalDestination}
                  onChange={(e) => handleInputChange("finalDestination", e.target.value)}
                  placeholder="Enter destination"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Vessel And Voy Details</Label>
                <Input
                  value={formData.vesselVoyDetails}
                  onChange={(e) => handleInputChange("vesselVoyDetails", e.target.value)}
                  placeholder="Enter vessel details"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Air/Shipping Line</Label>
                <Input
                  value={formData.airShippingLine}
                  onChange={(e) => handleInputChange("airShippingLine", e.target.value)}
                  placeholder="Enter shipping line"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Row 5 - Container Numbers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">Container No/Flight No</Label>
                <div className="flex gap-2">
                  <Input
                    value={newContainerNumber}
                    onChange={(e) => setNewContainerNumber(e.target.value)}
                    placeholder="Enter container/flight number"
                    className="h-8 text-xs flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addContainerNumber())}
                  />
                  <Button
                    type="button"
                    onClick={addContainerNumber}
                    size="sm"
                    className="h-8 px-3"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                {formData.containerFlightNumbers.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.containerFlightNumbers.map((number, index) => (
                      <div key={index} className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded text-xs">
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">MBL/MAWB No</Label>
                  <Input
                    value={formData.mblNo}
                    onChange={(e) => handleInputChange("mblNo", e.target.value)}
                    placeholder="Enter MBL/MAWB number"
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-700">MBL/MAWB Date</Label>
                  <Input
                    type="date"
                    value={formData.mblDate}
                    onChange={(e) => handleInputChange("mblDate", e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Row 6 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">HBL/HAWB No</Label>
                <Input
                  value={formData.hblNo}
                  onChange={(e) => handleInputChange("hblNo", e.target.value)}
                  placeholder="Enter HBL/HAWB number"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">HBL/HAWB Date</Label>
                <Input
                  type="date"
                  value={formData.hblDate}
                  onChange={(e) => handleInputChange("hblDate", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Terms</Label>
                <Input
                  value={formData.terms}
                  onChange={(e) => handleInputChange("terms", e.target.value)}
                  placeholder="Enter terms"
                  className="h-8 text-xs"
                  list="terms-suggestions"
                />
                <datalist id="terms-suggestions">
                  {previousTerms.map((term, index) => (
                    <option key={index} value={term} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-700">Remarks</Label>
                <Textarea
                  value={formData.remarks}
                  onChange={(e) => handleInputChange("remarks", e.target.value)}
                  placeholder="Enter remarks"
                  className="h-8 text-xs resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-4 border-t">
              <Button 
                type="submit" 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 h-10 text-sm font-medium shadow-lg"
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
