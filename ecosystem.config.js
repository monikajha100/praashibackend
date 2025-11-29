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
      PORT: 5000,
      DB_HOST: 'localhost',
      DB_USER: 'your_database_user',
      DB_PASSWORD: 'your_database_password',
      DB_NAME: 'praashibysupal_db',
      CORS_ORIGIN: 'https://praashibysupal.com,https://www.praashibysupal.com'
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