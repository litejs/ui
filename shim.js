
/* litejs.com/MIT-LICENSE.txt */


// IE5 does not support
//  - Array#push/pop
//  - Function#call
//  - encodeURIComponent
//  - RegExp lookahead /(?=a)/ and non-greedy modifiers /a+?/
//  - if ("key" in map) and hasOwnProperty

// IE5.5-IE7 patched 56
// "Event","pointer","sessionStorage","localStorage","requestAnimationFrame","cancelAnimationFrame","console","matchMedia","JSON","setTimeout","setInterval","g:parseInt","parseInt","parseFloat","isNaN","isFinite","isInteger","MAX_SAFE_INTEGER","isSafeInteger","d:now","toJSON","toISOString","bind","assign","create","entries","hasOwn","keys","values","toString","isArray","from","of","includes","indexOf","lastIndexOf","reduce","reduceRight","splice","every","forEach","map","filter","some","flat","flatMap","endsWith","startsWith","trim","sendBeacon","matches","querySelector","querySelectorAll"


/* global El, xhr, escape */
!function(window, Date, Function, Infinity, P) {

	// Array#flat()         - Chrome69, Firefox62, Safari12
	// window.PointerEvent  - Chrome55, Firefox59, Safari13,   IE11
	// navigator.sendBeacon - Chrome39, Firefox31, Safari11.1
	// Object.fromEntries   - Chrome73, Firefox63, Safari12.1, Opera60, Node.js12.0.0
	// queueMicrotask       - Chrome71, Firefox69, Safari12.1
	// "".at(), [].at()     - Chrome92, Firefox90, Safari15.4

	var UNDEF, canCapture, isArray, oKeys
	, O = window
	, patched = (window.xhr || window)._p = []
	, jsonRe = /[\x00-\x1f\x22\x5c]/g
	, JSONmap = {"\b":"\\b","\f":"\\f","\n":"\\n","\r":"\\r","\t":"\\t","\"":"\\\"","\\":"\\\\"}
	, hasOwn = JSONmap.hasOwnProperty
	, esc = escape
	, _parseInt = parseInt
	/*** debug ***/
	, IS_NODE = !window.document
	, document = patch("document", {body:{},documentElement:{}})
	, location = patch("location", {href:""})
	, navigator = patch("navigator", {})
	/*/
	, document = window.document
	, IS_NODE = false
	/**/
	, html = document.documentElement
	, body = document.body
	// JScript engine in IE<9 does not recognize vertical tabulation character
	// The documentMode is an IE only property, supported from IE8
	, a = document.documentMode | 0
	, b = "setInterval"
	, setInterval = (window[b] = window[b])
	, c
	/* node:coverage ignore next 19 */
	, ie678 = !+"\v1" && a < 9 // jshint ignore:line
	, ie6789 = ie678 || a == 9
	, ie67 = ie678 && a < 8
	, EV = "Event"
	, Event = patch(
		EV,
		"c=F.createEventObject(event),b=c.buttons=c.button;c.button=b==1?0:b==4?1:b;c.preventDefault=X;c.stopPropagation=Y;c.target=c.srcElement;c.type=a;return c",
		!isFn(O[EV]) && document,
		Function("this.returnValue=!1"),
		Function("this.cancelBubble=this.cancel=!0")
	)
	, wheelDiff = 120
	, wheelEv = (
		"onwheel" in document      ? "wheel" :      // Modern browsers
		"onmousewheel" in document ? "mousewheel" : // Webkit and IE
		"DOMMouseScroll"                            // older Firefox
	)
	, fixEv = Event.fixEv = {
		pagehide: "onpagehide" in window ? UNDEF : "beforeunload",
		wheel: wheelEv
	}
	, fixFn = Event.fixFn = {
		/* node:coverage ignore next 17 */
		wheel: wheelEv !== "wheel" && function(el, fn) {
			// DOMMouseScroll Firefox 1 MouseScrollEvent.detail - number of lines to scroll (-32768/+32768 = page up/down)
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

	, lastHash
	, onhashchange = "onhashchange"


	// Patch parameters support for setTimeout callback
	patch("setTimeout", (a = "return O(X(a)&&A.length>2?a.apply.bind(a,null,S.call(A,2)):a,b)"), ie6789, isFn)
	// b = "setInterval"
	patch(b, a, ie6789, isFn)

	// 20 fps is good enough
	a = "AnimationFrame"
	patch("request" + a, "return setTimeout(a,50)")
	// window.mozRequestAnimationFrame    || // Firefox 4-23
	// window.webkitRequestAnimationFrame || // Chrome 10-24
	// window.msRequestAnimationFrame     || // IE 10 PP2+
	patch("cancel" + a, "clearTimeout(a)")


	/* node:coverage ignore next 8 */
	if (!IS_NODE && !(onhashchange in window) || ie67) {
		patch(onhashchange, null)
		setInterval(function() {
			if (lastHash !== (lastHash = location.href.split("#")[1]) && isFn(window[onhashchange])) {
				window[onhashchange]()
			}
		}, 60)
	}

	// Missing PointerEvents with Scribble enable on Safari 14
	// https://mikepk.com/2020/10/iOS-safari-scribble-bug/
	// https://bugs.webkit.org/show_bug.cgi?id=217430
	/* node:coverage ignore next 50 */
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
				/* node:coverage ignore next 19 */
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
			window[name += "Storage"].setItem(name, name)
			return window[name].removeItem(name)
		} catch(e){}

		// # IE5 128KB per document
		//
		// The `saveHistory` behavior persists data only for the current session,
		// using one in-memory UserData store for the entire document.
		// If two elements write the same attribute, the first is overwritten.
		//
		// The `userData` behavior persists data across sessions,
		// using one UserData store for each object, saved in the cache.
		// Saved UserData can be reloaded even if the document has been closed and reopened.
		//
		// An ID is required for userData and saveSnapshot behaviors
		// and recommended for saveHistory and saveFavorite behaviors.
		//
		// https://msdn.microsoft.com/en-us/library/ms531348(v=vs.85).aspx
		// if (el.addBehavior) {
		// el.style.behavior = surviveReboot ? "url('#default#userData')" : "url('#default#saveHistory')"
		// el.addBehavior("#default#" + (surviveReboot ? "userData" : "saveHistory"))
		// if (surviveReboot) el.load("persist")
		// value = el.getAttribute(key)
		// save = function() {
		// 	el.setAttribute(key, El.val(el))
		// 	if (surviveReboot) el.save("persist")
		// }
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
	createStorage("local")      // Chrome5, FF3.5, IE8, Safari4, IE8

	// IE8 has console, however, the console object does not exist if the console is not opened.
	patch("console", {log: nop, error: nop})

	patch("getComputedStyle", "return a.currentStyle")

	/*** ie9 ***/
	patch("matchMedia", "b=a||'all';return{media:b,matches:X?X.matchMedium(b):!1,addListener:Y}", 0, window.styleMedia || window.media, nop)
	/**/

	function jsonFn(str) {
		return JSONmap[str] || esc(str).replace(/%u/g, "\\u").replace(/%/g, "\\x")
	}

	patch("JSON", {
		parse: function(t) {
			return Function("return(" + t + ")")()
		},
		stringify: function stringify(o) {
			// IE 8 serializes `undefined` as `"undefined"`
			return (
				isStr(o) ? "\"" + o.replace(jsonRe, jsonFn) + "\"" :
				o !== o || o == null || o === Infinity || o === -Infinity ? "null" :
				typeof o == "object" ? (
					isFn(o.toJSON) ? stringify(o.toJSON()) :
					isArray(o) ? "[" + o.map(stringify) + "]" :
					"{" + oKeys(o).flatMap(function(key) {
						return o[key] === void 0 ? [] : stringify(key) + ":" + stringify(o[key])
					}) + "}"
				) :
				"" + o
			)
		}
	}, ie678)

	// Ignore FF3 escape second non-standard argument
	// https://bugzilla.mozilla.org/show_bug.cgi?id=666448
	patch("escape", "return X(a)", esc("a", 0) != "a", esc)

	// Since Chrome23/Firefox21 parseInt parses leading-zero strings as decimal, not octal
	b = patch("g:parseInt", "return X(a,(b>>>0)||(Y.test(''+a)?16:10))", _parseInt("08") !== 8, _parseInt, /^\s*[-+]?0[xX]/)

	O = Number
	patch("parseInt", b)
	patch("parseFloat", parseFloat)
	patch("isNaN", "return a!==a")
	a = Math.pow
	c = "_SAFE_INTEGER"
	patch("EPSILON", a(2, -52))
	patch(
		"isSafeInteger", "return Y(a)&&a>=X&&a<=-X", 0,
		patch("MIN" + c, -patch("MAX" + c, a(2, 53)-1)),
		patch("isInteger", "return X(a)&&a%1===0", 0, patch("isFinite", "return typeof a==='number'&&isFinite(a)"))
	)

	O = Date
	patch("now", "return+new Date")

	/*** toISOString ***/
	O = O[P]
	// IE8 toJSON does not return milliseconds
	// FF37 returns invalid extended ISO-8601, `29349-01-26T00:00:00.000Z` instead of `+029349-01-26T00:00:00.000Z`
	/* node:coverage ignore next */
	b = O[a = "toISOString"] && new Date(8e14)[a]().length < 27 || ie678
	patch(a, patch("toJSON", [
		"a=t.getUTCFullYear();if(a!==a)throw RangeError('Invalid time');return(b=a<0?'-':a>9999?'+':'')+X(a<0?-a:a,'-',b?6:4", "Month()+1,'-'", "Date(),'T'",
		"Hours(),':'", "Minutes(),':'", "Seconds(),'.'", "Milliseconds(),'Z',3)"
	].join(")+X(t.getUTC"),
		b,
		function(num, append, len) {
			return ("00000" + num).slice(-len || -2) + append
		}
	), b)
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
	isArray = patch("isArray", "return X.call(a)==='[object Array]'", 0, a)

	// TODO:2021-02-25:lauri:Accept iterable objects
	//patch("from", "a=S.call(a);return b?a.map(b,c):a")
	patch("from", "a=X(a)?a.split(''):S.call(a);return b?a.map(b,c):a", 0, isStr)
	patch("of", "return S.call(A)")

	O = O[P]
	a = "var l=t.length,o=[],i=-1;"
	b = "i+=b|0;while(++i<l)"
	c = "if(t[i]===a)return i;return -1"
	patch("includes",    a + b + "if(t[i]===a||(a!==a&&t[i]!==t[i]))return!0;return!1")
	patch("indexOf",     a + b + c)
	patch("lastIndexOf", a + "i=(b|0)||l;i>--l&&(i=l)||i<0&&(i+=l);++i;while(--i>-1)" + c)

	b = a + "if(A.length<2)b=t"
	c = "b=a(b,t[i],i,t);return b"
	patch("reduce",      b + "[++i];while(++i<l)" + c)
	patch("reduceRight", b + "[--l];i=l;while(i--)" + c)

	// Safari12 bug, any modification to the original array before calling `reverse` makes bug disappear
	// Fixed in Safari 12.0.1 and iOS 12.1 on October 30, 2018
	// patch("reverse",     "if(X(t))t.length=t.length;return O.call(t)", "2,1" != [1, 2].reverse(), isArray)

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
	patch("find",        b + "return t[i]")
	patch("some",        b + "return!0;return!1")

	patch("flat",        "return a<1?S.call(t):(b=t.concat.apply([],t))&&a>1&&b.some(X)?b.flat(a-1):b", 0, isArray)
	patch("flatMap",     "return X.apply(t,A).flat()", 0, O.map)
	//patch("entries", "a=this;b=-1;return{next:function(){c=a.length<=++b;return{done:c,value:c?void 0:a[b]}}}")

	a = "b=t.length;a=a<0?b+a|0:a|0;return a>=b||a<0?X:t"
	patch("at",          a + "[a]")

	O = String[P]
	patch("s:at",        a + ".charAt(a)")
	patch("endsWith", "return(a+='')===t.slice(-a.length)")
	patch("startsWith", "return t.lastIndexOf(a,0)===0")
	patch("trim", "return t.replace(/^\\s+|\\s+$/g,'')")


	O = navigator
	patch("sendBeacon", function(url, data) {
		// The synchronous XMLHttpRequest blocks the process of unloading the document,
		// which in turn causes the next navigation appear to be slower.
		try {
			url = xhr("POST", url, xhr.unload)
			url.setRequestHeader("Content-Type", "text/plain;charset=UTF-8")
			url.send(data)
			return true
		} catch(e){}
		return false
	})

	// The HTML5 document.head DOM tree accessor
	// patch("head", document.getElementsByTagName("head")[0])
	// HTMLElement (IE9) -> Element (IE8)
	O = html
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
	, closest = patch("closest", walk.bind(window, "parentNode", 1))
	, matches = patch("matches", "return!!X(a)(t)", 0, selectorFn)

	/* node:coverage ignore next 13 */
	try {
		O[a = "addEventListener"]("t", null, Object.defineProperties({}, {
			capture: { get: function() { canCapture = 1 } }
		}))
		b = "removeEventListener"
		c = "O.call(t,a,b,X(c)?!!c.capture:!!c)"
		if (!canCapture) {
			patch("c:" + a, c, 1, isObj)
			patch("c:" + b, c, 1, isObj)
		}
	} catch(e){}
	// The addEventListener is supported in Internet Explorer from version 9.
	// https://developer.mozilla.org/en-US/docs/Web/Reference/Events/wheel
	// - IE8 always prevents the default of the mousewheel event.
	patch(a, "return(t.attachEvent('on'+a,b=X(t,a,b)),b)", 0, function(el, ev, fn) {
		/* node:coverage ignore next 8 */
		return function() {
			var e = new Event(ev)
			if (e.clientX !== UNDEF) {
				e.pageX = e.clientX + (window.pageXOffset || html.scrollLeft || body.scrollLeft || 0)
				e.pageY = e.clientY + (window.pageYOffset || html.scrollTop || body.scrollTop || 0)
			}
			fn.call(el, e)
		}
	})
	patch(b, "t.detachEvent('on'+a,b)")


	// Note: querySelector in IE8 supports only CSS 2.1 selectors
	patch((a = "querySelector"), (b = "return X(t,a,Y)"), ie678, find, 1)
	patch(a + "All", b, ie678, find, 0)


	function selectorFn(str) {
		if (str != null && !isStr(str)) throw Error("Invalid selector")
		return selectorCache[str || ""] ||
		(selectorCache[str] = Function("m,c", "return function(_,v,a,b){return " +
			str.split(selectorSplitRe).map(function(sel) {
				var relation, from
				, rules = ["_&&_.nodeType==1"]
				, parentSel = sel.replace(selectorLastRe, function(_, _rel, quote, start) {
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
	/* node:coverage ignore next 8 */
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
	/* node:coverage ignore next 3 */
	function isObj(obj) {
		return !!obj && obj.constructor === Object
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
			src
		))
	}
}(this, Date, Function, Infinity, "prototype") // jshint ignore:line
