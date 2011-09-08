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

var server = http.createServer(function (req, res) {
    if (url.parse(req.url).pathname.match(/^\/http-bind/)) {
        console.log("PROXY "+req.url+" ==> "+global.boshServer+":"+global.boshPort)
        proxy.proxyRequest(req, res, {
            host: global.boshServer,
            port: global.boshPort
        })
    } else if (url.parse(req.url).pathname.match(/^\/rollcall/)) {
        req.url = req.url.replace(/\/rollcall/,'')
        console.log("PROXY "+req.url+" ==> "+global.rollcallServer+":"+global.rollcallPort)
        req.headers['host'] = global.rollcallServer
        proxy.proxyRequest(req, res, {
            host: global.rollcallServer,
            port: global.rollcallPort
        })
    } else if (url.parse(req.url).pathname.match(/^\/mongoose/)) {
        req.url = req.url.replace(/\/mongoose/,'')
        console.log("PROXY "+req.url+" ==> "+global.mongooseServer+":"+global.mongoosePort)
        req.headers['host'] = global.mongooseServer
        proxy.proxyRequest(req, res, {
            host: global.mongooseServer,
            port: global.mongoosePort
        })
    } else {
        req.addListener('end', function(){ 
            //if (!url.parse(req.url).pathname.match(/^\/(http-bind|rollcall)/)) {
                console.log("STATIC "+req.url)
                file.serve(req, res)      
        })
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