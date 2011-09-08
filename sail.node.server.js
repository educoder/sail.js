// Simple stand-alone HTTP server with built-in reverse proxy for XMPP-BOSH.
//
// This uses node.js with the http-proxy and node-static modules.
//
// Can be configured using the following global keys:
//
//   global.bosh     --> server and port number for XMPP BOSH service
//   global.rollcall --> server and port number for Rollcall authentication service
//   global.mongoose --> server and port number for Sleepy Mongoose MongoDB REST service
//

var http = require('http')
var httpProxy = require('http-proxy')
var httpStatic = require('node-static')
var url = require('url')
var util = require('util')

global.bosh        = global.bosh || {}
global.bosh.server = global.bosh.server || 'proto.encorelab.org'
global.bosh.port   = global.bosh.port   || 5280

global.rollcall        = global.rollcall || {}
global.rollcall.server = global.rollcall.server || 'rollcall.proto.encorelab.org'
global.rollcall.port   = global.rollcall.port   || 80

global.mongoose        = global.mongoose || {}
global.mongoose.server = global.mongoose.server || 'proto.encorelab.org'
global.mongoose.port   = global.mongoose.port   || 27080

var proxy = new httpProxy.HttpProxy()
var file = new(httpStatic.Server)('.', {cache: false})

global.proxyMap = [
    {
        name: 'BOSH',
        match: function(req) { return url.parse(req.url).pathname.match(/^\/http-bind/) },
        proxy: function(req, res) {
            console.log("PROXY "+req.url+" ==> "+global.bosh.server+":"+global.bosh.port)
            proxy.proxyRequest(req, res, {
                host: global.bosh.server,
                port: global.bosh.port
            })
        }
    },
    
    {
        name: "Rollcall",
        match: function(req) { return url.parse(req.url).pathname.match(/^\/rollcall/) },
        proxy: function(req, res) {
            req.url = req.url.replace(/\/rollcall/,'')
            console.log("PROXY "+req.url+" ==> "+global.rollcall.server+":"+global.rollcall.port)
            req.headers['host'] = global.rollcall.server
            proxy.proxyRequest(req, res, {
                host: global.rollcall.server,
                port: global.rollcall.port
            })
        }
    },
    
    {
        name: "Mongoose",
        match: function(req) { return url.parse(req.url).pathname.match(/^\/mongoose/) },
        proxy: function(req, res) {
            req.url = req.url.replace(/\/mongoose/,'')
            console.log("PROXY "+req.url+" ==> "+global.mongoose.server+":"+global.mongoose.port)
            req.headers['host'] = global.mongoose.server
            proxy.proxyRequest(req, res, {
                host: global.mongoose.server,
                port: global.mongoose.port
            })
        }
    },
    
    {
        name: "STATIC",
        match: function(req) { return true },
        proxy: function(req, res) {
            req.addListener('end', function(){ 
                console.log("STATIC "+req.url)
                file.serve(req, res)      
            })
        }
    }
]

var server = http.createServer(function (req, res) {
    for (i in global.proxyMap) {
        map = global.proxyMap[i]
        
        if (map.match(req)) {
            map.proxy(req, res)
            break
        }
    }
})

server.start = function(port) {
    this.listen(port, function() {
        console.log("Starting... Sail server will listen on " + port + "...")
    })
}

exports.server = server

// Create a 'server.js' file at the root of your Sail app,
// and add this code:
//
// var sail = require('./js/sail.js/sail.node.server.js')
// sail.server.listen(8000)