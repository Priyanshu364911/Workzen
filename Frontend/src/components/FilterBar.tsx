import { useState, useEffect, useMemo, memo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Search, Filter } from 'lucide-react';

// Constants for filter options
export const LEAVE_TYPES = ['Sick', 'Casual', 'Earned', 'Maternity', 'Paternity'];
export const LEAVE_STATUSES = ['Pending', 'Approved', 'Rejected'];
export const GROUP_BY_OPTIONS = [
  { value: 'none', label: 'No Grouping' },
  { value: 'employee', label: 'Group by Employee' },
  { value: 'type', label: 'Group by Leave Type' },
  { value: 'status', label: 'Group by Status' }
];

export interface LeaveFilters {
  searchQuery: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  groupBy: 'none' | 'employee' | 'type' | 'status';
}

export interface FilterBarProps {
  filters: LeaveFilters;
  onFilterChange: (filters: LeaveFilters) => void;
  onClearFilters: () => void;
  showEmployeeSearch: boolean;
  leaveTypes?: string[];
  statuses?: string[];
}

const FilterBarComponent = ({
  filters,
  onFilterChange,
  onClearFilters,
  showEmployeeSearch,
  leaveTypes = LEAVE_TYPES,
  statuses = LEAVE_STATUSES
}: FilterBarProps) => {
  const [searchInput, setSearchInput] = useState(filters.searchQuery);
  const [dateError, setDateError] = useState<string | null>(null);
  const [announceMessage, setAnnounceMessage] = useState<string>('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.searchQuery) {
        onFilterChange({ ...filters, searchQuery: searchInput });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Validate date range
  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      
      if (end < start) {
        setDateError('End date cannot be before start date');
      } else {
        setDateError(null);
      }
    } else {
      setDateError(null);
    }
  }, [filters.startDate, filters.endDate]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return filters.searchQuery !== '' ||
           filters.type !== 'all' ||
           filters.status !== 'all' ||
           filters.startDate !== '' ||
           filters.endDate !== '' ||
           filters.groupBy !== 'none';
  }, [filters]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.type !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.groupBy !== 'none') count++;
    return count;
  }, [filters]);

  const handleFilterUpdate = (key: keyof LeaveFilters, value: string) => {
    onFilterChange({ ...filters, [key]: value });
    
    // Announce filter changes to screen readers
    const filterLabels: Record<string, string> = {
      type: 'Leave type',
      status: 'Status',
      startDate: 'Start date',
      endDate: 'End date',
      groupBy: 'Grouping'
    };
    
    if (key !== 'searchQuery') {
      const label = filterLabels[key] || key;
      const displayValue = key === 'groupBy' 
        ? GROUP_BY_OPTIONS.find(o => o.value === value)?.label || value
        : value === 'all' ? 'cleared' : value;
      setAnnounceMessage(`${label} filter ${displayValue === 'cleared' ? 'cleared' : 'set to ' + displayValue}`);
    }
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setDateError(null);
    onClearFilters();
    setAnnounceMessage('All filters cleared');
  };

  return (
    <div 
      className="bg-card rounded-lg shadow-sm p-6 mb-6 border border-border"
      role="search"
      aria-label="Leave request filters"
    >
      {/* Screen reader announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {announceMessage}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-foreground">Filters</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2" aria-label={`${activeFilterCount} active filters`}>
              {activeFilterCount} active
            </Badge>
          )}
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Clear all filters"
          >
            <X className="h-4 w-4 mr-1" aria-hidden="true" />
            Clear All Filters
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Employee Search - Hidden for employee role */}
        {showEmployeeSearch && (
          <div className="xl:col-span-2">
            <Label htmlFor="search" className="text-sm font-medium mb-2 block">
              Search Employee
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="search"
                type="text"
                placeholder="Search by name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchInput('');
                    handleFilterUpdate('searchQuery', '');
                  }
                }}
                className="pl-9"
                aria-label="Search employee by name"
                aria-describedby="search-help"
              />
              <span id="search-help" className="sr-only">
                Type to search for employees by name. Press Escape to clear.
              </span>
            </div>
          </div>
        )}

        {/* Leave Type Filter */}
        <div>
          <Label htmlFor="type" className="text-sm font-medium mb-2 block">
            Leave Type
          </Label>
          <Select
            value={filters.type}
            onValueChange={(value) => handleFilterUpdate('type', value)}
          >
            <SelectTrigger 
              id="type" 
              aria-label="Filter by leave type"
              aria-describedby="type-help"
            >
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {leaveTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span id="type-help" className="sr-only">
            Filter leave requests by type
          </span>
        </div>

        {/* Status Filter */}
        <div>
          <Label htmlFor="status" className="text-sm font-medium mb-2 block">
            Status
          </Label>
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterUpdate('status', value)}
          >
            <SelectTrigger 
              id="status" 
              aria-label="Filter by status"
              aria-describedby="status-help"
            >
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span id="status-help" className="sr-only">
            Filter leave requests by approval status
          </span>
        </div>

        {/* Start Date Filter */}
        <div>
          <Label htmlFor="startDate" className="text-sm font-medium mb-2 block">
            From Date
          </Label>
          <Input
            id="startDate"
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterUpdate('startDate', e.target.value)}
            aria-label="Filter by start date"
            aria-describedby="startDate-help"
            aria-invalid={dateError && filters.startDate ? 'true' : 'false'}
            className={dateError && filters.startDate ? 'border-destructive' : ''}
          />
          <span id="startDate-help" className="sr-only">
            Filter leave requests starting from this date
          </span>
        </div>

        {/* End Date Filter */}
        <div>
          <Label htmlFor="endDate" className="text-sm font-medium mb-2 block">
            To Date
          </Label>
          <Input
            id="endDate"
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterUpdate('endDate', e.target.value)}
            aria-label="Filter by end date"
            aria-describedby="endDate-help"
            aria-invalid={dateError && filters.endDate ? 'true' : 'false'}
            className={dateError && filters.endDate ? 'border-destructive' : ''}
          />
          <span id="endDate-help" className="sr-only">
            Filter leave requests up to this date
          </span>
        </div>

        {/* Group By Selector */}
        <div>
          <Label htmlFor="groupBy" className="text-sm font-medium mb-2 block">
            Group By
          </Label>
          <Select
            value={filters.groupBy}
            onValueChange={(value) => handleFilterUpdate('groupBy', value as LeaveFilters['groupBy'])}
          >
            <SelectTrigger 
              id="groupBy" 
              aria-label="Group leaves by"
              aria-describedby="groupBy-help"
            >
              <SelectValue placeholder="No Grouping" />
            </SelectTrigger>
            <SelectContent>
              {GROUP_BY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span id="groupBy-help" className="sr-only">
            Organize leave requests by grouping criteria
          </span>
        </div>
      </div>

      {/* Date Range Error Message */}
      {dateError && (
        <div 
          className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-sm text-destructive flex items-center gap-2">
            <X className="h-4 w-4" aria-hidden="true" />
            {dateError}
          </p>
        </div>
      )}

      {/* Active Filter Indicators */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2" role="region" aria-label="Active filters">
          {filters.searchQuery && (
            <Badge variant="outline" className="gap-1">
              Search: {filters.searchQuery}
              <button
                onClick={() => {
                  setSearchInput('');
                  handleFilterUpdate('searchQuery', '');
                }}
                className="ml-1 hover:bg-accent rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                aria-label={`Remove search filter for ${filters.searchQuery}`}
                type="button"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </Badge>
          )}
          {filters.type !== 'all' && (
            <Badge variant="outline" className="gap-1">
              Type: {filters.type}
              <button
                onClick={() => handleFilterUpdate('type', 'all')}
                className="ml-1 hover:bg-accent rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                aria-label={`Remove ${filters.type} type filter`}
                type="button"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </Badge>
          )}
          {filters.status !== 'all' && (
            <Badge variant="outline" className="gap-1">
              Status: {filters.status}
              <button
                onClick={() => handleFilterUpdate('status', 'all')}
                className="ml-1 hover:bg-accent rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                aria-label={`Remove ${filters.status} status filter`}
                type="button"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </Badge>
          )}
          {filters.startDate && (
            <Badge variant="outline" className="gap-1">
              From: {new Date(filters.startDate).toLocaleDateString('en-IN')}
              <button
                onClick={() => handleFilterUpdate('startDate', '')}
                className="ml-1 hover:bg-accent rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                aria-label="Remove start date filter"
                type="button"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </Badge>
          )}
          {filters.endDate && (
            <Badge variant="outline" className="gap-1">
              To: {new Date(filters.endDate).toLocaleDateString('en-IN')}
              <button
                onClick={() => handleFilterUpdate('endDate', '')}
                className="ml-1 hover:bg-accent rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                aria-label="Remove end date filter"
                type="button"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </Badge>
          )}
          {filters.groupBy !== 'none' && (
            <Badge variant="outline" className="gap-1">
              Grouped by: {GROUP_BY_OPTIONS.find(o => o.value === filters.groupBy)?.label}
              <button
                onClick={() => handleFilterUpdate('groupBy', 'none')}
                className="ml-1 hover:bg-accent rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                aria-label="Remove grouping"
                type="button"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

// Memoized version to prevent unnecessary re-renders
export const FilterBar = memo(FilterBarComponent);

export default FilterBar;
