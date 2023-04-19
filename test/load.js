
describe("load.js", function() {
	var xhrMap = {
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
		"l.js": { text: "var l" }
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
		xhr.readyState = 0
		xhr.status = 0
		xhr.responseText = null
		xhr.getResponseHeader = function(name) {}
		xhr.getAllResponseHeaders = function() {}
		xhr.setRequestHeader = function(name, value) {}
		xhr.open = function(method, url, async) {
			this.readyState = 1
			delete this.onreadystatechange
			res = xhrMap[url]
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
				xhr.onreadystatechange()
			}
		}
	}
	var lib, xhr

	this.beforeEach = function() {
		xhrRes = []
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
		var log = xhr.err = mock.fn()
		assert.equal(log.called, 0)
		mock.tick(2000)
		assert.equal(log.called, 1)
		assert.equal(log.calls[0].args[0].length, 3)
		assert.end()
	})
	.should("load nothing", function(assert) {
		xhrRes = []
		xhr.load([])
		xhr.load("", function() {
			assert.equal(xhrRes, [])
			assert.end()
		})
	})
	.should("load one file", function(assert) {
		xhrRes = []
		xhr.load("a.js")
		xhr.load("a.js", function() {
			assert.equal(xhrRes, ["var a"])
			assert.end()
		})
	})
	.should("load array with one file", function(assert) {
		xhrRes = []
		xhr.load(["b.js"], function() {
			assert.equal(xhrRes, ["var b"])
			assert.end()
		})
	})
	.should("load array with null's", function(assert) {
		xhrRes = []
		xhr.load([null, "c.js", null], function() {
			assert.equal(xhrRes, ["var c"])
			assert.end()
		})
	})
	.should("load one file twice", function(assert, mock) {
		mock.time()
		xhrRes = []
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
	.should("fall back to injection", function(assert, mock) {
		xhrRes = []
		mock.swap(global, "eval", mock.fn(null))
		mock.swap(global, "document", {
			createElement: function(tag) { return {} },
			body: {
				removeChild: function() {},
				insertBefore: function(child) {
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
	.should("require", function(assert) {
		lib.require.def({
			"a": "this.r=1",
			"b": "module.exports=2",
			"c": { r:3 },
			"d": "exports.r=4",
		})
		assert.equal(lib.require("a").r, 1)
		assert.equal(lib.require("b"), 2)
		assert.equal(lib.require("c").r, 3)
		assert.equal(lib.require("d").r, 4)
		assert.throws(function() {
			lib.require("e")
		})
		assert.end()
	})

})
