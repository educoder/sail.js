Rollcall.Authenticator = {
    options: {mode: 'picker'},
    
    events: {
        initialized: function(ev) {
            Sail.loadCSS(Sail.modules.defaultPath + 'Rollcall.Authenticator.css')
        },
        
        connected: function(ev) {
            Sail.Strophe.addErrorHandler(function(error, text) {
                alert("The account '"+Sail.app.session.account.login+"' is already logged in.")
                
                Rollcall.Authenticator.requestLogin()
            }, 'cancel', 'conflict')
        },
        
        logout: function(ev) {
            Rollcall.Authenticator.unauthenticate()
        }
    },
    
    unauthenticate: function() {
        Sail.app.rollcall.destroySessionForToken(Sail.app.rollcall.getCurrentToken(), function() {
            Sail.app.rollcall.unsetToken()
            $(Sail.app).trigger('unauthenticated')
        })
    },
    
    requestLogin: function() {
        // TODO: implement other modes (e.g. login)
        if (Rollcall.Authenticator.options.mode == 'picker')
            Rollcall.Authenticator.showAccountPicker()
        else
            Rollcall.Authenticator.showAccountPicker()
    },
    
    showAccountPicker: function(inContainer) {
        picker = $("<div id='account-picker' class='widget-box'></div>")
        picker.append("<h1 id='account-picker-instructions'>Log in as:</h1>")
        picker.append("<ul class='users'></ul>")
        
        Sail.app.rollcall.fetchAllUsers(function(data) {
            $(data).each(function() {
                u = this['user']
                li = $("<li id='user-"+u.account.login+"'>"+u.account.login+"</li> ")
                li.data('account', u.account)
                li.click(function() { Rollcall.Authenticator.pickLogin($(this).data('account')) })
                picker.children(".users").append(li)
            })
            
            $(inContainer || 'body').append(picker)
            
            Sail.UI.showDialog(picker)
        })
    },
    
    pickLogin: function(account) {
        login = account.login
        password = account.password
        Sail.app.rollcall.createSession(login, password, function(session) {
            Sail.app.rollcall.setToken(session.token)
            Sail.UI.dismissDialog(picker)
            
            Sail.app.session = session
            
            $(Sail.app).trigger('authenticated')
        })
    }
}