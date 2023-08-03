

describe("ui", function() {
	var El, LiteJS, View
	, fs = require("fs")
	, path = require("path")
	, cli = require("@litejs/cli")
	, xhr = global.xhr = require("../load.js").xhr
	, document = cli.dom.document
	, parser = new cli.dom.DOMParser()
	require("@litejs/cli/snapshot.js")

	it ("should import index.js", function(assert, mock) {
		mock.swap(global, {
			document: document,
			history: {},
			location: { href: "" },
			navigator: {}
		})
		var lib = require("../index.js")
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
		[ "h3 ;txt::'Hi'\ninput[type=checkbox][readonly]", '<h3>Hi</h3><input type="checkbox" readonly>' ],
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
		[ "example1.html", '<h1></h1>' ],
		[ "example2.html", '<h1></h1>' ],
	], function(fileName, html, assert, mock) {
		//mock.swap(console, "log", mock.fn())
		var newDoc = parser.parseFromString(fs.readFileSync(path.resolve("./test", fileName), "utf8"))
		, app = LiteJS()
		document.body.innerHTML = newDoc.body.innerHTML
		document.querySelectorAll("script[type=ui]").forEach(function(el) {
			var source = el.innerHTML
			//console.log(newDoc.body.childNodes[0].childNodes, source)
			El.kill(el)
			app.parse(source)
		})
		Object.keys(app.views).forEach(function(view) {
			if (view.charAt(0) === "#") return
			app.show(view)
			assert.matchSnapshot("./test/spec/" + fileName, document.body.outerHTML)
		})
		assert.end()
	})
})

