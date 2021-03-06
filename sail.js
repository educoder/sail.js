/*jshint browser: true, devel: true, evil: true, loopfunc: true */
/*globals jQuery, _ */

/**
    @fileOverview
    Core sail.js functionality.
*/

/** @namespace **/
window.Sail = window.Sail || {};

(function (Sail) {

    Sail.JS_ROOT_PATH = Sail.JS_ROOT_PATH || 'js/sail.js';

    /** Prevents errors in case console/firebug is not available */
    function stubConsole() {
        if (!window.console) {
            /** @ignore */
            var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml",
            "group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];

            window.console = {};
            for (var i = 0; i < names.length; ++i)
                window.console[names[i]] = function() {};
        }
    } 

    stubConsole();

    /**
        Loads the base requirements for a Sail app using chain.js and load.js.
        Also initializes `Sail.loader` which can be used for furter `load()` calls.
        
        @see <a href="https://github.com/chriso/load.js">load.js</a>
    */
    Sail.load = function () {
        Sail.loader = 
            load(Sail.JS_ROOT_PATH+'/deps.base.Bundle.new.js')
            .then(Sail.JS_ROOT_PATH+'/sail.strophe.js',
                  Sail.JS_ROOT_PATH+'/sail.ui.js');
                    
        return Sail.loader;
    };

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
    Sail.init = function (app, opts) {
        Sail.app = app;
        Sail.loader
            .thenRun(function() {
                Sail.app.loadConfig();
                Sail.app.init();

                if (Sail.app.allowRunlessEvents === undefined)
                    Sail.app.allowRunlessEvents = true;
                
                if (Sail.app.phonegap) {
                    // NOTE: need to use addEventListener() here instead of jQuery's bind()
                    //       ... not sure why bind() doesn't work -- probably a phonegap quirk
                    document.addEventListener('deviceready', Sail.app.phonegap, false);
                }
                
                return true;
            }).thenRun(function() {
                Sail.UI.init();
                return true;
            }).thenRun(function () {
                console.log("Sail is initialized.");
                Sail.app.trigger('initialized');
                return true;
            });
        
        return true;
    };

    /**
        Verifies the given Sail app configuration based on the required conifg.
        The path argument is used internally in recursion and can be omitted.
    */
    Sail.verifyConfig = function(config, required, path) {
        var curPath = path || null;

        _.each(_.keys(required), function (req) {
            if (typeof required[req] == 'object') {
                Sail.verifyConfig(config[req], required[req], (curPath ? curPath + "." : "") + req);
            } else {
                var err;
                if (!config) {
                    err = "Missing configuration value for key '"+curPath+"'! Check your config.json";
                } else if (!config[req]) {
                    err = "Missing configuration value for key '"+curPath+"."+req+"'! Check your config.json";
                } else if (typeof config[req] != required[req]) {
                    err = "Configuration value for '"+req+"' must be a "+(typeof required[req])+" but is a "+(typeof config[req])+"! Check your config.json";
                }

                if (err) {
                    console.error(err);
                    throw err;
                }
            }
        });
    };


    /** 
        Manages loadable modules. 
        @namespace
    */
    Sail.modules = Sail.modules || {};

    /** 
        Loads the given module into the current Sail app (`Sail.app`) using load.js' `load()`.
        
        @param {string} module - The name of the module. e.g. `"Rollcall.Authenticator"`
                                 Should correspond to the module's filename under `Sail.modules.PATH` or 
                                 or the `url` with the `.js` suffix removed.
        @param {object} [options] - Options to pass on to the module.
        @param {string} [url] - A URL where the module can be loaded from. By default, modules will be loaded from
                                the directory specified under `Sail.modules.PATH`. If the given `url` contains
                                only a path (starts with "/"), it will be made relative to `Sail.modules.PATH`.
                                
        @returns Returns `Sail.modules` to allow for chaining of `load()` calls.
        
        @see <a href="https://github.com/chriso/load.js">load.js</a>
    */
    Sail.modules.load = function(module, options, url) {
        Sail.modules.PATH = Sail.modules.PATH || Sail.JS_ROOT_PATH+'/modules/';

        if (typeof options == 'string') {
            url = options;
            options = undefined;
        }
        
        if (url) {
            if (url.indexOf('/') < 0)
                url = Sail.modules.PATH + url;
        } else {
            url = Sail.modules.PATH + module + '.js';
        }
        
        Sail.loader.load(url).thenRun(function() {
            var m = eval(module);
            
            if (options) {
                m.options = m.options || {};
                jQuery.extend(m.options, options);
            }
            
            console.log("Loaded module "+module+" from "+url, m);
            
            _.each(m.events, function (handler, event) {
                jQuery(Sail.app).bind(event+"."+module, handler);
                console.debug("Bound event "+event+"."+module);
            });
            
            // module's Sail events (events.sail) are bound in the Strophe.AutoConnector
            
            if (!Sail.modules.loaded)
                Sail.modules.loaded = [];
            
            m.name = module;
            Sail.modules.loaded.push(m);
            
            return true;
        });
        
        return Sail.modules;
    };

    /**
        Runs the given callback function after all of the preceeding `Sail.modules.load()` are done.
        
        Uses functionality from chain.js.
        
        @returns Returns `Sail.modules` to allow for chaining of `load()` calls.
    */
    Sail.modules.thenRun = function (callback) {
        Sail.loader.thenRun(callback);
        return Sail.modules;
    };

    /**
        Load the CSS file at the given URL into the current page.
        
        @param {string} url - The URL of the CSS file to load.
     */
    Sail.loadCSS = function (url) {
        var link = jQuery('<link rel="stylesheet" type="text/css" />');
        link.attr('href', url);
        jQuery('head').append(link);
    };

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
    Sail.Event = function (type, payload, meta) {
        meta = meta || {};
        
        var err;
        if (!type && typeof type != 'string') {
            err = "Cannot create a Sail.Event without a type.";
            console.error(err);
        }
        
        this.eventType = type;
        this.payload = payload;
        
        this.timestamp = meta.timestamp || new Date();
        
        if (meta.origin)
            this.origin = meta.origin;
        else if (meta.origin === undefined && Sail.app.session && Sail.app.session.account && Sail.app.session.account.login)
            this.origin = Sail.app.session.account.login;
            
        if (meta.run)
            this.run = meta.run;
        else if (meta.run === undefined && Sail.app.run)
            this.run = Sail.app.run;
    };
    
    Sail.Event.prototype = {
        // FIXME: this needs to be reworked
        // toXML: function() {
        //     // hack using jQuery to build the XML
        //     xml = jQuery("<xml />")
        //     ev = jQuery('<event />')
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
            });
        },
        
        /**
            @returns {string} Intelligently extracts and return the login name of the sender of this event
                              based on the source stanza's `from` property.
         */
        fromLogin: function() {
            var from = this.from;
            if (!from || from.length === 0)
                return null;
            
            var jidRegExp = /(.*?)@([a-zA-Z0-9\.\-]*)(?:\/(.*))?/;
            
            var fromParts = from.split("/");
            var login;
            if (fromParts[1] && fromParts[1].match(jidRegExp))
                login = fromParts[1].match(jidRegExp)[1];
            else
                login = from.match(jidRegExp)[3] || from.match(jidRegExp)[1];
                
            // need to remove the random "~abcde" suffix sail.strophe.js automatically adds in case of nickname clash
            return login.replace(/~.+/,'');
        }
    };


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
        
            jQuery(MyApp).trigger('foo')
            // the event handler defined for foo in MyApp.events will be called
     */
    Sail.autobindEvents = function(obj, options) {
        options = options || {};
        var events = obj.events;
        
        for (var ev in events) {
            if (events.hasOwnProperty(ev) && typeof events[ev] == 'function') {
                console.debug("Sail: auto-binding event '"+ev+"'");
                try {
                    if (options.pre)
                      jQuery(obj).bind(ev, jQuery.proxy(options.pre, Sail.app));
                    jQuery(obj).bind(ev, jQuery.proxy(events[ev], Sail.app));
                    if (options.post)
                      jQuery(obj).bind(ev, jQuery.proxy(options.post, Sail.app));
                } catch(e) {
                    alert("Sail: failed to auto-bind event! '"+ev+"' may be a reserved word.");
                    throw e;
                }
            }
        }
    };

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
            var msg = jQuery(stanza);

            var body = jQuery(msg).children('body').text();
            var data;
            try {
                data = JSON.parse(body);
            } catch(err) {
                console.log("couldn't parse message, ignoring: "+err);
                return;
            }

            var sev = new Sail.Event(data.eventType, data.payload, {
                origin: data.origin || null,
                timestamp: data.timestamp || null,
                run: data.run || null
            });
            
            sev.from = msg.attr('from');
            sev.to = msg.attr('to');
            sev.stanza = stanza;
        
            var mapping;
            if (!sailApp.events || !sailApp.events.sail)
                mapping = null;
            else
                mapping = sailApp.events.sail[sev.eventType];
            
            var eventName;
            if (mapping === undefined || mapping === null || typeof(mapping) == 'string') {
                if (mapping === undefined || mapping === null)
                    eventName = sev.eventType;
                else
                    eventName = sailApp.events.sail[sev.eventType];
                
                var events = jQuery(sailApp).data('events');
                if (events && events[eventName]) // hacky way to check if a handler was bound for this event
                    sailApp.trigger(eventName, sev);
                else
                    console.debug("Module '"+sailApp.name+"' is ignoring event '"+eventName+"': ", sev);
                    
            } else if (typeof(mapping) == 'function') {
                jQuery.proxy(mapping, Sail.app)(sev);
            } else {
                console.error("Invalid mapping '"+mapping+"' for Sail event '"+sev.eventType+"'!");
            }

            return true; // TODO: why are we returning true here? 
        };
        
        return handler;
        //return jQuery.proxy(handler, obj)
    };

    Sail.generateSailEventHandler = function(callback, eventType, origin, payload, run) {
        var handler = function(stanza) {
            var msg = jQuery(stanza);

            var body = jQuery(msg).children('body').text();
            var sev = null;
            var data = null;
            try {
                data = JSON.parse(body);
            } catch(err) {
                console.log("couldn't parse message, ignoring: "+err);
                return;
            }
            
            sev = new Sail.Event(data.eventType, data.payload, {
                origin: data.origin || null,
                timestamp: data.timestamp || null,
                run: data.run || null
            });
            
            sev.from = msg.attr('from');
            sev.to = msg.attr('to');
            sev.stanza = stanza;
            
            if (sev.eventType == eventType &&
                (!origin  || sev.origin == origin) &&
                (!payload || Sail.objectMatchesTemplate(payload, sev.payload)) &&
                (!run || Sail.objectMatchesTemplate(run, sev.run))) {
                    callback(sev);
            }
            
            return true; // TODO: why are we returning true here? 
        };
        
        return handler;
    };

    /**
        Returns true if all properties in obj match all properties in template
        based on the comparer function. If comparer is omitted, == is used by default.
    */
    Sail.objectMatchesTemplate = function (obj, template, comparer) {
        if (!comparer) comparer = function(a,b) { return a == b; };
        return _.all(_.keys(template), function(key) {
            return comparer(obj[key], template[key]);
        });
    };

    Sail.getURLParameter = function (name) {
        return decodeURIComponent(
            (location.search.match(RegExp("[?|&]"+name+'=(.+?)(&|$)'))||[,null])[1]
        );  
    };

    Sail.App = function () {
        var app = this;

        app.on = function (event, callback) {
            jQuery(this).on(event, callback);
            return this;
        };
        app.bind = this.on;
        app.off = function (event) {
            jQuery(this).unbind(event);
            return this;
        };
        app.off = this.off;
        app.trigger = function (event, args) {
            jQuery(this).trigger.apply(jQuery(this), arguments);
            return this;
        };

        /**
        Retrieves a JSON config file from "/config.json" and configures
        the given Sail app accordingly.
        */
        app.loadConfig = function() {
            var configUrl = '/config.json';
            jQuery.ajax(
                {
                    url: configUrl, 
                    dataType: 'json',
                    async: false,
                    cache: false,
                    success: function(data) {
                        app.config = data;
                    },
                    error: function(xhr, code, error) {
                        console.error("Couldn't load `"+configUrl+"`: ", code, error, xhr);
                        alert("Couldn't load `"+configUrl+"` because:\n\n"+error+" ("+code+")");
                    }
                }
            );
        };
    };

})(window.Sail);




