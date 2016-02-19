

function test() {
	var GLOBAL = {}

	describe.it.waitTill = function(actual, options) {
		var result
		, count = 30
		, resume = this.wait()

		if (options.timeout) {
			count = 0 | (options.timeout / 50)
		}

		this.ok(function() {
			return !!result
		}, options || "Expected: function returns something")
		test()

		return this

		function test() {
			result = actual()
			if (!result && count--) return setTimeout(test, 50)
			resume()
		}
	}
	describe.it.viewOpen = function(actual, options) {
		return this.waitTill(function() {
			return View(actual).open
		}, options || "Expected: View "+actual+" should be open")
	}
	describe.it.waitSelector = function(actual, options) {
		return this.waitTill(function() {
			return document.body.find(actual)
		}, options || "Expected: selector "+actual+" should be in dom")
	}
	describe.it.countSelectors = function(actual, expected, options) {
		this.waitSelector(actual, options)
		this.ok(function() {
			var nodes = document.body.findAll(actual)
			, count = nodes && nodes.length
			return count === expected
		}, options || actual + " should have text " + expected)
		return this
	}
	describe.it.haveText = function(actual, expected, options) {
		this.waitSelector(actual, options)
		this.waitTill(function() {
			var node = document.body.find(actual)
			, txt = node && node.txt()
			return txt === expected
		}, options || actual + " should have text " + expected)
		return this
	}
	describe.it.fill = function(actual, expected, options) {
		this.waitSelector(actual, options)
		this.ok(function() {
			var node = document.body.find(actual)
			, val = node && node.val(expected)
			return val === expected
		}, options || actual + " should have value " + expected)
		return this
	}
	describe.it.click = function(actual, expected, options) {
		this.waitSelector(actual, options)
		this.ok(function() {
			var ev
			, node = document.body.find(actual)
			, attr = {
				pointerX: 0, pointerY: 0, button: 0,
				ctrlKey: false, altKey: false, shiftKey: false, metaKey: false,
				bubbles: true, cancelable: true
			}

			if (node) {
				if (node.dispatchEvent) {
					ev = document.createEvent("MouseEvents")
					ev.initMouseEvent("click", true, true, document.defaultView, attr.button,
						attr.pointerX, attr.pointerY, attr.pointerX, attr.pointerY,
						attr.ctrlKey, attr.altKey, attr.shiftKey, attr.metaKey,
						attr.button, node)
					node.dispatchEvent(ev)
				} else if (node.click) {
					node.click()
				} else if (node.fireEvent) {
					node.fireEvent("onclick")
				} else if (typeof node.onclick == "function") {
					node.onclick()
				}
			}
			return !!node
		}, options || actual + " should be clickable")
		return this
	}

	describe.it.collectViewsUsage = function() {
		var viewsUsage = GLOBAL.viewsUsage = {}

		View.on("show", function(route) {
			viewsUsage[route] = viewsUsage[route] || 0
			viewsUsage[route]++
		})
		return this
	}

	function isVisible(node) {
		var style = window.getComputedStyle ? window.getComputedStyle(node, null) : node.currentStyle
	}

	describe.it.isVisible = function(actual, expected, options) {
		var node = actual
		, visible = node.offsetHeight != 0
	}

	describe("Example UI").
	it ("should navigate").
	collectViewsUsage().
	run(function() {
		location.hash = ""
	}).
	waitSelector("a[href$='#home'].selected").
	viewOpen("home").
	run(function() {
		location.hash = "#users"
	}).
	waitSelector("a[href$='#users'].selected").
	viewOpen("users").
	countSelectors("ul.users>li", 8).

	click("ul.users a[href]").
	viewOpen("users/{id}", {timeout: 3000}).

	click("a[href$='#home']").
	waitSelector("a[href$='#home'].selected").
	viewOpen("home").

	click("a[href$='#settings']").
	waitSelector("a[href$='#settings'].selected").
	//viewOpen("settings").

	click("a[href$='#test']").
	waitSelector("a[href$='#test'].selected").
	viewOpen("test").

	click("a[href$='#broken-link']").
	viewOpen("404").

	click("a[href$='#test']").
	click("a[href$='#test-grid']").
	viewOpen("test-grid").

	click("a[href$='#test']").
	click("a[href$='#test-form1']").
	viewOpen("test-form1").

	test("it should use all views", function(assert) {
		var route
		, routes = Object.keys(View.views)
		, len = routes.length
		, viewsUsage = GLOBAL.viewsUsage

		assert.plan(len)
		assert.options.noStack = true

		while (route = routes[--len]) {
			assert.ok(viewsUsage[route], "Unused view " + route)
		}
	}).

	it ("should change language").
	click("a.lang-en").
	waitSelector("a.lang-en.selected").
	haveText("a.home-link", "Header").

	click("a.lang-et").
	waitSelector("a.lang-et.selected").
	haveText("a.home-link", "Pealkiri").

	it ("should log in").
	click("a[href$='#settings']").
	waitSelector("a[href$='#settings'].selected").
	fill("input[name=name]", "Kala").
	click("input[type=submit]").
	click(".top__logout").
	done()
}


