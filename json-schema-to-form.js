
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

			var fieldset = El("fieldset.grid-1", El("legend", schema.title || _link.title))

			drawSchema(schema, null, fieldset, model.data || {}, null, scope)

			fieldset.to(form)

			form.on("submit", function() {
				var data = JSON.serializeForm(this)
				, _scope = JSON.merge({}, scope.route, model.data)
				applySchema(schema, data)

				xhr.makeReq(
					_link.method || "POST",
					_link.href.format(_scope),
					data,
					function(err, res, xhr) {
						if (err) {
							Mediator.emit("error", err)
						} else {
							Mediator.emit("response:" + link, err, res, xhr)
						}
					}
				)
			})

		})

		function drawSchema(schema, key, fieldset, data, namePrefix, scope) {
			var alternatives, keys, i, root, tmp
			, alSelected
			, count = 0

			if (schema.properties || schema.anyOf) {
				if (key !== null) {
					namePrefix = namePrefix ? namePrefix + "[" + key + "]" : key
					if (schema.title) {
						fieldset.append(El(template + "-subheader", schema.title))
					}
				}
			}

			if (schema.properties) {
				Object.each(schema.properties, function(schema, _key) {
					drawSchema(
						schema,
						_key,
						fieldset,
						(schema.type == "object" || schema.properties || schema.anyOf ? data[_key] : data) || {},
						namePrefix,
						scope
					)
				})
				if (!schema.anyOf) return
			}

			if (schema.anyOf) {
				var title
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
					root = El(".row")
					tmp = JSON.clone(tmp)
					keys.each(function(val) {
						title = title || tmp.properties[val].title
						tmp.properties[val]["enum"].each(function(val) {
							key.push(val)
							alternatives[val] = root
						})
						delete tmp.properties[val]
					})
					drawSchema(tmp, null, root, data, namePrefix, scope)
				}

				schema = {
					title: title,
					"enum": key
				}
				key = keys[0]
			}


			var row = El(template + (
				schema["ui:el"] ? "-" + schema["ui:el"] :
				schema["enum"] ? "-enum" :
				schema.type == "boolean" || schema.type == "array" ? "-" + schema.type :
				schema.resourceCollection ? "-list" :
				"" ))
			, sc = El.scope(row, scope)
			, val = (key == null ? data : data[key])

			if (val == null) val = schema["default"]

			sc.name = _(schema.title || key || "")
			sc.value = val
			sc.add = function(e) { add() }
			sc.del = del

			JSON.merge(sc, schema)

			fieldset.append(row.render(sc))

			if (schema.type == "array") {
				var content = row.find(".js-items")
				, hidden = El("input[type=hidden]").to(content)

				key = namePrefix ? namePrefix + "[" + key + "]" : key

				hidden.attr("name", key)

				if (Array.isArray(schema.items)) {
					throw "Not implemented"
					schema.items.each(function(val, i) {
					})
				} else if (schema.resourceCollection) {
					var _scope = JSON.merge({}, scope.route, data)
					api(schema.resourceCollection.format(_scope)).each(add2)
				} else if (Array.isArray(val) && val.length) {
					val.each(add)
				} else if (schema.minItems) {
					for (i = schema.minItems; i--; ) {
						add()
					}
				}
				return
			}

			function add2(val, i) {
				var map = {}
				map[i] = sc.value && sc.value.indexOf(val.data.id) != -1 || null

				drawSchema(
					{ type: "boolean", title: val.data.name },
					"" + i,
					content,
					map,
					key,
					scope
				)
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
					key + "[" + (count++) + "]",
					scope
				)
			}

			var field = row.find(".field")
			field.attr("name", namePrefix && key ? namePrefix + "[" + key + "]" : namePrefix || key)

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

	JSON.applySchema = applySchema

	function applySchema(schema, data, _required) {
		var tmp
		, type = schema.type
		, required = _required || schema.required

		if (schema.anyOf) {
			schema.anyOf.each(function(schema) {
				var i, tmp, tmp2
				, keys = Object.keys(schema.properties)

				for (i = 0; tmp = keys[i++]; ) {
					tmp2 = schema.properties[tmp]["enum"]
					if (tmp2 && tmp2.indexOf(data[tmp]) == -1) {
						return
					}
				}
				applySchema(schema, data)
			})
		}
		if (Array.isArray(schema.enum)) {
			if (schema.enum.indexOf(data) === -1) {
				for (var i = schema.enum.length; i--; ) {
					if (schema.enum[i] == data) {
						data = schema.enum[i]
						break
					}
				}
			}
		} else if (type == "number") {
			data = parseFloat( (data + "").replace(",", ".") )
		} else if (type == "integer") {
			data |= 0
		} else if (type == "boolean" ) {
			data = data ? true : required ? false : null
		} else if (type == "date-time") {
			data = data.date()
		} else if (schema.type == "array" ) {
			if (Array.isArray(schema.items)) {
				throw "Not implemented"
			}

			data = Array.isArray(data) ?
				data.reduce(function(memo, item) {
					if (item !== void null) {
						item = applySchema(schema.items, item)
						memo.push(item)
					}
					return memo
				}, []) :
				null
		} else {
			var reqArr = Array.isArray(schema.required) && schema.required
			Object.each(schema.properties, function(propSchema, prop) {
				if (data[prop] !== void 0) {
					data[prop] = applySchema(
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
}()
