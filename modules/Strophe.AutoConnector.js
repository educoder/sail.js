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

    function showConnecting (text) {
        var connecting = jQuery('#connecting');
        if (connecting.length > 0) {
            connecting.find('.message').text(text);
            connecting.css('opacity', 1.0);
        } else {
            connecting = jQuery('<div id="connecting" />');
            container = jQuery('<div></div>');
            connecting.append(container);
            ajaxSpinner = '<div id="connecting-anim">';
            ajaxSpinner += '<div id="circleG_1" class="circleG"></div>';
            ajaxSpinner += '<div id="circleG_2" class="circleG"></div>';
            ajaxSpinner += '<div id="circleG_3" class="circleG"></div>';
            ajaxSpinner += '</dvi>';
            container.append(ajaxSpinner);
            container.append('<p class="message">'+(text ? text : "Connecting...")+'</p>');
            jQuery('body').append(connecting);
        }
    }
    
    function hideConnecting () {
        jQuery('#connecting').css('opacity', 0.0);
        setTimeout(function () {
            jQuery('#connecting').remove();
        }, 201);
    }
    
    function connectSuccess (ev) {
        var groupchatRoom = Sail.app.groupchatRoom || Sail.app.run.name + '@conference.' + Sail.app.config.xmpp.domain;
        Sail.app.groupchat = new Sail.Strophe.Groupchat(groupchatRoom, Sail.app.nickname || null);
        
        var sailHandler = Sail.generateSailEventHandlerFromMap(Sail.app);
        Sail.app.groupchat.addGroupchatStanzaHandler(sailHandler);
        
        for (var mod in Sail.modules.loaded) {
            var modSailHandler = Sail.generateSailEventHandlerFromMap(Sail.modules.loaded[mod]);
            Sail.app.groupchat.addGroupchatStanzaHandler(modSailHandler);
        }

        Sail.app.groupchat.addSelfJoinedHandler(function(pres) {
            console.log("Joined groupchat as '"+Sail.app.groupchat.jid()+"' : ", pres);
            jQuery(Sail.app).trigger('selfJoined');
            
            hideConnecting();
            jQuery(Sail.app).trigger('connected');
        });
        
        Sail.app.groupchat.join();
    }
    
    function attachSuccess (ev) {
        var info = Sail.Strophe.retrieveConnInfo();
        Sail.Strophe.jid = info.jid;
        
        var groupchatRoom = Sail.app.groupchatRoom || Sail.app.run.name + '@conference.' + Sail.app.config.xmpp.domain;
        Sail.app.groupchat = new Sail.Strophe.Groupchat(groupchatRoom, Sail.app.nickname || null);
        
        var sailHandler = Sail.generateSailEventHandlerFromMap(Sail.app);
        Sail.app.groupchat.addGroupchatStanzaHandler(sailHandler);
        
        for (var mod in Sail.modules.loaded) {
            var modSailHandler = Sail.generateSailEventHandlerFromMap(Sail.modules.loaded[mod]);
            Sail.app.groupchat.addGroupchatStanzaHandler(modSailHandler);
        }

        Sail.app.groupchat.isJoined(
            // yes
            function () {
                console.log("Already in groupchat...");
                jQuery(Sail.app).trigger('selfJoined');
                
                hideConnecting();
                jQuery(Sail.app).trigger('connected');
            },
            // no
            function () {
                console.log("Need to rejoin groupchat ", Sail.app.groupchat.room);
                Sail.app.groupchat.addSelfJoinedHandler(function(pres) {
                    console.log("Already in groupchat...");
                    jQuery(Sail.app).trigger('selfJoined');
                    
                    hideConnecting();
                    jQuery(Sail.app).trigger('connected');
                });

                Sail.app.groupchat.join();
            }
        );
    }
    
    function connectFailure (ev, error) {
        jQuery('#connecting p').text("Connection Failure!");
        Sail.Strophe.clearConnInfo();
        console.error("CONNECTION FAILED TO XMPP SERVER AS "+Sail.Strophe.jid+" BECAUSE: "+error+" ("+ev.type+")");

        showConnecting('CONNECTION FAILED!');
    }
    
    function connectDisconnected (ev) {
        console.warn("DISCONNECTED FROM "+Sail.Strophe.jid);
        showConnecting('DISCONNECTED!');
    }

    self.events = {
        initialized: function() {
            Sail.loadCSS(Sail.modules.PATH + 'Strophe.AutoConnector.css');
            
            if (Sail.app.config.xmpp.url.match(/^ws/)) {
                // we're using Websockets
                Sail.Strophe.xmppUrl = Sail.app.config.xmpp.url;
            } else {
                // we're using BOSH, so go through local reverse proxy
                Sail.Strophe.xmppUrl = "/http-bind";
            }
            
            
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
                Sail.app.groupchatRoom = Sail.app.run.name+'@conference.'+Sail.app.config.xmpp.domain;
            
            if (self.options.mode === 'anon' || self.options.mode === 'pseudo-anon') {
                
                if (self.options.mode === 'pseudo-anon') {
                    Sail.Strophe.jid = Sail.app.username + '@' + Sail.app.config.xmpp.domain;
                    Sail.Strophe.password = Sail.app.password;
                } else {
                    Sail.Strophe.jid = Sail.app.config.xmpp.domain;
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
                Sail.Strophe.jid = session.account.login + '@' + Sail.app.config.xmpp.domain;
                Sail.Strophe.password = session.account.encrypted_password;

                Sail.app.token = Sail.app.rollcall.getCurrentToken();
                
                // screw this... lets just switch to WebSockets
                //if (Sail.app.token && Sail.Strophe.hasExistingConnInfo()) {
                    // try reattaching
                //    Sail.Strophe.reconnect();
                //} else {
                    Sail.Strophe.connect();
                //}
            }
        },
        
        unauthenticated: function() {
            Sail.Strophe.disconnect();
        },


        connection_lost: function () {
            console.log("Attempting to automatically reconnect...")
            //Sail.Strophe.reconnect()

            showConnecting("Reconnecting...");

            Sail.Strophe.connect();
        }
    };

    return self;
})();