# 🚀 RENDER-ONLY DEPLOYMENT GUIDE
## Both Frontend & Backend on Render

---

## **CURRENT SITUATION**
- ✅ **Frontend**: Deployed on Render from GitLab
- ✅ **Backend**: Deployed on Render from GitLab  
- ❌ **Issue**: Backend HTTPS not working (showing AlmaLinux test page)
- ❌ **Issue**: Frontend admin panel not working (404 errors)

---

## **PHASE 1: BACKEND HTTPS FIX (Render Dashboard)**

### **Step 1: Go to Backend Service on Render**
1. **Open**: https://dashboard.render.com
2. **Login** to your account
3. **Find your backend service** (should be named something like `praashibysupal-backend` or `api`)

### **Step 2: Check Backend Service Settings**
1. **Click on your backend service**
2. **Go to Settings tab**
3. **Check these settings:**

**Environment Variables:**
```
NODE_ENV=production
PORT=5000
```

**Build Command:**
```
npm install && npm start
```

**Start Command:**
```
node server.js
```

### **Step 3: Check Custom Domain Settings**
1. **Go to Settings tab**
2. **Scroll to "Custom Domains" section**
3. **Make sure `api.praashibysupal.com` is added**
4. **Check SSL certificate status** (should be "Active")

### **Step 4: If Custom Domain Not Added**
1. **Click "Add Custom Domain"**
2. **Enter**: `api.praashibysupal.com`
3. **Click "Add"**
4. **Wait for SSL certificate to be issued** (5-10 minutes)

### **Step 5: Update DNS Records**
**In your domain registrar (where you bought praashibysupal.com):**
1. **Add CNAME record:**
   - **Name**: `api`
   - **Value**: `your-backend-service.onrender.com`
   - **TTL**: 3600

### **Step 6: Test Backend HTTPS**
```bash
# Test the HTTPS API
curl https://api.praashibysupal.com/api/health
```

---

## **PHASE 2: FRONTEND SPA ROUTING FIX (Render Dashboard)**

### **Step 1: Go to Frontend Service on Render**
1. **In Render dashboard**
2. **Find your frontend service** (should be named `praashibysupal-frontend`)

### **Step 2: Check Frontend Service Settings**
1. **Click on your frontend service**
2. **Go to Settings tab**
3. **Check these settings:**

**Build Command:**
```
cd frontend && npm install && npm run build
```

**Publish Directory:**
```
frontend/build
```

### **Step 3: Add SPA Routing Configuration**
1. **Go to Settings tab**
2. **Scroll to "Redirects and Rewrites" section**
3. **Add redirect rule:**
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Status**: `200`

### **Step 4: Check Custom Domain Settings**
1. **Go to Settings tab**
2. **Scroll to "Custom Domains" section**
3. **Make sure `praashibysupal.com` is added**
4. **Check SSL certificate status** (should be "Active")

### **Step 5: Update Environment Variables**
1. **Go to Settings tab**
2. **Scroll to "Environment Variables" section**
3. **Add/Update:**
   ```
   REACT_APP_API_URL=https://api.praashibysupal.com/api
   GENERATE_SOURCEMAP=false
   ```

### **Step 6: Manual Deploy Frontend**
1. **Go to your frontend service dashboard**
2. **Click "Manual Deploy" button**
3. **Select "Deploy latest commit"**
4. **Wait for deployment to complete** (2-5 minutes)

---

## **PHASE 3: BACKEND ENVIRONMENT VARIABLES (Render)**

### **Step 1: Update Backend Environment Variables**
1. **Go to your backend service**
2. **Go to Settings tab**
3. **Scroll to "Environment Variables" section**
4. **Add/Update these variables:**

```
NODE_ENV=production
PORT=5000
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
JWT_SECRET=your_jwt_secret
```

### **Step 2: Manual Deploy Backend**
1. **Go to your backend service dashboard**
2. **Click "Manual Deploy" button**
3. **Select "Deploy latest commit"**
4. **Wait for deployment to complete** (2-5 minutes)

---

## **PHASE 4: TESTING & VERIFICATION**

### **Test 1: Backend API**
```bash
# Test HTTPS API
curl https://api.praashibysupal.com/api/health

# Expected response:
# {"status":"OK","message":"Praashi by Supal API is running","timestamp":"..."}
```

### **Test 2: Frontend Main Site**
1. **Visit**: https://praashibysupal.com/
2. **Should load**: Main website without errors

### **Test 3: Admin Panel**
1. **Visit**: https://praashibysupal.com/admin/
2. **Should load**: Admin dashboard or login page
3. **Visit**: https://praashibysupal.com/admin/login
4. **Should load**: Admin login page

### **Test 4: Admin Functionality**
1. **Login to admin panel**
2. **Check dashboard loads**
3. **Test navigation between admin pages**
4. **Verify API calls work**

---

## **TROUBLESHOOTING**

### **If Backend HTTPS doesn't work:**
1. **Check custom domain is added in Render**
2. **Verify DNS CNAME record is correct**
3. **Wait for SSL certificate to be issued**
4. **Check backend service logs in Render**

### **If Frontend admin doesn't work:**
1. **Check redirect rules are set**
2. **Verify environment variables**
3. **Check frontend service logs in Render**
4. **Verify build completed successfully**

### **If CORS errors occur:**
1. **Check backend CORS configuration**
2. **Verify API URL in frontend environment variables**
3. **Check browser console for errors**

---

## **RENDER DASHBOARD QUICK ACCESS**

### **Backend Service:**
- **URL**: https://dashboard.render.com
- **Find**: Your backend service (usually named `praashibysupal-backend` or `api`)
- **Settings**: Environment Variables, Custom Domains, Build & Deploy

### **Frontend Service:**
- **URL**: https://dashboard.render.com
- **Find**: Your frontend service (usually named `praashibysupal-frontend`)
- **Settings**: Environment Variables, Custom Domains, Redirects & Rewrites

---

## **EXPECTED RESULTS**

After completing all steps:
- ✅ `https://api.praashibysupal.com/api/health` works
- ✅ `https://praashibysupal.com/admin/` works
- ✅ All admin routes work properly
- ✅ SSL certificates are active
- ✅ SPA routing works on all pages
- ✅ CORS issues resolved

---

## **QUICK CHECKLIST**

### **Backend (Render Dashboard):**
- [ ] Custom domain `api.praashibysupal.com` added
- [ ] SSL certificate active
- [ ] Environment variables set
- [ ] Manual deploy completed
- [ ] API health endpoint working

### **Frontend (Render Dashboard):**
- [ ] Custom domain `praashibysupal.com` added
- [ ] SSL certificate active
- [ ] SPA redirect rule added (`/*` → `/index.html`)
- [ ] Environment variables set (`REACT_APP_API_URL`)
- [ ] Manual deploy completed
- [ ] Admin panel working

**That's it! Your admin panel should work perfectly! 🎉**
