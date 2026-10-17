// pm2 keeps the API and the dashboard running (and restarts them after a reboot).
// If you put the project somewhere else, change `base`.
const base = '/var/www/errandboy/admin';

module.exports = {
  apps: [
    {
      name: 'errandboy-api',
      cwd: `${base}/api`,
      script: 'src/server.js',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '400M',
    },
    {
      name: 'errandboy-dashboard',
      cwd: `${base}/dashboard`,
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '600M',
    },
  ],
};
