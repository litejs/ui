
%css
	.Slider {
		width: 200px;
		background: transparent;
		touch-action: none;
	}
	.Slider.is-vertical {
		width: auto;
		height: 200px;
	}
	.is-vertical > .Slider-track {
		margin: 0 14px;
		width: 4px;
		height: 100%;
	}
	.is-vertical > .Slider-track > .Slider-fill {
		top: auto;
		bottom: 0;
		width: 4px;
	}
	.is-vertical > .Slider-track > .Slider-fill > .Slider-knob {
		margin: -10px -8px 0 0;
	}
	.Slider-track {
		position: relative;
		margin: 14px 0;
	}
	.Slider-track,
	.Slider-fill {
		height: 4px;
		border-radius: 2px;
		overflow: visible;
		background: #666;
	}
	.Slider-fill {
		background: rgba(255,255,255,.57);
	}
	.Slider-knob,
	.Toggle-knob {
		position: relative; /* for IE6 overflow:visible bug */
		width: 20px;
		height: 20px;
		border-radius: 50%;
		box-shadow:
			0 1px 4px rgba(0, 0, 0, .2);
	}
	.Slider-knob {
		float: right;
		margin: -8px -10px 0 0;
		outline: none;
		background: #f5f5f5;
		background-color: rgb(245, 245, 245);
	}
	.Slider-knob:hover,
	.Slider-knob:focus,
	:hover>.Toggle-knob {
		box-shadow:
			0 0 0 8px rgb(0, 0, 0, .2),
			0 1px 4px rgba(0, 0, 0, .3);
	}
	.Slider-knob.is-active {
		box-shadow:
			0 0 0 12px rgb(0, 0, 0, .2),
			0 1px 5px 5px rgba(0, 0, 0, .3);
	}
	.Slider-knob.is-active:before,
	.Slider-knob.is-active:after {
		position: absolute;
		width: 32px;
		height: 32px;
		left: -6px;
		display: block;
		top: -44px;
		animation: .1s linear 0s 1 forwards Slider-active;
	}
	.Slider-knob.is-active:before {
		content: "";
		border-radius: 50% 50% 50% 0;
		transform: rotate(-45deg);
		background: inherit;
		box-shadow:
			0 1px 4px rgba(0, 0, 0, .2);
	}
	.Slider-knob.is-active:after {
		content: attr(data-val);
		color: #000;
		font-size: 14px;
		line-height: 32px;
		text-align: center;
	}
	.Toggle {
		position: relative;
		display: block;
		width: 36px;
		height: 22px;
		-webkit-tap-highlight-color: rgba(0, 0, 0, 0);
	}
	.Toggle:before {
		display: block;
		content: "";
		background: #bdbdbd;
		position: absolute;
		width: 36px;
		height: 14px;
		top: 4px;
		border-radius: 7px;
		-webkit-tap-highlight-color: rgba(0, 0, 0, 0);
	}
	.Toggle-knob {
		background-color: #666;
		top: 1px;
		left: 0px;
	}
	input:checked + .Toggle-knob {
		background-color: #00a651;
		left: 16px;
	}
	@keyframes Slider-active {
		0% {
			top: 0px;
			opacity: 0;
		}
		to {
			top: -44px;
			opacity: 1;
		}
	}
	/*
	.Slider.color .Slider-fill {
		background: red;
	}
	.Slider.color .Slider-fill+.Slider-fill {
		background: green;
	}
	.Slider.color .Slider-fill+.Slider-fill+.Slider-fill {
		background: blue;
	}
	.Slider.no-first > .Slider-track > .Slider-fill:last-child {
		background: #666;
	}
	*/

%js
	var on = El.on
	, off = El.off
	El.bindings.SliderVal = function(el, model, path, range) {
		if (range) {
			El.attr(el, "range", range)
		}
		if (path) {
			if (path.charAt(0)!=="/") path = "/" + path.replace(/\./g, "/")
			model.on("change:" + path, set)
			setTimeout(function(){
				set(model.get(path))
			}, 10)
		}
		function set(val) {
			el.set(parseFloat(val) || 0)
		}
	}
	El.bindings.SliderInit = function(el) {
		var knobLen, offset, px, drag, min, max, step, minPx, maxPx, value
		, vert = El.hasClass(el, "is-vertical")
		, track = el.firstChild
		, fill = track.firstChild
		, knob = fill.lastChild
		, emit = El.emit.bind(el, el, "change").rate(500, true)
		on(window, "blur", stop)
		function load(e) {
			var tmp
			, attr = vert ? "offsetHeight" : "offsetWidth"
			, range = (El.attr(el, "range") || "").split(/[^+\-\d.]/) // min:max:step:margin
			min = +(range[0] || 0)
			max = +(range[1] || 100)
			step = +(range[2] || 1)
			knobLen = knob[attr]>>1
			minPx = 0
			maxPx = track[attr] - knobLen - knobLen
			px = maxPx / (max - min)
			offset = el.getBoundingClientRect()
			offset = (vert ? offset.top + maxPx + El.scrollTop() : offset.left + El.scrollLeft()) + knobLen
			if (e) {
				tmp = offset - e.clientX + (value-min||0)*px
				if (tmp < knobLen && tmp > -knobLen) offset -= tmp
			}
			if (e && track.childNodes.length > 1) {
				fill = track.firstChild
				var next
				, x = maxPx
				, tmp = fill
				, diff = vert ? offset - e.pageY : e.pageX - offset
				for (; tmp; tmp = tmp.nextSibling) {
					next = diff - tmp[attr] + knobLen
					if (next < 0 ? -next <= x : next < x) {
						fill = tmp
						knob = fill.firstChild
						x = next < 0 ? -next : next
					}
				}
				if (fill.previousSibling) {
					maxPx = fill.previousSibling[attr] - knobLen
					if (range[3]) maxPx -= px * range[3]
				}
				if (fill.nextSibling) {
					minPx = fill.nextSibling[attr] - knobLen
					if (range[3]) minPx += px * range[3]
				}
			}
		}
		function start(e) {
			drag = true
			load(e)
			move(e)
			listen(on)
		}
		function move(e) {
			var diff = vert ? offset - e.pageY : e.pageX - offset
			diff = (diff > maxPx ? maxPx : (diff < minPx ? minPx : diff))
			el.set((diff / px) + min, e, diff)
			return Event.stop(e)
		}
		function stop(e) {
			if (!drag) return
			drag = false
			listen(off)
			el.set(value, e)
		}
		function listen(on) {
			El.cls(fill, "anim", !drag)
			El.cls(knob, "is-active", drag)
			on(document, "pointerup", stop)
			on(document, "pointermove", move)
		}
		el.set = function(val, e, pos) {
			px || load()
			val = (val < min ? min : val > max ? max : val).step(step)
			if (value !== val) {
				el.value = value = val
				if (drag && e) emit(e)
				var format = El.attr(el, "format")
				El.attr(knob, "data-val", format ? format.format({val:val}) : val)
			}
			if (!drag || pos !== void 0) {
				fill.style[vert ? "height" : "width"] = ((pos || (value-min)*px)+knobLen) + "px"
			}
		}
		on(el, "pointerdown", start)
	}
	El.bindings.SliderInit.once = El.bindings.SliderVal.once = 1

%el Slider
	button.Slider.reset ;SliderInit
		.Slider-track
			.Slider-fill.abs.anim
				.Slider-knob.anim[tabindex=0]

/%el Slider2
/	button.Slider.reset ;SliderInit
/		.Slider-track
/			.Slider-fill.abs.anim
/				.Slider-knob.anim[tabindex=0]
/			.Slider-fill.abs.anim
/				.Slider-knob.anim[tabindex=0]
/
/%el Slider3
/	button.Slider.reset ;SliderInit
/		.Slider-track
/			.Slider-fill.abs.anim
/				.Slider-knob.anim[tabindex=0]
/			.Slider-fill.abs.anim
/				.Slider-knob.anim[tabindex=0]
/			.Slider-fill.abs.anim
/				.Slider-knob.anim[tabindex=0]

%el Toggle
	label.Toggle.reset[tabindex=0]
		;fixReadonlyCheckbox
		input[type=checkbox].hide
			;readonly: row && !row.write
			;checked: model && !!model.get(row.path)
		.Toggle-knob.anim

