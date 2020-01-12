
/* litejs.com/MIT-LICENSE.txt */

!function(exports) {
	exports.schemaApply = schemaApply

	function allOf(schema) {
		return Array.isArray(schema.allOf) ?
		schema.allOf.reduce(function(memo, item) {
			return JSON.mergePatch(memo, item)
		}, {}):
		schema
	}

	function schemaApply(schema, data, _required) {
		var tmp
		, type = schema.type
		, actualType = typeof data
		, required = _required || schema.required

		schema = allOf(schema)

		if (schema.anyOf) {
			schema.anyOf.map(allOf).each(function(schema) {
				var i, tmp, tmp2
				, keys = Object.keys(schema.properties)

				for (i = 0; tmp = keys[i++]; ) {
					tmp2 = schema.properties[tmp]["enum"]
					if (tmp2 && tmp2.indexOf(data[tmp]) < 0) {
						return
					}
				}
				schemaApply(schema, data)
			})
		}
		if (Array.isArray(tmp = schema["enum"])) {
			if (tmp.indexOf(data) < 0) {
				for (var i = tmp.length; i--; ) {
					if (tmp[i] == data) {
						data = tmp[i]
						break
					}
				}
			}
		} else if (type == "string") {
			if (type !== actualType) data = "" + data
		} else if (type === "number" || type == "integer") {
			data = (data + "").replace(",", ".")
			data = type === "number" ? parseFloat(data) : parseInt(data, 10)

			if (typeof(tmp = schema.multipleOf) == "number") {
				data -= data % tmp
			}
			if (typeof(tmp = schema.minimum) == "number" && data < tmp) {
				data = tmp
			}
			if (typeof(tmp = schema.maximum) == "number" && data > tmp) {
				data = tmp
			}
		} else if (type == "boolean" ) {
			data = data ? true : required ? false : null
		} else if (type == "date-time") {
			data = data.date()
		} else if (schema.type == "array" ) {
			var itemSchema = Array.isArray(schema.items) && schema.items

			data = Array.isArray(data) ?
				data.reduce(function(memo, item, idx) {
					var sc = itemSchema ? itemSchema[idx] : schema.items
					if (item !== void null && sc) {
						item = schemaApply(sc, item)
						memo.push(item)
					}
					return memo
				}, []) :
				null
		} else {
			var reqArr = Array.isArray(schema.required) && schema.required
			Object.each(schema.properties, function(propSchema, prop) {
				if (data[prop] !== void 0) {
					data[prop] = schemaApply(
						propSchema,
						data[prop],
						reqArr && reqArr.indexOf(prop) > -1
					)
				}
			})
			if (schema.patternProperties) {
				tmp = schema.properties || {}
				Object.each(schema.patternProperties, function(propSchema, _re) {
					var re = RegExp(_re)
					Object.each(data, function(val, prop) {
						if (!tmp[prop] && re.test(prop)) data[prop] = schemaApply(
							propSchema,
							data[prop],
							reqArr && reqArr.indexOf(prop) > -1
						)
					})
				})
			}
		}

		return data
	}
}(this.JSON || this)

