
@css
	.mat-Menu,
	.tooltip {
		font-family: "Roboto", "Helvetica", "Arial", sans-serif;
		border-radius: 2px;
		position: absolute;
		margin: 0;
		opacity: 0;
		transform: scale(0);
	}
	.tooltip {
		padding: 8px;
		color: #fff;
		background: #666;
		font-weight: 500;
		max-width: 90%;
		text-align: center;
		pointer-events: none;
		z-index: 9;
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
		z-index: 8;
		transition: opacity .4s cubic-bezier(0, 0, .2, 1) .2s, transform .2s cubic-bezier(0, 0, .2, 1) .2s;
	}
	.mat-Menu-item {
		display: block;
		padding: 0 16px;
		text-decoration: none;
		line-height: 48px;
		cursor: pointer;
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
		transition: opacity .4s cubic-bezier(0, 0, .2, 1) 0s, transform .2s cubic-bezier(0, 0, .2, 1) 0s;
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

@js
	!function(View) {
		var lastMenuTarget, openMenu, tipOpen, tick, wait
		, tooltip = El("pre.tooltip")
		, ripple = El(".waves-ripple")
		El.append(document.body, tooltip)
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
			El.css(source, "transform-origin", x + y)
			El.css(source, "top", (top < 0 ? 0 : top) + "px")
			El.css(source, "left", (left < 0 ? 0 : left) + "px")
		}
		function closeTooltip() {
			El.rmClass(tooltip, "is-visible")
			tipOpen = null
		}
		El.on(document.body, "mouseover", onOver)
		El.on(window, "focusin", onOver)
		View.on("show", closeTooltip)
		function onOver(e) {
			var x, y, pos
			, target = e.target
			, text = target.getAttribute("data-tooltip")
			, relTarg = e.relatedTarget || e.fromElement
			// without relTarg is event on click
			if (!relTarg && e.type !== "focusin" || target === tipOpen) return
			if (!text && tipOpen) {
				for (; target = target.parentNode; ) {
					if (target === tipOpen) return
				}
			}
			closeTooltip()
			if (!text) return
			tipOpen = target
			pos = El.attr(target, "data-tooltip-pos") || "top"
			El.txt(tooltip, text)
			if (pos === "left" || pos === "right") {
				x = pos
			} else {
				y = pos
			}
			El.attr(tooltip, "data-pos", pos)
			near(tooltip, target, x, y, 6)
			tooltip.offsetTop // force repaint
			El.addClass(tooltip, "is-visible")
		}
		function closeMenu(e) {
			if (e && e.target == lastMenuTarget) return
			var menu = openMenu
			if (menu) {
				El.rmClass(menu, "is-visible")
				setTimeout(El.kill.bind(null, menu), 800)
			}
			if (lastMenuTarget) {
				El.rmClass(lastMenuTarget, "is-active")
			}
			openMenu = null
		}
		View.on("resize", closeMenu)
		View.on("showMenu", function(e, target, menu, x, y, margin) {
			Event.stop(e)
			var close = openMenu && lastMenuTarget == target
			closeMenu()
			if (close) return
			lastMenuTarget = target
			openMenu = El(menu)
			if (openMenu.style.transform !== void 0) {
				El.addClass(openMenu, "no-events")
				El.on(openMenu, "transitionend", function(e) {
					if (openMenu && e.propertyName === "transform") El.rmClass(openMenu, "no-events")
				})
			}
			El.scope(openMenu, El.scope(target))
			El.append(document.body, openMenu)
			El.render(openMenu)
			near(openMenu, target, x, y, 4)
			El.addClass(target, "is-active")
			openMenu.offsetTop // force repaint
			El.addClass(openMenu, "is-visible")
		})
		El.on(document.body, "mouseup", closeMenu)
		El.on(document.body, "mousedown", mousedown)
		function mousedown(e) {
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
			El.css(ripple, "top", (top - max) + "px")
			El.css(ripple, "left", (left - max) + "px")
			El.css(ripple, "width", size)
			El.css(ripple, "height", size)
			El.append(target, ripple)
			clearTimeout(tick)
			end()
			wait = 1
			tick = setTimeout(end, 800)
			El.one(document.body, "mouseup", end)
			ripple.offsetTop // force repaint
			El.addClass(ripple, "waves-ripple--play")
		}
		function end() {
			if (!(wait--)) {
				El.rmClass(ripple, "waves-ripple--play")
			}
		}
	}(View)


@el Checkbox
	label.Checkbox
		input[type=checkbox].hide
		i.Checkbox-icon.waves

@el Button
	button[type=button].Button.waves Button

@el Fab
	button[type=button].Fab.waves.raised

@el Toggle
	button[type=button].Toggle.waves

@el Radio
	button[type=button].Radio.waves

@css
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

@el MenuBtn
	button[type=button].MenuBtn.reset.noselect
		.MenuBtn-x.anim


