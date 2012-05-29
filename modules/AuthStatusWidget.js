/*globals browser: true, devel: true */
/*globals Sail, jQuery */

var AuthStatusWidget = (function () {
    var mod = {};

    mod.options = {
        indicatorContainer: 'header'
    };
    
    mod.events = {
        initialized: function(ev) {
            Sail.loadCSS(Sail.modules.PATH + 'AuthStatusWidget.css');
        },
        
        authenticated: function(ev) {
            AuthStatusWidget.showIndicator(AuthStatusWidget.options.indicatorContainer);
        },
        
        unauthenticated: function(ev) {
            jQuery('#auth-indicator').remove();
        }
    };
    
    mod.showIndicator = function(inContainer) {
        jQuery('#auth-indicator').remove();
        
        var indicator = jQuery('<div id="auth-indicator"></div>');
        indicator.append('<div id="auth-as">'+Sail.app.nickname+'</div>');
        indicator.append('<div id="logout-button">[<a href="#">Logout</a>]</div>');
        
        indicator.find('a').click(function() {
            jQuery(Sail.app).trigger('logout');
        });
        
        jQuery(inContainer || 'body').append(indicator);
    };

    return mod;
})();
