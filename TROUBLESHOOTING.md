# WorkZen HRMS Troubleshooting Guide

## Dashboard "Failed to fetch" Error

### Step 1: Verify Backend Server is Running

1. Open a terminal in the `Backend` directory
2. Run: `npm run dev`
3. You should see:
   ```
   ✅ MongoDB connected successfully
   🚀 WorkZen HRMS API Server running on port 5000
   📝 Environment: development
   🌐 CORS Origin: http://localhost:8080
   ```

### Step 2: Verify Frontend Server is Running

1. Open another terminal in the `Frontend` directory
2. Run: `npm run dev`
3. You should see:
   ```
   VITE v5.4.21  ready in XXXms
   ➜  Local:   http://localhost:8080/
   ```

### Step 3: Check CORS Configuration

The backend CORS origin should match the frontend URL:
- If frontend runs on `http://localhost:8080`, backend `.env` should have `CORS_ORIGIN=http://localhost:8080`
- If frontend runs on `http://localhost:8081`, backend `.env` should have `CORS_ORIGIN=http://localhost:8081`

### Step 4: Test API Endpoints

Open browser developer tools and test these URLs:

1. **Health Check**: http://localhost:5000/health
2. **Login Test**: 
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
   -H "Content-Type: application/json" \
   -d '{"email":"admin@workzen.com","password":"password123"}'
   ```

### Step 5: Check Authentication

1. Login to the application first
2. Check if JWT token is stored in localStorage
3. Verify the token is being sent with API requests

### Step 6: Network Tab Debugging

1. Open browser Developer Tools (F12)
2. Go to Network tab
3. Try to access dashboard
4. Look for failed requests to `/api/dashboard`
5. Check the error details

## Common Solutions

### Solution 1: Restart Both Servers
```bash
# Terminal 1 (Backend)
cd Backend
npm run dev

# Terminal 2 (Frontend)  
cd Frontend
npm run dev
```

### Solution 2: Clear Browser Cache
1. Clear browser cache and localStorage
2. Refresh the page
3. Login again

### Solution 3: Check MongoDB
Ensure MongoDB is running:
```bash
# Check if MongoDB is running
netstat -an | findstr :27017
```

### Solution 4: Update CORS Configuration
In `Backend/.env`, ensure CORS_ORIGIN matches frontend URL:
```env
CORS_ORIGIN=http://localhost:8080
```

### Solution 5: Verify Database Data
Run the seed script to ensure data exists:
```bash
cd Backend
npm run seed
```

## Error Codes and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| Failed to fetch | Backend not running | Start backend server |
| CORS error | CORS misconfiguration | Update CORS_ORIGIN in .env |
| 401 Unauthorized | Not logged in | Login first |
| 404 Not Found | Wrong API endpoint | Check API routes |
| 500 Server Error | Database/Server issue | Check server logs |

## Quick Fix Commands

```bash
# Start both servers simultaneously
npm run dev

# Or start individually:
# Backend
cd Backend && npm run dev

# Frontend (in new terminal)
cd Frontend && npm run dev

# Seed database if empty
cd Backend && npm run seed

# Test API health
curl http://localhost:5000/health
```