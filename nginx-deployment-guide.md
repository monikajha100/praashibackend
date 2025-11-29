# Nginx Node.js API Deployment Guide for api.praashibysupal.com

## Prerequisites
- Ubuntu/Debian VPS with root access
- Nginx installed
- Node.js and npm installed
- Your domain `api.praashibysupal.com` pointing to your VPS IP
- SSL certificate (Let's Encrypt recommended)

## Step 1: Install Nginx and Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Nginx
sudo apt install nginx -y

# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

## Step 2: Upload Your Node.js Application

```bash
# Create application directory
sudo mkdir -p /home/api.praashibysupal.com/backend
sudo mkdir -p /home/api.praashibysupal.com/uploads
sudo mkdir -p /home/api.praashibysupal.com/logs

# Set proper permissions
sudo chown -R $USER:$USER /home/api.praashibysupal.com/

# Upload your backend files (use SCP, SFTP, or Git)
# Example with SCP:
scp -r backend/* user@your-server-ip:/home/api.praashibysupal.com/backend/

# Install dependencies
cd /home/api.praashibysupal.com/backend
npm install --production
```

## Step 3: Configure Nginx

1. **Copy the virtual host configuration:**
   ```bash
   sudo cp api.praashibysupal.com.nginx.conf /etc/nginx/sites-available/api.praashibysupal.com
   ```

2. **Enable the site:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/api.praashibysupal.com /etc/nginx/sites-enabled/
   ```

3. **Add rate limiting to main nginx.conf:**
   ```bash
   sudo nano /etc/nginx/nginx.conf
   ```
   
   Add this line inside the `http` block:
   ```nginx
   limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
   ```

4. **Test Nginx configuration:**
   ```bash
   sudo nginx -t
   ```

5. **Restart Nginx:**
   ```bash
   sudo systemctl restart nginx
   sudo systemctl enable nginx
   ```

## Step 4: SSL Certificate Setup

1. **Generate SSL certificate:**
   ```bash
   sudo certbot --nginx -d api.praashibysupal.com -d www.api.praashibysupal.com
   ```

2. **Test SSL renewal:**
   ```bash
   sudo certbot renew --dry-run
   ```

3. **Set up auto-renewal:**
   ```bash
   sudo crontab -e
   # Add this line:
   0 12 * * * /usr/bin/certbot renew --quiet
   ```

## Step 5: Process Manager Setup (PM2)

1. **Create PM2 ecosystem file:**
   ```bash
   cd /home/api.praashibysupal.com/backend
   nano ecosystem.config.js
   ```

2. **Start your application with PM2:**
   ```bash
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

3. **Verify PM2 is running:**
   ```bash
   pm2 status
   pm2 logs
   ```

## Step 6: Environment Configuration

1. **Create production environment file:**
   ```bash
   cd /home/api.praashibysupal.com/backend
   cp env.production.sample .env.production
   nano .env.production
   ```

2. **Update with your actual values:**
   ```bash
   NODE_ENV=production
   PORT=5000
   DB_HOST=localhost
   DB_USER=your_actual_db_user
   DB_PASSWORD=your_actual_db_password
   DB_NAME=your_actual_db_name
   JWT_SECRET=your_actual_jwt_secret
   ```

## Step 7: Firewall Configuration

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Allow Node.js port (optional, for direct access)
sudo ufw allow 5000

# Check status
sudo ufw status
```

## Step 8: Database Setup (if using MySQL)

```bash
# Install MySQL
sudo apt install mysql-server -y

# Secure MySQL installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p
```

```sql
CREATE DATABASE your_db_name;
CREATE USER 'your_db_user'@'localhost' IDENTIFIED BY 'your_db_password';
GRANT ALL PRIVILEGES ON your_db_name.* TO 'your_db_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Step 9: Testing Your Deployment

1. **Test API health endpoint:**
   ```bash
   curl https://api.praashibysupal.com/api/health
   ```

2. **Test with your frontend:**
   Update your frontend to use `https://api.praashibysupal.com` instead of `localhost:5000`

3. **Check Nginx logs:**
   ```bash
   sudo tail -f /var/log/nginx/api.praashibysupal.com.access.log
   sudo tail -f /var/log/nginx/api.praashibysupal.com.error.log
   ```

4. **Check PM2 logs:**
   ```bash
   pm2 logs praashi-api
   ```

## Step 10: Monitoring and Maintenance

1. **Set up log rotation:**
   ```bash
   sudo nano /etc/logrotate.d/api-praashibysupal
   ```
   
   Add:
   ```
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

2. **Monitor system resources:**
   ```bash
   # Install htop for monitoring
   sudo apt install htop -y
   htop
   ```

3. **Backup script:**
   ```bash
   nano /home/api.praashibysupal.com/backup.sh
   ```
   
   ```bash
   #!/bin/bash
   DATE=$(date +%Y%m%d_%H%M%S)
   tar -czf /home/api.praashibysupal.com/backups/api-backup-$DATE.tar.gz /home/api.praashibysupal.com/backend
   find /home/api.praashibysupal.com/backups -name "api-backup-*.tar.gz" -mtime +7 -delete
   ```
   
   ```bash
   chmod +x /home/api.praashibysupal.com/backup.sh
   ```

## Troubleshooting

### Common Issues:

1. **502 Bad Gateway:**
   ```bash
   # Check if Node.js app is running
   pm2 status
   
   # Check if port 5000 is listening
   sudo netstat -tlnp | grep 5000
   ```

2. **SSL Issues:**
   ```bash
   # Check certificate
   sudo certbot certificates
   
   # Test SSL
   openssl s_client -connect api.praashibysupal.com:443
   ```

3. **CORS Issues:**
   - Check the CORS configuration in your Node.js app
   - Verify the allowed origins in the Nginx config

4. **File Upload Issues:**
   ```bash
   # Check uploads directory permissions
   ls -la /home/api.praashibysupal.com/uploads/
   
   # Fix permissions if needed
   sudo chown -R $USER:$USER /home/api.praashibysupal.com/uploads/
   ```

### Useful Commands:

```bash
# Restart services
sudo systemctl restart nginx
pm2 restart praashi-api

# Check service status
sudo systemctl status nginx
pm2 status

# View logs
sudo journalctl -u nginx -f
pm2 logs praashi-api --lines 100

# Test Nginx config
sudo nginx -t

# Reload Nginx config
sudo nginx -s reload
```

## Security Checklist

- [ ] SSL certificate installed and auto-renewing
- [ ] Firewall configured (UFW)
- [ ] Strong database passwords
- [ ] JWT secret is secure
- [ ] File upload restrictions in place
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Regular backups scheduled
- [ ] Dependencies updated
- [ ] Log monitoring in place







