

describe("ui", function() {
	var dom = require("@litejs/cli").dom
	, document = dom.document
	, xhr = require("../load.js").xhr
	, El, LiteJS, View

	it ("should import index.js", function(assert, mock) {
		mock.swap(global, {
			document: document,
			history: {},
			location: {},
			navigator: {},
			xhr: xhr
		})
		var lib = require("../index.js")
		El = lib.El
		LiteJS = lib.LiteJS
		View = lib.View
		assert.type(El, "function")
		assert.type(LiteJS, "function")
		assert.type(View, "function")
		assert.end()
	})

	it ("should parse template: {i}", [
		[ "h1",    '<h1></h1>' ],
		[ 'h2.h3 ;data-title::"Hello world"', '<h2 class="h3" data-title="Hello world"></h2>' ],
		[ 'p\n hr ;if 1', '<p><hr data-bind="if 1"></p>' ],
		[ 'p\n hr ;if 0', '<p><!--if--></p>' ],
	], function(str, html, assert, mock) {
		document.body.innerHTML = ""
		mock.swap(console, "log", mock.fn())
		xhr.load.ui(str)
		assert.equal(document.body.innerHTML, html)
		assert.end()
	})
})

