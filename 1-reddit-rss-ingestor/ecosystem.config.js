module.exports = {
  apps: [
    {
      name: 'rss-ingestor',
      script: './src/index.js',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
