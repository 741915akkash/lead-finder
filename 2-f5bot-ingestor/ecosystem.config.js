module.exports = {
  apps: [
    {
      name: 'f5bot-ingestor',
      script: './src/index.js',
      cron_restart: '*/15 * * * *',
      autorestart: false,
    },
  ],
};
