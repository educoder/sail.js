/**
    Simple stand-alone HTTP server with built-in reverse proxy for XMPP-BOSH.
    
    This uses node.js with the http-proxy and node-static modules.
    
    To use, create a `server.js` file at the root of your Sail app and add this code:
    
        var sail = require('./js/sail.js/sail.node.server.js')
        sail.server.listen(8000)
    
    Looks for a `config.json` file in the current directory and configures itself accordingly.
*/

/*jshint devel: true */
/*global require, exports */

var http = require('http');
var httpProxy = require('http-proxy');
var httpStatic = require('node-static');
var url = require('url');
var util = require('util');
var fs = require('fs');

try {
    var config = JSON.parse(fs.readFileSync('config.json'));
} catch (e) {
    console.error("Error reading config.json. Does the file exists?\n("+e+")");
    throw e;
}

var proxy = new httpProxy.RoutingProxy();
var file = new(httpStatic.Server)('.', {cache: false});


var server = http.createServer(function (req, res) {
    var i;
    for (i = 0; i <= server.proxyMap.length; i++) {
        var map = server.proxyMap[i];
        
        if (map.match(req)) {
            map.proxy(req, res);
            break;
        }
    }
});

server.config = config;
server.proxy = proxy;

server.start = function(port) {
    this.listen(port, function() {
        console.log("\nUsing settings from config.js:\n", config, "\n");
        console.log("Sail server listening on http://localhost:" + port + "...");
    });
};


server.proxyMap = [
    {
        name: 'BOSH',
        match: function(req) { return url.parse(req.url).pathname.match(/^\/http-bind/); },
        proxy: function(req, res) {
            console.log("PROXY "+req.url+" ==> "+config.bosh.url);
            var boshUrl = url.parse(config.bosh.url);
            proxy.proxyRequest(req, res, {
                host: boshUrl.hostname,
                port: boshUrl.port
            });
        }
    },
    
    {
        name: "Rollcall",
        match: function(req) { return url.parse(req.url).pathname.match(/^\/rollcall/); },
        proxy: function(req, res) {
            req.url = req.url.replace(/\/rollcall/,'');
            var rollcallUrl = url.parse(config.rollcall.url);
            console.log("PROXY "+req.url+" ==> "+config.rollcall.url);
            req.headers.host = rollcallUrl.hostname;
            proxy.proxyRequest(req, res, {
                host: rollcallUrl.hostname,
                port: rollcallUrl.port || 80
            });
        }
    },
    
    {
        name: "Mongoose",
        match: function(req) { return url.parse(req.url).pathname.match(/^\/mongoose/); },
        proxy: function(req, res) {
            req.url = req.url.replace(/\/mongoose/,'');
            var mongooseUrl = url.parse(config.mongoose.url);
            console.log("PROXY "+req.url+" ==> "+config.mongoose.url);
            req.headers.host = mongooseUrl.hostname;
            proxy.proxyRequest(req, res, {
                host: mongooseUrl.hostname,
                port: mongooseUrl.port
            });
        }
    },

    {
        name: "Mongo REST",
        match: function(req) { return url.parse(req.url).pathname.match(/^\/mongo/); },
        proxy: function(req, res) {
            req.url = req.url.replace(/\/mongo/,'');
            var mongoUrl = url.parse(config.mongo.url);
            console.log("PROXY "+req.url+" ==> "+config.mongo.url);
            req.headers.host = mongoUrl.hostname;
            proxy.proxyRequest(req, res, {
                host: mongoUrl.hostname,
                port: mongoUrl.port
            });
        }
    },
    
    {
        name: "STATIC",
        match: function(req) { return true; },
        proxy: function(req, res) {
            req.addListener('end', function(){ 
                console.log("STATIC "+req.url);
                file.serve(req, res);     
            });
        }
    }
];


exports.server = server;

