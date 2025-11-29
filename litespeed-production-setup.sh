#!/bin/bash

# LiteSpeed Production Setup Script for Praashi by Supal API
# Run this script on your VPS to set up the complete production environment

echo "🚀 Setting up Praashi by Supal API on LiteSpeed..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="api.praashibysupal.com"
APP_DIR="/home/$DOMAIN"
BACKEND_DIR="$APP_DIR/backend"
VH_ROOT="$APP_DIR/public_html"

echo -e "${GREEN}📁 Creating directory structure...${NC}"
sudo mkdir -p $APP_DIR/{backend,public_html,uploads,logs}
sudo mkdir -p /usr/local/lsws/conf/vhosts/$DOMAIN

echo -e "${GREEN}📦 Installing Node.js and PM2...${NC}"
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

echo -e "${GREEN}🗄️ Installing MySQL...${NC}"
sudo apt update
sudo apt install mysql-server -y

echo -e "${GREEN}🔧 Setting up MySQL database...${NC}"
# Create database and user
sudo mysql -e "CREATE DATABASE IF NOT EXISTS praashibysupal_db;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'praashi_user'@'localhost' IDENTIFIED BY 'secure_password_here';"
sudo mysql -e "GRANT ALL PRIVILEGES ON praashibysupal_db.* TO 'praashi_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

echo -e "${GREEN}📝 Creating production environment file...${NC}"
sudo cat > $BACKEND_DIR/.env.production << 'EOF'
NODE_ENV=production
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_USER=praashi_user
DB_PASSWORD=secure_password_here
DB_NAME=praashibysupal_db
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_here_change_this
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=https://praashibysupal.com,https://www.praashibysupal.com

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/home/api.praashibysupal.com/uploads

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Security
HELMET_ENABLED=true
TRUST_PROXY=true
EOF

echo -e "${GREEN}⚙️ Creating PM2 ecosystem configuration...${NC}"
sudo cat > $BACKEND_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'praashi-api',
    script: 'server.js',
    cwd: '/home/api.praashibysupal.com/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/home/api.praashibysupal.com/logs/pm2-error.log',
    out_file: '/home/api.praashibysupal.com/logs/pm2-out.log',
    log_file: '/home/api.praashibysupal.com/logs/pm2-combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

echo -e "${GREEN}🌐 Creating LiteSpeed virtual host configuration...${NC}"
sudo cat > /usr/local/lsws/conf/vhosts/$DOMAIN/$DOMAIN.conf << 'EOF'
# LiteSpeed Virtual Host Configuration for api.praashibysupal.com
# Praashi by Supal API Configuration

docRoot                   $VH_ROOT/public_html
vhDomain                  api.praashibysupal.com
vhAliases                 www.api.praashibysupal.com
adminEmails               admin@praashibysupal.com
enableGzipCompression     1
enableIpGeo               1

errorlog $VH_ROOT/logs/error.log {
  useServer               0
  logLevel                ERROR
  rollingSize             10M
}

accesslog $VH_ROOT/logs/access.log {
  useServer               0
  logFormat               "%h %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-Agent}i\""
  logHeaders              5
  rollingSize             10M
  keepDays                30
}

expires  {
  enableExpires           1
  expiresByType           image/*=A604800,text/css=A604800,application/x-javascript=A604800,application/javascript=A604800,font/*=A604800,application/x-font-ttf=A604800
}

# SSL Configuration
ssl  {
  keyFile                 /usr/local/lsws/conf/cert/api.praashibysupal.com.key
  certFile                /usr/local/lsws/conf/cert/api.praashibysupal.com.crt
  certChain               1
  sslProtocol             24
  ciphers                 EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH:ECDHE-RSA-AES128-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA128:DHE-RSA-AES128-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES128-GCM-SHA128:ECDHE-RSA-AES128-SHA384:ECDHE-RSA-AES128-SHA128:DHE-RSA-AES128-SHA128:DHE-RSA-AES128-SHA:ECDHE-RSA-AES128-SHA:DHE-RSA-AES128-SHA:ECDHE-RSA-DES-CBC3-SHA:EDH-RSA-DES-CBC3-SHA:AES128-GCM-SHA384:AES128-GCM-SHA128:AES128-SHA128:AES128-SHA128:AES128-SHA:DES-CBC3-SHA:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!MD5:!PSK:!RC4
  enableECDHE             1
}

# Rewrite rules for API
rewrite  {
  enable                  1
  autoLoadHtaccess        1
  rules                   <<<END_rules
RewriteEngine On

# Handle CORS preflight requests
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# Proxy all requests to Node.js app on port 5000
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://127.0.0.1:5000/$1 [P,L]
END_rules
}

# Script Handler for Node.js
extprocessor nodejs {
  type                    proxy
  address                 127.0.0.1:5000
  maxConns                100
  initTimeout             60
  retryTimeout            0
  pcKeepAliveTimeout      1
  respBuffer              0
  autoStart               2
  path                    /usr/bin/node
  backlog                 100
  instances               1
  priority                0
  memSoftLimit            2047M
  memHardLimit            2047M
  procSoftLimit           400
  procHardLimit           500
}

# Context for API routes
context /api/ {
  type                    proxy
  addDefaultCharset       off
  extraHeaders            <<<END_extraHeaders
X-Forwarded-Proto: https
X-Forwarded-For: %{REMOTE_ADDR}s
X-Real-IP: %{REMOTE_ADDR}s
END_extraHeaders
  proxyHeaders            1
}

# Context for uploads directory (static files)
context /uploads/ {
  type                    static
  docRoot                 $VH_ROOT/uploads
  extraHeaders            <<<END_extraHeaders
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
END_extraHeaders
}

# Security headers
extraHeaders              <<<END_extraHeaders
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
END_extraHeaders

# Cache control for API responses
cache  {
  enable                  0
  checkPrivateCache       1
  checkPublicCache        1
  maxCacheObjSize         10000000
  maxStaleAge             200
  qsCache                 1
  reqCookieCache          1
  respCookieCache         1
  ignoreReqCacheCtrl      1
  ignoreRespCacheCtrl     0
  enableCache             0
  expireInSeconds         3600
  enablePrivateCache      0
  privateExpireInSeconds  3600
}
EOF

echo -e "${GREEN}🔗 Adding virtual host to main LiteSpeed configuration...${NC}"
echo "include /usr/local/lsws/conf/vhosts/$DOMAIN/$DOMAIN.conf" | sudo tee -a /usr/local/lsws/conf/httpd_config.conf

echo -e "${GREEN}🔐 Setting up SSL certificates...${NC}"
sudo mkdir -p /usr/local/lsws/conf/cert/
sudo apt install certbot -y

echo -e "${YELLOW}📋 Manual steps required:${NC}"
echo "1. Upload your backend files to: $BACKEND_DIR"
echo "2. Run: cd $BACKEND_DIR && npm install --production"
echo "3. Update database credentials in: $BACKEND_DIR/.env.production"
echo "4. Get SSL certificate: sudo certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN"
echo "5. Copy SSL certificates to LiteSpeed:"
echo "   sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /usr/local/lsws/conf/cert/$DOMAIN.key"
echo "   sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /usr/local/lsws/conf/cert/$DOMAIN.crt"
echo "6. Set proper permissions:"
echo "   sudo chown -R lsadm:lsadm $APP_DIR"
echo "   sudo chown lsadm:lsadm /usr/local/lsws/conf/cert/$DOMAIN.*"
echo "7. Start your application:"
echo "   cd $BACKEND_DIR && pm2 start ecosystem.config.js --env production"
echo "   pm2 save && pm2 startup"
echo "8. Test and restart LiteSpeed:"
echo "   sudo /usr/local/lsws/bin/lswsctrl configtest"
echo "   sudo /usr/local/lsws/bin/lswsctrl restart"

echo -e "${GREEN}✅ LiteSpeed production setup completed!${NC}"
echo -e "${YELLOW}⚠️  Please complete the manual steps above to finish the deployment.${NC}"







