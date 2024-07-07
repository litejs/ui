
/* global El, window */
El.$b.topFloat = function(el, offset) {
	var h = el.offsetHeight + offset
	, lastAbs = 0
	, lastTop = 0
	, toFix = 0
	, css = El.css

	El.on(window, "scroll", function() {
		var pos
		, top = El.scrollTop()

		// scroll up
		if (top < lastTop) {
			if (top <= toFix) {
				css(el, "position,top", ["fixed", toFix = 0])
			} else {
				pos = lastTop - h
				if (toFix < 0 || lastAbs < pos) {
					css(el, "position,top", ["absolute", (lastAbs = toFix = pos < 0 ? 0 : pos < lastAbs ? lastAbs : pos) + "px"])
				}
			}
		} else if (toFix === 0) {
			css(el, "position,top", ["absolute", lastTop + "px"])
			lastAbs = lastTop
			toFix = -1
		}
		lastTop = top
	})
}



