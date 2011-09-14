/** minified loadjs from https://github.com/chriso/load.js **/
/* Copyright (c) 2010 Chris O'Hara <cohara87@gmail.com>. MIT Licensed */
function loadScript(a,b,c){var d=document.createElement("script");d.type="text/javascript",d.src=a,d.onload=b,d.onerror=c,d.onreadystatechange=function(){var a=this.readyState;if(a==="loaded"||a==="complete")d.onreadystatechange=null,b()},head.insertBefore(d,head.firstChild)}(function(a){a=a||{};var b={},c,d;c=function(a,d,e){var f=a.halt=!1;a.error=function(a){throw a},a.next=function(c){c&&(f=!1);if(!a.halt&&d&&d.length){var e=d.shift(),g=e.shift();f=!0;try{b[g].apply(a,[e,e.length,g])}catch(h){a.error(h)}}return a};for(var g in b){if(typeof a[g]==="function")continue;(function(e){a[e]=function(){var g=Array.prototype.slice.call(arguments);if(e==="onError"){if(d){b.onError.apply(a,[g,g.length]);return a}var h={};b.onError.apply(h,[g,g.length]);return c(h,null,"onError")}g.unshift(e);if(!d)return c({},[g],e);a.then=a[e],d.push(g);return f?a:a.next()}})(g)}e&&(a.then=a[e]),a.call=function(b,c){c.unshift(b),d.unshift(c),a.next(!0)};return a.next()},d=a.addMethod=function(d){var e=Array.prototype.slice.call(arguments),f=e.pop();for(var g=0,h=e.length;g<h;g++)typeof e[g]==="string"&&(b[e[g]]=f);--h||(b["then"+d.substr(0,1).toUpperCase()+d.substr(1)]=f),c(a)},d("chain",function(a){var b=this,c=function(){if(!b.halt){if(!a.length)return b.next(!0);try{null!=a.shift().call(b,c,b.error)&&c()}catch(d){b.error(d)}}};c()}),d("run",function(a,b){var c=this,d=function(){c.halt||--b||c.next(!0)},e=function(a){c.error(a)};for(var f=0,g=b;!c.halt&&f<g;f++)null!=a[f].call(c,d,e)&&d()}),d("defer",function(a){var b=this;setTimeout(function(){b.next(!0)},a.shift())}),d("onError",function(a,b){var c=this;this.error=function(d){c.halt=!0;for(var e=0;e<b;e++)a[e].call(c,d)}})})(this),addMethod("load",function(a,b){for(var c=[],d=0;d<b;d++)(function(b){c.push(function(c,d){loadScript(a[b],c,d)})})(d);this.call("run",c)});var head=document.getElementsByTagName("head")[0]||document.documentElement

/** prevent errors in case console/firebug is not available **/
if (!window.console) {
    var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml",
    "group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];

    window.console = {};
    for (var i = 0; i < names.length; ++i)
        window.console[names[i]] = function() {}
}

var Sail = window.Sail || {}

Sail.load = function() {
    Sail.loader = 
        load('js/sail.js/deps/jquery-1.6.2.js',
                'js/sail.js/deps/md5.js',
                'js/sail.js/deps/base64.js')
        .then('js/sail.js/deps/strophe.js',
                'js/sail.js/deps/jquery-ui-1.8.14.js',
                'js/sail.js/deps/jquery.url.js',
                'js/sail.js/deps/jquery.cookie.js')
        .then('js/sail.js/deps/strophe.ping.js')
        .then('js/sail.js/sail.strophe.js',
                'js/sail.js/sail.ui.js')
                
    return Sail.loader
}

Sail.init = function(app, opts) {
    Sail.app = app
    Sail.loader
        .thenRun(function() {
            Sail.app.init()
            
            if (Sail.app.phonegap) {
                // NOTE: need to use addEventListener() here instead of jQuery's bind()
                //       ... not sure why bind() doesn't work -- probably a phonegap quirk
                document.addEventListener('deviceready', PhonegapDemo.phonegap, false)
            }
            
            return true
        }).thenRun(function() {
            Sail.UI.init()
            return true
        }).thenRun(function () {
            console.log("Initialized.")
            $(Sail.app).trigger('initialized')
            return true
        })
    
    return true
}

Sail.modules = Sail.modules || {}

Sail.modules.defaultPath = '/js/sail.js/modules/'

Sail.modules.load = function(module, options, url) {
    defaultModulesPath = Sail.app.defaultModulesPath || Sail.modules.defaultPath
    
    if (typeof options == 'string') {
        url = options
        delete options
    }
    
    if (url) {
        if (url.indexOf('/') < 0)
            url = defaultModulesPath + url
    } else {
        url = defaultModulesPath + module + '.js'
    }
    
    Sail.loader.load(url).thenRun(function() {
        m = eval(module)
        
        if (options)
            m.options = options
        
        console.log("Loaded module "+module+" from "+url, m)
        
        for (event in m.events) {
            $(Sail.app).bind(event+"."+module, m.events[event])
            console.debug("Bound event "+event+"."+module)
        }
        
        Sail.modules[module] = m
        return true
    })
    
    return Sail.modules
}

Sail.modules.thenRun = function(callback) {
    Sail.loader.thenRun(callback)
    return Sail.modules
}

Sail.loadCSS = function(url) {
    link = $('<link rel="stylesheet" type="text/css" />')
    link.attr('href', url)
    $('head').append(link)
}

Sail.Event = function(type, payload) {
    this.eventType = type
    this.payload = payload
    if (Sail.app.session && Sail.app.session.account && Sail.app.session.account.login)
        this.origin = Sail.app.session.account.login
}

Sail.Event.prototype = {
    // FIXME: this needs to be reworked
    // toXML: function() {
    //     // hack using jQuery to build the XML
    //     xml = $("<xml />")
    //     ev = $('<event />')
    //     ev.attr('type', this.type)
    //     ev.text(this.content)
    //     xml.append(ev)
    //     return xml.html() // html() returns only the inner contents of the <xml> tag!
    // },
    
    toJSON: function() {
        return JSON.stringify({
            eventType: this.eventType,
            payload: this.payload,
            origin: this.origin
        })
    },
    
    // intelligently extract and return the login name
    // from the .from property
    fromLogin: function() {
        from = this.from
        if (!from || from.length == 0)
            return null
        
        jidRegExp = /(.*?)@([a-zA-Z0-9\.\-]*)(?:\/(.*))?/
        
        fromParts = from.split("/")
        if (fromParts[1] && fromParts[1].match(jidRegExp))
            return fromParts[1].match(jidRegExp)[1]
        else
            return from.match(jidRegExp)[3] || from.match(jidRegExp)[1]
    }
}

Sail.autobindEvents = function(obj, options) {
    options = options || {}
    
    for (var event in obj.events) {
        if (obj.events.hasOwnProperty(event) && typeof obj.events[event] == 'function') {
            console.debug("Sail: auto-binding event '"+event+"'")
            try {
                if (options.pre)
                  $(obj).bind(event, options.pre)
                $(obj).bind(event, obj.events[event])
                if (options.post)
                  $(obj).bind(event, options.post)
            } catch(e) {
                alert("Sail: failed to auto-bind event! '"+event+"' may be a reserved word.")
                throw e
            }
        }
    }
}

Sail.generateSailEventHandler = function(obj) {
    return function(stanza) {
        msg = $(stanza)

        body = $(msg).children('body').text()
        sev = null
        try {
            data = JSON.parse(body)
        } catch(err) {
            console.log("couldn't parse message, ignoring: "+err)
            return
        }

        sev = new Sail.Event(data.eventType, data.payload)
        sev.from = msg.attr('from')
        sev.to = msg.attr('to')
        sev.stanza = stanza
    
        if (!obj.events || !obj.events.sail)
            mapping = null
        else
            mapping = obj.events.sail[sev.eventType]
        
        if (mapping == null || typeof(mapping) == 'string') {
            if (mapping == null)
                eventName = sev.eventType
            else
                eventName = obj.events.sail[sev.eventType]
            
            events = $(obj).data('events')
            if (events && events[eventName]) // hacky way to check if a handler was bound for this event
                $(obj).trigger(eventName, sev)
            else
                console.log("UNHANDLED EVENT "+eventName, sev)
                
        } else if (typeof(mapping) == 'function') {
            mapping(sev)
        } else {
            throw "Invalid mapping '"+mapping+"' for Sail event '"+sev.eventType+"'!"
        }

        return true
    }
}