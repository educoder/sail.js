Strophe.AutoConnector = {
    events: {
        initialized: function() {
            Sail.loadCSS(Sail.modules.defaultPath + 'Strophe.AutoConnector.css')
            
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

          	Sail.Strophe.onConnectSuccess = function() {
          	    sailHandler = Sail.generateSailEventHandler(Sail.app)
          	    Sail.Strophe.addHandler(sailHandler, null, null, 'chat')
          	    
                groupchatRoom = Sail.app.groupchatRoom || Sail.app.run.name + '@conference.' + Sail.app.xmppDomain
          	    Sail.app.groupchat = new Sail.Strophe.Groupchat(groupchatRoom)
                Sail.app.groupchat.addHandler(sailHandler)

                Sail.app.groupchat.addSelfJoinedHandler(function(pres) {
                    $(Sail.app).trigger('selfJoined')
                    
                    Strophe.AutoConnector.hideConnecting()
              	    $(Sail.app).trigger('connected')
                })
          	}

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
    }
}