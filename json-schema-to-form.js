
!function() {
	var dummy = El("div")

	El.bindings.schemaToForm = schemaToForm
	schemaToForm.once = 1

	function allOf(schema) {
		return Array.isArray(schema.allOf) ?
		schema.allOf.reduce(function(memo, item) {
			return JSON.mergePatch(memo, item)
		}, {}):
		schema
	}

	function schemaToForm(schema, link, template, event) {
		var form = this
		, scope = El.scope(form)
		, model = scope.model || null

		link = link || "self"

		xhr.getSchema(schema, function(err, schema) {
			var i, selfHref
			, _link = schema

			if (schema.links) for (i = 0; _link = schema.links[i++]; ) {
				if (_link.rel == "self") {
					selfHref = _link.href
				}
				if (_link.rel == link) {
					schema = _link.schema || schema
					break
				}
			}

			var fieldset = El("fieldset.grid-1", El("legend", schema.title || _link.title))

			drawSchema(schema, null, fieldset, model && model.data || null, null, scope)

			El.to(fieldset, form)

			El.on(form, "submit", function() {
				var data = JSON.serializeForm(this)
				, _scope = JSON.merge({}, scope.route, model && model.data)
				, href = (_link.href || selfHref).format(_scope)
				applySchema(schema, data)

				try { document.activeElement.blur() } catch(e) {}

				Mediator.emit(event || "makeReq", _link, href, data)
			})

		})

		function drawSchema(schema, key, fieldset, data, namePrefix, scope, def) {
			var alternatives, keys, i, root, tmp
			, alSelected
			, count = 0

			schema = allOf(schema)

			if (schema.properties || schema.anyOf) {
				if (key !== null) {
					namePrefix = namePrefix ? namePrefix + "[" + key + "]" : key
					if (schema.title) {
						El.append(fieldset, El(template + "-subheader", schema.title))
					}
				}
			}

			if (schema.properties) {
				Object.each(schema.properties, function(schema, _key) {
					drawSchema(
						schema,
						_key,
						fieldset,
						data === null ? null : (schema.type == "object" || schema.properties || schema.anyOf ? data[_key] : data) || {},
						namePrefix,
						scope,
						def
					)
				})
				if (!schema.anyOf) return
			}

			if (schema.anyOf) {
				var title
				schema = schema.anyOf.map(allOf)
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
					root._draw = [tmp, null, root, data, namePrefix, scope]
				}

				schema = {
					title: title,
					"enum": key
				}
				key = keys[0]
			}


			var row = El(template + (
				schema["ui:el"] && El.cache[template + "-" + schema["ui:el"]] ? "-" + schema["ui:el"] :
				schema["enum"] ? "-enum" :
				schema.type == "boolean" || schema.type == "array" ? "-" + schema.type :
				schema.resourceCollection ? "-list" :
				"" ))
			, sc = El.scope(row, scope)
			, val = data === null ? (def && def[key] || schema["default"]) : (key == null ? data : data[key])

			sc.name = _(schema.title || key || "")
			sc.value = val
			sc.add = function(e) { add() }
			sc.del = del

			JSON.merge(sc, schema)

			if (schema.type == "array") {
				var content = El.find(row, ".js-items")
				, hidden = El.to(El("input[type=hidden]"), content)

				key = namePrefix ? namePrefix + "[" + key + "]" : key

				El.attr(hidden, "name", key)

				if (Array.isArray(schema.items)) {
					sc.noAdd = true
					schema.items.each(function(item, i) {
						add(val && val[i], item)
					})
				} else if (schema.resourceCollection) {
					var _scope = JSON.merge({}, scope.route, data)
					api(schema.resourceCollection.format(_scope)).each(add2)
				} else if (Array.isArray(val) && val.length) {
					val.each(function(v) { add(v) })
				} else if (schema.minItems) {
					for (i = schema.minItems; i--; ) {
						add()
					}
				}
				El.render(row, sc)
				El.append(fieldset, row)
				return
			}
			El.render(row, sc)
			El.append(fieldset, row)

			function add2(val, i) {
				var map = {}
				map[i] = sc.value && sc.value.indexOf(val.data.id) != -1 || null

				drawSchema(
					{ type: "boolean", title: val.data.name },
					"" + i,
					content,
					data === null ? null : map,
					key,
					scope
				)
			}

			function add(val, itemSchema) {
				var root = El.to(El(template + "-array-item"), content)
				, rootScope = El.scope(root, sc)

				El.render(root, rootScope)

				root = El.find(root, ".js-item") || root

				drawSchema(
					itemSchema || schema.items,
					null,
					root,
					data === null ? null : val || {},
					key + "[" + (count++) + "]",
					scope,
					val
				)
			}

			var field = El.find(row, ".field")
			El.attr(field, "name", namePrefix && key ? namePrefix + "[" + key + "]" : namePrefix || key)

			if (val !== void 0) {
				El.val(field, val)
			}

			if (schema.readonly) {
				field.disabled = true
			}

			if (alternatives) {
				El.on(field, "change", alUp)
				alUp()
			}

			function alUp() {
				var val = El.val(field)
				if (alSelected != alternatives[val]) {
					if (alSelected) {
						El.to(alSelected, dummy)
					}
					alSelected = alternatives[val]
					if (alSelected._draw) {
						drawSchema.apply(null, alSelected._draw)
						alSelected._draw = null
					}
					El.append(fieldset, (alSelected = alternatives[val]), row.nextSibling)
				}
			}
		}
	}

	function del() {
		El.kill(El.closest(this, ".js-del"))
	}

	JSON.applySchema = applySchema

	function applySchema(schema, data, _required) {
		var tmp
		, type = schema.type
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
				applySchema(schema, data)
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
						item = applySchema(sc, item)
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
