# Database Configuration Guide

## Overview
This guide helps you configure a stable and secure database connection for the HR Portal application.

## Database Connection Issues - Common Causes

### 1. **"Database engine is not connected" Error**
This error occurs when:
- Database server is down or unreachable
- Connection pool is exhausted
- Network timeout
- Too many simultaneous connections
- Database credentials are incorrect

## MySQL Configuration (Recommended)

### Basic Connection String
```env
DATABASE_URL="mysql://username:password@localhost:3306/hr_portal"
```

### Production Connection String (with pooling)
```env
DATABASE_URL="mysql://username:password@localhost:3306/hr_portal?pool_timeout=30&connection_limit=10&socket_timeout=10"
```

### Connection Parameters Explained

| Parameter | Description | Recommended Value |
|-----------|-------------|-------------------|
| `pool_timeout` | Time to wait for connection from pool (seconds) | `30` |
| `connection_limit` | Max number of connections in pool | `10` (adjust based on load) |
| `socket_timeout` | Socket read/write timeout (seconds) | `10` |

### Advanced Configuration

For high-traffic applications:
```env
DATABASE_URL="mysql://username:password@localhost:3306/hr_portal?pool_timeout=60&connection_limit=20&socket_timeout=15&connect_timeout=10"
```

Additional parameters:
- `connect_timeout`: Connection timeout in seconds (default: 10)
- `sslmode`: SSL connection mode (`require`, `disable`, `prefer`)
- `sslcert`: Path to SSL certificate

## Connection Pool Settings

### Recommended Settings by Environment

#### Development
```env
DATABASE_URL="mysql://root:password@localhost:3306/hr_portal?connection_limit=5&pool_timeout=20"
```

#### Staging
```env
DATABASE_URL="mysql://user:pass@staging-db:3306/hr_portal?connection_limit=10&pool_timeout=30&socket_timeout=10"
```

#### Production
```env
DATABASE_URL="mysql://user:pass@production-db:3306/hr_portal?connection_limit=20&pool_timeout=60&socket_timeout=15&connect_timeout=10"
```

## Features Implemented

### 1. ✅ **Automatic Reconnection**
- If connection is lost, the system automatically tries to reconnect
- Uses exponential backoff (1s, 2s, 4s delays)
- Max 3 retry attempts

### 2. ✅ **Connection Pooling**
- Reuses existing connections instead of creating new ones
- Prevents connection exhaustion
- Configured via `DATABASE_URL` parameters

### 3. ✅ **Error Detection**
Automatically detects and handles:
- `P1001`: Can't reach database server
- `P1002`: Connection timeout
- `P1008`: Operations timed out
- `P1017`: Server closed connection
- Network errors (ECONNREFUSED)

### 4. ✅ **Graceful Shutdown**
- Properly closes connections on application shutdown
- Handles SIGINT and SIGTERM signals
- Prevents orphaned connections

### 5. ✅ **Connection State Tracking**
- Monitors connection status
- Only attempts connection if needed
- Prevents duplicate connection attempts

## Troubleshooting

### Error: "Can't reach database server at `localhost:3306`"

**Solutions:**
1. Verify MySQL is running:
   ```bash
   # Windows
   net start MySQL80

   # Linux/Mac
   sudo systemctl status mysql
   ```

2. Check firewall settings
3. Verify port 3306 is not blocked

### Error: "Authentication failed"

**Solutions:**
1. Verify credentials in `.env` file
2. Check MySQL user permissions:
   ```sql
   GRANT ALL PRIVILEGES ON hr_portal.* TO 'username'@'localhost';
   FLUSH PRIVILEGES;
   ```

### Error: "Too many connections"

**Solutions:**
1. Reduce `connection_limit` in DATABASE_URL
2. Increase MySQL max_connections:
   ```sql
   SET GLOBAL max_connections = 200;
   ```
3. Check for connection leaks in code

### Error: "Connection timeout"

**Solutions:**
1. Increase `pool_timeout` and `socket_timeout`
2. Check network latency
3. Optimize slow queries

## Database Connection Best Practices

### ✅ DO:
- Use connection pooling in production
- Set appropriate timeouts
- Monitor connection count
- Handle errors gracefully
- Close connections on shutdown
- Use environment variables for credentials

### ❌ DON'T:
- Call `prisma.$disconnect()` after each query
- Create multiple Prisma Client instances
- Hardcode database credentials
- Ignore connection errors
- Use unlimited connections
- Skip connection validation

## Monitoring Connection Health

### Check Current Connections
```sql
SHOW PROCESSLIST;
SHOW STATUS WHERE variable_name = 'Threads_connected';
```

### View Max Connections Setting
```sql
SHOW VARIABLES LIKE 'max_connections';
```

## Performance Tuning

### MySQL Server Configuration (`my.cnf` or `my.ini`)

```ini
[mysqld]
# Connection Settings
max_connections = 200
wait_timeout = 28800
interactive_timeout = 28800
connect_timeout = 10

# Buffer Settings (adjust based on RAM)
innodb_buffer_pool_size = 1G
query_cache_size = 64M
```

## Security Recommendations

1. **Use Strong Passwords**
   - Minimum 16 characters
   - Mix of letters, numbers, symbols

2. **Limit User Permissions**
   ```sql
   CREATE USER 'hr_app'@'localhost' IDENTIFIED BY 'strong_password';
   GRANT SELECT, INSERT, UPDATE, DELETE ON hr_portal.* TO 'hr_app'@'localhost';
   ```

3. **Use SSL/TLS** (Production)
   ```env
   DATABASE_URL="mysql://user:pass@host:3306/db?sslmode=require&sslcert=/path/to/cert.pem"
   ```

4. **Never Commit `.env` File**
   - Always in `.gitignore`
   - Use secrets management in production

## Migration from Old Setup

If upgrading from a setup that used `prisma.$disconnect()`:

1. Update `DATABASE_URL` with pooling parameters
2. Deploy updated `prisma.ts` file
3. Restart application
4. Monitor logs for connection issues
5. Adjust `connection_limit` based on load

## Need Help?

If you continue to experience connection issues:

1. Check server logs: `npm run dev` or check production logs
2. Verify DATABASE_URL is correct
3. Test connection manually:
   ```bash
   mysql -u username -p -h localhost hr_portal
   ```
4. Review Prisma Client logs (set `log: ['query', 'error', 'warn']` in development)

## Summary

The updated database configuration provides:
- ✅ Automatic reconnection on connection loss
- ✅ Connection pooling for better performance
- ✅ Retry logic with exponential backoff
- ✅ Graceful error handling
- ✅ Connection lifecycle management
- ✅ No more manual `$disconnect()` calls

This should eliminate the "database engine is not connected" errors! 🚀
