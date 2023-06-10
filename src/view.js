
/* litejs.com/MIT-LICENSE.txt */

/* global El, xhr */

!function(window, document, history, location) {
	var empty = []
	, Event = window.Event || window

	Event.Emitter = EventEmitter
	Event.asEmitter = asEmitter

	function EventEmitter() {}

	function asEmitter(obj) {
		obj.on = on
		obj.off = off
		obj.one = one
		obj.emit = emit
		obj.listen = listen
		obj.unlisten = unlisten
	}
	asEmitter(EventEmitter.prototype)

	function on(type, fn, scope, _origin) {
		var emitter = this === window ? empty : this
		, events = emitter._e || (emitter._e = Object.create(null))
		if (type && fn) {
			if (typeof fn === "string") fn = emit.bind(emitter, fn)
			emit.call(emitter, "newListener", type, fn, scope, _origin)
			;(events[type] || (events[type] = [])).unshift(scope, _origin, fn)
		}
		return this
	}

	function off(type, fn, scope) {
		var i, args
		, emitter = this === window ? empty : this
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
		var emitter = this === window ? empty : this
		function remove() {
			off.call(emitter, type, fn, scope)
			off.call(emitter, type, remove, scope)
		}
		on.call(emitter, type, remove, scope)
		on.call(emitter, type, fn, scope)
		return this
	}

	// emitNext
	// emitLate

	function emit(type) {
		var args, i
		, emitter = this === window ? empty : this
		, _e = emitter._e
		, arr = _e ? (_e[type] || empty).concat(_e["*"] || empty) : empty
		if ((_e = arr.length)) {
			for (i = _e - 1, args = arr.slice.call(arguments, 1); i > 1; i -= 3) {
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

	var histCb, histBase, histRoute, iframe, iframeTick, iframeUrl
	, cleanRe = /^[#\/\!]+|[\s\/]+$/g

	// JScript engine in IE8 and below does not recognize vertical tabulation character `\v`.
	// http://webreflection.blogspot.com/2009/01/32-bytes-to-know-if-your-browser-is-ie.html
	//
	// The documentMode is an IE only property, supported in IE8 and up.
	, ie67 = !+"\v1" && (document.documentMode | 0) < 8 // jshint ignore:line

	, fn, lastView, lastStr, lastUrl, syncResume
	, body = document.body
	, isArray = Array.isArray
	, capture = 1
	, fnStr = ""
	, reStr = ""
	, views = View.views = {}
	, paramCb = {}
	, lastParams = paramCb
	, hasOwn = views.hasOwnProperty
	, escapeRe = /[.*+?^=!:${}()|\[\]\/\\]/g
	, parseRe = /\{([\w%.]+?)\}|.[^{\\]*?/g
	, defaults = {
		base: "",
		home: "home",
		root: body
	}

	window.View = View
	window.LiteJS = LiteJS


	function LiteJS(opts) {
		opts = Object.assign({}, defaults, opts)
		var key, name
		, root = opts.root
		for (key in opts) if (hasOwn.call(opts, key)) {
			if (typeof View[key] === "function") {
				for (name in opts[key]) if (hasOwn.call(opts[key], name)) {
					View[key](name, opts[key][name])
				}
			} else {
				View[key] = opts[key]
			}
		}
		View("#", root)
		View.$ = function(sel, start) {
			return body.querySelector.call(start || root, sel)
		}
		View.$$ = function(sel, start) {
			return Array.from(body.querySelectorAll.call(start || root, sel))
		}
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
		view.el = el
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
			fn = 0
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
							El.txt(tmp = El("h3"), "# Error 404")
							View("404", tmp, "#")
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

	function bubbleDown(params, close) {
		var tmp
		, view = params._v
		, parent = view && view.parent
		if (!view || params._p && /{/.test(view.route)) {
			return closeView(close)
		}
		if (parent && !view.isOpen || view === close) {
			closeView(close, view)
			El.scope(
				view.isOpen = view.el.cloneNode(true),
				El.scope(tmp = parent.isOpen || parent.el)
			)
			El.append(tmp, view.isOpen)
			El.render(view.isOpen)
			viewEmit(parent, "openChild", view, close)
			viewEmit(view, "open", params)
			if (view.kb) El.addKb(view.kb)
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
			El.kill(view.isOpen)
			view.isOpen = null
			if (view.kb) El.rmKb(view.kb)
			viewEmit(view, "close")
		}
	}

	function viewEmit(view, event, a, b) {
		view.emit(event, a, b)
		View.emit(event, view, a, b)
	}

	asEmitter(View)
	asEmitter(View.prototype)

	View.get = get
	function get(url, params) {
		if (!fn) {
			fn = Function(
				"var r=/^\\/?(?:" + reStr + ")[\\/\\s]*$/;" +
				"return function(i,o,d){var m=r.exec(i);return m!==null?(" + fnStr + "d):d}"
			)()
		}
		return View(url ? fn(url, params || {}, "404") : View.home)
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
			view.show(El.data.params = params)
		}
	}

	View.param = function(name, cb) {
		;(isArray(name) ? name : name.split(/\s+/)).forEach(function(n) {
			paramCb[n] = cb
		})
	}

	View.def = function(str) {
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

	View.blur = blur
	function blur() {
		// When a View completes, blur focused link
		// IE8 can throw an exception for document.activeElement.
		try {
			var el = document.activeElement
			, tag = el && el.tagName
			if (tag === "A" || tag === "BUTTON") el.blur()
		} catch(e) {}
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
		).replace(cleanRe, "")
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
		, base = document.documentElement.getElementsByTagName("base")[0]
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
				iframe = document.body.appendChild(document.createElement("<iframe tabindex=-1 style=display:none>")).contentWindow
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

		xhr.load(View.$$("script[type='litejs/view']", body).map(function(el) {
			return el.src
		}), checkUrl)
	}
}(this, document, history, location) // jshint ignore:line

