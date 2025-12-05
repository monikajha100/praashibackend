# 🔧 ADMIN LOGIN TROUBLESHOOTING
## User Exists But Login Not Working

---

## **✅ USER CONFIRMED IN DATABASE:**
- **Email**: `admin@praashibysupal.com`
- **Role**: `admin`
- **Active**: `1`
- **Password**: Hashed (exists)

---

## **🧪 STEP 1: TEST LOGIN CREDENTIALS**

### **Try These Login Details:**
1. **Go to**: `https://praashibysupal.com/admin/login`
2. **Login with:**
   - **Email**: `admin@praashibysupal.com`
   - **Password**: `password` (this is the default password for the hash)

### **If that doesn't work, try:**
- **Password**: `admin123`
- **Password**: `admin`
- **Password**: `123456`

---

## **🔧 STEP 2: CHECK BACKEND API**

### **Test API Endpoint:**
```bash
# Test if backend API is working
curl https://api.praashibysupal.com/api/health
```

### **Test Login API Directly:**
```bash
curl -X POST https://api.praashibysupal.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@praashibysupal.com","password":"password"}'
```

---

## **🔧 STEP 3: CHECK BROWSER CONSOLE**

### **Open Browser Developer Tools:**
1. **Go to**: `https://praashibysupal.com/admin/login`
2. **Press F12** to open Developer Tools
3. **Go to Console tab**
4. **Try to login**
5. **Check for any error messages**

### **Check Network Tab:**
1. **Go to Network tab** in Developer Tools
2. **Try to login**
3. **Look for the login request**
4. **Check if it's successful (200) or failed (400/500)**

---

## **🔧 STEP 4: CHECK PASSWORD HASH**

### **The password hash in your database is:**
`$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi`

### **This hash corresponds to:**
- **Password**: `password`

### **If you want to create a new password:**
```sql
-- In HeidiSQL, run this to update password to "admin123"
UPDATE users 
SET password = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' 
WHERE email = 'admin@praashibysupal.com';
```

---

## **🔧 STEP 5: CHECK EMAIL VERIFICATION**

### **Your user has `email_verified_at` as NULL**
**This might be causing the issue if your app requires email verification.**

### **Fix by updating the user:**
```sql
-- In HeidiSQL, run this to verify the email
UPDATE users 
SET email_verified_at = NOW() 
WHERE email = 'admin@praashibysupal.com';
```

---

## **🔧 STEP 6: CHECK BACKEND LOGS**

### **If you have access to your backend server:**
1. **Check backend logs** for authentication errors
2. **Look for any CORS issues**
3. **Check if the login endpoint is being hit**

---

## **🔧 STEP 7: TEST WITH DIFFERENT BROWSER**

### **Try logging in with:**
1. **Incognito/Private browsing**
2. **Different browser**
3. **Clear browser cache and cookies**

---

## **🔧 STEP 8: CHECK FRONTEND API CONFIGURATION**

### **Verify the frontend is pointing to the correct API:**
1. **Check if frontend is using**: `https://api.praashibysupal.com/api`
2. **Check if backend is responding** to login requests

---

## **🧪 QUICK TEST COMMANDS:**

### **Test 1: API Health**
```bash
curl https://api.praashibysupal.com/api/health
```

### **Test 2: Login API**
```bash
curl -X POST https://api.praashibysupal.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@praashibysupal.com","password":"password"}'
```

### **Test 3: Check User in Database**
```sql
SELECT * FROM users WHERE email = 'admin@praashibysupal.com';
```

---

## **🎯 MOST LIKELY ISSUES:**

1. **Wrong password** - Try `password` (not `admin123`)
2. **Email verification required** - Update `email_verified_at`
3. **Backend API not responding** - Check API health
4. **CORS issues** - Check browser console
5. **Frontend not connecting to backend** - Check API URL

---

## **📋 TROUBLESHOOTING CHECKLIST:**

- [ ] Try password: `password`
- [ ] Check browser console for errors
- [ ] Test API health endpoint
- [ ] Update `email_verified_at` to NOW()
- [ ] Check Network tab for failed requests
- [ ] Try incognito browsing
- [ ] Verify frontend API URL

**Start with trying the password `password` and checking the browser console for errors!**

