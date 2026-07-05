const style = {
    dark: {
        color: "#cccccc",
        backgroundColor: "#151515"
    },
    light: {
        color: "#151515",
        backgroundColor: "#ffffff"
    },
    what: {
        color: "#af1aff",
        backgroundColor: "#75e68c"
    }
}

function rgbToHue(r, g, b) {
    // convert rgb values to the range of 0-1
    var h;
    r /= 255, g /= 255, b /= 255;

    // find min and max values out of r,g,b components
    var max = Math.max(r, g, b), min = Math.min(r, g, b);

    // all greyscale colors have hue of 0deg
    if(max-min == 0){
        return 0;
    }

    if(max == r){
        // if red is the predominent color
        h = (g-b)/(max-min);
    }
    else if(max == g){
        // if green is the predominent color
        h = 2 +(b-r)/(max-min);
    }
    else if(max == b){
        // if blue is the predominent color
        h = 4 + (r-g)/(max-min);
    }

    h = h*60; // find the sector of 60 degrees to which the color belongs
    // https://www.pathofexile.com/forum/view-thread/1246208/page/45 - hsl color wheel

    // make sure h is a positive angle on the color wheel between 0 and 360
    h %= 360;
    if(h < 0){
        h += 360;
    }

    return Math.round(h);
}

function rgbToInvert(color) {
    let R = parseInt(color.substring(1, 3), 16)
    let G = parseInt(color.substring(3, 5), 16)
    let B = parseInt(color.substring(5, 7), 16)
    let hue = rgbToHue(R, G, B)
    let invert = 1.0 - (R + G + B) / 3 / 256
    return invert
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

        // decide how to invert images...
        // only work for grayscale for now
        // well, at least it works for grayscale
        $(":root").css("--invert-light", rgbToInvert(this.backgroundColor))
        $(":root").css("--invert-dark", rgbToInvert(this.color))
        
        let fontFamily = '"Cascadia Code", monospace';
        if (this.fontFamily === 'code') {
            fontFamily = '"Cascadia Code", monospace'
        } else if (this.fontFamily === 'times') {
            fontFamily = 'Times, "Times New Roman", serif'
        } else if (this.fontFamily === 'sans') {
            fontFamily = '"Source Sans 3", sans-serif'
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