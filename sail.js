/**
    @fileOverview
    Core sail.js functionality.
*/

/** Minified loadjs from <a href="https://github.com/chriso/load.js">https://github.com/chriso/load.js</a> **/
/* Copyright (c) 2010 Chris O'Hara <cohara87@gmail.com>. MIT Licensed */
function loadScript(a,b,c){var d=document.createElement("script");d.type="text/javascript",d.src=a,d.onload=b,d.onerror=c,d.onreadystatechange=function(){var a=this.readyState;if(a==="loaded"||a==="complete")d.onreadystatechange=null,b()},head.insertBefore(d,head.firstChild)}(function(a){a=a||{};var b={},c,d;c=function(a,d,e){var f=a.halt=!1;a.error=function(a){throw a},a.next=function(c){c&&(f=!1);if(!a.halt&&d&&d.length){var e=d.shift(),g=e.shift();f=!0;try{b[g].apply(a,[e,e.length,g])}catch(h){a.error(h)}}return a};for(var g in b){if(typeof a[g]==="function")continue;(function(e){a[e]=function(){var g=Array.prototype.slice.call(arguments);if(e==="onError"){if(d){b.onError.apply(a,[g,g.length]);return a}var h={};b.onError.apply(h,[g,g.length]);return c(h,null,"onError")}g.unshift(e);if(!d)return c({},[g],e);a.then=a[e],d.push(g);return f?a:a.next()}})(g)}e&&(a.then=a[e]),a.call=function(b,c){c.unshift(b),d.unshift(c),a.next(!0)};return a.next()},d=a.addMethod=function(d){var e=Array.prototype.slice.call(arguments),f=e.pop();for(var g=0,h=e.length;g<h;g++)typeof e[g]==="string"&&(b[e[g]]=f);--h||(b["then"+d.substr(0,1).toUpperCase()+d.substr(1)]=f),c(a)},d("chain",function(a){var b=this,c=function(){if(!b.halt){if(!a.length)return b.next(!0);try{null!=a.shift().call(b,c,b.error)&&c()}catch(d){b.error(d)}}};c()}),d("run",function(a,b){var c=this,d=function(){c.halt||--b||c.next(!0)},e=function(a){c.error(a)};for(var f=0,g=b;!c.halt&&f<g;f++)null!=a[f].call(c,d,e)&&d()}),d("defer",function(a){var b=this;setTimeout(function(){b.next(!0)},a.shift())}),d("onError",function(a,b){var c=this;this.error=function(d){c.halt=!0;for(var e=0;e<b;e++)a[e].call(c,d)}})})(this),addMethod("load",function(a,b){for(var c=[],d=0;d<b;d++)(function(b){c.push(function(c,d){loadScript(a[b],c,d)})})(d);this.call("run",c)});var head=document.getElementsByTagName("head")[0]||document.documentElement

/** Prevents errors in case console/firebug is not available */
if (!window.console) {
    /** @ignore */
    var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml",
    "group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];

    window.console = {};
    for (var i = 0; i < names.length; ++i)
        window.console[names[i]] = function() {}
}

/** @namespace **/
var Sail = window.Sail || {}

/**
    Loads the base requirements for a Sail app using chain.js and load.js.
    Also initializes `Sail.loader` which can be used for furter `load()` calls.
    
    @see <a href="https://github.com/chriso/load.js">load.js</a>
*/
Sail.load = function() {
    Sail.loader = 
        load('js/sail.js/deps/jquery-1.6.2.js',
                'js/sail.js/deps/underscore-1.1.7.js',
                'js/sail.js/deps/md5.js',
                'js/sail.js/deps/base64.js')
        .then('js/sail.js/deps/strophe.js',
                'js/sail.js/deps/moment-1.1.0.js',
                'js/sail.js/deps/jquery-ui-1.8.14.js',
                'js/sail.js/deps/jquery.url.js',
                'js/sail.js/deps/jquery.cookie.js')
        .then('js/sail.js/deps/strophe.ping.js')
        .then('js/sail.js/sail.strophe.js',
                'js/sail.js/sail.ui.js')
		.then('js/sail.js/deps/jquery.flot.js')
                
    return Sail.loader
}

/**
    Initializes the given object as a sail.js app.
    
    @param {object} app - The object that will be treated as the sail.js app.
                          A global reference to this object will be created under `Sail.app`.
    @param {object} [opts] - Options for initialization. Currently unused.
    
    @see Sail.UI.init()
    
    @example
    // create your app as an object
    MyApp = {
        events: {
            sail: {
            
            }
        }
    }

    Sail.init(MyApp)
    // MyApp is now accessible as Sail.app and its `init()` function is called.
    // `Sail.UI.init()` is also called.
    // The 
*/
Sail.init = function(app, opts) {
    Sail.app = app
    Sail.loader
        .thenRun(function() {
            Sail.configure(Sail.app)
            Sail.app.init()
            
            if (Sail.app.allowRunlessEvents === undefined)
                Sail.app.allowRunlessEvents = true 
            
            if (Sail.app.phonegap) {
                // NOTE: need to use addEventListener() here instead of jQuery's bind()
                //       ... not sure why bind() doesn't work -- probably a phonegap quirk
                document.addEventListener('deviceready', Sail.app.phonegap, false)
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

/**
    Retrieves a JSON config file from "/config.json" and configures
    the given Sail app accordingly.
    
    @param {object} app - The Sail app object to be configured.
    @param {object} [options] - Additional options for configuration. Currently unused.
*/
Sail.configure = function(app, opts) {
    $.ajax(
        {
            url: '/config.json', 
            dataType: 'json',
            async: false,
            cache: false,
            success: function(data) {
                app.xmppDomain = data.xmpp.domain
            },
            error: function(xhr, code, error) {
                console.error("Couldn't load `config.json`: ", code, error, xhr)
                alert("Couldn't load `config.json` because:\n\n"+error+" ("+code+")")
            }
        }
    )
}

/** 
    Manages loadable modules. 
    @namespace
*/
Sail.modules = Sail.modules || {}

/** Default path from which modules are loaded. */
Sail.modules.defaultPath = '/js/sail.js/modules/'

/** 
    Loads the given module into the current Sail app (`Sail.app`) using load.js' `load()`.
    
    @param {string} module - The name of the module. e.g. `"Rollcall.Authenticator"`
                             Should correspond to the module's filename under `Sail.modules.defaultPath` or 
                             or the `url` with the `.js` suffix removed.
    @param {object} [options] - Options to pass on to the module.
    @param {string} [url] - A URL where the module can be loaded from. By default, modules will be loaded from
                            the directory specified under `Sail.modules.defaultPath`. If the given `url` contains
                            only a path (starts with "/"), it will be made relative to `Sail.modules.defaultPath`.
                            
    @returns Returns `Sail.modules` to allow for chaining of `load()` calls.
    
    @see <a href="https://github.com/chriso/load.js">load.js</a>
*/
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
        
        if (options) {
            m.options = m.options || {}
            $.extend(m.options, options)
        }
        
        console.log("Loaded module "+module+" from "+url, m)
        
        for (event in m.events) {
            $(Sail.app).bind(event+"."+module, m.events[event])
            console.debug("Bound event "+event+"."+module)
        }
        
        // module's Sail events (events.sail) are bound in the Strophe.AutoConnector
        
        if (!Sail.modules.loaded)
            Sail.modules.loaded = []
        
        m.name = module
        Sail.modules.loaded.push(m)
        
        return true
    })
    
    return Sail.modules
}

/**
    Runs the given callback function after all of the preceeding `Sail.modules.load()` are done.
    
    Uses functionality from chain.js.
    
    @returns Returns `Sail.modules` to allow for chaining of `load()` calls.
*/
Sail.modules.thenRun = function(callback) {
    Sail.loader.thenRun(callback)
    return Sail.modules
}

/**
    Load the CSS file at the given URL into the current page.
    
    @param {string} url - The URL of the CSS file to load.
 */
Sail.loadCSS = function(url) {
    link = $('<link rel="stylesheet" type="text/css" />')
    link.attr('href', url)
    $('head').append(link)
}

/**
    @class 
    An event ocurring in the Sail space. Not to be confused with regular (local) JavaScript events.

    @desc
    Note that variables containing Sail.Events are usually named `sev` (for Sail Event) to 
    distinguish from regular JavaScript events (usually named `ev`).

    You would create a new Sail.Event object when you want to broadcast an event to the
    XMPP space, like so:

        sev = new Sail.Event('something_happened', {foo: "bar"})

    The optional meta parameter specifies metadata for the event. Normally values like `origin`,
    `timestamp`, and `run` are automatically added to the event, but you can specify them manually
    by providing these keys in the meta parameter.

    The Sail.app.event.sail handlers you define in your sail.js app will automatically
    convert incoming XMPP messages containing event data into Sail.Event objects. A Sail.Event
    object will be passed to your handler function.

    @constructor
    @param {string} type - The type of event you're creating. Event names should be all lowercase
                           with underscores for spaces.
    @param {object} payload - Can be just about any literal (string, number, etc.), but objects
                           (hashes) are generally used for complex data. 
    @param {object} [meta] - Optional object specifying metadata for the event.
    @param {string} [meta.origin=Sail.app.session.account.login] Identifies the author/source of this event.
    @param {string} [meta.timestamp=new Date()] The datetime when the event was generated.
    @param {string} [meta.run=Sail.app.run] An object identifying the Sail "run" that this event is part of.

    @example 
    // Send a Sail Event with some custom metadata:

    sev = new Sail.Event('something_happened', {foo: "bar"}, {origin: "some-agent"})
    Sail.app.groupchat.sendEvent(sev)
 */
Sail.Event = function(type, payload, meta) {
    meta = meta || {}
    
    if (!type && typeof type != 'string') {
        err = "Cannot create a Sail.Event without a type."
        console.error(err)
        throw err
    }
    
    this.eventType = type
    this.payload = payload
    
    this.timestamp = meta.timestamp || new Date()
    
    if (meta.origin)
        this.origin = meta.origin
    else if (meta.origin === undefined && Sail.app.session && Sail.app.session.account && Sail.app.session.account.login)
        this.origin = Sail.app.session.account.login
        
    if (meta.run)
        this.run = meta.run
    else if (meta.run === undefined && Sail.app.run)
        this.run = Sail.app.run
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
    
    /**
    @returns {string} JSON representation of this Sail Event.
     */
    toJSON: function() {
        return JSON.stringify({
            eventType: this.eventType,
            payload: this.payload,
            origin: this.origin,
            timestamp: this.timestamp,
            run: this.run
        })
    },
    
    /**
        @returns {string} Intelligently extracts and return the login name of the sender of this event
                          based on the source stanza's `from` property.
     */
    fromLogin: function() {
        var from = this.from
        if (!from || from.length == 0)
            return null
        
        var jidRegExp = /(.*?)@([a-zA-Z0-9\.\-]*)(?:\/(.*))?/
        
        fromParts = from.split("/")
        if (fromParts[1] && fromParts[1].match(jidRegExp))
            login = fromParts[1].match(jidRegExp)[1]
        else
            login = from.match(jidRegExp)[3] || from.match(jidRegExp)[1]
            
        // need to remove the random "~abcde" suffix sail.strophe.js automatically adds in case of nickname clash
        return login.replace(/~.+/,'')
    }
}


/**
    Automatically binds events to handlers based on the map provided in the given object's `events` key.

    This is run on a sail.js app as part of the initialization process.

    @params {object} obj - An object with an `events` key containing a map of event names and event handler functions.
    @params {object} [options.pre] - A function that will be called prior to the handler for ALL events.
    @params {object} [options.post] - A function that will be called after the handler for ALL events.

    @example
        MyApp = {
            events: {
                foo: function(ev) {
                    alert("'foo' was triggered!")
                }
            }
        }
    
        Sail.autobindEvents(MyApp)
    
        $(MyApp).trigger('foo')
        // the event handler defined for foo in MyApp.events will be called
 */
Sail.autobindEvents = function(obj, options) {
    var options = options || {}
    
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

/**
    Similar in principle to `Sail.autobindEvents` but deals with Sail events instead of regular JavaScript events.
    Unlike `Sail.autobindEvents` this method does not perform any event binding on the given object but rather
    returns a new function that can be passed to Sail.Strophe's `addStanzaHandler()`.
    
    Sail events should be mapped under the given object's `events.sail` key.
    
    @see Sail.autobindEvents
    @see Sail.Strophe.addStanzaHandler
    
    @example
        MyApp = {
            events: {
                sail: { 
                    someone_did_something: function(ev) {
                        alert("Someone did something in the XMPP space!")
                    }
                }
            }
        }
    
        handler = Sail.generateSailEventHandlerFromMap(MyApp)
        Sail.Strophe.addStanzaHandler(handler, null, null, 'chat')
        
        // incoming Sail events of type 'someone_did_something' will now
        // trigger the alert specified in MyApp.events.sail.someone_did_something
 */
Sail.generateSailEventHandlerFromMap = function(sailApp) {
    var handler = function(stanza) {
        msg = $(stanza)

        body = $(msg).children('body').text()
        sev = null
        try {
            data = JSON.parse(body)
        } catch(err) {
            console.log("couldn't parse message, ignoring: "+err)
            return
        }

        sev = new Sail.Event(data.eventType, data.payload, {
            origin: data.origin || null,
            timestamp: data.timestamp || null,
            run: data.run || null
        })
        
        sev.from = msg.attr('from')
        sev.to = msg.attr('to')
        sev.stanza = stanza
    
        if (!sailApp.events || !sailApp.events.sail)
            mapping = null
        else
            mapping = sailApp.events.sail[sev.eventType]
        
        if (mapping == null || typeof(mapping) == 'string') {
            if (mapping == null)
                eventName = sev.eventType
            else
                eventName = sailApp.events.sail[sev.eventType]
            
            events = $(sailApp).data('events')
            if (events && events[eventName]) // hacky way to check if a handler was bound for this event
                $(sailApp).trigger(eventName, sev)
            else
                console.debug("Module '"+sailApp.name+"' is ignoring event '"+eventName+"': ", sev)
                
        } else if (typeof(mapping) == 'function') {
            mapping(sev)
        } else {
            throw "Invalid mapping '"+mapping+"' for Sail event '"+sev.eventType+"'!"
        }

        return true // TODO: why are we returning true here? 
    }
    
    return handler
    //return $.proxy(handler, obj)
}

Sail.generateSailEventHandler = function(callback, eventType, origin, payload, run) {
    var handler = function(stanza) {
        var msg = $(stanza)

        var body = $(msg).children('body').text()
        var sev = null
        var data = null
        try {
            data = JSON.parse(body)
        } catch(err) {
            console.log("couldn't parse message, ignoring: "+err)
            return
        }
        
        if (sev.eventType == eventType &&
            (!origin  || sev.origin == origin) &&
            (!payload || Sail.objectMatchesTemplate(payload, sev.payload)) &&
            (!run || Sail.objectMatchesTemplate(run, sev.run))) {
                callback(sev)
        }
        
        return true // TODO: why are we returning true here? 
    }
    
    return handler
}

Sail.objectMatchesTemplate = function (obj, template, comparer) {
    if (!comparer) comparer = function(a,b) { return a == b }
    return _.all(_.keys(template), function(key) {
        return comparer(obj[key], template[key])
    })
}