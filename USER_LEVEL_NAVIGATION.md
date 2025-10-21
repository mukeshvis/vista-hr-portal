# User-Level Based Navigation System

## Overview
This HR Portal implements role-based access control using `user_level` to differentiate between Admin (level 1) and Employee (level 0) users.

## Architecture

### Authentication Flow
1. User logs in with username/password
2. `validateUserCredentials()` in `src/lib/database/queries/user.ts` validates credentials
3. Session is created with user data including `user_level`, `emp_id`, and other attributes
4. Session data is available throughout the app via `useSession()` hook

### User Levels
- **`user_level = 0`**: Regular Employee (limited access)
- **`user_level = 1`**: Admin/HR (full access)

## Implementation Details

### 1. Navigation Components

#### Sidebar (`src/components/sidebar.tsx`)
**Lines 44-54**: Filters navigation items based on `adminOnly` flag with personalized labels
- Admin users see all menu items with standard labels
- Employees only see items marked with `adminOnly: false` with personalized labels

```typescript
const isAdmin = session?.user?.user_level === 1 || session?.user?.user_level === '1'

// Get navigation items with personalized labels
const navigation = getNavigation(isAdmin)

const filteredNavigation = navigation.filter(item => {
  if (item.adminOnly && !isAdmin) {
    return false
  }
  return true
})
```

**Menu Items Configuration:**
| Menu Item | Admin Label | Employee Label | Admin Access | Employee Access |
|-----------|-------------|----------------|--------------|-----------------|
| Dashboard | Dashboard | Dashboard | ✅ | ✅ |
| Employees | Employees | N/A | ✅ | ❌ |
| Attendance | Attendance | **My Attendance** | ✅ | ✅ |
| Working Hours | Working Hours | N/A | ✅ | ❌ |
| Payroll | Payroll | N/A | ✅ | ❌ |
| Leaves | Leaves | **My Leaves** | ✅ | ✅ |
| Reports | Reports | N/A | ✅ | ❌ |
| Settings | Settings | N/A | ✅ | ❌ |

**Personalization Pattern:**
- Items accessible to both roles show personalized labels for employees
- "Attendance" → "My Attendance" for employees
- "Leaves" → "My Leaves" for employees
- This creates a more personalized, user-friendly experience

#### Top Navigation (`src/components/top-navigation.tsx`)
**Lines 49-58**: Same personalization logic as sidebar - uses `getMenuItems(isAdmin)` function

### 2. Page-Level Access Control

#### Dashboard (`src/app/dashboard/page.tsx`)

**Admin Dashboard (Lines 795-1101):**
- Company-wide metrics (total employees, departments, etc.)
- Attendance overview for all employees
- Pending leave approvals
- Quick actions for HR tasks
- Recent activities across the organization

**Employee Dashboard (Lines 620-792):**
- Personal metrics only (own attendance, leave balance)
- Quick actions (Apply Leave, View Attendance, Request Remote Work)
- Own recent leave applications
- Own attendance summary

**Implementation:**
```typescript
const isAdmin = session?.user?.user_level === 1 || session?.user?.user_level === '1'

if (!isAdmin) {
  // Render Employee Dashboard
  return <EmployeeDashboardUI />
}

// Render Admin Dashboard
return <AdminDashboardUI />
```

#### Attendance Page (`src/app/attendance/page.tsx`)

**Personalized Headers:**
- **Admin View**: Shows "Attendance Management" and "Daily Attendance"
- **Employee View**: Shows "My Attendance" and "My Daily Attendance" (Lines 538, 597)

**Admin-Only Actions:**
1. **"Manage Holidays" Button (Lines 577-586)**
   - Hidden for employees (user_level = 0)
   - Only admins can access holiday management

2. **Search Bar (Lines 604-614)**
   - Hidden for employees (they only see their own record)
   - Visible for admins to search all employees

**Data Filtering (Lines 411-424):**
- Admins see all employee attendance records
- Employees only see their own attendance

**Key Implementation Points:**
1. **User Identification**: Uses `session.user.emp_id` to identify current user
2. **Pin Auto Mapping**: Fetches user's `pin_auto` from biometric system with multiple matching strategies (Lines 367-441)
3. **Record Filtering**: Compares `record.pinAuto` with user's identifier
4. **Helpful Error Messages**: If employee can't see attendance, shows clear error message (Lines 719-729)

**Matching Strategies (for employee identification):**
The system tries 4 different strategies to match user with biometric data:
1. Direct match: `emp_id` === `pin_auto`
2. Manual match: `emp_id` === `pin_manual`
3. Username match: `username` === `user_name` (case insensitive)
4. Name match: `name` === `user_name` (case insensitive)

**Important Note:**
If employee cannot be matched, detailed console logs help debug the issue. Check browser console for matching details.

#### Leaves Page (`src/app/leaves/page.tsx`)

**Personalized Headers:**
- **Admin View**: Shows "Leave Management"
- **Employee View**: Shows "My Leaves" (Line 1699)

**Tab Defaults (Line 104):**
- Employees start at "my-applications" tab
- Admins start at "employees-leave-balance" tab

```typescript
const [activeTab, setActiveTab] = useState(
  isAdmin ? 'employees-leave-balance' : 'my-applications'
)
```

**Admin-Only Actions:**

1. **"Add Leave" Button (Lines 1711-1719)**
   - Hidden for employees (user_level = 0)
   - Only admins can manually add leaves for employees
   - Employees can only use "Apply for Leave" button

2. **"Add Remote" Button (Lines 2558-2568)**
   - Hidden for employees (user_level = 0)
   - Only admins can manually add remote work for employees
   - Employees can only use "Apply for Remote Work" button

**Data Access:**
- Employees see their own leave applications and balances
- Admins see all employees' leave data and can approve/reject requests
- Employees can apply for their own leaves but cannot add leaves for others
- Admins can add/manage leaves for any employee

### 3. Session Configuration

**NextAuth Configuration (`src/lib/auth/auth.config.ts`):**

**JWT Callback (Lines 67-76):**
Stores user data in JWT token:
```typescript
async jwt({ token, user, account }) {
  if (user && account?.provider === "credentials") {
    token.role = user.role
    token.acc_type = user.acc_type
    token.company_id = user.company_id
    token.emp_id = user.emp_id
    token.username = user.username
    token.user_level = user.user_level
  }
  return token
}
```

**Session Callback (Lines 78-92):**
Makes user data available in session:
```typescript
async session({ session, token }) {
  if (token && session.user) {
    session.user.id = token.sub!
    session.user.role = token.role as string
    session.user.acc_type = token.acc_type as string
    session.user.company_id = token.company_id as string
    session.user.emp_id = token.emp_id as string
    session.user.username = token.username as string
    session.user.user_level = typeof token.user_level === 'number'
      ? token.user_level
      : (token.user_level ? Number(token.user_level) : 1)
  }
  return session
}
```

**Type Definitions (`src/types/next-auth.d.ts`):**
Extends NextAuth types to include custom fields like `user_level`, `emp_id`, etc.

## Database Schema

### Users Table
```prisma
model users {
  id              Int      @id @default(autoincrement())
  emp_id          String?  @db.VarChar(50)      // Links to employee
  user_level      Int      @default(0)          // 0=Employee, 1=Admin
  username        String   @db.VarChar(255)
  email           String   @db.VarChar(60)
  password        String   @db.VarChar(60)
  // ... other fields
}
```

### Employee Table
```prisma
model employee {
  id                Int       @id @default(autoincrement())
  emp_id            String    @db.VarChar(50)   // Employee identifier
  emp_name          String    @db.VarChar(100)
  // ... other fields
}
```

### External Employees Table
```prisma
model external_employees {
  id           Int      @id @default(autoincrement())
  pin_auto     String   @unique @db.VarChar(50)  // Biometric device ID
  user_name    String   @db.VarChar(255)
  // ... other fields
}
```

## Testing User Levels

### To Test as Admin:
1. Ensure your user in the database has `user_level = 1`
2. Log in and verify you see all navigation items
3. Check that you can access admin-only pages (Employees, Payroll, Reports, etc.)

### To Test as Employee:
1. Ensure test user has `user_level = 0`
2. Log in and verify limited navigation (only Dashboard, Attendance, Leaves)
3. Check that:
   - Dashboard shows personal metrics only
   - Attendance shows only your own records
   - Leaves shows your own applications

## Debugging

### Common Issues

**Issue: Employee can't see their attendance**
- **Cause**: `users.emp_id` doesn't match `external_employees.pin_auto`
- **Solution**: Check console warnings. Ensure emp_id matches the biometric system's pin_auto
- **Check**: Open browser console and look for warning message

**Issue: User sees wrong dashboard**
- **Cause**: `user_level` not set correctly in database
- **Solution**: Check `users.user_level` in database (should be 0 or 1)
- **Check**: Console logs show current user level: `console.log('User Level:', session?.user?.user_level)`

**Issue: Navigation items not filtering**
- **Cause**: Session not loaded or user_level is undefined
- **Solution**: Check session loading state, ensure auth is working
- **Check**: Look for session logs in browser console

### Console Debugging

The app includes helpful console logs:
- `🔐 Session user_level: X` - Shows current user level
- `📊 Dashboard - User Level: X | Is Admin: true/false` - Dashboard role detection
- `👤 Leaves Page - User Level: X | Is Admin: true/false` - Leaves page role detection
- `👤 Found user pin_auto: XXXX` - Attendance user identification
- `⚠️ Could not find matching pin_auto` - Attendance mapping issue

## Security Considerations

1. **Server-Side Validation**: While UI filters based on user_level, ensure API endpoints also validate user permissions
2. **Session Security**: User level is stored in JWT token, ensure `NEXTAUTH_SECRET` is properly configured
3. **Data Isolation**: Employees should never receive data for other employees, even if UI is bypassed

## Future Enhancements

Consider implementing:
1. Additional user roles (Manager, Department Head, etc.)
2. Permission-based access control (granular permissions)
3. Department-level access (users can only see their department)
4. Dynamic menu configuration (admin can configure who sees what)
5. Audit logging for sensitive actions

## Support

If you encounter issues with user-level navigation:
1. Check browser console for debug logs
2. Verify database `user_level` values
3. Ensure session is properly configured
4. Check that emp_id mapping is correct for attendance
