module.exports = {
  apps: [{
    name: 'erp-ultra-inspector',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/root/erp_ultra_inspector',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_TELEMETRY_DISABLED: '1'
    },
    error_file: '/root/erp_ultra_inspector/logs/err.log',
    out_file: '/root/erp_ultra_inspector/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    watch: false
  }]
};

