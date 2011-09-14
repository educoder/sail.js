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
        switch (Rollcall.Authenticator.options.mode) {
            case 'picker':
                Rollcall.Authenticator.showAccountPicker()
                break
            case 'multi-picker':
                Rollcall.Authenticator.showAccountPicker({multiPick: true})
                break
            default:
                Rollcall.Authenticator.showAccountPicker()
        }
    },
    
    showAccountPicker: function(options) {
        options = options || {}
        inContainer = options.inContainer || 'body'
        multiPick = options.multiPick || false
        
        picker = $("<div id='account-picker' class='widget-box'></div>")
        picker.append("<h1 id='account-picker-instructions'>Log in as:</h1>")
        picker.append("<ul class='users'></ul>")
        
        Sail.app.rollcall.fetchAllUsers(function(data) {
            $(data).each(function() {
                u = this['user']
                li = $("<li id='user-"+u.account.login+"'>"+u.account.login+"</li> ")
                li.data('account', u.account)
                li.click(Rollcall.Authenticator.pickLogin)
                picker.children(".users").append(li)
            })
            
            $(inContainer).append(picker)
            
            Sail.UI.showDialog(picker)
        })
        
        if (multiPick) {
            picker.addClass('multi-picker')
            
            loginButtonContainer = $("<div><div>")
            loginButtonContainer.css({
                'text-align': 'center',
                'background-color': '#666666',
                'border-radius': '5px 5px 5px 5px',
                'margin-top': '12px',
                'padding': '5px'
            })
            loginButton = $("<button>Login</button>")
            loginButton.css({
                'font-weight': 'bold',
            })
            loginButton.button()
            loginButton.click(Rollcall.Authenticator.commitLogin)
            loginButtonContainer.append(loginButton)
            picker.append(loginButtonContainer)
        }
    },
    
    pickLogin: function() {
        if (Rollcall.Authenticator.options.mode == 'multi-picker') {
            $(this).toggleClass('selected')
        } else {
            account = $(this).data('account')
            login = account.login
            password = account.password
            
            
            Sail.app.rollcall.createSession(account, Rollcall.Authenticator.loginFromSession)
        }
    },
    
    // only currently used when in multi-picker mode
    commitLogin: function() {
        accounts = $('#account-picker li.selected').map(function () {
            return $(this).data('account').login
        }).toArray()
        
        if (accounts.length == 0) {
            alert("You must pick at least one account to log in!")
            return
        }
        
        ok = confirm("Log in as '"+accounts.join("' and '")+"'?")
        if (ok) {
            if (accounts.length > 1) {
                Sail.app.rollcall.createGroupSession(accounts, Rollcall.Authenticator.loginFromSession)
            } else {
                Sail.app.rollcall.createSession({login: accounts[0]}, Rollcall.Authenticator.loginFromSession)
            }
        }
    },
    
    loginFromSession: function(session) {
        Sail.app.rollcall.setToken(session.token)
        Sail.UI.dismissDialog(picker)
    
        Sail.app.session = session
    
        $(Sail.app).trigger('authenticated')
    }
}