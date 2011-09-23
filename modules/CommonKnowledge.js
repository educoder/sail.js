CommonKnowledge = {
    events: {
        initialized: function(ev) {
            Sail.loadCSS(Sail.modules.defaultPath + 'CommonKnowledge.css')
        },
        
        authenticated: function(ev) {
            CommonKnowledge.showDiscussButton('header')
        },
    },
    
    showDiscussButton: function(inContainer) {
        $('#discuss-button').remove()
        
        button = $('<a id="discuss-button" href="#"><img id="discuss-button" src="images/discuss.png" /></a>')˝
        
        button.click(function() {
            if ($(button).is('.active')) {
                $(button).removeClass('active')
                src = $(button).find('img').attr('src')
                $(button).find('img').attr('src', src.replace('-active.png','.png'))
                CommonKnowledge.hideDiscussion()
            } else {
                $(button).addClass('active')
                src = $(button).find('img').attr('src')
                $(button).find('img').attr('src', src.replace('.png','-active.png'))
                CommonKnowledge.showDiscussion()
            }
        })
        
        $(inContainer || 'body').append(button)
    }
}