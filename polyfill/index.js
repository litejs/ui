
/* litejs.com/MIT-LICENSE.txt */


// IE5 does not support
//  - Array#push/pop
//  - Function#call
//  - encodeURIComponent
//  - RegExp lookahead /(?=a)/ and non-greedy modifiers /a+?/
//  - if ("key" in map) and hasOwnProperty

// IE5.5-IE7 Patched: 41
// Event, pointer, setTimeout, setInterval, sessionStorage, localStorage, requestAnimationFrame, cancelAnimationFrame, console, JSON, matchMedia, performance, p:now, timing, d:now, toJSON, toISOString, bind, assign, create, entries, keys, values, toString, isArray, from, indexOf, lastIndexOf, reduce, reduceRight, every, forEach, map, filter, some, trim, sendBeacon, matches, closest, querySelector, querySelectorAll
// IE8 Patched: 38
// Event, pointer, setTimeout, setInterval, requestAnimationFrame, cancelAnimationFrame, console, matchMedia, performance, p:now, timing, d:now, toJSON, toISOString, bind, assign, create, entries, keys, values, toString, isArray, from, indexOf, lastIndexOf, reduce, reduceRight, every, forEach, map, filter, some, trim, sendBeacon, matches, closest, querySelector, querySelectorAll
// IE10 Patched: 9
// Event, pointer:MS, assign, entries, values, from, sendBeacon, matches, closest
// IE11 Patched: 8
// Event, assign, entries, values, from, sendBeacon, matches, closest


!function(window, Function) {
	// window.PointerEvent  - Chrome55, Edge12, Firefox59, Safari13,   IE11
	// navigator.sendBeacon - Chrome39, Edge14, Firefox31, Safari11.1
	// Object.fromEntries   - Chrome73, Edge79, Firefox63, Safari12.1, Opera60, Node.js12.0.0
	// queueMicrotask       - Chrome71, Edge79, Firefox69, Safari12.1

	var isArr, oKeys
	, a, b, c
	// JScript engine in IE<9 does not recognize vertical tabulation character
	, ie678 = !+"\v1"
	, P = "prototype"
	, O = window
	, patched = (window.xhr || window)._patched = []
	, aSlice = patched.slice
	, jsonRe = /[\x00-\x1f\x22\x5c]/g
	, JSONmap = {"\b":"\\b","\f":"\\f","\n":"\\n","\r":"\\r","\t":"\\t",'"':'\\"',"\\":"\\\\"}
	, hasOwn = JSONmap.hasOwnProperty
	, esc = escape
	, document = patch("document", {body:{}})
	, navigator = patch("navigator")
	, EV = "Event"
	, Event = patch(
		EV,
		"c=F.createEventObject(event),b=c.buttons=c.button;c.button=b==1?0:b==4?1:b;c.preventDefault=X;c.stopPropagation=Y;c.target=c.srcElement;c.type=a;return c",
		!isFn(O[EV]) && document,
		function(){ event.returnValue = false },
		function(){ event.cancelBubble = event.cancel = true }
	)
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

	// Ignore FF3 escape second non-standard argument
	// https://bugzilla.mozilla.org/show_bug.cgi?id=666448
	patch("escape", "return X(a)", esc("a", 0) != "a", esc)

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
		var data = {
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
		}
		patch(name, data, 1)
	}

	createStorage("sessionStorage")    // Chrome5, FF2, IE8, Safari4
	createStorage("localStorage")      // Chrome5, FF3.5, IE8, Safari4

	// 20 fps is good enough
	patch("requestAnimationFrame", "return setTimeout(a,50)")
	// window.mozRequestAnimationFrame    || // Firefox 4-23
	// window.webkitRequestAnimationFrame || // Chrome 10-24
	// window.msRequestAnimationFrame     || // IE 10 PP2+
	patch("cancelAnimationFrame", "clearTimeout(a)")

	// IE8 has console, however, the console object does not exist if the console is not opened.
	patch("console", {log: nop, error: nop})


	function jsonFn(str) {
		return JSONmap[str] || esc(str).replace(/%u/g, "\\u").replace(/%/g, "\\x")
	}

	patch("JSON", {
		parse: function(t) {
			return Function("return(" + t.replace(/\u2028|\u2029/g, jsonFn) + ")")()
		},
		stringify: function stringify(o) {
			// IE 8 serializes `undefined` as `"undefined"`
			var c = typeof o
			return (
				c == "string" ? '"' + o.replace(jsonRe, jsonFn) + '"' :
				o && c == "object" ? (
					isFn(o.toJSON) ? stringify(o.toJSON()) :
					isArr(o) ? "[" + o.map(stringify) + "]" :
					"{" + oKeys(o).map(function(a){return stringify(a) + ":" + stringify(o[a])}) + "}"
				) :
				c == "number" && !isFinite(o) ? "null" :
				"" + o
			)
		}
	})

	/*** ie9 ***/
	patch("matchMedia", "b=a||'all';return{media:b,matches:X?X.matchMedium(b):!1,addEventListener:Y}", 0, window.styleMedia || window.media, nop)
	/**/

	O = patch("performance")
	patch("p:now", (a = "return+new Date") + "-X", 0, new Date())
	patch("timing")

	O = Date
	patch("d:now", a)

	O = O[P]
	// IE8 toJSON does not return milliseconds
	patch("toISOString", patch("toJSON", [
		"return t.getUTCFullYear(", "Month()+1,'-'", "Date(),'-'",
		"Hours(),'T'", "Minutes(),':'", "Seconds(),':'", "Milliseconds(),'.')+'Z'"
	].join(")+X(t.getUTC"), ie678, function(n, b){ return b + ("00" + n).slice((b !== ".")-3) }))


	O = Function[P]
	// Chrome7, FF4, IE9, Opera 11.60, Safari 5.1.4
	patch("bind", "b=S.call(arguments,1);c=function(){return t.apply(this instanceof c?this:a,b.concat(S.call(arguments)))};if(t[P])c[P]=t[P];return c")


	O = Object
	patch("assign", "var k,i=1,A=arguments,l=A.length;for(;i<l;)if(t=A[i++])for(k in t)if(o.call(t,k))a[k]=t[k];return a")
	patch("create", "X[P]=a||Y;return new X", 0, nop, {
		// oKeys is undefined at this point
		constructor: oKeys, hasOwnProperty: oKeys, isPrototypeOf: oKeys, propertyIsEnumerable: oKeys,
		toLocaleString: oKeys, toString: oKeys, valueOf: oKeys
	})
	a = "c=[];for(b in a)o.call(a,b)&&c.push("
	b = ");return c"
	patch("entries", a + "[b,a[b]]" + b)
	oKeys = patch("keys", a + "b" + b)
	patch("values", a + "a[b]" + b)
	//patch("fromEntries", "for(a=a.entries(),c={};!(b=a.next()).done;c[b[0]]=b[1]" + b)

	a = O[P][b = "toString"]
	O = Error[P]
	// in IE8 Error("1") creates {description: "", message: "", name: "Error", number: 1}
	patch(b, "a=t.message||t.number;return a?X+': '+a:X", Error(1) != "Error: 1", "Error")
	O = Array
	isArr = patch("isArray", "return X.call(a)==='[object Array]'", 0, a)

	// TODO:2021-02-25:lauri:Accept iterable objects
	//patch("from", "a=S.call(a);return b?a.map(b,c):a")
	patch("from", "a=typeof a==='string'?a.split(''):b?a:S.call(a);return b?a.map(b,c):a")

	O = O[P]
	a = "var l=t.length,o=[],i=-1;"
	c = "if(t[i]===a)return i;return -1"
	patch("indexOf",     a + "i+=b|0;while(++i<l)" + c)
	patch("lastIndexOf", a + "i=(b|0)||l;i>--l&&(i=l)||i<0&&(i+=l);++i;while(--i>-1)" + c)

	b = a + "if(arguments.length<2)b=t"
	c = "b=a.call(null,b,t[i],i,t);return b"
	patch("reduce",      b + "[++i];while(++i<l)" + c)
	patch("reduceRight", b + "[--l];i=l;while(i--)" + c)

	b = a + "while(++i<l)if(i in t)"
	patch("every",       b + "if(!a.call(b,t[i],i,t))return!1;return!0")
	patch("forEach",     b + "a.call(b,t[i],i,t)")

	c = ";return o"
	patch("map",         b + "o[i]=a.call(b,t[i],i,t)" + c)

	b += "if(a.call(b,t[i],i,t))"
	patch("filter",      b + "o.push(t[i])" + c)
	patch("some",        b + "return!0;return!1")

	//patch("entries", "a=this;b=-1;return{next:function(){c=a.length<=++b;return{done:c,value:c?void 0:a[b]}}}")


	O = String[P]
	patch("trim", "return t.replace(/^\\s+|\\s+$/g,'')")


	O = navigator
	patch("sendBeacon", function(url, data) {
		// The synchronous XMLHttpRequest blocks the process of unloading the document,
		// which in turn causes the next navigation appear to be slower.
		url = xhr("POST", url, xhr.unload)
		url.setRequestHeader("Content-Type", "text/plain;charset=UTF-8")
		url.send(data)
	})

	// The HTML5 document.head DOM tree accessor
	// patch("head", document.getElementsByTagName("head")[0])
	// HTMLElement (IE9) -> Element (IE8)
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
	, matches = patch("matches", "return!!X(a)(t)", 0, selectorFn)
	, closest = patch("closest", "return X(t,'parentNode',a,1)", 0, walk)

	// Note: querySelector in IE8 supports only CSS 2.1 selectors
	patch((b="querySelector"), (a = "return X(t,a,") + "1)", ie678, find)
	patch(b + "All", a + "0)", ie678, find)
	//patch("addEventListener", function(ev, fn) { })
	//patch("removeEventListener")

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
	function walk(el, by, sel, first, nextFn) {
		var out = []
		if (typeof sel !== "function") sel = selectorFn(sel)
		for (; el; el = el[by] || nextFn && nextFn(el)) if (sel(el)) {
			if (first === 1) return el
			out.push(el)
		}
		return first === 1? null : out
	}
	function find(node, sel, first) {
		return walk(node.firstChild, "firstChild", sel, first, function(el) {
			for (var next = el.nextSibling; !next && ((el = el.parentNode) !== node);) next = el.nextSibling
			return next
		})
	}


	// ie6789
	// The documentMode is an IE only property, supported from IE8.
	if (ie678 || document.documentMode <= 9) {
		// Patch parameters support for setTimeout callback
		patch("setTimeout", (a = "var A=arguments;return O(X(a)&&A.length>2?a.apply.bind(a,null,S.call(A,2)):a,b)"), 1, isFn)
		patch("setInterval", a, 1, isFn)
		try {
			// Remove background image flickers on hover in IE6
			// You could also use CSS
			// html { filter: expression(document.execCommand("BackgroundImageCache", false, true)); }
			document.execCommand("BackgroundImageCache", false, true)
		} catch(e){}
	}

	function isFn(f) {
		return typeof f === "function"
	}
	function nop() {}

	function patch(key_, src, force, arg1, arg2) {
		var key = key_.split(":").pop()
		return !force && O[key] || (O[patched.push(key_), key] = (
			typeof src === "string" ?
			Function("o,O,P,S,F,X,Y", "return function(a,b,c){var t=this;" + src + "}")(hasOwn, O[key], P, aSlice, force, arg1, arg2) :
			src || {}
		))
	}
}(this, Function)



