/*jshint browser: true, devel: true */
/*globals Sail, jQuery */

window.AuthStatusWidget = (function () {
    var mod = {};

    mod.options = {
        indicatorContainer: 'header',
        clickNameToLogout: false
    };
    
    mod.events = {
        initialized: function() {
            Sail.loadCSS(Sail.modules.PATH + 'AuthStatusWidget.css');
        },
        
        authenticated: function() {
            mod.showIndicator(mod.options.indicatorContainer);
        },
        
        unauthenticated: function() {
            jQuery('#auth-indicator').remove();
        }
    };
    
    mod.showIndicator = function(inContainer) {
        jQuery('#auth-indicator').remove();
        
        var indicator = jQuery('<div id="auth-indicator"></div>');
        var authAs = jQuery('<div id="auth-as"></div>');
        indicator.append(authAs);

        if (mod.options.clickNameToLogout) {
            authAs.append('<a class="nickname" href="#"></a>');
        } else {
            authAs.append('<span class="nickname"></span>');
            indicator.append('<div id="logout-button">[<a href="#">Logout</a>]</div>');
        }

        authAs.find('.nickname').text(Sail.app.nickname || Sail.app.session.account.login || "???");

        indicator.find('a').click(function() {
            jQuery(Sail.app).trigger('logout');
        });
        
        jQuery(inContainer || 'body').append(indicator);
    };

    mod.updateNickname = function(newNickname) {
        jQuery('#auth-indicator .nickname').text(newNickname);
    };

    return mod;
})();
