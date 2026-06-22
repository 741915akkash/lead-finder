module.exports = {
  apps: [
    {
      name: 'ollama-worker',
      script: 'src/index.js',
      autorestart: true,
    },
  ],
};
