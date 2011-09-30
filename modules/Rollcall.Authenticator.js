Rollcall.Authenticator = {
    options: {
        mode: 'picker',
        askForRun: false, // TODO: implement me!
        curnit: null
    },
    
    events: {
        initialized: function(ev) {
            Sail.loadCSS(Sail.modules.defaultPath + 'Rollcall.Authenticator.css')
            
            if (Rollcall.Authenticator.options.askForRun && !Sail.app.run) {
                Rollcall.Authenticator.requestRun()
            }
        },
        
        connected: function(ev) {
            Sail.Strophe.addErrorStanzaHandler(function(error, text) {
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
            Sail.app.run = null
            $.cookie('run', null)
            $(Sail.app).trigger('unauthenticated')
        })
    },
    
    requestRun: function() {
        Rollcall.Authenticator.showRunPicker()
    },
    
    requestLogin: function() {
        // TODO: implement other modes (e.g. login)
        switch (Rollcall.Authenticator.options.mode) {
            case 'picker':
            case 'multi-picker':
                Rollcall.Authenticator.showAccountPicker()
                break
            default:
                Rollcall.Authenticator.showAccountPicker()
        }
    },
    
    showRunPicker: function() {
        inContainer = 'body'
        picker = $("<div id='run-picker' class='auth-picker widget-box'></div>")
        picker.append("<h1 id='run-picker-instructions'>Select your class:</h1>")
        picker.append("<ul class='runs'></ul>")
        
        curnit = Rollcall.Authenticator.options.curnit
        if (!curnit) {
            console.warn("No curnit set for Rollcall.Authenticator! Runs from all curnits will be shown...")
        }
        
        Sail.app.rollcall.fetchRuns({curnit: curnit}, function(data) {
            $(data).each(function() {
                r = this['run']
                
                li = $("<li id='run-"+r.id+"'>"+r.name+"</li> ")
                li.data('run', r)
                li.click(Rollcall.Authenticator.pickRun)
                picker.children(".runs").append(li)
            })
            
            $(inContainer).append(picker)
            
            Sail.UI.showDialog(picker)
        })
    },
    
    showAccountPicker: function() {
        inContainer = 'body'
        multi = Rollcall.Authenticator.options.mode == 'multi-picker' || false
        
        picker = $("<div id='account-picker' class='auth-picker widget-box'></div>")
        picker.append("<h1 id='account-picker-instructions'>Log in as:</h1>")
        picker.append("<ul class='users'></ul>")
        
        Sail.app.rollcall.fetchUsers({}, function(data) {
            $(data).each(function() {
                u = this['user']
                if (!u.account.allow_passwordless_login || 
                        (Rollcall.Authenticator.options.mode == 'picker' && Rollcall.Authenticator.options.mode == 'mulit-picker'))
                    return // only use passwordless login accounts for picker
                
                li = $("<li id='user-"+u.account.login+"'>"+u.account.login+"</li> ")
                li.data('account', u.account)
                li.click(Rollcall.Authenticator.pickLogin)
                picker.children(".users").append(li)
            })
            
            $(inContainer).append(picker)
            
            Sail.UI.showDialog(picker)
        })
        
        if (multi) {
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
    
    pickRun: function() {
        Sail.app.run = $(this).data('run')
        $.cookie('run', JSON.stringify(Sail.app.run))
        Sail.UI.dismissDialog('#run-picker')
        Rollcall.Authenticator.requestLogin()
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
        Sail.UI.dismissDialog('#account-picker')
    
        Sail.app.session = session
    
        $(Sail.app).trigger('authenticated')
    }
}