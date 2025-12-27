# Attendance System Documentation

This document provides comprehensive guidance for Claude Code when working with the attendance system in this HR Portal.

## Overview

The attendance system integrates with an external biometric system (att.vis.com.pk) for employee time tracking, with local database fallback support. It handles clock in/out, late arrival tracking, work-from-home status, and holiday management.

---

## Database Schema

### Primary Tables

#### `user_attendance` (Modern synced attendance)
```prisma
model user_attendance {
  id          Int      @id @default(autoincrement())
  user_id     String   @db.VarChar(50)
  state       String   @db.VarChar(20)    // 'Check In' or 'Check Out'
  punch_time  DateTime
  verify_mode String   @db.VarChar(20)    // 'FACE' (biometric) or 'FORM' (manual)
  source      String   @db.VarChar(50)    // 'external_api' or 'manual'
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
}
```

#### `attendance` (Legacy internal tracking)
```prisma
model attendance {
  id                Int      @id @default(autoincrement())
  emp_id            String   @db.VarChar(50)
  attendance_date   DateTime @db.Date
  day, month, year  Int
  clock_in          String   @db.VarChar(20)
  clock_out         String   @db.VarChar(20)
  work_remotely     Int      @default(0)
  neglect_attendance Int     @default(0)
  neglect_early     Int      @default(0)
  late              String   @db.VarChar(5)   // 'yes' or 'no'
  absent            String   @db.VarChar(5)   // 'yes' or 'no'
  status            Int      @default(1)
  remarks           String?  @db.Text
  username          String   @db.VarChar(50)
  date, time        String
}
```

#### `external_employees` (Biometric system sync)
```prisma
model external_employees {
  id         Int      @id @default(autoincrement())
  pin_manual String?  @db.VarChar(50)
  pin_auto   String   @unique @db.VarChar(50)  // Employee ID in biometric system
  user_name  String   @db.VarChar(100)
  password   String?  @db.VarChar(100)
  privilege  Int      @default(0)
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
}
```

#### `holidays`
```prisma
model holidays {
  id           Int      @id @default(autoincrement())
  date         DateTime @db.Date
  name         String   @db.VarChar(100)
  type         String   @db.VarChar(50)    // 'national' or 'company'
  description  String?  @db.Text
  is_recurring Int      @default(0)
  status       Int      @default(1)        // 1=active, 0=deleted
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt
}
```

### Supporting Tables
- `working_hours_policy` - Defines work hours, grace time, half-day cutoff
- `remote_application` - Remote work requests with approval workflow

---

## API Endpoints

### Sync Operations

#### `POST /api/attendance/sync`
Syncs attendance from external biometric system to local database.

**Request:**
```json
{
  "start_date": "01/12/2025",  // DD/MM/YYYY format
  "end_date": "31/12/2025"
}
```

**Response:**
```json
{
  "success": true,
  "synced": 150,
  "skipped": 10,
  "total": 160
}
```

**Notes:**
- Prevents duplicate entries by checking existing records
- Saves to `user_attendance` table
- Uses SSL bypass for external API (security consideration)

---

### Log Retrieval

#### `POST /api/attendance/logs`
Retrieves attendance logs for a date range.

**Request:**
```json
{
  "start_date": "01/12/2025",
  "end_date": "31/12/2025"
}
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "stats": {
    "face_count": 120,
    "form_count": 30
  },
  "source": "external_api"  // or "database"
}
```

**Fallback Logic:**
1. Primary: External API (att.vis.com.pk/APILogs?ID=1)
2. Fallback: Local `attendance` table

---

#### `GET /api/attendance/logs`
Retrieves employee-specific attendance by month/year.

**Query Parameters:**
- `empId` - Employee ID
- `month` - Month (1-12)
- `year` - Year (e.g., 2025)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-12-01",
      "check_in": "09:00:00",
      "check_out": "18:00:00",
      "work_remotely": false
    }
  ]
}
```

---

### Weekly Summary

#### `POST /api/attendance/weekly`
Calculates weekly hours breakdown.

**Request:**
```json
{
  "employeeId": "123",
  "year": 2025,
  "month": 12
}
```

**Response:**
```json
{
  "success": true,
  "weeks": [
    {
      "weekNumber": 1,
      "days": {
        "monday": { "hours": 8.5, "status": "present", "timeIn": "09:00", "timeOut": "17:30" },
        "tuesday": { "hours": 0, "status": "holiday" },
        ...
      },
      "totalHours": 42.5
    }
  ]
}
```

**Status Values:**
- `present` - Has check-in/check-out records
- `late` - Check-in after 9:00 AM
- `holiday` - On holiday date
- `absent` - No records on working day
- `future` - Date hasn't occurred yet

---

### Employee List

#### `GET /api/attendance/employees`
Fetches employee list from biometric system.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "user_id": "123",
      "emp_code": "EMP001",
      "name": "John Doe",
      "dept": "Engineering",
      "designation": "Developer"
    }
  ]
}
```

---

## File Structure

```
src/
├── app/
│   ├── api/attendance/
│   │   ├── sync/route.ts           # External API sync
│   │   ├── logs/route.ts           # Attendance log retrieval
│   │   ├── weekly/route.ts         # Weekly hours calculation
│   │   └── employees/route.ts      # Employee list
│   └── attendance/
│       ├── page.tsx                # Main attendance page (admin + employee views)
│       ├── employee/[id]/page.tsx  # Individual employee detail
│       └── holidays/page.tsx       # Holiday management (admin only)
├── lib/
│   └── services/
│       └── attendance-sync.service.ts  # Background sync service
└── startup/
    └── init-services.ts            # Service initialization (currently disabled)
```

---

## Business Logic

### Late Arrival Detection
- **Threshold:** 9:00 AM
- Check-in after 9:00 AM = marked as "Late"
- Stored in `late` field ('yes'/'no')

### Total Time & Timing Status Calculation

**Total Time** is calculated ONLY within the office hours window (not actual arrival/departure):

| Employee Type | Office Window | Required Hours |
|--------------|---------------|----------------|
| Regular (8-hour) | 9:00 AM - 5:30 PM | 8 hours |
| 9-Hour | 9:00 AM - 6:00 PM | 9 hours |
| 10-Hour | 8:00 AM - 6:00 PM | 10 hours |

**How it works:**
- If employee came at 8:30 AM → Count starts from 9:00 AM (for 8-hour employees)
- If employee left at 6:00 PM → Count ends at 5:30 PM (for 8-hour employees)
- Total Time shows only hours within the office window

**Timing Status Values:**
- **Punctual** (Emerald/Green badge): Completed required hours within office window
- **Late** (Amber badge): Did not complete required hours within office window

**Example:**
- Employee: Came 8:30 AM, Left 6:00 PM
- Office Window: 9:00 AM - 5:30 PM
- Total Time: 8h 30m (not 9h 30m)
- Status: Punctual (8h 30m >= 8 hours)

### Verification Modes
| Mode | Description |
|------|-------------|
| `FACE` | Biometric machine check-in |
| `FORM` | Manual HR entry / Work from home |

### Employee Hour Requirements

| Employee Type | Daily Hours | Weekly Hours | Employee IDs |
|--------------|-------------|--------------|--------------|
| Regular | 8 hours | 40 hours | All others |
| 9-Hour | 9 hours (weekdays), 6 hours (weekends) | 57 hours | '16', '3819' |
| 10-Hour | 10 hours | 50 hours | '13', '14', '45', '1691479623873', '1691479623595' |

### UI Color Coding (Hours Worked)
- **Green:** Met or exceeded requirement
- **Yellow:** 7-7.9 hours (regular employees)
- **Red:** Below threshold

---

## External API Integration

### Biometric System: `att.vis.com.pk`

#### Endpoints

**1. APILogs - Attendance Records**
```
POST https://att.vis.com.pk/APILogs?ID=1
Content-Type: application/json

{
  "start_date": "DD/MM/YYYY",
  "end_date": "DD/MM/YYYY"
}

Response: Array of { user_id, state, punch_time, verify_mode }
```

**2. APIUsers - Employee List**
```
GET https://att.vis.com.pk/APIUsers?ID=1

Response: Array of { pin_auto, pin_manual, user_name, password, privilege }
```

#### Error Handling
- Timeout: 10-15 seconds
- Fallback to local database on failure
- Detects Java SQL errors in response
- Returns empty dataset if both sources fail

---

## Background Sync Service

### Configuration
- **Schedule:** Hourly (cron: `0 * * * *`)
- **Active Days:** Monday-Friday only
- **Active Hours:** 9 AM - 6 PM only
- **Current Status:** DISABLED (commented out in `init-services.ts`)

### Service Methods
```typescript
AttendanceSyncService.getInstance()
  .start()      // Start cron job
  .stop()       // Stop cron job
  .getStatus()  // Check status, weekday, working hours
```

### Enabling Auto-Sync
Uncomment in `src/lib/startup/init-services.ts`:
```typescript
import { AttendanceSyncService } from '../services/attendance-sync.service';
AttendanceSyncService.getInstance().start();
```

---

## UI Pages

### `/attendance` - Main Attendance Page
- **Admin View:** All employees for selected date
- **Employee View:** Personal attendance only (`?view=personal`)
- Features: Date selector, employee search, refresh, statistics

### `/attendance/employee/[id]` - Employee Detail
- Monthly calendar with color-coded attendance
- Weekly summary table with hours breakdown
- Statistics cards (working days, present %, total hours, absents)

### `/attendance/holidays` - Holiday Management (Admin Only)
- Add/edit/delete holidays
- Search/filter functionality
- Holiday types: national (blue badge), company (gray badge)

---

## Employee ID Matching Logic

The system matches employees between biometric and HR database using:
1. `emp_id` === `pin_auto` (direct match)
2. `emp_id` === `pin_manual`
3. `username` === `user_name` (case-insensitive)
4. `name` === `user_name` (case-insensitive)

---

## Data Flow

```
External Biometric System (att.vis.com.pk)
            ↓
    POST /api/attendance/sync
            ↓
    user_attendance table
            ↓
    GET /api/attendance/logs
            ↓
    UI Components (with holiday filtering)
            ↓
    Rendered with status calculations
```

---

## Key Considerations for Development

1. **SSL Bypass:** External API uses `NODE_TLS_REJECT_UNAUTHORIZED = "0"` - security concern
2. **Deduplication:** Always check for existing records before inserting
3. **Timezone Handling:** Parse dates carefully to avoid timezone issues
4. **Fallback Pattern:** Always implement local database fallback for external API calls
5. **Holiday Integration:** Exclude holidays from working days calculations
6. **Audit Trail:** Include `username`, `date`, `time` fields for record tracking
7. **Soft Deletes:** Use `status = 0` instead of hard deletes for holidays
