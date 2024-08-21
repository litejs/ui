

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
		var app = LiteJS({
			globals: { v: "1" },
			locales: { "et": "Eesti keeles", "en": "In English" },
			en: {
				"#": {
					ordinal: "th;st;nd;rd;o[n%=100]||o[(n-20)%10]||o[0]",
					temp: "+1°C;-°C;-#°C",
					temp1: "+0,1°C;-°C;-#°C"
				},
				"*": {
					"": "n==0||n==1?n:n%10>=2&&n%10<=4&&(n%100<10||n%100>=20)?2:3",
					"file": "zero plików;1 plik;# pliki;# plików"
				},
				"~": {
					"Room #": "Tuba #"
				},
				"?": {
					They: "They;male=He;female=She"
				},
				Hello: "Hello {user.name}!",
				HelloUp: "Hello {user.name;up 3,'b'}! Welcome to {x;up;lo}{bla;up}{bla;lo}",
			},
			et: {
				Hi: "Tere"
			}
		})

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

		it ("should take translations from opts", function(assert) {
			assert.equal(app.$d.lang, "et")
			assert.equal(app.$d._("et"), "Eesti keeles")
			assert.equal(app.$d._("en"), "In English")
			assert.equal(app.$d._("Hi"), "Tere")
			assert.equal(app.$d._("v"), "1")
			app.globals.v = "2"
			assert.equal(app.$d._("v"), "2")
			app.lang("en")
			assert.equal(app.$d._("et"), "Eesti keeles")
			assert.equal(app.$d._("en"), "In English")
			assert.equal(app.$d._("Hi"), "Hi")
			assert.equal(app.$d._("v"), "2")
			assert.end()
		})

		it ("should format", function(assert) {
			var _ = app.$d._
			assert.equal(_(null), "")
			assert.equal(_("Hello", {user: {name: "World"}}), "Hello World!")
			assert.end()
		})
		it ("should format extensions", function(assert) {
			var _ = app.$d._
			assert.equal(_("HelloUp", {user: {name: "World"}, x:"here"}), "Hello WORLD! Welcome to here")
			assert.equal(_(".{name;~},", {name: "Room 1"}), ".Tuba 1,")
			assert.equal(_("{1;*file} {2;*file}"), "1 plik 2 pliki")
			assert.equal(_("{sex;?They} was", {sex:"male"}), "He was")
			assert.equal(_("{col;?;is-red?is-green?}", {col:"is-green"}), "is-green")
			assert.equal(_("{a;map:'{$}',', ',', and '}", {a: {a:"Key", b:"Foo", c:"Bar"}}), "Key, Foo, and Bar")

			assert.end()
		})
		it ("should format numbers", function(assert) {
			var _ = app.$d._
			var num = app.$d._.ext.num
			assert.equal(
				_("{p;#temp} {p;#temp1} {u;#temp} {n;#temp} {n;#temp1}", {p: 12.35, n: -12.35}),
				"+12°C +12,4°C -°C -12°C -12,4°C"
			)
			assert.equal(
				_("{a;#5} {b;#5} {c;#5} {d;#5} {e;#5} {f;#5}", {a: 6, b: 4, c: 1, d: -1, e: -4, f: -6}),
				"5 5 0 0 -5 -5"
			)
			assert.equal(
				_("{a;#1} {b;#1} {a;#1;-} {b;#1;-} {a;#1;;;;∞} {b;#1;;;;;-lot's} {c;#1;;;ZERO}", {a: Infinity, b: -Infinity, c: 0}),
				"- - - - ∞ -lot's ZERO"
			)
			assert.equal(_("{.34;#,###.05}"), ".35")

			assert.equal(num(12, "temp"), "+12°C")
			assert.equal(num(0, "#.01"), ".00")
			assert.equal(num(0.00000000000000001, "#.01"), ".00")
			assert.equal(num(-0.00000000000000001, "#.01"), ".00")
			assert.equal(num(9007199254740990, "#.01"), "9007199254740990.00")
			assert.equal(num(-9007199254740990, "#.01"), "-9007199254740990.00")
			assert.equal(num(0, "#.01;-"), ".00")
			assert.equal(num(NaN, "#.05"), "-")
			assert.equal(num(NaN, "#.05;𝄪"), "𝄪")
			assert.equal(num(null, "#.05"), "-")
			assert.equal(num(null, "#.05;⚠"), "⚠")
			assert.equal(num(void 0, "#.05"), "-")
			assert.equal(num(void 0, "#.05;-"), "-")
			assert.equal(num(.34, "#,###.05"), ".35")
			assert.equal(num(.34, "+1"), "+0")
			assert.equal(num(.34, "1+"), "0+")
			assert.equal(num(1.34, "+1"), "+1")
			assert.equal(num(-1.34, "+1"), "-1")
			assert.equal(num(-1.34, "1+;;#-"), "1-")
			assert.equal(num(1234.34,  "$ #,###.05 ;;($#)"), "$ 1,234.35 ")
			assert.equal(num(-1234.34, "$ #,###.05 ;;($#)"), "($1,234.35)")
			assert.equal(num(-1234.34, "#,###.05 ;;(#)"), "(1,234.35)")
			assert.equal(num(-1234.34, "#,###.05 ;;#-"), "1,234.35-")
			assert.equal(num(.34, "#,###.05 ;;(#)"), ".35 ")
			assert.equal(num(.36, "#,##0.05"), "0.35")
			assert.equal(num(.31, "#,#00.05"), "00.30")
			assert.equal(num(1.005, "0.01"), "1.01")
			// roundPoint
			assert.equal(num(1.005, "0.01;;;;;;.1"), "1.00")
			assert.equal(num(1.005, "0.01;;;;;;.5"), "1.01")
			assert.equal(num(1.005, "0.01;;;;;;1"), "1.01")
			assert.equal(num(1.005, "#.01"), "1.01")
			assert.equal(num(9, "#10"), "10")
			assert.equal(num(-9, "#10"), "-10")
			assert.equal(num(30000.65, "# ##0,01"), "30 000,65")
			assert.equal(num(9007199254740990, "# ##1"), "9 007 199 254 740 990")
			assert.equal(num(123567890, "#,###,##,##2"), "1,235,67,890")
			assert.equal(num(123567890, "#,####,###1"), "1,2356,7890")
			assert.equal(num(123567890, "#,###_##'##2.00"), "1,235_67'890.00")
			assert.equal(num(23567890, "#,###,##,##2.00"), "235,67,890.00")
			assert.equal(num(3567890, "#,###,##,##2.00"), "35,67,890.00")
			assert.equal(num(567890, "#,###,##,##2.00"), "5,67,890.00")
			assert.equal(num(67890, "#,###,##,##2.00"), "67,890.00")
			assert.equal(num(7890, "#,###,##,##2.00"), "7,890.00")
			assert.equal(num(890, "#,###,##,##2.00"), "890.00")
			assert.equal(num(90, "#,###,##,##2.00"), "90.00")

			assert.equal(num(1235.123, "00,005.00"), "01,235.00")
			assert.end()
		})
		it("should format fractions", function(assert) {
			var num = app.$d._.ext.num
			assert
			.equal(num(.70, "#.25"), ".75")
			.equal(num(.10, "#/4"), "0")
			.equal(num(.20, "#/4"), "¼")
			.equal(num(.20, "0/4"), "0¼")
			.equal(num(.30, "#/4"), "¼")
			.equal(num(.40, "#/4"), "½")
			.equal(num(.50, "#/4"), "½")
			.equal(num(.60, "#/4"), "½")
			.equal(num(.70, "#/4"), "¾")
			.equal(num(.80, "#/4"), "¾")
			.equal(num(.90, "#/4"), "1")
			.equal(num(1.0, "#/4"), "1")
			.equal(num(1.1, "#/4"), "1")
			.equal(num(1.2, "#/4"), "1¼")
			.equal(num(.70, "#/8", 1), "¾")

			.equal(num(1.05, "#/5"), "1")
			.equal(num(1.15, "#/5"), "1⅕")
			.equal(num(1.25, "#/5"), "1⅕")
			.equal(num(1.4,  "#/5"), "1⅖")
			.equal(num(1.6,  "#/5"), "1⅗")
			.equal(num(1.8,  "#/5"), "1⅘")

			assert.end()
		})
		it("should format abbreviations", function(assert) {
			var d = {
				a: 1, b: 12, c: 123, d: 1234, e: 12345, f: 123456,
				g: 1.2, h: 1.23, i: 1.234, j: 12.3456, k: 0.123456, l: 0.0123456
			}
			var i18n = app.$d._
			assert
			.equal(i18n("{a;#1a} {b;#1a} {c;#1a} {d;#1a} {e;#1a} {f;#1a}", d), "1 12 123 1k 12k 123k")
			.equal(i18n("{g;#1a} {h;#1a} {i;#1a} {j;#1a} {k;#1a} {l;#1a}", d), "1 1 1 12 0 0")

			.equal(i18n("{a;#0,1a} {b;#0,1a} {c;#0,1a} {d;#0,1a} {e;#0,1a} {f;#0,1a}", d), "1,0 12,0 123,0 1,2k 12,3k 123,5k")
			.equal(i18n("{g;#0.1a} {h;#0.1a} {i;#0.1a} {j;#0.1a} {k;#0.1a} {l;#0.1a}", d), "1.2 1.2 1.2 12.3 0.1 0.0")

			.equal(i18n("{a;#0,01a} {b;#0,01a} {c;#0,01a} {d;#0,01a} {e;#0,01a} {f;#0,01a}", d), "1,00 12,00 123,00 1,23k 12,35k 123,46k")
			.equal(i18n("{g;#0.01a} {h;#0.01a} {i;#0.01a} {j;#0.01a} {k;#0.01a} {l;#0.01a}", d), "1.20 1.23 1.23 12.35 0.12 0.01")

			.equal(i18n("{a;#1a1} {b;#1a1} {c;#1a1} {d;#1a1} {e;#1a1} {f;#1a1}", d), "1 10 100 1k 10k 100k")
			.equal(i18n("{a;#1a2} {b;#1a2} {c;#1a2} {d;#1a2} {e;#1a2} {f;#1a2}", d), "1 12 120 1k 12k 120k")
			.equal(i18n("{a;#1a3} {b;#1a3} {c;#1a3} {d;#1a3} {e;#1a3} {f;#1a3}", d), "1 12 123 1k 12k 123k")
			.equal(i18n("{a;#1a4} {b;#1a4} {c;#1a4} {d;#1a4} {e;#1a4} {f;#1a4}", d), "1 12 123 1k 12k 123k")
			.equal(i18n("{a;#1a5} {b;#1a5} {c;#1a5} {d;#1a5} {e;#1a5} {f;#1a5}", d), "1 12 123 1k 12k 123k")

			.equal(i18n("{a;#0,1a3} {b;#0,1a3} {c;#0,1a3} {d;#0,1a3} {e;#0,1a3} {f;#0,1a3}", d), "1 12 123 1,2k 12,3k 124k")
			.equal(i18n("{a;#0,1a4} {b;#0,1a4} {c;#0,1a4} {d;#0,1a4} {e;#0,1a4} {f;#0,1a4}", d), "1 12 123 1,2k 12,3k 123,5k")
			.equal(i18n("{a;#0,1a5} {b;#0,1a5} {c;#0,1a5} {d;#0,1a5} {e;#0,1a5} {f;#0,1a5}", d), "1 12 123 1,2k 12,3k 123,5k")

			.equal(i18n("{a;#0,01a4} {b;#0,01a4} {c;#0,01a4} {d;#0,01a4} {e;#0,01a4} {f;#0,01a4}", d), "1 12 123 1,23k 12,35k 123,5k")
			.equal(i18n("{g;#0,01a4} {h;#0,01a4} {i;#0,01a4} {j;#0,01a4} {k;#0,01a4} {l;#0,01a4}", d), "1,2 1,23 1,23 12,35 0,12 0,01")

			assert.end()
		})
		it("should format ordinal", function(assert) {
			function assertOrdinal(i) {
				assert.equal(app.$d._.ext.num(parseInt(i), "1o"), i)
			}

			app.lang("et", {
				"#": {
					ordinal: ".;o[0]",
				}
			})
			;[ "0.", "1.", "2.", "3.", "101."].forEach(assertOrdinal)

			app.lang("en")
			;[
				"0th", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th",
				"10th", "11th", "12th", "13th", "14th", "15th", "16th", "17th", "18th", "19th",
				"20th", "21st", "22nd", "23rd", "24th", "25th", "26th", "27th", "28th", "29th",
				"90th", "91st", "92nd", "93rd", "94th", "95th", "96th", "97th", "98th", "99th",
				"100th", "101st", "102nd", "103rd", "104th", "105th", "106th", "107th", "108th", "109th",
				"110th", "111th", "112th", "113th", "114th"
			].forEach(assertOrdinal)

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

