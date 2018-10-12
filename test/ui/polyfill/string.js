
require("../..")
.describe("ui/polyfill")
.test("codePoint", function(assert) {
	var fn = require("../../../ui/polyfill/string.js")
	, te = new fn.TextEncoder("utf-8")

	assert.equal(fn.startsWith.call("aaa", "ab"), false)
	assert.equal(fn.startsWith.call("aba", "ab"), true)
	assert.equal(fn.endsWith.call("aaa", "ba"), false)
	assert.equal(fn.endsWith.call("aba", "ba"), true)

	assert.equal(fn.codePointAt.call("𝌆𝌆", 0), 119558)
	assert.equal(fn.codePointAt.call("𝌆𝌆", 1), 57094)

	assert.equal(fn.fromCodePoint(119558), "𝌆")
	assert.equal(te.encode("äoõ"), Uint8Array.from([195, 164, 111, 195, 181]))
	assert.end()
})
