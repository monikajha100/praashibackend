# Node.js API Deployment Guide for api.praashibysupal.com

## Prerequisites
- LiteSpeed Web Server installed on your VPS
- Node.js and npm installed
- Your domain `api.praashibysupal.com` pointing to your VPS IP
- SSL certificate for your domain

## Step 1: Upload Your Node.js Application

1. **Upload your backend files to the server:**
   ```bash
   # Create application directory
   sudo mkdir -p /home/api.praashibysupal.com/backend
   
   # Upload your files (use SCP, SFTP, or Git)
   # Example with SCP:
   scp -r backend/* user@your-server-ip:/home/api.praashibysupal.com/backend/
   ```

2. **Install dependencies:**
   ```bash
   cd /home/api.praashibysupal.com/backend
   npm install --production
   ```

## Step 2: Configure LiteSpeed Virtual Host

1. **Copy the configuration file:**
   ```bash
   sudo cp api.praashibysupal.com.conf /usr/local/lsws/conf/vhosts/api.praashibysupal.com/
   ```

2. **Create necessary directories:**
   ```bash
   sudo mkdir -p /home/api.praashibysupal.com/{logs,uploads,public_html}
   sudo chown -R lsadm:lsadm /home/api.praashibysupal.com/
   ```

3. **Update LiteSpeed main configuration:**
   ```bash
   sudo nano /usr/local/lsws/conf/httpd_config.conf
   ```
   
   Add this line in the virtual host list:
   ```
   include /usr/local/lsws/conf/vhosts/api.praashibysupal.com/api.praashibysupal.com.conf
   ```

## Step 3: SSL Certificate Setup

1. **Generate SSL certificate (Let's Encrypt recommended):**
   ```bash
   # Install certbot
   sudo apt install certbot
   
   # Generate certificate
   sudo certbot certonly --standalone -d api.praashibysupal.com -d www.api.praashibysupal.com
   ```

2. **Copy certificates to LiteSpeed directory:**
   ```bash
   sudo mkdir -p /usr/local/lsws/conf/cert/
   sudo cp /etc/letsencrypt/live/api.praashibysupal.com/privkey.pem /usr/local/lsws/conf/cert/api.praashibysupal.com.key
   sudo cp /etc/letsencrypt/live/api.praashibysupal.com/fullchain.pem /usr/local/lsws/conf/cert/api.praashibysupal.com.crt
   sudo chown lsadm:lsadm /usr/local/lsws/conf/cert/api.praashibysupal.com.*
   ```

## Step 4: Process Manager Setup (PM2)

1. **Install PM2 globally:**
   ```bash
   sudo npm install -g pm2
   ```

2. **Create PM2 ecosystem file:**
   ```bash
   cd /home/api.praashibysupal.com/backend
   nano ecosystem.config.js
   ```

3. **Start your application with PM2:**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

## Step 5: Environment Configuration

1. **Create production environment file:**
   ```bash
   cd /home/api.praashibysupal.com/backend
   nano .env.production
   ```

2. **Set production variables:**
   ```
   NODE_ENV=production
   PORT=5000
   DB_HOST=localhost
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=your_db_name
   ```

## Step 6: Restart LiteSpeed

1. **Test configuration:**
   ```bash
   sudo /usr/local/lsws/bin/lswsctrl configtest
   ```

2. **Restart LiteSpeed:**
   ```bash
   sudo /usr/local/lsws/bin/lswsctrl restart
   ```

## Step 7: Firewall Configuration

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow Node.js port (if needed for direct access)
sudo ufw allow 5000
```

## Testing Your Deployment

1. **Test API health endpoint:**
   ```bash
   curl https://api.praashibysupal.com/api/health
   ```

2. **Test with your frontend:**
   Update your frontend to use `https://api.praashibysupal.com` instead of `localhost:5000`

## Monitoring and Maintenance

1. **Check PM2 status:**
   ```bash
   pm2 status
   pm2 logs
   ```

2. **Check LiteSpeed logs:**
   ```bash
   tail -f /home/api.praashibysupal.com/logs/error.log
   tail -f /home/api.praashibysupal.com/logs/access.log
   ```

3. **SSL certificate renewal:**
   ```bash
   # Add to crontab for auto-renewal
   sudo crontab -e
   # Add: 0 12 * * * /usr/bin/certbot renew --quiet
   ```

## Troubleshooting

- **502 Bad Gateway:** Check if Node.js app is running on port 5000
- **SSL Issues:** Verify certificate paths in the .conf file
- **CORS Issues:** Check the CORS configuration in your Node.js app
- **File Upload Issues:** Ensure uploads directory has proper permissions

## Security Considerations

1. **Keep dependencies updated:**
   ```bash
   npm audit fix
   ```

2. **Regular backups:**
   ```bash
   # Backup your application
   tar -czf api-backup-$(date +%Y%m%d).tar.gz /home/api.praashibysupal.com/backend
   ```

3. **Monitor logs regularly for suspicious activity**







