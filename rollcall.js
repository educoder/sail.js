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
    
    
    createSession: function(login, password, callback) {
        url = this.url + '/sessions.json'
        
        data = {
            session: {
                login: login,
                password: password
            }
        }
        
        callbackWrapper = function(data) {
            session = data['session']
            callback(session)
        }
        
        if (this.canUseREST()) {
            this.requestUsingREST(url, 'POST', data, callbackWrapper)
        } else {
            this.requestUsingJSONP(url, 'POST', data, callbackWrapper)
        }
    },
    
    
    destroySessionForToken: function(token, callback) {
        rollcall = this
        
        url = rollcall.url + '/sessions/invalidate_token.json'
        
        if (rollcall.canUseREST()) {
            rollcall.requestUsingREST(url, 'DELETE', {token: token}, callback)
        } else {
            rollcall.requestUsingJSONP(url, 'DELETE', {token: token}, callback)
        }
    },


    /**
     * Fetch session data for the given token.
     * If the session data is retrieved successfully, then given
     * callback is executed with the session data.
     */
    fetchSessionForToken: function(token, callback) {
        url = this.url + '/sessions/validate_token.json'
        
        if (this.canUseREST()) {
            this.requestUsingREST(url, 'GET', {token: token}, callback)
        } else {
            this.requestUsingJSONP(url, 'GET', {token: token}, callback)
        }
    },
    
    /**
     * Fetch the list of all users registered on Rollcall.
     */
    fetchAllUsers: function(callback) {
        url = this.url + '/users.json'
        
        if (this.canUseREST()) {
            this.requestUsingREST(url, 'GET',{ }, callback)
        } else {
            this.requestUsingJSONP(url, 'GET', {}, callback)
        }
    },
    
    requestUsingREST: function(url, method, params, callback) {
        rollcall = this
        
        $.ajax({
            url: url,
            type: method,
            dataType: 'json',
            data: params,
            success: callback,
            failure: function(error) {
                console.error(error)
                throw "Error response from Rollcall at " + rollcall.url
            }
        })
    },
    
    requestUsingJSONP: function(url, method, params, callback) {
        rollcall = this
        
        params['_method'] = method
        
        wrappedCallback = function(data) {
            if (data.error) {
                console.error(data.error.data)
                throw data.error.data + " (from " + rollcall.url + ")"
            } else {
                callback(data)
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