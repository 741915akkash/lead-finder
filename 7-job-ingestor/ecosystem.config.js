module.exports = {
  apps: [
    {
      name: 'job-ingestor',
      script: './src/ingestion/index.js',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
