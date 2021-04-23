
/* litejs.com/MIT-LICENSE.txt */



!function(exports) {
	var fn, lastView, lastParams, lastStr, lastUrl, syncResume
	, isArray = Array.isArray
	, capture = 1
	, fnStr = ""
	, reStr = ""
	, views = View.views = {}
	, paramCb = {}
	, hasOwn = views.hasOwnProperty
	, escapeRe = /[.*+?^=!:${}()|\[\]\/\\]/g
	, parseRe = /\{([\w%.]+?)\}|.[^{\\]*?/g
	, defaults = {
		base: "view/",
		home: "home",
		root: document.body
	}

	exports.View = View
	exports.LiteJS = LiteJS


	function LiteJS(_opts) {
		var key, name
		, opts = Object.assign({}, defaults, _opts)
		for (key in opts) if (hasOwn.call(opts, key)) {
			if (typeof View[key] == "function") {
				for (name in opts[key]) if (hasOwn.call(opts[key], name)) {
					View[key](name, opts[key][name])
				}
			} else {
				View[key] = opts[key]
			}
		}
		View("#body", opts.root)
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

		if (route.charAt(0) != "#") {
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
			, params = lastParams = _params || {}
			, view = lastView = this
			, tmp = params._v || view
			, close = view.isOpen && view

			View.route = view.route

			for (; tmp; tmp = parent) {
				emit(syncResume = params._v = tmp, "ping", params, View)
				syncResume = null
				if (lastParams != params) return
				if (parent = tmp.parent) {
					if (parent.child && parent.child != tmp) {
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
						if (tmp.route == "404") {
							El.txt(tmp = El("h3"), "# Error 404")
							View("404", tmp, "#body")
						}
						View("404").show({origin:params})
					}
					return
				}
			}

			if (view !== close) emit(view, "change", close)

			for (tmp in params) if (tmp.charAt(0) != "_") {
				if (syncResume = hasOwn.call(paramCb, tmp) && paramCb[tmp] || paramCb["*"]) {
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
				if (--params._p || lastParams != params || syncResume) return
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
			emit(parent, "openChild", view, close)
			emit(view, "open", params)
			if (view.kb) El.addKb(view.kb)
			close = null
		}
		if (params._d = params._v = view.child) {
			bubbleDown(params, close)
		}
		if (lastView == view) {
			emit(view, "show", params)
			blur()
		}
	}

	function closeView(view, open) {
		if (view && view.isOpen) {
			emit(view.parent, "closeChild", view, open)
			closeView(view.child)
			El.kill(view.isOpen)
			view.isOpen = null
			if (view.kb) El.rmKb(view.kb)
			emit(view, "close")
		}
	}

	function emit(view, event, a, b) {
		view.emit(event, a, b)
		View.emit(event, view, a, b)
	}

	Event.asEmitter(View)
	Event.asEmitter(View.prototype)

	View.get = get
	function get(url, params) {
		if (!fn) {
			fn = Function(
				"var r=/^\\/?(?:" + reStr + ")[\\/\\s]*$/;" +
				"return function(i,o,d){var m=r.exec(i);return m!==null?(" + fnStr + "d):d}"
			)()
		}
		return View(fn(url || View.home, params || {}, "404"))
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
		if (!view.isOpen || lastUrl != url) {
			params._u = lastUrl = url
			view.show(El.data.params = params)
		}
	}

	View.param = function(name, cb, re) {
		;(isArray(name) ? name : name.split(/\s+/)).forEach(function(n) {
			paramCb[n] = cb
		})
	}

	View.def = function(str) {
		for (var match, re = /(\S+) (\S+)/g; match = re.exec(str);) {
			match[1].split(",").map(function(view) {
				view = View(expand(view, lastStr))
				view.file = (view.file ? view.file + "," : "") +
				match[2].split(",").map(function(file) {
					return views[file] ? views[file].file : expand(file, lastStr)
				})
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

}(this)

