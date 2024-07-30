

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

	it ("should create app", function(assert, mock) {
		var app = LiteJS()
		assert.notStrictEqual(El.$d, app.$d)
		assert.end()
	})

	describe("i18n", function() {
		it ("should detect language", [
			[{}, [], undefined],
			[{ locales: { "et": "Eesti keeles", "fi": "Suomeksi" }}, [ "et", "fi" ], "et"],
			[{ lang: "fi", locales: { "et": "Eesti keeles", "fi": "Suomeksi" }}, [ "et", "fi" ], "fi"],
		], function(opts, locales, lang, assert) {
			document.body.$s = localStorage.lang = document.documentElement.lang = ""
			var app = LiteJS(opts)
			assert.equal(app.$d.locales, locales)
			assert.equal(app.$d.lang, lang)

			assert.end()
		})
	})

	describe("markup", function() {
		function inline(str) {
			var el = {}
			El.$b.t(el, str)
			return el.innerHTML
		}
		function doc(str) {
			var el = {}
			El.$b.d(el, str)
			return el.innerHTML
		}
		it ("resolves inline tag", function(assert) {
			var tagMap = {
				" -": "ul",
				"!": "a",
				"*": "b",
				"+": "ins",
				",": "sub",
				"-": "del",
				"/": "i",
				":": "mark",
				";": "span",
				"=": "h1",
				">": "blockquote",
				"^": "sup",
				"_": "u",
				"`": "code",
				"~": "s"
			}
			, tags = "b,ins,sub,del,s,i,mark,span,ul,a,blockquote,sup,u,code".split(",")
			, charCodes = Object.keys(tagMap).map(c=>c.charCodeAt())
			console.log("charCodes: " + charCodes)

			function getTag(op, tag) {
				return tags[(tag = op.charCodeAt())-(tag==61?0:tag>120?122:tag>93?83:tag>47?52:tag>41?42:24)] || "h" + op.length
			}

			assert.equal(Object.keys(tagMap).map(getTag), Object.values(tagMap))
			assert.end()
		})

		it ("should render inline markup: {0}", [
			[ "*Hello* world", "*Hello* world" ],
			[ "[*Hello*] [/world/]", "<b>Hello</b> <i>world</i>" ],
			[ "[~Hello~] [-world-][+moon+]", "<s>Hello</s> <del>world</del><ins>moon</ins>" ],
			[ "Hel[^lo^] wor[,ld,]", "Hel<sup>lo</sup> wor<sub>ld</sub>" ],
			[ "[:He[_[/ll/]_]o [`world`]:]", "<mark>He<u><i>ll</i></u>o <code>world</code></mark>" ],
			[ "[@2024-07-12@]", "<time datetime=\"2024-07-12\">2024-07-12</time>" ],
			[ "See [!more /wiki!]", "See <a href=\"/wiki\">more</a>" ],
			[ "Write to [![*me*] mailto:a@ex.com!]", "Write to <a href=\"mailto:a@ex.com\"><b>me</b></a>" ],
			[ "[!mailto:a@ex.com!.red]", "<a href=\"mailto:a@ex.com\" class=\"red\">a@ex.com</a>" ],
			[ "[!John Smith mailto:j@ex.co!], [!mailto:js@ex.co!], [!https://www.ee!].", "<a href=\"mailto:j@ex.co\">John Smith</a>, <a href=\"mailto:js@ex.co\">js@ex.co</a>, <a href=\"https://www.ee\">www.ee</a>." ],
		], function(str, html, assert, mock) {
			assert.equal(inline(str), html)
			assert.end()
		})

		it ("should render docs: {0}", [
			[ "= Hello\n\nworld\n\n---\n\nAnd moon.", "<h1>Hello</h1>\n<p>world</p>\n<hr>\n<p>And moon.</p>" ],
			[ "---\n\n - First\n - Second", "<hr>\n<ul><li>First</li>\n<li>Second</li></ul>" ],
			[ "> Some\n block", "<blockquote><p>Some\n<br>block</p></blockquote>" ],
			[ "> == Hi\n>\n> > Nested", "<blockquote><h2>Hi</h2>\n<blockquote><p>Nested</p></blockquote></blockquote>" ],
			[ "[!a.jpg!] Image", "<img src=\"a.jpg\" alt=\"Image\">" ],
		], function(str, html, assert, mock) {
			assert.equal(doc(str), html)
			assert.end()
		})

		it ("should parse examples: {i}", [
			[ "html/article1.text" ],
		], function(fileName, assert, mock) {
			var str = fs.readFileSync(path.resolve("./test", fileName), "utf8")
			assert.matchSnapshot("./test/spec/" + fileName, doc(str))
			assert.end()
		})
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

