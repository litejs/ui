
var mock = {
	"a.json": {type: "object"}

}

global.Fn = require("../fn.js").Fn
JSON.pointer = require("../lib/json").pointer
global.xhr = {
	get: function(url, cb) {
		setTimeout(function() {
			cb(null, mock[url])
		}, 5)
	}
}

require("../ui/js/xhr-getschema.js")

require("testman")
.describe("xhr.getSchema")
.test("getSchema", function(assert) {
	assert.plan(1)

	xhr.getSchema("a.json", function(err, json) {
		assert.equal(json, {type: "object"})
	})


})


