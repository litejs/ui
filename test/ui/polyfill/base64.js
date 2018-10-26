
require("../..")
.test("base64", function(assert) {
	var lib = require("../../../ui/polyfill/base64.js")
	, tests = [
		"",
		"1", "12", "123", "1234",
		"Unicode string will cause a Character Out Of Range exception"
	]

	tests.forEach(function(test) {
		var tmp = lib.btoa(test)
		assert.equal(tmp, Buffer.from(test).toString("base64"), "btoa:"+test)
		assert.equal(lib.atob(tmp), test, "atob:"+test)
	})

	assert.end()
})

