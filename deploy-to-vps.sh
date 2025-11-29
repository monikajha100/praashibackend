#!/bin/bash

# Deployment script for Hostinger VPS (AlmaLinux + LiteSpeed)
# Run this script on your VPS

echo "🚀 Starting deployment to api.praashibysupal.com..."

# Set variables
PROJECT_DIR="/home/api.praashibysupal.com/public_html"
BACKEND_DIR="$PROJECT_DIR/backend"
LOGS_DIR="/home/api.praashibysupal.com/logs"

# Create directories
echo "📁 Creating directories..."
mkdir -p $PROJECT_DIR
mkdir -p $LOGS_DIR
mkdir -p $PROJECT_DIR/uploads/{banners,products,videos,images}

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    yum install -y nodejs
fi

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Install Git if not installed
if ! command -v git &> /dev/null; then
    echo "📦 Installing Git..."
    yum install -y git
fi

# Navigate to project directory
cd $PROJECT_DIR

# Install backend dependencies
if [ -d "$BACKEND_DIR" ]; then
    echo "📦 Installing backend dependencies..."
    cd $BACKEND_DIR
    npm install --production
fi

# Create PM2 ecosystem file
echo "⚙️ Creating PM2 configuration..."
cat > $PROJECT_DIR/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'praashi-api',
    script: 'server.js',
    cwd: '$BACKEND_DIR',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '$LOGS_DIR/err.log',
    out_file: '$LOGS_DIR/out.log',
    log_file: '$LOGS_DIR/combined.log',
    time: true
  }]
};
EOF

# Set proper permissions
echo "🔐 Setting permissions..."
chown -R lsadm:lsadm $PROJECT_DIR
chmod -R 755 $PROJECT_DIR
chmod 600 $BACKEND_DIR/.env 2>/dev/null || true

# Start/restart the application
echo "🔄 Starting application with PM2..."
pm2 delete praashi-api 2>/dev/null || true
pm2 start $PROJECT_DIR/ecosystem.config.js
pm2 save
pm2 startup

# Restart LiteSpeed
echo "🔄 Restarting LiteSpeed..."
systemctl restart lsws

# Setup firewall
echo "🔥 Configuring firewall..."
firewall-cmd --permanent --add-port=80/tcp 2>/dev/null || true
firewall-cmd --permanent --add-port=443/tcp 2>/dev/null || true
firewall-cmd --permanent --add-port=5000/tcp 2>/dev/null || true
firewall-cmd --reload 2>/dev/null || true

echo "✅ Deployment completed!"
echo "📊 Checking status..."
pm2 status
echo "🌐 Testing API..."
curl -k https://api.praashibysupal.com/api/health || echo "API not responding yet"

echo "🎉 Deployment finished! Check the logs with: pm2 logs praashi-api"
