/*
* @fileOverview TouchPDF - jQuery Plugin
* @version 0.4
*
* @author Loic Minghetti http://www.loicminghetti.net
* @see https://github.com/loicminghetti/TouchPDF-Jquery-Plugin
* @see http://plugins.jquery.com/project/touchPDF
*
* Copyright (c) 2014 Loic Minghetti
* Dual licensed under the MIT or GPL Version 2 licenses.
*
*/

/**
 * See (http://jquery.com/).
 * @name $
 * @class 
 * See the jQuery Library  (http://jquery.com/) for full details.  This just
 * documents the function and classes that are added to jQuery by this plug-in.
 */
 
/**
 * See (http://jquery.com/)
 * @name fn
 * @class 
 * See the jQuery Library  (http://jquery.com/) for full details.  This just
 * documents the function and classes that are added to jQuery by this plug-in.
 * @memberOf $
 */


(function ($) {
	"use strict";

	//Constants
	var EMPTY = "empty",
		INIT = "init",
		LOADING = "loading",
		LOADED = "loaded",
		ZOOMEDIN = "zoomedin",
		DRAGGING = "dragging",
		RENDERING = "rendering",
		
		PLUGIN_NS = 'TouchPDF',
		
		TOOLBAR_HEIGHT = 30,
		BORDER_WIDTH = 1,
		TAB_SPACING = -2,
		TAB_WIDTH = 41,
		TAB_OFFSET_WIDTH = 10;


	/**
	* The default configuration, and available options to configure touchPDF with.
	* You can set the default values by updating any of the properties prior to instantiation.
	* @name $.fn.pdf.defaults
	* @namespace
	* @property {string} [source=""] Path of PDF file to display
	* @property {string} [title="TouchPDF"] Title of the PDF to be displayed in the toolbar
	* @property {array} [tabs=[]] Array of tabs to display on the side. See doc for syntax.
	* @property {string} [tabsColor="beige" Default background color for all tabs. Available colors are "green", "yellow", "orange", "brown", "blue", "white", "black" and you can define your own colors with CSS.
	* @property {boolean} [disableZoom=false] Disable zooming of PDF document. By default, PDF can be zoomed using scroll, two fingers pinch, +/- keys, and toolbar buttons
	* @property {boolean} [disableSwipe=false] Disable swipe to next/prev page of PDF document. By default, PDF can be swiped using one finger
	* @property {boolean} [disableLinks=false] Disable all internal and external links on PDF document
	* @property {boolean} [disableKeys=false] Disable the arrow keys for next/previous page and +/- for zooming (if zooming is enabled)
	* @property {boolean} [redrawOnWindowResize=true] Force resize of PDF viewer on window resize
	* @property {float} [pdfScale=1] Defines the ratio between your PDF page size and the tabs size
	* @property {float} [quality=2] Set quality ratio for loaded PDF pages. Set at 2 for sharp display when user zooms up to 200%
	* @property {boolean} [showToolbar=true] Show a toolbar on top of the document with title, page number and buttons for next/prev pages and zooming
	* @property {function} [loaded=null] A handler triggered when PDF document is loaded (before display of first page)
	* @property {function} [changed=null] A handler triggered each time a new page is displayed
	* @property {string} [loadingHTML="Loading PDF"] Text or HTML displayed on white page shown before document is loaded 
	* @property {function} [loadingHeight=841] Height in px of white page shown before document is loaded 
	* @property {function} [loadingWidth=595] Width in px of white page shown before document is loaded 
	*/
	var defaults = {
		source: null,
		title: "TouchPDF",
		tabs: [],
		tabsColor: "beige",
		disableZoom: false,
		disableSwipe: false,
		disableLinks: false,
		disableKeys: false,
		pdfScale: 1,
		quality: 2,
		redrawOnWindowResize: true,
		showToolbar: true,
		loaded: null,
		changed: null,
		loadingHeight: 841,
		loadingWidth: 595,
		loadingHTML: "Loading PDF"
	};



	/**
	* Load a PDF file in a div
	* The TouchPDF plugin can be instantiated via this method, or methods within 
	* @see TouchPDF
	* @class
	* @param {Mixed} method If the current DOMNode is a TouchPDF object, and <code>method</code> is a TouchPDF method, then
	* the <code>method</code> is executed, and any following arguments are passed to the TouchPDF method.
	* If <code>method</code> is an object, then the TouchPDF class is instantiated on the current DOMNode, passing the 
	* configuration properties defined in the object. See TouchPDF
	*/
	$.fn.pdf = function (method) {
		var $this = $(this),
			plugin = $this.data(PLUGIN_NS);

		//Check if we are already instantiated and trying to execute a method	
		if (plugin && typeof method === 'string') {
			if (plugin[method]) {
				return plugin[method].apply(this, Array.prototype.slice.call(arguments, 1));
			} else {
				$.error('Method ' + method + ' does not exist on jQuery.pdf');
			}
		}
		//Else not instantiated and trying to pass init object (or nothing)
		else if (!plugin && (typeof method === 'object' || !method)) {
			return init.apply(this, arguments);
		}

		return $this;
	};

	//Expose our defaults so a user could override the plugin defaults
	$.fn.pdf.defaults = defaults;


	/**
	* Initialise the plugin for each DOM element matched
	* This creates a new instance of the main TouchPDF class for each DOM element, and then
	* saves a reference to that instance in the elements data property.
	* @internal
	*/
	function init(options) {
		//Prep and extend the options
		if (!options) {
			options = {};
		}
		options = $.extend({}, $.fn.pdf.defaults, options);

		//For each element instantiate the plugin
		return this.each(function () {
			var $this = $(this);

			//Check we havent already initialised the plugin
			var plugin = $this.data(PLUGIN_NS);
			if (!plugin) {
				plugin = new TouchPDF(this, options);
				$this.data(PLUGIN_NS, plugin);
			}
		});
	}

	/**
	* Main TouchPDF Plugin Class.
	* Do not use this to construct your TouchPDF object, use the jQuery plugin method $.fn.pdf(); {@link $.fn.pdf}
	* @private
	* @name TouchPDF
	* @param {DOMNode} element The HTML DOM object to apply to plugin to
	* @param {Object} options The options to configure the plugin with.  @link {$.fn.pdf.defaults}
	* @see $.fn.pdf.defaults
	* @see $.fn.pdf
    * @class
	*/
	function TouchPDF(element, options) {

	
		// Current phase of pdf loading
		var state = EMPTY;
		// Number of pages
		var totalPages = 0;
		// Page to be displayed
		var pageNum = 0;
		// Page currently rendering
		var pageNumRendering = 0;
		// jQuery wrapped element for this instance
		var $element = $(element);
		// PDF canvas
		var canvas = null;
		// jQuery wrapped PDF annotation layer
		var $annotations = null;
		// PDF.JS object
		var pdfDoc = null;

		var scale = 1;

		var ctx = false;
		
		var pagesRefMap = [];
		
		var plugin = this;
		
		var tabWidth = 0;
		var $drag = null, $viewer = null;

		var linksDisabled = false;
		
		initDom();
		load();

		
		//
		//Public methods
		//

		/**
		* Go to specific page of PDF file
		* @function
		* @name $.fn.pdf#goto
		* @return {DOMNode} The Dom element that was registered with TouchPDF 
		* @example $("#element").pdf("goto", 10);
		*/
		this.goto = function (number) {
			goto(number);
			return $element;
		};

		/**
		* Go to previous page of PDF file, until first page
		* @function
		* @name $.fn.pdf#previous
		* @return {DOMNode} The Dom element that was registered with TouchPDF 
		* @example $("#element").pdf("previous");
		*/
		this.previous = function () {
			goto(pageNum-1);
			return $element;
		};

		/**
		* Go to next page of PDF file, until end of pdf
		* @function
		* @name $.fn.pdf#next
		* @return {DOMNode} The Dom element that was registered with TouchPDF 
		* @example $("#element").pdf("next");
		*/
		this.next = function () {
			goto(pageNum+1);
			return $element;
		};

		/**
		* Force redraw of pdf (height, width and zoom)
		* @function
		* @name $.fn.pdf#redraw
		* @return {DOMNode} The Dom element that was registered with TouchPDF 
		* @example $("#element").pdf("redraw");
		*/
		this.redraw = function () {
			redraw();
			return $element;
		};

		/**
		* Destroy the pdf container completely.
		* @function
		* @name $.fn.pdf#destroy
		* @example $("#element").pdf("destroy");
		*/
		this.destroy = function () {
			$element.empty().removeClass("touchPDF");
			
		};

		/**
		* Get the current page number (may not be rendered yet)
		* @function
		* @name $.fn.pdf#getPageNumber
		* @return {int} Current page number, 0 if PDF is not loaded
		* @example $("#element").pdf("getPageNumber");
		*/
		this.getPageNumber = function () {
			return pageNum;
		};

		/**
		* Get the total number of pages of loaded PDF
		* @function
		* @name $.fn.pdf#getTotalPages
		* @return {int} The number of pages, 0 if PDF is not loaded
		* @example $("#element").pdf("getTotalPages");
		*/
		this.getTotalPages = function () {
			return totalPages;
		};
		
		
		

		//
		// Private methods
		//
		
		
		function goto(number) {
			if (state == EMPTY || state == INIT) return;
			if (number < 1) number = 1;
			if (number > totalPages) number = totalPages;
			if (number == 0) return;
			pageNum = number;
			renderPage();

			// update tabs
			var z = 1;
			$element.find(".pdf-tabs .tab").each(function(i, a) {
				var $a = $(a);
				var aPageNum = $a.data("page");
				if ( aPageNum < number) {
					$a.removeClass("right");
					$a.css("z-index", 1000+z++);
				} else if (aPageNum == number) {
					$a.removeClass("right");
					$a.css("z-index", 1000+z++);
				} else {
					$a.addClass("right");
					$a.css("z-index", 1000-z++);
				}
			});
		}
		
		function initDom() {
			if (state != EMPTY) return;
			$element.addClass("touchPDF").html(
				'<div class="pdf-outerdiv">'
				 + '<div class="pdf-tabs"></div>'
				 + '<div class="pdf-toolbar"></div>'
				 + '<div class="pdf-viewer">'
					+ '<div class="pdf-loading">'+options.loadingHTML+'</div>'
					+ '<div class="pdf-drag">'
						+ '<div class="pdf-canvas">'
							+ '<canvas></canvas>'
							+ '<div class="pdf-annotations"></div>'
						+ '</div>'
				 	+ '</div>'
				 + '</div>'
				+ '</div>');
			
			if (options.showToolbar) {
				
				$element.find(".pdf-toolbar").html(
					'<div class="pdf-title">'+options.title+'</div>'
				 	+ '<div class="pdf-button"><button class="pdf-prev">&lt;</button></div>'
				 	+ '<div class="pdf-button"><span class="pdf-page-count"></span></div>'
				 	+ '<div class="pdf-button"><button class="pdf-next">&gt;</button></div>'
				 	+ (options.disableZoom? '':'<div class="pdf-button"><button class="pdf-zoomin">+</button></div>'
				 		+ '<div class="pdf-button"><button class="pdf-zoomout">-</button></div>')
				 	);
				
				$element.find(".pdf-toolbar > .pdf-title").on("click", function() {
					goto(1);
				});
				$element.find(".pdf-toolbar > .pdf-button > .pdf-prev").on("click", function() {
					goto(pageNum-1);
				});
				$element.find(".pdf-toolbar > .pdf-button > .pdf-next").on("click", function() {
					goto(pageNum+1);
				});
			}

			$drag = $element.find(".pdf-drag");
			$viewer = $element.find(".pdf-viewer");
			
			
			if (!options.disableKeys) {
				$(window).keydown(function(event) {
					if (event.keyCode == 37) goto(pageNum-1);
					else if (event.keyCode == 39) goto(pageNum+1);
				});
			}
			
			if (options.redrawOnWindowResize) {
				var windowResizeTimeout = false;
				$( window ).resize(function() {
					clearTimeout(windowResizeTimeout);
					windowResizeTimeout = setTimeout(function() {
						redraw();
					}, 100);
				});
			}

			if (!options.disableZoom) {

          		$drag.panzoom({
          			contain: 'invert',
          			minScale: 1, 
          			disablePan: true,
          			increment: 0.25,
          			maxScale: 2,
          			onChange: function() {
          				linksDisabled = true;
          				$drag.panzoom("option", "disablePan", false);
						state = ZOOMEDIN;
          			},
          			onEnd: function() {
          				setTimeout(function() {
          					linksDisabled = false;
							if ($drag.panzoom("getMatrix")[0] == 1) zoomReset();
          				}, 1);
          			}

    			});
          		$drag.panzoom('enable');

				$drag.parent().on('mousewheel.focal', function( e ) {
					e.preventDefault();
					var delta = e.delta || e.originalEvent.wheelDelta;
					var direction = delta ? delta < 0 : e.originalEvent.deltaY > 0;
					if (direction) zoomOut(e);
					else zoomIn(e);
				});

				if (options.showToolbar) {
					$element.find(".pdf-toolbar > .pdf-button > .pdf-zoomin").on("click", function() {
						zoomIn();
					});
					$element.find(".pdf-toolbar > .pdf-button > .pdf-zoomout").on("click", function() {
						zoomOut();
					});
				}

				if (!options.disableLinks) {
					// enable links while zoomed in
					var touchlink = null;
					$drag.on('touchstart', "a", function( e ) {
						touchlink = this;
						setTimeout(function() {
							touchlink = null;
						}, 100);
					});	
					$drag.on('touchend', "a", function( e ) {
						if (this == touchlink) {
					  		e.stopImmediatePropagation();
							this.click();
						}
					});
				}
			}
					

			if (!options.disableSwipe) {
				$viewer.swipe( {
					swipe:function(event, direction, distance, duration, fingerCount, fingerData) {
						if (state != LOADED) return;
						linksDisabled = true;
		      			setTimeout(function() {linksDisabled = false;}, 1);
						if (direction == "right") goto(pageNum-1);
						else if (direction == "left") goto(pageNum+1);
					},
					threshold:50,
					excludedElements: ".noSwipe"
				});
			}

			canvas = $element.find("canvas")[0];
			ctx = canvas.getContext('2d');
			
			$annotations = $element.find(".pdf-annotations");
			
			state = INIT;

			redraw();
		}

		function zoomIn (focal) {
			if (options.disableZoom) return;
			if (state != ZOOMEDIN && state != LOADED) return;
			state = ZOOMEDIN;
			$drag.panzoom('zoom', false, {
				increment: 0.25,
				animate: true,
				focal: focal
			});
			linksDisabled = false;
		}

		function zoomOut(focal) {
			if (options.disableZoom) return;
			if (state != ZOOMEDIN) return;
			$drag.panzoom('zoom', true, {
				increment: 0.25,
				animate: true,
				focal: focal
			});
			linksDisabled = false;

			if ($drag.panzoom("getMatrix")[0] == 1) zoomReset();
		}
		function zoomReset() {
			if (options.disableZoom) return;
			$drag.panzoom('reset');
			linksDisabled = false;
			$drag.panzoom("option", "disablePan", true);
			state = LOADED;
		}

		/**
		 * Asynchronously downloads PDF.
		 */
		function load () {
			if (state != INIT) return;
			state = LOADING;

			PDFJS.getDocument(options.source).then(function (pdfDoc_) {
				pdfDoc = pdfDoc_;
				totalPages = pdfDoc.numPages;
				if (totalPages < 1) return;
				
				state = LOADED;
				if (options.loaded) options.loaded()
				goto(1);
			});
			
			if (options.tabs && $.isArray(options.tabs)) {
				
				var top = [];
				var maxOffset = 0;
				
				$.each(options.tabs, function(i, tab) {
					if(tab.offset && tab.offset > maxOffset) maxOffset = tab.offset;
				});
				
				tabWidth = TAB_WIDTH + TAB_OFFSET_WIDTH * maxOffset;

				$.each(options.tabs, function(i, tab) {
					var offset = tab.offset || 0;
					if (top[offset] === undefined) {
						top[offset] = 5 + TOOLBAR_HEIGHT;
					}
										
					var $a = $("<a>")
						.addClass("tab")
						.data("page", tab.page)
						.css("margin-left", offset*TAB_OFFSET_WIDTH+"px")
						.css("margin-right", (maxOffset-offset)*TAB_OFFSET_WIDTH+"px")
						.click(function() {
							if (tab.page == pageNumRendering) goto(tab.page-1);
							else goto(tab.page)
						});
					var $span = $("<span>")
						.html(tab.title)
						.appendTo($a);
						
					if (tab.bottom !== undefined) {
						$a.css("bottom", tab.bottom);
					} else {
						if (tab.top !== undefined) top[offset] = tab.top + TOOLBAR_HEIGHT;
						$a.css("top", top[offset]);
					}
					
					if (tab.title.length > 2) $a.addClass("large");
					if (!tab.color) tab.color = options.tabsColor;
					$a.addClass(tab.color);
					if (tab.height) {
						$a.css("height", tab.height);
						$span.css("width", tab.height);
					}
					
					$element.find(".pdf-tabs").append($a);
					
					if (tab.bottom === undefined) top[offset] += $a.height() + TAB_SPACING;
				});
			}
		}

		/**
		* Get page info from document, resize canvas accordingly, and render page.
		* @param num Page number.
		*/
		function renderPage () {
			if (state != LOADED && state != ZOOMEDIN) return;
			if (pageNum == pageNumRendering) return;

			zoomReset();
			state = RENDERING;
			pageNumRendering = pageNum;
			updatePageCount();

			// Using promise to fetch the page
			pdfDoc.getPage(pageNumRendering).then(function(page) {
				var viewport = page.getViewport(options.pdfScale*options.quality);
				canvas.height = viewport.height;
				canvas.width = viewport.width;
				$(".pdf-canvas").css("transform", "scale("+(1/options.quality)+")").css("transform-origin", "top left");

				// Render PDF page into canvas context
				var renderTask = page.render({
					canvasContext: ctx,
					viewport: viewport
				});

				if (!options.disableLinks) {
					renderAnnotations(page, viewport);
				}

				// Wait for rendering to finish
				renderTask.promise.then(function () {
					state = LOADED;
					if (pageNumRendering != pageNum) {
						// New page rendering is pending
						renderPage();
					}
				});

				redraw();
				$element.find(".pdf-loading").hide();
				$element.find(".pdf-tabs").css("visibility", "visible");
				$element.find("canvas").css("visibility", "visible");

				if (options.changed) options.changed();

			});
		}


		function redraw() {
			
			if (state == INIT) {
				var pdfHeight = options.loadingHeight;
				var pdfWidth = options.loadingWidth;

			} else {
				var pdfHeight = canvas.height / options.quality;
				var pdfWidth = canvas.width / options.quality;
			}
			var winHeight = $element.height();
			var winWidth = $element.width();
		

			scale = Math.min( winHeight / (pdfHeight + TOOLBAR_HEIGHT + BORDER_WIDTH*2), winWidth / (pdfWidth + tabWidth*2 + BORDER_WIDTH*2) );
			if (scale > 1) scale = 1;

			$element.find(".pdf-outerdiv")
				.css("transform", "scale("+scale+")")
				.css("width", pdfWidth + BORDER_WIDTH*2)
				.css("height", pdfHeight + TOOLBAR_HEIGHT + BORDER_WIDTH*2)
				.css("padding", "0 "+tabWidth+"px")
				.css("left", (winWidth - scale*(pdfWidth + tabWidth*2 + BORDER_WIDTH*2))/2);
			
			$element.find(".pdf-toolbar")
				.css("width", pdfWidth)
				.css("height", TOOLBAR_HEIGHT)
				.css("left", tabWidth + BORDER_WIDTH);
			
			$viewer
				.css("width", pdfWidth)
				.css("height", pdfHeight)
				.css("left", tabWidth)
				.css("top", TOOLBAR_HEIGHT)
				.css("border-width", BORDER_WIDTH);

			$drag
				.css("width", pdfWidth)
				.css("height", pdfHeight);

			if (!options.disableZoom) {
				$drag.panzoom('resetDimensions');
			}

			if (!options.disableSwipe) {
				$viewer.swipe("option", "threshold", 75*scale);
			}
			
			
		}



		function updatePageCount() {
			if (state == EMPTY || state == INIT) return;
			$element.find(".pdf-page-count").html(pageNum + " / " + totalPages);
		}

		function getPageIndex(destRef) {
			var defer = $.Deferred();
			
			if (pagesRefMap[destRef.num + ' ' + destRef.gen + ' R']) {
				defer.resolve(pagesRefMap[destRef.num + ' ' + destRef.gen + ' R']);
				
			} else {
				pdfDoc.getPageIndex(destRef).then(function (pageIndex) {
					pagesRefMap[destRef.num + ' ' + destRef.gen + ' R'] = pageIndex + 1;
					defer.resolve(pageIndex + 1);
				});
			}
			return defer.promise();
		}

		function renderAnnotations(page, viewport) {
			if (state != RENDERING) return;

			$annotations.empty();

			page.getAnnotations().then(function (annotationsData) {
				
				viewport = viewport.clone({dontFlip: true});
				
				$.each(annotationsData, function(i, data) {
					if (!data || !data.hasHtml || data.subtype !== 'Link' || (!data.dest && !data.url)) return;

					var $el = $(PDFJS.AnnotationUtils.getHtmlElement(data, page.commonObjs));
					var rect = data.rect;
					var view = page.view;
					rect = PDFJS.Util.normalizeRect([
						rect[0],
						view[3] - rect[1] + view[1],
						rect[2],
						view[3] - rect[3] + view[1]
						]);
					$el.css("left", rect[0] + 'px')
						.css("top", rect[1] + 'px')
						.css("position", 'absolute');

					var transform = viewport.transform;
					var transformStr = 'matrix(' + transform.join(',') + ')';
					$el.css('transform', transformStr);
					var transformOriginStr = -rect[0] + 'px ' + -rect[1] + 'px';
					$el.css('transformOrigin', transformOriginStr);

					var link = $el.find("a")
						.on('mousedown', function(e) {
							e.preventDefault();
						});

					if (data.url) {

						link.addClass("externalLink")
						.attr("href", data.url)
						.attr("target", "_blank");

					} else if (data.dest) {

						link.addClass("internalLink")
						.data("dest", data.dest)
						.on('click', function(e) {
							if (state != LOADED && state != ZOOMEDIN) return false;
							if (linksDisabled) return false;
							var dest = $(this).data("dest");

							if (dest instanceof Array) {
								getPageIndex(dest[0]).then( function ( num ) {
									if (state != LOADED && state != ZOOMEDIN) return;
									goto(num);
								});
							} else {
								pdfDoc.getDestination($(this).data("dest")).then(function(destRefs) {
									if (!(destRefs instanceof Array)) return; // invalid destination
									getPageIndex(destRefs[0]).then( function ( num ) {
										if (state != LOADED && state != ZOOMEDIN) return;
										if (linksDisabled) return;
										goto(num);
									});
								});
							}
							return false;
						});
					}

					$annotations.append($el);
				});

			});

		}
		
	
	}


})(jQuery );

