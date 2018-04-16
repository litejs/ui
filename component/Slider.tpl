
@css
	.Slider {
		border: none;
		background: transparent;
	}
	.Slider-track {
		position: relative;
		height: 32px;
		width: 200px;
		height: 4px;
		margin: 14px 0;
		background: #ddd;
		overflow: visible;
	}
	.Slider-fill {
		height: 4px;
		width: 8px;
		background: #999;
		overflow: visible;
	}
	.Slider-knob {
		position: relative; /* for IE6 overflow:visible bug */
		width: 16px;
		height: 16px;
		margin: -6px -8px 0 0;
		border-radius: 50%;
		background: #666;
		border: 0px solid #ddd;
	}
	.Slider-knob.is-active {
		width: 24px;
		height: 24px;
		margin: -10px -12px 0 0;
	}
	.Slider.no-first .Slider-fill:last-child {
		background: #ddd;
	}
	.Slider.color .Slider-fill {
		background: red;
	}
	.Slider.color .Slider-fill+.Slider-fill {
		background: green;
	}
	.Slider.color .Slider-fill+.Slider-fill+.Slider-fill {
		background: blue;
	}

@js
	El.bindings.SliderInit = function(el) {
		var knobLen, offset, px, drag, min, max, step, minPx, maxPx
		, track = el.firstChild
		, fill = track.firstChild
		, knob = fill.lastChild
		, value = El.attr(el, "valu") || 0
		function load(e) {
			min = el.min || 0
			max = el.max || 100
			step = el.step || 1
			knobLen = knob.offsetWidth>>1
			minPx = 0
			maxPx = track.offsetWidth - knobLen - knobLen
			px = maxPx / (max - min)
			offset = el.getBoundingClientRect().left + knobLen
			if (e && track.childNodes.length > 1) {
				var diff = El.mouse(e).left - offset
				diff = (diff > maxPx ? maxPx : (diff < minPx ? minPx : diff))
				fill = track.firstChild
				for (var next, x = maxPx, tmp = fill; tmp; tmp = tmp.nextSibling) {
					next = Math.abs(diff - tmp.offsetWidth)
					if (next < x) {
						fill = tmp
						knob = fill.firstChild
						x = next
					}
				}
				if (fill.previousSibling) {
					maxPx = fill.previousSibling.offsetWidth - knobLen - knobLen
					max = maxPx / px
				}
				if (fill.nextSibling) {
					minPx = fill.nextSibling.offsetWidth
					min = minPx / px
				}
			}
		}
		function start(e) {
			load(e)
			El.rmClass(fill, "anim")
			El.addClass(knob, "is-active")
			drag = true
			move(e)
			if (el.onDragStart) {
				el.onDragStart()
			}
			El.on(document.body, "mouseup", stop)
			El.on(document.body, "mousemove", move)
		}
		function move(e) {
			var diff = El.mouse(e).left - offset
			diff = (diff > maxPx ? maxPx : (diff < minPx ? minPx : diff))
			el.set( diff / px, diff )
			if (el.onMove) {
				el.onMove( diff + knobLen )
			}
			Event.stop(e)
			return false
		}
		function stop(e) {
			if (!drag) return
			El.addClass(fill, "anim")
			El.rmClass(knob, "is-active")
			drag = false
			El.off(document.body, "mouseup", stop)
			El.off(document.body, "mousemove", move)
			el.set(value)
			if (el.onDragStop) {
				el.onDragStop()
			}
		}
		el.set = function(val, pos, scroll) {
			px || load()
			val = (val < min ? min : val > max ? max : val).step(step)
			if ((drag || scroll) && value !== val) {
				El.emit(el, "change", val)
			}
			value = el.valu = val
			if (!drag || pos !== void 0) {
				fill.style.width = ((pos || value*px)+knobLen) + "px"
			}
		}
		El.on(el, "mousedown", start)
		El.on(el, "wheel", function(e, delta) {
			load(e)
			el.set( 1*value + delta*step, 0, 1 )
		})
		Event.touchAsMouse(el)
		el.set(parseFloat(value))
	}
	El.bindings.SliderInit.once = 1

@el Slider
	button.Slider.reset &SliderInit
		.Slider-track
			.Slider-fill.abs.anim
				.Slider-knob.anim.right

@el Slider2
	button.Slider.reset &SliderInit
		.Slider-track
			.Slider-fill.abs.anim
				.Slider-knob.right.anim
			.Slider-fill.abs.anim
				.Slider-knob.right.anim

@el Slider3
	button.Slider.reset &SliderInit
		.Slider-track
			.Slider-fill.abs.anim
				.Slider-knob.right.anim
			.Slider-fill.abs.anim
				.Slider-knob.right.anim
			.Slider-fill.abs.anim
				.Slider-knob.right.anim

