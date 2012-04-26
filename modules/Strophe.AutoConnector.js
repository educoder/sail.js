/*jshint browser: true, devel: true */
/*globals Strophe, Sail, jQuery */

Strophe.AutoConnector = (function() {
    var self = {};

    function showConnecting () {
        var connecting = jQuery('<div id="connecting" />');
        connecting.append('<img src="loader.gif" alt="..." />');
        connecting.append('<p>Connecting...</p>');
        
        jQuery('body').append(connecting);
    }
    
    function hideConnecting () {
        jQuery('#connecting').remove();
    }
    
    function connectSuccess (ev) {
        var groupchatRoom = Sail.app.groupchatRoom || Sail.app.run.name + '@conference.' + Sail.app.xmppDomain;
        Sail.app.groupchat = new Sail.Strophe.Groupchat(groupchatRoom);
        
        var sailHandler = Sail.generateSailEventHandlerFromMap(Sail.app);
        Sail.app.groupchat.addGroupchatStanzaHandler(sailHandler);
        
        for (var mod in Sail.modules.loaded) {
            var modSailHandler = Sail.generateSailEventHandlerFromMap(Sail.modules.loaded[mod]);
            Sail.app.groupchat.addGroupchatStanzaHandler(modSailHandler);
        }

        Sail.app.groupchat.addSelfJoinedHandler(function(pres) {
            jQuery(Sail.app).trigger('selfJoined');
            
            hideConnecting();
            jQuery(Sail.app).trigger('connected');
        });
        
        Sail.app.groupchat.join();
    }
    
    function attachSuccess (ev) {
        var info = Sail.Strophe.retrieveConnInfo();
        Sail.Strophe.jid = info.jid;
        
        var groupchatRoom = Sail.app.groupchatRoom || Sail.app.run.name + '@conference.' + Sail.app.xmppDomain;
        Sail.app.groupchat = new Sail.Strophe.Groupchat(groupchatRoom);
        
        var sailHandler = Sail.generateSailEventHandlerFromMap(Sail.app);
        Sail.app.groupchat.addGroupchatStanzaHandler(sailHandler);
        
        for (var mod in Sail.modules.loaded) {
            var modSailHandler = Sail.generateSailEventHandlerFromMap(Sail.modules.loaded[mod]);
            Sail.app.groupchat.addGroupchatStanzaHandler(modSailHandler);
        }

        Sail.app.groupchat.addSelfJoinedHandler(function(pres) {
            jQuery(Sail.app).trigger('selfJoined');
            
            Strophe.AutoConnector.hideConnecting();
            jQuery(Sail.app).trigger('connected');
        });
        
        Sail.app.groupchat.join();
    }
    
    function connectFailure (ev, error) {
        jQuery('#connecting p').text("Connection Failure!");
        alert("CONNECTION FAILED TO XMPP SERVER AS "+Sail.Strophe.jid+" BECAUSE: "+error+" ("+ev.type+")");
    }
    
    function connectDisconnected (ev) {
        // do nothing for now
    }

    self.events = {
        initialized: function() {
            Sail.loadCSS(Sail.modules.PATH + 'Strophe.AutoConnector.css');
            
            Sail.Strophe.bosh_url = '/http-bind/';
            
            jQuery(Sail.Strophe).bind({
                connect_error:      connectFailure,
                connect_connfail:   connectFailure,
                connect_authfail:   connectFailure,
                connect_unknown:    connectFailure,
                connect_disconnected: connectDisconnected,
                connect_connected:  connectSuccess,
                connect_attached: attachSuccess
            });
            
            showConnecting();
        },
        
        authenticated: function() {
            if (Sail.app.run)
                Sail.app.groupchatRoom = Sail.app.run.name+'@conference.'+Sail.app.xmppDomain;
            
            var session = Sail.app.session;
            
            console.log("Authenticated as: ", session.account.login, session.account.encrypted_password);
            
            Sail.Strophe.jid = session.account.login + '@' + Sail.app.xmppDomain;
            Sail.Strophe.password = session.account.encrypted_password;

            Sail.app.token = Sail.app.rollcall.getCurrentToken();
            
            if (Sail.app.token && Sail.Strophe.hasExistingConnInfo()) {
                // try reattaching
                Sail.Strophe.reconnect();
            } else {
                Sail.Strophe.connect();
            }
        },
        
        unauthenticated: function() {
            Sail.Strophe.disconnect();
        }
    };

    return self;
})();