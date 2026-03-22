

describe("ui", function() {
	var El, LiteJS, View
	, fs = require("fs")
	, path = require("path")
	, dom = require("@litejs/cli").dom
	, document = dom.document
	, localStorage = {}
	, parser = new dom.DOMParser()
	require("@litejs/cli/snapshot.js")
	dom.HTMLElement.prototype.addEventListener = dom.HTMLElement.prototype.removeEventListener = function() {}
	global.scrollTo = function() {}
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

	describe("El", function() {
		var app = LiteJS({
			root: document.body
		})
		xhr.ui('input.in1')
		LiteJS.start()
		function before(newEl, nextSib) {
			nextSib.parentNode.insertBefore(newEl, nextSib)
		}

		test ("blur", function(assert) {
			var input = app.$(".in1")
			assert.ok(input.tagName, "INPUT")
			input.focus()
			assert.strictEqual(document.activeElement, input)
			El.blur()
			assert.equal(document.activeElement, document.body)
			assert.end()
		})

		test("acceptMany with whitespace", function(assert) {
			var el = document.createElement("div")
			El.cls(el, "a b")
			assert.equal(el.className, "a b")

			El.cls(el, " c")
			assert.equal(el.className, "a b c")

			El.cls(el, "d ")
			assert.equal(el.className, "a b c d")
			assert.end()
		})

		test("cls add, remove, and duplicates", function(assert) {
			var el = document.createElement("div")

			// Add class
			El.cls(el, "a")
			assert.equal(el.className, "a")

			// Duplicate add is a no-op
			El.cls(el, "a")
			assert.equal(el.className, "a")

			// Add second class
			El.cls(el, "b")
			assert.equal(el.className, "a b")

			// Remove class
			El.cls(el, "a", 0)
			assert.equal(el.className, "b")

			// Remove non-existent class is a no-op
			El.cls(el, "z", 0)
			assert.equal(el.className, "b")

			// Remove last class
			El.cls(el, "b", false)
			assert.equal(el.className, "")

			// Falsy el does not throw
			El.cls(null, "x")
			assert.end()
		})

		test("cls transfer", function(assert) {
			var a = document.createElement("div")
			, b = document.createElement("div")
			El.cls(a, "x")
			assert.equal(a.className, "x")

			// Transfer: add to b, remove from a
			El.cls(b, "x", a)
			assert.equal(b.className, "x")
			assert.equal(a.className, "")

			// Transfer to self is a no-op (set !== el guard)
			El.cls(b, "x", b)
			assert.equal(b.className, "x")

			// Transfer from node without the class
			El.cls(a, "y", b)
			assert.equal(a.className, "y")
			assert.equal(b.className, "x")
			assert.end()
		})

		test("step", function(assert) {
			assert.equal(El.step(7, 5), "5")
			assert.equal(El.step(8, 5), "10")
			assert.equal(El.step(-7, 5), "-5")
			assert.equal(El.step(7, 0.5), "7.0")
			assert.equal(El.step(7, 5, 1), "10")
			assert.equal(El.step(5, 5, 1), "5")
			assert.end()
		})

		test("stop", function(assert) {
			var stopped = false, prevented = false
			var result = El.stop({
				stopPropagation: function() { stopped = true },
				preventDefault: function() { prevented = true }
			})
			assert.ok(stopped)
			assert.ok(prevented)
			assert.strictEqual(result, false)
			assert.strictEqual(El.stop(null), false)
			assert.end()
		})

		test("hasClass", function(assert) {
			var el = document.createElement("div")
			el.className = "foo bar baz"
			assert.ok(El.hasClass(el, "foo"))
			assert.ok(El.hasClass(el, "bar"))
			assert.notOk(El.hasClass(el, "fo"))
			assert.notOk(El.hasClass(el, ""))
			assert.end()
		})

		test("closest and matches", function(assert) {
			var el = document.createElement("div")
			el.innerHTML = "<ul><li><a>hi</a></li></ul>"
			var a = el.querySelector("a")
			assert.ok(El.matches(a, "a"))
			assert.notOk(El.matches(null, "a"))
			assert.equal(El.closest(a, "ul").tagName, "UL")
			assert.equal(El.closest(null, "ul"), null)
			assert.equal(El.nearest(el, "a").tagName, "A")
			assert.equal(El.nearest(null, "a"), null)
			assert.end()
		})

		test("kill event", function(assert) {
			var el = document.createElement("div")
			document.body.appendChild(el)
			var killed = false
			El.on(el, "kill", function() { killed = true })
			El.kill(el)
			assert.ok(killed)
			assert.end()
		})

		test("set with object", function(assert) {
			var el = document.createElement("div")
			El.set(el, { "data-a": "1", "data-b": "2" })
			assert.equal(El.get(el, "data-a"), "1")
			assert.equal(El.get(el, "data-b"), "2")
			assert.end()
		})

		test("val", function(assert) {
			var input = document.createElement("input")
			input.type = "text"
			input.value = "hello"
			assert.equal(El.val(input), "hello")
			El.val(input, "world")
			assert.equal(input.value, "world")

			// unchecked checkbox returns null
			var cb = document.createElement("input")
			cb.type = "checkbox"
			cb.value = "on"
			assert.equal(El.val(cb), null)

			// checked checkbox returns value
			var cb2 = document.createElement("input")
			cb2.type = "checkbox"
			cb2.value = "on"
			cb2.checked = true
			assert.equal(El.val(cb2), "on")

			// unchecked radio returns undefined
			var radio = document.createElement("input")
			radio.type = "radio"
			assert.equal(El.val(radio), undefined)

			assert.equal(El.val(null), undefined)

			assert.end()
		})
	})

	describe("i18n", function() {
		var app = LiteJS({
			globals: { v: "1" },
			locales: { en: "In English", et: "Eesti keeles", pl: "", uk: "" },
			en: {
				"#": {
					ordinal: "th;st;nd;rd;o[n%=100]||o[(n-20)%10]||o[0]",
					temp: "+1°C;-°C;-#°C",
					temp1: "+0,1°C;-°C;-#°C"
				},
				"~": {
					"room #": "tuba #"
				},
				"?": {
					They: "They;male=He;female=She",
					relTime: "a few seconds;45=a minute;90="
				},
				hello: "hello {user.name}!",
				HelloUp: "Hello {user.name;up 3,'b'}! Welcome to {x;up;lo}{bla;up}{bla;lo}",
			},
			uk: {},
			et: {
				"@": {
					"": "P E T K N R L pühapäev esmaspäev teisipäev kolmapäev neljapäev reede laupäev jaan veeb märts apr mai juuni juuli aug sept okt nov dets jaanuar veebruar märts aprill mai juuni juuli august september oktoober november detsember".split(" "),
					am: "AM",
					pm: "PM",
					LT:    "HH:mm",
					LTS:   "HH:mm:ss",
					LD:    "DD.MM.Y",
					LDD:   "D MMMM Y",
					LDDT:  "D MMMM Y HH:mm",
					LDDDT: "ddd, D MMMM Y HH:mm"
				},
				Hi: "Tere"
			}
		})

		it ("should detect language", [
			[{}, ["en"], "en"],
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
			// In node22 there is node.language defined.
			// Prior this the first language is taken
			assert.equal(app.$d.lang, "en")
			assert.equal(app.$d._("et"), "Eesti keeles")
			assert.equal(app.$d._("en"), "In English")
			assert.equal(app.$d._("Hi"), "Hi")
			assert.equal(app.$d._("v"), "1")
			app.globals.v = "2"
			assert.equal(app.$d._("v"), "2")
			app.lang("et")
			assert.equal(app.$d._("et"), "Eesti keeles")
			assert.equal(app.$d._("en"), "In English")
			assert.equal(app.$d._("Hi"), "Tere")
			assert.equal(app.$d._("v"), "2")
			assert.end()
		})

		it ("should format", function(assert) {
			app.lang("en")
			var _ = app.$d._
			assert.equal(_(null), "")
			assert.equal(_("Hi"), "Hi")
			assert.equal(_("Hi."), "Hi.")
			assert.equal(_("Hi.ho"), "Hi.ho")
			assert.equal(_(".ho"), ".ho")
			assert.equal(_("hello", {user: {name: "World"}}), "hello World!")
			assert.equal(_("Hello", {user: {name: "World"}}), "Hello World!")
			assert.end()
		})
		describe("extensions", function() {
			var _ = app.$d._
			test("pick", function(assert) {
				var pick = _.ext.pick
				assert
				.equal(pick(11, "low;30=med;60="), "low")
				.equal(pick(31, "low,30=med,60="), "med")
				.equal(pick(60, "low,30,med,60,,"), "")
				.equal(pick(61, "low;30=med;60="), "")
				.equal(pick(62, "low;30=med;60"), "")
				.equal(pick("", "low;30=med;;"), "low")
				.equal(pick(null, "low;30=med;;"), "low")
				.equal(pick(undefined, "low;30=med;;"), "low")
				.equal(pick("male", "They;male=He;female=She"), "He")
				.equal(pick("other", "They;male=He;female=She"), "They")
				// shorthand
				.equal(pick("is-green", "na;is-red?is-green?"), "is-green")
				assert.equal(_("{sex;?They} was", {sex:"male"}), "He was")
				assert.equal(_("{col;?;is-red?is-green?}", {col:"is-green"}), "is-green")
				assert.end()
			})
			test("pattern", function(assert) {
				var _ = app.lang("en")
				var pattern = _.ext.pattern
				assert
				.equal(pattern("room 01"), "tuba 01")
				.equal(pattern("Room 12"), "Tuba 12")
				.equal(pattern("ROOM 0.1"), "TUBA 0.1")
				.equal(pattern("Room #"), "Room #")
				.equal(pattern("House 1"), "House 1")
				assert.equal(_("A {name;~}", {name: "Room 13"}), "A Tuba 13")
				assert.equal(_("A {name;~}", {name: "Room 1"}), "A Tuba 1")
				assert.end()
			})
			test("plural", function(assert) {
				var _ = app.lang("en", {})
				assert.equal(_("{1;*file} {2;*file}"), "1 file 2 file")
				_ = app.lang("pl", {
					"*": {
						"": "n==0||n==1?n:n%10>=2&&n%10<=4&&(n%100<10||n%100>=20)?2:3",
						book: "Zero książek;Jedna książka;# książki;# książek",
						file: "zero plików;1 plik;# pliki;# plików"
					},
				})
				assert
				.equal(_.ext.plural(1, "file"), "1 plik")
				.equal(_.ext.plural(2, "file"), "2 pliki")
				.equal(_.ext.plural(4, "file"), "4 pliki")
				.equal(_.ext.plural(5, "file"), "5 plików")
				assert.equal(_("{1;*file} {2;*file}"), "1 plik 2 pliki")
				assert.equal(_("{1;*book} {2;*book} {5;*book} {22;*book}"), "Jedna książka 2 książki 5 książek 22 książki")
				_ = app.lang("uk", {
					"*": {
						"": "n%1?3:n%10==1&&n%100!=11?0:n%10>=2&&n%10<=4&&(n%100<10||n%100>=20)?1:2",
						day: "1 день;# дні;# днів;# дня"
					},
				})
				assert.equal(_("{1;*day} {2;*day} {5;*day} {1.3;*day} {2.3;*day} {5.3;*day}"), "1 день 2 дні 5 днів 1.3 дня 2.3 дня 5.3 дня")

				assert.end()
			})
			test("extensions", function(assert) {
				var _ = app.lang("en")
				assert.equal(_("HelloUp", {user: {name: "World"}, x:"here"}), "Hello WORLD! Welcome to here")
				assert.equal(_("{a;map:'{n}'}", {a: [{n:'a'},{n:'b'},{n:'c'}]}), "a, b, c")
				assert.equal(_("{a;map:'{$}',', ',', and '}", {a: {a:"Key", b:"Foo", c:"Bar"}}), "Key, Foo, and Bar")

				assert.end()
			})
		})
		it("should format date", function(assert) {
			// {start;date:'Y-MM-dd'}
			// {start;@lt}

			var _ = app.lang("et", {})

			var date = _.ext.date

			var d2n = 1234567890123
			, d2d = new Date(d2n)
			, d2s = "" + 1234567890123
			, d1 = new Date(Date.UTC(1,1,3,4,5,6,7))

			d1.setUTCFullYear(1)


			assert
			.equal( date(d1, "YY-MM-DD Y/M/D"), "01-02-03 1/2/3" )

			// Pattern	Result (in a particular locale)
			// EEE, MMM d, ''yY	Wed, July 10, '96
			// h:mm a	12:08 PM
			// hh 'o''clock' a, zzzz	12 o'clock PM, Pacific Daylight Time
			// K:mm a, z	0:00 PM, PST

			assert.equal( date(d1, "h 'o''clock' a"), "5 o'clock AM" )
			assert.equal( date(d1, "Y YY"), "1 01" )
			assert.equal( date(d1, "M MM MMM MMMM"), "2 02 veeb veebruar" )
			assert.equal( date(d1, "D DD"), "3 03" )
			assert.equal( date(d1, "d dd ddd"), "6 L laupäev" )
			assert.equal( date(d2d, "u U"), "1234567890 1234567890123" )
			assert.equal( date(d2d, "Q Z ZZ"), "1 +02:00 +0200" )
			assert.equal( date(d2d, "SS"), "123" )


			assert.equal( date("2009-02-13T23:31:30Z"), "2009-02-13T23:31:30Z" )
			assert.equal( date("2009-02-15T23:31:30Z", "d dd ddd"), "1 E esmaspäev" )
			assert.equal( date("2009-02-16T23:31:30Z", "d dd ddd"), "2 T teisipäev" )
			assert.equal( date("2009-02-17T23:31:30Z", "d dd ddd"), "3 K kolmapäev" )
			assert.equal( date("2009-02-18T23:31:30Z", "d dd ddd"), "4 N neljapäev" )
			assert.equal( date("2009-02-19T23:31:30Z", "d dd ddd"), "5 R reede" )
			assert.equal( date("2009-02-20T23:31:30Z", "d dd ddd"), "6 L laupäev" )
			assert.equal( date("2009-02-21T23:31:30Z", "d dd ddd"), "7 P pühapäev" )

			assert.equal( date(d2n), "2009-02-13T23:31:30Z" )
			assert.equal( date(d2d), "2009-02-13T23:31:30Z" )
			assert.equal( date(d2s), "2009-02-13T23:31:30Z" )
			assert.equal( date(d2s, "LT"), "01:31" )
			assert.equal( _("{at;@LT}", {at: d2s}), "01:31" )

			assert.equal( date(d2s, "LT", 3), "02:31" )
			Date._tz = 4
			assert.equal( date(d2s, "HH:mm\n"), "03:31\n" )
			Date._tz = void 0
			assert.equal( date(NaN, "LT"), "Invalid Date" )

			// should format ISO 8601 week numbers in local time
			var key, map = {
				"2005-01-01T01:02": "2004-W53-6 1:2",
				"2005-01-02T01:02": "2004-W53-7 1:2",
				"2005-12-31T01:02": "2005-W52-6 1:2",
				"2007-01-01T01:02": "2007-W01-1 1:2",
				"2007-12-30T01:02": "2007-W52-7 1:2",
				"2007-12-31T01:02": "2008-W01-1 1:2",
				"2008-01-01T01:02": "2008-W01-2 1:2",
				"2008-12-28T01:02": "2008-W52-7 1:2",
				"2008-12-29T01:02": "2009-W01-1 1:2",
				"2008-12-30T01:02": "2009-W01-2 1:2",
				"2008-12-31T01:02": "2009-W01-3 1:2",
				"2009-01-01T01:02": "2009-W01-4 1:2",
				"2009-12-31T01:02": "2009-W53-4 1:2",
				"2010-01-01T01:02": "2009-W53-5 1:2",
				"2010-01-02T01:02": "2009-W53-6 1:2",
				"2010-01-03T01:02": "2009-W53-7 1:2"
			}
			for (key in map) assert.equal( date(key, "o-'W'ww-d h:m"), map[key] )

			app.lang("en", {})
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
				_("{a;#1} {b;#1} {a;#1;-} {b;#1;-} {a;#1;;;;∞} {b;#1;;;;;-lots} {c;#1;;;ZERO}", {a: Infinity, b: -Infinity, c: 0}),
				"- - - - ∞ -lots ZERO"
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
			// 1ˢᵗ, 2ⁿᵈ, 3ʳᵈ, 4ᵗʰ .. 4º" or 4ª
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
		it("should get from objects", function(assert) {
			var user = {
				name: "Hi",
				age: 25
			}
			var get = app.$d._.g
			assert.equal(get(user, "name"), "Hi")
			assert.equal(get(user, "name;up"), "HI")
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

		it ("should render inline markup: {0}", [
			[ "*Hello* world", "*Hello* world" ],
			[ 'According to X, ["Firefox 1.0 was released in 2004"]', "According to X, <q>Firefox 1.0 was released in 2004</q>" ],
			[ 'According to X, [https://mozilla.org/history/ "Firefox 1.0 was released in 2004"]', "According to X, <q cite=\"https://mozilla.org/history/\">Firefox 1.0 was released in 2004</q>" ],
			[ "Please press [&Ctrl&] + [&R&]", "Please press <kbd>Ctrl</kbd> + <kbd>R</kbd>"],
			[ "[*Hello*] [%tiny%] [/world/]", "<b>Hello</b> <small>tiny</small> <i>world</i>" ],
			[ "[~Hello~] [-world-][+moon+]", "<s>Hello</s> <del>world</del><ins>moon</ins>" ],
			[ "Hel[^lo^] wor[,ld,]", "Hel<sup>lo</sup> wor<sub>ld</sub>" ],
			[ "[:He[_[/ll/]_]o [`world`]:]", "<mark>He<u><i>ll</i></u>o <code>world</code></mark>" ],
			[ "[tooltip *bold*]", "<b title=\"tooltip\">bold</b>" ],
			[ "[@2024-07-12@]", "<time datetime=\"2024-07-12\">2024-07-12</time>" ],
			[ "[birthday @2020-10-27@]", "<time datetime=\"2020-10-27\">birthday</time>" ],
			[ "See [more </wiki>]", "See <a href=\"/wiki\">more</a>" ],
			[ "Write to [[*me*] <mailto:a@ex.com>]", "Write to <a href=\"mailto:a@ex.com\"><b>me</b></a>" ],
			[ "[<mailto:a@ex.com>.red]", "<a href=\"mailto:a@ex.com\" class=\"red\">mailto:a@ex.com</a>" ],
			[ "[John Smith <mailto:j@ex.co>], [<mailto:js@ex.co>], [<https://www.ee>].", "<a href=\"mailto:j@ex.co\">John Smith</a>, <a href=\"mailto:js@ex.co\">mailto:js@ex.co</a>, <a href=\"https://www.ee\">https://www.ee</a>." ],
			[ "[HyperText Markup Language ?HTML?]", "<abbr title=\"HyperText Markup Language\">HTML</abbr>" ],
			[ "[Cascading Style Sheets ?CSS?.tip]", "<abbr class=\"tip\" title=\"Cascading Style Sheets\">CSS</abbr>" ],
			[ "[?HTML?]", "<abbr title=\"HyperText Markup Language\">HTML</abbr>" ],
			[ "[?CSS?]", "<abbr title=\"Cascading Style Sheets\">CSS</abbr>" ],
			[ "[;hello;]", "<span>hello</span>" ],
			[ "[*bold*.red]", "<b class=\"red\">bold</b>" ],
			[ "[<https://example.com>]", "<a href=\"https://example.com\">https://example.com</a>" ],
			[ "[[*link*] <https://x.com>]", "<a href=\"https://x.com\"><b>link</b></a>" ],
			[ "[text <u\"r>]", "<a href=\"u&quot;r\">text</a>" ],
			[ "[a\"b *bold*]", "<b title=\"a&quot;b\">bold</b>" ],
			[ "[a\"b ?X?]", "<abbr title=\"a&quot;b\">X</abbr>" ],
			[ "[!photo.jpg!]", "<img src=\"photo.jpg\" alt=\"photo.jpg\">" ],
			[ "[sunset !photo.jpg!.right]", "<img src=\"photo.jpg\" alt=\"sunset\" class=\"right\">" ],
			[ "[!youtube:dQw4w9!]", "<iframe src=\"https://youtube.com/embed/dQw4w9\"></iframe>" ],
			[ "[my video !youtube:dQw4w9!]", "<iframe src=\"https://youtube.com/embed/dQw4w9\" title=\"my video\"></iframe>" ],
			[ "[!unknown:foo!]", "<img src=\"unknown:foo\" alt=\"unknown:foo\">" ],
		], function(str, html, assert, mock) {
			El.$b.d.embed.youtube = function(id, text, extra, a) {
				return "<iframe" + a("src", "https://" + id.replace(":", ".com/embed/")) + a("title", text) + extra + "></iframe>"
			}
			assert.equal(inline(str), html)
			assert.end()
		})

		it ("should render docs: {0}", [
			[ "= Hello\n\nworld\n\n---\n\nAnd moon.", "<h1>Hello</h1>\n<p>world</p>\n<hr>\n<p>And moon.</p>" ],
			[ "---\n\n - First\n - Second", "<hr>\n<ul><li>First</li>\n<li>Second</li></ul>" ],
			[ "---\n\n 1. First\n 2. Second", "<hr>\n<ol><li>First</li>\n<li>Second</li></ol>" ],
			[ "---\n\n 5. Start from five\n 6. Six", "<hr>\n<ol start=\"5\"><li>Start from five</li>\n<li>Six</li></ol>" ],
			[ "> Some\n block", "<blockquote><p>Some\n<br>block</p></blockquote>" ],
			[ "> == Hi\n>\n> > Nested", "<blockquote><h2>Hi</h2>\n<blockquote><p>Nested</p></blockquote></blockquote>" ],
			[ "[Image !a.jpg!]", "<p><img src=\"a.jpg\" alt=\"Image\"></p>" ],
			[ "[!photo.jpg!]", "<p><img src=\"photo.jpg\" alt=\"photo.jpg\"></p>" ],
			[ "[sunset !photo.jpg!.right]", "<p><img src=\"photo.jpg\" alt=\"sunset\" class=\"right\"></p>" ],
			[ "== Heading", "<h2>Heading</h2>" ],
			[ "hello\n world", "<p>hello\n<br>world</p>" ],
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

	test("append with negative before index", function(assert) {
		var el = document.createElement("div")
		El.append(el, document.createElement("a"))
		El.append(el, document.createElement("b"))
		El.append(el, document.createElement("c"))
		// before=-1: insert before last child
		El.append(el, document.createElement("d"), -1)
		assert.equal(el.innerHTML, "<a></a><b></b><d></d><c></c>")
		// before=-2: insert before second to last
		El.append(el, document.createElement("e"), -2)
		assert.equal(el.innerHTML, "<a></a><b></b><e></e><d></d><c></c>")
		assert.end()
	})

	it ("should parse elements: {i}", [
		[ "h1", '<h1></h1>' ],
		[ "h1 > h2 +5", '<h1><h2>+5</h2></h1>' ],
		[ "h2[a][b-c]", '<h2 a="a" b-c="b-c"></h2>' ],
		[ '#h3.h4[title=Hello][title~="World !"].foo', '<div id="h3" class="h4 foo" title="Hello World !"></div>' ],
		// setAttr class will overwrite
		[ '#h3.h4[title=Hello][title~="World !"][class=bar]', '<div id="h3" class="bar" title="Hello World !"></div>' ],
		[ 'a[href=about][href^="#"]\na[href=about][href$=".html"]', '<a href="#about"></a><a href="about.html"></a>'],
		[ "h3 ;txt:'Hi'\ninput[type=checkbox][readonly]", '<h3>Hi</h3><input type="checkbox" readonly>' ],
		[ 'p[title="a b"]\r\n hr ;if 1', '<p title="a b"><hr></p>' ],
		[ 'p ;css "top,left", "0px"\n hr ;if 0', '<p style="top:0px;left:0px"><!--if--></p>' ],
	], function(str, html, assert, mock) {
		document.body.innerHTML = ""
		mock.swap(console, "log", mock.fn())
		xhr.ui(str)
		LiteJS.start()
		assert.equal(document.body.innerHTML, html)
		assert.end()
	})

	describe("plugins", function() {
		function before(newEl, nextSib) {
			nextSib.parentNode.insertBefore(newEl, nextSib)
		}

		test ("injectCss", function(assert) {
			var app = LiteJS({
				root: document.body
			})

			before(El("head"), app.root)

			assert.notOk(document.querySelector("style"))
			xhr.ui('%css\n .x{top:1px}')
			LiteJS.start()
			assert.ok(document.querySelector("style"))
			assert.end()
		})
	})

	describe("bindings", function() {
		test ("if", function(assert, mock) {
			//mock.swap(console, "log", mock.fn())
			var document = new dom.Document()
			, app = LiteJS({
				root: document.body
			})
			xhr.ui('%view a #\n p[title="a b"]\n hr ;if enabled\n%view b #\n.b')
			LiteJS.start()
			app.show("a")
			assert.equal(document.body.innerHTML, '<p title="a b"></p><!--if-->')
			app.$d.enabled = true
			El.render(app.root)
			assert.equal(document.body.innerHTML, '<p title="a b"></p><hr>')
			app.$d.enabled = false
			app.show(true)
			assert.equal(document.body.innerHTML, '<p title="a b"></p><!--if-->')
			app.show("b")
			assert.equal(document.body.innerHTML, '<div class="b"></div>')
			app.show("c")
			assert.equal(document.body.innerHTML, '<h2>Not found</h2>')
			assert.end()
		})
		test ("is", function(assert, mock) {
			//mock.swap(console, "log", mock.fn())
			var document = new dom.Document()
			, app = LiteJS({
				root: document.body
			})
			xhr.ui('p ;is isVal,"none,red?green?black=blue"')
			app.$d.isVal = "red"
			LiteJS.start()
			assert.equal(document.body.innerHTML, '<p class="is-red"></p>')
			app.$d.isVal = "black"
			El.render(app.root)
			assert.equal(document.body.innerHTML, '<p class="is-blue"></p>')
			app.$d.isVal = "un"
			El.render(app.root)
			assert.equal(document.body.innerHTML, '<p class="is-none"></p>')
			assert.end()
		})
		test ("each", function(assert, mock) {
			//mock.swap(console, "log", mock.fn())
			var document = new dom.Document()
			, app = LiteJS({
				root: document.body
			})
			xhr.ui('ul\n li.first\n\n li ;each!"i",list;txt i.id\n li.last')
			app.$d.list = [{id:2}, {id:3}]
			LiteJS.start()
			El.render(app.root)
			assert.equal(document.body.innerHTML, '<ul><li class="first"></li><!--each i--><li>2</li><li>3</li><li class="last"></li></ul>')
			app.$d.list[2] = {id:4}
			El.render(app.root)
			assert.equal(document.body.innerHTML, '<ul><li class="first"></li><!--each i--><li>2</li><li>3</li><li>4</li><li class="last"></li></ul>')
			app.$d.list.shift()
			El.render(app.root)
			assert.equal(document.body.innerHTML, '<ul><li class="first"></li><!--each i--><li>3</li><li>4</li><li class="last"></li></ul>')
			assert.end()
		})
		test ("el", function(assert, mock) {
			//mock.swap(console, "log", mock.fn())
			var document = new dom.Document()
			, app = LiteJS({
				root: document.body
			})
			xhr.ui('%el El-a\n li.a\n%el El-b\n li.b\n%el El-c\n li.c\nul>.sub ;el subEl,"El-c"')
			app.$d.subEl = "El-a"
			LiteJS.start()
			El.render(app.root)
			assert.equal(document.body.innerHTML, '<ul><li class="a sub"></li></ul>')
			app.$d.subEl = "El-b"
			El.render(app.root)
			assert.equal(document.body.innerHTML, '<ul><li class="b sub"></li></ul>')
			app.$d.subEl = "El-d"
			El.render(app.root)
			assert.equal(document.body.innerHTML, '<ul><li class="c sub"></li></ul>')
			assert.end()
		})
		test ("$s", function(assert, mock) {
			//mock.swap(console, "log", mock.fn())
			var document = new dom.Document()
			, app = LiteJS({
				root: document.body
			})
			xhr.ui('p\n hr ^$s {b:1}')
			LiteJS.start()
			var p = El.scope(app.$('p'))
			, hr = El.scope(app.$('hr'))
			assert.notStrictEqual(p, hr)
			assert.notOk(p.b)
			assert.equal(hr.b, 1)
			assert.end()
		})
	})


	it ("should parse examples: {i}", [
		[ "html/simplest.html", 1 ],
		[ "html/routed.html", 0 ],
		[ "html/svg-spa.html", 0 ],
		[ "html/form.html", 1 ],
	], function(fileName, logCount, assert, mock) {
		mock.swap(global, {
			document,
			El,
			LiteJS,
		})
		mock.swap(console, "log", mock.fn())
		var newDoc = parser.parseFromString(fs.readFileSync(path.resolve("./test", fileName), "utf8"))
		, app = LiteJS({ root: newDoc.body })
		newDoc.querySelectorAll("script[type=ui]").forEach(function(el) {
			var source = el.innerHTML
			//console.log(newDoc.body.childNodes[0].childNodes, source)
			El.kill(el)
			app.parse(source)
		})
		assert.matchSnapshot("./test/spec/" + fileName, newDoc.body.outerHTML)
		Object.keys(app.views).forEach(function(view) {
			if (view.charAt(0) === "#") return
			app.show(view)
			assert.matchSnapshot("./test/spec/" + fileName, newDoc.body.outerHTML)
		})
		assert.equal(console.log.called, logCount)
		assert.end()
	})
})

