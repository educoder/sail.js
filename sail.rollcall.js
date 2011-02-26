// uses jquery.url.js --> https://github.com/allmarkedup/jQuery-URL-Parser

var Sail = window.Sail || {}

Sail.Rollcall = function(url) {
    this.url = url
}

Sail.Rollcall.prototype = {
     
    
    /**
     * Fetch session data for the given token.
     * If the session data is retrieved successfully, then given
     * callback is executed with the session data.
     *
     * The appropriate method for doign the request (JSON vs JSONP)
     * will be automatically determined by comparing the Rollcall
     * service URL to the current page's URL.
     */
    fetchSessionForToken: function(token, callback) {
        currentUrl = $.url.attr('source')
        
        $.url.setUrl(this.url)
        rollcallHost = $.url.attr('host')
        rollcallPort = $.url.attr('port')
        rollcallProtocol = $.url.attr('protocol')
        
        $.url.setUrl(currentUrl)
        
        // determine whether we can talk to rollcall over REST
        // or whetehr we have to use JSONP
        if (rollcallHost == $.url.attr('host') 
                && rollcallPort == $.url.attr('port')
                && rollcallProtocol == $.url.attr('protocol')) {
            this.fetchSessionForTokenUsingREST(token, callback)
        } else {
            this.fetchSessionForTokenUsingJSONP(token, callback)
        }
    },
    
    fetchSessionForTokenUsingREST: function(token, callback) {
        var rollcall = this
        return $.ajax({
            url: rollcall.url + '/sessions/validate_token.json',
            dataType: 'json',
            data: {
                token: token
            },
            success: callback,
            failure: function(error) {
                console.log(error)
                throw "Error response from Rollcall at " + rollcall.url
            }
        })
    },
    
    fetchSessionForTokenUsingJSONP: function(token, callback) {
        var rollcall = this
        return $.ajax({
            url: rollcall.url + '/sessions/validate_token.json',
            dataType: 'jsonp',
            data: {
                _method: 'GET',
                token: token
            },
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