module.exports = {
  apps: [
    {
      name: "kannabikes",
      script: "./node_modules/.bin/react-router-serve",
      args: "build/server/index.js",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
