const cors_proxy = require('cors-anywhere');
const express = require('express');
const app = express();

// Listen on a specific host via the HOST environment variable
const host = process.env.HOST || '0.0.0.0';
// Listen on a specific port via the PORT environment variable
const port = process.env.PORT || 8086;

var originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
var originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);

function parseEnvList(env) {
    if (!env) {
        return [];
    }
    return env.split(',');
}

// Log all incoming requests and their headers, including cookies
app.use((req, res, next) => {
    console.log("Request Headers:", req.headers);  // Logs full headers including cookies
    console.log("Cookies:", req.headers.cookie);  // Logs cookies
    next();  // Proceed to next middleware/handler
});

// CORS Anywhere Setup
cors_proxy.createServer({
    originBlacklist: originBlacklist,
    originWhitelist: originWhitelist,
    requireHeader: ['origin', 'x-requested-with'],

    // Allow credentials by modifying the response headers
    setHeaders: function (headers, req) {
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

    // Ensure cookies are not stripped
    removeHeaders: [
        // Remove unnecessary headers, but KEEP cookies
        'x-request-start',
        'x-request-id',
        'via',
        'connect-time',
        'total-route-time',
    ],

    // Proxy Options (for headers and forwards)
    httpProxyOptions: {
        xfwd: false,  // Do not add X-Forwarded-For headers
    },

}).listen(port, host, function () {
    console.log(`Running CORS Anywhere on ${host}:${port}`);
});

// Basic express server to log cookies and handle CORS
app.listen(port, host, () => {
    console.log(`Server is running on ${host}:${port}`);
});
