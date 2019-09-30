
require("../..")
.describe("ui/polyfill")
.test("es5", function(assert, mock) {
	var tmp
	, forEach = mock.replace(Array.prototype, "forEach", null)
	, from = mock.replace(Array, "from", null)
	, isArray = mock.replace(Array, "isArray", null)
	, polyfill = require("../../../ui/polyfill")

	assert.notStrictEqual(forEach, Array.prototype.forEach)
	assert.notStrictEqual(from, Array.from)
	assert.notStrictEqual(isArray, Array.isArray)
	assert.notStrictEqual(JSON, polyfill.JSON)

	assert.type(Array.prototype.forEach, "function")
	assert.type(Array.from, "function")
	assert.type(Array.isArray, "function")

	assert.equal(Array.from("abc"), from("abc"))

	assert.equal(Array.isArray([1]), true)
	assert.equal(Array.isArray(1), false)

	tmp = {a:1,cb:"2\n3\\",d:[-1,0,1,2,{"g\b":true},false,"",NaN, Infinity],e:{f:null}}
	assert.equal(polyfill.JSON.stringify(tmp), JSON.stringify(tmp))

	tmp = JSON.stringify(tmp)
	assert.equal(polyfill.JSON.parse(tmp), JSON.parse(tmp))

	assert.end()
})

