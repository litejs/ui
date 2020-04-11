
describe("ui/polyfill")
.test("es5", function(assert, mock) {
	var tmp

	assert.type(window.Event, "function")

	tmp = '{"a":1,"cb":"2\\n3\\\\","d":[-1,0,1,2,{"g\\b":true},false,"",null,null],"e":{"f":null}}'
	assert.equal(JSON.stringify({a:1,cb:"2\n3\\",d:[-1,0,1,2,{"g\b":true},false,"", NaN, Infinity],e:{f:null}}), tmp)
	assert.equal(JSON.parse(tmp), {a:1,cb:"2\n3\\",d:[-1,0,1,2,{"g\b":true},false,"", null, null],e:{f:null}})

	sessionStorage.setItem("a", 1)
	assert.equal(sessionStorage.getItem("a"), "1")

	assert.equal(escape("a", 0), "a")

	assert.type(requestAnimationFrame, "function")
	assert.type(cancelAnimationFrame, "function")
	assert.type(navigator.sendBeacon, "function")

	assert.equal(bindTest.bind({a: 1}, 2, 3)(4, 5), "1 2 3 4 5")

	tmp = {a:1}
	assert.equal(Object.create(null).toString, void 0)
	assert.equal(Object.create(tmp).a, 1)
	assert.strictEqual(Object.assign(tmp, {b:"2"}), tmp)
	assert.equal(tmp, {a:1, b:"2"})
	assert.equal(Object.keys(tmp), ["a", "b"])
	assert.equal(Object.values(tmp), [1, "2"])

	assert.equal(Array.isArray([1]), true)
	assert.equal(Array.isArray(1), false)
	assert.equal(Array.from("äbc"), ["ä", "b", "c"])

	tmp = ["a", 1, "2", 3, 1]
	assert.equal(
		tmp.concat(2, "b").map(function(i) { return tmp.indexOf(i) }),
		[0, 1, 2, 3, 1, -1, -1]
	)
	assert.equal(
		tmp.concat(2, "b").map(function(i) { return tmp.lastIndexOf(i) }),
		[0, 4, 2, 3, 4, -1, -1]
	)
	assert.equal(tmp.filter(function(i) { return typeof i === "string" }), ["a", "2"])
	assert.equal(tmp.some(function(i) { return i === 1 }), true)
	assert.equal(tmp.some(function(i) { return i === "1" }), false)
	assert.equal(tmp.every(function(i) { return i !== 4 }), true)
	assert.equal(tmp.every(function(i) { return i === 1 }), false)

	assert.equal(" a	".trim(), "a")

	assert.end()

	function bindTest(b, c, d, e) {
		return [this.a, b, c, d, e].join(" ")
	}
})

describe.onprint = function(str) {
	result.innerHTML += str + "\n"
}
describe.onend = function() {
	xhr._patched.sort()
	result.innerHTML += "patched: " + xhr._patched.length + "\n" + xhr._patched + "\n"
}

