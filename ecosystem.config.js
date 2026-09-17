module.exports = {
  apps: [
    {
      name: 'job-capture',
      cwd: './7-job-ingestor',
      script: 'src/capture/index.js',

      autorestart: true,
      restart_delay: 5000,
      max_restarts: 10,

      env: {
        NODE_ENV: 'production',
      },
    },

    {
      name: 'job-ingest',
      cwd: './7-job-ingestor',
      script: 'src/ingestion/index.js',

      autorestart: true,
      restart_delay: 5000,
      max_restarts: 10,

      env: {
        NODE_ENV: 'production',
      },
    },

    {
      name: 'company-ats-discovery',
      cwd: './7-job-ingestor',
      script: 'src/discovery/companies.js',

      autorestart: false,

      cron_restart: '*/30 * * * *',

      env: {
        NODE_ENV: 'production',
      },
    },

    {
      name: 'company-ats-ingest',
      cwd: './7-job-ingestor',
      script: 'src/ingestion/companies.js',

      autorestart: false,

      cron_restart: '0 */1 * * *',

      env: {
        NODE_ENV: 'production',
      },
    },

    {
      name: 'job-processor',
      cwd: './8-job-processor',
      script: 'src/index.js',

      autorestart: true,
      restart_delay: 5000,
      max_restarts: 10,

      env: {
        NODE_ENV: 'production',
      },
    },

    {
      name: 'ollama',
      script: '/usr/local/bin/ollama',
      args: 'serve',
      interpreter: 'none',

      autorestart: true,
      restart_delay: 5000,
      max_restarts: 10,
    },
  ],
};

