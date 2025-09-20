
describe("Shim test", function() {

	this
	.test("setTimeout additional parameters", function(assert) {
		assert.plan(2)
		var interval = setInterval(function(a) {
			assert.equal(a, 2)
			clearInterval(interval)
		}, 1, 2)
		setTimeout(function(a) {
			assert.equal(a, 3)
		}, 1, 3)
	})
	.test("shim.js", function(assert, mock) {

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
			mock.swap(String.prototype, {
				at: null,
				endsWith: null,
				//startsWith: null,
				trim: null
			})
			mock.swap(Number, {
				isFinite: null,
				isInteger: null,
				isNaN: null,
				isSafeInteger: null,
				parseFloat: null,
				parseInt: null,
			})
			mock.swap(Date, "now", null)
			mock.swap(Date.prototype, { toJSON: null, toISOString: null })
			mock.swap(Array, {
				from: null,
				isArray: null,
				of: null
			})
			mock.swap(Array.prototype, {
				at: null,
				entries: null,
				every: null,
				filter: null,
				find: null,
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
			var lib = require("../shim.js")
		}


		var tmp, undef
		, obj = {a:1,b:2}

		/*
		assert.equal(lib._patched || xhr._patched, [
			"document","navigator","Event","pointer",
			"escape","sessionStorage","localStorage","requestAnimationFrame","cancelAnimationFrame",
			"JSON","bind","assign","create","entries","keys","values",//"fromEntries",
			"isArray","from","indexOf","lastIndexOf","reduce","reduceRight","every","forEach","map","filter","some",//"entries",
			"trim","now","toJSON","toISOString","now","sendBeacon",
			"matches","closest","querySelector","querySelectorAll"
		])
		*/

		assert.type(lib.Event, "function")

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
		assert.equal(tmp.constructor, undef)
		assert.equal(tmp.toString, undef)
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

		var reducer = mock.fn(function(sum, i) { return sum + i })

		assert.equal([1, 2, 3].reduce(reducer), 6)
		assert.equal(reducer.calls[0].scope, global)
		assert.equal([1, 2, 3].reduce(function(sum, i) { return sum + i }, 1), 7)
		assert.equal([1, 2, 4].reduceRight(function(diff, i) { return diff - i }), 1)

		assert.equal(
			tmp.concat(2, "b").map(function(i) { return tmp.includes(i) }),
			[true, true, true, true, true, true, false, false]
		)
		assert.equal(tmp.filter(function(i) { return typeof i === "string" }), ["a", "2"])
		assert.equal(tmp.find(function(i) { return i === 1 }), 1)
		assert.equal(tmp.find(function(i) { return i === 4 }), undef)
		assert.equal(tmp.some(function(i) { return i === 1 }), true)
		assert.equal(tmp.some(function(i) { return i === "1" }), false)
		assert.equal(tmp.every(function(i) { return i !== 4 }), true)
		assert.equal(tmp.every(function(i) { return i === 1 }), false)

		tmp = ["a", "b", "c"]
		assert.equal(tmp.at(0), "a")
		assert.equal(tmp.at(1.1), "b")
		assert.equal(tmp.at(2), "c")
		assert.equal(tmp.at(3), undef)
		assert.equal(tmp.at(-1), "c")
		assert.equal(tmp.at(-3.1), "a")
		assert.equal(tmp.at(-4), undef)

		assert.equal("abc".at(0), "a")
		assert.equal("abc".at(1.1), "b")
		assert.equal("abc".at(2), "c")
		assert.equal("abc".at(3), undef)
		assert.equal("abc".at(-1), "c")
		assert.equal("abc".at(-3.1), "a")
		assert.equal("abc".at(-4), undef)

		assert.equal("aaa".startsWith("ab"), false)
		assert.equal("aba".startsWith("ab"), true)
		assert.equal("aaa".endsWith("ba"), false)
		assert.equal("aba".endsWith("ba"), true)

		assert.equal(" a	".trim(), "a")

		assert.equal(
			[ 0, 1, -100000, 99999999999999999999999, 5.0, 5.0000000000000001, 4500000000000000.1 ].every(Number.isInteger),
			true
		)
		assert.equal(
			[ 0.1, Math.PI, NaN, Infinity, -Infinity, "10", true, false, [1], 5.000000000000001 ].some(Number.isInteger),
			false
		)
		assert.equal(
			[ 0, 2e64 ].every(Number.isFinite),
			true
		)
		assert.equal(
			[ Infinity, NaN, -Infinity, "0", null ].some(Number.isFinite),
			false
		)

		assert.equal(Number.isNaN(NaN), true)
		assert.equal(
			[ "NaN", undefined, {}, "blabla", true, null, "37", "37.37", "", " " ].some(Number.isNaN),
			false
		)
		;[
			[ "0xF",    16 ],
			[ "F",      16 ],
			[ "FXX123", 16 ],
			[ "17",      8 ],
			[ "015",    10 ],
			[ "15,123", 10 ],
			[ "15 * 3", 10 ],
			[ "15e2",   10 ],
			[ "15px",   10 ],
			[ "12",     13 ],
			[ "1111",    2 ]
		].forEach(function(a) {
			assert.equal(parseInt(a[0], a[1]), 15)
			assert.equal(Number.parseInt(a[0], a[1]), 15)
		})
		assert.equal(Number.parseFloat("1.2"), parseFloat("1.2"))
		assert.strictEqual(Number.EPSILON, 2.220446049250313e-16)
		assert.strictEqual(Number.MAX_SAFE_INTEGER, 9007199254740991)
		assert.strictEqual(Number.MIN_SAFE_INTEGER, -9007199254740991)
		assert.equal(Number.isSafeInteger(9007199254740991), true)
		assert.equal(Number.isSafeInteger(9007199254740992), false)
		assert.equal(Number.isSafeInteger(-9007199254740991), true)
		assert.equal(Number.isSafeInteger(-9007199254740992), false)
		assert.equal(Number.isSafeInteger(1.1), false)

		assert.equal(new Date(6e13-1).toJSON(),  "3871-04-29T10:39:59.999Z")
		assert.equal(new Date(6e13-1).toISOString(),  "3871-04-29T10:39:59.999Z")
		assert.equal(new Date(-6e13-1).toISOString(), "0068-09-03T13:19:59.999Z")
		assert.equal(new Date(-8e13-1).toISOString(), "-000566-11-26T01:46:39.999Z")
		assert.equal(new Date(864e13).toISOString(),  "+275760-09-13T00:00:00.000Z")
		assert.equal(new Date(864e13).toJSON(),       "+275760-09-13T00:00:00.000Z")
		assert.equal(new Date(864e12).toISOString(),  "+029349-01-26T00:00:00.000Z")
		assert.equal(new Date(-864e12).toISOString(), "-025410-12-06T00:00:00.000Z")
		assert.equal(new Date(-864e13).toISOString(), "-271821-04-20T00:00:00.000Z")
		assert.throws(function() {
			return new Date(NaN).toISOString()
		})


		assert.end()

	})
	.test("JSON", function(assert) {
		var undef
		, lib = describe.env === "browser" ? window : require("../shim.js")
		, str1 = '{"a":1,"cb":"2\\n3\\\\","d":[-1,0,1,2,{"g\\b":true},false,"",null,null,null,1],"e":{"f":null}}'
		, obj1 = {a:1,cb:"2\n3\\",d:[-1,0,1,2,{"g\b":true},false,"", NaN, Infinity, undef, {toJSON:function(){return 1}}],e:{f:null,o:undef}}
		, obj2 = {a:1,cb:"2\n3\\",d:[-1,0,1,2,{"g\b":true},false,"", null, null, null, 1],e:{f:null}}

		assert.equal(lib.JSON.parse(str1), obj2)
		assert.equal(    JSON.parse(str1), obj2)
		assert.equal(lib.JSON.stringify(obj1), str1)
		assert.equal(    JSON.stringify(obj1), str1)
		assert.equal(lib.JSON.parse('"a\u2029b\\u2029c"'), "a\u2029b\u2029c")
		assert.equal(    JSON.parse('"a\u2029b\\u2029c"'), "a\u2029b\u2029c")
		assert.end()
	})
})

describe("DOM tests", typeof window === "undefined" ? "No window" : function() {
	this.test("selector: {0}", [
		[ ".red", "BODY", 1 ],
		[ "[name='viewport']", "META", 1 ],
		[ "body", "BODY", 1 ],
		[ "meta", "META", 3 ]
	], function(query, tag, count, assert) {
		// Expects test.litejs.com DOM
		var root = document.documentElement
		, first = document.body.querySelector.call(root, query)
		, all = document.body.querySelectorAll.call(root, query)
		assert.equal(first.tagName, tag)
		assert.equal(all.length, count)
		assert.equal(document.body.matches.call(first, query), true)
		assert.equal(document.body.matches.call(first, tag), true)
		assert.equal(document.body.matches.call(root, query), tag === "HTML")
		assert.equal(document.body.matches.call(root, tag), tag === "HTML")
		assert.end()
	})
})

describe("Custom code", function() {
	var UNDEF
	, VERSION = "0.0.0"
	, FN_CACHE = {}
	, assign = Object.assign
	, create = Object.create
	, isArray = Array.isArray
	, empty = []
	, bind = Date.bind.bind(Date.call)
	, hasOwn = bind(FN_CACHE.hasOwnProperty)
	, push = bind(empty.push)
	, sliceA = bind(empty.slice)
	, sliceS = bind(VERSION.slice)
	, toStr = bind(FN_CACHE.toString)
	, replace = bind(VERSION.replace)

	var xml = describe.global.ActiveXObject ? new ActiveXObject('Msxml2.DOMDocument.3.0') : {};
	var allTypes = [UNDEF, VERSION, isFn, null, NaN, 0, 1, Infinity, {}, empty, xml]

	it("should test type: {0}", [
		[ "isStr", isStr, VERSION ],
		[ "isFn", isFn, isFn ]
	], function(name, fn, ok, assert) {
		assert.setTimeout(5000)

		// trigger JIT
		for (var count = 500; count--; ) assert.equal(fn(ok), true)

		setTimeout(function() {
			assert.equal(fn(ok), true)

			allTypes.forEach(function(i){
				assert.equal(fn(i), i === ok, name + ":" + i)
			})
			assert.end()
		}, 1)
	})

	it("should ", function(assert) {

		assert.equal(hasOwn({a:1}, "a"), true)
		assert.equal(hasOwn({a:1}, "b"), false)
		assert.equal(args(0, 1, 2), [1, 2])
		assert.equal(replace("ab", "b", "c"), "ac")

		assert.end()

		function args() {
			return sliceA(arguments, 1)
		}
	})

	function isStr(str) {
		return typeof str === "string" // || false
	}
	function isFn(fn) {
		return typeof fn === "function"
	}
})


