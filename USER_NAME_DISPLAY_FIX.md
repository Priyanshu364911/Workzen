# User Name Display Fix - "Unknown" Employee Names

## Problem
In the Leave and Attendance tables, the employee names were showing as "Unknown" instead of the actual user names.

## Root Cause
The backend services were using `.populate('userId', 'name email department position')` to populate user data into the `userId` field, but the frontend was expecting the user data to be in a `user` field (via virtual population).

**Mismatch:**
- **Backend**: Populated data into `userId` field
- **Frontend**: Expected data in `user` field (`record.user?.name || 'Unknown'`)

## Solution Applied

### **Backend Changes**

#### 1. **Updated Attendance Service** (`Backend/src/services/attendanceService.ts`)
Changed all populate calls from:
```typescript
.populate('userId', 'name email department position')
```
To:
```typescript
.populate('user', 'name email department position')
```

**Methods Updated:**
- `getAttendance()` - Main method for fetching attendance logs
- `getAttendanceById()` - Single attendance record fetch

#### 2. **Updated Leave Service** (`Backend/src/services/leaveService.ts`)
Changed all populate calls from:
```typescript
.populate('userId', 'name email department position')
.populate('reviewedBy', 'name email')
```
To:
```typescript
.populate('user', 'name email department position')
.populate('reviewer', 'name email')
```

**Methods Updated:**
- `getLeaves()` - Main method for fetching leave applications
- `getLeaveById()` - Single leave record fetch
- `updateLeave()` - Leave update method

### **Why This Works**

Both models already had virtual fields defined:

#### **Attendance Model:**
```typescript
attendanceSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});
```

#### **Leave Model:**
```typescript
leaveSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

leaveSchema.virtual('reviewer', {
  ref: 'User',
  localField: 'reviewedBy',
  foreignField: '_id',
  justOne: true
});
```

Both models also have `toJSON: { virtuals: true }` in their schema options, ensuring virtual fields are included in API responses.

## How It Works Now

### **Data Flow:**
1. **Database**: Stores `userId` as ObjectId reference to User collection
2. **Virtual Field**: Maps `userId` → `user` with populated User data
3. **Populate**: `.populate('user', 'name email department position')` fills the virtual field
4. **JSON Response**: Includes `user` object with name, email, department, position
5. **Frontend**: Accesses `record.user?.name` and displays actual names

### **Response Structure:**
```json
{
  "_id": "...",
  "userId": "64f7b1234567890abcdef123",
  "date": "2024-01-15",
  "status": "Present",
  "user": {
    "name": "John Doe",
    "email": "john@workzen.com",
    "department": "Engineering",
    "position": "Developer"
  }
}
```

## Files Modified

1. **Backend/src/services/attendanceService.ts**
   - Updated `getAttendance()` method
   - Updated `getAttendanceById()` method

2. **Backend/src/services/leaveService.ts**
   - Updated `getLeaves()` method
   - Updated `getLeaveById()` method
   - Updated `updateLeave()` method

## Testing

To verify the fix:

1. **Login as Admin/HR Officer**
2. **Go to Attendance page** - Employee names should show correctly
3. **Go to Leaves page** - Employee names should show correctly
4. **Check both tables** - No more "Unknown" entries

## Benefits

✅ **Fixed Display Issue** - Employee names now show correctly
✅ **Consistent Data Structure** - Frontend and backend expectations aligned
✅ **Proper Virtual Population** - Uses MongoDB virtual fields as intended
✅ **No Frontend Changes** - Fixed entirely on backend
✅ **Maintains Performance** - Still uses efficient populate queries
✅ **Backward Compatible** - Doesn't break existing functionality

The fix ensures that user data is properly populated into the virtual `user` and `reviewer` fields that the frontend expects, resolving the "Unknown" display issue in both attendance and leave tables.