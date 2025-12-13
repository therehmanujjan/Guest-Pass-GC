# 🚀 Quick Start Guide - Individual Password Authentication

## Immediate Steps to Deploy

### 1. Verify Installation ✅
All packages have been installed. Verify with:
```bash
npm list bcrypt jsonwebtoken
```

### 2. Set Environment Variables ⚠️ CRITICAL
Edit your `.env` file and set a secure JWT secret:

```env
# REQUIRED: Change this to a strong, random secret in production!
JWT_SECRET=your-very-secure-random-secret-key-at-least-32-characters-long

# Database connection (should already be set)
DATABASE_URL=your-database-url
```

**Generate a secure secret:**
```bash
# PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# Or use: https://www.grc.com/passwords.htm
```

### 3. Test the Server
```bash
# Start server
node server.js

# Server should display:
# 🚀 Grand City Guest Pass System
# Server running on http://localhost:3000
```

### 4. Test Authentication (Optional but Recommended)
Open a second terminal:
```bash
node test-auth-simple.js

# Expected output:
# ✅ All 9 users login successfully
```

### 5. Access the Application
Open browser and navigate to:
```
http://localhost:3000
```

You should see the **NEW login screen** with:
- Email input field
- Password input field
- "Login to Dashboard" button

### 6. Test Login
Try logging in with any executive:
```
Email: khalid@grandcity.pk
Password: ceo123
```

**Expected behavior:**
- ✅ Login successful
- ✅ Dashboard loads
- ✅ Can create guest passes
- ✅ Can view visits

### 7. Verify API Protection
Try accessing API without token:
```bash
# PowerShell
Invoke-WebRequest -Uri http://localhost:3000/api/visits

# Should return: 401 Unauthorized
```

---

## 🎯 What to Check

### ✅ Server Startup
- [ ] Server starts without errors
- [ ] Database connection successful
- [ ] No package errors

### ✅ Login Functionality  
- [ ] Login screen shows email/password fields
- [ ] Correct credentials work for all users
- [ ] Incorrect credentials are rejected
- [ ] Error messages display correctly

### ✅ Security
- [ ] Old universal password no longer works
- [ ] JWT token generated on login
- [ ] Token stored in sessionStorage
- [ ] API requests include Authorization header

### ✅ API Protection
- [ ] All API endpoints require authentication
- [ ] Requests without token get 401
- [ ] Requests with valid token succeed

---

## 🐛 Common Issues & Fixes

### Issue: "Cannot find module 'bcrypt'"
**Fix:**
```bash
npm install bcrypt jsonwebtoken
```

### Issue: "Failed to connect to database"
**Fix:**
Check your `.env` file has correct `DATABASE_URL`

### Issue: Login says "Network error"
**Fix:**
1. Make sure server is running (`node server.js`)
2. Check server terminal for errors
3. Verify you're accessing correct URL

### Issue: "Invalid email or password" (but credentials are correct)
**Fix:**
1. Verify email format: `name@grandcity.pk`
2. Check for extra spaces
3. Ensure case matches exactly
4. Run migration again:
```bash
node scripts/migrate-passwords.js
```

### Issue: Account locked
**Fix:**
Wait 30 minutes, or manually reset in database:
```sql
UPDATE users 
SET failed_login_attempts = 0, account_locked_until = NULL 
WHERE email = 'user@grandcity.pk';
```

---

## 📋 User Credentials Quick Reference

**Login Format:**
```
Email: name@grandcity.pk
Password: see table below
```

| User | Password |
|------|----------|
| khalid@grandcity.pk | ceo123 |
| salman@grandcity.pk | md123 |
| rehan@grandcity.pk | chair123 |
| shahnawaz@grandcity.pk | ops123 |
| aslam@grandcity.pk | cfo123 |
| ali.moeen@grandcity.pk | cons123 |
| ali.nadeem@grandcity.pk | tech123 |
| muhammad@grandcity.pk | mbw123 |
| admin@grandcity.pk | adm123 |

---

## 🚀 Production Deployment

### Before Deploying to Production:

1. **Set Strong JWT Secret**
   ```env
   JWT_SECRET=<strong-random-32+-character-secret>
   ```

2. **Test Locally First**
   - Test all user logins
   - Verify API protection
   - Check error handling

3. **Deploy Files**
   Upload these modified files:
   - `server.js`
   - `index.html`
   - `public/index.html`
   - `package.json`
   - `scripts/migrate-passwords.js`

4. **Install Dependencies on Server**
   ```bash
   npm install
   ```

5. **Run Migration on Production Database**
   ```bash
   node scripts/migrate-passwords.js
   ```

6. **Start Production Server**
   ```bash
   # Using PM2 (recommended)
   pm2 start server.js --name "guest-pass"
   pm2 save
   
   # Or using node
   node server.js
   ```

7. **Test Production Login**
   - Try logging in with each user type
   - Verify tokens work
   - Check API protection

8. **Notify Users**
   - Send `LOGIN_CREDENTIALS.md` to all users
   - Inform them of new login process
   - Provide support contact

---

## 📞 Support

**Admin Account:**
- Email: admin@grandcity.pk
- Password: adm123

**Documentation:**
- Technical: `PASSWORD_MIGRATION.md`
- User Guide: `LOGIN_CREDENTIALS.md`
- Full Summary: `IMPLEMENTATION_SUMMARY.md`

---

## ✅ Deployment Checklist

Pre-Deployment:
- [ ] Install packages locally
- [ ] Set JWT_SECRET in .env
- [ ] Test server startup
- [ ] Test all user logins
- [ ] Verify API protection

Production:
- [ ] Update JWT_SECRET in production .env
- [ ] Deploy modified files
- [ ] Run npm install on server
- [ ] Run password migration script
- [ ] Start server
- [ ] Test login in production
- [ ] Notify all users

Post-Deployment:
- [ ] Monitor server logs
- [ ] Check for login errors
- [ ] Verify users can access system
- [ ] Respond to support requests

---

**Ready to deploy! All implementation complete.**

For questions, see documentation or contact system administrator.
