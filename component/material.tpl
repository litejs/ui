
%css
	.mat-Menu,
	.tooltip {
		font-family: "Roboto", "Helvetica", "Arial", sans-serif;
		border-radius: 2px;
		position: absolute;
		margin: 0;
		opacity: 0;
		transform: scale(0);
		transition: opacity .4s cubic-bezier(0, 0, .2, 1) 0s, transform .2s cubic-bezier(0, 0, .2, 1) 0s;
	}
	.tooltip {
		padding: 8px;
		color: #fff;
		background: #666;
		font-weight: 500;
		max-width: 90%;
		text-align: center;
		pointer-events: none;
		z-index: 8;
	}
	.tooltip[data-pos]:before {
		content: "";
		position: absolute;
		display: block;
		width: .4em;
		height: .4em;
		border: .4em solid transparent;
		border-left-color: #666;
		border-top-color: #666;
	}
	.tooltip[data-pos=top]:before {
		bottom: -.3em;
		left: -.3em;
		margin-left: 50%;
		transform: rotate(225deg);
	}
	.tooltip[data-pos=bottom]:before {
		top: -.3em;
		left: -.3em;
		margin-left: 50%;
		transform: rotate(45deg);
	}
	.tooltip[data-pos=right]:before {
		top: 50%;
		left: -.3em;
		margin-top: -.4em;
		transform: rotate(315deg);
	}
	.tooltip[data-pos=left]:before {
		top: -.3em;
		right: -.3em;
		margin-top: 50%;
		transform: rotate(135deg);
	}
	.mat-Menu {
		padding: 8px 0;
		color: #000;
		background: #fff;
		min-width: 124px;
		max-width: 100%;
		z-index: 7;
	}
	.mat-Menu-item {
		display: block;
		padding: 12px 16px;
		text-decoration: none;
		line-height: 24px;
		cursor: pointer;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.mat-Menu-item:hover {
		background-color: #eee;
	}
	.mat-Menu-item[disabled] {
		color: #bdbdbd;
		background-color: transparent;
		cursor: auto;
	}
	.mat-Menu-item.is-divider {
		border-bottom: 1px solid #ddd;
	}
	.mat-Menu.is-visible,
	.tooltip.is-visible {
		transform: scale(1);
		opacity: 1;
	}
	.waves {
		position: relative;
		overflow: hidden;
	}
	.waves-ripple {
		position: absolute;
		border-radius: 50%;
		background-color: #000;
		opacity: 0;
		transform: scale(0);
		transition: opacity .6s cubic-bezier(0, 0, .2, 1) 0s, transform 0s cubic-bezier(0, 0, .2, 1) .6s;
		pointer-events: none;
	}
	.waves.is-active > .waves-ripple,
	.waves-ripple--play {
		opacity: .4;
		transform: scale(1);
		transition: opacity 1s cubic-bezier(0, 0, .2, 1) 0ms, transform .4s cubic-bezier(0, 0, .2, 1) 0ms;
	}
	.shadow-1 {
		box-shadow: 0 2px 2px 0 rgba(0,0,0,.14),0 3px 1px -2px rgba(0,0,0,.2),0 1px 5px 0 rgba(0,0,0,.12);
	}
	/**
	 *  1. Fix Webkit border-radius cropping for children.
	 */
	.Button,
	.Checkbox,
	.Fab,
	.material {
		font-family: "Roboto", "Helvetica", "Arial", sans-serif;
		font-size: 14px;
		font-weight: 500;
		position: relative;
		text-transform: uppercase;
		transition: all .2s cubic-bezier(.4,0,.2,1);
		perspective: 1px;                                         /* 1 */
	}
	.Button:focus,
	.Fab:focus {
		outline: none;
	}
	.Button,
	.Button:disabled:hover {
		background: transparent;
		border: none;
		min-width: 64px;
		height: 36px;
		line-height: 36px;
		border-radius: 2px;
		padding: 0 16px;
		letter-spacing: 0;
		text-align: center;
	}
	.Button.raised,
	.Button:hover {
		background-color: rgba(158,158,158, 0.20);
	}
	.Button:focus {
		background-color: #ddd;
	}
	.raised:focus:not(:active) {
		box-shadow: 0 0 8px rgba(0,0,0,.18),0 8px 16px rgba(0,0,0,.36);
	}
	.Button:disabled {
		color: #aaa;
		background: transparent;
	}
	.Fab {
		border: none;
		border-radius: 50%;
		font-size: 24px;
		height: 56px;
		line-height: 56px;
		width: 56px;
		padding: 0;
		background: rgba(158,158,158,.2);
	}
	.Button.is-warning,
	.Fab--red {
		color: #fff;
		background-color: #f40;
	}
	.Button.is-warning>.waves-ripple,
	.Fab--red>.waves-ripple {
		background-color: #fff;
	}
	.Fab--red>.waves-ripple--play {
		opacity: .6;
	}
	.raised {
		box-shadow: 0 1px 1.5px 0 rgba(0,0,0,.12),0 1px 1px 0 rgba(0,0,0,.24);
	}
	.Checkbox {
		display: block;
		height: 56px;
		line-height: 56px;
		width: 56px;
	}
	.Checkbox-icon {
		overflow: visible;
		display: block;
		height: 50%;
		width: 50%;
		top: 25%;
		left: 25%;
	}

%js
	!function(View) {
		var menuTarget, menuEl, tipTarget, tipEl, tick, wait
		, ripple = El(".waves-ripple")
		El.near = near
		function near(source, target, x, y, margin) {
			var rect = target.getBoundingClientRect()
			, top  = rect.top
			, left = rect.left
			// svg elements dont have offsetWidth, IE8 does not have rect.width
			, width = rect.width || target.offsetWidth || 0
			, height = rect.height || target.offsetHeight || 0
			if (x == "left") {
				left -= source.offsetWidth + margin
				x = "150%"
			} else if (x == "left-start") {
				left -= margin
				x = "0%"
			} else if (x == "right") {
				left += width + margin
				x = "-50%"
			} else if (x == "right-end") {
				left += width + margin - source.offsetWidth
				x = "100%"
			} else {
				left += (width / 2) - (source.offsetWidth/2)
				x = "50%"
			}
			if (y == "top") {
				top -= margin + source.offsetHeight
				y = " 150%"
			} else if (y == "bottom") {
				top += height + margin
				y = " -50%"
			} else {
				top += (height / 2) - (source.offsetHeight/2)
				y = " 50%"
			}
			left += El.scrollLeft()
			top += El.scrollTop()
			El.css(source, {
				"transform-origin": x + y,
				top: (top < 0 ? 0 : top) + "px",
				left: (left < 0 ? 0 : left) + "px"
			})
		}
		El.on(document.body, "mouseover", onOver)
		El.on(window, "focusin", onOver)
		View.on("show", closeTooltip)
		function onOver(e) {
			var x, y, pos
			, target = e.target
			, text = El.attr(target, "data-tooltip")
			, relTarg = e.relatedTarget || e.fromElement
			// without relTarg is event on click
			if (!relTarg && e.type !== "focusin" || target === tipTarget) return
			if (!text && tipTarget) {
				for (; target = target.parentNode; ) {
					if (target === tipTarget) return
				}
			}
			closeTooltip()
			if (!text) return
			tipEl = openVisible("pre.tooltip", tipTarget = target)
			pos = El.attr(target, "data-tooltip-pos") || "top"
			El.txt(tipEl, text)
			if (pos === "left" || pos === "right") {
				x = pos
			} else {
				y = pos
			}
			El.attr(tipEl, "data-pos", pos)
			near(tipEl, target, x, y, 6)
		}
		function openVisible(tag, target) {
			var el = typeof tag == "string" ? El(tag) : tag
			El.scope(el, El.scope(target))
			El.render(el)
			El.append(document.body, el)
			El.cls(el, "is-visible", 1, 5)
			return el
		}
		function closeVisible(el, delay) {
			if (el) {
				setTimeout(el.closeFn || El.kill.bind(El, el), 999)
				El.cls(el, "is-visible", 0, delay)
			}
		}
		function closeTooltip() {
			if (tipEl) {
				closeVisible(tipEl)
				tipTarget = tipEl = null
			}
		}
		function closeMenu(e) {
			if (e && e.target == menuTarget) return
			if (menuEl) {
				closeVisible(menuEl, 200)
				El.cls(menuTarget, "is-active", menuEl = menuTarget = null)
			}
		}
		View.on("resize", closeMenu)
		View.on("closeMenu", closeMenu)
		View.on("showMenu", function(e, target, menu, x, y, margin) {
			Event.stop(e)
			var close = menuEl && menuTarget == target
			closeMenu()
			if (close) return
			menuEl = openVisible(menu, target)
			if (x == "mouse") {
				El.css(menuEl, {
					top: e.pageY + "px",
					left: e.pageX + "px"
				})
			} else {
				El.cls(menuTarget = target, "is-active")
				near(menuEl, target, x, y, 4)
			}
			if (menuEl.style.transform !== void 0) {
				El.cls(menuEl, "no-events")
				El.on(menuEl, "transitionend", function(e) {
					if (e.propertyName === "transform") El.cls(menuEl, "no-events", 0)
				})
			}
		})
		El.on(document.body, "click", closeMenu)
		El.on(document.body, "pointerdown", pointerdown)
		function pointerdown(e) {
			var target = e.target
			if (!El.hasClass(target, "waves") || target.disabled) return
			var rect = target.getBoundingClientRect()
			, fromMouse = !El.hasClass(target, "Checkbox-icon")
			, top = fromMouse ? e.clientY - rect.top : rect.height
			, left = fromMouse ? e.clientX - rect.left : rect.width
			, maxH = Math.max(top, target.offsetHeight - top)
			, maxW = Math.max(left, target.offsetWidth - left)
			, max = Math.sqrt(maxH * maxH + maxW * maxW)
			, size = (fromMouse ? 2 * max : max) + "px"
			El.css(ripple, {
				top: (top - max) + "px",
				left: (left - max) + "px",
				width: size,
				height: size
			})
			El.append(target, ripple)
			clearTimeout(tick)
			end()
			wait = 1
			tick = setTimeout(end, 800)
			El.one(document.body, "pointerup", end)
			ripple.offsetTop // force repaint
			El.cls(ripple, "waves-ripple--play")
		}
		function end() {
			if (!(wait--)) {
				El.cls(ripple, "waves-ripple--play", 0)
			}
		}
	}(View)


%el Checkbox
	label.Checkbox
		input[type=checkbox].hide
		i.Checkbox-icon.waves

%el Button
	button[type=button].Button.waves Button

%el Fab
	button[type=button].Fab.waves.raised

%el Radio
	button[type=button].Radio.waves

%css
	.MenuBtn {
		position: relative;
		width: 30px;
		height: 30px;
		background: transparent;
		color: #fff;
	}
	.MenuBtn-x,
	.MenuBtn-x:before,
	.MenuBtn-x:after {
		display: block;
		content: "";
		background-color: currentColor;
		position: absolute;
		width: 100%;
		height: .3em;
		border-radius: .3em;
		pointer-events: none;
		transition-property: transform;
	}
	.MenuBtn-x:before {
		transform: translate(0, -.6em);
	}
	.MenuBtn-x:after {
		transform: translate(0, .6em);
	}
	.MenuBtn--back > .MenuBtn-x,
	.MenuBtn--close > .MenuBtn-x {
		color: #666;
		transform: rotateZ(-180deg);
	}
	.MenuBtn--back > .MenuBtn-x:before {
		transform: rotateZ(45deg) scaleX(.75) translate(0, -230%);
	}
	.MenuBtn--back > .MenuBtn-x:after {
		transform: rotateZ(-45deg) scaleX(.75) translate(0, 230%)
	}
	.MenuBtn--close > .MenuBtn-x {
		background-color: transparent;
	}
	.MenuBtn--close > .MenuBtn-x:before {
		transform: rotateZ(45deg) translate(0, 0);
	}
	.MenuBtn--close > .MenuBtn-x:after {
		transform: rotateZ(-45deg) translate(0, 0);
	}

%el MenuBtn
	button[type=button].MenuBtn.reset.noselect
		.MenuBtn-x.anim


