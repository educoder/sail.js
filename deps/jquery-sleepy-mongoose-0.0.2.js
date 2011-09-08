(function($) {


    var SleepyMongo = function(settings) {


        function getOptions(opt) {
            var optString = '';
            if (typeof opt != "undefined")
                optString += '&' + decodeURIComponent($.param(opt));
            return optString;
        }

        this.find = function(criteriaObj, success, opt) {
            var criteriaString = encodeURI(JSON.stringify(criteriaObj));
            var optString = getOptions(opt);


            var getUrl = settings.sleepyUrl;
            $.get(getUrl + "_find", 'criteria=' + criteriaString + optString, success);
        }

        this.update = function(criteriaObj, newObj, success, opt) {
            var criteriaString = encodeURI(JSON.stringify(criteriaObj));
            var newObjString = encodeURI(JSON.stringify(newObj));
            var getUrl = settings.sleepyUrl;
            var optString = getOptions(opt);


            $.post(getUrl + "_update", 'criteria=' + criteriaString + optString + "&newobj=" + newObjString, success);
        }

        this.remove = function(criteriaObj, success, opt) {
            var criteriaString = encodeURI(JSON.stringify(criteriaObj));
            var getUrl = settings.sleepyUrl;
            var optString = getOptions(opt);

            $.post(getUrl + "_remove", 'remove=' + criteriaString + optString, success);
        }


        this.insert = function(docsObj, success, opt) {
            var docsObjString = encodeURI(JSON.stringify(docsObj));
            var getUrl = settings.sleepyUrl;
            var optString = getOptions(opt);

            $.post(getUrl + "_insert", 'docs=' + docsObjString + optString, success);
        }


        this.more = function(cursorId, success, opt) {
            var data = 'id=' + cursorId +  getOptions(opt);
            var getUrl = settings.sleepyUrl;

            $.get(getUrl + "_more", data, success);
        }


        this.cmd = function(cmdObj, success, opt) {
            var cmdString = encodeURI(JSON.stringify(cmdObj));
            var postUrl = settings.sleepyUrl;
            var optString = getOptions(opt);

            $.post(postUrl + "_cmd", 'cmd=' + cmdString + optString, success);
        }
    }

    $.fn.sleepyMongo = function (options) {

        var settings = {};

        if (options) {
            $.extend(settings, options);
        }

        return new SleepyMongo(settings);
    }


})(jQuery);