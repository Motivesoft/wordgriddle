module.exports = {
  apps : [{
    name   : "wordgriddle",
    script : "./server.js",
    instances: 1,
    autorestart: true,
    watch: true,
    env: {
      NODE_ENV: "development"
    },
    env_production: {
      NODE_ENV: "production"
    }
  }]
}
