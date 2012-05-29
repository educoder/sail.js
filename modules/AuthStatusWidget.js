/*globals browser: true, devel: true */
/*globals Sail, jQuery */

var AuthStatusWidget = (function () {
    var mod = {};

    mod.options = {
        indicatorContainer: 'header',
        clickNameToLogout: false
    };
    
    mod.events = {
        initialized: function(ev) {
            Sail.loadCSS(Sail.modules.PATH + 'AuthStatusWidget.css');
        },
        
        authenticated: function(ev) {
            mod.showIndicator(mod.options.indicatorContainer);
        },
        
        unauthenticated: function(ev) {
            jQuery('#auth-indicator').remove();
        }
    };
    
    mod.showIndicator = function(inContainer) {
        jQuery('#auth-indicator').remove();
        
        var indicator = jQuery('<div id="auth-indicator"></div>');
        var authAs = jQuery('<div id="auth-as"></div>');
        indicator.append(authAs);

        if (mod.options.clickNameToLogout) {
            authAs.append('<a href="#">'+Sail.app.nickname+'</a>');
        } else {
            authAs.text(Sail.app.nickname);
            indicator.append('<div id="logout-button">[<a href="#">Logout</a>]</div>');
        }
        
        indicator.find('a').click(function() {
            jQuery(Sail.app).trigger('logout');
        });
        
        jQuery(inContainer || 'body').append(indicator);
    };

    return mod;
})();
