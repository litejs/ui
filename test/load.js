
describe("load.js", function() {
	var lib, xhr
	var xhrMap = {
		"err": { text: "404" },
		"a.js": { text: "var a" },
		"b.js": { text: "var b", status: 0 },
		"c.js": { text: "var c" },
		"d.js": { text: "var d", time:15 },
		"e.js": { text: "var e" },
		"f.js": { status: 404 },
		"g.js": { text: "var g", time: 400 },
		"h.js": { status: 0 },
		"i.js": { text: "var i" },
		"j.js": { text: "var j" },
		"k.js": { text: "var k" },
		"l.js": { text: "var l" },
		"m.js": { text: "var m='raw'" },
		"m.thenable": { text: "var m" }
	}
	, xhrRes = []
	global.location = "http://"
	global.eval = function(str) {
		if (str === "var g") throw Error("G")
		xhrRes.push(str)
		return global.eval
	}
	global.ActiveXObject = function ActiveXObject() {
		var res
		, xhr = this
		xhr.readyState = xhr.status = 0
		xhr.responseText = null
		xhr.getResponseHeader = function(name) {}
		xhr.getAllResponseHeaders = function() {}
		xhr.setRequestHeader = function(name, value) {}
		xhr.open = function(method, url, async) {
			this.readyState = 1
			delete this.onreadystatechange
			res = xhrMap[url] || xhrMap.err
			if (async === false) response()
		}
		xhr.send = function() {
			var xhr = this
			setTimeout(function() {
				xhr.readyState = 3
				if (xhr.onreadystatechange) xhr.onreadystatechange()
			}, (res.time || 2) - 1)
			setTimeout(response, res.time || 2)
		}
		function response() {
			xhr.readyState = 4
			xhr.status = "status" in res ? res.status : 200
			xhr.responseText = res.text || ""
			if (xhr.onreadystatechange) {
				xhr.onreadystatechange()
				if (xhr.onreadystatechange) xhr.onreadystatechange()
			}
		}
	}

	function xhrReset() {
		xhrRes = []
		Object.keys(xhr._c).forEach(function(key) {
			delete xhr._c[key]
		})
	}

	this
	.should("log errors", function(assert, mock) {
		assert.setTimeout(2000)
		mock.time()
		lib = require("../load.js")
		xhr = lib.xhr
		lib.onerror("fault1", "t1.js", 11, 12, {stack:"a\nb"})
		mock.tick(400)
		lib.onerror("fault2", "t2.js", 21, 22, {backtrace:"c\nd"})
		lib.onerror("fault3", "t3.js", 31, 32, {stacktrace:"e\nf"})
		var log = xhr.sendLog = mock.fn()
		assert.equal(log.called, 0)
		mock.tick(3000)
		assert.equal(log.called, 1)
		assert.end()
	})
	.should("load {0}", [
		[ "empty array", [], [] ],
		[ "empty string", "", [] ],
		[ "null", null, [] ],
		[ "undefined", undefined, [] ],
		[ "array of falsy", [ null, undefined, "" ], [] ],
		[ "one file", "a.js", [ "var a" ] ],
		[ "one file in array", [ "a.js" ], [ "var a" ] ],
		[ "two files in array", [ "a.js", "b.js" ], [ "var a", "var b" ] ],
		[ "array with null's", [ null, "c.js", null ], [ "var c" ] ],
	], function(name, files, expected, assert) {
		xhrReset()
		xhr.load(files, function() {
			assert.equal(xhrRes, expected)
			assert.end()
		})
	})
	.should("load one file multiple times", function(assert) {
		xhrReset()
		xhr.load("a.js")
		xhr.load("a.js", function() {
			xhr.load("a.js", function() {
				assert.equal(xhrRes, ["var a"])
				assert.end()
			})
		})
	})
	.should("load array with null's", function(assert) {
		xhrReset()
		xhr.load([null, "c.js", null], function() {
			assert.equal(xhrRes, ["var c"])
			assert.end()
		})
	})
	.should("load one file twice", function(assert, mock) {
		mock.time()
		xhrReset()
		xhr.load(["d.js", "e.js", "f.js", "h.js"], function() {
			assert.equal(xhrRes, ["var d", "var e"])
		})
		xhr.load(["e.js"], function() {
			assert.equal(xhrRes, ["var d", "var e"])
		})
		xhr.load(["d.js","g.js"], function() {
			assert.equal(xhrRes, ["var d", "var e"])
			assert.end()
		})
		mock.tick(500)
	})
	.should("handle raw response", function(assert, mock) {
		mock.time()
		xhrReset()
		xhr.load(["m.js"], function(res) {
			assert.equal(xhrRes, [])
			assert.equal(res, ["var m='raw'"])
			assert.end()
		}, true)
		mock.tick(500)
	})
	.should("handle promise-like response", function(assert, mock) {
		mock.time()
		xhrReset()
		var thenable = xhr.thenable = mock.fn(function(str) {
			return { then: function(cb) {
				setTimeout(function() {
					xhrRes.push("var M")
					cb()
				}, 1)
			}}
		})
		xhr.load(["m.thenable"], function() {
			assert.equal(thenable.called, 1)
			assert.equal(xhrRes, ["var M"])
			assert.end()
		})
		mock.tick(500)
	})
	.should("fall back to injection", function(assert, mock) {
		xhrReset()
		mock.swap(global, "eval", mock.fn(null))
		mock.swap(global, "document", {
			createElement: function(tag) { return {} },
			body: {
				appendChild: function(child) {
					xhrRes.push(child.text)
				}
			}
		})

		delete require.cache[require.resolve("../load.js")]
		lib = require("../load.js")
		xhr = lib.xhr

		var req1 = xhr("PUT", "c.js", true)
		req1.send()
		assert.equal(req1.responseText, "var c")

		xhr("PUT", "d.js").send(null)

		xhr.load([null, "a.js", null, "b.js"], function() {
			assert.equal(xhrRes, ["var a", "var b"])
			assert.end()
		})
	})

	describe("Theme initializer", () => {
		it ("should set theme", [
			[ "", {} ],
			[ "", { localStorage: {}, matchMedia: () => ({ matches: false }) } ],
			[ "", { localStorage: { theme: "light" } } ],
			[ "is-dark", { localStorage: { theme: "dark" } } ],
			[ "is-dark", { localStorage: {}, matchMedia: () => ({ matches: true }) } ],
		], function(theme, window, assert, mock) {
			var doc = { documentElement: { className: "" } }
			mock.swap(global, "document", doc)
			mock.swap(require.extensions, ".js", function(module, filename) {
				Object.assign(module.exports, window)
				module._compile(require("fs").readFileSync(filename, "utf8"), filename)
			})

			delete require.cache[require.resolve("../load.js")]
			lib = require("../load.js")

			assert.equal(doc.documentElement.className, theme)
			assert.end()
		})
	})

})

