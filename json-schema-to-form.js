
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

			drawProp(schema, null, fieldset, model.data || {})

			form.on("submit", function() {
				var data = JSON.serializeForm(this)
				applySchema(data, schema)

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

		function drawProp(prop, key, fieldset, data, namePrefix) {
			var alternatives, keys, i, root, tmp
			, alSelected
			, count = 0

			if (prop.type == "object") {
				Object.each(prop.properties, function(val, key) {
					drawProp(val, key, fieldset, data || {}, namePrefix)
				})
				return
			}

			if (key == "anyOf" && Array.isArray(prop)) {
				key = []

				alternatives = {}
				keys = Object.keys(prop[0])

				for (i = 0; tmp = prop[i++]; ) {
					keys = keys.filter(function(val) {
						return tmp[val] && tmp[val]["enum"]
					})
				}

				for (i = 0; tmp = prop[i++]; ) {
					root = new El.wrap([])
					tmp = Object.clone(tmp)
					keys.each(function(val) {
						tmp[val]["enum"].each(function(val) {
							key.push(val)
							alternatives[val] = root
						})
						delete tmp[val]
					})
					Object.each(tmp, function(val, key) {
						drawProp(val, key, root, data, namePrefix)
					})
				}

				prop = {"enum": key}
				key = keys[0]
			}

			var val = data[key] || prop["default"]
			, row = El(template + (
				prop.resourceCollection ? "-list" :
				prop["enum"] ? "-enum" :
				prop.type == "boolean" || prop.type == "array" ? "-" + prop.type :
				"" ))
			, sc = El.scope(row, scope)

			sc.name = prop.title || key
			sc.value = val
			sc.add = add
			sc.del = del

			Object.merge(sc, prop)

			fieldset.append(row.render(sc))

			if (prop.type == "array") {
				var content = row.find(".js-items") || row

				if (Array.isArray(val) && val.length) {
					val.each(add)
				} else if (prop.minItems) {
					for (i = prop.minItems; i--; ) {
						add()
					}
				}
				return
			}

			function add(val) {
				var root = El(template + "-array-item.js-item").to(content)
				, rootScope = El.scope(root, sc)

				root.render(rootScope)

				root = root.find(".js-item") || root

				if (Array.isArray(prop.items)) {
					drawProp(
						prop.items,
						"anyOf",
						root,
						val || {},
						key + "[" + (count++) + "]"
					)
				} else if (prop.items.type == "object") {
					drawProp(
						prop.items,
						count,
						root,
						val || {},
						key + "[" + (count++) + "]"
					)
				} else {
					drawProp(
						prop.items,
						count++,
						root,
						data[key] || {},
						key
					)
				}
			}

			var field = row.find(".field")
			field.attr("name", namePrefix ? namePrefix + "[" + key + "]" : key)

			if (val !== void 0) {
				field.val(val)
			}

			if (prop.readonly) {
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
		this.closest(".js-item").kill()
	}

	function applySchema(data, schema) {
		Object.each(schema.properties, function(val, key) {
			fixType(data, key, val)
		})
	}

	function fixType(data, key, schema) {
		var val = data[key]

		if (key == "anyOf") {
			schema.each(function(schema) {
				var i, tmp
				, keys = Object.keys(schema)

				for (i = 0; tmp = keys[i++]; ) {
					if (schema[tmp]["enum"] && schema[tmp]["enum"].indexOf(data[tmp]) == -1) return
				}
				applySchema(data, { properties: schema})
			})
		} else if (val !== void 0 && typeof val !== schema.type) {
			if (schema.type == "number") {
				data[key] = parseFloat( (val + "").replace(",", ".") )
			}
			if (schema.type == "integer") {
				data[key] |= 0
			}

			if (schema.type == "array" ) {
				var arraySchema = Array.isArray(schema.items) ? {anyOf: schema.items} : schema.items
				data[key] = data[key].reduce(function(memo, item) {
					if (item !== void null) {
						applySchema(item, arraySchema)
						memo.push(item)
					}
					return memo
				}, [])
			}

			if (schema.type == "boolean" ) {
				data[key] = val ? true : schema.required ? false : null
			}

			if (schema.type == "date-time") {
				data[key] = val.date()
			}

			if (schema.type == "object" ) {

			}
		}
	}
}()
