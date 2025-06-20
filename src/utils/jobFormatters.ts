
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
      return Array.isArray(value) ? value.join(', ') : '';
    
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
