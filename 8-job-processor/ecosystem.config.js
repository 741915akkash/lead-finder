module.exports = {
  apps: [
    {
      name: 'job-processor',
      script: './src/index.js',
      cwd: __dirname,
      autorestart: true,
      restart_delay: 5000,
    },
  ],
};
