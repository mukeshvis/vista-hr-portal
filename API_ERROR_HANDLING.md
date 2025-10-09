# API Error Handling Guide

## Using `executeWithRetry` for Database Queries

The `executeWithRetry` function automatically handles connection errors and retries failed queries.

## Import

```typescript
import { prisma, executeWithRetry } from '@/lib/database/prisma'
```

## Usage Examples

### 1. Simple Query

**Before:**
```typescript
const data = await prisma.$queryRaw`SELECT * FROM table`
```

**After:**
```typescript
const data = await executeWithRetry(async () => {
  return await prisma.$queryRaw`SELECT * FROM table`
})
```

### 2. Multiple Queries

**Before:**
```typescript
const users = await prisma.user.findMany()
const posts = await prisma.post.findMany()
```

**After:**
```typescript
const users = await executeWithRetry(async () => {
  return await prisma.user.findMany()
})

const posts = await executeWithRetry(async () => {
  return await prisma.post.findMany()
})
```

### 3. Complex Operations

**Before:**
```typescript
const result = await prisma.$executeRaw`
  INSERT INTO employee (name, email) VALUES (${name}, ${email})
`
```

**After:**
```typescript
const result = await executeWithRetry(async () => {
  return await prisma.$executeRaw`
    INSERT INTO employee (name, email) VALUES (${name}, ${email})
  `
})
```

### 4. Transactions

**Before:**
```typescript
const result = await prisma.$transaction([
  prisma.user.create({ data: userData }),
  prisma.profile.create({ data: profileData })
])
```

**After:**
```typescript
const result = await executeWithRetry(async () => {
  return await prisma.$transaction([
    prisma.user.create({ data: userData }),
    prisma.profile.create({ data: profileData })
  ])
})
```

## How It Works

1. **First Attempt**: Executes the query normally
2. **On Connection Error**: Detects connection issues (P1001, P1002, P1008, P1017, etc.)
3. **Reconnect**: Attempts to reconnect to database
4. **Retry**: Retries the query up to 2 times
5. **Success or Fail**: Returns result or throws error

## Connection Errors Handled

- `P1001`: Can't reach database server
- `P1002`: Connection timeout
- `P1003`: Database does not exist
- `P1008`: Operations timed out
- `P1017`: Server has closed the connection
- Network errors (ECONNREFUSED)

## Benefits

✅ **Automatic Recovery**: No manual intervention needed
✅ **Transparent**: Same API as regular Prisma queries
✅ **Retry Logic**: Up to 2 automatic retries
✅ **Connection Pooling**: Maintains connection pool
✅ **Error Detection**: Smart error classification
✅ **Logging**: Clear error messages in console

## When to Use

### ✅ Use `executeWithRetry` for:
- All database read operations
- All database write operations
- Transaction operations
- Critical queries that must succeed

### ❌ Don't wrap with `executeWithRetry`:
- Operations that don't use Prisma
- File system operations
- External API calls (use different retry logic)

## Performance

- **Overhead**: Minimal (~1-2ms)
- **Retry Delay**: 500ms between retries
- **Max Retries**: 2 (configurable)
- **Total Max Time**: ~3 seconds for all retries

## Custom Retry Count

Default is 2 retries, but you can customize:

```typescript
// 5 retries instead of 2
const data = await executeWithRetry(async () => {
  return await prisma.$queryRaw`SELECT * FROM critical_table`
}, 5)
```

## Error Handling

```typescript
try {
  const data = await executeWithRetry(async () => {
    return await prisma.user.findMany()
  })

  return NextResponse.json(data)
} catch (error: any) {
  console.error('Query failed after retries:', error)

  return NextResponse.json(
    { error: 'Database operation failed' },
    { status: 500 }
  )
}
```

## Migration Checklist

To update all your API routes:

- [ ] Import `executeWithRetry` from `@/lib/database/prisma`
- [ ] Wrap all `prisma.$queryRaw` calls
- [ ] Wrap all `prisma.$executeRaw` calls
- [ ] Wrap all `prisma.model.findMany()` calls
- [ ] Wrap all `prisma.model.create()` calls
- [ ] Wrap all `prisma.model.update()` calls
- [ ] Wrap all `prisma.model.delete()` calls
- [ ] Wrap all `prisma.$transaction()` calls
- [ ] Test each route
- [ ] Monitor logs for errors

## Example: Complete API Route

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma, executeWithRetry } from '@/lib/database/prisma'

export async function GET(request: NextRequest) {
  try {
    // Fetch data with automatic retry
    const employees = await executeWithRetry(async () => {
      return await prisma.$queryRaw`
        SELECT * FROM employee WHERE active = 1
      ` as any[]
    })

    return NextResponse.json(employees)
  } catch (error: any) {
    console.error('❌ Error fetching employees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employees', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Insert with automatic retry
    const result = await executeWithRetry(async () => {
      return await prisma.$executeRaw`
        INSERT INTO employee (name, email)
        VALUES (${data.name}, ${data.email})
      `
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error: any) {
    console.error('❌ Error creating employee:', error)
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    )
  }
}
```

## Monitoring

Watch for these log messages:

```
🔄 Attempting to connect to database...
✅ Database connected successfully
🔴 Database connection error, retrying... (2 attempts left)
🔄 Retrying query after reconnection...
```

## Summary

- **Simple**: Wrap queries in `executeWithRetry(async () => ...)`
- **Automatic**: Handles reconnection transparently
- **Resilient**: Up to 2 retries with smart backoff
- **Safe**: Doesn't affect non-connection errors
- **Fast**: Minimal overhead, quick retries

This ensures your API routes are resilient to temporary database connection issues! 🚀
