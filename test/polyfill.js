
describe("Polyfill test", function() {

	this
	.test("setTimeout parameters", function(assert) {
		setTimeout(function(a) {
			assert.equal(a, 2).end()
		}, 1, 2)
	})
	.test("index.js", function(assert, mock) {

		if (describe.env === "browser") {
			var lib = window
		} else {
			mock.swap(Object, {
				assign: null,
				create: null,
				entries: null,
				keys: null,
				hasOwn: null,
				values: null,
				fromEntries: null
			})
			mock.swap(String.prototype, "trim", null)
			mock.swap(Date, "now", null)
			mock.swap(Date.prototype, { toJSON: null, toISOString: null })
			mock.swap(Array, {
				from: null,
				isArray: null,
				of: null
			})
			mock.swap(Array.prototype, {
				entries: null,
				every: null,
				filter: null,
				flat: null,
				flatMap: null,
				forEach: null,
				includes: null,
				indexOf: null,
				lastIndexOf: null,
				map: null,
				reduce: null,
				reduceRight: null,
				some: null
			})
			mock.swap(Function.prototype, "bind", null)
			var lib = require("../polyfill/index.js")
		}


		var tmp, undef
		, obj = {a:1,b:2}

		/*
		assert.equal(lib._patched || xhr._patched, [
			"document","navigator","Event","pointer",
			"escape","sessionStorage","localStorage","requestAnimationFrame","cancelAnimationFrame",
			"JSON","performance","bind","assign","create","entries","keys","values",//"fromEntries",
			"isArray","from","indexOf","lastIndexOf","reduce","reduceRight","every","forEach","map","filter","some",//"entries",
			"trim","now","toJSON","toISOString","now","sendBeacon",
			"matches","closest","querySelector","querySelectorAll"
		])
		*/

		assert.type(lib.Event, "function")

		tmp = '{"a":1,"cb":"2\\n3\\\\","d":[-1,0,1,2,{"g\\b":true},false,"",null,null,1],"e":{"f":null}}'
		assert.equal(lib.JSON.stringify({a:1,cb:"2\n3\\",d:[-1,0,1,2,{"g\b":true},false,"", NaN, Infinity, {toJSON:function(){return 1}}],e:{f:null}}), tmp)
		assert.equal(JSON.stringify({a:1,cb:"2\n3\\",d:[-1,0,1,2,{"g\b":true},false,"", NaN, Infinity, {toJSON:function(){return 1}}],e:{f:null}}), tmp)
		assert.equal(lib.JSON.parse(tmp), {a:1,cb:"2\n3\\",d:[-1,0,1,2,{"g\b":true},false,"", null, null, 1],e:{f:null}})

		lib.sessionStorage.setItem("a", 1)
		assert.equal(lib.sessionStorage.getItem("a"), "1")

		assert.equal(lib.escape("a", 0), "a")
		assert.equal([1, 2].reverse(), [2, 1])
		assert.equal([1, 2].splice(0), [1, 2])
		assert.equal([1, 2].splice(0, null), [])

		assert.type(lib.requestAnimationFrame, "function")
		assert.type(lib.cancelAnimationFrame, "function")
		assert.type(lib.navigator.sendBeacon, "function")

		function bindTest(b, c, d, e) {
			return [this.a, b, c, d, e].join(" ")
		}
		assert.equal(bindTest.bind({a: 1}, 2, 3)(4, 5), "1 2 3 4 5")

		tmp = {a:1,b:1}
		assert.strictEqual(Object.assign(tmp, {b:2,c:3}), tmp)
		assert.equal(tmp, {a:1,b:2,c:3})
		//assert.equal(Object.fromEntries([["a", 1], ["b", 2]]), obj)
		assert.ok(Object.hasOwn(tmp, "a"))
		assert.ok(!Object.hasOwn(Object.create(tmp), "a"))
		tmp = Object.create(null)
		assert.equal(tmp.constructor, null)
		assert.equal(tmp.toString, null)
		assert.equal(Object.entries(tmp), [])
		assert.equal(Object.entries(obj), [["a", 1], ["b", 2]])
		assert.equal(Object.keys(tmp), [])
		assert.equal(Object.keys(obj), ["a", "b"])
		assert.equal(Object.values(obj), [1, 2])

		assert.equal(Array.isArray([1]), true)
		assert.equal(Array.isArray(1), false)

		tmp = function(){ return Array.from(arguments) }
		assert.equal(tmp(1,2,3), [ 1, 2, 3 ])
		assert.equal(Array.from("äbc"), ["ä", "b", "c"])
		assert.equal(Array.from([1, 2, 3], function(x){ return x + x}), [2, 4, 6])

		assert.equal(Array.of(), [])
		assert.equal(Array.of(7), [7])
		assert.equal(Array.of(undef), [undef])
		assert.equal(Array.of(1, 2, 3), [1, 2, 3])

		tmp = [0, 1, 2, [[[3, 4]]]]

		assert.equal(tmp.flat(), [0, 1, 2, [[3, 4]]])
		assert.equal(tmp.flat(0), tmp)
		assert.notStrictEqual(tmp.flat(0), tmp)
		assert.equal(tmp.flat(2), [0, 1, 2, [3, 4]])
		assert.equal(tmp.flat(Infinity), [0, 1, 2, 3, 4])

		tmp = [1, 2, 3, 4]
		assert.equal(tmp.flatMap(function(x) { return [x, x * 2] }), [1, 2, 2, 4, 3, 6, 4, 8])
		tmp = [5, 4, -3, 20, 17, -33, -4, 18]
		assert.equal(tmp.flatMap(function(n) { return (n < 0) ? [] : (n % 2 == 0) ? [n] : [n-1, 1] }), [4, 1, 4, 20, 16, 1, 18])

		assert.equal([1, 2, 1].indexOf(1), 0)
		assert.equal([1, 2, 1].indexOf(2), 1)
		assert.equal([1, 2, 1].indexOf(1, 0), 0)
		assert.equal([1, 2, 1].indexOf(1, 1), 2)
		tmp = ["a", 1, "2", 3, NaN, 1]
		assert.equal(
			tmp.concat(2, "b").map(function(i) { return tmp.indexOf(i) }),
			[0, 1, 2, 3, -1, 1, -1, -1]
		)
		assert.equal(
			tmp.concat(2, "b").map(function(i) { return tmp.lastIndexOf(i) }),
			[0, 5, 2, 3, -1, 5, -1, -1]
		)
		assert.equal(
			tmp.concat(2, "b").map(function(i) { return tmp.includes(i) }),
			[true, true, true, true, true, true, false, false]
		)
		assert.equal(tmp.filter(function(i) { return typeof i === "string" }), ["a", "2"])
		assert.equal(tmp.some(function(i) { return i === 1 }), true)
		assert.equal(tmp.some(function(i) { return i === "1" }), false)
		assert.equal(tmp.every(function(i) { return i !== 4 }), true)
		assert.equal(tmp.every(function(i) { return i === 1 }), false)

		assert.equal(" a	".trim(), "a")

		assert.equal(new Date(6e13-1).toISOString(),  "3871-04-29T10:39:59.999Z")
		assert.equal(new Date(-6e13-1).toISOString(), "0068-09-03T13:19:59.999Z")
		assert.equal(new Date(-8e13-1).toISOString(), "-000566-11-26T01:46:39.999Z")
		assert.equal(new Date(864e13).toISOString(),  "+275760-09-13T00:00:00.000Z")
		assert.equal(new Date(864e12).toISOString(),  "+029349-01-26T00:00:00.000Z")
		assert.equal(new Date(-864e12).toISOString(), "-025410-12-06T00:00:00.000Z")
		assert.equal(new Date(-864e13).toISOString(), "-271821-04-20T00:00:00.000Z")
		assert.throws(function() {
			new Date(NaN).toISOString()
		})


		assert.end()

	})
	.test("DOM", typeof window === "undefined" ? "No window" : function(assert, mock) {
		assert.equal(document.body.querySelector.call(document.documentElement, "body").tagName, "BODY")
		assert.equal(document.body.querySelectorAll.call(document.documentElement, "body").length, 1)
		assert.equal(document.body.matches("BODY"), true)
		assert.equal(document.body.matches("HTML"), false)
		assert.end()
	})
})

