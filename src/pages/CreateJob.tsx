
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
    <div className="p-4 h-full overflow-y-auto">
      <Card className="max-w-7xl mx-auto">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Create New Job</CardTitle>
          <CardDescription>
            Fill in the details below to create a new logistics job
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {/* Job Information */}
              <div className="space-y-1">
                <Label htmlFor="jobNumber" className="text-xs font-medium">Job Number *</Label>
                <Input
                  id="jobNumber"
                  {...register("jobNumber")}
                  placeholder="FF-10010/25-26"
                  className="h-8 text-sm"
                />
                {errors.jobNumber && (
                  <p className="text-xs text-red-500">{errors.jobNumber.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="bookingNo" className="text-xs font-medium">Booking Number *</Label>
                <Input
                  id="bookingNo"
                  {...register("bookingNo")}
                  placeholder="3426"
                  className="h-8 text-sm"
                />
                {errors.bookingNo && (
                  <p className="text-xs text-red-500">{errors.bookingNo.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="invoiceNo" className="text-xs font-medium">Invoice Number *</Label>
                <Input
                  id="invoiceNo"
                  {...register("invoiceNo")}
                  placeholder="3426"
                  className="h-8 text-sm"
                />
                {errors.invoiceNo && (
                  <p className="text-xs text-red-500">{errors.invoiceNo.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="modeOfShipment" className="text-xs font-medium">Mode of Shipment *</Label>
                <Select onValueChange={(value) => setValue("modeOfShipment", value)} defaultValue="Sea">
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sea">Sea</SelectItem>
                    <SelectItem value="Air">Air</SelectItem>
                    <SelectItem value="Road">Road</SelectItem>
                  </SelectContent>
                </Select>
                {errors.modeOfShipment && (
                  <p className="text-xs text-red-500">{errors.modeOfShipment.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="shipmentType" className="text-xs font-medium">Shipment Type *</Label>
                <Select onValueChange={(value) => setValue("shipmentType", value)} defaultValue="Import">
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Import">Import</SelectItem>
                    <SelectItem value="Export">Export</SelectItem>
                  </SelectContent>
                </Select>
                {errors.shipmentType && (
                  <p className="text-xs text-red-500">{errors.shipmentType.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="airShippingLine" className="text-xs font-medium">Air/Shipping Line *</Label>
                <Input
                  id="airShippingLine"
                  {...register("airShippingLine")}
                  placeholder="ONE"
                  className="h-8 text-sm"
                />
                {errors.airShippingLine && (
                  <p className="text-xs text-red-500">{errors.airShippingLine.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="lclFclAir" className="text-xs font-medium">LCL/FCL/Air</Label>
                <Select onValueChange={(value) => setValue("lclFclAir", value)}>
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

              <div className="space-y-1">
                <Label htmlFor="containerFlightNo" className="text-xs font-medium">Container/Flight Number *</Label>
                <Input
                  id="containerFlightNo"
                  {...register("containerFlightNo")}
                  placeholder="ONEU0044026"
                  className="h-8 text-sm"
                />
                {errors.containerFlightNo && (
                  <p className="text-xs text-red-500">{errors.containerFlightNo.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="vesselVoyDetails" className="text-xs font-medium">Vessel/Voyage Details *</Label>
                <Input
                  id="vesselVoyDetails"
                  {...register("vesselVoyDetails")}
                  placeholder="EVER EAGLE - 188W"
                  className="h-8 text-sm"
                />
                {errors.vesselVoyDetails && (
                  <p className="text-xs text-red-500">{errors.vesselVoyDetails.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="grossWeight" className="text-xs font-medium">Gross Weight *</Label>
                <Input
                  id="grossWeight"
                  {...register("grossWeight")}
                  placeholder="10148.00"
                  className="h-8 text-sm"
                />
                {errors.grossWeight && (
                  <p className="text-xs text-red-500">{errors.grossWeight.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="netWeight" className="text-xs font-medium">Net Weight *</Label>
                <Input
                  id="netWeight"
                  {...register("netWeight")}
                  placeholder="9800"
                  className="h-8 text-sm"
                />
                {errors.netWeight && (
                  <p className="text-xs text-red-500">{errors.netWeight.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="totalPackages" className="text-xs font-medium">Total Packages *</Label>
                <Input
                  id="totalPackages"
                  {...register("totalPackages")}
                  placeholder="15 PLTS"
                  className="h-8 text-sm"
                />
                {errors.totalPackages && (
                  <p className="text-xs text-red-500">{errors.totalPackages.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="hblNo" className="text-xs font-medium">HBL Number *</Label>
                <Input
                  id="hblNo"
                  {...register("hblNo")}
                  placeholder="TPENDL25040858"
                  className="h-8 text-sm"
                />
                {errors.hblNo && (
                  <p className="text-xs text-red-500">{errors.hblNo.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">HBL Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-8 text-sm",
                        !hblDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {hblDate ? format(hblDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={hblDate}
                      onSelect={setHblDate}
                      initialFocus
                      className="p-3"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1">
                <Label htmlFor="mblNo" className="text-xs font-medium">MBL Number *</Label>
                <Input
                  id="mblNo"
                  {...register("mblNo")}
                  placeholder="ONEYTPEF2627600"
                  className="h-8 text-sm"
                />
                {errors.mblNo && (
                  <p className="text-xs text-red-500">{errors.mblNo.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">MBL Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-8 text-sm",
                        !mblDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {mblDate ? format(mblDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={mblDate}
                      onSelect={setMblDate}
                      initialFocus
                      className="p-3"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1">
                <Label htmlFor="portOfLoading" className="text-xs font-medium">Port of Loading *</Label>
                <Input
                  id="portOfLoading"
                  {...register("portOfLoading")}
                  placeholder="KAOHSIUNG"
                  className="h-8 text-sm"
                />
                {errors.portOfLoading && (
                  <p className="text-xs text-red-500">{errors.portOfLoading.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="finalDestination" className="text-xs font-medium">Final Destination *</Label>
                <Input
                  id="finalDestination"
                  {...register("finalDestination")}
                  placeholder="ICD TKD"
                  className="h-8 text-sm"
                />
                {errors.finalDestination && (
                  <p className="text-xs text-red-500">{errors.finalDestination.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="etaPod" className="text-xs font-medium">ETA POD *</Label>
                <Input
                  id="etaPod"
                  {...register("etaPod")}
                  placeholder="25/04/2025"
                  className="h-8 text-sm"
                />
                {errors.etaPod && (
                  <p className="text-xs text-red-500">{errors.etaPod.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="rmName" className="text-xs font-medium">RM Name *</Label>
                <Input
                  id="rmName"
                  {...register("rmName")}
                  placeholder="Manish Kumar (manish.kumar)"
                  className="h-8 text-sm"
                />
                {errors.rmName && (
                  <p className="text-xs text-red-500">{errors.rmName.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="terms" className="text-xs font-medium">Terms *</Label>
                <Input
                  id="terms"
                  {...register("terms")}
                  placeholder="FOB"
                  className="h-8 text-sm"
                />
                {errors.terms && (
                  <p className="text-xs text-red-500">{errors.terms.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="status" className="text-xs font-medium">Status *</Label>
                <Select onValueChange={(value) => setValue("status", value)} defaultValue="Active">
                  <SelectTrigger className="h-8 text-sm">
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
                  <p className="text-xs text-red-500">{errors.status.message}</p>
                )}
              </div>
            </div>

            {/* Full-width fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="consigneeDetails" className="text-xs font-medium">Consignee Details *</Label>
                <Textarea
                  id="consigneeDetails"
                  {...register("consigneeDetails")}
                  placeholder="CROWNWELL INTERNATIONAL"
                  rows={2}
                  className="text-sm"
                />
                {errors.consigneeDetails && (
                  <p className="text-xs text-red-500">{errors.consigneeDetails.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="shipperDetails" className="text-xs font-medium">Shipper Details *</Label>
                <Textarea
                  id="shipperDetails"
                  {...register("shipperDetails")}
                  placeholder="GINKO FILM"
                  rows={2}
                  className="text-sm"
                />
                {errors.shipperDetails && (
                  <p className="text-xs text-red-500">{errors.shipperDetails.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="overseasAgentDetails" className="text-xs font-medium">Overseas Agent Details *</Label>
                <Textarea
                  id="overseasAgentDetails"
                  {...register("overseasAgentDetails")}
                  placeholder="ORIENTAL VANGUARD LOGISTICS CO LTD"
                  rows={2}
                  className="text-sm"
                />
                {errors.overseasAgentDetails && (
                  <p className="text-xs text-red-500">{errors.overseasAgentDetails.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="remarks" className="text-xs font-medium">Remarks</Label>
                <Textarea
                  id="remarks"
                  {...register("remarks")}
                  placeholder="BILL AS PER QUOTE"
                  rows={2}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <Button type="button" variant="outline" onClick={() => reset()} className="h-8 text-sm">
                Clear Form
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 h-8 text-sm">
                Create Job
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
