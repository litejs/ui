
/* litejs.com/MIT-LICENSE.txt */



!function(window, document, Function) {

	function patch(key, src, force) {
		return !force && O[key] || (O[key] = (
			patched.push(key), typeof src === "string" ?
			Function("a,b,c", "var P='" + P + "',o=Object[P].hasOwnProperty;" + src) :
			src
		))
	}

	var a, b, c
	, EV = "Event"
	, P = "prototype"
	, O = window
	, JSONmap = {"\b":"\\b","\f":"\\f","\n":"\\n","\r":"\\r","\t":"\\t",'"':'\\"',"\\":"\\\\"}
	, hasOwn = JSONmap.hasOwnProperty
	, esc = escape
	, patched = (window.xhr || window)._patched = []
	, Event = patch(EV, function(name) {
		var ev = document.createEvent ? document.createEvent("Event") : document.createEventObject()
		if (ev.initEvent) {
			ev.initEvent(name, false, false)
		} else {
			ev.type = name
		}
		return ev
	}, typeof O.Event !== "function")
	, fixEv = Event.fixEv = {}
	, fixFn = Event.fixFn = {}
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

	// Chrome55, Edge12, Firefox59, IE11, Safari13

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

	// The HTML5 document.head DOM tree accessor
	// doc.head = doc.head || doc.getElementsByTagName("head")[0]

	// 20 fps is good enough
	patch("requestAnimationFrame", "return setTimeout(a,50)")
	// window.mozRequestAnimationFrame    || // Firefox 4-23
	// window.webkitRequestAnimationFrame || // Chrome 10-24
	// window.msRequestAnimationFrame     || // IE 10 PP2+
	patch("cancelAnimationFrame", "clearTimeout(a)")


	// Ignore FF3 escape second non-standard argument
	// https://bugzilla.mozilla.org/show_bug.cgi?id=666448
	patch("escape", function(s) { return esc(s) }, esc("a", 0) != "a")

	O = Function[P]
	// Chrome7, FF4, IE9, Opera 11.60, Safari 5.1.4
	patch("bind", "var t=this;b=[].slice.call(arguments,1);c=function(){return t.apply(this instanceof c?this:a,b.concat(b.slice.call(arguments)))};if(t[P])c[P]=t[P];return c")


	O = Object
	O.nop = function(){}

	// Chrome5, FF4, IE9, Safari5
	patch("create", "b=Object.nop;b[P]=a;a=new b;b[P]=null;return a")
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

	b = a+"while(++i<l)if(i in t)"
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

	O = window

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
				Object.keys(data).forEach(data.removeItem)
			}
		})
		patch(name, data)
	}


	eval(
		"/*@cc_on " +
		// Remove background image flickers on hover in IE6
		// You could also use CSS
		// html { filter: expression(document.execCommand("BackgroundImageCache", false, true)); }
		"try{document.execCommand('BackgroundImageCache',false,true)}catch(e){}" +
		// Patch parameters support for setTimeout callback
		"function f(n){var s=window[n];window[n]=function(f,t){var a=arguments;" +
		"return s(typeof f=='function'&&a.length>2?f.apply.bind(f,null,[].slice.call(a,2)):f,t)}}" +
		"if(!+'\v1'||document.documentMode<=9){f('setTimeout');f('setInterval')}" +
		"@*/"
	)
}(this, document, Function)



