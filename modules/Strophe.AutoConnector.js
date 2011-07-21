Strophe.AutoConnector = {
    events: {
        authenticated: function() {
            session = Sail.app.session
            
            console.log("Authenticated as: ", session.account.login, session.account.encrypted_password)
            
            Sail.Strophe.bosh_url = '/http-bind/'
         	Sail.Strophe.jid = session.account.login + '@' + Sail.app.xmppDomain
          	Sail.Strophe.password = session.account.encrypted_password

          	Sail.Strophe.onConnectSuccess = function() {
          	    sailHandler = Sail.generateSailEventHandler(Sail.app)
          	    Sail.Strophe.addHandler(sailHandler, null, null, 'chat')

          	    Sail.app.groupchat = new Sail.Strophe.Groupchat(Sail.app.groupchatRoom)
                Sail.app.groupchat.addHandler(sailHandler)

                Sail.app.groupchat.addSelfJoinedHandler(function(pres) {
                    $(Sail.app).trigger('selfJoined')
                })
                
          	    $(Sail.app).trigger('connected')
          	}

      	    Sail.Strophe.connect()
        }
    },
}