var Sail = window.Sail || {}

Sail.UI = {
    init: function() {
        $(document).ready(function() {
            $('button').button()
            $('.dialog button').click(function(){
                Sail.UI.dismissDialog($(this).parents('.dialog'))
            })
        })
    },
    
    showDialog: function(jq) {
        mask = $('<div class="mask"></div>')
        mask.insertAfter(jq)
        $(jq).show()
    },
    
    dismissDialog: function(jq) {
        $(jq).next('.mask').remove()
        $(jq).fadeOut('fast')
    }
}