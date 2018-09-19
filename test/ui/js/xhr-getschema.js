
require("../../_setup")

require("../..")
.describe("xhr.getSchema")
.test("getSchema", function(assert, mock) {
	var responses = {
		"a.json": {
			type: "object",
			properties: {
				a: { type: "integer" }
			},
			def: {
				b: {
					$id: "b.json",
					type: "object",
					properties: {
						b: { type: "boolean" }
					}
				}
			}
		}
	}

	global.xhr = function(method, url, cb) {
		return {
			send: function() {
				setTimeout(function() {
					cb(null, JSON.stringify(responses[url]))
				}, 1)
			}
		}
	}
	global.Item = require("../../../model").Item

	require("../../../ui/js/xhr-getschema.js")

	assert.plan(4)

	assert.type(xhr.getSchema, "function")

	xhr.getSchema("a.json", function(err, json) {
		assert.equal(json, responses["a.json"])
		xhr.getSchema("b.json", function(err, json) {
			assert.equal(json, responses["a.json"].def.b)
		})
		xhr.getSchema("a.json#/def/b", function(err, json) {
			assert.equal(json, responses["a.json"].def.b)
		})
	})
})


