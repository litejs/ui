


/*
 * @version    0.4.0
 * @date       2015-01-16
 * @stability  2 - Unstable
 * @author     Lauri Rooden <lauri@rooden.ee>
 * @license    MIT License
 */



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

	function View(route, el, parent, selector) {
		var view = this
		if (views[route]) {
			if (el) views[route].init(el, parent, selector)
			return views[route]
		}
		if (!(view instanceof View)) return new View(route, el, parent, selector)
		views[view.route = route] = view
		view.init(el, parent, selector)

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
		init: function(el, parent, selector) {
			var view = this
			view.el = el
			view.parent = typeof parent == "string" ? View(parent) : parent
			view.selector = selector
		},
		show: function(params) {
			var child
			, view = lastView = this
			params = params || {}
			View.active = view.route
			if (view.open) {
				view.close(params)
			}
			for (; view; child = view, view = view.parent) {
				if (view.child && view.child != child) {
					view.child.close(params)
				}
				view.child = child
			}
			// child is now the root view
			child.ping(lastParams = params)
		},
		close: function(params, nextEl) {
			var view = this

			if (view.open) {
				view.emit("close", params, nextEl)
				if (view.child) view.child.close(params)
				view.open.kill()
				view.open = view.parent.child = null
			}
		},
		wait: function(params, emit) {
			var view = this
			, parent = view.parent
			params._p = 1 + (params._p | 0)
			return function() {
				if (--params._p || lastParams != params) return
				lastParams = Object.merge({}, params)
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

			if (!silent) view.emit("ping", params)

			if (lastParams == params && !params._p) {
				var type = typeof view.el
				if (type == "function") view.el = view.el()
				else if (type == "string") view.el = El.tpl(view.el)
				if (parent && !view.open) {
					view.open = view.el.cloneNode(true)
					parent.emit("beforeChild", params)
					view.open.to(
						parent.selector && parent.open && parent.open.find(parent.selector) || parent.open || parent.el
					)
					view.open.render()
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

	Object.merge(View, Event.Emitter)
	Object.merge(View.prototype, Event.Emitter)

	View.home = "home"

	View.show = function(url) {
		if (url === true) {
			url = lastUrl
			lastUrl = 0
		}
		var params = {}
		, view = View(fn(url || View.home, params, "404"))
		if (!view.open || lastUrl != url) {
			params._u = lastUrl = url
			view.show(El.data.route = params)
		}
	}

	View.def = function(str) {
		for (var match, re = /(\S+) (\S+)/g; match = re.exec(str);) {
			match[2].split(",").map(function(route) {
				View(route).file = match[1]
			})
		}
	}

	exports.View = View

	El.plugins.view = El.plugins.template.extend({
		done: function() {
			var t = this
			, parent = t.parent
			, arr = t.name.split(/\s+/)
			View(arr[0], t._done(), arr[1], arr[2])
			return parent
		}
	})

	var dummy = El("div")

	El.plugins["view-link"] = El.plugins.template.extend({
		done: function() {
			var t = this
			, arr = t.name.split(/\s+/)
			View(arr[0], dummy, arr[2])
			.on("ping", function() {
				View.show(arr[1])
			})
			return t.parent
		}
	})
}(this)

