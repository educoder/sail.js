Rollcall.LoginPicker = {
    events: {
        initialized: function(ev) {
            Sail.loadCSS(Sail.modules.defaultPath + 'Rollcall.LoginPicker.css')
        },
    },
    
    showUserSelector: function(inContainer) {
        picker = $("<div id='login-picker' class='widget-box'></div>")
        picker.append("<h1 id='login-picker-instructions'>Log in as:</h1>")
        picker.append("<ul class='users'></ul>")
        
        Sail.app.rollcall.fetchAllUsers(function(data) {
            $(data).each(function() {
                u = this['user']
                li = $("<li id='user-"+u.account.login+"'>"+u.account.login+"</li> ")
                li.data('account', u.account)
                li.click(function() {
                    account = $(this).data('account')
                    login = account.login
                    password = account.password
                    Sail.app.rollcall.createSession(login, password, function(session) {
                        Sail.app.rollcall.setToken(session.token)
                        Sail.UI.dismissDialog(picker)
                        
                        Sail.app.session = session
                        
                        $(Sail.app).trigger('authenticated')
                    })
                })
                picker.children(".users").append(li)
            })
            
            $(inContainer || 'body').append(picker)
            
            Sail.UI.showDialog(picker)
        })
    }
}