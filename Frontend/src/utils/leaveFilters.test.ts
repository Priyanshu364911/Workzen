import { describe, it, expect } from 'vitest';
import { filterLeaves, groupLeaves, validateDateRange } from './leaveFilters';
import { LeaveApplication } from '@/services/leaveService';
import { LeaveFilters } from '@/types/leaveFilters';

// Mock leave data for testing
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
  },
  {
    _id: '3',
    userId: 'user1',
    type: 'Earned',
    from: '2024-03-05',
    to: '2024-03-09',
    totalDays: 5,
    reason: 'Vacation',
    status: 'Approved',
    appliedAt: '2024-02-20',
    user: {
      name: 'John Doe',
      email: 'john@example.com',
      department: 'Engineering',
      position: 'Developer'
    }
  },
  {
    _id: '4',
    userId: 'user3',
    type: 'Sick',
    from: '2024-01-20',
    to: '2024-01-22',
    totalDays: 3,
    reason: 'Cold',
    status: 'Rejected',
    appliedAt: '2024-01-18',
    user: {
      name: 'Bob Johnson',
      email: 'bob@example.com',
      department: 'Sales',
      position: 'Executive'
    }
  }
];

describe('filterLeaves', () => {
  it('should return all leaves when no filters are applied', () => {
    const filters: LeaveFilters = {
      searchQuery: '',
      type: 'all',
      status: 'all',
      startDate: '',
      endDate: '',
      groupBy: 'none'
    };

    const result = filterLeaves(mockLeaves, filters);
    expect(result).toHaveLength(4);
  });

  it('should filter by employee name (case-insensitive)', () => {
    const filters: LeaveFilters = {
      searchQuery: 'john',
      type: 'all',
      status: 'all',
      startDate: '',
      endDate: '',
      groupBy: 'none'
    };

    const result = filterLeaves(mockLeaves, filters);
    expect(result).toHaveLength(2);
    expect(result.every(leave => leave.user?.name.toLowerCase().includes('john'))).toBe(true);
  });

  it('should filter by leave type', () => {
    const filters: LeaveFilters = {
      searchQuery: '',
      type: 'Sick',
      status: 'all',
      startDate: '',
      endDate: '',
      groupBy: 'none'
    };

    const result = filterLeaves(mockLeaves, filters);
    expect(result).toHaveLength(2);
    expect(result.every(leave => leave.type === 'Sick')).toBe(true);
  });

  it('should filter by status', () => {
    const filters: LeaveFilters = {
      searchQuery: '',
      type: 'all',
      status: 'Approved',
      startDate: '',
      endDate: '',
      groupBy: 'none'
    };

    const result = filterLeaves(mockLeaves, filters);
    expect(result).toHaveLength(2);
    expect(result.every(leave => leave.status === 'Approved')).toBe(true);
  });

  it('should filter by start date', () => {
    const filters: LeaveFilters = {
      searchQuery: '',
      type: 'all',
      status: 'all',
      startDate: '2024-02-01',
      endDate: '',
      groupBy: 'none'
    };

    const result = filterLeaves(mockLeaves, filters);
    expect(result).toHaveLength(2);
    expect(result.every(leave => new Date(leave.from) >= new Date('2024-02-01'))).toBe(true);
  });

  it('should filter by end date', () => {
    const filters: LeaveFilters = {
      searchQuery: '',
      type: 'all',
      status: 'all',
      startDate: '',
      endDate: '2024-02-01',
      groupBy: 'none'
    };

    const result = filterLeaves(mockLeaves, filters);
    expect(result).toHaveLength(2);
    expect(result.every(leave => new Date(leave.from) <= new Date('2024-02-01'))).toBe(true);
  });

  it('should filter by date range', () => {
    const filters: LeaveFilters = {
      searchQuery: '',
      type: 'all',
      status: 'all',
      startDate: '2024-01-15',
      endDate: '2024-02-15',
      groupBy: 'none'
    };

    const result = filterLeaves(mockLeaves, filters);
    expect(result).toHaveLength(3);
  });

  it('should apply multiple filters simultaneously', () => {
    const filters: LeaveFilters = {
      searchQuery: 'john',
      type: 'Sick',
      status: 'Pending',
      startDate: '',
      endDate: '',
      groupBy: 'none'
    };

    const result = filterLeaves(mockLeaves, filters);
    expect(result).toHaveLength(1);
    expect(result[0]._id).toBe('1');
  });

  it('should return empty array when no matches found', () => {
    const filters: LeaveFilters = {
      searchQuery: 'nonexistent',
      type: 'all',
      status: 'all',
      startDate: '',
      endDate: '',
      groupBy: 'none'
    };

    const result = filterLeaves(mockLeaves, filters);
    expect(result).toHaveLength(0);
  });
});

describe('groupLeaves', () => {
  it('should group leaves by employee', () => {
    const result = groupLeaves(mockLeaves, 'employee');
    
    expect(result).toHaveLength(3);
    expect(result.find(g => g.label === 'John Doe')?.count).toBe(2);
    expect(result.find(g => g.label === 'Jane Smith')?.count).toBe(1);
    expect(result.find(g => g.label === 'Bob Johnson')?.count).toBe(1);
  });

  it('should group leaves by type', () => {
    const result = groupLeaves(mockLeaves, 'type');
    
    expect(result).toHaveLength(3);
    expect(result.find(g => g.label === 'Sick')?.count).toBe(2);
    expect(result.find(g => g.label === 'Casual')?.count).toBe(1);
    expect(result.find(g => g.label === 'Earned')?.count).toBe(1);
  });

  it('should group leaves by status', () => {
    const result = groupLeaves(mockLeaves, 'status');
    
    expect(result).toHaveLength(3);
    expect(result.find(g => g.label === 'Pending')?.count).toBe(1);
    expect(result.find(g => g.label === 'Approved')?.count).toBe(2);
    expect(result.find(g => g.label === 'Rejected')?.count).toBe(1);
  });

  it('should set isExpanded to true for all groups', () => {
    const result = groupLeaves(mockLeaves, 'type');
    
    expect(result.every(group => group.isExpanded === true)).toBe(true);
  });

  it('should include all leaves in their respective groups', () => {
    const result = groupLeaves(mockLeaves, 'employee');
    
    const totalLeavesInGroups = result.reduce((sum, group) => sum + group.leaves.length, 0);
    expect(totalLeavesInGroups).toBe(mockLeaves.length);
  });
});

describe('validateDateRange', () => {
  it('should return null for valid date range', () => {
    const result = validateDateRange('2024-01-01', '2024-01-31');
    expect(result).toBeNull();
  });

  it('should return error message when end date is before start date', () => {
    const result = validateDateRange('2024-01-31', '2024-01-01');
    expect(result).toBe('End date cannot be before start date');
  });

  it('should return null when only start date is provided', () => {
    const result = validateDateRange('2024-01-01', '');
    expect(result).toBeNull();
  });

  it('should return null when only end date is provided', () => {
    const result = validateDateRange('', '2024-01-31');
    expect(result).toBeNull();
  });

  it('should return null when both dates are empty', () => {
    const result = validateDateRange('', '');
    expect(result).toBeNull();
  });

  it('should return null when dates are equal', () => {
    const result = validateDateRange('2024-01-15', '2024-01-15');
    expect(result).toBeNull();
  });
});
