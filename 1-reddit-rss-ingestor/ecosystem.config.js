module.exports = {
  apps: [
    {
      name: 'rss-ingestor',
      script: './src/index.js',
      cron_restart: '*/15 * * * *',
      autorestart: false,
    },
  ],
};
