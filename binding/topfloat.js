
/* global El */
El.bindings.topFloat = function(el, offset) {
	var h = el.offsetHeight + offset
	, lastAbs = 0
	, lastTop = 0
	, toFix = 0

	El.on(window, "scroll", function() {
		var pos
		, top = El.scrollTop()

		// scroll up
		if (top < lastTop) {
			if (top <= toFix) {
				el.style.position = "fixed"
				el.style.top = toFix = 0
			} else {
				pos = lastTop - h
				if (toFix < 0 || lastAbs < pos) {
					el.style.position = "absolute"
					el.style.top = (lastAbs = toFix = pos < 0 ? 0 : pos < lastAbs ? lastAbs : pos) + "px"
				}
			}
		} else if (toFix === 0) {
			el.style.position = "absolute"
			el.style.top = lastTop + "px"
			lastAbs = lastTop
			toFix = -1
		}
		lastTop = top
	})
}

El.bindings.topFloat.once = 1


