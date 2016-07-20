
!function() {
	var dummy = El("div")

	El.bindings.schemaToForm = schemaToForm
	schemaToForm.once = 1

	function schemaToForm(schema, link, template) {
		var form = this
		, scope = El.scope(form)
		, model = scope.model || { get: function(){return ""}, data:{} }

		link = link || "self"

		xhr.getSchema(schema, function(err, schema) {
			var i
			, _link = schema

			if (schema.links) for (i = 0; _link = schema.links[i++]; ) {
				if (_link.rel == link) {
					schema = _link.schema || schema
					break
				}
			}

			if (Array.isArray(schema.allOf)) {
				schema.allOf.each(function(x) {
					JSON.mergePatch(schema, x)
				})
				delete schema.allOf
			}

			var fieldset = El("fieldset.grid-1", El("legend", schema.title || _link.title)).to(form)

			drawSchema(schema, null, fieldset, model.data || {})

			form.on("submit", function() {
				var data = JSON.serializeForm(this)
				applySchema(schema, data)

				xhr.makeReq(
					_link.method || "POST",
					_link.href.format(model.data),
					data,
					function() {
						Mediator.emit("up")
					}
				)
			})

			El("input[type=submit][value=Ok]").to(form)
		})

		function drawSchema(schema, key, fieldset, data, namePrefix) {
			var alternatives, keys, i, root, tmp
			, alSelected
			, count = 0

			if (schema.properties) {
				if (key !== null) {
					namePrefix = namePrefix ? namePrefix + "[" + key + "]" : key
				}
				Object.each(schema.properties, function(schema, _key) {
					drawSchema(
						schema,
						_key,
						fieldset,
						schema.type == "object" ? data[_key] : data,
						namePrefix
					)
				})
				if (!schema.anyOf) return
			}

			if (schema.anyOf || key == "anyOf") {
				schema = schema.anyOf || schema
				key = []

				alternatives = {}
				keys = Object.keys(schema[0].properties)

				for (i = 0; tmp = schema[i++]; ) {
					keys = keys.filter(function(val) {
						return tmp.properties[val] && tmp.properties[val]["enum"]
					})
				}

				for (i = 0; tmp = schema[i++]; ) {
					root = new El.wrap([])
					tmp = Object.clone(tmp)
					keys.each(function(val) {
						tmp.properties[val]["enum"].each(function(val) {
							key.push(val)
							alternatives[val] = root
						})
						delete tmp.properties[val]
					})
					drawSchema(tmp, null, root, data, namePrefix)
				}

				schema = {"enum": key}
				key = keys[0]
			}

			var row = El(template + (
				schema.resourceCollection ? "-list" :
				schema["enum"] ? "-enum" :
				schema.type == "boolean" || schema.type == "array" ? "-" + schema.type :
				"" ))
			, sc = El.scope(row, scope)
			, val = data[key] || schema["default"]

			sc.name = schema.title || key
			sc.value = val
			sc.add = add
			sc.del = del

			JSON.merge(sc, schema)

			fieldset.append(row.render(sc))

			if (schema.type == "array") {
				var content = row.find(".js-items")
				, hidden = El("input[type=hidden]").to(content)

				hidden.attr("name", namePrefix ? namePrefix + "[" + key + "]" : key)

				if (Array.isArray(schema.items)) {
					throw "Not implemented"
					schema.items.each(function(val, i) {
					})
				} else if (Array.isArray(val) && val.length) {
					val.each(add)
				} else if (schema.minItems) {
					for (i = schema.minItems; i--; ) {
						add()
					}
				}
				return
			}

			function add(val) {
				var root = El(template + "-array-item").to(content)
				, rootScope = El.scope(root, sc)

				root.render(rootScope)

				root = root.find(".js-item") || root

				drawSchema(
					schema.items,
					null,
					root,
					val || {},
					key + "[" + (count++) + "]"
				)
			}

			var field = row.find(".field")
			field.attr("name", namePrefix ? namePrefix + "[" + key + "]" : key)

			if (val !== void 0) {
				field.val(val)
			}

			if (schema.readonly) {
				field.disabled = true
			}

			if (alternatives) {
				field.on("change", alUp)
				alUp()
			}

			function alUp() {
				var val = field.val()
				if (alSelected != alternatives[val]) {
					if (alSelected) {
						alSelected.to(dummy)
					}
					fieldset.append((alSelected = alternatives[val]), row.nextSibling)
				}
			}
		}
	}

	function del() {
		this.closest(".js-del").kill()
	}

	function applySchema(schema, data) {
		if (schema.anyOf) {
			schema.anyOf.each(function(schema) {
				var i, tmp
				, keys = Object.keys(schema.properties)

				for (i = 0; tmp = keys[i++]; ) {
					if (schema.properties[tmp]["enum"] && schema.properties[tmp]["enum"].indexOf(data[tmp]) == -1) {
						return
					}
				}
				applySchema(schema, data)
			})
		} else Object.each(schema.properties, function(val, key) {
			fixType(data, key, val)
		})
	}

	function fixType(data, key, schema) {
		var val = data[key]

		if (val !== void 0) {
			if (typeof val !== schema.type) {
				if (schema.type == "number") {
					data[key] = parseFloat( (val + "").replace(",", ".") )
				}
				if (schema.type == "integer") {
					data[key] |= 0
				}
				if (schema.type == "boolean" ) {
					data[key] = val ? true : schema.required ? false : null
				}
				if (schema.type == "date-time") {
					data[key] = val.date()
				}
				if (schema.type == "array" ) {
					if (Array.isArray(schema.items)) {
						throw "Not implemented"
					}

					data[key] = Array.isArray(data[key]) ?
						data[key].reduce(function(memo, item) {
							if (item !== void null) {
								applySchema(schema.items, item)
								memo.push(item)
							}
							return memo
						}, []) :
						null
				}
			} else if (schema.type == "object" ) {
				applySchema(schema, data[key])
			}
		}
	}
}()
