import { useState, useMemo, memo } from 'react';
import { LeaveApplication } from '@/services/leaveService';
import { LeaveGroup } from '@/types/leaveFilters';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Users, FileText, CheckCircle } from 'lucide-react';

export interface GroupedLeaveViewProps {
  leaves: LeaveApplication[];
  groupBy: 'employee' | 'type' | 'status';
  onLeaveAction: (leaveId: string, action: 'approve' | 'reject') => void;
  canApprove: boolean;
  userRole: string;
}

/**
 * GroupedLeaveView Component
 * Displays leave requests organized by the selected grouping criteria
 * Supports collapsible group sections with headers showing label and count
 */
const GroupedLeaveViewComponent = ({
  leaves,
  groupBy,
  onLeaveAction,
  canApprove,
  userRole
}: GroupedLeaveViewProps) => {
  // Track expanded state for each group
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Memoize grouped leaves calculation to avoid recalculating on every render
  const groupedLeaves: LeaveGroup[] = useMemo(() => {
    return groupLeavesByKey(leaves, groupBy);
  }, [leaves, groupBy]);

  // Initialize all groups as expanded on first render
  if (expandedGroups.size === 0 && groupedLeaves.length > 0) {
    setExpandedGroups(new Set(groupedLeaves.map(g => g.key)));
  }

  /**
   * Toggle expand/collapse state for a group
   */
  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  /**
   * Get icon based on grouping type
   */
  const getGroupIcon = () => {
    switch (groupBy) {
      case 'employee':
        return <Users className="h-5 w-5" />;
      case 'type':
        return <FileText className="h-5 w-5" />;
      case 'status':
        return <CheckCircle className="h-5 w-5" />;
    }
  };

  if (groupedLeaves.length === 0) {
    return (
      <div 
        className="bg-card rounded-lg shadow-sm border border-border p-8 text-center"
        role="status"
        aria-live="polite"
      >
        <p className="text-muted-foreground text-lg">No leave requests found</p>
        <p className="text-sm text-muted-foreground mt-2">
          Try adjusting your filters to see more results
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" role="region" aria-label="Grouped leave requests">
      {groupedLeaves.map((group) => {
        const isExpanded = expandedGroups.has(group.key);

        return (
          <div
            key={group.key}
            className="bg-card rounded-lg shadow-sm border border-border overflow-hidden"
          >
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(group.key)}
              className="w-full px-6 py-4 flex items-center justify-between bg-muted/50 hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset"
              aria-expanded={isExpanded}
              aria-controls={`group-content-${group.key}`}
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${group.label} group with ${group.count} ${group.count === 1 ? 'request' : 'requests'}`}
              type="button"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                )}
                <span aria-hidden="true">{getGroupIcon()}</span>
                <h3 className="text-lg font-semibold text-foreground">
                  {group.label}
                </h3>
                <span className="px-2 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full" aria-hidden="true">
                  {group.count} {group.count === 1 ? 'request' : 'requests'}
                </span>
              </div>
            </button>

            {/* Group Content */}
            {isExpanded && (
              <div
                id={`group-content-${group.key}`}
                className="divide-y divide-border"
                role="list"
                aria-label={`${group.label} leave requests`}
              >
                {group.leaves.map((leave) => (
                  <LeaveRequestRow
                    key={leave._id}
                    leave={leave}
                    onLeaveAction={onLeaveAction}
                    canApprove={canApprove}
                    userRole={userRole}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * LeaveRequestRow Component
 * Renders a single leave request within a group
 * Memoized to prevent unnecessary re-renders
 */
interface LeaveRequestRowProps {
  leave: LeaveApplication;
  onLeaveAction: (leaveId: string, action: 'approve' | 'reject') => void;
  canApprove: boolean;
  userRole: string;
}

const LeaveRequestRowComponent = ({
  leave,
  onLeaveAction,
  canApprove,
  userRole
}: LeaveRequestRowProps) => {
  return (
    <div className="px-6 py-4 hover:bg-accent/50 transition-colors" role="listitem">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          {/* Employee Name - Only show for non-employee roles */}
          {userRole !== 'Employee' && leave.user?.name && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {leave.user.name}
              </span>
              {leave.user.department && (
                <span className="text-xs text-muted-foreground">
                  • {leave.user.department}
                </span>
              )}
            </div>
          )}

          {/* Leave Details */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{leave.type}</span>
            </div>
            <div className="text-muted-foreground">
              {new Date(leave.from).toLocaleDateString('en-IN')} -{' '}
              {new Date(leave.to).toLocaleDateString('en-IN')}
            </div>
            <div className="text-muted-foreground">
              {leave.totalDays} {leave.totalDays === 1 ? 'day' : 'days'}
            </div>
            <div>
              <span
                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  leave.status === 'Approved'
                    ? 'bg-primary/20 text-primary'
                    : leave.status === 'Rejected'
                    ? 'bg-destructive/20 text-destructive'
                    : 'bg-secondary/20 text-secondary'
                }`}
              >
                {leave.status}
              </span>
            </div>
          </div>

          {/* Reason */}
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Reason:</span> {leave.reason}
          </div>

          {/* Review Comments */}
          {leave.reviewComments && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Review Comments:</span>{' '}
              {leave.reviewComments}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {canApprove && leave.status === 'Pending' && (
          <div className="flex gap-2 flex-shrink-0" role="group" aria-label="Leave request actions">
            <Button
              size="sm"
              onClick={() => onLeaveAction(leave._id, 'approve')}
              aria-label={`Approve leave request for ${leave.user?.name || 'employee'}`}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onLeaveAction(leave._id, 'reject')}
              aria-label={`Reject leave request for ${leave.user?.name || 'employee'}`}
            >
              Reject
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Memoize LeaveRequestRow to prevent unnecessary re-renders
const LeaveRequestRow = memo(LeaveRequestRowComponent);

/**
 * Helper function to group leaves by the specified criteria
 */
function groupLeavesByKey(
  leaves: LeaveApplication[],
  groupBy: 'employee' | 'type' | 'status'
): LeaveGroup[] {
  const groups = new Map<string, LeaveApplication[]>();

  leaves.forEach((leave) => {
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
    label: groupBy === 'employee' ? leaves[0].user?.name || key : key,
    count: leaves.length,
    leaves,
    isExpanded: true
  }));
}

// Memoized version to prevent unnecessary re-renders
export const GroupedLeaveView = memo(GroupedLeaveViewComponent);

export default GroupedLeaveView;
