Rollcall.Authenticator = {
    options: {
        mode: 'picker',
        /** If true, the user will be asked to select a run prior to login. */
        askForRun: false,
        // FIXME: bloody mess
        run: null,
        /** If set to a curnit id or curnit name, only runs from this curnit will be shown in run picker. 
            Can be set to a function to postpone evaluation. */ 
        curnit: null,
        /** Optional function to use as a filter for users shown in account pickers. The function will be passed a
            user object and must return true if the user is to be shown or false if the user is to be hidden. */
        userFilter: null
    },
    
    events: {
        initialized: function(ev) {
            Sail.loadCSS(Sail.modules.PATH + 'Rollcall.Authenticator.css')
            
            // if (Rollcall.Authenticator.options.askForRun && !Sail.app.run) {
            //                 Rollcall.Authenticator.requestRun()
            //             }
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
        var token = Sail.app.rollcall.getCurrentToken();

        var reset = function () {
            Sail.app.rollcall.unsetToken();
            Sail.app.run = null;
            $.cookie('run', null);
            if (Sail.Strophe.conn) // FIXME: this doesn't belong here
                Sail.Strophe.clearConnInfo(); 
            $(Sail.app).trigger('unauthenticated');
        }

        if (token)
            Sail.app.rollcall.destroySessionForToken(Sail.app.rollcall.getCurrentToken(), reset, 
                function (err) { 
                    console.warn("Could not delete session token '"+token+"' in Rollcall!", err);
                    reset();
                });
        else
            reset();
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
            case 'username-and-password':
                Rollcall.Authenticator.showLoginBox()
                break;
            default:
                Rollcall.Authenticator.showAccountPicker()
        }
    },
    
    showRunPicker: function() {
        inContainer = 'body'
        picker = $("<div id='run-picker' class='auth-box widget-box'></div>")
        picker.append("<h1 id='run-picker-instructions' class='titlebar'>Select your class:</h1>")
        picker.append("<ul class='runs'></ul>")
        
        curnit = Rollcall.Authenticator.options.curnit
        if (!curnit) {
            console.warn("No curnit set for Rollcall.Authenticator! Runs from all curnits will be shown...")
        }
        
        Sail.app.rollcall.fetchRuns({curnit: curnit}, function(data) {
            $(data).each(function() {
                r = this
                
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
        
        picker = $("<div id='account-picker' class='auth-box widget-box'></div>")
        picker.append("<h1 id='account-picker-instructions' class='titlebar'>Log in as:</h1>")
        picker.append("<ul class='users'></ul>")
        
        // FIXME: bloody mess
        if (Rollcall.Authenticator.options.usersQuery)
            usersQuery = Rollcall.Authenticator.options.usersQuery
        else if (Rollcall.Authenticator.options.askForRun)
            usersQuery = {run_id: Sail.app.run.id}
        else if (typeof Rollcall.Authenticator.options.run == 'function')
            usersQuery = {run_id: Rollcall.Authenticator.options.run()}
        else if (Rollcall.Authenticator.options.run)
            usersQuery = {run_id: Rollcall.Authenticator.options.run}
        else
            usersQuery = {}
        
        Sail.app.rollcall.fetchUsers(usersQuery, function(data) {
            $(data).each(function() {
                u = this
                if (!u.account.allow_passwordless_login || 
                        (Rollcall.Authenticator.options.mode == 'picker' && Rollcall.Authenticator.options.mode == 'mulit-picker')) {
                    console.warn("Skipping user "+u.account.login+" because they are not allowed to log in without a password.")
                    return // only use passwordless login accounts for picker
                }
                
                if (Rollcall.Authenticator.options.userFilter && !Rollcall.Authenticator.options.userFilter(u)) {
                    return // user was rejected by userFilter
                }
                    
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
            loginButton.click(Rollcall.Authenticator.confirmLoginSelection)
            loginButtonContainer.append(loginButton)
            picker.append(loginButtonContainer)
        }
    },
    
    showLoginBox: function() {
        inContainer = 'body'
        
        picker = $("<div id='login-box' class='auth-box widget-box'></div>")
        picker.append("<h1 id='login-box-instructions' class='titlebar'>Enter your credentials:</h1>")
        
        loginForm = $('<form />')
        picker.append(loginForm)
        
        box = $("<fieldset />")
        box.append("<div data-role='fieldcontain'><label for='login-username-input'>Username:</label> <input type='text' name='username' id='login-username-input' /></div>")
        box.append("<div data-role='fieldcontain'><label for='login-password-input'>Password:</label> <input type='password' name='password' id='login-password-input' /></div>")
        
        loginButton = $("<button>Login</button>")

        if (!jQuery.mobile)
            loginButton.button()

        box.append(loginButton)
        
        if (jQuery.mobile)
            box.trigger('create')

        loginForm.submit(function() {
            creds = {
                login: $('#login-box input[name=username]').val(), 
                password: $('#login-box input[name=password]').val()
            }
            Sail.app.rollcall.createSession(creds, Rollcall.Authenticator.loginFromSession)
            return false
        })
        
        loginForm.append(box)
        
        $(inContainer).append(picker)
        
        $('#login-box input[name=username]').focus()
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
    confirmLoginSelection: function() {
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
        Sail.UI.dismissDialog('.auth-box')
    
        Sail.app.session = session
    
        $(Sail.app).trigger('authenticated')
    }
}