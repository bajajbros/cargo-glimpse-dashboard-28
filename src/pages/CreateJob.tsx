
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const jobSchema = z.object({
  airShippingLine: z.string().min(1, "Air Shipping Line is required"),
  bookingNo: z.string().min(1, "Booking Number is required"),
  consigneeDetails: z.string().min(1, "Consignee Details are required"),
  containerFlightNo: z.string().min(1, "Container/Flight Number is required"),
  etaPod: z.string().min(1, "ETA POD is required"),
  finalDestination: z.string().min(1, "Final Destination is required"),
  grossWeight: z.string().min(1, "Gross Weight is required"),
  hblNo: z.string().min(1, "HBL Number is required"),
  invoiceNo: z.string().min(1, "Invoice Number is required"),
  jobNumber: z.string().min(1, "Job Number is required"),
  lclFclAir: z.string(),
  mblNo: z.string().min(1, "MBL Number is required"),
  modeOfShipment: z.string().min(1, "Mode of Shipment is required"),
  netWeight: z.string().min(1, "Net Weight is required"),
  overseasAgentDetails: z.string().min(1, "Overseas Agent Details are required"),
  portOfLoading: z.string().min(1, "Port of Loading is required"),
  remarks: z.string(),
  rmName: z.string().min(1, "RM Name is required"),
  shipmentType: z.string().min(1, "Shipment Type is required"),
  shipperDetails: z.string().min(1, "Shipper Details are required"),
  status: z.string().min(1, "Status is required"),
  terms: z.string().min(1, "Terms are required"),
  totalPackages: z.string().min(1, "Total Packages is required"),
  vesselVoyDetails: z.string().min(1, "Vessel/Voyage Details are required"),
});

type JobFormData = z.infer<typeof jobSchema>;

export default function CreateJob() {
  const [hblDate, setHblDate] = useState<Date>();
  const [mblDate, setMblDate] = useState<Date>();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      status: "Active",
      modeOfShipment: "Sea",
      shipmentType: "Import",
    }
  });

  const onSubmit = (data: JobFormData) => {
    console.log("Form submitted:", { ...data, hblDate, mblDate });
    toast({
      title: "Job Created Successfully",
      description: `Job ${data.jobNumber} has been created.`,
    });
    reset();
    setHblDate(undefined);
    setMblDate(undefined);
  };

  return (
    <div className="p-6">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle>Create New Job</CardTitle>
          <CardDescription>
            Fill in the details below to create a new logistics job
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Job Information */}
              <div className="space-y-2">
                <Label htmlFor="jobNumber">Job Number *</Label>
                <Input
                  id="jobNumber"
                  {...register("jobNumber")}
                  placeholder="FF-10010/25-26"
                />
                {errors.jobNumber && (
                  <p className="text-sm text-red-500">{errors.jobNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bookingNo">Booking Number *</Label>
                <Input
                  id="bookingNo"
                  {...register("bookingNo")}
                  placeholder="3426"
                />
                {errors.bookingNo && (
                  <p className="text-sm text-red-500">{errors.bookingNo.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceNo">Invoice Number *</Label>
                <Input
                  id="invoiceNo"
                  {...register("invoiceNo")}
                  placeholder="3426"
                />
                {errors.invoiceNo && (
                  <p className="text-sm text-red-500">{errors.invoiceNo.message}</p>
                )}
              </div>

              {/* Shipment Details */}
              <div className="space-y-2">
                <Label htmlFor="modeOfShipment">Mode of Shipment *</Label>
                <Select onValueChange={(value) => setValue("modeOfShipment", value)} defaultValue="Sea">
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sea">Sea</SelectItem>
                    <SelectItem value="Air">Air</SelectItem>
                    <SelectItem value="Road">Road</SelectItem>
                  </SelectContent>
                </Select>
                {errors.modeOfShipment && (
                  <p className="text-sm text-red-500">{errors.modeOfShipment.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="shipmentType">Shipment Type *</Label>
                <Select onValueChange={(value) => setValue("shipmentType", value)} defaultValue="Import">
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Import">Import</SelectItem>
                    <SelectItem value="Export">Export</SelectItem>
                  </SelectContent>
                </Select>
                {errors.shipmentType && (
                  <p className="text-sm text-red-500">{errors.shipmentType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="airShippingLine">Air/Shipping Line *</Label>
                <Input
                  id="airShippingLine"
                  {...register("airShippingLine")}
                  placeholder="ONE"
                />
                {errors.airShippingLine && (
                  <p className="text-sm text-red-500">{errors.airShippingLine.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lclFclAir">LCL/FCL/Air</Label>
                <Select onValueChange={(value) => setValue("lclFclAir", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LCL">LCL</SelectItem>
                    <SelectItem value="FCL">FCL</SelectItem>
                    <SelectItem value="Air">Air</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="containerFlightNo">Container/Flight Number *</Label>
                <Input
                  id="containerFlightNo"
                  {...register("containerFlightNo")}
                  placeholder="ONEU0044026"
                />
                {errors.containerFlightNo && (
                  <p className="text-sm text-red-500">{errors.containerFlightNo.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="vesselVoyDetails">Vessel/Voyage Details *</Label>
                <Input
                  id="vesselVoyDetails"
                  {...register("vesselVoyDetails")}
                  placeholder="EVER EAGLE - 188W"
                />
                {errors.vesselVoyDetails && (
                  <p className="text-sm text-red-500">{errors.vesselVoyDetails.message}</p>
                )}
              </div>

              {/* Weight and Package Information */}
              <div className="space-y-2">
                <Label htmlFor="grossWeight">Gross Weight *</Label>
                <Input
                  id="grossWeight"
                  {...register("grossWeight")}
                  placeholder="10148.00"
                />
                {errors.grossWeight && (
                  <p className="text-sm text-red-500">{errors.grossWeight.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="netWeight">Net Weight *</Label>
                <Input
                  id="netWeight"
                  {...register("netWeight")}
                  placeholder="9800"
                />
                {errors.netWeight && (
                  <p className="text-sm text-red-500">{errors.netWeight.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalPackages">Total Packages *</Label>
                <Input
                  id="totalPackages"
                  {...register("totalPackages")}
                  placeholder="15 PLTS"
                />
                {errors.totalPackages && (
                  <p className="text-sm text-red-500">{errors.totalPackages.message}</p>
                )}
              </div>

              {/* Document Numbers */}
              <div className="space-y-2">
                <Label htmlFor="hblNo">HBL Number *</Label>
                <Input
                  id="hblNo"
                  {...register("hblNo")}
                  placeholder="TPENDL25040858"
                />
                {errors.hblNo && (
                  <p className="text-sm text-red-500">{errors.hblNo.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>HBL Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !hblDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {hblDate ? format(hblDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={hblDate}
                      onSelect={setHblDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mblNo">MBL Number *</Label>
                <Input
                  id="mblNo"
                  {...register("mblNo")}
                  placeholder="ONEYTPEF2627600"
                />
                {errors.mblNo && (
                  <p className="text-sm text-red-500">{errors.mblNo.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>MBL Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !mblDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {mblDate ? format(mblDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={mblDate}
                      onSelect={setMblDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Location Information */}
              <div className="space-y-2">
                <Label htmlFor="portOfLoading">Port of Loading *</Label>
                <Input
                  id="portOfLoading"
                  {...register("portOfLoading")}
                  placeholder="KAOHSIUNG"
                />
                {errors.portOfLoading && (
                  <p className="text-sm text-red-500">{errors.portOfLoading.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="finalDestination">Final Destination *</Label>
                <Input
                  id="finalDestination"
                  {...register("finalDestination")}
                  placeholder="ICD TKD"
                />
                {errors.finalDestination && (
                  <p className="text-sm text-red-500">{errors.finalDestination.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="etaPod">ETA POD *</Label>
                <Input
                  id="etaPod"
                  {...register("etaPod")}
                  placeholder="25/04/2025"
                />
                {errors.etaPod && (
                  <p className="text-sm text-red-500">{errors.etaPod.message}</p>
                )}
              </div>

              {/* Contact Information */}
              <div className="space-y-2">
                <Label htmlFor="rmName">RM Name *</Label>
                <Input
                  id="rmName"
                  {...register("rmName")}
                  placeholder="Manish Kumar (manish.kumar)"
                />
                {errors.rmName && (
                  <p className="text-sm text-red-500">{errors.rmName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="terms">Terms *</Label>
                <Input
                  id="terms"
                  {...register("terms")}
                  placeholder="FOB"
                />
                {errors.terms && (
                  <p className="text-sm text-red-500">{errors.terms.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select onValueChange={(value) => setValue("status", value)} defaultValue="Active">
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-red-500">{errors.status.message}</p>
                )}
              </div>
            </div>

            {/* Full-width fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="consigneeDetails">Consignee Details *</Label>
                <Textarea
                  id="consigneeDetails"
                  {...register("consigneeDetails")}
                  placeholder="CROWNWELL INTERNATIONAL"
                  rows={3}
                />
                {errors.consigneeDetails && (
                  <p className="text-sm text-red-500">{errors.consigneeDetails.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="shipperDetails">Shipper Details *</Label>
                <Textarea
                  id="shipperDetails"
                  {...register("shipperDetails")}
                  placeholder="GINKO FILM"
                  rows={3}
                />
                {errors.shipperDetails && (
                  <p className="text-sm text-red-500">{errors.shipperDetails.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="overseasAgentDetails">Overseas Agent Details *</Label>
                <Textarea
                  id="overseasAgentDetails"
                  {...register("overseasAgentDetails")}
                  placeholder="ORIENTAL VANGUARD LOGISTICS CO LTD"
                  rows={3}
                />
                {errors.overseasAgentDetails && (
                  <p className="text-sm text-red-500">{errors.overseasAgentDetails.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  {...register("remarks")}
                  placeholder="BILL AS PER QUOTE"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => reset()}>
                Clear Form
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Create Job
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
