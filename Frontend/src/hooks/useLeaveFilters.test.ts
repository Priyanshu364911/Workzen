import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLeaveFilters } from './useLeaveFilters';
import { LeaveApplication } from '@/services/leaveService';

const mockLeaves: LeaveApplication[] = [
  {
    _id: '1',
    userId: 'user1',
    type: 'Sick',
    from: '2024-01-15',
    to: '2024-01-17',
    totalDays: 3,
    reason: 'Flu',
    status: 'Pending',
    appliedAt: '2024-01-10',
    user: {
      name: 'John Doe',
      email: 'john@example.com',
      department: 'Engineering',
      position: 'Developer'
    }
  },
  {
    _id: '2',
    userId: 'user2',
    type: 'Casual',
    from: '2024-02-10',
    to: '2024-02-12',
    totalDays: 3,
    reason: 'Personal',
    status: 'Approved',
    appliedAt: '2024-02-05',
    user: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      department: 'HR',
      position: 'Manager'
    }
  }
];

describe('useLeaveFilters', () => {
  it('should initialize with default filters', () => {
    const { result } = renderHook(() => useLeaveFilters(mockLeaves));

    expect(result.current.filters).toEqual({
      searchQuery: '',
      type: 'all',
      status: 'all',
      startDate: '',
      endDate: '',
      groupBy: 'none'
    });
  });

  it('should return all leaves when no filters are applied', () => {
    const { result } = renderHook(() => useLeaveFilters(mockLeaves));

    expect(result.current.filteredLeaves).toHaveLength(2);
  });

  it('should update filter when updateFilter is called', () => {
    const { result } = renderHook(() => useLeaveFilters(mockLeaves));

    act(() => {
      result.current.updateFilter('type', 'Sick');
    });

    expect(result.current.filters.type).toBe('Sick');
    expect(result.current.filteredLeaves).toHaveLength(1);
  });

  it('should filter leaves when search query is updated', () => {
    const { result } = renderHook(() => useLeaveFilters(mockLeaves));

    act(() => {
      result.current.updateFilter('searchQuery', 'john');
    });

    expect(result.current.filteredLeaves).toHaveLength(1);
    expect(result.current.filteredLeaves[0].user?.name).toBe('John Doe');
  });

  it('should clear all filters when clearFilters is called', () => {
    const { result } = renderHook(() => useLeaveFilters(mockLeaves));

    act(() => {
      result.current.updateFilter('type', 'Sick');
      result.current.updateFilter('status', 'Pending');
      result.current.updateFilter('searchQuery', 'john');
    });

    expect(result.current.filteredLeaves).toHaveLength(1);

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters).toEqual({
      searchQuery: '',
      type: 'all',
      status: 'all',
      startDate: '',
      endDate: '',
      groupBy: 'none'
    });
    expect(result.current.filteredLeaves).toHaveLength(2);
  });

  it('should return true when filters are active', () => {
    const { result } = renderHook(() => useLeaveFilters(mockLeaves));

    expect(result.current.hasActiveFilters()).toBe(false);

    act(() => {
      result.current.updateFilter('type', 'Sick');
    });

    expect(result.current.hasActiveFilters()).toBe(true);
  });

  it('should return null for groupedLeaves when groupBy is none', () => {
    const { result } = renderHook(() => useLeaveFilters(mockLeaves));

    expect(result.current.groupedLeaves).toBeNull();
  });

  it('should return grouped leaves when groupBy is set', () => {
    const { result } = renderHook(() => useLeaveFilters(mockLeaves));

    act(() => {
      result.current.updateFilter('groupBy', 'type');
    });

    expect(result.current.groupedLeaves).not.toBeNull();
    expect(result.current.groupedLeaves).toHaveLength(2);
  });

  it('should update filtered leaves when initial leaves change', () => {
    const { result, rerender } = renderHook(
      ({ leaves }) => useLeaveFilters(leaves),
      { initialProps: { leaves: mockLeaves } }
    );

    expect(result.current.filteredLeaves).toHaveLength(2);

    const newLeaves = [...mockLeaves, {
      _id: '3',
      userId: 'user3',
      type: 'Earned',
      from: '2024-03-05',
      to: '2024-03-09',
      totalDays: 5,
      reason: 'Vacation',
      status: 'Approved',
      appliedAt: '2024-02-20',
      user: {
        name: 'Bob Johnson',
        email: 'bob@example.com',
        department: 'Sales',
        position: 'Executive'
      }
    }];

    rerender({ leaves: newLeaves });

    expect(result.current.filteredLeaves).toHaveLength(3);
  });

  it('should apply multiple filters correctly', () => {
    const { result } = renderHook(() => useLeaveFilters(mockLeaves));

    act(() => {
      result.current.updateFilter('type', 'Sick');
      result.current.updateFilter('status', 'Pending');
    });

    expect(result.current.filteredLeaves).toHaveLength(1);
    expect(result.current.filteredLeaves[0]._id).toBe('1');
  });
});
