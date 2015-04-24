



!function(exports) {
	var pending
	, cache = {}

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
	 */

	function getSchema(ref, callback, bundle) {
		var parts = ref.split("#")
		, file = parts[0]
		, path = decodeURIComponent((parts[1] || "").replace(/\+/g, " "))

		if (cache[file]) return callback && callback(null, JSON.pointer(cache[file], path))
		if (pending) return pending.push(arguments)

		if (bundle) pending = []

		xhr("GET", file, function(err, text, i) {
			if (err) return callback(err)
			var schema = cache[file] = JSON.parse(text)
			, refs = []
			findSubschemas(schema, refs)
			if (refs[0]) resolveRefs(refs, callback, schema)
			else callback && callback(null, schema)

			if (bundle && pending) {
				var arr = pending
				pending = null
				for (i=0; bundle=arr[i++]; ) {
					getSchema.apply(null, bundle)
				}
			}
		})
	}

	function findSubschemas(obj, refs, key, val) {
		for (key in obj) if (val = obj[key]) {
			if (val.id) {
				findSubschemas(cache[val.id] = val, refs)
			}
			if (val.$ref) {
				refs.push(val.$ref, obj, key)
			}
		}
	}

	function resolveRefs(refs, callback, schema) {
		// TODO:2014-12-23:lauri:resolve multiple refs
		// TODO:2014-12-23:lauri:resolve refs from other files
		function next() {
			callback && callback(null, schema)
		}
		for (var ref, i = 0; ref = refs[i];i+=3) !function(ref, i) {
			getSchema(ref, function(err, schema) {
				refs[i+1][refs[i+2]] = schema
				next()
			})
		}(ref, i)
	}


}(xhr)



