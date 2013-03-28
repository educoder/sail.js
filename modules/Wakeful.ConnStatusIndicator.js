/*jshint browser: true, devel: true */
/*globals Strophe, Sail, jQuery */

Wakeful.ConnStatusIndicator = (function() {
    var mod = {};

    mod.options = {};

    function showConnecting (text) {
        var connecting = jQuery('#connecting');
        if (connecting.length > 0) {
            connecting.find('.message').text(text);
            connecting.css('opacity', 1.0);
        } else {
            connecting = jQuery('<div id="connecting" />');
            container = jQuery('<div></div>');
            connecting.append(container);
            ajaxSpinner = '<div id="connecting-anim">';
            ajaxSpinner += '<div id="circleG_1" class="circleG"></div>';
            ajaxSpinner += '<div id="circleG_2" class="circleG"></div>';
            ajaxSpinner += '<div id="circleG_3" class="circleG"></div>';
            ajaxSpinner += '</dvi>';
            container.append(ajaxSpinner);
            container.append('<p class="message">'+(text ? text : "Connecting...")+'</p>');
            jQuery('body').append(connecting);
        }
    }

    function hideConnecting () {
        jQuery('#connecting').css('opacity', 0.0);
        setTimeout(function () {
            jQuery('#connecting').remove();
        }, 201);
    }

    mod.events = {
        initialized: function() {
            Sail.loadCSS(Sail.modules.PATH + 'Wakeful.ConnStatusIndicator.css');

            // note that this is triggered for each wakeful object that connects via Faye
            Wakeful.bind('transport:up', function (obj) {
                hideConnecting();
            });

            // note that this is triggered for each wakeful object that loses Faye connection
            Wakeful.bind('transport:down', function (obj) {
                showConnecting("CONNECTION LOST... RECONNECTING...");
            });
        },
        
        authenticated: function() {
            showConnecting();
        },
    };

    return mod;
})();