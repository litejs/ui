
/* litejs.com/MIT-LICENSE.txt */

/* global xhr, getComputedStyle, navigator, requestAnimationFrame */

!function(window, document, history, location, Object) {
	window.El = El
	window.LiteJS = LiteJS
	window.View = View

	var UNDEF, styleNode
	, html = document.documentElement
	, body = document.body
	, defaults = {
		base: "",
		home: "home",
		root: body
	}
	, hasOwn = defaults.hasOwnProperty
	, histCb, histBase, histRoute, iframe, iframeTick, iframeUrl
	, splitRe = /[,\s]+/
	, emptyArr = []
	, isArray = Array.isArray
	, slice = emptyArr.slice
	, P = "prototype"

	// JScript engine in IE8 and below does not recognize vertical tabulation character `\v`.
	// http://webreflection.blogspot.com/2009/01/32-bytes-to-know-if-your-browser-is-ie.html
	, ie678 = !+"\v1" // jshint ignore:line
	// The documentMode is an IE only property, supported in IE8 and up.
	, ie67 = ie678 && (document.documentMode | 0) < 8 // jshint ignore:line

	, viewFn, lastView, lastStr, lastUrl, syncResume
	, capture = 1
	, fnStr = ""
	, reStr = ""
	, views = View.views = {}
	, paramCb = {}
	, lastParams = paramCb
	, escapeRe = /[.*+?^=!:${}()|\[\]\/\\]/g
	, parseRe = /\{([\w%.]+?)\}|.[^{\\]*?/g

	, BIND_ATTR = "data-bind"
	, elSeq = 0
	, elCache = {}
	, templateRe = /([ \t]*)(%?)((?:("|')(?:\\\4|.)*?\4|[-\w:.#[\]]=?)*)[ \t]*([+>^;@|\\\/]|!?=|)(([\])}]?).*?([[({]?))(?=\x1f|\n|$)+/g
	, renderRe = /[;\s]*(\w+)(?:(::?| )((?:(["'\/])(?:\\\3|.)*?\3|[^;])*))?/g
	, selectorRe = /([.#:[])([-\w]+)(?:\(((?:[^()]|\([^)]+\))+?)\)|([~^$*|]?)=(("|')(?:\\.|[^\\])*?\6|[-\w]+))?]?/g
	, fnRe = /('|")(?:\\\1|.)*?\1|\/(?:\\?.)+?\/[gim]*|\b(?:n|data|b|s|B|r|false|in|new|null|this|true|typeof|void|function|var|if|else|return)\b|\.\w+|\w+:/g
	, wordRe = /\b[a-z_$][\w$]*/ig
	, camelRe = /\-([a-z])/g
	// innerText is implemented in IE4, textContent in IE9, Node.text in Opera 9-10
	// Safari 2.x innerText results an empty string when style.display=="none" or Node is not in DOM
	, txtAttr = "textContent" in body ? "textContent" : "innerText"
	, bindings = {
		attr: El.attr = acceptMany(setAttr, getAttr),
		cls: El.cls = acceptMany(cls),
		css: El.css = acceptMany(function(el, key, val) {
			el.style[key.replace(camelRe, camelFn)] = "" + val || ""
		}, function(el, key) {
			return getComputedStyle(el).getPropertyValue(key)
		}),
		data: function(el, key, val) {
			setAttr(el, "data-" + key, val)
		},
		html: function(el, html) {
			el.innerHTML = html
		},
		ref: function(el, name) {
			this[name] = el
		},
		txt: El.txt = function(el, txt) {
			if (el[txtAttr] !== txt) el[txtAttr] = txt
		},
		val: El.val = valFn,
		"with": function(el, map) {
			var scope = elScope(el, this)
			Object.assign(scope, map)
			if (scope !== this) {
				render(el)
				return true
			}
		}
	}
	, bindMatch = []
	, scopeData = {
		_: String,
		_b: bindings,
		El: El,
		View: View
	}
	, elArr = {
		append: function(el) {
			var elWrap = this
			if (elWrap._s) {
				append(elWrap[elWrap._s[getAttr(el, "slot") || elWrap._s._] || 0], el)
			} else {
				elWrap.push(el)
			}
			return elWrap
		},
		cloneNode: function(deep) {
			deep = ElWrap(this, deep)
			deep._s = this._s
			return deep
		}
	}
	, plugins = {}
	, pluginProto = {
		_done: function() {
			var t = this
			, childNodes = t.el.childNodes
			, i = t.el._cp
			, el = childNodes[1] ? ElWrap(childNodes) : childNodes[0]

			if (i > -1) {
				if (childNodes[i].nodeType == 1 && t.el._sk) {
					setAttr(childNodes[i], "data-slot", t.el._sk)
				}
				el._s = t.el._s
			}
			if (t.c) elCache = t.c
			t.el.plugin = t.el = t.parent = null
			return el
		},
		done: Function("this._r(this.params||this.txt)")
	}

	// After iOS 13 iPad with default enabled "desktop" option
	// is the only Macintosh with multi-touch
	, iOS = /^(Mac|iP)/.test(navigator.platform)
	// || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

	// The addEventListener is supported in Internet Explorer from version 9.
	// https://developer.mozilla.org/en-US/docs/Web/Reference/Events/wheel
	// - IE8 always prevents the default of the mousewheel event.
	, addEv = "addEventListener"
	, remEv = "removeEventListener"
	, prefix = window[addEv] ? "" : (addEv = "attachEvent", remEv = "detachEvent", "on")
	, Event = window.Event || window
	, fixEv = Event.fixEv || (Event.fixEv = {})
	, fixFn = Event.fixFn || (Event.fixFn = {})

	Event.asEmitter = asEmitter
	Event.stop = stopEvent

	if (iOS) {
		// iOS doesn't support beforeunload, use pagehide instead
		fixEv.beforeunload = "pagehide"
	}

	xhr.view = xhr.tpl = El.tpl = parseTemplate
	xhr.css = function(str) {
		if (!styleNode) {
			// Safari and IE6-8 requires dynamically created
			// <style> elements to be inserted into the <head>
			append($("head", html), styleNode = El("style"))
		}
		if (styleNode.styleSheet) styleNode.styleSheet.cssText += str
		else append(styleNode, str)
	}

	function asEmitter(obj) {
		obj.on = on
		obj.off = off
		obj.one = one
		obj.emit = emit
		obj.listen = listen
		obj.unlisten = unlisten
		// emitNext, emitLate
	}

	function on(type, fn, scope, _origin) {
		var emitter = this === window ? emptyArr : this
		, events = emitter._e || (emitter._e = Object.create(null))
		if (type && fn) {
			if (isString(fn)) fn = emit.bind(emitter, fn)
			emit.call(emitter, "newListener", type, fn, scope, _origin)
			;(events[type] || (events[type] = [])).unshift(scope, _origin, fn)
		}
		return this
	}

	function off(type, fn, scope) {
		var i, args
		, emitter = this === window ? emptyArr : this
		, events = emitter._e && emitter._e[type]
		if (events) {
			for (i = events.length - 2; i > 0; i -= 3) {
				if ((events[i + 1] === fn || events[i] === fn) && events[i - 1] == scope) {
					args = events.splice(i - 1, 3)
					emit.call(emitter, "removeListener", type, args[2], args[0], args[1])
					if (fn) break
				}
			}
		}
		return this
	}

	function one(type, fn, scope) {
		var emitter = this === window ? emptyArr : this
		function remove() {
			off.call(emitter, type, fn, scope)
			off.call(emitter, type, remove, scope)
		}
		on.call(emitter, type, remove, scope)
		on.call(emitter, type, fn, scope)
		return this
	}

	function emit(type) {
		var args, i
		, emitter = this === window ? emptyArr : this
		, _e = emitter._e
		, arr = _e ? (_e[type] || emptyArr).concat(_e["*"] || emptyArr) : emptyArr
		if ((_e = arr.length)) {
			for (i = _e - 1, args = slice.call(arguments, 1); i > 1; i -= 3) {
				if (arr[i]) arr[i].apply(arr[i - 2] || emitter, args)
			}
		}
		return _e / 3
	}

	function listen(emitter, ev, fn, scope, _origin) {
		if (emitter) {
			on.call(emitter, ev, fn, scope)
			;(this._l || (this._l = [])).push([emitter, ev, fn, scope, _origin])
		}
		return this
	}

	function unlisten(key) {
		var a, i
		, listening = this._l
		if (listening) for (i = listening.length; i--; ) {
			a = listening[i]
			if (key === "*" || a.indexOf(key) > -1) {
				listening.splice(i, 1)
				off.call(a[0], a[1], a[2], a[3])
			}
		}
		return this
	}

	function addEvent(el, ev, _fn) {
		var fn = fixFn[ev] && fixFn[ev](el, _fn, ev) || _fn
		, fix = prefix ? function() {
			var e = new Event(ev)
			if (e.clientX !== UNDEF) {
				e.pageX = e.clientX + scrollLeft()
				e.pageY = e.clientY + scrollTop()
			}
			fn.call(el, e)
		} : fn

		if (fixEv[ev] !== "") {
			el[addEv](prefix + (fixEv[ev] || ev), fix, false)
		}

		on.call(el, ev, fix, el, _fn)
	}

	function rmEvent(el, ev, fn) {
		var evs = el._e && el._e[ev]
		, id = evs && evs.indexOf(fn)
		if (id > -1) {
			if (fn !== evs[id + 1] && evs[id + 1]._rm) {
				evs[id + 1]._rm()
			}
			el[remEv](prefix + (fixEv[ev] || ev), evs[id + 1])
			evs.splice(id - 1, 3)
		}
	}

	function stopEvent(e) {
		if (e && e.preventDefault) {
			e.stopPropagation()
			e.preventDefault()
		}
		return false
	}

	function LiteJS(opts) {
		opts = Object.assign({}, defaults, opts)
		var key, name
		, root = opts.root
		for (key in opts) if (hasOwn.call(opts, key)) {
			if (isFunction(View[key])) {
				for (name in opts[key]) if (hasOwn.call(opts[key], name)) {
					View[key](name, opts[key][name])
				}
			} else {
				View[key] = opts[key]
			}
		}
		addKb(opts.kb)
		View("#", root)
		return View
	}

	function View(route, el, parent) {
		var view = views[route]
		if (view) {
			if (el) {
				view.el = el
				view.parent = parent && View(parent)
			}
			return view
		}
		view = this
		if (!(view instanceof View)) return new View(route, el, parent)
		views[view.route = route] = view
		view.el = isString(el) ? $(el) : el
		view.parent = parent && View(parent)

		if (route.charAt(0) !== "#") {
			var params = "m[" + (view.seq = capture++) + "]?("
			, _re = route.replace(parseRe, function(_, key) {
				return key ?
					(params += "o['" + key + "']=m[" + (capture++) + "],") && "([^/]+?)" :
					_.replace(escapeRe, "\\$&")
			})

			fnStr += params + "'" + route + "'):"
			reStr += (reStr ? "|(" : "(") + _re + ")"
			viewFn = 0
		}
	}

	View.prototype = {
		show: function(_params) {
			var parent
			, params = lastParams = _params || {} // jshint ignore:line
			, view = lastView = this // jshint ignore:line
			, tmp = params._v || view
			, close = view.isOpen && view

			View.route = view.route
			viewEmit(view, "init")

			for (; tmp; tmp = parent) {
				viewEmit(syncResume = params._v = tmp, "ping", params, View)
				syncResume = null
				if (lastParams !== params) return
				if ((parent = tmp.parent)) {
					if (parent.child && parent.child !== tmp) {
						close = parent.child
					}
					parent.child = tmp
				}
				if (!tmp.el) {
					if (tmp.file) {
						xhr.load(
							tmp.file
							.replace(/^|,/g, "$&" + (View.base || ""))
							.split(","),
							view.wait(tmp.file = null)
						)
					} else {
						if (tmp.route === "404") {
							parseTemplate("%view 404 #\nh2 Not found")
						}
						View("404").show({origin:params})
					}
					return
				}
			}

			if (view !== close) viewEmit(view, "change", close)

			for (tmp in params) if (tmp.charAt(0) !== "_") {
				if ((syncResume = hasOwn.call(paramCb, tmp) && paramCb[tmp] || paramCb["*"])) {
					syncResume.call(view, params[tmp], tmp, params)
					syncResume = null
				}
			}

			bubbleDown(params, close)
		},
		wait: function() {
			var params = lastParams
			params._p = 1 + (params._p | 0)
			return function() {
				if (--params._p || lastParams !== params || syncResume) return
				if (params._d) {
					bubbleDown(params)
				} else if (params._v) {
					lastView.show(params)
				}
			}
		}
	}

	asEmitter(View)
	asEmitter(View.prototype)

	function bubbleDown(params, close) {
		var tmp
		, view = params._v
		, parent = view && view.parent
		if (!view || params._p && /{/.test(view.route)) {
			return closeView(close)
		}
		if (parent && !view.isOpen || view === close) {
			closeView(close, view)
			elScope(
				view.isOpen = view.el.cloneNode(true),
				elScope(tmp = parent.isOpen || parent.el)
			)
			append(tmp, view.isOpen)
			render(view.isOpen)
			viewEmit(parent, "openChild", view, close)
			viewEmit(view, "open", params)
			if (view.kb) addKb(view.kb)
			close = null
		}
		if ((params._d = params._v = view.child)) {
			bubbleDown(params, close)
		}
		if ((lastView === view)) {
			viewEmit(view, "show", params)
			blur()
		}
	}

	function closeView(view, open) {
		if (view && view.isOpen) {
			viewEmit(view.parent, "closeChild", view, open)
			closeView(view.child)
			kill(view.isOpen)
			view.isOpen = null
			if (view.kb) rmKb(view.kb)
			viewEmit(view, "close")
		}
	}

	function viewEmit(view, event, a, b) {
		view.emit(event, a, b)
		View.emit(event, view, a, b)
	}

	View.get = get
	function get(url, params) {
		if (!viewFn) {
			viewFn = Function(
				"var r=/^\\/?(?:" + reStr + ")[\\/\\s]*$/;" +
				"return function(i,o,d){var m=r.exec(i);return m!==null?(" + fnStr + "d):d}"
			)()
		}
		return View(url ? viewFn(url, params || {}, "404") : View.home)
	}

	View.ping = function(name, fn) {
		View(name).on("ping", fn)
	}

	View.show = function(url, _params) {
		if (url === true) {
			if (lastParams._p > 0) return
			url = lastUrl
			lastUrl = 0
		}
		var params = _params || {}
		, view = get(url, params)
		if (!view.isOpen || lastUrl !== url) {
			params._u = lastUrl = url
			view.show(scopeData.params = params)
		}
	}

	View.param = function(names, cb) {
		;("" + names).split(splitRe).forEach(function(n) {
			paramCb[n] = cb
		})
	}

	View.def = viewDef
	function viewDef(str) {
		for (var match, re = /(\S+) (\S+)/g; (match = re.exec(str)); ) {
			match[1].split(",").map(def)
		}
		function def(view) {
			view = View(expand(view, lastStr))
			view.file = (view.file ? view.file + "," : "") +
			match[2].split(",").map(function(file) {
				return views[file] ? views[file].file : expand(file, lastStr)
			})
		}
	}

	View.expand = expand
	function expand(str, _last) {
		var chr = str.charAt(0)
		, slice = str.slice(1)
		, last = _last || lastUrl
		return (
			chr === "+" ? last + slice :
			chr === "%" ? ((chr = last.lastIndexOf(slice.charAt(0))), (chr > 0 ? last.slice(0, chr) : last)) + slice :
			(lastStr = str)
		)
	}

	function getUrl(_loc) {
		return (
			/*** pushState ***/
			histBase ? location.pathname.slice(histBase.length) :
			/**/
			// bug in Firefox where location.hash is decoded
			// bug in Safari where location.pathname is decoded

			// var hash = location.href.split('#')[1] || '';
			// https://bugs.webkit.org/show_bug.cgi?id=30225
			// https://github.com/documentcloud/backbone/pull/967
			(_loc || location).href.split("#")[1] || ""
		).replace(/^[#\/\!]+|[\s\/]+$/g, "")
	}

	function setUrl(url, replace) {
		/*** pushState ***/
		if (histBase) {
			history[replace ? "replaceState" : "pushState"](null, null, histBase + url)
		} else {
		/**/
			location[replace ? "replace" : "assign"]("#" + url)
			// Opening and closing the iframe tricks IE7 and earlier
			// to push a history entry on hash-tag change.
			if (iframe && getUrl() !== getUrl(iframe.location) ) {
				iframe.location[replace ? "replace" : iframe.document.open().close(), "assign"]("#" + url)
			}
		/*** pushState ***/
		}
		/**/
		return checkUrl()
	}

	function checkUrl() {
		if (histRoute != (histRoute = LiteJS.url = getUrl())) {
			if (histCb) histCb(histRoute)
			return true
		}
	}

	LiteJS.go = setUrl
	LiteJS.start = function(cb) {
		histCb = cb
		/*** pushState ***/
		// Chrome5, Firefox4, IE10, Safari5, Opera11.50
		var url
		, base = html.getElementsByTagName("base")[0]
		if (base) base = base.href.replace(/.*:\/\/[^/]*|[^\/]*$/g, "")
		if (base && !history.pushState) {
			url = location.pathname.slice(base.length)
			if (url) {
				location.replace(base + "#" + url)
			}
		}
		if (base && history.pushState) {
			histBase = base

			url = location.href.split("#")[1]
			if (url && !getUrl()) {
				setUrl(url, 1)
			}

			// Chrome and Safari emit a popstate event on page load, Firefox doesn't.
			// Firing popstate after onload is as designed.
			//
			// See the discussion on https://bugs.webkit.org/show_bug.cgi?id=41372,
			// https://code.google.com/p/chromium/issues/detail?id=63040
			// and the change to the HTML5 spec that was made:
			// http://html5.org/tools/web-apps-tracker?from=5345&to=5346.
			window.onpopstate = checkUrl
		} else
		/**/
			if ("onhashchange" in window && !ie67) {
			// There is onhashchange in IE7 but its not get emitted
			//
			// Basic support:
			// Chrome 5.0, Firefox 3.6, IE 8, Opera 10.6, Safari 5.0
			window.onhashchange = checkUrl
		} else {
			if (ie67 && !iframe) {
				// IE<9 encounters the Mixed Content warning when the URI javascript: is used.
				// IE5/6 additionally encounters the Mixed Content warning when the URI about:blank is used.
				// src="//:"
				iframe = body.appendChild(document.createElement("<iframe tabindex=-1 style=display:none>")).contentWindow
			}
			clearInterval(iframeTick)
			iframeTick = setInterval(function(){
				var cur = getUrl()
				if (iframe && iframeUrl === cur) cur = getUrl(iframe.location)
				if (iframeUrl !== cur) {
					iframeUrl = cur
					if (iframe) setUrl(cur)
					else checkUrl()
				}
			}, 60)
		}

		xhr.load(findTemplates(), checkUrl)
	}


	/**
	 * Turns CSS selector like syntax to DOM Node
	 * El("input#12.nice[type=checkbox]:checked:disabled[data-lang=en].class")
	 * <input id="12" class="nice class" type="checkbox" checked="checked" disabled="disabled" data-lang="en">
	 */

	function El(name) {
		if (!isString(name)) {
			return ElWrap(name)
		}
		var el, pres
		, pre = {}
		name = name.replace(selectorRe, function(_, op, key, _sub, fn, val, quotation) {
			pres = 1
			val = quotation ? val.slice(1, -1) : val || key
			pre[op =
				op === "." ?
				(fn = "~", "class") :
				op === "#" ?
				"id" :
				key
			] = fn && pre[op] ?
				fn === "^" ? val + pre[op] :
				pre[op] + (fn === "~" ? " " : "") + val :
				val
			return ""
		}) || "div"

		// NOTE: IE-s cloneNode consolidates the two text nodes together as one
		// http://brooknovak.wordpress.com/2009/08/23/ies-clonenode-doesnt-actually-clone/
		el = (name = elCache[name] || (elCache[name] = document.createElement(name))).cloneNode(true)
		el._s = name._s

		if (pres) {
			setAttr(el, pre)
		}

		return el
	}

	function ElWrap(nodes, clone) {
		var wrap = []
		, i = nodes.length
		if (i) {
			for (; i--; ) {
				wrap[i] = clone < 2 ? nodes[i].cloneNode(clone) : nodes[i]
			}
		} else if (i == null) {
			wrap[0] = nodes
		}
		return Object.assign(wrap, elArr)
	}

	El.empty = empty
	El.kill = kill
	El.render = render

	Object.keys(El).forEach(function(key) {
		elArr[key] = function() {
			var i = 0
			, self = this
			, len = self.length
			, arr = slice.call(arguments)
			arr.unshift(1)
			for (; i < len; ) {
				arr[0] = self[i++]
				El[key].apply(El, arr)
			}
			return self
		}
	})

	El.$ = $
	El.$$ = $$
	El.append = append
	El.bindings = bindings
	El.blur = blur
	El.cache = elCache
	El.closest = closest
	El.data = scopeData
	El.hasClass = hasClass
	El.matches = matches
	El.rate = rate
	El.replace = replace
	El.scope = elScope
	El.scrollLeft = scrollLeft
	El.scrollTop = scrollTop
	El.step = step
	El.on = bindings.on = bindingOn
	El.off = acceptMany(rmEvent)
	El.one = function(el, ev, fn) {
		function remove() {
			rmEvent(el, ev, fn)
			rmEvent(el, ev, remove)
		}
		addEvent(el, ev, fn)
		addEvent(el, ev, remove)
		return el
	}
	El.emit = function(el) {
		emit.apply(el, slice.call(arguments, 1))
	}


	function getAttr(el, key) {
		return el && el.getAttribute && el.getAttribute(key)
	}

	function setAttr(el, key, val) {
		var current

		if (isObject(key)) {
			for (current in key) {
				setAttr(el, current, key[current])
			}
			return
		}

		/* Accept namespaced arguments
		var namespaces = {
			xlink: "http://www.w3.org/1999/xlink",
			svg: "http://www.w3.org/2000/svg"
		}

		current = key.split("|")
		if (current[1]) {
			el.setAttributeNS(namespaces[current[0]], current[1], val)
			return
		}
		*/

		current = el.getAttribute(key)


		/*** ie8 ***/
		// Bug: IE5-7 doesn't set styles and removes events when you try to set them.
		// IE6 label with a for attribute will re-select the first option of SELECT list instead of just giving focus.
		// http://webbugtrack.blogspot.com/2007/09/bug-116-for-attribute-woes-in-ie6.html
		// istanbul ignore next: IE fix
		if (ie67 && (key === "id" || key === "name" || key === "checked")) {
			// IE8 and below have a bug where changed 'name' not accepted on form submit
			el.mergeAttributes(El("INPUT[" + key + "='" + val + "']"), false)
		} else
		/**/
		if (key === "class") {
			cls(el, val)
		} else if (val || val === 0) {
			if (current != val) {
				el.setAttribute(key, val)
			}
		} else if (current) {
			el.removeAttribute(key)
		}
	}

	function append(el, child, before) {
		if (!el.nodeType) {
			return el.append ? el.append(child, before) : el
		}
		var tmp
		, i = 0
		if (child) {
			if (isString(child) || isNumber(child)) child = document.createTextNode(child)
			else if ( !child.nodeType && (i = child.length) ) {
				for (tmp = document.createDocumentFragment(); i--; ) append(tmp, child[i], 0)
				child = tmp
			}

			if (child.nodeType) {
				tmp = el.insertBefore ? el : el[el.length - 1]
				if ((i = getAttr(child, "slot"))) {
					child.removeAttribute("slot")
					before = findCom(tmp, "%slot-" + i) || tmp
					tmp = before.parentNode
				} else if ((i = getAttr(tmp, "data-slot"))) {
					before = findCom(tmp, "%slot-" + i) || tmp
					tmp = before.parentNode
					// TODO:2016-07-05:lauri:handle numeric befores
				}
				/*** debug ***/
				if (tmp.namespaceURI && child.namespaceURI && tmp.namespaceURI !== child.namespaceURI && child.tagName !== "svg") {
					console.error("NAMESPACE CHANGE!", tmp.namespaceURI, child.namespaceURI, child)
				}
				/**/
				tmp.insertBefore(child, (isNumber(before) ? tmp.childNodes[
					before < 0 ? tmp.childNodes.length - before - 2 : before
				] : before) || null)
			}
		}
		return el
	}

	function valFn(el, val) {
		if (!el) return ""
		var input, step, key, value
		, i = 0
		, type = el.type
		, opts = el.options
		, checkbox = type === "checkbox" || type === "radio"

		if (el.tagName === "FORM") {
			// Disabled controls do not receive focus,
			// are skipped in tabbing navigation, cannot be successfully posted.
			//
			// Read-only elements receive focus but cannot be modified by the user,
			// are included in tabbing navigation, are successfully posted.
			//
			// Read-only checkboxes can be changed by the user

			for (opts = {}; (input = el.elements[i++]); ) if (!input.disabled && (key = input.name || input.id)) {
				value = valFn(input, val != UNDEF ? val[key] : UNDEF)
				if (value !== UNDEF) {
					step = opts
					key.replace(/\[(.*?)\]/g, replacer)
					step[key || step.length] = value
				}
			}

			return opts
		}

		if (val !== UNDEF) {
			if (opts) {
				value = (isArray(val) ? val : [ val ]).map(String)
				for (; (input = opts[i++]); ) {
					input.selected = value.indexOf(input.value) > -1
				}
			} else if (el.val) {
				el.val(val)
			} else if (checkbox) {
				el.checked = !!val
			} else {
				el.value = val
			}
			return
		}

		if (opts) {
			if (type === "select-multiple") {
				for (val = []; (input = opts[i++]); ) {
					if (input.selected && !input.disabled) {
						val.push(input.valObject || input.value)
					}
				}
				return val
			}
			// IE8 throws error when accessing to options[-1]
			value = el.selectedIndex
			el = value > -1 && opts[value] || el
		}

		return checkbox && !el.checked ?
		(type === "radio" ? UNDEF : null) :
		el.valObject !== UNDEF ? el.valObject : el.value

		function replacer(_, _key, offset) {
			if (step == opts) key = key.slice(0, offset)
			step = step[key] || (step[key] = step[key] === null || _key && +_key != _key ? {} : [])
			key = _key
		}
	}

	function hasClass(el, name) {
		var current = el.className || ""

		if (!isString(current)) {
			current = el.getAttribute("class") || ""
		}

		return !!current && current.split(splitRe).indexOf(name) > -1
	}

	function cls(el, name, set) {
		// setAttribute("class") is broken in IE7
		// className is object on SVGElements
		var current = el.className || ""
		, useAttr = !isString(current)

		if (useAttr) {
			current = el.getAttribute("class") || ""
		}

		if (arguments.length < 3 || set) {
			if (current) {
				name = current.split(splitRe).indexOf(name) > -1 ? current : current + " " + name
			}
		} else {
			name = current ? (" " + current + " ").replace(" " + name + " ", " ").trim() : current
		}

		if (current != name) {
			if (useAttr) {
				el.setAttribute("class", name)
			} else {
				el.className = name
			}
		}
	}

	function bindingOn(el, events, selector, data, handler, delay) {
		var argi = arguments.length
		if (argi == 3 || argi == 4 && isNumber(data)) {
			delay = data
			handler = selector
			selector = data = null
		} else if (argi == 4 || argi == 5 && isNumber(handler)) {
			delay = handler
			handler = data
			if (isString(selector)) {
				data = null
			} else {
				data = selector
				selector = null
			}
		}
		if (delay > 0) {
			setTimeout(bindingOn, delay, el, events, selector, data, handler)
			return
		}
		var fn = (
			isString(handler) ? function(e) {
				var target = selector ? closest(e.target, selector) : el
				if (target) emit.apply(View, [handler, e, target].concat(data))
			} :
			selector ? function(e) {
				if (matches(e.target, selector)) handler(e)
			} :
			handler
		)
		, nameArr = ("" + events).split(splitRe)
		, i = 0
		, len = nameArr.length

		for (; i < len; ) {
			addEvent(el, nameArr[i++], fn)
		}
	}
	bindingOn.once = 1

	function empty(el) {
		for (var node; (node = el.firstChild); kill(node));
		return el
	}

	function kill(el, tr, delay) {
		var id
		if (el) {
			if (delay > 0) return setTimeout(kill, delay, el, tr)
			if (tr) {
				cls(el, tr, tr = "transitionend")
				// transitionend fires for each property transitioned
				if ("on" + tr in el) return addEvent(el, tr, kill.bind(el, el, el = null))
			}
			if (el._e) {
				emit.call(el, "kill")
				for (id in el._e) rmEvent(el, id)
			}
			if (el.parentNode) {
				el.parentNode.removeChild(el)
			}
			if (el.nodeType != 1) {
				return el.kill && el.kill()
			}
			empty(el)
			if (el._scope !== UNDEF) {
				delete elScope[el._scope]
			}
			if (el.valObject !== UNDEF) {
				el.valObject = UNDEF
			}
		}
	}

	function elScope(node, parent, fb) {
		return elScope[node._scope] || fb || (
			parent ?
			(((fb = elScope[node._scope = ++elSeq] = Object.create(parent))._super = parent), fb) :
			closestScope(node)
		) || scopeData
	}

	function closestScope(node) {
		for (; (node = node.parentNode); ) {
			if (node._scope) return elScope[node._scope]
		}
	}

	function render(node, _scope) {
		if (!node) return
		var bind, fn
		, scope = elScope(node, 0, _scope)

		if (node.nodeType != 1) {
			if (node.render) node.render(scope)
			return
		}

		/*** ie8 ***/
		if (ie678 && node.tagName === "SELECT") {
			node.parentNode.insertBefore(node, node)
		}
		/**/

		if (hydrate(node, BIND_ATTR, scope)) return
		for (bind = node.firstChild; bind; bind = fn) {
			fn = bind.nextSibling
			render(bind, scope)
		}
		hydrate(node, "data-out", scope)
	}

	function hydrate(node, attr, scope) {
		var bind, fn
		, i = 0
		if ((bind = getAttr(node, attr))) {
			scope._m = bindMatch
			scope._t = bind
			// i18n(bind, lang).format(scope)

			fn = "data&&(" + bind.replace(renderRe, function(match, name, op, args) {
				scope._m[i] = match
				match = bindings[name]
				return (
					(op === "::" || match && hasOwn.call(match, "once")) ?
					"s(n,B,data._t=data._t.replace(data._m[" + (i++)+ "],''))||" :
					""
				) + (
					match ?
					"b['" + name + "'].call(data,n" + (match.raw ? ",'" + args + "'" : args ? "," + args : "") :
					"s(n,'" + name + "'," + args
				) + ")||"
			}) + "r)"

			try {
				var vars = fn.replace(fnRe, "").match(wordRe) || []
				for (i = vars.length; i--; ) if (vars.indexOf(vars[i]) !== i) vars.splice(i, 1)
				if (Function(
					"n,data,b,s,B,r",
					(vars[0] ? "var " + vars.join("='',") + "='';" : "") +
					"with(data||{})return " + fn
				).call(node, node, scope, bindings, setAttr, attr)) {
					return true
				}
			} catch (e) {
				/*** debug ***/
				console.error(e)
				console.error("BINDING: " + bind, node)
				/**/
				if (window.onerror) {
					window.onerror(e.message, e.fileName, e.lineNumber)
				}
			}
		}
	}

	function blur() {
		// IE8 can throw on accessing document.activeElement.
		try {
			var tag = document.activeElement.tagName
			if (tag === "A" || tag === "BUTTON") el.blur()
		} catch(e) {}
	}

	function replace(oldEl, newEl) {
		var parent = oldEl && oldEl.parentNode
		if (parent && newEl) return parent.replaceChild(oldEl, newEl)
	}

	function parseTemplate(str, el) {
		kill(el)
		var parent = El("div")
		, stack = [-1]
		, parentStack = []

		function work(all, indent, plugin, name, q, op, text, mapEnd, mapStart, offset) {
			if (offset && all === indent) return

			for (q = indent.length; q <= stack[0]; ) {
				if (parent.plugin) {
					if (parent.plugin.content && !parent.plugin.el.childNodes[0]) break
					parent.plugin.done()
				}
				parent = parentStack.pop()
				stack.shift()
			}

			if (parent._r) {
				parent.txt += all + "\n"
			} else if (plugin || mapStart && (name = "map")) {
				if (plugins[name]) {
					parentStack.push(parent)
					stack.unshift(q)
					parent = (new plugins[name](parent, op + text, mapEnd ? "" : ";")).el
				} else {
					append(parent, all)
				}
			} else if (mapEnd) {
				appendBind(parent, text, "")
			} else {
				if (name) {
					parentStack.push(parent)
					stack.unshift(q)
					append(parent, parent = q = El(name))
				}
				if (text && op != "/") {
					if (op === ">" || op === "+") {
						(op === "+" ? indent + text : indent + " " + text).replace(templateRe, work)
					} else if (op === "|" || op === "\\") {
						append(parent, text) // + "\n")
					} else {
						if (op === "@") {
							text = text.replace(/(\w+):?/, "on:'$1',")
						} else if (op != ";" && op != "^") {
							text = (parent.tagName === "INPUT" ? "val" : "txt") + (
								op === "=" ? ":" + text.replace(/'/g, "\\'") :
								":_('" + text.replace(/'/g, "\\'") + "',data)"
							)
						}
						appendBind(parent, text, ";", op)
					}
				}
			}
		}
		str.replace(templateRe, work)
		work("", "")
		if (parent.childNodes[0]) {
			/*** debug ***/
			console.warn("Outside view defined elements are rendered immediately into body")
			/**/
			append(body, parent.childNodes)
			render(body)
		}
		if (parent._i) {
			LiteJS.start(LiteJS().show)
		}
	}

	function appendBind(el, val, sep, q) {
		var current = getAttr(el, BIND_ATTR)
		setAttr(el, BIND_ATTR, (current ? (
			q === "^" ?
			val + sep + current :
			current + sep + val
		) : val))
	}

	function addPlugin(name, opts) {
		plugins[name] = plugin
		function plugin(parent, params, attr1) {
			var t = this
			, arr = params.split(splitRe)
			t.parent = parent
			t.name = arr[0]
			t.attr = arr.slice(1)
			if (t._r) {
				t.txt = ""
				t.plugin = t.el = t
				t.params = params
				t.a = attr1
			} else {
				if (t.content) {
					elCache = Object.create(t.c = elCache)
				}
				t.el = El("div")
				t.el.plugin = t
			}
		}
		Object.assign(plugin[P], pluginProto, opts)
	}

	addPlugin("start", {
		done: function() {
			this.parent._i = 1
		}
	})
	addPlugin("binding", {
		done: function() {
			Object.assign(bindings, Function("return({" + this.txt + "})")())
		}
	})
	addPlugin("slot", {
		done: function() {
			var name = this.name || ++elSeq
			, root = append(this.parent, document.createComment("%slot-" + name))
			for (; root.parentNode; root = root.parentNode);
			;(root._s || (root._s = {}))[name] = root.childNodes.length - 1
			if (!this.name) root._s._ = root._sk = name
			root._cp = root.childNodes.length - 1
		}
	})
	addPlugin("css",  { _r: xhr.css })
	addPlugin("def",  { _r: viewDef })
	addPlugin("js",   { _r: eval })
	addPlugin("each", {
		_r: function(params) {
			var txt = this.txt
			params.split(splitRe).map(txt.replace.bind(txt, /{key}/g)).forEach(parseTemplate)
		}
	})
	addPlugin("el", {
		content: 1,
		done: function() {
			var t = this
			, parent = t.parent
			, el = t._done()
			elCache[t.name] = el
			//, arr = t.attr
			//if (arr[0]) {
			//	// TODO:2023-03-22:lauri:Add new scope
			//}
			return parent
		}
	})
	addPlugin("map", {
		_r: function() {
			var self = this
			, txt = (self.params + self.txt)
			appendBind(
				self.parent,
				self.a ? txt.slice(1) : txt,
				self.a
			)
		}
	})
	addPlugin("view", {
		content: 1,
		done: function() {
			var fn
			, t = this
			, arr = t.attr
			, bind = getAttr(t.el, BIND_ATTR)
			, view = View(t.name, t._done(), arr[0], arr[1])
			if (bind) {
				fn = bind.replace(renderRe, function(match, name, op, args) {
					return "(this['" + name + "']" + (
						isFunction(view[name]) ?
						"(" + (args || "") + ")" :
						"=" + args
					) + "),"
				}) + "1"
				Function(fn).call(view)
			}
		}
	})
	addPlugin("view-link", {
		done: function() {
			var t = this
			, arr = t.attr
			View(t.name, null, arr[1])
			.on("ping", function(opts) {
				View.show(arr[0].format(opts))
			})
		}
	})

	/*** kb ***/
	var kbMaps = []
	, kbMod = El.kbMod = iOS ? "metaKey" : "ctrlKey"
	, kbMap = El.kbMap = {
		  8: "backspace", 9: "tab",
		 13: "enter",    16: "shift", 17: "ctrl",  18: "alt",  19: "pause",
		 20: "caps",     27: "esc",
		 33: "pgup",     34: "pgdown",
		 35: "end",      36: "home",
		 37: "left",     38: "up",    39: "right", 40: "down",
		 45: "ins",      46: "del",
		 91: "cmd",
		112: "f1",      113: "f2",   114: "f3",   115: "f4",  116: "f5",  117: "f6",
		118: "f7",      119: "f8",   120: "f9",   121: "f10", 122: "f11", 123: "f12"
	}
	El.addKb = addKb
	El.rmKb = rmKb

	function addKb(map, killEl) {
		if (map) {
			kbMaps.unshift(map)
			if (killEl) {
				on.call(killEl, "kill", rmKb.bind(map, map))
			}
		}
	}
	function rmKb(map) {
		map = kbMaps.indexOf(map || kbMaps[0])
		if (map > -1) kbMaps.splice(map, 1)
	}
	function runKb(e, code, chr) {
		var fn, map
		, i = 0
		, el = e.target || e.srcElement
		, input = /INPUT|TEXTAREA|SELECT/i.test((el.nodeType == 3 ? el.parentNode : el).tagName)

		for (; (map = kbMaps[i++]) && (
			!(fn = !input || map.input ? map[code] || map[chr] || map.num && code > 47 && code < 58 && (chr|=0, map.num) || map.all : fn) &&
			map.bubble
		););
		if (isString(fn)) setUrl(fn)
		if (isFunction(fn)) fn(e, chr, el)
	}

	addEvent(document, "keydown", function(e) {
		if (kbMaps[0]) {
			var c = e.keyCode || e.which
			, numpad = c > 95 && c < 106
			, code = numpad ? c - 48 : c
			, key = kbMap[code] || String.fromCharCode(code).toLowerCase() || code

			// Otherwise IE backspace navigates back
			if (code == 8 && kbMaps[0].backspace) {
				stopEvent(e)
			}
			runKb(e, code, key)
			if (e.shiftKey && code != 16) runKb(e, code, "shift+" + key)
			// people in Poland use Right-Alt+S to type in Ś.
			// Right-Alt+S is mapped internally to Ctrl+Alt+S.
			// THANKS: Marcin Wichary - disappearing Polish Ś [https://medium.engineering/fa398313d4df]
			if (e.altKey) {
				if (code != 18) runKb(e, code, "alt+" + key)
			} else if (code != 17) {
				if (e.ctrlKey) runKb(e, code, "ctrl+" + key)
				if (e[kbMod] && code != 91) runKb(e, code, "mod+" + key)
			}
		}
	})
	/**/


	/*** responsive ***/
	var lastSize, lastOrient
	, breakpoints = {
		sm: 0,
		md: 601,
		lg: 1025
	}
	, setBreakpointsRated = rate(setBreakpoints, 100)

	El.setBreakpoints = setBreakpoints
	function setBreakpoints(_breakpoints) {
		// document.documentElement.clientWidth is 0 in IE5
		var key, next
		, width = html.offsetWidth
		, map = breakpoints = _breakpoints || breakpoints // jshint ignore:line

		for (key in map) {
			if (map[key] > width) break
			next = key
		}

		if ( next != lastSize ) {
			cls(html, lastSize, 0)
			cls(html, lastSize = next)
		}

		next = width > html.offsetHeight ? "landscape" : "portrait"

		if ( next != lastOrient) {
			cls(html, lastOrient, 0)
			cls(html, lastOrient = next)
		}

		View.emit("resize")
	}

	setBreakpointsRated()
	addEvent(window, "resize", setBreakpointsRated)
	addEvent(window, "orientationchange", setBreakpointsRated)
	addEvent(window, "load", setBreakpointsRated)
	/**/

	function $(sel, startNode) {
		return body.querySelector.call(startNode || body, sel)
	}
	function $$(sel, startNode) {
		return ElWrap(body.querySelectorAll.call(startNode || body, sel))
	}
	function matches(el, sel) {
		return el && body.matches.call(el, sel)
	}
	function closest(el, sel) {
		return el && body.closest.call(el.closest ? el : el.parentNode, sel)
	}
	function camelFn(_, a) {
		return a.toUpperCase()
	}
	function findCom(node, val) {
		for (var next, el = node.firstChild; el; ) {
			if (el.nodeType === 8 && el.nodeValue == val) return el
			next = el.firstChild || el.nextSibling
			while (!next && ((el = el.parentNode) !== node)) next = el.nextSibling
			el = next
		}
	}
	function acceptMany(fn, getter) {
		return function f(el, names, val, delay) {
			if (el && names) {
				if (delay >= 0) {
					if (delay > 0) setTimeout(f, delay, el, names, val)
					else requestAnimationFrame(function() {
						f(el, names, val)
					})
					return
				}
				var i
				if (isObject(names)) {
					for (i in names) {
						if (hasOwn.call(names, i)) f(el, i, names[i], val)
					}
					return
				}
				var nameArr = ("" + names).split(splitRe)
				, len = nameArr.length
				i = 0

				if (arguments.length < 3) {
					if (getter) return getter(el, names)
					for (; i < len; ) fn(el, nameArr[i++])
				} else {
					/*
					if (isArray(val)) {
						for (; i < len; ) fn(el, nameArr[i], val[i++])
					} else {
						for (; i < len; ) fn(el, nameArr[i++], val)
					}
					/*/
					for (; i < len; ) {
						fn(el, nameArr[i++], isArray(val) ? val[i - 1] : val)
					}
					//*/
				}
			}
		}
	}
	function scrollLeft() {
		return window.pageXOffset || html.scrollLeft || body.scrollLeft || 0
	}
	function scrollTop() {
		return window.pageYOffset || html.scrollTop || body.scrollTop || 0
	}
	function step(num, factor, mid) {
		var x = ("" + factor).split(".")
		, steps = num / factor
		, n = ~~(steps + ((steps < 0 ? -1 : 1) * (mid == UNDEF ? 0.5 : mid === 1 && steps == (steps|0) ? 0 : +mid))) * factor
		return "" + (1 in x ? n.toFixed(x[1].length) : n)
	}
	function isFunction(fn) {
		return typeof fn === "function"
	}
	function isNumber(num) {
		return typeof num === "number"
	}
	function isObject(obj) {
		return !!obj && obj.constructor === Object
	}
	function isString(str) {
		return typeof str === "string"
	}
	// Maximum call rate for Function
	// leading edge, trailing edge
	function rate(fn, ms) {
		var tick
		, next = 0
		return function() {
			var now = Date.now()
			clearTimeout(tick)
			if (now >= next) {
				next = now + ms
				fn()
			} else {
				tick = setTimeout(fn, next - now)
			}
		}
	}

	function findTemplates() {
		return $$("script[type=ui]").map(function(el) {
			return el.src || parseTemplate(el.textContent, el)
		})
	}
	xhr.load(findTemplates())
}(this, document, history, location, Object) // jshint ignore:line

