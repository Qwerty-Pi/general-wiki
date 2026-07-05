const style = {
    dark: {
        color: "#cccccc",
        backgroundColor: "#151515"
    },
    light: {
        color: "#151515",
        backgroundColor: "#cccccc"
    },
    what: {
        color: "#af1aff",
        backgroundColor: "#75e68c"
    }
}

class StyleStorage {
    load() {
        this.mode = localStorage.getItem("mode") ?? 'dark'
        this.color = localStorage.getItem("color") ?? style.dark.color
        this.backgroundColor = localStorage.getItem("backgroundColor") ?? style.dark.backgroundColor
        this.fontFamily = localStorage.getItem("fontFamily") ?? 'code'
        this.apply()
    }
    apply() {
        if (this.mode == "dark") {
            this.color = style.dark.color
            this.backgroundColor = style.dark.backgroundColor
        } else if (this.mode == "light") {
            this.color = style.light.color
            this.backgroundColor = style.light.backgroundColor
        } else if (this.mode == "what") {
            this.color = style.what.color
            this.backgroundColor = style.what.backgroundColor
        }
        
        $("#mode").val(this.mode)

        $("#text-color").val(this.color)
        $(":root").css("--text-color", this.color)

        $("#background-color").val(this.backgroundColor)
        $(":root").css("--background-color", this.backgroundColor)

        let fontFamily = '"Cascadia Code", monospace';
        if (this.fontFamily === 'code') {
            fontFamily = '"Cascadia Code", monospace'
        } else if (this.fontFamily === 'times') {
            fontFamily = 'Times, Times New Roman, serif'
        } else if (this.fontFamily === 'sans') {
            fontFamily = 'Gill Sans, sans-serif'
        } else if (this.fontFamily === 'lexend') {
            fontFamily = 'Lexend'
        }
        $("#font-family").val(this.fontFamily)
        $(":root").css('--font-family', fontFamily)
    }

    edit(attr, val) {
        this[attr] = val
        localStorage.setItem(attr, val)
        this.apply() // apply to css variable
    }
}

$(window).on('load', function() {
    storage = new StyleStorage()
    storage.load()
})

$("#text-color").on('input', function() {
    storage.edit('color', $(this).val())
    storage.edit('mode', 'custom') // enforce custom
})
$("#background-color").on('input', function() {
    storage.edit('backgroundColor', $(this).val())
    storage.edit('mode', 'custom') // enforce custom
})
$("#font-family").on('input', function() {
    storage.edit('fontFamily', $(this).val())
})
$("#mode").on('input', function() {
    storage.edit('mode', $(this).val())
})