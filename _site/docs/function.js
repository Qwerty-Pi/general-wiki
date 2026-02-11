function loadFile(code) {
    $.ajax ({
        method: "GET",
        url: window.location.origin + '/' + code.data("include"),
        success: function(content) {
            content = content
                .replaceAll("<", "&lt;")
                .replaceAll(">", "&gt;")
            code.html(content)
        }
    })
};

$(function () {
    var includes = $('[data-include]')
    $.each(includes, function () {
        loadFile($(this))
    })
})