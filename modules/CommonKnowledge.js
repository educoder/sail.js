CommonKnowledge = {
    options: {
        buttonContainer: 'body',
        discussionContainer: 'body'
    },
    
    context: {
        discussable: true,
        selectableTags: [],
        autoTags: []
    },
    
    events: {
        initialized: function(ev) {
            Sail.loadCSS(Sail.modules.defaultPath + 'CommonKnowledge.css')
        },
        
        authenticated: function(ev) {
            CommonKnowledge.showDiscussButton()
        },
        
        context_switch: function(ev, newContextData) {
            _.extend(CommonKnowledge.context, newContextData)
            
            if (CommonKnowledge.context.discussable) {
                CommonKnowledge.showDiscussButton()
            } else {
                CommonKnowledge.hideDiscussButton()
            }
            
            if (CommonKnowledge.newNoteForm) {
                CommonKnowledge.updateSelectableInputTags()
                CommonKnowledge.updateHiddenInputTags()
            }
        },
        
        sail: {
            ck_new_note: function(sev) {
                CommonKnowledge.addNotesToIndex({
                    content: {
                        writeup: sev.payload.writeup,
                        headline: sev.payload.headline,
                        keywords: sev.payload.keywords,
                    },
                    author: sev.origin,
                    timestamp: sev.timestamp,
                    run: sev.run,
                    _id: sev.payload.id
                })
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
    
    hideDiscussButton: function() {
        $('#ck-discuss-button').css('visibility', 'hidden')
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
            CommonKnowledge.showNewNoteForm()
        })
        
        panel.append(notesIndexLabel)
        panel.append(closeButton)
        panel.append(newNoteButton)
        panel.append(CommonKnowledge.createNotesIndex())
        
        CommonKnowledge.fetchExistingNotes()
        
        return panel
    },
    
    showDiscussionPanel: function() {
        $(button).addClass('active')
        src = $(button).find('img').attr('src')
        $(button).find('img').attr('src', src.replace('.png','-active.png'))
        
        if (!CommonKnowledge.panel) {
            CommonKnowledge.panel = CommonKnowledge.createDiscussionPanel()
            $(CommonKnowledge.options.discussionContainer).append(CommonKnowledge.panel)
        } else {
            CommonKnowledge.panel.show()
        }
    },
    
    hideDiscussionPanel: function() {
        $(button).removeClass('active')
        src = $(button).find('img').attr('src')
        $(button).find('img').attr('src', src.replace('-active.png','.png'))
        
        CommonKnowledge.panel.hide()
    },
    
    createNewNoteForm: function() {
        noteForm = $('<form id="ck-new-note" class="ck note" />')
        noteForm.hide() // initially hidden
    
        noteFieldset = $('<fieldset />')
        noteFieldset.append('<legend>New Note</legend>')
        noteForm.append(noteFieldset)
    
        noteTextarea = $('<textarea class="ck writeup" name="writeup"></textarea>')
        noteHeadline = $('<label>Headline:</label> <input class="ck headline" type="text" name="headline" />')
    
        noteKeywords = $('<label>Keywords:</label> <div class="keywords ck"></div>')
        
        addNoteButton = $('<button id="ck-add-note-button" class="ck" type="submit">Submit</button>')
        addNoteButton.button({icons: {primary: 'ui-icon-plusthick'}})
    
        addNoteButton.click(function(ev) {
            ev.preventDefault() // prevent page from reloading
            payload = {}
            noteForm = $('#ck-new-note')
            $('form.ck.note textarea, form.ck.note input').each(function() {
                payload[$(this).attr('name')] = $(this).val()
            })
            payload.keywords = noteForm.find('.ck-selectable-tags .ck-input-tag.selected, .ck-auto-tags .ck-input-tag').map(function() {return $(this).text()}).toArray()
            
            payload.id = CommonKnowledge.generateNoteId()
            sev = new Sail.Event('ck_new_note', payload)
        	
        	Sail.app.groupchat.sendEvent(sev)
        	CommonKnowledge.resetNewNoteForm()
        	addNoteButton.attr('disabled','disabled')
        	setTimeout(CommonKnowledge.hideNewNoteForm, 300)
        })
    
        cancelNoteButton = $('<button id="ck-cancel-note-button" class="ck" type="reset">Cancel</button>')
        cancelNoteButton.button({icons: {primary: 'ui-icon-closethick'}})
    
        cancelNoteButton.click(function(ev) {
            ev.preventDefault() // prevent page from reloading
            noteForm = $('#ck-new-note')
            CommonKnowledge.resetNewNoteForm()
            CommonKnowledge.hideNewNoteForm()
        })
    
        noteForm.bind('keyup change', function() {
            if ($(this).find('.headline').val().length > 0 && $(this).find('.writeup').val().length > 0) {
                addNoteButton.removeAttr('disabled')
            }
        })
    
        addNoteButton.attr('disabled','disabled')
        
        noteFieldset.append(noteTextarea)
        noteFieldset.append(noteHeadline)
        noteFieldset.append(noteKeywords)
        noteFieldset.append(cancelNoteButton)
        noteFieldset.append(addNoteButton)
        
        noteFieldset.find('.keywords').append(CommonKnowledge.createSelectableTags())
        noteFieldset.find('.keywords').append(CommonKnowledge.createAutoTags())
        
        return noteForm
    },
    
    showNewNoteForm: function() {
        if (!CommonKnowledge.newNoteForm) {
            CommonKnowledge.newNoteForm = CommonKnowledge.createNewNoteForm()
            CommonKnowledge.panel.append(CommonKnowledge.newNoteForm)
        }
        
        CommonKnowledge.newNoteForm.slideDown('fast')
    },
    
    hideNewNoteForm: function() {
        CommonKnowledge.newNoteForm.slideUp('fast')
    },
    
    resetNewNoteForm: function() {
        CommonKnowledge.newNoteForm[0].reset()
        CommonKnowledge.newNoteForm.find('.ck-input-tag').removeClass('selected')
    },
    
    createSelectableTags: function() {
        tags = $('<div class="ck-tag-collection ck-selectable-tags"></div>')
        
        _.each(CommonKnowledge.context.selectableTags, function(t) {
            tag = $('<span class="ck-input-tag"></span>')
            tag.text(t)
            tag.click(function() {
                $(this).toggleClass('selected')
            })
            this.append(tag)
        }, tags)
        
        return tags
    },
    
    createAutoTags: function() {
        tags = $('<div class="ck-tag-collection ck-auto-tags"></div>')
        
        _.each(CommonKnowledge.context.autoTags, function(t) {
            tag = $('<span class="ck-input-tag"></span>')
            tag.text(t)
            this.append(tag)
        }, tags)
        
        return tags
    },
    
    updateSelectableInputTags: function() {
        if (!CommonKnowledge.newNoteForm)
            return // don't need to update yet
        
        CommonKnowledge.newNoteForm.find('.ck-selectable-tags').html('') // clear existing tags
        CommonKnowledge.newNoteForm.find('.ck-selectable-tags').append(CommonKnowledge.createSelectableTags())
    },
    
    updateHiddenInputTags: function() {
        if (!CommonKnowledge.newNoteForm)
            return // don't need to update yet
        
            CommonKnowledge.newNoteForm.find('.ck-auto-tags').html('') // clear existing tags
            CommonKnowledge.newNoteForm.find('.ck-auto-tags').append(CommonKnowledge.createAutoTags())
    },
    
    createNotesIndex: function() {
        index = $('<div id="ck-notes-index"></div>')
        table = $('<table id="ck-notes-index"></table>')
        table.append('<thead><tr><td /><th>Date</th><th>Headline</th><th>Author(s)</th></tr></thead>')
        table.dataTable({
            aoColumns: [
                {sClass: 'note-id'},
                {sClass: 'note-date'},
                {sClass: 'note-headline'},
                {sClass: 'note-author'},
                //{sClass: 'note-keywords'}
            ],
            iDisplayLength: 100,
            aaSorting: [[1,'desc']], // initially sort by date, descending
            bJQueryUI: true, // enable jQuery features
            oLanguage: {
                "sEmptyTable": "There aren't any notes in this discussion yet."
            },
        })
        $('#ck-notes-index tr').live('click', function() {
            if ($(this).is('.selected')) {
                $(this).removeClass('selected')
                CommonKnowledge.hideNoteDetailPanel()
            } else {
                $('#ck-notes-index tr.selected').removeClass('selected')
                $(this).addClass('selected')
                CommonKnowledge.showNoteDetailPanel()
                CommonKnowledge.loadNoteIntoDetailPanel($(this).data('note'))
            }
        })
        
        // need to do this becuase dataTable() for some reason insits on setting it to 0
        table.attr('style', null)
        
        index.append(table)
        return index
    },
    
    addNotesToIndex: function(notes) {
        if (notes.length === undefined)
            notes = [notes]
            
        data = _.map(notes, function(note) {
            return [
                note._id,
                CommonKnowledge.formatDate(note.timestamp),
                note.content.headline,
                note.author,
                //note.content.keywords && note.content.keywords.join(", ")
            ]
        })
        
        added = $('#ck-notes-index table').dataTable().fnAddData(data)
        
        _.each(added, function(idx) {
            //$(this.aoData[idx].nTr).effect('highlight', 'fast')
            tr = $(this.aoData[idx].nTr)
            id = tr.children('td.note-id').text().trim()
            note = _.detect(notes, function(n) { return n._id == id })
            tr.attr('id', 'note-'+id)
            tr.data('note', note)
        }, $('#ck-notes-index table').dataTable().fnSettings())
    },
    
    fetchExistingNotes: function() {
        // FIXME: will only fetch last 100 notes... need to implement paging
        $.ajax({
            url: (Sail.app.mongooseURL || '/mongoose') + '/common-knowledge/notes/_find',
            data: {
                criteria: JSON.stringify({'run.name':'wallcology-julia-fall2011'}),
                batch_size: 100, // 30 is the max that will comfortably fit on the screen... arbitrarily picked 100 for now
                sort: JSON.stringify({"timestamp":-1})
            },
            success: function(data) {
                console.debug("Got "+data.results.length+" notes from mongoose...")
                CommonKnowledge.addNotesToIndex(data.results)
            },
            error: function(xhr, error, ex) {
                console.error("Failed to load existing discussions: ", error, ex)
                alert("Failed to load existing discussions: "+error)
            }
        })
    },
    
    createNoteDetailPanel: function() {
      detailPanel = $('<div id="ck-note-detail" class="ck"></div>')
      detailPanel.hide() // initially hidden
      
      closeButton = $('<a class="note-hide" href="#">close</a>')
      closeButtonIcon = $('<span />')
      closeButtonIcon.addClass('ui-icon')
      closeButtonIcon.addClass('ui-icon-closethick')
      closeButton.click(function() {
          CommonKnowledge.hideNoteDetailPanel()
      })
      closeButton.append(closeButtonIcon)
      
      fieldset = $('<fieldset />')
      fieldset.append('<legend></legend>')
      fieldset.append(closeButton)
      
      fieldset.append('<h3 class="note-headline"></h3>')
      fieldset.append('<div class="note-writeup"></div>')
      //fieldset.append('<div class="note-author"><span class="by">by: </span><span class="name"></span></div>')
      fieldset.append('<div class="note-keywords"></div>')
      
      detailPanel.append(fieldset)
      
      return detailPanel
    },
    
    showNoteDetailPanel: function() {
        if (!CommonKnowledge.detail) {
            CommonKnowledge.detail = CommonKnowledge.createNoteDetailPanel()
            $(CommonKnowledge.panel).append(CommonKnowledge.detail)
            $(CommonKnowledge.detail).slideDown('fast')
        } else {
            $(CommonKnowledge.detail).slideDown('fast')
        }
    },
    
    hideNoteDetailPanel: function () {
        $(CommonKnowledge.detail).slideUp('fast')
    },
    
    loadNoteIntoDetailPanel: function(note) {
        if (!CommonKnowledge.detail) {
            CommonKnowledge.detail = CommonKnowledge.createNoteDetailPanel()
            $(CommonKnowledge.panel).append(CommonKnowledge.detail)
        }
        
        fieldset = CommonKnowledge.detail.children('fieldset')
        
        fieldset.find('legend').text(note.author+"'s Note")
        //fieldset.children('.note-author').children('.name').text(note.author)
        fieldset.children('.note-headline').text(note.content.headline)
        fieldset.children('.note-writeup').text(note.content.writeup)
        fieldset.children('.note-keywords').text(note.content.keywords)
    },
    
    // generate a pseudo-unique identifier for a note
    generateNoteId: function() {
        return Math.floor((Math.random() * 1e50)).toString(36)
    },
    
    formatDate: function(date) {
        if (typeof date == 'string')
            date = new Date(date)
        
        now = new Date()
        
        return _date(date).format("MMM D @ h:m:s a")
    }
}