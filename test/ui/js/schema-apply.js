
require("../../_setup")

var schemaApply = require("../../../ui/schema-apply").schemaApply


require("../..")
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

	assert.equal(schemaApply(schema, input), expected)
	assert.end()
})




