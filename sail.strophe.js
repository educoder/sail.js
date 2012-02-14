/**
    @fileOverview
    Wrapper around strophe.js that adds some convenience and Sail-specific functionality.
*/

var Sail = window.Sail || {}

/** @namespace */
Sail.Strophe = {
    /** URL of the BOSH service we'll be connecting to. */
    bosh_url: null,
    /** JID to connect as (e.g. "somebody@somewhere.com"). */
    jid: null,
    /** Password to use during authentication with the XMPP server. */
    password: null,
    /** Data mode to use for serializing Sail events. Currently on 'json' is supported. */ 
    dataMode: 'json', // 'xml' || 'json'
    /**
        Log messages at a level lower than this will be ignored.
        @see Sail.Strophe.log
    */
    logLevel: Strophe.LogLevel.INFO,
    groupchats: [],
    
    /**
        Connect to the XMPP service using current Sail.Strophe settings.
        
        `Sail.Strophe.onConnect` is used as the strophe callback function.
        
        @see Sail.Strophe.bosh_url
        @see Sail.Strophe.jid
        @see Sail.Strophe.password
        @see Sail.Strophe.onConnect
    */
    connect: function() {
        if (!this.bosh_url) throw "No bosh_url set!"
        if (!this.jid) throw "No jid set!"
        if (!this.password) throw "No password set!"
        
        this.conn = new Strophe.Connection(this.bosh_url)
        
        // this.conn.xmlInput = function(data) {
        //     console.log("IN:", $(data).children()[0])
        // }
        // this.conn.xmlOutput = function(data) {
        //     console.log("OUT:", $(data).children()[0])
        // }
        
        Sail.Strophe.auto_reconnect = true
        Sail.Strophe.groupchats = []
        
        this.conn.connect(this.jid, this.password, this.onConnect)
    },
    
    /**
        Disconnect from the XMPP service.
        
        The connection is set to synchronous mode and any outstanding data is flushed
        before the disconnect is sent.
        
        Be careful when using this in 'onUnload' -- in WebKit-based browser the disconnect
        request doesn't always complete before the page is unloaded.
    */
    disconnect: function() {
        console.log("sending disconnect request...")
        
        // need to disable auto_reconnect to explicitly disconnect
        // Sail.Strophe.connect() automatically re-enables it
        Sail.Strophe.auto_reconnect = false
        
        Sail.Strophe.conn.sync = true
        Sail.Strophe.conn.flush()
        Sail.Strophe.conn.disconnect()
    },
    
    addStanzaHandler: function(handler, ns, name, type, id, from) {
        if (!Sail.Strophe.conn) throw "Must connect before you can add handlers"
        Sail.Strophe.conn.addHandler(function(stanza){handler(stanza);return true}, ns, name, type, id, from)
    },
    
    addOneoffStanzaHandler: function(handler, ns, name, type, id, from) {
        if (!Sail.Strophe.conn) throw "Must connect before you can add handlers"
        Sail.Strophe.conn.addHandler(function(stanza){handler(stanza);return false}, ns, name, type, id, from)
    },
    
    addErrorStanzaHandler: function(handler, type, condition) {
        Sail.Strophe.conn.addHandler(function(stanza, text){
            error = $(stanza).children('error').eq(0)
            
            if (type && $(error).attr('type') != type)
                return true // this error isn't of the desired type, so bail out
            
            if (condition && $(error).children(condition).length == 0)
                return true // this error doesn't contain the desired condition, so bail out
            
            text = error.children('text').text()
            handler(error, text)
        }, null, null, 'error')
    },
    
    pinger: function() {
        this.conn.ping.addPingHandler(function(ping) {
            console.log("GOT PING! sending pong...")
            Sail.Strophe.conn.ping.pong(ping)
        })
        
        // set up a pinger to keep the connection alive
        
        pingInterval = 14 * 1000 // default is 14 seconds
        this.conn.addTimedHandler(pingInterval, function() {
            console.log("SEDNING PING!")
            Sail.Strophe.conn.ping.ping(Strophe.getDomainFromJid(Sail.Strophe.conn.jid))
            return true
        })
    },
    
    bindDetacher: function() {
        Sail.Strophe.detacherAlreadyRan = false
        var onUnload = function() {
            if (Sail.Strophe.detacherAlreadyRan) {
                console.warn("Tried to run Sail.Strophe's onUnload by it has already ran!")
            } else {
                console.log("Running Sail.Strophe's onUnload...")
                
                // need to leave groupchats to get presence stanzas when we come back
                for (i = 0; i < Sail.Strophe.groupchats.length; i++) {
                    console.log("Leaving "+Sail.Strophe.groupchats[i].room+" before detaching...")
                    Sail.Strophe.groupchats[i].leave()
                }
                Sail.Strophe.conn.flush()
                
                Sail.Strophe.conn.pause() // prevent any further messages from being sent in order to freeze rid
                Sail.Strophe.storeConnInfo()
                Sail.Strophe.detacherAlreadyRan = true
            }
        }
        $(window).unload(onUnload)
        $(window).bind('beforeunload', onUnload)
    },
    
    /**
        Called by strophe.js at different stages in connecting to the XMPP service.
        Triggers the various `connect_` events.
        @private
    */
    onConnect: function (status, error) {
        switch (status) {
            case Strophe.Status.ERROR:
                console.error('CONNECTION ERROR: '+error)
                /**
                    Some general error occurred while trying to connect.
                    @event
                    @name Sail.Strophe.connect_error
                    @params {string} error - Foo
                    @see http://strophe.im/strophejs/doc/1.0.2/files2/strophe-js.html#Strophe.Connection_Status_Constants
                 */
                $(Sail.Strophe).trigger('connect_error', error)
                break
            case Strophe.Status.CONNECTING:
                console.log('CONNECTING to '+Sail.Strophe.bosh_url+' as '+Sail.Strophe.jid+'/'+Sail.Strophe.password)
                /**
                     The connection is currently being established.
                     @event
                     @name Sail.Strophe.connect_connecting
                     @see http://strophe.im/strophejs/doc/1.0.2/files2/strophe-js.html#Strophe.Connection_Status_Constants
                  */
                $(Sail.Strophe).trigger('connect_connecting')
                break
            case Strophe.Status.CONNFAIL:
                msg = 'CONNECTION as '+Sail.Strophe.jid+' FAILED BECAUSE: '
                console.error(msg, error)
                /**
                     The connection attempt failed, for example because the server rejected it.
                     @event
                     @name Sail.Strophe.connect_connfail
                     @param {string} error - Foo
                     @see http://strophe.im/strophejs/doc/1.0.2/files2/strophe-js.html#Strophe.Connection_Status_Constants
                  */
                $(Sail.Strophe).trigger('connect_connfail', error)
                break
            case Strophe.Status.AUTHENTICATING:
                console.log('AUTHENTICATING')
                /**
                     Connection credentials are being authenticated.
                     @event
                     @name Sail.Strophe.connect_authenticating
                     @see http://strophe.im/strophejs/doc/1.0.2/files2/strophe-js.html#Strophe.Connection_Status_Constants
                  */
                $(Sail.Strophe).trigger('connect_authenticating', error)
                break
            case Strophe.Status.AUTHFAIL:
                console.error("AUTHENTICATION as "+Sail.Strophe.jid+" FAILED: ", error)
                /**
                     Authentication with the XMPP server failed.
                     @event
                     @name Sail.Strophe.connect_authfail
                     @param {string} error - Foo
                     @see http://strophe.im/strophejs/doc/1.0.2/files2/strophe-js.html#Strophe.Connection_Status_Constants
                  */
                $(Sail.Strophe).trigger('connect_authfail', error)
                break
            case Strophe.Status.CONNECTED:
                console.log('CONNECTED to '+Sail.Strophe.bosh_url+' as '+Sail.Strophe.jid)

                Sail.Strophe.bindDetacher();
                Sail.Strophe.addDefaultXmppHandlers()
                /**
                     The connection has been successfully established.
                     @event
                     @name Sail.Strophe.connect_connected
                     @see http://strophe.im/strophejs/doc/1.0.2/files2/strophe-js.html#Strophe.Connection_Status_Constants
                  */
                $(Sail.Strophe).trigger('connect_connected', error)
                break
            case Strophe.Status.DISCONNECTED:
                /**
                     The connection has been terminated.
                     @event
                     @name Sail.Strophe.connect_disconnected
                     @see http://strophe.im/strophejs/doc/1.0.2/files2/strophe-js.html#Strophe.Connection_Status_Constants
                 */
                $(Sail.Strophe).trigger('connect_disconnected')
                
                if (Sail.Strophe.auto_reconnect) {
                    console.log("Attempting to automatically reconnect...")
                    Sail.Strophe.connect()
                }
                
                break
            case Strophe.Status.DISCONNECTING:
                /**
                     The connection is currently being terminated.
                     @event
                     @name Sail.Strophe.connect_disconnecting
                     @see http://strophe.im/strophejs/doc/1.0.2/files2/strophe-js.html#Strophe.Connection_Status_Constants
                 */
                $(Sail.Strophe).trigger('connect_disconnecting')
                console.log('DISCONNECTING...')
                break
            case Strophe.Status.ATTACHED:
                /**
                     The connection has been attached.
                     @event
                     @name Sail.Strophe.connect_attached
                     @see http://strophe.im/strophejs/doc/1.0.2/files2/strophe-js.html#Strophe.Connection_Status_Constants
                 */
                 
                 Sail.Strophe.bindDetacher();
                 Sail.Strophe.addDefaultXmppHandlers()
                 
                $(Sail.Strophe).trigger('connect_attached')
                break
            default:
                /**
                     The connection process has entered an unrecognized state.
                     This should never really happen.
                     @event
                     @name Sail.Strophe.connect_unknown
                     @see http://strophe.im/strophejs/doc/1.0.2/files2/strophe-js.html#Strophe.Connection_Status_Constants
                 */
                console.warn('UNKNOWN CONNECTION STATUS: '+status+', ERROR: '+error)
                $(Sail.Strophe).trigger('connect_unknown')
        }
    },
    
    /**
        Adds default handlers/behaviour to the current strophe connection,
        such as a default error stanza handler and a timed pinger.
    */
    addDefaultXmppHandlers: function() {
        Sail.Strophe.addErrorStanzaHandler(Sail.Strophe.defaultErrorStanzaHandler)
        Sail.Strophe.pinger()
    },
    
    /**
        The default error stanza handler. Prints out the error text and object to the console.
     */
    defaultErrorStanzaHandler: function(error, text) {
        console.error("XMPP ERROR: ", text, error)
        return true
    },
    
    /**
        Log some text messsage at the given level (DEBUG, INFO, WARN, ERROR, FATAL) optionally with some additional data.
        @param {string} level - The level/importance of this message. Should be a Strophe.LogLevel constant.
        @param {string} message - The message to log.
        @param [data] - Some additional data to log with the message. Can be a complex type like an object.
        
        @see http://strophe.im/strophejs/doc/1.0.2/files2/strophe-js.html#Strophe.Log_Level_Constants
    */
    log: function(level, message, data) {
        switch(level) {
            case Strophe.LogLevel.DEBUG:
                logFunc = 'debug'
                logMsg = "DEBUG: "+message
                break
            case Strophe.LogLevel.INFO:
                logFunc = 'info'
                logMsg = "INFO: "+message
                break
            case Strophe.LogLevel.WARN:
                logFunc = 'warn'
                logMsg = "WARN: "+message
                break
            case Strophe.LogLevel.ERROR:
                logFunc = 'error'
                logMsg = "ERROR: "+message
                break
            case Strophe.LogLevel.FATAL:
                logFunc = 'error'
                logMsg = "FATAL: "+message
                break
            default:
                logFunc = 'log'
                logMsg = message
                break
        }
        
        if (Sail.Strophe.logLevel <= level)
            console[logFunc](logMsg, data)
    },
    
    
    // The following methods could potentially be used
    // to implement conn.attach() behaviour. Currently
    // they are unused.
    
    storeConnInfo: function() {
        $.cookie('Sail.jid', Sail.Strophe.conn.jid)
        $.cookie('Sail.sid', Sail.Strophe.conn.sid)
        $.cookie('Sail.rid', Sail.Strophe.conn.rid)
    },
    
    retrieveConnInfo: function() {
        return {
            jid: $.cookie('Sail.jid'),
            sid: $.cookie('Sail.sid'),
            rid: $.cookie('Sail.rid')
        }
    },
    
    clearConnInfo: function() {
        $.cookie('Sail.jid', null)
        $.cookie('Sail.sid', null)
        $.cookie('Sail.rid', null)
    },
    
    hasExistingConnInfo: function() {
        info = Sail.Strophe.retrieveConnInfo()
        return info.jid && info.rid && info.sid
    },
    
    reconnect: function() {
        if (!Sail.Strophe.bosh_url) throw "No bosh_url set!"
        
        info = Sail.Strophe.retrieveConnInfo()
        
        Sail.Strophe.conn = new Strophe.Connection(Sail.Strophe.bosh_url)
        
        console.log('REATTACHING TO '+Sail.Strophe.bosh_url+'WITH: ', info)
        Sail.Strophe.conn.attach(info.jid, info.sid, info.rid + 1, this.onConnect)
    },
}

Sail.Strophe.Groupchat = function(room, resource, conn) {
    this.room = room
    this.conn = conn || Sail.Strophe.conn
    this.resource = resource || Sail.Strophe.jid
    
    if (!this.conn)
        throw "No connection given for Groupchat!"
}

Sail.Strophe.Groupchat.prototype = {
    
    participants: {},
    
    join: function() {
        if (this.joined) {
            console.error("Room '"+this.room+"' is already joined... cannot join again.")
        } else {
            console.log("Joining "+this.room+" as "+this.jid())

            pres = $pres({to: this.jid()}).c('x', {xmlns: 'http://jabber.org/protocol/muc'})
            this.conn.send(pres.tree())

            this.addDefaultNicknameConflictHandler()
            this.addDefaultPresenceHandlers()
            
            Sail.Strophe.groupchats.push(this)
        }
    },
    
    leave: function() {
        if (this.joined) {
            console.log("Leaving "+this.room+" as "+this.jid())

            pres = $pres({to: this.jid(), type: 'unavailable'}).c('x', {xmlns: 'http://jabber.org/protocol/muc'})
                
            this.conn.send(pres.tree())
            
            idx = Sail.Strophe.groupchats.indexOf(this)
            if (idx >= 0)
                Sail.Strophe.groupchats.splice(idx, 1)
        } else {
            console.error("Cannot leave '"+this.room+"' because it has not yet been joined.")
        }
    },
    
    jid: function() {
        return this.room + "/" + this.resource
    },
    
    sendEvent: function(event) {
        if (Sail.app.allowRunlessEvents === false && !event.run) {
            err = "Cannot create a Sail.Event without a run because this Sail app does not allow runless events!"
            console.error(err)
            throw err
        }
        
        /*if (Sail.Strophe.dataMode == 'xml')
            this.sendXML(event.toXML())
        else*/ if (Sail.Strophe.dataMode == 'json')
            this.sendJSON(event.toJSON())
        else // FIXME: this isn't really right...
            this.sendText(event)
    },
    
    sendXML: function(xml) {
        msg = $msg({to: this.room, type: 'groupchat'}).c('body').cnode($(xml)[0])
        this.conn.send(msg.tree())
    },
    
    sendText: function(text) {
        msg = $msg({to: this.room, type: 'groupchat'}).c('body').t(text)
        this.conn.send(msg.tree())
    },
    
    sendJSON: function(json) {
        if (typeof json == "string")
            json_string = json
        else
            json_string = JSON.stringify(json)
        
        msg = $msg({to: this.room, type: 'groupchat'}).c('body').t(json_string)
        this.conn.send(msg.tree())
    },
    
    addEventHandler: function(handler, eventType, origin, payload, run) {
        return this.addGroupchatStanzaHandler(Sail.generateSailEventHandler(handler, eventType, origin, payload, run))
    },
    
    addOneoffEventHandler: function(handler, eventType, origin, payload, run) {
        var handlerRef
        var conn = this.conn
        if (!conn) throw "Must connect before you can add handlers"
        var selfDeletingHandler = function(sev) {
            handler(sev)
            conn.deleteHandler(handlerRef)
        }
        var sailEventHandler = Sail.generateSailEventHandler(selfDeletingHandler, eventType, origin, payload, run)
        handlerRef = this.addGroupchatStanzaHandler(sailEventHandler)
        return handlerRef
    },
    
    addGroupchatStanzaHandler: function(handler, ns, name, id, from) {
        if (!this.conn) throw "Must connect before you can add handlers"
        return this.conn.addHandler(function(stanza){handler(stanza);return true}, ns, name, "groupchat", id, from)
    },
    
    addOneoffGroupchatStanzaHandler: function(handler, ns, name, id, from) {
        if (!this.conn) throw "Must connect before you can add handlers"
        return this.conn.addHandler(function(stanza){handler(stanza);return false}, ns, name, "groupchat", id, from)
    },
    
    addParticipantJoinedHandler: function(handler) {
        return this.conn.addHandler(function(stanza){
                if ($(stanza).attr('type') != null)
                    return true // doesn't seem to be a way to do this at addHandler's filter level
                who = $(stanza).attr('from')
                handler(who, stanza)
                return true
            }, null, "presence", null, null, this.room, {matchBare: true})
    },
    
    addParticipantLeftHandler: function(handler) {
        return this.conn.addHandler(function(stanza){
                who = $(stanza).attr('from')
                handler(who, stanza)
                return true
            }, null, "presence", "unavailable", null, this.room, {matchBare: true})
    },
    
    addSelfJoinedHandler: function(handler) {
        return this.conn.addHandler(function(stanza){
                if ($(stanza).attr('type') != null)
                    return true // doesn't seem to be a way to do this at addHandler's filter level
                handler(stanza)
                return true
            }, null, "presence", null, null, this.jid())
    },
    
    addSelfLeftHandler: function(handler) {
        return this.conn.addHandler(function(stanza){
                handler(stanza)
                return true
            }, null, "presence", "unavailable", null, this.jid())
    },
    
    addDefaultNicknameConflictHandler: function() {
        chat = this
        
        chat.conn.addHandler(function(stanza, text) {
            error = $(stanza).children('error').eq(0)
            
            // we're looking for errors of type 'cancel' with a 'conflict' element
            if ($(error).attr('type') != 'cancel' || $(error).children('conflict').length == 0)
                return true // not what we're looking for, ignore it
            
            newNick = chat.resource+'~'+Math.floor((Math.random()*1e7)).toString(25)
            
            console.warn("Nickname '"+chat.resource+"' is already taken in '"+chat.room+"'. Will try to join as '"+newNick+"'.")
            
            chat.resource = newNick
            chat.join()
            
            return true
        }, null, null, 'error')
    },
    
    addDefaultPresenceHandlers: function() {
        chat = this
        
        this.addParticipantJoinedHandler(function(who, stanza) {
            chat.participants[who] = who
            console.log(who+" JOINED "+chat.room)
        })
        
        this.addParticipantLeftHandler(function(who, stanza) {
            delete chat.participants[who]
            console.log(who+" LEFT "+chat.room)
        })
        
        this.addSelfJoinedHandler(function(who, stanza) {
            chat.joined = true
            console.log("JOINED "+chat.room)
        })
        
        this.addSelfLeftHandler(function(who, stanza) {
            console.log("LEFT "+chat.room)
        })
    },
}


Strophe.log = Sail.Strophe.log
