

function test() {
	describe.it.viewOpen = function(actual, expected, options) {
		var el
		, self = this
		, count = 10
		, resume = this.wait()
		this.ok(function(){return!!el}, options || "Expected: View "+actual+" should be open")
		function test() {
			el = View(actual).open
			if (!el && count--) return setTimeout(test, 50)
			resume()
		}
		test()
		return this
	}
	describe.it.waitSelector = function(actual, expected, options) {
		var el
		, self = this
		, count = 10
		, resume = this.wait()
		this.ok(function(){return!!el}, options || "Expected: selector "+actual+" should be in dom")
		function test() {
			el = document.body.find(actual)
			if (!el && count--) return setTimeout(test, 50)
			resume()
		}
		test()
		return this
	}
	describe.it.haveText = function(actual, expected, options) {
		var el, text
		, self = this
		, count = 10
		, resume = this.wait()
		this.ok(function(){return text == expected}, options || "Expected: text should be: " + expected)
		function test() {
			el = document.body.find(actual)
			if (!el && count--) return setTimeout(test, 50)
			text = el.txt()
			resume()
		}
		test()
		return this
	}
	describe.it.fill = function(actual, expected, options) {
		var el, text
		, self = this
		, count = 10
		, resume = this.wait()
		this.ok(function(){return!!el}, options || "Expected: value should be: " + expected)
		function test() {
			el = document.body.find(actual)
			if (!el && count--) return setTimeout(test, 50)
			if (el) el.val(expected)
			resume()
		}
		test()
		return this
	}
	describe.it.click = function(actual, expected, options) {
		var el = document.body.find(actual)
		this.ok(!!el, options || "Expected: click target "+actual+" should be in dom")
		var attr = {
			pointerX: 0,
			pointerY: 0,
			button: 0,
			ctrlKey: false,
			altKey: false,
			shiftKey: false,
			metaKey: false,
			bubbles: true,
			cancelable: true
		}
		if (el) {
			if (el.fireEvent) {
				el.fireEvent("onclick")
			} else {
				var ev = document.createEvent("MouseEvents")
				ev.initMouseEvent("click", true, true, document.defaultView,
					attr.button, attr.pointerX, attr.pointerY, attr.pointerX, attr.pointerY,
					attr.ctrlKey, attr.altKey, attr.shiftKey, attr.metaKey, attr.button, el)
				el.dispatchEvent(ev)
			}
		}
		return this
	}

	describe("Example UI").
	it ("should navigate").
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

	click("a[href$='#home']").
	waitSelector("a[href$='#home'].selected").
	viewOpen("home").

	it ("should change language").
	click("a.lang-en").
	waitSelector("a.lang-en.selected").
	haveText("h1", "Header").

	click("a.lang-et").
	waitSelector("a.lang-et.selected").
	haveText("h1", "Pealkiri").

	it ("should log in").
	click("a[href$='#settings']").
	waitSelector("a[href$='#settings'].selected").
	fill("input[name=name]", "Kala").
	click("input[type=submit]").
	waitSelector(".top__logout").
	done()
}


