CommonKnowledge = {
    options: {
        buttonContainer: 'body',
        discussionContainer: 'body'
    },
    
    events: {
        initialized: function(ev) {
            Sail.loadCSS(Sail.modules.defaultPath + 'CommonKnowledge.css')
        },
        
        authenticated: function(ev) {
            CommonKnowledge.showDiscussButton()
        },
    },
    
    showDiscussButton: function() {
        $('#discuss-button').remove()
        
        button = $('<a id="discuss-button" href="#"><span class="label">discuss</span><img id="discuss-button" src="images/discuss.png" /></a>')
        
        button.click(function() {
            if ($(button).is('.active')) {
                CommonKnowledge.hideDiscussion()
            } else {
                CommonKnowledge.showDiscussion()
            }
        })
        
        $(CommonKnowledge.options.buttonContainer).append(button)
    },
    
    showDiscussion: function() {
        $(button).addClass('active')
        src = $(button).find('img').attr('src')
        $(button).find('img').attr('src', src.replace('.png','-active.png'))
        
        if (!this.panel) {
            //mask = $('<div id="discussion-mask" class="mask" />')
            //$(CommonKnowledge.options.discussionContainer).append(mask)
            
            this.panel = $('<div id="discussion-panel" class="widget-box"></div>')
            
            closeButton = $('<a id="discussion-panel-close-button" href="#">close</a>')
            
            closeButtonIcon = $('<span />')
            closeButtonIcon.addClass('ui-icon')
            closeButtonIcon.addClass('ui-icon-closethick')
            
            closeButton.click(function() {
                CommonKnowledge.hideDiscussion()
            })

            closeButton.append(closeButtonIcon)
            
            this.panel.append(closeButton)
            $(CommonKnowledge.options.discussionContainer).append(this.panel)
        } else {
            this.panel.show()
        }
    },
    
    hideDiscussion: function() {
        $(button).removeClass('active')
        src = $(button).find('img').attr('src')
        $(button).find('img').attr('src', src.replace('-active.png','.png'))
        
        this.panel.hide()
    }
}