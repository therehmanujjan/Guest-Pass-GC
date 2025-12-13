# Production Deployment Checklist

## Issue: Blank White Page in Production

### Possible Causes & Solutions

#### 1. **File Path Issues** ✅ FIXED
- **Problem**: Server was looking for `public/index.html` instead of `index.html`
- **Solution**: Updated server.js to serve from root `index.html`

#### 2. **Missing Static Files**
Check if these files exist in production:
```
react.production.min.js
react-dom.production.min.js
babel.min.js
qrcode.min.js
html2canvas.min.js
jsQR.js
```

**Fix**: Upload these files to your production server

#### 3. **JavaScript Errors**
Added error handling and loading indicators:
- Loading spinner shows while app initializes
- Error messages display if libraries fail to load
- Console logs for debugging

#### 4. **CSP (Content Security Policy)** ✅ FIXED
- **Problem**: Restrictive CSP was blocking resources
- **Solution**: Removed overly strict CSP meta tag

---

## Pre-Deployment Checklist

### Files to Upload to Production

**Core Files:**
- [ ] `index.html` (updated with error handling)
- [ ] `server.js` (updated routing)
- [ ] `package.json`
- [ ] `.env` (with production DATABASE_URL and JWT_SECRET)

**JavaScript Libraries:**
- [ ] `react.production.min.js`
- [ ] `react-dom.production.min.js`
- [ ] `babel.min.js`
- [ ] `qrcode.min.js`
- [ ] `html2canvas.min.js`
- [ ] `jsQR.js`

**Config:**
- [ ] `config/database.js`
- [ ] `config/monitoring.js`

**Scripts:**
- [ ] `scripts/migrate-passwords.js`
- [ ] `scripts/create-role-users.js`

### Environment Variables (.env)

```env
# Database
DATABASE_URL=your-production-database-url

# Security
JWT_SECRET=your-strong-random-production-secret-32+-chars
SESSION_SECRET=your-session-secret

# Server
PORT=3000
NODE_ENV=production
```

### Installation Steps

1. **Upload files to production server**
   ```bash
   # Copy all files to server
   scp -r * user@server:/path/to/app/
   ```

2. **Install dependencies**
   ```bash
   npm install --production
   ```

3. **Run database migrations**
   ```bash
   # Create password hashes for users
   node scripts/migrate-passwords.js
   
   # Create role-based users
   node scripts/create-role-users.js
   ```

4. **Start server**
   ```bash
   # Using PM2 (recommended)
   pm2 start server.js --name guest-pass
   pm2 save
   
   # Or using node directly
   node server.js
   ```

---

## Debugging Blank Page Issues

### Step 1: Check Browser Console
Open browser DevTools (F12) and check Console tab for errors:

**Common errors:**
- `React is not defined` → React library not loaded
- `Failed to fetch` → API endpoint issues
- `CORS error` → Cross-origin issues
- Network errors → Check if files are loading

### Step 2: Check Network Tab
Look for failed resource loads:
- All `.js` files should return `200 OK`
- Check if `/api/executives` loads successfully
- Verify static files are served correctly

### Step 3: Check Server Logs
Look for errors in terminal/PM2 logs:
```bash
# PM2 logs
pm2 logs guest-pass

# Or check terminal output
```

### Step 4: Test API Endpoints
```bash
# Test health endpoint
curl http://your-domain/api/health

# Test executives endpoint
curl http://your-domain/api/executives

# Should return JSON with executive list
```

---

## Quick Fix Commands

### Restart Server
```bash
# PM2
pm2 restart guest-pass

# Manual
pkill node
node server.js
```

### Clear Cache
```bash
# Clear browser cache
Ctrl + Shift + Delete

# Or hard reload
Ctrl + Shift + R
```

### Check File Permissions
```bash
# Ensure files are readable
chmod 644 index.html
chmod 644 *.js
chmod 755 server.js
```

---

## Testing Production Locally

Before deploying, test production build locally:

1. **Set NODE_ENV to production**
   ```bash
   export NODE_ENV=production  # Linux/Mac
   set NODE_ENV=production     # Windows
   ```

2. **Start server**
   ```bash
   node server.js
   ```

3. **Test in browser**
   - Open http://localhost:3000
   - Check for any errors
   - Test login with all user types
   - Verify pass generation works

---

## Common Production Issues

### Issue: "Cannot find module"
**Cause**: Missing npm packages
**Fix**: 
```bash
npm install
```

### Issue: "EADDRINUSE: address already in use"
**Cause**: Port 3000 already in use
**Fix**:
```bash
# Find and kill process
lsof -i :3000  # Linux/Mac
netstat -ano | findstr :3000  # Windows

# Or use different port
PORT=3001 node server.js
```

### Issue: Database connection failed
**Cause**: Wrong DATABASE_URL
**Fix**: Check `.env` file has correct connection string

### Issue: 401 Unauthorized on all API calls
**Cause**: JWT authentication issues
**Fix**: 
1. Check JWT_SECRET is set in `.env`
2. Verify token is being sent from frontend
3. Check server logs for auth errors

---

## Rollback Procedure

If issues persist, rollback to previous version:

1. **Stop current server**
   ```bash
   pm2 stop guest-pass
   ```

2. **Restore backup files**
   ```bash
   cp backup/index.html .
   cp backup/server.js .
   ```

3. **Restart**
   ```bash
   pm2 start guest-pass
   ```

---

## Support Contacts

**For deployment issues:**
1. Check this guide first
2. Review server logs
3. Test locally before deploying
4. Contact system administrator

---

## Verification Checklist

After deployment, verify:
- [ ] Homepage loads (not blank)
- [ ] Login screen displays
- [ ] Executive dropdown populates
- [ ] Login works for all user types
- [ ] Guest pass generation works
- [ ] QR codes display correctly
- [ ] No console errors
- [ ] All API endpoints respond

---

**Last Updated**: December 13, 2025
**Status**: Production fixes applied
