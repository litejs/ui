


!function(exports) {
	var fn, lastView, lastParams, lastStr, lastUrl, syncResume
	, fnStr = ""
	, reStr = ""
	, views = View.views = {}
	, groupsCount = 1
	, escapeRe = /[.*+?^=!:${}()|\[\]\/\\]/g
	, parseRe = /\{([\w%.]+?)\}|.[^{\\]*?/g

	function View(route, el, parent) {
		var view = views[route]
		if (view) {
			if (el) view.init(el, parent)
			return view
		}
		view = this
		if (!(view instanceof View)) return new View(route, el, parent)
		views[view.route = route] = view
		view.init(el, parent)

		if (route.charAt(0) != "#") {
			var params = "u[" + (view.seq = groupsCount++) + "]?("
			, _re = route.replace(parseRe, function(_, key) {
				return key ?
					(params += "o['" + key + "']=u[" + (groupsCount++) + "],") && "([^/]+?)" :
					_.replace(escapeRe, "\\$&")
			})

			fnStr += params + "'" + route + "'):"
			reStr += (reStr ? "|(" : "(") + _re + ")"
			fn = 0
		}
	}

	View.prototype = {
		init: function(el, parent) {
			this.el = el
			this.parent = parent && View(parent)
		},
		show: function(_params) {
			var parent
			, params = lastParams = _params || {}
			, view = lastView = this
			, tmp = params._v || view
			, close = view.isOpen && view

			View.active = view.route

			for (; tmp; tmp = parent) {
				syncResume = params._v = tmp
				tmp.emit("ping", params)
				View.emit("ping", params, tmp)
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
							view.wait()
						)
						tmp.file = null
					} else {
						View("404").show(JSON.merge({}, params))
					}
					return
				}
			}

			for (tmp in params) if (tmp.charAt(0) != "_") {
				if (syncResume = param[tmp] || param["*"]) {
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
		var view = params._v
		, parent = view && view.parent
		if (!view || params._p && /{/.test(view.route)) {
			return closeView(close)
		}
		if (parent && !view.isOpen || view === close) {
			closeView(close, view)
			view.isOpen = view.el.cloneNode(true)
			El.append(parent.isOpen || parent.el, view.isOpen)
			El.render(view.isOpen)
			parent.emit("openChild", view, close)
			view.emit("open", params)
			View.emit("open", params, view)
			if (view.kb) El.addKb(view.kb)
			close = null
		}
		if (params._d = params._v = view.child) {
			bubbleDown(params, close)
		}
		if (lastView == view) {
			view.emit("show", params)
			View.emit("show", params, view)
			blur()
		}
	}

	function closeView(view, open) {
		if (view && view.isOpen) {
			view.parent.emit("closeChild", view, open)
			closeView(view.child)
			El.kill(view.isOpen)
			view.isOpen = null
			if (view.kb) El.rmKb(view.kb)
			view.emit("close")
		}
	}

	Event.asEmitter(View)
	Event.asEmitter(View.prototype)

	View.base = "view/"
	View.home = "home"

	View.get = get
	function get(url, params) {
		if (!fn) {
			fn = Function(
				"u,o,r",
				"return (u=/^\\/?(?:" + reStr + ")[\\/\\s]*$/.exec(u))?(" + fnStr + "r):r"
			)
		}
		return View(fn(url || View.home, params || {}, "404"))
	}

	View.show = function(url, _params) {
		if (url === true) {
			url = lastUrl
			lastUrl = 0
		}
		var params = _params || {}
		, view = get(url, params)
		if (!view.isOpen || lastUrl != url) {
			params._u = lastUrl = url
			view.show(El.data.route = params)
		}
	}

	View.param = param
	function param(name, cb) {
		[].concat(name).forEach(function(n) {
			param[n] = cb
		})
	}

	View.def = function(str) {
		for (var match, re = /(\S+) (\S+)/g; match = re.exec(str);) {
			match[1].split(",").map(function(view) {
				view = View(defMap(view))
				view.file = (view.file ? view.file + "," : "") +
				match[2].split(",").map(function(file) {
					return views[file] ? views[file].file : defMap(file)
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

	function defMap(str) {
		var chr = str.charAt(0)
		, slice = str.slice(1)
		return chr == "+" ? lastStr + slice :
		chr == "%" ? ((chr = lastStr.lastIndexOf(slice.charAt(0))), (chr > 0 ? lastStr.slice(0, chr) : lastStr)) + slice :
		(lastStr = str)
	}
	exports.View = View

}(this)

