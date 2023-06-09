
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


/* global El, xhr */
/* c8 ignore start */
!function(window, Function, Infinity, P) {

	// Array#flat()         - Chrome69, Edge79, Firefox62, Safari12
	// window.PointerEvent  - Chrome55, Edge12, Firefox59, Safari13,   IE11
	// navigator.sendBeacon - Chrome39, Edge14, Firefox31, Safari11.1
	// Object.fromEntries   - Chrome73, Edge79, Firefox63, Safari12.1, Opera60, Node.js12.0.0
	// queueMicrotask       - Chrome71, Edge79, Firefox69, Safari12.1

	var isArr, oKeys
	, O = window
	, patched = (window.xhr || window)._p = []
	, jsonRe = /[\x00-\x1f\x22\x5c]/g
	, JSONmap = {"\b":"\\b","\f":"\\f","\n":"\\n","\r":"\\r","\t":"\\t","\"":"\\\"","\\":"\\\\"}
	, hasOwn = JSONmap.hasOwnProperty
	, esc = escape
	, _parseInt = parseInt
	, document = patch("document", {body:{}})
	, navigator = patch("navigator")
	// JScript engine in IE<9 does not recognize vertical tabulation character
	// The documentMode is an IE only property, supported from IE8
	, a = document.documentMode | 0, b, c
	, ie678 = !+"\v1" && a < 9 // jshint ignore:line
	, ie6789 = ie678 || a == 9
	//, ie67 = ie678 && a < 8
	, EV = "Event"
	, Event = patch(
		EV,
		"c=F.createEventObject(event),b=c.buttons=c.button;c.button=b==1?0:b==4?1:b;c.preventDefault=X;c.stopPropagation=Y;c.target=c.srcElement;c.type=a;return c",
		!isFn(O[EV]) && document,
		Function("event.returnValue=!1"),
		Function("event.cancelBubble=event.cancel=!0")
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

	// Missing PointerEvents with Scribble enable on Safari 14
	// https://mikepk.com/2020/10/iOS-safari-scribble-bug/
	// https://bugs.webkit.org/show_bug.cgi?id=217430

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
					for (; (touch = touches[i++]); ) {
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

	function createStorage(name) {
		try {
			// FF4-beta with dom.storage.enabled=false throws for accessing windows.localStorage
			// iOS5 private browsing throws for localStorage.setItem()
			return window[name += "Storage"].setItem(name, name)
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
				return (data[id] = "" + val)
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

	createStorage("session")    // Chrome5, FF2, IE8, Safari4
	createStorage("local")      // Chrome5, FF3.5, IE8, Safari4

	// 20 fps is good enough
	patch("requestAnimationFrame", "return setTimeout(a,50)")
	// window.mozRequestAnimationFrame    || // Firefox 4-23
	// window.webkitRequestAnimationFrame || // Chrome 10-24
	// window.msRequestAnimationFrame     || // IE 10 PP2+
	patch("cancelAnimationFrame", "clearTimeout(a)")

	// IE8 has console, however, the console object does not exist if the console is not opened.
	patch("console", {log: nop, error: nop})

	/*** ie9 ***/
	patch("matchMedia", "b=a||'all';return{media:b,matches:X?X.matchMedium(b):!1,addListener:Y}", 0, window.styleMedia || window.media, nop)
	/**/


	function jsonFn(str) {
		return JSONmap[str] || esc(str).replace(/%u/g, "\\u").replace(/%/g, "\\x")
	}

	patch("JSON", {
		parse: function(t) {
			return Function("return(" + t.replace(/\u2028|\u2029/g, jsonFn) + ")")()
		},
		stringify: function stringify(o) {
			// IE 8 serializes `undefined` as `"undefined"`
			return (
				isStr(o) ? "\"" + o.replace(jsonRe, jsonFn) + "\"" :
				o !== o || o == null || o === Infinity || o === -Infinity ? "null" :
				typeof o == "object" ? (
					isFn(o.toJSON) ? stringify(o.toJSON()) :
					isArr(o) ? "[" + o.map(stringify) + "]" :
					"{" + oKeys(o).flatMap(function(a){
						return o[a] === void 0 ? [] : stringify(a) + ":" + stringify(o[a])
					}) + "}"
				) :
				"" + o
			)
		}
	})

	// Patch parameters support for setTimeout callback
	patch("setTimeout", (a = "return O(X(a)&&A.length>2?a.apply.bind(a,null,S.call(A,2)):a,b)"), ie6789, isFn)
	patch("setInterval", a, ie6789, isFn)

	// Ignore FF3 escape second non-standard argument
	// https://bugzilla.mozilla.org/show_bug.cgi?id=666448
	patch("escape", "return X(a)", esc("a", 0) != "a", esc)

	// From Chrome23/Firefox21 parseInt parses leading-zero strings as decimal, not octal
	b = patch("parseInt", "return X(a,(b>>>0)||(Y.test(''+a)?16:10))", _parseInt("08") !== 8, _parseInt, /^\s*[-+]?0[xX]/)


	O = patch("performance")
	patch("p:now", (a = "return+new Date") + "-X", 0, new Date())
	patch("timing")

	O = Date
	patch("d:now", a)

	/*** toISOString ***/
	O = O[P]
	// IE8 toJSON does not return milliseconds
	// ISO 8601 format is always 24 or 27 characters long,
	// YYYY-MM-DDTHH:mm:ss.sssZ or ±YYYYYY-MM-DDTHH:mm:ss.sssZ
	patch("toISOString", patch("toJSON", [
		"a=t.getUTCFullYear();if(a!==a)throw RangeError('Invalid time');return(b=a<0?'-':a>9999?'+':'')+X(a<0?-a:a,'-',b?6:4", "Month()+1,'-'", "Date(),'T'",
		"Hours(),':'", "Minutes(),':'", "Seconds(),'.'", "Milliseconds(),'Z',3)"
	].join(")+X(t.getUTC"), ie678, function(a, b, c){ return ("00000" + a).slice(-c || -2) + b }))
	/**/

	O = Function[P]
	// Chrome7, FF4, IE9, Opera 11.60, Safari 5.1.4
	patch("bind", "b=S.call(A,1);c=function(){return t.apply(this instanceof c?this:a,b.concat(S.call(arguments)))};if(t[P])c[P]=t[P];return c")

	O = Object
	patch("assign", "for(var k,i=1,l=A.length;i<l;)if(t=A[i++])for(k in t)if(o.call(t,k))a[k]=t[k];return a")
	patch("create", "X[P]=a||Y;return new X", 0, nop, {
		// oKeys is undefined at this point
		constructor: oKeys,
		hasOwnProperty: oKeys, // jshint ignore:line
		isPrototypeOf: oKeys, propertyIsEnumerable: oKeys,
		toLocaleString: oKeys, toString: oKeys, valueOf: oKeys
	})
	a = "c=[];for(b in a)o.call(a,b)&&c.push("
	b = ");return c"
	patch("entries", a + "[b,a[b]]" + b)
	patch("hasOwn", "return!!(a&&o.call(a,b))")
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
	patch("from", "a=X(a)?a.split(''):b?a:S.call(a);return b?a.map(b,c):a", 0, isStr)
	patch("of", "return S.call(A)")

	O = O[P]
	a = "var l=t.length,o=[],i=-1;"
	b = "i+=b|0;while(++i<l)"
	c = "if(t[i]===a)return i;return -1"
	patch("includes",    a + b + "if(t[i]===a||(a!==a&&t[i]!==t[i]))return!0;return!1")
	patch("indexOf",     a + b + c)
	patch("lastIndexOf", a + "i=(b|0)||l;i>--l&&(i=l)||i<0&&(i+=l);++i;while(--i>-1)" + c)

	b = a + "if(A.length<2)b=t"
	c = "b=a.call(null,b,t[i],i,t);return b"
	patch("reduce",      b + "[++i];while(++i<l)" + c)
	patch("reduceRight", b + "[--l];i=l;while(i--)" + c)

	// Safari12 bug, any modification to the original array before calling `reverse` makes bug disappear
	// Fixed in Safari 12.0.1 and iOS 12.1 on October 30, 2018
	// patch("reverse",     "if(X(t))t.length=t.length;return O.call(t)", "2,1" != [1, 2].reverse(), isArr)

	// In ES3 the second deleteCount argument is required, IE<=8 requires deleteCount
	// IE6-9 silently fails to write to the arguments object, make it to array first.
	patch("splice",      "if(b===Y){A=S.call(A);A[1]=t.length-a}return O.apply(t,A)", "1,2" != [1, 2].splice(0))

	b = a + "while(++i<l)"
	patch("every",       b + "if(!a.call(b,t[i],i,t))return!1;return!0")
	patch("forEach",     b + "a.call(b,t[i],i,t)")

	c = ";return o"
	patch("map",         b + "o[i]=a.call(b,t[i],i,t)" + c)

	b += "if(a.call(b,t[i],i,t))"
	patch("filter",      b + "o.push(t[i])" + c)
	patch("some",        b + "return!0;return!1")

	patch("flat",        "return a<1?S.call(t):(b=t.concat.apply([],t))&&a>1&&b.some(X)?b.flat(a-1):b", 0, isArr)
	patch("flatMap",     "return X.apply(t,A).flat()", 0, O.map)
	//patch("entries", "a=this;b=-1;return{next:function(){c=a.length<=++b;return{done:c,value:c?void 0:a[b]}}}")


	O = String[P]
	patch("endsWith", "return(a+='')===t.slice(-a.length)")
	patch("startsWith", "return t.lastIndexOf(a,0)===0")
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
	var selectorCache = {}
	, selectorRe = /([.#:[])([-\w]+)(?:\(((?:[^()]|\([^)]+\))+?)\)|([~^$*|]?)=(("|')(?:\\.|[^\\])*?\6|[-\w]+))?]?/g
	, selectorLastRe = /([\s>+~]*)(?:("|')(?:\\.|[^\\])*?\2|\((?:[^()]|\([^()]+\))+?\)|~=|[^'"()\s>+~])+$/
	, selectorSplitRe = /\s*,\s*(?=(?:[^'"()]|"(?:\\.|[^\\"])*?"|'(?:\\.|[^\\'])*?'|\((?:[^()]|\([^()]+\))+?\))+$)/
	, selectorMap = {
		"empty": "!_.lastChild",
		"enabled": "!m(_,':disabled')",
		"first-child": "(a=_.parentNode)&&a.firstChild==_",
		"lang": "m(c(_,'[lang]'),'[lang|='+v+']')",
		"last-child": "(a=_.parentNode)&&a.lastChild==_",
		"link": "m(_,'a[href]')",
		"only-child": "(a=_.parentNode)&&a.firstChild==a.lastChild",
		".": "~_.className.split(/\\s+/).indexOf(a)",
		"#": "_.id==a",
		"^": "!a.indexOf(v)",
		"|": "a.split('-')[0]==v",
		"$": "a.slice(-v.length)==v",
		"~": "~a.split(/\\s+/).indexOf(v)",
		"*": "~a.indexOf(v)",
		">>": "m(_.parentNode,v)",
		"++": "m(_.previousSibling,v)",
		"": "c(_.parentNode,v)"
	}
	, matches = patch("matches", "return!!X(a)(t)", 0, selectorFn)
	, closest = walk.bind(window, "parentNode", 1)

	// Note: querySelector in IE8 supports only CSS 2.1 selectors
	patch((b="querySelector"), (a = "return X(t,a,") + "1)", ie678, find)
	patch(b + "All", a + "0)", ie678, find)
	//patch("addEventListener", function(ev, fn) { })
	//patch("removeEventListener")

	function selectorFn(str) {
		if (str != null && typeof str !== "string") throw Error("Invalid selector")
		return selectorCache[str || ""] ||
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
						(subSel || (quotation ? val.slice(1, -1) : val) || "").replace(/[\\']/g, "\\$&") +
						"'),(a='" + key + "'),1)"
						,
						selectorMap[op == ":" ? key : op] ||
						"(a=_.getAttribute(a))" +
						(fn ? "&&" + selectorMap[fn] : val ? "==v" : "!==null")
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
		sel = selectorFn(sel)
		for (var out = []; el; el = el[next] || nextFn && nextFn(el)) if (sel(el)) {
			if (first) return el
			out.push(el)
		}
		return first ? null : out
	}

	function find(node, sel, first) {
		return walk("firstChild", first, node.firstChild, sel, function(el) {
			for (var next = el.nextSibling; !next && ((el = el.parentNode) !== node); ) next = el.nextSibling
			return next
		})
	}


	// ie6789
	// The documentMode is an IE only property, supported from IE8.
	if (ie678) {
		try {
			// Remove background image flickers on hover in IE6
			// You could also use CSS
			// html { filter: expression(document.execCommand("BackgroundImageCache", false, true)); }
			document.execCommand("BackgroundImageCache", false, true)
		} catch(e){}
	}

	function isFn(value) {
		return typeof value === "function"
	}
	function isStr(value) {
		return typeof value === "string"
	}
	function nop() {}

	function patch(key_, src, force, arg1, arg2) {
		var key = key_.split(":").pop()
		return !force && O[key] || (O[patched.push(key_), key] = (
			isStr(src) ?
			Function("o,O,P,S,F,X,Y", "return function(a,b,c){var t=this,A=arguments;" + src + "}")(hasOwn, O[key], P, patched.slice, force, arg1, arg2) :
			src || {}
		))
	}
}(this, Function, Infinity, "prototype") // jshint ignore:line
/* c8 ignore stop */



