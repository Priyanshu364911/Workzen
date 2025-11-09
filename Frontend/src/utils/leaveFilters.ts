import { LeaveApplication } from '@/services/leaveService';
import { LeaveFilters, LeaveGroup } from '@/types/leaveFilters';

/**
 * Filter leaves based on the provided filter criteria
 * Implements client-side filtering for search, type, status, and date range
 */
export function filterLeaves(
  leaves: LeaveApplication[],
  filters: LeaveFilters
): LeaveApplication[] {
  return leaves.filter(leave => {
    // Employee name search (case-insensitive)
    if (filters.searchQuery) {
      const searchLower = filters.searchQuery.toLowerCase();
      const employeeName = leave.user?.name?.toLowerCase() || '';
      if (!employeeName.includes(searchLower)) {
        return false;
      }
    }
    
    // Type filter
    if (filters.type && filters.type !== 'all') {
      if (leave.type !== filters.type) {
        return false;
      }
    }
    
    // Status filter
    if (filters.status && filters.status !== 'all') {
      if (leave.status !== filters.status) {
        return false;
      }
    }
    
    // Date range filter - filter by leave start date
    if (filters.startDate) {
      const leaveStart = new Date(leave.from);
      const filterStart = new Date(filters.startDate);
      if (leaveStart < filterStart) {
        return false;
      }
    }
    
    if (filters.endDate) {
      const leaveStart = new Date(leave.from);
      const filterEnd = new Date(filters.endDate);
      if (leaveStart > filterEnd) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Group leaves by the specified criteria
 * Returns an array of groups with their leaves
 */
export function groupLeaves(
  leaves: LeaveApplication[],
  groupBy: 'employee' | 'type' | 'status'
): LeaveGroup[] {
  const groups = new Map<string, LeaveApplication[]>();
  
  leaves.forEach(leave => {
    let key: string;
    let label: string;
    
    switch (groupBy) {
      case 'employee':
        key = leave.userId;
        label = leave.user?.name || 'Unknown';
        break;
      case 'type':
        key = leave.type;
        label = leave.type;
        break;
      case 'status':
        key = leave.status;
        label = leave.status;
        break;
    }
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(leave);
  });
  
  return Array.from(groups.entries()).map(([key, leaves]) => ({
    key,
    label: groupBy === 'employee' ? (leaves[0].user?.name || key) : key,
    count: leaves.length,
    leaves,
    isExpanded: true
  }));
}

/**
 * Validate date range to ensure end date is not before start date
 */
export function validateDateRange(startDate: string, endDate: string): string | null {
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end < start) {
      return 'End date cannot be before start date';
    }
  }
  
  return null;
}
