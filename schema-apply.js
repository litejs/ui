
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
					if (tmp2 && tmp2.indexOf(data[tmp]) == -1) {
						return
					}
				}
				schemaApply(schema, data)
			})
		}
		if (Array.isArray(tmp = schema["enum"])) {
			if (tmp.indexOf(data) === -1) {
				for (var i = tmp.length; i--; ) {
					if (tmp[i] == data) {
						data = tmp[i]
						break
					}
				}
			}
		} else if (type == "string") {
			if (type !== actualType) data = "" + data
		} else if (type == "number") {
			data = parseFloat( (data + "").replace(",", ".") )
		} else if (type == "integer") {
			data |= 0
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
		}

		if (type == "number" || type == "integer") {
			tmp = schema.minimum
			if (typeof tmp == "number" && data < tmp) {
				data = tmp
			}
			tmp = schema.maximum
			if (typeof tmp == "number" && data > tmp) {
				data = tmp
			}
		}

		return data
	}
}(this.JSON || this)

