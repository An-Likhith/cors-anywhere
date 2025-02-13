// Listen on a specific host via the HOST environment variable
var host = process.env.HOST || '0.0.0.0';
// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 8086;

var originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
var originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);

function parseEnvList(env) {
  if (!env) {
    return [];
  }
  return env.split(',');
}

var checkRateLimit = require('./lib/rate-limit')(process.env.CORSANYWHERE_RATELIMIT);
var cors_proxy = require('./lib/cors-anywhere');

cors_proxy.createServer({
  originBlacklist: originBlacklist,
  originWhitelist: originWhitelist,
  requireHeader: ['origin', 'x-requested-with'],
  checkRateLimit: checkRateLimit,

  removeHeaders: [
    // Strip Heroku-specific headers
    'x-request-start',
    'x-request-id',
    'via',
    'connect-time',
    'total-route-time',
  ],

  // **Allow credentials by modifying the response headers**
  setHeaders: function(headers, req) {
    if (req.headers.origin) {
      const origin = req.headers.origin;

      // Check if the origin ends with 'tweakers.net'
      if (origin.endsWith('tweakers.net')) {
        headers['Access-Control-Allow-Origin'] = origin;  // Set the request’s origin dynamically
        headers['Access-Control-Allow-Credentials'] = 'true';  // Allow cookies
      } else {
        // Reject requests where the origin doesn't end with 'tweakers.net'
        headers['Access-Control-Allow-Origin'] = 'null';
      }
    }
  },

  // **Ensure cookies are not stripped**
  removeHeaders: [
    // Remove unnecessary headers, but KEEP cookies
    'x-request-start',
    'x-request-id',
    'via',
    'connect-time',
    'total-route-time',
  ],

  httpProxyOptions: {
    xfwd: false,  // Do not add X-Forwarded-For headers
  },
}).listen(port, host, function() {
  console.log('Running CORS Anywhere on ' + host + ':' + port);
});
