
var mock = {
	"a.json": {type: "object"}

}

global.Fn = require("../lib/fn.js").Fn
global.xhr = {
	get: function(url, cb) {
		setTimeout(function() {
			cb(null, mock[url])
		}, 5)
	}
}

require("../ui/js/xhr-getschema.js")

require(".")
.describe("xhr.getSchema")
.test("getSchema", function(assert) {
	assert.plan(1)

	xhr.getSchema("a.json", function(err, json) {
		assert.equal(json, {type: "object"})
	})


})


