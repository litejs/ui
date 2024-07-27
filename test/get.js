var UNDEF
	function get2(obj, path, fallback) {
		return isStr(path) ? (
			obj[path] !== UNDEF ? obj[path] :
			(path = path.split("."))[1] && (obj = obj[path[0]]) && obj[path[1]] !== UNDEF ? obj[path[1]] : fallback
		) :
		isArr(path) ? get(obj, path[0]) || get(obj, path[1]) || get(obj, path[2], fallback) :
		fallback
	}
	function isFn(fn) {
		// old WebKit returns "function" for HTML collections
		return typeof fn === "function"
	}
	function isNum(num) {
		return typeof num === "number"
	}
	function isObj(obj) {
		return !!obj && obj.constructor === Object
	}
	function isStr(str) {
		return typeof str === "string"
	}

describe("get", function() {
	var ext = {

	}
	function get(obj, path, fallback) {
		var re = /;?[^;]+/g
		, p = re.exec(path)
		, val = get2(obj, p[0])

		console.log("GET", p)
		for (; (p = re.exec(path)); ) {
			console.log("TR", p)
			val =

		}

		return val

	}
	var obj =
		{ "foo": ["bar", "baz"]
		, "": 0
		, "a/b": 1
		, "c%d": 2
		, "e^f": 3
		, "g|h": 4
		, "i\\j": 5
		, "k\"l": 6
		, " ": 7
		, "m~n": 8
		, a: [{b:1,c:"2"},{b:3,c:"4"},{b:5,d:6}]
		, b: ["A", "B", "C"]
		, list: { a: {x:1}, b: {x:2}, c: {y:3} }
		}

	it("should get '{0}'", [
		[ "foo", obj.foo ],
		[ "foo.0", "bar" ],
		[ "foo[0]", "bar" ],
		[ "a[0].b", 1 ],
		[ "a[1].b", 3 ],
		[ "a[c=2].b", 1 ],
		[ "a[c=4].b", 3 ],
		[ "foo.1", "baz" ],
		[ "a/b", 1 ],
		[ "c%d", 2 ],
		[ "e^f", 3 ],
		[ "g|h", 4 ],
		[ "i\\j", 5 ],
		[ "k\"l", 6 ],
		[ " ", 7 ],
		[ "m~n", 8 ],
	], function(path, val, assert) {
		assert.equal(get(obj, path), val).end()
	})

	it("should apply extensions", function(assert) {
		var obj = {
			a: "21.1",
			b: "21,2",
			c: null,
			d: "null",
			e: "2009-02-13T23:31:30Z"
		}
		assert.equal(get(obj, "a;toNum"), 21.1)
		assert.equal(get(obj, "b;toNum:','"), 21.2)
		assert.equal(get(obj, "c;toNum"), null)
		assert.equal(get(obj, "d;toNum"), null)
		assert.equal(get(obj, "e;toDate"), 1234567890000)
		assert.end()
	})

})

