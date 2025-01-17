﻿/*! Copyright (c) 2011 Piotr Rochala (http://rocha.la)
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 *
 * Version: 0.5.0
 *
 */
(function($) {
  jQuery.fn.extend({
	slimScroll: function(options) {

	  var defaults = {
		wheelStep : 20,
		width : 'auto',
		height : '250px',
		size : '7px',
		color: '#000',
		distance : '1px',
		start : 'top',
		opacity : .4,
		alwaysVisible : false,
		railVisible : false,
		railColor : '#333',
		railOpacity : '0.2',
		railClass : 'slimScrollRail',
		barClass : 'slimScrollBar',
		wrapperClass : 'slimScrollDiv',
		allowPageScroll: false,
		scroll: 0
	  };

	  var o = ops = $.extend( defaults , options );

	  // do it for every element that matches selector
	  this.each(function() {

	  var isOverPanel, isOverBar, isDragg, queueHide, barWidth, percentScroll,
		minBarWidth = 30,
		releaseScroll = false,
		wheelStep = parseInt(o.wheelStep),
		cwidth = o.width,
		cheight = o.height,
		size = o.size,
		color = o.color,
		distance = o.distance,
		start = o.start,
		opacity = o.opacity,
		alwaysVisible = o.alwaysVisible,
		railVisible = o.railVisible,
		railColor = o.railColor,
		railOpacity = o.railOpacity,
		allowPageScroll = o.allowPageScroll,
		scroll = o.scroll;

		// used in event handlers and for better minification
		var me = $(this);

		//ensure we are not binding it again
		if (me.parent().hasClass('slimScrollDiv')) {
			//check if we should scroll existing instance
			if (scroll) {
				//find bar and rail
				bar = me.parent().find('.slimScrollBar');
				rail = me.parent().find('.slimScrollRail');

				//scroll by given amount of pixels
				scrollContent( me.scrollLeft() + parseInt(scroll), false, true);
			}

			return;
		}

		// wrap content
		var wrapper = $(DIV)
		  .addClass( o.wrapperClass )
		  .css({
			position: 'relative',
			overflow: 'hidden',
			width: cwidth,
			height: cheight
		  });

		// update style for the div
		me.css({
		  overflow: 'hidden',
		  width: cwidth,
		  height: cheight
		});

		// create scrollbar rail
		var rail  = $(DIV)
		  .addClass( o.railClass )
		  .css({
			height: size,
			width: '100%',
			position: 'absolute',
			bottom: 0,
			display: (alwaysVisible && railVisible) ? 'block' : 'none',
			'border-radius': size,
			background: railColor,
			opacity: railOpacity,
			zIndex: 300
		  });

		// create scrollbar
		var bar = $(DIV)
		  .addClass( o.barClass )
		  .css({
			background: color,
			height: size,
			position: 'absolute',
			bottom: 0,
			opacity: opacity,
			display: alwaysVisible ? 'block' : 'none',
			'border-radius' : size,
			BorderRadius: size,
			MozBorderRadius: size,
			WebkitBorderRadius: size,
			zIndex: 400
		  });

		// set position
		var posCss = { left: distance };
		rail.css(posCss);
		bar.css(posCss);

		// wrap it
		me.wrap(wrapper);

		// append to parent div
		me.parent().append(bar);
		me.parent().append(rail);

		// make it draggable
		bar.draggable({
		  axis: 'x',
		  containment: 'parent',
		  start: function() { isDragg = true; },
		  stop: function() { isDragg = false; hideBar(); },
		  drag: function(e) {
			// scroll content
			scrollContent(0, $(this).position().left, false);
		  }
		});

		// on rail over
		rail.hover(function() {
		  showBar();
		}, function() {
		  hideBar();
		});

		// on bar over
		bar.hover(function() {
		  isOverBar = true;
		}, function() {
		  isOverBar = false;
		});

		// show on parent mouseover
		me.hover(function() {
		  isOverPanel = true;
		  showBar();
		  hideBar();
		}, function() {
		  isOverPanel = false;
		  hideBar();
		});

		var _onWheel = function(e) {
		  // use mouse wheel only when mouse is over
		  if (!isOverPanel) { return; }

		  var e = e || window.event;

		  var delta = 0;
		  if (e.wheelDelta) { delta = -e.wheelDelta / 120; }
		  if (e.detail) { delta = e.detail / 3; }

		  // scroll content
		  scrollContent(delta, true);

		  // stop window scroll
		  if (e.preventDefault && !releaseScroll) { e.preventDefault(); }
		  if (!releaseScroll) { e.returnValue = false; }
		}

		function scrollContent(y, isWheel, isJump) {
		  var delta = y;

		  if (isWheel) {
			// move bar with mouse wheel
			delta = parseInt(bar.css('left')) + y * wheelStep / 100 * bar.outerWidth();

			// move bar, make sure it doesn't go out
			var maxTop = me.outerWidth() - bar.outerWidth();
			delta = Math.min(Math.max(delta, 0), maxTop);

			// scroll the scrollbar
			bar.css({ left: delta + 'px' });
		  }

		  // calculate actual scroll amount
		  percentScroll = parseInt(bar.css('left')) / (me.outerWidth() - bar.outerWidth());
		  delta = percentScroll * (me[0].scrollWidth - me.outerWidth());

		  if (isJump) {
			delta = y;
			var offsetTop = delta / me[0].scrollWidth * me.outerWidth();
			bar.css({ left: offsetTop + 'px' });
		  }

		  // scroll content
		  me.scrollLeft(delta);

		  // ensure bar is visible
		  showBar();

		  // trigger hide when scroll is stopped
		  hideBar();
		}

		var attachWheel = function() {
		  if (window.addEventListener) {
			this.addEventListener('DOMMouseScroll', _onWheel, false );
			this.addEventListener('mousewheel', _onWheel, false );
		  } else
			document.attachEvent("onmousewheel", _onWheel);
		}

		// attach scroll events
		attachWheel();

		function getBarWidth() {
		  // calculate scrollbar height and make sure it is not too small
		  barWidth = Math.max((me.outerWidth() / me[0].scrollWidth) * me.outerWidth(), minBarWidth);
		  bar.css({ width: barWidth + 'px' });
		}

		// set up initial height
		getBarWidth();

		function showBar() {
		  // recalculate bar height
		  getBarWidth();
		  clearTimeout(queueHide);

		  // release wheel when bar reached top or bottom
		  releaseScroll = allowPageScroll && percentScroll == ~~ percentScroll;

		  // show only when required
		  if (barWidth >= me.outerWidth()) {
			//allow window scroll
			releaseScroll = true;
			return;
		  }
		  bar.stop(true,true).fadeIn('fast');
		  if (railVisible) rail.stop(true,true).fadeIn('fast');
		}

		function hideBar() {
		  // only hide when options allow it
		  if (!alwaysVisible)
		  {
			queueHide = setTimeout(function() {
			  if (!isOverBar && !isDragg) {
				bar.fadeOut('slow');
				rail.fadeOut('slow');
			  }
			}, 1000);
		  }
		}

		// check start position
		if (start === 'bottom') {
		  // scroll content to bottom
		  bar.css({ top: me.outerWidth() - bar.outerWidth() });
		  scrollContent(0, true);
		} else if (typeof start === 'object') {
		  // scroll content
		  scrollContent($(start).position().left, null, true);

		  // make sure bar stays hidden
		  if (!alwaysVisible) bar.hide();
		}
	  });

	  // maintain chainability
	  return this;
	}
  });

  jQuery.fn.extend({
	slimscroll: jQuery.fn.slimScroll
  });

})(jQuery);
