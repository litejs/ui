


!function(exports) {
	var fn, lastView, lastParams, lastStr, lastUrl
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
			var params = "u[" + (groupsCount++) + "]?("
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
		show: function(params) {
			var view = lastView = this
			params = lastParams = params || {}
			View.active = view.route
			if (view.isOpen) {
				view.close()
			}
			bubbleUp(view, params, bubbleDown)
		},
		open: function(params) {
			var view = this
			, parent = view.parent
			if (parent && !view.isOpen) {
				view.isOpen = view.el.cloneNode(true)
				parent.emit("beforeChild", params)
				El.append(parent.isOpen || parent.el, view.isOpen)
				El.render(view.isOpen)
			}
		},
		close: function() {
			var view = this
			if (view.isOpen) {
				view.emit("close")
				if (view.child) view.child.close()
				El.kill(view.isOpen)
				view.isOpen = view.parent.child = null
			}
		},
		wait: function() {
			var view = this
			, params = lastParams
			params._p = 1 + (params._p | 0)
			return function() {
				if (--params._p || lastParams != params) return
				for (view = lastView; view.parent; view = view.parent) {
					if (!view.el) return View("404").show(JSON.merge({}, params))
				}
				if (params._v) bubbleDown(params._v, params)
			}
		}
	}

	function bubbleUp(view, params, next) {
		var child
		for (; view; child = view, view = view.parent) {
			if (view.child && view.child != child) {
				view.child.close()
			}
			if (!view.el && view.file) {
				return xhr.load(
					view.file
					.replace(/^|,/g, "$&" + (View.base || ""))
					.split(","),
					bubbleUp.bind(view, view, params, next)
				)
			}
			view.child = child
			view.emit("ping", params)
			if (lastParams != params) return
			View.emit("ping", params, view)
		}
		// child is now the root view
		Object.each(params, function(value, name) {
			if (name.charAt(0) == "_") return
			if (value = param[name] || param["*"]) {
				value.call(child, params[name], name, params)
			}
		})
		next(child, params)
	}

	function bubbleDown(view, params) {
		var child = view.child
		if (params._p && /{/.test(view.route)) {
			return params._v = view
		}
		if (view.parent && !view.isOpen) {
			view.open(params)
			view.emit("open", params)
			View.emit("open", params, view)
		}
		if (child) {
			bubbleDown(child, params)
		}
		if (lastView == view) {
			view.emit("show", params)
			View.emit("show", params, view)
		}
	}

	Event.asEmitter(View)
	Event.asEmitter(View.prototype)

	View.home = "home"

	View.get = get
	function get(url, params) {
		if (!fn) {
			fn = new Function(
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

	function defMap(str) {
		var chr = str.charAt(0)
		, slice = str.slice(1)
		return chr == "+" ? lastStr + slice :
		chr == "%" ? ((chr = lastStr.lastIndexOf(slice.charAt(0))), (chr > 0 ? lastStr.slice(0, chr) : lastStr)) + slice :
		(lastStr = str)
	}
	exports.View = View

}(this)

