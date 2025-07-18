
export interface Job {
  id: string;
  jobNumber: string;
  bookingNo: string;
  invoiceNo: string;
  status: 'Active' | 'Pending' | 'Completed' | 'Cancelled';
  airShippingLine: string;
  modeOfShipment: 'Sea' | 'Air' | 'Road' | 'Rail';
  shipmentType: 'Import' | 'Export';
  lclFclAir: 'LCL' | 'FCL' | 'Air';
  containerFlightNumbers: string[];
  portOfLoading: string;
  finalDestination: string;
  etaPod: string;
  grossWeight: string;
  netWeight: string;
  totalPackages: string;
  terms: string; // Changed from enum to string
  hblNo: string;
  hblDate: string;
  mblNo: string;
  mblDate: string;
  rmName: string;
  vesselVoyDetails: string;
  consigneeDetails: string;
  shipperDetails: string;
  overseasAgentDetails: string;
  remarks: string;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
}

export interface JobFormData {
  bookingNo: string;
  invoiceNo: string;
  status: string;
  airShippingLine: string;
  modeOfShipment: string;
  shipmentType: string;
  lclFclAir: string;
  containerFlightNumbers: string[];
  portOfLoading: string;
  finalDestination: string;
  etaPod: string;
  grossWeight: string;
  netWeight: string;
  totalPackages: string;
  terms: string;
  hblNo: string;
  hblDate: string;
  mblNo: string;
  mblDate: string;
  rmName: string;
  vesselVoyDetails: string;
  consigneeDetails: string;
  shipperDetails: string;
  overseasAgentDetails: string;
  remarks: string;
}
