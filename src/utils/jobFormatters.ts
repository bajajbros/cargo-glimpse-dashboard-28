
import { Job } from '@/types/job';

export const formatCellValue = (job: Job, columnKey: string): string => {
  const value = (job as any)[columnKey];
  
  // Handle null/undefined values
  if (value == null) {
    return '';
  }
  
  // Handle specific column types
  switch (columnKey) {
    case 'containerFlightNumbers':
      // Handle both old string format and new array format
      if (Array.isArray(value)) {
        return value.join(', ');
      } else if (typeof value === 'string' && value.trim()) {
        // Handle old format where it was stored as a string
        return value;
      }
      return '';
    
    case 'createdAt':
    case 'updatedAt':
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      // Handle Firestore Timestamp objects
      if (value && typeof value === 'object' && value.seconds) {
        return new Date(value.seconds * 1000).toLocaleDateString();
      }
      return value ? new Date(value).toLocaleDateString() : '';
    
    case 'hblDate':
    case 'mblDate':
    case 'etaPod':
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      // Handle Firestore Timestamp objects
      if (value && typeof value === 'object' && value.seconds) {
        return new Date(value.seconds * 1000).toLocaleDateString();
      }
      // Handle string dates
      if (typeof value === 'string' && value) {
        const date = new Date(value);
        return !isNaN(date.getTime()) ? date.toLocaleDateString() : value;
      }
      return value || '';
    
    default:
      // Handle objects (but not dates)
      if (value && typeof value === 'object' && !(value instanceof Date)) {
        // Check if it's a Firestore Timestamp
        if (value.seconds && value.nanoseconds) {
          return new Date(value.seconds * 1000).toLocaleDateString();
        }
        return JSON.stringify(value);
      }
      return String(value || '');
  }
};

// New function specifically for displaying container numbers with proper formatting
export const formatContainerNumbers = (job: Job): string => {
  // First check the new format (containerFlightNumbers array)
  const newValue = job.containerFlightNumbers;
  
  // Handle new array format
  if (Array.isArray(newValue) && newValue.length > 0) {
    return newValue.join(', ');
  }
  
  // Handle old string format (containerFlightNumbers as string)
  if (typeof newValue === 'string' && newValue.trim()) {
    return newValue.trim();
  }
  
  // Check for old field name (containerFlightNo) for backward compatibility
  const oldValue = (job as any).containerFlightNo;
  if (typeof oldValue === 'string' && oldValue.trim()) {
    return oldValue.trim();
  }
  
  // No container numbers found
  return '';
};
