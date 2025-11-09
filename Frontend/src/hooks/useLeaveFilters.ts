import { useState, useEffect, useMemo, useCallback } from 'react';
import { LeaveApplication } from '@/services/leaveService';
import { LeaveFilters, LeaveGroup } from '@/types/leaveFilters';
import { filterLeaves, groupLeaves } from '@/utils/leaveFilters';

interface UseLeaveFiltersReturn {
  filters: LeaveFilters;
  filteredLeaves: LeaveApplication[];
  groupedLeaves: LeaveGroup[] | null;
  updateFilter: (key: keyof LeaveFilters, value: any) => void;
  clearFilters: () => void;
  hasActiveFilters: () => boolean;
}

const DEFAULT_FILTERS: LeaveFilters = {
  searchQuery: '',
  type: 'all',
  status: 'all',
  startDate: '',
  endDate: '',
  groupBy: 'none'
};

/**
 * Custom hook for managing leave filter state and filtered results
 * Handles filtering, grouping, and state management for leave requests
 */
export function useLeaveFilters(initialLeaves: LeaveApplication[]): UseLeaveFiltersReturn {
  const [filters, setFilters] = useState<LeaveFilters>(DEFAULT_FILTERS);
  
  // Memoized filtered leaves calculation
  const filteredLeaves = useMemo(() => {
    return filterLeaves(initialLeaves, filters);
  }, [initialLeaves, filters]);
  
  // Memoized grouped leaves calculation
  const groupedLeaves = useMemo(() => {
    if (filters.groupBy === 'none') {
      return null;
    }
    return groupLeaves(filteredLeaves, filters.groupBy);
  }, [filteredLeaves, filters.groupBy]);
  
  /**
   * Update a single filter value
   */
  const updateFilter = useCallback((key: keyof LeaveFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);
  
  /**
   * Clear all filters and reset to default state
   */
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);
  
  /**
   * Check if any filters are currently active
   */
  const hasActiveFilters = useCallback(() => {
    return filters.searchQuery !== '' ||
           filters.type !== 'all' ||
           filters.status !== 'all' ||
           filters.startDate !== '' ||
           filters.endDate !== '' ||
           filters.groupBy !== 'none';
  }, [filters]);
  
  return {
    filters,
    filteredLeaves,
    groupedLeaves,
    updateFilter,
    clearFilters,
    hasActiveFilters
  };
}
