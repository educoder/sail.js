/*jshint browser: true, devel: true */
/*globals Strophe, Sail, jQuery */

Strophe.AutoConnector = (function() {
    var self = {};

    /**
     * `mode` can be:
     *   'session': (default) uses Sail.app.session to authenticate; works with Rollcall.Authenticator
     *   'anon': anonymous mode with no username/password (XMPP server must be set to anonymous auth)
     *   'pseudo-anon': pseudo-anonymous mode, uses a single account to connect; the username and
     *                  password provided under Sail.app.username and Sail.app.password
     */
    self.options = {
        mode: 'session'
    };

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
        Sail.app.groupchat = new Sail.Strophe.Groupchat(groupchatRoom, Sail.app.nickname || null);
        
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
        Sail.app.groupchat = new Sail.Strophe.Groupchat(groupchatRoom, Sail.app.nickname || null);
        
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
            
            if (self.options.mode === 'anon' || self.options.mode === 'pseudo-anon') {
                
                if (self.options.mode === 'pseudo-anon') {
                    Sail.Strophe.jid = Sail.app.username + '@' + Sail.app.xmppDomain;
                    Sail.Strophe.password = Sail.app.password;
                } else {
                    Sail.Strophe.jid = Sail.app.xmppDomain;
                    Sail.Strophe.password = "";
                }

                var haveNickname = function (nickname) {
                    Sail.app.nickname = nickname;
                
                    // if (Sail.Strophe.hasExistingConnInfo()) {
                    //     Sail.Strophe.reconnect();
                    // } else {
                        Sail.Strophe.connect();
                    // }
                };

                if (Sail.app.requestNickname) {
                    Sail.app.requestNickname(haveNickname);
                } else {
                    var nickname = prompt("Enter your name:");
                    haveNickname(nickname);
                }
            } else {
                var session = Sail.app.session;
                
                console.log("Authenticated as: ", session.account.login, session.account.encrypted_password);
                
                Sail.app.nickname = session.account.login;
                Sail.Strophe.jid = session.account.login + '@' + Sail.app.xmppDomain;
                Sail.Strophe.password = session.account.encrypted_password;

                Sail.app.token = Sail.app.rollcall.getCurrentToken();
                
                if (Sail.app.token && Sail.Strophe.hasExistingConnInfo()) {
                    // try reattaching
                    Sail.Strophe.reconnect();
                } else {
                    Sail.Strophe.connect();
                }
            }
        },
        
        unauthenticated: function() {
            Sail.Strophe.disconnect();
        }
    };

    return self;
})();