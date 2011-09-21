// uses jquery.url.js --> https://github.com/allmarkedup/jQuery-URL-Parser

var Rollcall = window.Rollcall || {}

Rollcall.Client = function(url) {
    this.url = url
}

Rollcall.Client.prototype = {
    /**
     * Get the current authentication token (from the current URL, i.e. from "?token=123xyz")
     *
     * In the future we may also wan to check for a 'token' cookie.
     */
    getCurrentToken: function() {
        // $.url is from jquery.url.js and refers to the current url 
        // (i.e. the url of the page we are currently on)
        return this.token || $.url.param('token') || $.cookie('token')
    },
    
    setToken: function(token) {
        this.token = token
        $.url.param('token', token)
        $.cookie('token', token)
    },
    
    unsetToken: function() {
        this.token = null
        $.url.param('token', '')
        $.cookie('token', null)
    },
    
     
    /**
     * Redirect the user to the Rollcall login page for authentication.
     */
    redirectToLogin: function() {        
        window.location.replace(this.url+'/login?destination='+escape(window.location.href))
    },
    
    
    /**
     * Determine whether we can talk to rollcall over REST
     * or whetehr we have to use JSONP.
     * Due to the same-origin policy in web browsers, REST can
     * only be used if Rollcall is being served on the same
     * domain as this script; otherwise JSONP must be used.
     */
    canUseREST: function() {
        
        // using jquery.url.js here
        currentUrl = $.url.attr('source')
        $.url.setUrl(this.url)
        rollcallHost = $.url.attr('host')
        rollcallPort = $.url.attr('port')
        rollcallProtocol = $.url.attr('protocol')
        $.url.setUrl(currentUrl)
        
        return rollcallHost == null || (
                    rollcallHost == $.url.attr('host') 
                    && rollcallPort == $.url.attr('port')
                    && rollcallProtocol == $.url.attr('protocol')
                )
    },
    
    
    createSession: function(account, successCallback, errorCallback) {
        login = account.login
        password = account.password
        url = this.url + '/sessions.json'
        
        data = {
            session: {
                login: login,
                password: password
            }
        }
        
        successCallbackWrapper = function(data) {
            successCallback(data['session'])
        }
        
        this.request(url, 'POST', data, successCallbackWrapper, errorCallback)
    },
    
    // Creates a session for a group composed of the given members.
    // If the group doesn't yet exist, it is created automatically.
    createGroupSession: function(accounts, successCallback, errorCallback) {
        url = this.url + '/sessions/group.json'
        
        data = {
            logins: accounts,
            run_id: Sail.app.run.id
        }
        
        successCallbackWrapper = function(data) {
            successCallback(data['session'])
        }
        
        this.request(url, 'POST', data, successCallbackWrapper, errorCallback)
    },
    
    
    destroySessionForToken: function(token, successCallback, errorCallback) {
        rollcall = this
        
        url = rollcall.url + '/sessions/invalidate_token.json'
        
        this.request(url, 'DELETE', {token: token}, successCallback, errorCallback)
    },


    /**
     * Fetch session data for the given token.
     * If the session data is retrieved successfully, then given
     * callbacks are executed with the session data.
     */
    fetchSessionForToken: function(token, successCallback, errorCallback) {
        url = this.url + '/sessions/validate_token.json'
        
        this.request(url, 'GET', {token: token}, successCallback, errorCallback)
    },
    
    /**
     * Fetch the list of users.
     */
    fetchUsers: function(options, successCallback, errorCallback) {
        url = this.url + '/users.json'
        
        this.request(url, 'GET', options, successCallback, errorCallback)
    },
    
    /**
     * Fetch the list of runs.
     */
    fetchRuns: function(options, successCallback, errorCallback) {
        if (options.curnit) {
            url = this.url + '/curnits/'+options.curnit+'/runs.json'
        } else {
            url = this.url + '/runs.json'
        }
        
        this.request(url, 'GET', options, successCallback, errorCallback)
    },
    
    /**
     * Fetch run data for a run id or name.
     */
    fetchRun: function(id, successCallback, errorCallback) {
        url = this.url + '/runs/'+id+'.json'
        
        this.request(url, 'GET', {}, successCallback, errorCallback)
    },
    
    fetchGroup: function(login, successCallback, errorCallback) {
        url = this.url + '/groups/'+login+'.json'
        
        this.request(url, 'GET', {}, successCallback, errorCallback)
    },
    
    error: function(error) {
        alert(error.responseText)
    },
    
    request: function(url, method, params, successCallback, errorCallback) {
        if (this.canUseREST()) {
            this.requestUsingREST(url, method, params, successCallback, errorCallback)
        } else {
            this.requestUsingJSONP(url, method, params, successCallback, errorCallback)
        }
    },
    
    requestUsingREST: function(url, method, params, successCallback, errorCallback) {
        rollcall = this
        
        $.ajax({
            url: url,
            type: method,
            dataType: 'json',
            data: params,
            success: successCallback,
            error: function(error) {
                console.error("Error response from Rollcall at " + rollcall.url + ":", error)
                if (errorCallback)
                    errorCallback(error)
                else
                    rollcall.error(error)
            }
        })
    },
    
    requestUsingJSONP: function(url, method, params, successCallback, errorCallback) {
        rollcall = this
        
        params['_method'] = method
        
        wrappedCallback = function(data) {
            if (data.error) {
                console.error("Error response from Rollcall at " + rollcall.url + ":", data.error.data)
                if (errorCallback)
                    errorCallback(data.error.data)
                else
                    rollcall.error(data.error.data)
            } else {
                successCallback(data)
            }
        }
        
        return $.ajax({
            url: url,
            dataType: 'jsonp',
            data: params,
            success: wrappedCallback
        })
    }
}