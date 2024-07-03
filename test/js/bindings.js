
!function($b) {
	var closest = El.closest, cls = El.cls, css = El.css, set = El.set

	$b.init = function() {}

	$b.focus = function(el) {
		el.focus()
	}

	function transform(el, name, diff, def) {
		var tr = el.style.transform.split(name + "(")
		tr[1] = (tr[1] || def + ")").replace(/^-?[\d.]+/, +(parseFloat(tr[1]||def) + diff).toFixed(3))
		el.style.transform = tr.join(name + "(")
	}

	$b.moveExample = function(el) {
		El.on(el, {
			tap: function(e) {
				console.log("tap", arguments)
			},
			holdstart: function(e) {
				cls(el, "is-wiggle")
			},
			holdend: function(e) {
				cls(el, "is-wiggle", 0)
			},
			hold: function(e, touchEv) {
				css(el, "top,left", [touchEv.topPos + "px", touchEv.leftPos + "px"])
			},
			pan: function(e, touchEv, touchEl) {
				css(touchEl, "top,left", [touchEv.topPos + "px", touchEv.leftPos + "px"])
			},
			rotate: function(e, diff) {
				transform(el, "rotate", diff, "0deg")
			},
			pinch: function(e, diff) {
				transform(el, "scale", diff/15, "1")
				//css(el, "height,width", (el.offsetHeight + diff) + "px")
				Event.stop(e)
			}
		})
	}

	$b.draggableSort = function(el, dropzone, dragEl, handle) {
		var a, pointerOffset, next, nextY, prev, prevY, zone
		if (handle) {
			El.on(el, handle, {
				mousedown: function(e) {
					set(closest(e.target, dragEl), "draggable", "true")
				},
				mouseup: function(e) {
					set(closest(e.target, dragEl), "draggable", "")
				}
			})
		} else {
			set(el, "draggable", "true", dragEl)
		}
		app.$$(dropzone, el).on({
			dragstart: function(e) {
				e.dataTransfer.effectAllowed = "move"
				// e.dataTransfer.setDragImage(foo, 0, 0)
				a = e.target
				pointerOffset = e.clientY - a.getBoundingClientRect().top
				setDropzone(e)
				calcSwap()
				css(a, "opacity,pointer-events", [".3","none"], 9)
			},
			dragend: function(e) {
				cls(zone, "is-active", 0)
				zone = void 0
				css(a, "opacity,pointer-events", "")
			},
			dragenter: function(e) {
				setDropzone(e, e.clientY - pointerOffset)
			},
			dragover: function(e) {
				e.preventDefault()
				if (e.clientY < prevY) {
					swapAnim(a, prev, calcSwap)
				} else if (e.clientY > nextY) {
					swapAnim(a, next, calcSwap)
				}
			},
			drop: function(e) {
				//swapAnim()
			}
		})
		function setDropzone(e, top) {
			var el = closest(e.target, dropzone)
			if (!el) return
			if (a.parentNode !== el) {
				var before = el.firstChild, dummy = El(".no-events")
				for (; before; before = before.nextElementSibling) {
					if (before.getBoundingClientRect().top > top) break
				}
				css(dummy, "height", a.offsetHeight + "px")
				el.insertBefore(dummy, before)
				swapAnim(dummy, a, calcSwap)
				animNext(a)
				cls(dummy, "anim")
				El.kill(dummy, {height: "0.1px"}, 9)
			}
			if (zone !== el) {
				cls(el, "is-active", zone)
				zone = el
			}
		}
		function calcSwap() {
			var rect
			prev = a.previousElementSibling
			rect = prev && prev.getBoundingClientRect()
			prevY = prev ? rect.top + pointerOffset : NaN
			next = a.nextElementSibling
			rect = next && next.getBoundingClientRect()
			nextY = next ? rect.top + pointerOffset : NaN
		}
	}
	function animNext(el, direction) {
		var margin, next = el.nextElementSibling
		if (next) {
			margin = getComputedStyle(next).marginTop
			css(next, "transition,marginTop", [
				"none",
				(parseFloat(margin) - el.offsetHeight) + "px"
			])
			css(next, "transition,marginTop", [ "", margin ], 9)
		}
	}
	function swapAnim(a, b, fn) {
		var aBox = a.getBoundingClientRect()
		, bBox = b.getBoundingClientRect()
		, aNext = a.nextElementSibling
		, bNext = b.nextElementSibling
		, aPar = a.parentNode
		, bPar = b.parentNode
		if (a === bNext) bPar.insertBefore(a, b)
		else if (b === aNext) bPar.insertBefore(b, a)
		else {
			bPar.insertBefore(a, bNext)
			aPar.insertBefore(b, aNext)
		}
		fn()
		translate(a, aBox, bBox)
		translate(b, bBox, aBox)
		function translate(el, a, b) {
			var cssKeys = "transition,transform"
			css(el, cssKeys, [ "none", "translate(" + (a.left - b.left) + "px," + (a.top - b.top) + "px)" ])
			css(el, cssKeys, [ "", "translate(0,0)" ], 9)
		}
	}

}(El.$b)

