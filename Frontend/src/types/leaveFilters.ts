import { LeaveApplication } from '@/services/leaveService';

export interface LeaveFilters {
  searchQuery: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  groupBy: 'none' | 'employee' | 'type' | 'status';
}

export interface LeaveGroup {
  key: string;
  label: string;
  count: number;
  leaves: LeaveApplication[];
  isExpanded: boolean;
}

export const LEAVE_TYPES = ['Sick', 'Casual', 'Earned', 'Maternity', 'Paternity'] as const;

export const LEAVE_STATUSES = ['Pending', 'Approved', 'Rejected'] as const;

export const GROUP_BY_OPTIONS = [
  { value: 'none', label: 'No Grouping' },
  { value: 'employee', label: 'Group by Employee' },
  { value: 'type', label: 'Group by Leave Type' },
  { value: 'status', label: 'Group by Status' }
] as const;
