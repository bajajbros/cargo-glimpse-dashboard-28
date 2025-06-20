
import { Job } from '@/types/job';

export interface JobFilters {
  rmName: string;
  shipmentType: string;
  modeOfShipment: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  shipper: string;
  consignee: string;
  overseasAgent: string;
  portOfLoading: string;
  finalDestination: string;
}

export const applyJobFilters = (jobs: Job[], searchQuery: string, filters: JobFilters): Job[] => {
  let filtered = jobs;

  // Apply search query
  if (searchQuery) {
    filtered = filtered.filter(job => {
      const searchableValues = [
        job.jobNumber,
        job.bookingNo,
        job.invoiceNo,
        job.shipperDetails,
        job.consigneeDetails,
        job.rmName,
        job.modeOfShipment,
        job.shipmentType,
        job.portOfLoading,
        job.finalDestination
      ];
      return searchableValues.some(value => 
        value && value.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }

  // Apply filters
  if (filters.rmName) {
    filtered = filtered.filter(job => job.rmName === filters.rmName);
  }
  if (filters.shipmentType) {
    filtered = filtered.filter(job => job.shipmentType === filters.shipmentType);
  }
  if (filters.modeOfShipment) {
    filtered = filtered.filter(job => job.modeOfShipment === filters.modeOfShipment);
  }
  if (filters.status) {
    filtered = filtered.filter(job => job.status === filters.status);
  }
  if (filters.shipper) {
    filtered = filtered.filter(job => job.shipperDetails === filters.shipper);
  }
  if (filters.consignee) {
    filtered = filtered.filter(job => job.consigneeDetails === filters.consignee);
  }
  if (filters.overseasAgent) {
    filtered = filtered.filter(job => job.overseasAgentDetails === filters.overseasAgent);
  }
  if (filters.portOfLoading) {
    filtered = filtered.filter(job => job.portOfLoading === filters.portOfLoading);
  }
  if (filters.finalDestination) {
    filtered = filtered.filter(job => job.finalDestination === filters.finalDestination);
  }

  // Apply date filters
  if (filters.dateFrom || filters.dateTo) {
    filtered = filtered.filter(job => {
      const jobDate = job.createdAt;
      const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
      const toDate = filters.dateTo ? new Date(filters.dateTo) : null;
      
      if (fromDate && toDate) {
        return jobDate >= fromDate && jobDate <= toDate;
      } else if (fromDate) {
        return jobDate >= fromDate;
      } else if (toDate) {
        return jobDate <= toDate;
      }
      return true;
    });
  }

  return filtered;
};

export const extractUniqueValues = (jobsList: Job[]) => {
  const rmNames = [...new Set(jobsList.map(job => job.rmName).filter(Boolean))].sort();
  const shippers = [...new Set(jobsList.map(job => job.shipperDetails).filter(Boolean))].sort();
  const consignees = [...new Set(jobsList.map(job => job.consigneeDetails).filter(Boolean))].sort();
  const overseasAgents = [...new Set(jobsList.map(job => job.overseasAgentDetails).filter(Boolean))].sort();
  const portsOfLoading = [...new Set(jobsList.map(job => job.portOfLoading).filter(Boolean))].sort();
  const finalDestinations = [...new Set(jobsList.map(job => job.finalDestination).filter(Boolean))].sort();

  return {
    rmNames,
    shippers,
    consignees,
    overseasAgents,
    portsOfLoading,
    finalDestinations
  };
};
