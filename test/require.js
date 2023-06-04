
describe("require.js", function() {
	var lib = require("../require.js")
	this
	.should("require", function(assert) {
		lib.require.def({
			"a": "this.r=1",
			"b": "module.exports=2",
			"c": { r:3 },
			"d": "exports.r=4",
		})
		assert.equal(lib.require("a").r, 1)
		assert.equal(lib.require("b"), 2)
		assert.equal(lib.require("c").r, 3)
		assert.equal(lib.require("d").r, 4)
		assert.throws(function() {
			lib.require("e")
		})
		assert.end()
	})
})

