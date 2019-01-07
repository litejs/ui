
@css
	.Slider {
		border: none;
		background: transparent;
	}
	.Slider-track {
		position: relative;
		width: 200px;
		height: 4px;
		margin: 14px 0;
		overflow: visible;
		background: #666;
		border-radius: 2px;
	}
	.Slider.no-first .Slider-fill:last-child {
		background: #666;
	}
	.Slider-fill,
	.Toggle {
		overflow: visible;
		background: rgba(255,255,255,.57);
		width: 10px;
		height: 4px;
		border-radius: 2px;
	}
	.Toggle {
		background: #bdbdbd;
		position: relative;
		display: block;
		width: 36px;
		height: 14px;
		border-radius: 7px;
	}
	.Slider-knob,
	.Toggle-knob {
		position: relative; /* for IE6 overflow:visible bug */
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: #f5f5f5;
		background-color: rgb(245, 245, 245);
		box-shadow: rgba(0, 0, 0, 0.12) 0px 1px 6px, rgba(0, 0, 0, 0.12) 0px 1px 4px;
		-webkit-tap-highlight-color: rgba(0, 0, 0, 0);
	}
	.Slider-knob {
		margin: -8px -10px 0 0;
	}
	.Toggle-knob {
		background-color: #666;
		top: -3px;
		left: 0px;
	}
	input[type=checkbox]:checked + .Toggle-knob {
		background-color: rgb(245, 245, 245);
		left: 16px;
	}
	.Slider-knob.is-active {
		width: 24px;
		height: 24px;
		margin: -10px -12px 0 0;
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
	El.bindings.SliderVal = function(el, model, path) {
		if (path && path.charAt(0)!=="/") path = "/"+path.replace(/\./g,"/")
		model.on("change:" + path, set)
		function set(val) {
			el.set(parseFloat(val) || 0)
		}
		setTimeout(function(){
			set(model.get(path))
		},10)
	}
	El.bindings.fixReadonlyCheckbox = function(el) {
		function False(e) {
			if ((this.firstChild || this).readOnly) {
				return Event.stop(e)
			}
		}
		El.on(el, "click", False)
		El.on(el, "mousedown", False)
	}
	El.bindings.SliderInit = function(el) {
		var knobLen, offset, px, drag, min, max, step, minPx, maxPx
		, track = el.firstChild
		, fill = track.firstChild
		, knob = fill.lastChild
		, value
		, emit = function(val) {
			El.emit(el, "change", val)
		}.rate(500, true)
		El.on(window, "blur", stop)
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
				emit(val)
			}
			value = val
			if (!drag || pos !== void 0) {
				fill.style.width = ((pos || value*px)+knobLen) + "px"
			}
		}
		El.on(el, "mousedown", start)
		El.on(el, "wheel", function(e, delta) {
			Event.stop(e)
			load(e)
			el.set( 1*value + delta*step, 0, 1 )
		})
		Event.touchAsMouse(el)
	}
	El.bindings.fixReadonlyCheckbox.once =
	El.bindings.SliderInit.once = El.bindings.SliderVal.once = 1

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

@el Toggle
	label.Toggle
		&fixReadonlyCheckbox
		input[type=checkbox].hide
			&readonly: row && !row.write
			&checked: model && !!model.get(row.path)
		.Toggle-knob.anim

