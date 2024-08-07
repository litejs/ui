

describe("ui", function() {
	var El, LiteJS, View
	, fs = require("fs")
	, path = require("path")
	, dom = require("@litejs/dom")
	, document = dom.document
	, localStorage = {}
	, parser = new dom.DOMParser()
	require("@litejs/cli/snapshot.js")
	global.xhr = require("../load.js").xhr

	it ("should import index.js", function(assert, mock) {
		mock.swap(global, {
			document: document,
			history: {},
			localStorage,
			location: { href: "" }
		})
		if (!global.navigator) mock.swap(global, "navigator", {})
		var lib = require("..")
		El = lib.El
		LiteJS = lib.LiteJS
		View = lib.View
		assert.type(El, "function")
		assert.type(LiteJS, "function")
		assert.end()
	})

	it ("should parse elements: {i}", [
		[ "h1", '<h1></h1>' ],
		[ "h2[a][b-c]", '<h2 a="a" b-c="b-c"></h2>' ],
		[ '#h3.h4[title=Hello][title~="World !"]', '<div id="h3" class="h4" title="Hello World !"></div>' ],
		[ 'a[href=about][href^="#"]\na[href=about][href$=".html"]', '<a href="#about"></a><a href="about.html"></a>'],
		[ "h3 ;txt:'Hi'\ninput[type=checkbox][readonly]", '<h3>Hi</h3><input type="checkbox" readonly>' ],
		[ 'p[title="a b"]\n hr ;if 1', '<p title="a b"><hr></p>' ],
		[ 'p ;css "top,left", "0px"\n hr ;if 0', '<p style="top:0px;left:0px"><!--if--></p>' ],
	], function(str, html, assert, mock) {
		document.body.innerHTML = ""
		mock.swap(console, "log", mock.fn())
		xhr.ui(str)
		LiteJS.start()
		assert.equal(document.body.innerHTML, html)
		assert.end()
	})

	it ("should parse examples: {i}", [
		[ "html/simplest.html", '<h1></h1>', 1 ],
		[ "html/routed.html", '<h1></h1>', 0 ],
	], function(fileName, html, logCount, assert, mock) {
		mock.swap(console, "log", mock.fn())
		var newDoc = parser.parseFromString(fs.readFileSync(path.resolve("./test", fileName), "utf8"))
		, app = LiteJS({ root: newDoc.body })
		newDoc.querySelectorAll("script[type=ui]").forEach(function(el) {
			var source = el.innerHTML
			//console.log(newDoc.body.childNodes[0].childNodes, source)
			El.kill(el)
			app.parse(source)
		})
		Object.keys(app.views).forEach(function(view) {
			if (view.charAt(0) === "#") return
			app.show(view)
			assert.matchSnapshot("./test/spec/" + fileName, newDoc.body.outerHTML)
		})
		assert.equal(console.log.called, logCount)
		assert.end()
	})
})

