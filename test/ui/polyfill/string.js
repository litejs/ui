
require("../..")
.describe("ui/polyfill")
.test("codePoint", function(assert) {
	var fn = require("../../../ui/polyfill/codePoint.js")

	assert.equal(fn.codePointAt.call("𝌆𝌆", 0), 119558)
	assert.equal(fn.codePointAt.call("𝌆𝌆", 1), 57094)

	assert.equal(fn.fromCodePoint(119558), "𝌆")
	assert.end()
})
