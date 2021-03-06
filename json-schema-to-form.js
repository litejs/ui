
/* litejs.com/MIT-LICENSE.txt */

!function() {
	var dummy = El("div")
	, isArray = Array.isArray

	El.bindings.schemaToForm = schemaToForm
	schemaToForm.once = 1

	function allOf(schema) {
		return isArray(schema.allOf) ?
		schema.allOf.reduce(function(memo, item) {
			return JSON.mergePatch(memo, item)
		}, {}):
		schema
	}

	function schemaToForm(form, schema, link, template, event) {
		var scope = this
		, model = scope.model || null

		link = link || "self"

		form.fill = function(model) {
			View.blur()
			form.fillForm(model)
		}

		xhr.getSchema(schema, function(err, schema) {
			var i, selfHref, fieldset
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

			form.fillForm = fillForm
			function fillForm(model) {
				if (fieldset) El.kill(fieldset)
				fieldset = El(template + "-fieldset")
				drawSchema(schema, null, fieldset, model && model.data || null, null, scope, model)
				El.append(form, fieldset)
			}

			fillForm(model)

			El.on(form, "submit", function() {
				var data = El.val(this)
				, _scope = Object.assign({}, scope.params, model && model.data)
				, href = (_link.href || selfHref).format(_scope)
				JSON.schemaApply(schema, data)

				if (model) {
					var changed = []
					, clone = JSON.clone(model.data)
					JSON.mergePatch(clone, data, changed)

					if (changed.length) {
						data = JSON.tr(changed)(data)
					} else {
						data = null
					}
				}

				try { document.activeElement.blur() } catch(e) {}

				if (data) View.emit(event || "makeReq", _link, href, data)
			})

		})

		function drawSchema(schema, key, fieldset, data, namePrefix, scope, model, def) {
			var alternatives, keys, i, root, tmp
			, alSelected
			, count = 0

			schema = allOf(schema)

			if (schema.properties || schema.anyOf) {
				if (key !== null) {
					namePrefix = namePrefix ? namePrefix + "[" + key + "]" : key
					if (schema.title) {
						El.append(fieldset, El.append(El(template + "-subheader"), schema.title))
					}
				}
			}

			if (schema.properties) {
				Object.each(schema.properties, function(sub, _key) {
					drawSchema(
						sub,
						_key,
						fieldset,
						data === null ? null : (sub.type == "object" || sub.properties || sub.anyOf ? data[_key] : data) || {},
						namePrefix,
						scope,
						model,
						def
					)
				})
				if (!schema.anyOf) return
			}

			if (isArray(schema.anyOf)) {
				var title
				schema = schema.anyOf.map(allOf)
				key = []

				alternatives = {}
				keys = Object.keys(schema[0].properties)

				for (i = 0; tmp = schema[i++]; ) {
					keys = keys.filter(function(val) {
						var t = tmp.properties[val]
						return t && (
							t["enum"] ||
							t.type == "boolean" && typeof t["default"] == t.type
						)
					})
				}

				scope.selected = {}
				for (i = 0; tmp = schema[i++]; ) {
					root = El(".grid.b2.w12")
					tmp = JSON.clone(tmp)
					keys.each(function(val) {
						var prop = tmp.properties[val]
						title = title || prop.title
						if (prop.type == "boolean") {
							setAlt(prop["default"])
						} else {
							prop["enum"].each(setAlt)
						}
						delete tmp.properties[val]
					})
					function setAlt(val) {
						key.push(val)
						alternatives[val] = root
					}
					root._draw = [tmp, null, root, data, namePrefix, scope, model]
				}

				schema = typeof key[0] == "boolean" ? JSON.clone(schema[0].properties[keys[0]]) : {
					title: title,
					"enum": key
				}
				key = keys[0]
			}

			var ro = model && model.acl && !model.acl("write", key || namePrefix) ? "-ro" : ""


			var row = El(template + (
				schema["ui:el"] && El.cache[template + "-" + schema["ui:el"]] ? "-" + schema["ui:el"] :
				schema["enum"] ? "-enum" + ro :
				schema.type == "boolean" ? "-boolean" + ro :
				schema.type == "array" ? "-" + schema.type :
				schema.patternProperties ? "-array" :
				schema.resourceCollection ? "-list" + ro :
				ro ))
			, sc = El.scope(row, scope)
			, val = data === null ? (def && def[key] || schema["default"]) : (key == null ? data : data[key])

			sc.name = key || ""
			sc.value = val
			sc.add = function(e) {
				if (schema.patternProperties) {
					var key = Object.keys(schema.patternProperties)[0]
					app.emit("confirm", " ", {
						body: "Enter key", code:1
						}, function(action, code) {
						add(null, schema.patternProperties[key], code)
					})
				} else {
					add()
				}
			}
			sc.del = del
			if (ro !== "") sc.noAdd = true

			Object.assign(sc, schema)

			if (schema.type == "array" || schema.patternProperties) {
				var content = El.find(row, ".js-items")
				, hidden = El("input[type=hidden]")

				El.append(content, hidden)

				key = namePrefix ? namePrefix + "[" + key + "]" : key

				El.attr(hidden, "name", key)

				if (isArray(schema.items)) {
					sc.noAdd = true
					schema.items.each(function(item, i) {
						add(val && val[i], item)
					})
				} else if (schema.patternProperties) {
					hidden.valObject = null
					if (val) Object.each(schema.patternProperties, function(sub, _re) {
						var re = RegExp(_re)
						Object.each(val, function(val, key) {
							if (re.test(key)) {
								add(val, sub, key)
							}
						})
					})
				} else if (schema.resourceCollection) {
					api(schema.resourceCollection.format(scope.params, scope)).each(add2)
				} else if (isArray(val) && val.length) {
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
					data && map || null,
					key,
					scope,
					model
				)
			}

			function add(val, itemSchema, param) {
				var root = El(template + "-array-item")
				, rootScope = El.scope(root, sc)
				rootScope.key = param
				if (itemSchema && param) {
					rootScope.title = _(itemSchema.title, rootScope)
				}
				El.append(content, root)
				El.render(root, rootScope)

				root = El.find(root, ".js-item") || root


				drawSchema(
					itemSchema || schema.items,
					null,
					root,
					data && val || null,
					key + "[" + (param || count++) + "]",
					scope,
					model,
					val
				)
			}

			var field = El.find(row, ".field")
			if (field) El.attr(field, "name", namePrefix && key ? namePrefix + "[" + key + "]" : namePrefix || key)

			if (val !== void 0 && field) {
				El.val(field, val)
			}

			if (schema.readonly) {
				field.disabled = true
			}

			if (alternatives) {
				El.on(field, "change click", alUp)
				alUp()
			}

			function alUp() {
				var val = El.val(field)
				if (typeof val !== "string") val = !!val
				scope["selected"][key] = val
				if (alSelected != alternatives[val]) {
					if (alSelected) {
						El.append(dummy, alSelected)
					}
					alSelected = alternatives[val]
					if (alSelected._draw) {
						drawSchema.apply(null, alSelected._draw)
						alSelected._draw = null
					}
					El.append(fieldset, (alSelected = alternatives[val]), row.nextSibling)
				} else {
					El.render(alSelected, scope)
				}
			}
		}
	}

	function del() {
		El.kill(El.closest(this, ".js-del"))
	}
}()
