# 🚀 STEP-BY-STEP DEPLOYMENT GUIDE
## For Git-Connected Server + Render

---

## **PHASE 1: BACKEND HTTPS FIX (Server Side)**

### **Step 1: Connect to Your Server**
```bash
# SSH to your API server
ssh username@your-server-ip
# Replace with your actual server credentials
```

### **Step 2: Navigate to Your Backend Directory**
```bash
# Go to your backend directory
cd /path/to/your/backend
# Example: cd /home/api.praashibysupal.com/backend
```

### **Step 3: Pull Latest Backend Code**
```bash
# Pull the latest backend code from GitLab
git pull origin main
```

### **Step 4: Install Certbot (SSL Certificate Tool)**
```bash
# For Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx

# For CentOS/RHEL/AlmaLinux
sudo yum install certbot python3-certbot-nginx
```

### **Step 5: Generate SSL Certificate**
```bash
# Generate SSL certificate for your domain
sudo certbot --nginx -d api.praashibysupal.com -d www.api.praashibysupal.com
```

### **Step 6: Configure Nginx for Node.js App**
```bash
# Edit Nginx configuration
sudo nano /etc/nginx/sites-available/api.praashibysupal.com
```

**Replace the content with this configuration:**
```nginx
server {
    listen 80;
    server_name api.praashibysupal.com www.api.praashibysupal.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.praashibysupal.com www.api.praashibysupal.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.praashibysupal.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.praashibysupal.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Handle CORS preflight requests
    location /api/ {
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
        
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### **Step 7: Enable Site and Test Configuration**
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/api.praashibysupal.com /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# If test passes, restart nginx
sudo systemctl restart nginx

# Check nginx status
sudo systemctl status nginx
```

### **Step 8: Ensure Node.js App is Running**
```bash
# Check if your Node.js app is running on port 5000
sudo netstat -tlnp | grep :5000

# If not running, start it with PM2
pm2 start server.js --name "praashi-api"
pm2 save
pm2 startup
```

### **Step 9: Test HTTPS API**
```bash
# Test the HTTPS API
curl https://api.praashibysupal.com/api/health
```

---

## **PHASE 2: FRONTEND DEPLOYMENT (Render)**

### **Step 1: Go to Render Dashboard**
1. **Open**: https://dashboard.render.com
2. **Login** to your account
3. **Find your frontend service** (should be named `praashibysupal-frontend`)

### **Step 2: Check Auto-Deploy Settings**
1. **Click on your frontend service**
2. **Go to Settings tab**
3. **Scroll to "Auto-Deploy" section**
4. **Make sure it's set to "Yes" for main branch**

### **Step 3: Manual Deploy (if needed)**
1. **Go to your service dashboard**
2. **Click "Manual Deploy" button**
3. **Select "Deploy latest commit"**
4. **Wait for deployment to complete** (2-5 minutes)

### **Step 4: Verify SPA Routing**
1. **Go to Settings tab**
2. **Scroll to "Redirects and Rewrites"**
3. **Make sure you have this rule:**
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Status**: `200`

---

## **PHASE 3: TESTING & VERIFICATION**

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

## **PHASE 4: SETUP AUTO-RENEWAL (Optional but Recommended)**

### **Set up automatic SSL renewal:**
```bash
# Add to crontab
sudo crontab -e

# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet && /usr/bin/systemctl reload nginx
```

---

## **TROUBLESHOOTING**

### **If HTTPS API doesn't work:**
```bash
# Check SSL certificate
sudo certbot certificates

# Check Nginx configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### **If Frontend admin doesn't work:**
1. **Check Render deployment logs**
2. **Verify redirect rules are set**
3. **Check browser console for errors**

### **If CORS errors occur:**
1. **Check Nginx CORS configuration**
2. **Verify API URL in frontend**
3. **Check browser network tab**

---

## **EXPECTED RESULTS**

After completing all steps:
- ✅ `https://api.praashibysupal.com/api/health` works
- ✅ `https://praashibysupal.com/admin/` works
- ✅ All admin routes work properly
- ✅ SSL certificate auto-renews
- ✅ SPA routing works on all pages
- ✅ CORS issues resolved

---

## **QUICK COMMAND SUMMARY**

**Backend (on your server):**
```bash
ssh username@your-server-ip
cd /path/to/backend
git pull origin main
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.praashibysupal.com
sudo nano /etc/nginx/sites-available/api.praashibysupal.com
sudo nginx -t && sudo systemctl restart nginx
curl https://api.praashibysupal.com/api/health
```

**Frontend (Render Dashboard):**
1. Go to https://dashboard.render.com
2. Click on your frontend service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait for deployment to complete

**That's it! Your admin panel should work perfectly! 🎉**

