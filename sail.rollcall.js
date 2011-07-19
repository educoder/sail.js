// uses jquery.url.js --> https://github.com/allmarkedup/jQuery-URL-Parser

var Sail = window.Sail || {}

Sail.Rollcall = {

}

Sail.Rollcall.Client = function(url) {
    this.url = url
}

Sail.Rollcall.Client.prototype = {
    /**
     * Get the current authentication token (from the current URL, i.e. from "?token=123xyz")
     *
     * In the future we may also wan to check for a 'token' cookie.
     */
    getCurrentToken: function() {
        // $.url is from jquery.url.js and refers to the current url 
        // (i.e. the url of the page we are currently on)
        return $.url.param('token')
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
        
        return rollcallHost == $.url.attr('host') 
                && rollcallPort == $.url.attr('port')
                && rollcallProtocol == $.url.attr('protocol')
    },


    /**
     * Fetch session data for the given token.
     * If the session data is retrieved successfully, then given
     * callback is executed with the session data.
     */
    fetchSessionForToken: function(token, callback) {
        url = this.url + '/sessions/validate_token.json'
        
        if (this.canUseREST()) {
            this.fetchDataUsingREST(url, {token: token}, callback)
        } else {
            this.fetchDataUsingJSONP(url, {token: token}, callback)
        }
    },
    
    /**
     * Fetch the list of all users registered on Rollcall.
     */
    fetchAllUsers: function(callback) {
        url = this.url + '/users.json'
        
        if (this.canUseREST()) {
            this.fetchDataUsingREST(url, {}, callback)
        } else {
            this.fetchDataUsingJSONP(url, {}, callback)
        }
    },
     
    fetchDataUsingREST: function(url, params, callback) {
        rollcall = this
        
        $.ajax({
            url: url,
            dataType: 'json',
            data: params,
            success: callback,
            failure: function(error) {
                console.log(error)
                throw "Error response from Rollcall at " + rollcall.url
            }
        })
    },
    
    fetchDataUsingJSONP: function(url, params, callback) {
        rollcall = this
        
        params['_method'] = params['_method'] || 'GET'
        
        return $.ajax({
            url: url,
            dataType: 'jsonp',
            data: params,
            success: function(data) {
                if (data.error) {
                    console.log(data)
                    throw data.error.data + " (from " + rollcall.url + ")"
                } else {
                    callback(data)
                }
            }
        })
    }
}