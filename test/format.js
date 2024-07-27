
describe(function() {
	var isArr = Array.isArray
	function format(str, data) {

	}
	var UNDEF, getRe = /("|')(?:\\\1|.)*?\1|[[{]|./g
	, valRe = /("|')(?:\\\1|.)*?\1|(\w*)\{((?:("|')(?:\\\4|.)*?\4|\w*\{(?:("|')(?:\\\5|.)*?\5|[^}])*?\}|.)*?)\}|([@$]?)([^,]+)/g
	function get(obj, key) {
		if (obj[key] !== UNDEF) return obj[key]
		for (var m, stack = []; (m = getRe.exec(key));) {
			if (m[0] === ".")
			console.log(m)
		}
	}
	function matches(obj, expr) {

	}
	var o = {
		a: 1,
		bc: "2",
		C: {d:3}
	}

	test("get", [
		[o, "a", 1],
		[o, "bc", "2"],
		[o, "c", UNDEF],
		[o, "a.", UNDEF],
		[o, "C.d", 3],
	], function(obj, key, exp, assert) {
		assert.equal(get(obj, key), exp).end()
	})

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
})


