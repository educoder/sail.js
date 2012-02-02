Strophe.AutoConnector = {
    events: {
        initialized: function() {
            Sail.loadCSS(Sail.modules.defaultPath + 'Strophe.AutoConnector.css')
            
            // 
            $(Sail.Strophe).bind({
                connect_error:      Strophe.AutoConnector.connectFailure,
                connect_connfail:   Strophe.AutoConnector.connectFailure,
                connect_authfail:   Strophe.AutoConnector.connectFailure,
                connect_unknown:    Strophe.AutoConnector.connectFailure,
                connect_disconnected: Strophe.AutoConnector.connectDisconnected,
                connect_connected:  Strophe.AutoConnector.connectSuccess
            })
            
            Strophe.AutoConnector.showConnecting()
        },
        
        authenticated: function() {
            if (Sail.app.run)
                Sail.app.groupchatRoom = Sail.app.run.name+'@conference.'+Sail.app.xmppDomain
            
            session = Sail.app.session
            
            console.log("Authenticated as: ", session.account.login, session.account.encrypted_password)
            
            Sail.Strophe.bosh_url = '/http-bind/'
         	Sail.Strophe.jid = session.account.login + '@' + Sail.app.xmppDomain
          	Sail.Strophe.password = session.account.encrypted_password

      	    Sail.Strophe.connect()
        },
        
        unauthenticated: function() {
            Sail.Strophe.disconnect()
        }
    },
    
    showConnecting: function() {
        connecting = $('<div id="connecting" />')
        connecting.append('<img src="loader.gif" alt="..." />')
        connecting.append('<p>Connecting...</p>')
        
        $('body').append(connecting)
    },
    
    hideConnecting: function() {
        $('#connecting').remove()
    },
    
    connectSuccess: function(ev) {
        groupchatRoom = Sail.app.groupchatRoom || Sail.app.run.name + '@conference.' + Sail.app.xmppDomain
  	    Sail.app.groupchat = new Sail.Strophe.Groupchat(groupchatRoom)
  	    
  	    sailHandler = Sail.generateSailEventHandlerFromMap(Sail.app)
        Sail.app.groupchat.addGroupchatStanzaHandler(sailHandler)
        
        for (mod in Sail.modules.loaded) {
            modSailHandler = Sail.generateSailEventHandlerFromMap(Sail.modules.loaded[mod])
            Sail.app.groupchat.addGroupchatStanzaHandler(modSailHandler)
        }

        Sail.app.groupchat.addSelfJoinedHandler(function(pres) {
            $(Sail.app).trigger('selfJoined')
            
            Strophe.AutoConnector.hideConnecting()
      	    $(Sail.app).trigger('connected')
        })
        
        Sail.app.groupchat.join()
    },
    
    connectFailure: function(ev, error) {
        $('#connecting p').text("Connection Failure!")
        alert("CONNECTION FAILED TO XMPP SERVER AS "+Sail.Strophe.jid+" BECAUSE: "+error+" ("+ev.type+")")
    },
    
    connectDisconnected: function(ev) {
        // do nothing for now
    }
}