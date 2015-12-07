# TouchPDF
TouchPDF is a simple web PDF viewer for jQuery. It is based on the pdf.js library and support mobile gestures for swiping pages and zooming.

## Features
-	Use finger to swipe to next or previous page
-	Pinch to zoom in and out
-	Follow links to document sections or external URLs
-	Add colorful tabs for quick access to bookmarked pages
-	Loads directly in your DOM, without iFrame

## Supported browsers
Firefox, Chrome, Opera, IE >= 9, Safari, Android Browser

## Demo
Check out the online demo at: http://touchpdf.net/demo/index.htm

## Getting started

###Get the jQuery plugin
To get a local copy of the plugin, clone it using git:
````bash
$ git clone git:// github.com/loicminghetti/touchpdf.git touchpdf
$ cd touchpdf
````
Note: you need to start a local web server as some browsers don't allow opening PDF files for a file:// url.

###Usage
Add the following to your document's `<head>`
````html
<meta name="viewport" content="initial-scale=1.0, user-scalable=no" />
<script type="text/javascript" src="jquery.min.js"></script>
<script type="text/javascript" src="pdf.compatibility.js"></script>
<script type="text/javascript" src="pdf.js"></script>
<script type="text/javascript" src="jquery.touchSwipe.js"></script>
<script type="text/javascript" src="jquery.panzoom.js"></script>
<script type="text/javascript" src="jquery.mousewheel.js"></script>
<script type="text/javascript" src="jquery.touchPDF.js"></script>
<link href="jquery.touchPDF.css" rel="stylesheet" media="screen" /> 
````

Add an empty div in your document that will contain the PDF viewer
````html
<div id="myPDF"></div>
````

Load a PDF file by adding the following script at the end of your document
````html
<script type="text/javascript">
  $(function() {
    $("#myPDF").pdf( { source: "yourfile.pdf" } );
  });
</script>
````

You ca also add bookmarks tabs to your PDF display:
````javascript
$(function() {      
  $("#myPDF").pdf( {
    source: "demo.pdf",
    tabs: [
      {title: "Tab 1", page: 2, color: "orange"},
      {title: "Tab 2", page: 3, color: "green"},
      {title: "Tab 3", page: 5, color: "blue"},
    ]
 });
});
````

###Viewer options

Option | Type | Default | Description
------ | ---- | ------- | ----------------------
source | *string* | " " | Path of PDF file to display.
title | *string* | "TouchPDF" | Title of the PDF to be displayed in the toolbar.
tabs | *array* | [ ] | Array of tabs to display on the side. See below for syntax.
tabsColor | *string* | "beige" | Default background color for all tabs. Available colors are "green", "yellow", "orange", "brown", "blue", "white", "black" and you can define your own colors with CSS.
disableZoom | *boolean* | false | Disable zooming of PDF document. By default, PDF can be zoomed using scroll, two fingers pinch, +/- keys, and toolbar buttons.
disableSwipe | *boolean* | false | Disable swipe to next/prev page of PDF document. By default, PDF can be swiped using one finger.
disableLinks | *boolean* | false | Disable all internal and external links on PDF document..
disableKeys | *boolean* | false | Disable the arrow keys for next/previous page and +/- for zooming (if zooming is enabled).
redrawOnWindowResize | *boolean* | true | Force resize of PDF viewer on window resize.
pdfScale | *float* | 1 | Defines the ratio between your PDF page size and the tabs size.
quality | *float* | 2 | Set quality ratio for loaded PDF pages. Set at 2 for sharp display when user zooms up to 200%.
showToolbar | *boolean* | true | Show a toolbar on top of the document with title, page number and buttons for next/prev pages and zooming.
loaded | *function* | null | A handler triggered when PDF document is loaded (before display of first page).
changed | *function* | null | A handler triggered each time a new page is displayed.
loadingHTML | *string* | "Loading PDF" | Text or HTML displayed on white page shown before document is loaded.
loadingHeight | *int* | 841 | Height in px of white page shown before document is loaded (default is A4 height).
loadingWidth | *int* | 595 | Width in px of white page shown before document is loaded (default is A4 width).

###Tab attributes

Each tab must be defined using a json object with the following attributes:

Attribute | Type | Default | Description
--------- | ---- | ------- | ----------------------
title | *string* | *Mandatory* | Text to display on the tab. Text of less than 3 characters will be displayed horizontaly, longer text will be displayed verticaly. 
page | *int* | *Mandatory* | PDF document page number to link to. Page numbering starts at 1.
color | *string* | As defined in viewer | Set a different color to the tab. See above for available colors.
offset | *int* | 0 | Pill up tabs with a small offset so that the user knows there are hidden tabs behind. Starts at 0.
top | *int* | undefined | Align tab from the top of the PDF document, by a given number of pixels. By default, tabs are positioned one after the other.
bottom | *int* | undefined | Align tab from the bottom of the PDF document, by a given number of pixels.
height | *int* | undefined | Set a specific height to the tab. By default, tab height will depend on the number of characters in the title.

## Credit

This plugin heavily relies on the following great open source work:

- PDF.js by Mozilla https://mozilla.github.io/pdf.js/
- PanZoom jQuery plugin by Timmy Willison https://github.com/timmywil/jquery.panzoom
- TouchSwipe jQuery plugin by Matt Bryson https://github.com/mattbryson/TouchSwipe-Jquery-Plugin

## Getting help

If you need help you can contact me

**Enjoy and feel free to contribute!**
