// Import required modules
var host = process.env.HOST || '0.0.0.0';
var port = process.env.PORT || 8086;

var originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
var originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);

function parseEnvList(env) {
  return env ? env.split(',') : [];
}

var checkRateLimit = require('./lib/rate-limit')(process.env.CORSANYWHERE_RATELIMIT);
var cors_proxy = require('./lib/cors-anywhere');

cors_proxy.createServer({
  originBlacklist: originBlacklist,
  originWhitelist: originWhitelist,
  requireHeader: ['origin', 'x-requested-with'],
  checkRateLimit: checkRateLimit,

  removeHeaders: [
    'x-request-start', 'x-request-id', 'via', 'connect-time', 'total-route-time',
  ],

  setHeaders: function(headers, req) {
    if (req.headers.origin) {
      const origin = req.headers.origin;

      // Allow requests from origins ending with 'tweakers.net'
      if (origin.endsWith('tweakers.net')) {
        headers['Access-Control-Allow-Origin'] = origin;
        headers['Access-Control-Allow-Credentials'] = 'true';
      } else {
        headers['Access-Control-Allow-Origin'] = 'null';
      }
    }

    // Log cookies from incoming request
    if (req.headers.cookie) {
      console.log("[+] Cookies from request:", req.headers.cookie);
    } 
    else {
            console.log("[-] No cookies received in request.");
        }
  },

  httpProxyOptions: {
    xfwd: false, // Do not add X-Forwarded-For headers
  },

}).listen(port, host, function() {
  console.log(`[*] Running CORS Proxy on ${host}:${port}`);
});
