


/*
 * @version    0.4.0
 * @date       2015-01-16
 * @stability  2 - Unstable
 * @author     Lauri Rooden <lauri@rooden.ee>
 * @license    MIT License
 */



!function(exports) {
	var fn, re
	, fnStr = ""
	, reStr = ""
	, views = {}
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
			, a = ["o._r='" + route + "'"]
			, _re = route.replace(/:(\w+)/g, "{$1}").replace(parseRe, function(_, key) {
				return key ?
					a.push("o['" + key + "']=a[" + (groupsCount++) + "]") && "([^/]+?)" :
					escapeRegExp(_)
			})

			fnStr += (fnStr ? "||" : "") + "a[" + startLen + "]&&(" + a + ")"
			reStr += (reStr ? "|" : "") + "(" + _re + ")"

			fn = new Function("o,a", "return a&&(" + fnStr + "),o")
			re = new RegExp("^\\/?(?:" + reStr + ")[\\/\\s]*$")
		}
		view.pending = 0
		view.cb = function() {
			setTimeout(function() {
				if (--view.pending === 0) {
					attachView(view, view._opts)
				}
			}, 1)
		}
	}

	View.prototype = {
		init: function(el, parent, selector) {
			var view = this
			view.el = el
			view.parent = typeof parent == "string" ? View(parent) : parent
			view.selector = selector
		},
		getContentEl: function() {
			var view = this
			, type = typeof view.el
			if (type == "function") view.el = view.el()
			else if (type == "string") view.el = El.tpl(view.el)
			return view.selector && view.el.find(view.selector) || view.el
		},
		show: function(opts) {
			var view = this
			if (!opts) opts = {_r: view.route}
			view._opts = opts
			View.active = view.route
			// Why to close? Isn't a render enough
			if (view.active) view.close()
			view.ping(opts)
		},
		close: function(opts) {
			var view = this
			, parent = view.parent

			view.active = false

			if (parent) {
				parent.getContentEl().removeChild(view.el)
				parent.child = null
			}
			view.emit("close", opts)
			if (view.child) view.child.close()
		},
		wait: function() {
			this.pending++
			return this.cb
		},
		ping: function(opts) {
			var view = this

			if (!view.el) {
				var files = (view.file || view.route + ".js")
				.replace(/^|,/g, "$&" + (View.base || ""))
				.split(",")

				xhr.load(files, function() {
					if (view.el) view.ping(opts)
					else if (view.route != "404") {
						View("404").show()
					}
				})
				return
			}

			view.active = true

			view.emit("ping", opts)
			attachView(view, opts)
		}
	}

	function attachView(view, opts) {
		if (View.active != opts._r) return
		var parent = view.parent
		if (parent) {
			if (parent.child != view) {
				if (parent.child) parent.child.close()
				if (!view.pending) {
					parent.child = opts._render = view
					parent.getContentEl().appendChild(view.el)
				}
			}
			parent.ping(opts)
		}
		if (View.active == view.route) {
			;(opts._render || view).el.render()
			view.emit("show", opts)
		}
	}

	Object.merge(View.prototype, Event.Emitter)

	View.home = "home"

	View.show = function(route) {
		var match = fn({_r:"404"}, re.exec(route || View.home))
		View(match._r).show(El.global.route = match)
	}

	View.def = function(str) {
		for (var match, re = /(\S+) (\S+)/g; match = re.exec(str);) {
			match[2].split(",").map(function(route) {
				View(route).file = match[1]
			})
		}
	}

	exports.View = View

	function viewPlugin(parent, name) {
		var t = this
		t.name = name
		t.parent = parent
		t.el = El("div")
		t.el.plugin = t
		return t
	}

	viewPlugin.prototype.done = function() {
		var t = this
		, arr = t.name.split(" ")
		View(arr[0], t.el.removeChild(t.el.firstChild), arr[1], arr[2])
		t.el.plugin = null
		return t.parent
	}

	El.plugins.view = viewPlugin
}(this)

