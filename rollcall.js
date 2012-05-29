/*jshint browser: true, devel: true */
/*globals Sail, jQuery */

// uses jquery.url.js --> https://github.com/allmarkedup/jQuery-URL-Parser

var Rollcall = window.Rollcall || {};

Rollcall.Client = function(url) {
    this.url = url;
};

Rollcall.Client.prototype = {
    /**
     * Get the current authentication token (from the current URL, i.e. from "?token=123xyz")
     *
     * In the future we may also wan to check for a 'token' cookie.
     */
    getCurrentToken: function() {
        // jQuery.url is from jquery.url.js and refers to the current url 
        // (i.e. the url of the page we are currently on)
        return this.token || jQuery.url.param('token') || jQuery.cookie('token');
    },
    
    setToken: function(token) {
        this.token = token;
        jQuery.url.param('token', token);
        jQuery.cookie('token', token);
    },
    
    unsetToken: function() {
        this.token = null;
        jQuery.url.param('token', '');
        jQuery.cookie('token', null);
    },
    
     
    /**
     * Redirect the user to the Rollcall login page for authentication.
     */
    redirectToLogin: function() {        
        window.location.replace(this.url+'/login?destination='+encodeURIComponent(window.location.href));
    },
    
    
    /**
     * Determine whether this is a cross-domain request.
     */
    isCrossDomain: function() {
        
        // using jquery.url.js here
        var currentUrl = jQuery.url.attr('source');
        jQuery.url.setUrl(this.url);
        var rollcallHost = jQuery.url.attr('host');
        var rollcallPort = jQuery.url.attr('port');
        var rollcallProtocol = jQuery.url.attr('protocol');
        jQuery.url.setUrl(currentUrl);
        
        if (!rollcallHost)
            return true;

        return rollcallHost !== jQuery.url.attr('host')  || 
                rollcallPort !== jQuery.url.attr('port') || 
                rollcallProtocol !== jQuery.url.attr('protocol');
    },
    
    
    createSession: function(account, successCallback, errorCallback) {
        var login = account.login;
        var password = account.password;
        var url = this.url + '/sessions.json';
        
        var data = {
            session: {
                login: login,
                password: password
            }
        };
        
        var successCallbackWrapper = function(data) {
            successCallback(data);
        };
        
        this.request(url, 'POST', data, successCallbackWrapper, errorCallback);
    },
    
    // Creates a session for a group composed of the given members.
    // If the group doesn't yet exist, it is created automatically.
    createGroupSession: function(accounts, successCallback, errorCallback) {
        var url = this.url + '/sessions/group.json';
        
        var data = {
            logins: accounts,
            run_id: Sail.app.run.id // FIXME: probably don't want this referenced here; pass as argument?
        };
        
        var successCallbackWrapper = function(data) {
            successCallback(data);
        };
        
        this.request(url, 'POST', data, successCallbackWrapper, errorCallback);
    },
    
    
    destroySessionForToken: function(token, successCallback, errorCallback) {
        var rollcall = this;
        
        var url = rollcall.url + '/sessions/invalidate_token.json';
        
        this.request(url, 'DELETE', {token: token}, successCallback, errorCallback);
    },


    /**
     * Fetch session data for the given token.
     * If the session data is retrieved successfully, then given
     * callbacks are executed with the session data.
     */
    fetchSessionForToken: function(token, successCallback, errorCallback) {
        var url = this.url + '/sessions/validate_token.json';
        
        this.request(url, 'GET', {token: token}, successCallback, errorCallback);
    },

    /**
     * Fetch data for a single user identified by an id or username.
     */
    fetchUser: function(idOrUsername, options, successCallback, errorCallback) {
        var url = this.url + '/users/' + idOrUsername + '.json';
        
        this.request(url, 'GET', options, successCallback, errorCallback);
    },
    
    /**
     * Fetch the list of users.
     */
    fetchUsers: function(options, successCallback, errorCallback) {
        var url = this.url + '/users.json';
        
        this.request(url, 'GET', options, successCallback, errorCallback);
    },
    
    /**
     * Fetch the list of runs.
     */
    fetchRuns: function(options, successCallback, errorCallback) {
        var url;
        if (options.curnit) {
            url = this.url + '/curnits/'+options.curnit+'/runs.json';
        } else {
            url = this.url + '/runs.json';
        }
        
        this.request(url, 'GET', options, successCallback, errorCallback);
    },
    
    /**
     * Fetch run data for a run id or name.
     */
    fetchRun: function(id, successCallback, errorCallback) {
        var url = this.url + '/runs/'+id+'.json';
        
        this.request(url, 'GET', {}, successCallback, errorCallback);
    },
    
    fetchGroup: function(login, successCallback, errorCallback) {
        var url = this.url + '/groups/'+login+'.json';
        
        this.request(url, 'GET', {}, successCallback, errorCallback);
    },
    
    error: function(error) {
        alert(error.responseText);
    },
    
    request: function(url, method, params, successCallback, errorCallback) {
        //if (this.canUseREST()) {
            this.requestUsingREST(url, method, params, successCallback, errorCallback);
        //} else {
        //    this.requestUsingJSONP(url, method, params, successCallback, errorCallback);
        //}
    },
    
    requestUsingREST: function(url, method, params, successCallback, errorCallback) {
        var rollcall = this;
        
        jQuery.ajax({
            url: url,
            type: method,
            dataType: 'json',
            data: params,
            success: successCallback,
            xhrFields: {
               withCredentials: true
            },
            crossDomain: this.isCrossDomain(),
            error: function(error) {
                if (error.status === 0 && rollcall.isCrossDomain())
                    console.error("Error while making cross-domain request to Rollcall. Is Rollcall configured for CORS?");
                else
                    console.error("Error response from Rollcall at " + rollcall.url + ":", error);
                
                if (errorCallback)
                    errorCallback(error);
                else
                    rollcall.error(error);
            }
        });
    },

    // no longer used
    requestUsingJSONP: function(url, method, params, successCallback, errorCallback) {
        var rollcall = this;
        
        params._method = method;
        
        var wrappedCallback = function(data) {
            if (data.error) {
                console.error("Error response from Rollcall at " + rollcall.url + ":", data.error.data);
                if (errorCallback)
                    errorCallback(data.error.data);
                else
                    rollcall.error(data.error.data);
            } else {
                successCallback(data);
            }
        };
        
        return jQuery.ajax({
            url: url,
            dataType: 'jsonp',
            data: params,
            success: wrappedCallback
        });
    }
};