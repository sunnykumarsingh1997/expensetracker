module.exports = {
  apps: [
    {
      name: 'agent-expense-tracker',
      script: 'npm',
      args: 'start',
      cwd: '/opt/agent-expense-tracker',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/pm2/agent-expense-tracker-error.log',
      out_file: '/var/log/pm2/agent-expense-tracker-out.log',
      log_file: '/var/log/pm2/agent-expense-tracker-combined.log',
      time: true,
    },
  ],
};
