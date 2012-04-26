/*jshint browser: true, devel: true */
/*globals Sail, jQuery */
Sail.UI = {
    init: function() {
        jQuery(document).ready(function() {
            // We need to turn off animation effect for Xoom tablets since they can't really handle it
            // FIXME: ugly way to check if we're on a Xoom tablet
            if (navigator.userAgent.match('Android'))
                jQuery.fx.off = true;
            
            jQuery('button, input[type=submit], input[type=reset], input[type=button]').button();
            jQuery('.dialog button').click(function () {
                Sail.UI.dismissDialog(jQuery(this).parents('.dialog'));
            });
            
            console.log("UI initialized...");
            jQuery(Sail.app).trigger('ui.initialized');
        });
    },
    
    showDialog: function(jq) {
        var dialogId = 'sail-dialog-'+Math.floor(Math.random()*10e10).toString(16);
        console.debug("Sail.UI: showing dialog "+dialogId);
        var mask = jQuery('<div class="mask"></div>');
        mask.addClass(dialogId);
        mask.insertBefore(jq);
        mask.css('z-index', 999);
        jQuery(jq).css('z-index', 1000);
        jQuery(jq).data('sail-dialog-id', dialogId);
        jQuery(jq).show();
    },
    
    dismissDialog: function(jq) {
        if (jQuery(jq).length === 0)
            return; // don't attempt to dismiss if dialog doesn't exist
        var dialogId = jQuery(jq).data('sail-dialog-id');
        console.debug("Sail.UI: dismissing dialog "+dialogId);
        jQuery('.mask.'+dialogId).remove();
        jQuery(jq).fadeOut('fast', function() {jQuery(this).remove();});
    }
};