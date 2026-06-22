module.exports = {
  apps: [
    {
      name: 'ollama',
      script: 'ollama',
      args: 'serve',
      autorestart: true,
    },
  ],
};
