
!function(Event, document) {
	var firstEl, lastDist, lastAngle, pinchThreshhold
	, TOUCH_FLAG = "-tf"
	, MOVE = "pointermove"
	, MS_WHICH = [0, 1, 4, 2]
	, fixEv = Event.fixEv
	, fixFn = Event.fixFn
	, pointers = []
	, firstPos = {}

	function down(e) {
		var len = e ? pointers.push(e) : pointers.length

		if (len === 0) {
			firstEl = null
		}
		if (len === 1) {
			if (e) {
				firstEl = e.currentTarget || e.target
				if (El.matches(e.target, "INPUT,TEXTAREA,SELECT,.no-drag")) return
			} else {
				e = pointers[0]
			}
			firstPos.X = e.clientX
			firstPos.Y = e.clientY
			savePos("left", "offsetWidth")
			savePos("top", "offsetHeight")
			moveOne(e)
		}
		if (len === 2) {
			pinchThreshhold = firstEl.clientWidth / 10
			lastDist = lastAngle = null
			moveTwo(e)
		}
		El[len === 1 ? "on" : "off"](document, MOVE, moveOne)
		El[len === 2 ? "on" : "off"](document, MOVE, moveTwo)
		return Event.stop(e)
	}

	function moveOne(e) {
		// In IE9 mousedown.buttons is OK but mousemove.buttons == 0
		if (pointers[0].buttons && pointers[0].buttons !== (e.buttons || MS_WHICH[e.which || 0])) {
			return up(e)
		}
		firstPos.leftPos = e.clientX - firstPos.X + firstPos.left
		firstPos.topPos  = e.clientY - firstPos.Y + firstPos.top
		El.emit(firstEl, "pan", e, firstPos, firstEl)
		if (!firstPos.cancel) {
			firstEl.style.left = firstPos.leftPos + "px"
			firstEl.style.top = firstPos.topPos + "px"
		}
	}

	function moveTwo(e) {
		pointers[ pointers[0].pointerId == e.pointerId ? 0 : 1] = e
		var diff
		, x = firstPos.X - pointers[1].clientX
		, y = firstPos.Y - pointers[1].clientY
		, dist = Math.sqrt(x*x + y*y) | 0
		, angle = Math.atan2(y, x)

		if (lastDist !== null) {
			diff = dist - lastDist
			if (diff) El.emit(firstEl, "pinch", e, diff, angle)
			diff = angle - lastAngle
			if (diff) El.emit(firstEl, "rotate", e, diff * (180/Math.PI))
		}

		lastDist = dist
		lastAngle = angle
	}

	function up(e) {
		for (var i = pointers.length; i--; ) {
			if (pointers[i].pointerId == e.pointerId) {
				pointers.splice(i, 1)
				break
			}
		}
		down()
	}

	function savePos(name, offset) {
		var val = firstEl.style[name]
		firstPos[name] = parseInt(val, 10) || 0
		if (val && val.indexOf("%") > -1) {
			firstPos[name] *= firstEl.parentNode[offset] / 100
		}
	}

	fixEv.pan = fixEv.pinch = ""
	fixFn.pan = fixFn.pinch = function setup(el) {
		if (!el[TOUCH_FLAG]) {
			el.style.touchAction = el.style.msTouchAction = "none"
			El.on(el, "pointerdown", down)
			El.on(el, "pointerup pointercancel", up)
			el[TOUCH_FLAG] = 1
		}
	}

	/*
	.
	https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent
	https://developer.apple.com/ios/3d-touch/
	https://developer.mozilla.org/en-US/docs/Web/API/Force_Touch_events
	https://github.com/stuyam/pressure/
	// should be either "stylus" or "direct"
	console.log(evt.touches[0].touchType)
	stylus (Apple Pencil) or direct (finger)
	iOS 10 + Safari + Apple Pencil
	You can check the touch force with:
	e.touches[0].force;
	But it works also for 3DTouch on iPhone 6s.
	Only Apple Pencil events and touches events on iPhone 6s have .force
	This is hacky, but checking for
	var isiPad = (navigator.userAgent.match(/iPad/i) != null);
	and the existence of force on the touch event
	seems to be the only way to tell whether it's the Apple Pencil.
	supportsTouch = 'ontouchstart' in window.document && supportsTouchForce;
	supportsMouse = 'onmousemove' in window.document && !supportsTouch;
	supportsPointer = 'onpointermove' in window.document;
	supportsTouchForceChange = 'ontouchforcechange' in window.document;
	*/
}(Event, document)


