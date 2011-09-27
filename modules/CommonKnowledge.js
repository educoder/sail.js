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
        
        button = $('<a id="ck-discuss-button" class="ck" href="#"><span class="label">discuss</span><img src="images/discuss.png" /></a>')
        
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
            //mask = $('<div id="ck-discussion-mask" class="mask" />')
            //$(CommonKnowledge.options.discussionContainer).append(mask)
            
            this.panel = $('<div id="ck-discussion-panel" class="ck widget-box"></div>')
            
            closeButton = $('<a id="ck-discussion-panel-close-button" class="ck" href="#">close</a>')
            
            closeButtonIcon = $('<span />')
            closeButtonIcon.addClass('ui-icon')
            closeButtonIcon.addClass('ui-icon-closethick')
            
            closeButton.click(function() {
                CommonKnowledge.hideDiscussion()
            })

            closeButton.append(closeButtonIcon)
            
            newNoteButton = $('<button id="new-note-button" class="ck">add note</button>')
            newNoteButton.button()
            
            newNoteButton.click(funciton() {
                
            })
            
            this.panel.append(closeButton)
            this.panel.append(newNoteButton)
            this.panel.append(CommonKnowledge.newNoteInput())
            
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
    },
    
    newNoteInput: function() {
        noteForm = $('<form class="ck note-input" />')
        
        noteFieldset = $('<fieldset />')
        noteFieldset.append('<legend>New Note</legend>')
        noteForm.append(noteFieldset)
        
        noteTextarea = $('<textarea name="ck[note]"></textarea>')
        noteHeadline = $('<input type="text" name="ck[headline]" />')
        
        noteFieldset.append(noteTextarea)
        noteFieldset.append(noteHeadline)
        
        return noteForm
    }
}