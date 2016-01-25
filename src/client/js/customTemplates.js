var CustomTemplates = {
    custom1: function(context) {
        //var locale = context.locale;
        //var options = context.options;
        return "<li>" +
            "<div class='btn-group'>" +
            "<a class='btn btn-default' data-wysihtml5-action='formatBlock' data-wysihtml5-command-value='p' title='Normal text'>Normal text</a>" +
            "</div>" +
            "</li>";
    },
    customFontStyles: function(context) {
        var locale = context.locale;
        var options = context.options;
        var size = (options && options.size) ? ' btn-' + options.size : '';
        return "<li class='dropdown'>" +
            "<a class='btn btn-default dropdown-toggle" + size + "' data-toggle='dropdown' href='#'>" +
            "<span class='glyphicon glyphicon-font'></span>" +
            "&nbsp;<span class='current-font'>" + locale.font_styles.normal + "</span>&nbsp;<b class='caret'></b>" +
            "</a>" +
            "<ul class='dropdown-menu'>" +
            "<li><a data-wysihtml5-command='formatBlock' data-wysihtml5-command-value='div' tabindex='-1'>" + locale.font_styles.normal + "</a></li>" +
            "<li><a data-wysihtml5-command='formatBlock' data-wysihtml5-command-value='h2' tabindex='-1'>Heading</a></li>" +
            "</ul>" +
            "</li>";
    },
    save: function(context) {
        return "<li id='save-button-id'>" +
            "<div class='btn-group'>" +
            "<a class='btn btn-default' title='Save'>Save</a>" +
            "</div>" +
            "</li>";
    },
    saveAs: function(context) {
        return "<li id='save-as-button-id'>" +
            "<div class='btn-group'>" +
            "<a class='btn btn-default' title='Save'>Save as...</a>" +
            "</div>" +
            "</li>";
    }
};

module.exports = CustomTemplates;
