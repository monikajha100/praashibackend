# LiteSpeed Production Deployment Checklist for Praashi by Supal API

## ✅ **Pre-Deployment Requirements**

### Server Requirements
- [ ] Ubuntu/Debian VPS with root access
- [ ] Minimum 2GB RAM, 2 CPU cores
- [ ] 20GB+ storage space
- [ ] Domain `api.praashibysupal.com` pointing to server IP

### Software Requirements
- [ ] LiteSpeed Web Server installed
- [ ] Node.js 18.x installed
- [ ] MySQL 8.0+ installed
- [ ] PM2 process manager installed

## 🚀 **Deployment Steps**

### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install curl wget git unzip -y

# Run the setup script
chmod +x litespeed-production-setup.sh
sudo ./litespeed-production-setup.sh
```

### 2. Upload Your Application
```bash
# Create application directory
sudo mkdir -p /home/api.praashibysupal.com/backend

# Upload your backend files (use SCP, SFTP, or Git)
# Example with SCP:
scp -r backend/* user@your-server-ip:/home/api.praashibysupal.com/backend/

# Set proper ownership
sudo chown -R $USER:$USER /home/api.praashibysupal.com/backend
```

### 3. Install Dependencies
```bash
cd /home/api.praashibysupal.com/backend
npm install --production
```

### 4. Database Setup
```bash
# Create database and user
sudo mysql -u root -p
```

```sql
CREATE DATABASE praashibysupal_db;
CREATE USER 'praashi_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON praashibysupal_db.* TO 'praashi_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 5. Environment Configuration
```bash
# Update production environment file
nano /home/api.praashibysupal.com/backend/.env.production
```

**Required Environment Variables:**
```bash
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_USER=praashi_user
DB_PASSWORD=your_secure_password
DB_NAME=praashibysupal_db
JWT_SECRET=your_super_secure_jwt_secret
CORS_ORIGIN=https://praashibysupal.com,https://www.praashibysupal.com
UPLOAD_PATH=/home/api.praashibysupal.com/uploads
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### 6. SSL Certificate Setup
```bash
# Install Certbot
sudo apt install certbot -y

# Get SSL certificate
sudo certbot certonly --standalone -d api.praashibysupal.com -d www.api.praashibysupal.com

# Copy certificates to LiteSpeed
sudo cp /etc/letsencrypt/live/api.praashibysupal.com/privkey.pem /usr/local/lsws/conf/cert/api.praashibysupal.com.key
sudo cp /etc/letsencrypt/live/api.praashibysupal.com/fullchain.pem /usr/local/lsws/conf/cert/api.praashibysupal.com.crt
sudo chown lsadm:lsadm /usr/local/lsws/conf/cert/api.praashibysupal.com.*
```

### 7. Start Application with PM2
```bash
cd /home/api.praashibysupal.com/backend
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 8. Configure LiteSpeed
```bash
# Test LiteSpeed configuration
sudo /usr/local/lsws/bin/lswsctrl configtest

# Restart LiteSpeed
sudo /usr/local/lsws/bin/lswsctrl restart

# Check status
sudo /usr/local/lsws/bin/lswsctrl status
```

### 9. Firewall Configuration
```bash
# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow SSH
sudo ufw allow ssh

# Enable firewall
sudo ufw enable
```

## 🧪 **Testing Your Deployment**

### 1. Health Check
```bash
curl https://api.praashibysupal.com/api/health
```

### 2. Test API Endpoints
```bash
# Test authentication
curl -X POST https://api.praashibysupal.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test products
curl https://api.praashibysupal.com/api/products

# Test categories
curl https://api.praashibysupal.com/api/categories
```

### 3. Check Logs
```bash
# PM2 logs
pm2 logs praashi-api

# LiteSpeed logs
sudo tail -f /home/api.praashibysupal.com/logs/error.log
sudo tail -f /home/api.praashibysupal.com/logs/access.log
```

## 🔧 **Performance Optimization**

### 1. Database Optimization
```sql
-- Add indexes for better performance
ALTER TABLE products ADD INDEX idx_category (category_id);
ALTER TABLE products ADD INDEX idx_status (status);
ALTER TABLE orders ADD INDEX idx_user (user_id);
ALTER TABLE orders ADD INDEX idx_status (status);
```

### 2. LiteSpeed Optimization
```bash
# Enable LiteSpeed cache
# Edit /usr/local/lsws/conf/vhosts/api.praashibysupal.com/api.praashibysupal.com.conf
# Set cache enable to 1 for static content
```

### 3. PM2 Optimization
```bash
# Scale to multiple instances (if needed)
pm2 scale praashi-api 2

# Monitor performance
pm2 monit
```

## 🔒 **Security Checklist**

- [ ] Strong database passwords
- [ ] Secure JWT secret
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] File upload restrictions
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Regular backups scheduled

## 📊 **Monitoring Setup**

### 1. Log Rotation
```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/praashi-api
```

```bash
/home/api.praashibysupal.com/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
```

### 2. Backup Script
```bash
# Create backup script
nano /home/api.praashibysupal.com/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /home/api.praashibysupal.com/backups/api-backup-$DATE.tar.gz /home/api.praashibysupal.com/backend
find /home/api.praashibysupal.com/backups -name "api-backup-*.tar.gz" -mtime +7 -delete
```

### 3. SSL Auto-Renewal
```bash
# Add to crontab
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🚨 **Troubleshooting**

### Common Issues:

1. **502 Bad Gateway**
   - Check if Node.js app is running: `pm2 status`
   - Check if port 5000 is listening: `sudo netstat -tlnp | grep 5000`

2. **SSL Issues**
   - Check certificate: `sudo certbot certificates`
   - Verify certificate paths in LiteSpeed config

3. **Database Connection Issues**
   - Check MySQL status: `sudo systemctl status mysql`
   - Verify database credentials in .env.production

4. **File Upload Issues**
   - Check uploads directory permissions
   - Verify UPLOAD_PATH in environment variables

### Useful Commands:
```bash
# Restart services
sudo /usr/local/lsws/bin/lswsctrl restart
pm2 restart praashi-api

# Check service status
sudo /usr/local/lsws/bin/lswsctrl status
pm2 status

# View logs
pm2 logs praashi-api --lines 100
sudo tail -f /home/api.praashibysupal.com/logs/error.log
```

## ✅ **Final Checklist**

- [ ] Domain resolves to server IP
- [ ] SSL certificate working
- [ ] API endpoints responding
- [ ] Database connected
- [ ] File uploads working
- [ ] PM2 process running
- [ ] LiteSpeed serving requests
- [ ] Logs being written
- [ ] Backups scheduled
- [ ] Monitoring in place

Your Praashi by Supal API is now ready for production on LiteSpeed! 🎉







