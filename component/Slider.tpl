
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
	El.bindings.SliderInit = function() {
		var undef, knobLen, offset, px, drag, min, max, step, minPx, maxPx
		, el = this
		, track = el.firstChild
		, fill = track.firstChild
		, knob = fill.lastChild
		, value = el.attr("valu") || 0
		, v = ((" "+el.className+" ").indexOf(" vertical ") !== -1)
		, o = "offset" + (v ? "Height" : "Width")
		, od = v ? "height" : "width"
		, op = "offset" + (v ? "Top" : "Left")
		function load() {
			min = el.min || 0
			max = el.max || 100
			step = el.step || 1
			knobLen = knob[o]>>1
			minPx = 0
			maxPx = track[o] - knobLen - knobLen
			px = maxPx / (max - min)
			offset = el.getBoundingClientRect().left + knobLen
		}
		function move(e) {
			var diff = v ? maxPx - Event.pointerY(e) + offset : Event.pointerX(e) - offset
			diff = (diff>maxPx ? maxPx : (diff<minPx?minPx:diff))
			el.set( diff / px, diff )
			if (el.onMove) {
				el.onMove( diff + knobLen )
			}
			Event.stop(e)
			return false
		}
		function stop(e) {
			if (!drag) return
			fill.addClass("anim")
			knob.rmClass("is-active")
			drag = false
			document.body.non("mouseup", stop).non("mousemove", move)
			el.set(value)
			if (el.onDragStop) {
				el.onDragStop()
			}
		}
		el.set = function(val, pos, scroll) {
			px || load()
			val = (val < min ? min : val > max ? max : val).step(step)
			if (el.onChange && (drag || scroll) && value !== val) {
				el.onChange(val)
			}
			value = el.valu = val
			if (!drag || pos !== undef) {
				fill.style[od] = ((pos || value*px)+knobLen) + "px"
			}
		}
		el.on("mousedown", function(e) {
			load()
			if (track.childNodes.length > 1) {
				var diff = v ? maxPx - Event.pointerY(e) + offset : Event.pointerX(e) - offset
				diff = (diff>maxPx ? maxPx : (diff<0?0:diff))
				fill = track.firstChild
				for (var next, x = maxPx, tmp = fill; tmp; tmp = tmp.nextSibling) {
					next = Math.abs(diff - tmp.offsetWidth)
					if (next < x) {
						fill = tmp
						knob = fill.firstChild
						x = next
					}
				}
				if (fill.previousSibling) maxPx = fill.previousSibling.offsetWidth - knobLen - knobLen
				if (fill.nextSibling) minPx = fill.nextSibling.offsetWidth
			}
			fill.rmClass("anim")
			knob.addClass("is-active")
			drag = true
			move(e)
			if (el.onDragStart) {
				el.onDragStart()
			}
			document.body.on("mouseup", stop).on("mousemove", move)
		}).on("wheel", function(e,delta) {
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
