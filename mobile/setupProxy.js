const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target:
        "https://3001-firebase-jasminintegrate-1773063794474.cluster-lu4mup47g5gm4rtyvhzpwbfadi.cloudworkstations.dev",
      changeOrigin: true,
      secure: false,
      logLevel: "debug"
    })
  );
};