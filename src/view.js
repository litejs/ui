


/*
 * @version    0.4.0
 * @date       2015-01-16
 * @stability  2 - Unstable
 * @author     Lauri Rooden <lauri@rooden.ee>
 * @license    MIT License
 */



!function(exports) {
	var fn, re, lastView, lastOpts
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
			, _re = route.replace(parseRe, function(_, key) {
				return key ?
					a.push("o['" + key + "']=a[" + (groupsCount++) + "]") && "([^/]+?)" :
					escapeRegExp(_)
			})

			fnStr += (fnStr ? "||" : "") + "a[" + startLen + "]&&(" + a + ")"
			reStr += (reStr ? "|" : "") + "(" + _re + ")"

			fn = new Function("o,a", "return a&&(" + fnStr + "),o")
			re = new RegExp("^\\/?(?:" + reStr + ")[\\/\\s]*$")
		}
	}

	View.prototype = {
		init: function(el, parent, selector) {
			var view = this
			view.el = el
			view.parent = typeof parent == "string" ? View(parent) : parent
			view.selector = selector
		},
		show: function(opts) {
			var child
			, view = lastView = this
			lastOpts = opts || {_r: view.route}
			if (view.open) view.close(opts)
			for (; view; child = view, view = view.parent) {
				if (view.child && view.child != child) {
					view.child.close(opts)
				}
				view.child = child
			}
			// child is now the root view
			child.ping(lastOpts)
		},
		close: function(opts, nextEl) {
			var view = this

			if (view.open) {
				view.emit("close", opts, nextEl)
				if (view.child) view.child.close(opts)
				view.open.kill()
				view.open = view.parent.child = null
			}
		},
		wait: function(opts, emit) {
			var view = this
			, parent = view.parent
			opts._p = 1 + (opts._p | 0)
			function cb() {
				if (--opts._p || lastOpts != opts) return
				if (view.el && view.parent == parent) {
					view.ping(opts, !emit)
				} else {
					;(view.el ? lastView : View("404")).show(opts)
				}
			}
			return function() {
				;(window.requestAnimationFrame || setTimeout)(cb, 1)
			}
		},
		ping: function(opts, silent) {
			var view = this
			, parent = view.parent
			, child = view.child

			if (!view.el && view.file) {
				return xhr.load(
					view.file
					.replace(/^|,/g, "$&" + (View.base || ""))
					.split(","),
					view.wait(opts, 1)
				)
			}

			if (!silent) view.emit("ping", opts)

			if (lastOpts == opts && !opts._p) {
				var type = typeof view.el
				if (type == "function") view.el = view.el()
				else if (type == "string") view.el = El.tpl(view.el)
				if (parent && !view.open) {
					view.open = view.el.cloneNode(true)
					view.open.to(
						parent.selector && parent.open && parent.open.find(parent.selector) || parent.open || parent.el
					)
					view.open.render()
				}
				if (child) {
					child.ping(opts)
				}
			}

			if (lastOpts == opts && !opts._p && view.route == opts._r) {
				view.emit("show", opts)
			}
		}
	}

	Object.merge(View.prototype, Event.Emitter)

	View.home = "home"

	View.show = function(route) {
		var match = fn({_r:"404"}, re.exec(route || View.home))
		View(match._r).show(El.data.route = match)
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
			.on("show", function() {
				View.show(arr[1])
			})
			return t.parent
		}
	})
}(this)

