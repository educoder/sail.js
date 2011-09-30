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
        
        sail: {
            ck_new_note: function(sev) {
                $('#ck-notes-index').dataTable().fnAddData([
                    sev.payload.headline,
                    sev.origin,
                    sev.payload.keywords.join(", "),
                    sev.timestamp
                ])
            }
        }
    },
    
    
    showDiscussButton: function() {
        $('#ck-discuss-button').remove()
        
        button = $('<a id="ck-discuss-button" class="ck" href="#"><span class="label">discuss</span><img src="images/discuss.png" /></a>')
        
        button.click(function() {
            if ($(button).is('.active')) {
                CommonKnowledge.hideDiscussionPanel()
            } else {
                CommonKnowledge.showDiscussionPanel()
            }
        })
        
        $(CommonKnowledge.options.buttonContainer).append(button)
    },
    
    createDiscussionPanel: function() {
        //mask = $('<div id="ck-discussion-mask" class="mask" />')
        //$(CommonKnowledge.options.discussionContainer).append(mask)
        
        panel = $('<div id="ck-discussion-panel" class="ck widget-box"></div>')
        
        notesIndexLabel = $('<h1>Ongoing Discussion:</h1>')
        
        closeButton = $('<a id="ck-discussion-panel-close-button" class="ck" href="#">close</a>')
        
        closeButtonIcon = $('<span />')
        closeButtonIcon.addClass('ui-icon')
        closeButtonIcon.addClass('ui-icon-closethick')
        closeButton.click(function() {
            CommonKnowledge.hideDiscussionPanel()
        })

        closeButton.append(closeButtonIcon)
        
        newNoteButton = $('<button id="ck-new-note-button" class="ck">Write a New Note</button>')
        newNoteButton.button({icons: {primary: 'ui-icon-pencil'}})
        newNoteButton.click(function() {
            $('#ck-new-note').slideDown('fast')
        })
        
        panel.append(notesIndexLabel)
        panel.append(closeButton)
        panel.append(newNoteButton)
        panel.append(CommonKnowledge.createNotesIndex())
        panel.append(CommonKnowledge.createNewNoteForm())
        
        return panel
    },
    
    showDiscussionPanel: function() {
        $(button).addClass('active')
        src = $(button).find('img').attr('src')
        $(button).find('img').attr('src', src.replace('.png','-active.png'))
        
        if (!this.panel) {
            this.panel = this.createDiscussionPanel()
            $(CommonKnowledge.options.discussionContainer).append(this.panel)
        } else {
            this.panel.show()
        }
    },
    
    hideDiscussionPanel: function() {
        $(button).removeClass('active')
        src = $(button).find('img').attr('src')
        $(button).find('img').attr('src', src.replace('-active.png','.png'))
        
        this.panel.hide()
    },
    
    createNewNoteForm: function() {
        noteForm = $('<form id="ck-new-note" class="ck note" />')
        noteForm.hide() // initially hidden
    
        noteFieldset = $('<fieldset />')
        noteFieldset.append('<legend>New Note</legend>')
        noteForm.append(noteFieldset)
    
        noteTextarea = $('<textarea class="ck writeup" name="writeup"></textarea>')
        noteHeadline = $('<label>Headline:</label> <input class="ck headline" type="text" name="headline" />')
    
        addNoteButton = $('<button id="ck-add-note-button" class="ck" type="submit">Submit</button>')
        addNoteButton.button({icons: {primary: 'ui-icon-plusthick'}})
    
        addNoteButton.click(function(ev) {
            ev.stopPropagation() // prevent page from reloading
            payload = { run: Sail.app.run }
            noteForm = $('#ck-new-note')
            $('form.ck.note textarea, form.ck.note input').each(function() {
                payload[$(this).attr('name')] = $(this).val()
            })
            payload.keywords = ['foo', 'bar', 'test', 'blah'] // TODO: just testing for now...
            payload._id = CommonKnowledge.generateNoteId()
            sev = new Sail.Event('ck_new_note', payload)
        	Sail.app.groupchat.sendEvent(sev)
        	noteForm[0].reset()
        	addNoteButton.attr('disabled','disabled')
        })
    
        cancelNoteButton = $('<button id="ck-cancel-note-button" class="ck" type="reset">Cancel</button>')
        cancelNoteButton.button({icons: {primary: 'ui-icon-closethick'}})
    
        cancelNoteButton.click(function(ev) {
            ev.stopPropagation() // prevent page from reloading
            noteForm = $('#ck-new-note')
            noteForm[0].reset()
            noteForm.slideUp('fast')
        })
    
        noteForm.bind('keyup change', function() {
            if ($(this).find('.headline').val().length > 0 && $(this).find('.writeup').val().length > 0) {
                addNoteButton.removeAttr('disabled')
            }
        })
    
        addNoteButton.attr('disabled','disabled')
    
        noteFieldset.append(noteTextarea)
        noteFieldset.append(noteHeadline)
        noteFieldset.append(cancelNoteButton)
        noteFieldset.append(addNoteButton)
        noteFieldset.append($('.ck.extra-note-fields'))
        
        return noteForm
    },
    
    showNewNoteForm: function() {
        if (!this.newNoteForm) {
            this.newNoteForm = this.createNewNoteForm()
            this.panel.append(this.newNoteForm)
        }
        
        this.newNoteForm.show()
    },
    
    createNotesIndex: function() {
        table = $('<table id="ck-notes-index"></table>')
        table.append('<thead><tr><th>Headline</th><th>Author</th><th>Keywords</th><th>Date</th></tr></thead>')
        table.dataTable({
            "oLanguage": {
                "sEmptyTable": "There aren't any notes in this discussion yet."
            },
            "bJQueryUI": true
        })
        $('#ck-notes-index tbody tr').live('click', function() {
            if ($(this).is('.selected')) {
                $(this).removeClass('selected')
            } else {
                $('#ck-notes-index tbody tr').removeClass('selected')
                $(this).addClass('selected')
            }
        })
        return table
    },
    
    createNoteDetailPanel: function() {
      detailPanel = $('<div id="ck-note-detail" class="ck"></div>')
      detailPanel.append('<div class="author"></div>')
      detailPanel.append('<h3 class="headline"></h3>')
      detailPanel.append('<div class="writeup"></div>')
      detailPanel.append('<div class="keywords"></div>')
      
      return detailPanel
    },
    
    // generate a pseudo-unique identifier for a note
    generateNoteId: function() {
        return Math.floor((Math.random() * 1e50)).toString(36)
    }
}