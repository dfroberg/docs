.ready(function () {
window.ace.config.setModuleUrl(
    "ace/theme/clouds", 
    "http://ajaxorg.github.io/ace-builds/src-noconflict/theme-clouds.js" // Gollum does not include all ACE themes for performance reasons, so tell ACE where to find the themes online.
)
window.ace_editor.setTheme('ace/theme/clouds') // Set theme to clouds
window.ace_editor.setOption("showPrintMargin", false) // Optionally turn off the print margin (vertical line)
})
