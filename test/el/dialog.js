
describe("el/dialog", function() {
	require("@litejs/cli/ui-test.js")

	it("should open simple dialog", function(assert, mock) {
		var env = initUi(mock)
		env.start(function() {
			env.openDialog("Open1")
			assert
			.hasRole("dialog")
			.hasText("[role=dialog] h1", "Hello World")
			.hasElements("[data-action]", 1)
			.hasText("[data-action]", "Close")
			.end()
		})
	})

	it("should close dialog on action click", function(assert, mock) {
		var env = initUi(mock)
		env.start(function() {
			env.openDialog("Open1")
			assert.ok(env.document.body.querySelector(".Modal"))
			var closed = false
			env.$ui.on("modalClose", function() { closed = true })
			env.clickAction("-")
			assert.ok(closed)
			assert.end()
		})
	})

	it("should open dialog with body text", function(assert, mock) {
		var env = initUi(mock)
		env.start(function() {
			env.openDialog("Open2")
			assert
			.hasText("[role=dialog] h1", "Warning")
			.hasText("[role=dialog] p", "This is the body text")
			.end()
		})
	})

	it("should show confirm dialog with multiple actions", function(assert, mock) {
		var env = initUi(mock)
		env.start(function() {
			env.openDialog("Open3")
			assert
			.hasText("[role=dialog] h1", "Delete item?")
			.hasElements("[data-action]", 2)
			.hasText('[data-action="-"]', "Cancel")
			.hasText('[data-action="del"]', "Delete")
			.end()
		})
	})

	it("should emit modal:action on confirm", function(assert, mock) {
		var env = initUi(mock)
		env.start(function() {
			env.openDialog("Open3")
			var action = null
			env.$ui.on("modal:del", function() { action = "del" })
			env.clickAction("del")
			assert.strictEqual(action, "del")
			assert.end()
		})
	})

	it("should not emit named action on cancel", function(assert, mock) {
		var env = initUi(mock)
		env.start(function() {
			env.openDialog("Open3")
			var delFired = false
			env.$ui.on("modal:del", function() { delFired = true })
			env.clickAction("-")
			assert.notOk(delFired)
			assert.end()
		})
	})

	it("should emit custom event name", function(assert, mock) {
		var env = initUi(mock)
		env.start(function() {
			env.openDialog("Open4")
			var eventFired = false
			env.$ui.on("dialog:save", function() { eventFired = true })
			assert.hasText("[role=dialog] h1", "Save changes?")
			env.clickAction("ok")
			assert.ok(eventFired)
			assert.end()
		})
	})

	it("should open dialog with input field", function(assert, mock) {
		var env = initUi(mock)
		env.start(function() {
			env.openDialog("Open5")
			assert
			.hasText("[role=dialog] h1", "Enter name")
			.hasElements("[data-action]", 2)
			.waitSelector('[name="value"]')
			.end()
		})
	})

	it("should return form value on confirm", function(assert, mock) {
		var env = initUi(mock)
		env.start(function() {
			env.openDialog("Open5")
			var result = null
			env.$ui.on("modal:ok", function(data) { result = data })
			env.document.body.querySelector('[name="value"]').value = "Test Name"
			env.clickAction("ok")
			assert.own(result, { value: "Test Name" })
			assert.end()
		})
	})

	it("should open numpad dialog", function(assert, mock) {
		var env = initUi(mock)
		env.start(function() {
			env.openDialog("Open6")
			assert
			.hasText("[role=dialog] h1", "Your code please")
			.waitSelector(".js-numpad")
			.hasElements(".js-numpad button", 12)
			.end()
		})
	})

	it("should emit modalOpen and modalClose events", function(assert, mock) {
		var env = initUi(mock)
		env.start(function() {
			var openScope = null
			, closeScope = null
			env.$ui.on("modalOpen", function(s) { openScope = s })
			env.$ui.on("modalClose", function(s) { closeScope = s })
			env.openDialog("Open1")
			assert.strictEqual(openScope.title, "Hello World")
			env.clickAction("-")
			assert.strictEqual(closeScope.title, "Hello World")
			assert.end()
		})
	})

	it("should add no-scroll on open and remove on close", function(assert, mock) {
		var env = initUi(mock)
		env.start(function() {
			var html = env.document.documentElement
			env.openDialog("Open1")
			assert.ok(/\bno-scroll\b/.test(html.className))
			env.clickAction("-")
			assert.notOk(/\bno-scroll\b/.test(html.className))
			assert.end()
		})
	})

	it("should restore focus on close", function(assert, mock) {
		var env = initUi(mock)
		env.start(function() {
			var btn = describe.getByRole("button", { name: "Open1" })[0]
			btn.focus()
			btn.click()
			env.clickAction("-")
			assert.strictEqual(env.document.activeElement, btn)
			assert.end()
		})
	})

	it("should set default Close action when no actions given", function(assert, mock) {
		var env = initUi(mock)
		env.start(function() {
			env.$ui.emit("modal", "Test Title")
			assert
			.hasText("[role=dialog] h1", "Test Title")
			.hasElements("[data-action]", 1)
			.hasText("[data-action]", "Close")
			.end()
		})
	})


	function initUi(mock) {
		var { dom, XMLHttpRequest } = require("@litejs/cli")
		, document = new dom.Document()

		XMLHttpRequest.base = "file://" + process.cwd() + "/"

		if (!global.navigator) mock.swap(global, "navigator", {})
		mock.swap(global, {
			ActiveXObject: XMLHttpRequest,
			document: document,
			history: {},
			localStorage: {},
			location: { href: "" },
			scrollTo: function() {},
		})

		mock.swap(global, { xhr: rere("../../load.js").xhr })

		var { El, LiteJS } = rere("../../ui.js")
		mock.swap(global, { El, LiteJS })
		El.append(document.documentElement, El("head"), 0)
		xhr.ui("%view public #\n.app>h1 Test")

		var $ui = LiteJS.ui = LiteJS({
			root: document.body
		})
		$ui.on("ask", function(ev, node, title, opts) {
			$ui.emit("modal", title, opts)
		})

		return {
			El: El,
			document: document,
			$ui: $ui,
			start: function(fn) {
				xhr.load(["el/dialog.ui", "test/view/dialog.ui"], function() {
					LiteJS.start()
					$ui.show("dialog")
					fn()
				})
			},
			openDialog: function(name) {
				describe.getByRole("button", { name: name })[0].click()
			},
			clickAction: function(action) {
				document.body.querySelector('[data-action="' + action + '"]').click()
			}
		}
		function rere(name) {
			delete require.cache[require.resolve(name)]
			return require(name)
		}
	}
})
