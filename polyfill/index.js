
/* litejs.com/MIT-LICENSE.txt */



!function(window, document, Function) {
	var a, b, c
	// JScript engine in IE<9 does not recognize vertical tabulation character
	// The documentMode is an IE only property, supported from IE8.
	, ie678 = !+"\v1"
	, ie6789 = ie678 || document.documentMode <= 9
	, ie67 = ie678 && (document.documentMode | 0) < 8
	, EV = "Event"
	, P = "prototype"
	, O = window
	, JSONmap = {"\b":"\\b","\f":"\\f","\n":"\\n","\r":"\\r","\t":"\\t",'"':'\\"',"\\":"\\\\"}
	, hasOwn = JSONmap.hasOwnProperty
	, esc = escape
	, patched = (window.xhr || window)._patched = []
	, Event = patch(EV, function(name) {
		var ev = document.createEventObject(event)
		, b = ev.buttons = ev.button
		ev.button = b == 1 ? 0: b == 4 ? 1 : b
		ev.preventDefault = preventDefault
		ev.stopPropagation = stopPropagation
		ev.target = ev.srcElement
		ev.type = name
		return ev
	}, typeof O.Event !== "function")
	, wheelDiff = 120
	, fixEv = Event.fixEv = {
		wheel: "onwheel" in document      ? "wheel" :      // Modern browsers
			"onmousewheel" in document ? "mousewheel" : // Webkit and IE
			"DOMMouseScroll"                            // older Firefox
	}
	, fixFn = Event.fixFn = {
		wheel: function(el, fn) {
			return function(e) {
				var delta = (e.wheelDelta || -e.detail || -e.deltaY) / wheelDiff
				if (delta) {
					if (delta < 1 && delta > -1) {
						var diff = (delta < 0 ? -1 : 1) / delta
						delta *= diff
						wheelDiff /= diff
					}
					//TODO: fix event
					// e.deltaY =
					// e.deltaX = - 1/40 * e.wheelDeltaX|0
					// e.target = e.target || e.srcElement
					fn.call(el, e, delta)
				}
			}
		}
	}
	, MS = "MSPointer"
	, DOWN = "pointerdown"
	, MOVE = "pointermove"
	, UP = "pointerup"
	, CANCEL = "pointercancel"
	, touchMap = {
		d: "touchstart",
		m: "touchmove",
		u: "touchend",
		c: "touchcancel"
	}
	, nulled = {
		constructor: a,
		hasOwnProperty: a,
		isPrototypeOf: a,
		propertyIsEnumerable: a,
		toLocaleString: a,
		toString: a,
		valueOf: a
	}

	function preventDefault() {
		event.returnValue = false
	}
	function stopPropagation() {
		event.cancelBubble = event.cancel = true
	}

	// window.PointerEvent  - Chrome55, Edge12, Firefox59, IE11, Safari13
	// navigator.sendBeacon - Chrome39, Edge14, Firefox31, -,    Safari11.1

	function patch(key, src, force) {
		return !force && O[key] || (O[key] = (
			patched.push(key), typeof src === "string" ?
			Function("o,P,N,U", "return function(a,b,c){" + src + "}")(hasOwn, P, nop, nulled) :
			src
		))
	}

	patch("JSON", {
		parse: function(t) {
			return Function("return(" + t + ")")()
		},
		stringify: function stringify(o) {
			var i
			, s = []
			, c = typeof o
			if (c == "string") {
				for (i = o.length; c = o.charAt(--i); s[i] = JSONmap[c] || (
					c < " " ? "\\u00" + ((c=c.charCodeAt(0))|4) + (c%16).toString(16):c
				));
				o = '"' + s.join("") + '"'
			}
			if (o && c == "object") {
				if (typeof o.toJSON == "function") return '"' + o.toJSON() + '"'
				if (Array.isArray(o)) {
					for (i = o.length; i--; s[i] = stringify(o[i]));
					return "[" + s.join() + "]"
				}
				for (i in o) if (hasOwn.call(o, i)) {
					s.push(stringify(i) + ":" + stringify(o[i]))
				}
				o = "{" + s.join() + "}"
			}
			return c == "number" && !isFinite(o) ? "null" : "" + o
		}
	})

	createStorage("sessionStorage")    // Chrome5, FF2, IE8, Safari4
	createStorage("localStorage")      // Chrome5, FF3.5, IE8, Safari4

	if (!window.PointerEvent) {
		// IE10
		if (window[MS + EV]) {
			patched.push("pointer:MS")
			fixEv[DOWN] = MS + "Down"
			fixEv[MOVE] = MS + "Move"
			fixEv[UP] = MS + "Up"
			fixEv[CANCEL] = MS + "Cancel"
		} else {
			patched.push("pointer")

			fixEv[DOWN] = "mousedown"
			fixEv[MOVE] = "mousemove"
			fixEv[UP] = "mouseup"
			fixEv[CANCEL] = "mouseup"

			fixFn[DOWN] =
			fixFn[MOVE] =
			fixFn[UP] =
			fixEv[CANCEL] = function(el, _fn, ev) {
				var blockMouse
				if (window.TouchEvent) {
					// Calling preventDefault on a touchstart or the first touchmove event of a series
					// prevents the corresponding mouse events from firing.
					//
					// chrome://flags/ Touch Events API
					El.on(el, touchMap[ev[7]], touchToPointer)
					mouseToPointer._rm = El.off.bind(el, el, touchMap[ev[7]], touchToPointer)
				}
				return mouseToPointer
				function mouseToPointer(e) {
					if (blockMouse) {
						return
					}
					if (!e.target) e.target = el
					e.pointerId = 1
					e.pointerType = "mouse"
					e.width = e.height = 1
					e.pressure = e.type == "mouseup" ? 0 : 0.5
					if (el.setCapture) {
						if (e.type == "mousedown") el.setCapture(true)
						if (e.type == "mouseup") document.releaseCapture()
					}
					_fn.call(el, e)
				}
				function touchToPointer(e) {
					var touch
					, touches = e.changedTouches
					, preventDefault = e.preventDefault.bind(e)
					, stopPropagation = e.stopPropagation.bind(e)
					, i = 0
					for (; touch = touches[i++]; ) {
						touch.pointerId = touch.identifier + 2
						touch.pointerType = "touch"
						touch.width = 2 * (touch.radiusX || touch.webkitRadiusX || 0)
						touch.height = 2 * (touch.radiusY || touch.webkitRadiusY || 0)
						touch.pressure = touch.force || touch.webkitForce || 0.5
						touch.preventDefault = preventDefault
						touch.stopPropagation = stopPropagation
						_fn.call(el, touch)
					}
					blockMouse = e.touches[0]
				}
			}
		}
	}

	// 20 fps is good enough
	patch("requestAnimationFrame", "return setTimeout(a,50)")
	// window.mozRequestAnimationFrame    || // Firefox 4-23
	// window.webkitRequestAnimationFrame || // Chrome 10-24
	// window.msRequestAnimationFrame     || // IE 10 PP2+
	patch("cancelAnimationFrame", "clearTimeout(a)")


	// Ignore FF3 escape second non-standard argument
	// https://bugzilla.mozilla.org/show_bug.cgi?id=666448
	patch("escape", function(s) { return esc(s) }, esc("a", 0) != "a")

	// The HTML5 document.head DOM tree accessor
	// patch("head", document.getElementsByTagName("head")[0])
	O = document.body
	var selectorRe = /([.#:[])([-\w]+)(?:\((.+?)\)|([~^$*|]?)=(("|')(?:\\?.)*?\6|[-\w]+))?]?/g
	, selectorLastRe = /([~\s>+]*)(?:("|')(?:\\?.)*?\2|\(.+?\)|[^\s+>])+$/
	, selectorSplitRe = /\s*,\s*(?=(?:[^'"()]|"(?:\\?.)*?"|'(?:\\?.)*?'|\(.+?\))+$)/
	, selectorCache = {}
	, selectorMap = {
		"first-child": "(a=_.parentNode)&&a.firstChild==_",
		"last-child": "(a=_.parentNode)&&a.lastChild==_",
		".": "~_.className.split(/\\s+/).indexOf(a)",
		"#": "_.id==a",
		"^": "!a.indexOf(v)",
		"|": "a.split('-')[0]==v",
		"$": "a.slice(-v.length)==v",
		"~": "~a.split(/\\s+/).indexOf(v)",
		"*": "~a.indexOf(v)"
	}
	, matches = patch("matches", function(sel) {
		return !!selectorFn(sel)(this)
	})
	, closest = patch("closest", function(sel) {
		return walk("parentNode", 1, this, sel)
	})
	function selectorFn(str) {
		// jshint evil:true
		return selectorCache[str] ||
		(selectorCache[str] = Function("m,c", "return function(_,v,a,b){return " +
			str.split(selectorSplitRe).map(function(sel) {
				var relation, from
				, rules = ["_&&_.nodeType==1"]
				, parentSel = sel.replace(selectorLastRe, function(_, _rel, a, start) {
					from = start + _rel.length
					relation = _rel.trim()
					return ""
				})
				, tag = sel.slice(from).replace(selectorRe, function(_, op, key, subSel, fn, val, quotation) {
					rules.push(
						"((v='" +
						(subSel || (quotation ? val.slice(1, -1) : val) || "").replace(/'/g, "\\'") +
						"'),(a='" + key + "'),1)"
						,
						selectorMap[op == ":" ? key : op] ||
						"(a=_.getAttribute(a))" +
						(fn ? "&&" + selectorMap[fn] : val ? "==v" : "")
					)
					return ""
				})

				if (tag && tag != "*") rules[0] += "&&_.tagName=='" + tag.toUpperCase() + "'"
				if (parentSel) rules.push("(v='" + parentSel + "')", selectorMap[relation + relation])
				return rules.join("&&")
			}).join("||") + "}"
		)(matches, closest))
	}

	function walk(next, first, el, sel, nextFn) {
		var out = []
		if (typeof sel !== "function") sel = selectorFn(sel)
		for (; el; el = el[next] || nextFn && nextFn(el)) if (sel(el)) {
			if (first) return el
			out.push(el)
		}
		return first ? null : out
	}

	function find(node, sel, first) {
		return walk("firstChild", first, node.firstChild, sel, function(el) {
			var next = el.nextSibling
			while (!next && ((el = el.parentNode) !== node)) next = el.nextSibling
			return next
		})
	}

	// Note: querySelector in IE8 supports only CSS 2.1 selectors
	patch("querySelector", function(sel) {
		return find(this, sel, true)
	}, ie678)

	patch("querySelectorAll", function(sel) {
		return find(this, sel, false)
	}, ie678)

	O = Function[P]
	// Chrome7, FF4, IE9, Opera 11.60, Safari 5.1.4
	patch("bind", "var t=this;b=[].slice.call(arguments,1);c=function(){return t.apply(this instanceof c?this:a,b.concat(b.slice.call(arguments)))};if(t[P])c[P]=t[P];return c")


	O = Object
	// Chrome5, FF4, IE9, Safari5
	patch("create", "N[P]=a||U;return new N")
	patch("keys", "c=[];for(b in a)o.call(a,b)&&c.push(b);return c")

	// Object.assign ( target, source ) in ECMAScript 6
	// Chrome45, Edge, FF34, Safari9
	patch("assign", "var t,k,i=1,A=arguments,l=A.length;for(;i<l;)if(t=A[i++])for(k in t)if(o.call(t,k))a[k]=t[k];return a")


	O = Array
	patch("isArray", "return Object[P].toString.call(a)==='[object Array]'")

	// Chrome45, Edge, FF32, Safari9
	patch("from", "a=typeof a==='string'?a.split(''):b?a:a.slice();return b?a.map(b,c):a")

	O = O[P]
	a = "var t=this,l=t.length,o=[],i=-1;"
	c = "if(t[i]===a)return i;return -1"
	patch("indexOf",     a + "i+=b|0;while(++i<l)" + c)
	patch("lastIndexOf", a + "i=(b|0)||l;i>--l&&(i=l)||i<0&&(i+=l);++i;while(--i>-1)" + c)

	b = a + "if(arguments.length<2)b=t"
	c = "b=a.call(null,b,t[i],i,t);return b"
	patch("reduce",      b + "[++i];while(++i<l)" + c)
	patch("reduceRight", b + "[--l];i=l;while(i--)" + c)

	b = a + "while(++i<l)if(i in t)"
	patch("forEach",     b + "a.call(b,t[i],i,t)")
	patch("every",       b + "if(!a.call(b,t[i],i,t))return!1;return!0")

	c = ";return o"
	patch("map",         b + "o[i]=a.call(b,t[i],i,t)" + c)

	b += "if(a.call(b,t[i],i,t))"
	patch("filter",      b + "o.push(t[i])" + c)
	patch("some",        b + "return!0;return!1")


	O = String[P]
	patch("trim", "return this.replace(/^\\s+|\\s+$/g,'')")

	// Chrome24, FF15, IE10
	O = window.performance || (window.performance = {})
	patch("now", (a = "return+new Date"))

	O = Date
	patch("now", a)

	O = O[P]
	// `Date.prototype.date` is implemented in `litejs/date`.
	patch("toJSON", "return this.date('iso')")

	O = navigator
	patch("sendBeacon", function(url, data) {
		// The synchronous XMLHttpRequest blocks the process of unloading the document,
		// which in turn causes the next navigation appear to be slower.
		var req = xhr("POST", url, xhr.unload)
		req.setRequestHeader("Content-Type", "text/plain;charset=UTF-8")
		req.send(data)
	})

	function createStorage(name) {
		try {
			// FF4-beta with dom.storage.enabled=false throws for accessing windows.localStorage
			// iOS5 private browsing throws for localStorage.setItem()
			return window[name].setItem(name, name)
		} catch(e){}
		/***
		} else if (el.addBehavior) {
			// The saveHistory behavior persists only for the current session.
			// The saveHistory behavior uses one UserData store for the entire document.
			// Thus, if two elements write the same attribute, the first is overwritten by the second.
			// The UserData store is saved in an in-memory stream and is not saved to disk.
			// Therefore, it is not available after the user closes Windows Internet Explorer.
			//
			// The userData behavior persists data across sessions, using one UserData store for each object.
			// The UserData store is persisted in the cache using the save and load methods.
			// Once the UserData store has been saved, it can be reloaded even if the document has been closed and reopened.
			//
			// An ID is required for the userData and saveSnapshot behaviors,
			// and is recommended for the saveHistory and saveFavorite behaviors.
			//
			// https://msdn.microsoft.com/en-us/library/ms531348(v=vs.85).aspx
			// el.style.behavior = surviveReboot ? "url('#default#userData')" : "url('#default#saveHistory')"
			el.addBehavior("#default#" + (surviveReboot ? "userData" : "saveHistory"))
			if (surviveReboot) el.load("persist")
			value = el.getAttribute(key)
			save = function() {
				el.setAttribute(key, El.val(el))
				if (surviveReboot) el.save("persist")
			}
		/**/
		var data = Object.create({
			setItem: function(id, val) {
				return data[id] = String(val)
			},
			getItem: function(id) {
				return data[id]
			},
			removeItem: function(id) {
				delete data[id]
			},
			clear: function() {
				for (var key in data) delete data[key]
			}
		})
		patch(name, data)
	}

	function nop(){}

	function patchTimer(name) {
		var orig = window[name]
		window[name] = function(f, t) {
			var a = arguments
			return orig(typeof f == "function" && a.length > 2 ? f.apply.bind(f, null, [].slice.call(a,2)) : f, t)
		}
	}
	if (ie6789) {
		// Patch parameters support for setTimeout callback
		patched.push("timers")
		patchTimer("setTimeout")
		patchTimer("setInterval")
		try {
			// Remove background image flickers on hover in IE6
			// You could also use CSS
			// html { filter: expression(document.execCommand("BackgroundImageCache", false, true)); }
			document.execCommand("BackgroundImageCache", false, true)
		} catch(e){}
	}
}(this, document, Function)



