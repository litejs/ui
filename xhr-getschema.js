



!function(exports) {
	var pending = []
	, loaded = getSchema.loaded = {}

	exports.getSchema = getSchema
	/**
	 * JSON Reference
	 * @see http://tools.ietf.org/html/draft-pbryan-zyp-json-ref-03
	 * A JSON Reference is a JSON object, which contains a member named "$ref":
	 * { "$ref": "http://example.com/example.json#/foo/bar" }
	 *
	 *
	 * JSON Activity Streams
	 * http://activitystrea.ms/specs/json/schema/activity-schema.html
	 * https://tools.ietf.org/html/draft-snell-activitystreams-09
	 *
	 * official mime type is "application/schema+json"
	 */

	function getSchema(ref, next) {

		var parts = ref.split("#")
		, file = parts[0]
		, schema = loaded[file]
		, path = decodeURIComponent((parts[1] || "").replace(/\+/g, " "))

		if (schema && schema !== 1) {
			return next && next(null, JSON.pointer(schema, path))
		}

		pending.push(arguments)
		loaded[file] = 1

		if (schema !== 1) xhr.get(file, function(err, schema) {
			if (err) return next(err)

			var i, ref
			, refs = []
			, cb = Fn.wait(function() {
				loaded[file] = schema
				if (pending.length) {
					var arr = pending
					pending = []
					for (i = 0; ref = arr[i++]; ) {
						getSchema.apply(null, ref)
					}
				}
			})
			resolveRefs(schema, refs, file, schema)
			if (refs[0]) {
				// TODO:2014-12-23:lauri:resolve multiple refs
				// TODO:2014-12-23:lauri:resolve refs from other files
				// TODO:2016-07-26:lauri:Fix resolving circular refs
				for (i = 0; ref = refs[i]; i += 3) !function(ref, i, next) {
					getSchema(ref, function(err, schema) {
						refs[i+1][refs[i+2]] = schema
						next()
					})
				}(ref, i, cb.wait())
			}
			cb()

		})
	}

	function resolveRefs(obj, refs, id, schema, key, val) {
		for (key in obj) if (val = obj[key]) {
			if (typeof val.id == "string") {
				resolveRefs(loaded[val.id] = val, refs, val.id, val)
			} else if (typeof val == "object") {
				resolveRefs(val, refs, id, schema)
			}
			if (val = val.$ref) {
				if (val.charAt(0) == "#") {
					obj[key] = JSON.pointer(schema, val.slice(1))
				} else if (val.charAt(0) != "/") {
					val = id.replace(/[^\/]*$/, val)
					refs.push(val, obj, key)
				}
			}
		}
	}

}(xhr)



