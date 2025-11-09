import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GroupedLeaveView } from './GroupedLeaveView';
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
    userId: 'user1',
    type: 'Casual',
    from: '2024-02-10',
    to: '2024-02-12',
    totalDays: 3,
    reason: 'Personal',
    status: 'Approved',
    appliedAt: '2024-02-05',
    user: {
      name: 'John Doe',
      email: 'john@example.com',
      department: 'Engineering',
      position: 'Developer'
    }
  },
  {
    _id: '3',
    userId: 'user2',
    type: 'Sick',
    from: '2024-03-05',
    to: '2024-03-09',
    totalDays: 5,
    reason: 'Surgery',
    status: 'Approved',
    appliedAt: '2024-02-20',
    user: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      department: 'HR',
      position: 'Manager'
    }
  }
];

describe('GroupedLeaveView', () => {
  const mockOnLeaveAction = vi.fn();

  it('should render groups when grouping by employee', () => {
    render(
      <GroupedLeaveView
        leaves={mockLeaves}
        groupBy="employee"
        onLeaveAction={mockOnLeaveAction}
        canApprove={true}
        userRole="Admin"
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should render groups when grouping by type', () => {
    render(
      <GroupedLeaveView
        leaves={mockLeaves}
        groupBy="type"
        onLeaveAction={mockOnLeaveAction}
        canApprove={true}
        userRole="Admin"
      />
    );

    expect(screen.getByText('Sick')).toBeInTheDocument();
    expect(screen.getByText('Casual')).toBeInTheDocument();
  });

  it('should render groups when grouping by status', () => {
    render(
      <GroupedLeaveView
        leaves={mockLeaves}
        groupBy="status"
        onLeaveAction={mockOnLeaveAction}
        canApprove={true}
        userRole="Admin"
      />
    );

    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('should display correct count for each group', () => {
    render(
      <GroupedLeaveView
        leaves={mockLeaves}
        groupBy="employee"
        onLeaveAction={mockOnLeaveAction}
        canApprove={true}
        userRole="Admin"
      />
    );

    expect(screen.getByText(/2 requests/i)).toBeInTheDocument();
    expect(screen.getByText(/1 request/i)).toBeInTheDocument();
  });

  it('should toggle group expansion when header is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <GroupedLeaveView
        leaves={mockLeaves}
        groupBy="type"
        onLeaveAction={mockOnLeaveAction}
        canApprove={true}
        userRole="Admin"
      />
    );

    const sickGroupButton = screen.getByRole('button', { name: /collapse sick group/i });
    
    // Initially expanded, should show leave details
    expect(screen.getByText('Flu')).toBeInTheDocument();

    // Click to collapse
    await user.click(sickGroupButton);

    // Leave details should be hidden
    expect(screen.queryByText('Flu')).not.toBeInTheDocument();
  });

  it('should display leave details within groups', () => {
    render(
      <GroupedLeaveView
        leaves={mockLeaves}
        groupBy="employee"
        onLeaveAction={mockOnLeaveAction}
        canApprove={true}
        userRole="Admin"
      />
    );

    expect(screen.getByText('Flu')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('Surgery')).toBeInTheDocument();
  });

  it('should show approve and reject buttons for pending leaves when canApprove is true', () => {
    render(
      <GroupedLeaveView
        leaves={mockLeaves}
        groupBy="status"
        onLeaveAction={mockOnLeaveAction}
        canApprove={true}
        userRole="Admin"
      />
    );

    const approveButtons = screen.getAllByRole('button', { name: /approve/i });
    const rejectButtons = screen.getAllByRole('button', { name: /reject/i });

    expect(approveButtons.length).toBeGreaterThan(0);
    expect(rejectButtons.length).toBeGreaterThan(0);
  });

  it('should not show action buttons when canApprove is false', () => {
    render(
      <GroupedLeaveView
        leaves={mockLeaves}
        groupBy="status"
        onLeaveAction={mockOnLeaveAction}
        canApprove={false}
        userRole="Employee"
      />
    );

    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument();
  });

  it('should call onLeaveAction when approve button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <GroupedLeaveView
        leaves={mockLeaves}
        groupBy="status"
        onLeaveAction={mockOnLeaveAction}
        canApprove={true}
        userRole="Admin"
      />
    );

    const approveButton = screen.getByRole('button', { name: /approve leave request for john doe/i });
    await user.click(approveButton);

    expect(mockOnLeaveAction).toHaveBeenCalledWith('1', 'approve');
  });

  it('should call onLeaveAction when reject button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <GroupedLeaveView
        leaves={mockLeaves}
        groupBy="status"
        onLeaveAction={mockOnLeaveAction}
        canApprove={true}
        userRole="Admin"
      />
    );

    const rejectButton = screen.getByRole('button', { name: /reject leave request for john doe/i });
    await user.click(rejectButton);

    expect(mockOnLeaveAction).toHaveBeenCalledWith('1', 'reject');
  });

  it('should display empty state when no leaves are provided', () => {
    render(
      <GroupedLeaveView
        leaves={[]}
        groupBy="type"
        onLeaveAction={mockOnLeaveAction}
        canApprove={true}
        userRole="Admin"
      />
    );

    expect(screen.getByText(/no leave requests found/i)).toBeInTheDocument();
  });

  it('should hide employee name for Employee role', () => {
    render(
      <GroupedLeaveView
        leaves={mockLeaves}
        groupBy="type"
        onLeaveAction={mockOnLeaveAction}
        canApprove={false}
        userRole="Employee"
      />
    );

    // Employee names should not be displayed in the leave details
    const leaveItems = screen.getAllByRole('listitem');
    leaveItems.forEach(item => {
      const itemText = within(item).queryByText(/john doe|jane smith/i);
      expect(itemText).not.toBeInTheDocument();
    });
  });

  it('should have proper ARIA attributes for accessibility', () => {
    render(
      <GroupedLeaveView
        leaves={mockLeaves}
        groupBy="type"
        onLeaveAction={mockOnLeaveAction}
        canApprove={true}
        userRole="Admin"
      />
    );

    expect(screen.getByRole('region', { name: /grouped leave requests/i })).toBeInTheDocument();
    
    const groupButtons = screen.getAllByRole('button', { expanded: true });
    expect(groupButtons.length).toBeGreaterThan(0);
  });
});
