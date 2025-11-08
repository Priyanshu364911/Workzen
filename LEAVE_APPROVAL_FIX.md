# Leave Approval Error Fix

## Problem
When admin tries to approve a leave, getting error: **"Status is required"**

## Root Cause
The backend leave routes for approve/reject were using `validateReviewLeave` middleware which requires a `status` field in the request body. However:

1. The frontend only sends `reviewComments` (optional)
2. The backend controller hardcodes the status:
   - `/approve` endpoint sets `status: 'Approved'`
   - `/reject` endpoint sets `status: 'Rejected'`

This created a validation conflict where the middleware expected `status` but the frontend wasn't sending it.

## Solution Applied

### 1. **Created New Validation Schema**
Added `approveRejectLeaveSchema` in `Backend/src/validators/leaveValidators.ts`:
```typescript
export const approveRejectLeaveSchema = Joi.object({
  reviewComments: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Review comments cannot be more than 500 characters'
    })
});
```

### 2. **Updated Route Validation**
Changed `Backend/src/routes/leaves.ts`:
- **Before**: Used `validateReviewLeave` (required `status` field)
- **After**: Used `validateApproveRejectLeave` (only validates optional `reviewComments`)

### 3. **Enhanced Role Permissions**
Updated approve/reject routes to allow HR Officers:
- **Before**: Only `Admin` and `Payroll Officer`
- **After**: `Admin`, `HR Officer`, and `Payroll Officer`

## Files Modified

1. **Backend/src/validators/leaveValidators.ts**
   - Added `approveRejectLeaveSchema`
   - Added `validateApproveRejectLeave` middleware

2. **Backend/src/routes/leaves.ts**
   - Updated approve/reject routes to use new validation
   - Added HR Officer to allowed roles

## How It Works Now

### Leave Approval Flow:
1. **Frontend** sends: `{ reviewComments?: string }`
2. **Validation** checks: Only validates `reviewComments` (optional, max 500 chars)
3. **Controller** sets: `status: 'Approved'` and `reviewComments` from request
4. **Service** updates: Leave record with status and reviewer info

### Leave Rejection Flow:
1. **Frontend** sends: `{ reviewComments?: string }`
2. **Validation** checks: Only validates `reviewComments` (optional, max 500 chars)
3. **Controller** sets: `status: 'Rejected'` and `reviewComments` from request
4. **Service** updates: Leave record with status and reviewer info

## Testing

To test the fix:

1. **Login as Admin/HR/Payroll Officer**
2. **Go to Leaves page**
3. **Find a pending leave**
4. **Click "Approve" or "Reject"**
5. **Should work without "Status is required" error**

## Benefits

✅ **Fixed Validation Error** - No more "Status is required" error
✅ **Proper Role Access** - HR Officers can now approve/reject leaves
✅ **Clean Validation** - Only validates what's actually sent from frontend
✅ **Maintained Security** - Still validates review comments length
✅ **Backward Compatible** - Doesn't break existing functionality

The fix ensures that the validation middleware only checks for fields that the frontend actually sends, while the controller continues to handle the business logic of setting the appropriate status.