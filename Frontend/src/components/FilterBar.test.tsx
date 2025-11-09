import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBar, LeaveFilters } from './FilterBar';

describe('FilterBar', () => {
  const defaultFilters: LeaveFilters = {
    searchQuery: '',
    type: 'all',
    status: 'all',
    startDate: '',
    endDate: '',
    groupBy: 'none'
  };

  const mockOnFilterChange = vi.fn();
  const mockOnClearFilters = vi.fn();

  it('should render all filter controls', () => {
    render(
      <FilterBar
        filters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
        showEmployeeSearch={true}
      />
    );

    expect(screen.getByLabelText(/search employee/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/filter by leave type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/filter by status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/filter by start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/filter by end date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/group leaves by/i)).toBeInTheDocument();
  });

  it('should hide employee search when showEmployeeSearch is false', () => {
    render(
      <FilterBar
        filters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
        showEmployeeSearch={false}
      />
    );

    expect(screen.queryByLabelText(/search employee/i)).not.toBeInTheDocument();
  });

  it('should call onFilterChange with debounced search query', async () => {
    const user = userEvent.setup();
    
    render(
      <FilterBar
        filters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
        showEmployeeSearch={true}
      />
    );

    const searchInput = screen.getByLabelText(/search employee/i);
    await user.type(searchInput, 'john');

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({ searchQuery: 'john' })
      );
    }, { timeout: 500 });
  });

  it('should show Clear All Filters button when filters are active', () => {
    const activeFilters: LeaveFilters = {
      ...defaultFilters,
      type: 'Sick'
    };

    render(
      <FilterBar
        filters={activeFilters}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
        showEmployeeSearch={true}
      />
    );

    expect(screen.getByRole('button', { name: /clear all filters/i })).toBeInTheDocument();
  });

  it('should hide Clear All Filters button when no filters are active', () => {
    render(
      <FilterBar
        filters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
        showEmployeeSearch={true}
      />
    );

    expect(screen.queryByRole('button', { name: /clear all filters/i })).not.toBeInTheDocument();
  });

  it('should call onClearFilters when Clear All Filters button is clicked', async () => {
    const user = userEvent.setup();
    const activeFilters: LeaveFilters = {
      ...defaultFilters,
      type: 'Sick'
    };

    render(
      <FilterBar
        filters={activeFilters}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
        showEmployeeSearch={true}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear all filters/i });
    await user.click(clearButton);

    expect(mockOnClearFilters).toHaveBeenCalled();
  });

  it('should display date range error when end date is before start date', () => {
    const invalidFilters: LeaveFilters = {
      ...defaultFilters,
      startDate: '2024-01-31',
      endDate: '2024-01-01'
    };

    render(
      <FilterBar
        filters={invalidFilters}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
        showEmployeeSearch={true}
      />
    );

    expect(screen.getByText(/end date cannot be before start date/i)).toBeInTheDocument();
  });

  it('should display active filter count badge', () => {
    const activeFilters: LeaveFilters = {
      searchQuery: 'john',
      type: 'Sick',
      status: 'Pending',
      startDate: '',
      endDate: '',
      groupBy: 'none'
    };

    render(
      <FilterBar
        filters={activeFilters}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
        showEmployeeSearch={true}
      />
    );

    expect(screen.getByLabelText(/3 active filters/i)).toBeInTheDocument();
  });

  it('should display active filter badges', () => {
    const activeFilters: LeaveFilters = {
      searchQuery: 'john',
      type: 'Sick',
      status: 'Pending',
      startDate: '',
      endDate: '',
      groupBy: 'none'
    };

    render(
      <FilterBar
        filters={activeFilters}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
        showEmployeeSearch={true}
      />
    );

    expect(screen.getByText(/search: john/i)).toBeInTheDocument();
    expect(screen.getByText(/type: sick/i)).toBeInTheDocument();
    expect(screen.getByText(/status: pending/i)).toBeInTheDocument();
  });

  it('should clear search input when Escape key is pressed', async () => {
    const user = userEvent.setup();
    
    render(
      <FilterBar
        filters={{ ...defaultFilters, searchQuery: 'john' }}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
        showEmployeeSearch={true}
      />
    );

    const searchInput = screen.getByLabelText(/search employee/i) as HTMLInputElement;
    expect(searchInput.value).toBe('john');

    await user.click(searchInput);
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(searchInput.value).toBe('');
    });
  });

  it('should have proper ARIA labels for accessibility', () => {
    render(
      <FilterBar
        filters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
        showEmployeeSearch={true}
      />
    );

    expect(screen.getByRole('search', { name: /leave request filters/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/search employee by name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/filter by leave type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/filter by status/i)).toBeInTheDocument();
  });
});
