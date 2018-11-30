
require("../..")
.describe("ui/polyfill")
.test("es5", function(assert, mock) {
	var forEach = mock.replace(Array.prototype, "forEach", null)
	, from = mock.replace(Array, "from", null)
	, isArray = mock.replace(Array, "isArray", null)

	require("../../../ui/polyfill/es5.js")

	assert.notEqual(forEach, Array.prototype.forEach)
	assert.type(Array.prototype.forEach, "function")

	assert.notEqual(from, Array.from)
	assert.type(Array.from, "function")

	assert.equal(Array.from("abc"), from("abc"))

	assert.equal(Array.isArray([1]), true)
	assert.equal(Array.isArray(1), false)

	assert.end()
})

