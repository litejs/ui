


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
	, loadedFiles = {}
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

			fn = new Function("a", "var o={};return " + fnStr + ",o")
			re = new RegExp("^\\/?(?:" + reStr + ")[\\/\\s]*$")
		}

		if (View.active == route) view.show()
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
			else if (type == "string") view.el = El(view.el)
			return view.selector && view.el.find(view.selector) || view.el
		},
		load: function(opts) {
			var view = this
			, file = (View.base || "") + (view.file || view.route + ".js")

			if (loadedFiles[file]) show()
			else xhr.load(file, loadedFiles[file] = show)

			function show() {
				if (view.el) view.show(opts)
				else if (view.route !== View["404"]) {
					View(View["404"]).show({})
				}
			}
		},
		show: function(opts) {
			var view = this
			View.active = view.route
			if (view.el) {
				if (view.active) view.close()
				view.ping(El.global.route = opts)
				;(opts._render || view).el.render()
				if (View.active == view.route) view.emit("show", opts)
			} else {
				view.load(opts)
			}
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
		ping: function(opts) {
			var view = this
			, parent = view.parent

			view.active = true

			if (parent) {
				if (parent.child != view) {
					if (parent.child) parent.child.close()
					parent.child = opts._render = view
					parent.getContentEl().appendChild(view.el)
				}
				parent.ping(opts)
			}
			view.emit("ping", opts)
		}
	}

	Object.merge(View.prototype, Event.Emitter)

	View["404"] = "404"
	View.main = "main"

	View.show = function(route) {
		var match = re.exec(route)
		View(
			match && (match = fn(match))._r ||
			route && View["404"] ||
			View.main
		).show(match || {})
	}

	View.define = function(str) {
		for (var match, re = /(\S+)\?(\S+)/g; match = re.exec(str);) {
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

