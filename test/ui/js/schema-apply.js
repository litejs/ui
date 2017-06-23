
var schemaApply = require("../lib/schema-apply").schemaApply

global.Fn = require("../fn").Fn

require("testman")
.describe ("schema-apply")

.test ( "it should apply", function(assert) {
	var input = {
		"a": "1",
		"b": 2,
		"c": "3",
		"d": 4
	}
	, expected = {a:1,b:2,c:"3",d:"4"}
	, schema = {
		"properties": {
			"a": { "type": "number" },
			"b": { "type": "number" },
			"c": { "type": "string" },
			"d": { "type": "string" }
		}
	}

	assert.deepEqual(schemaApply(schema, input), expected)


})
.done()




