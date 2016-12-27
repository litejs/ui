


!function(exports) {
	var fn, lastView, lastParams, lastUrl
	, fnStr = ""
	, reStr = ""
	, views = View.views = {}
	, groupsCount = 1
	, escapeRe = /[.*+?^=!:${}()|\[\]\/\\]/g
	, parseRe = /\{([\w%.]+?)\}|.[^{\\]*?/g

	function escapeRegExp(string) {
		return string.replace(escapeRe, "\\$&")
	}

	function View(route, el, parent) {
		var view = this
		if (views[route]) {
			if (el) views[route].init(el, parent)
			return views[route]
		}
		if (!(view instanceof View)) return new View(route, el, parent)
		views[view.route = route] = view
		view.init(el, parent)

		if (route.charAt(0) != "#") {
			var startLen = groupsCount++
			, params = ","
			, _re = route.replace(parseRe, function(_, key) {
				return key ?
					(params += "o['" + key + "']=u[" + (groupsCount++) + "],") && "([^/]+?)" :
					escapeRegExp(_)
			})

			fnStr += "u[" + startLen + "]?(" + params.slice(1) + "'" + route + "'):"
			reStr += (reStr ? "|" : "") + "(" + _re + ")"

			fn = new Function(
				"u,o,r",
				"return (u=/^\\/?(?:" + reStr + ")[\\/\\s]*$/.exec(u))?(" + fnStr + "r):r"
			)
		}
	}

	View.prototype = {
		init: function(el, parent) {
			var view = this
			view.el = el
			view.parent = typeof parent == "string" ? View(parent) : parent
		},
		show: function(params) {
			var child
			, view = lastView = this
			params = params || {}
			View.active = view.route
			if (view.open) {
				view.close()
			}
			for (; view; child = view, view = view.parent) {
				if (view.child && view.child != child) {
					view.child.close()
				}
				view.child = child
			}
			// child is now the root view
			child.ping(lastParams = params)
		},
		close: function() {
			var view = this

			if (view.open) {
				view.emit("close")
				if (view.child) view.child.close()
				El.kill(view.open)
				view.open = view.parent.child = null
			}
		},
		wait: function(params, emit) {
			var view = this
			, parent = view.parent
			params._p = 1 + (params._p | 0)
			return function() {
				if (--params._p || lastParams != params) return
				lastParams = JSON.merge({}, params)
				if (view.el && view.parent == parent) {
					view.ping(lastParams, !emit)
				} else {
					;(view.el ? lastView : View("404")).show(lastParams)
				}
			}
		},
		ping: function(params, silent) {
			var view = this
			, parent = view.parent
			, child = view.child

			if (!view.el && view.file) {
				return xhr.load(
					view.file
					.replace(/^|,/g, "$&" + (View.base || ""))
					.split(","),
					view.wait(params, 1)
				)
			}

			if (!silent) {
				view.emit("ping", params)
				View.emit("ping", view.route, params)
			}

			if (lastParams == params && !params._p) {
				var type = typeof view.el
				if (type == "function") view.el = view.el()
				else if (type == "string") view.el = El.tpl(view.el)
				if (parent && !view.open) {
					view.open = view.el.cloneNode(true)
					parent.emit("beforeChild", params)
					El.append(parent.open || parent.el, view.open)
					El.render(view.open)
					view.emit("open", params)
					View.emit("open", view.route, params)
				}
				if (child) {
					child.ping(params)
				}
			}

			if (lastParams == params && lastView == view && !params._p) {
				view.emit("show", params)
				View.emit("show", view.route, params)
			}
		}
	}

	JSON.merge(View, Event.Emitter)
	JSON.merge(View.prototype, Event.Emitter)

	View.home = "home"

	View.get = get
	function get(url, params) {
		return View(fn(url || View.home, params || {}, "404"))
	}

	View.show = function(url, _params) {
		if (url === true) {
			url = lastUrl
			lastUrl = 0
		}
		var params = _params || {}
		, view = get(url, params)
		if (!view.open || lastUrl != url) {
			params._u = lastUrl = url
			view.show(El.data.route = params)
		}
	}

	View.def = function(str) {
		for (var match, re = /(\S+) (\S+)/g; match = re.exec(str);) {
			match[1].split(",").map(function(route) {
				var view = View(route)
				view.file = (
					view.file ? view.file + "," : ""
				) +
				match[2].replace(/[^,]+/g, function(file) {
					return views[file] ? views[file].file : file
				})
			})
		}
	}

	exports.View = View

}(this)

