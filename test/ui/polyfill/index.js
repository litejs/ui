
require("../..")
.describe("ui/polyfill")
.test("es5", function(assert, mock) {
	var forEach = Array.prototype.forEach

	mock.replace(Array.prototype, "forEach", null)
	require("../../../ui/polyfill/es5.js")

	assert.notEqual(forEach, Array.prototype.forEach)
	assert.type(Array.prototype.forEach, "function")

	assert.end()
})
