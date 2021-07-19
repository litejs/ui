
/* litejs.com/MIT-LICENSE.txt */



!function(bindings) {
	var hasOwn = Object.prototype.hasOwnProperty
	, slice = Array.prototype.slice

	fixReadonlyCheckbox.once =
	bindingEvery.once =
	emitForm.once =
	bindingFn.once =
	bindingsEach.raw = bindingsEach.once =
	true

	bindings.every = bindingEvery
	function bindingEvery(el, list, attrName) {
		var len = 0
		, data = this
		, parent = el.parentNode
		, comm = document.createComment("every " + (list.name || list.length))
		, nodes = []

		parent.replaceChild(comm, el)

		if (list) {
			if (typeof list === "string") {
				data.model.on("change:" + list, render)
				El.on(parent, "kill", function() {
					data.model.off("change:" + list, render)
				})
				render()
			} else if (list.eachLive) {
				list.eachLive(add, remove, list)
				El.on(parent, "kill", function() {
					list.off("add", add, list).off("remove", remove, list)
				})
			} else {
				comm.render = render
				render()
			}
		}
		return true

		function render() {
			for (; len; len--) {
				remove(len)
			}
			_list = typeof list === "string" ? data.model.get(list, []) : list
			if (typeof _list === "string") _list.split(",")
			Object.each(_list, add, (
				_list.constructor === Object ? Object.keys(_list) : _list
			))
		}

		function add(item, i) {
			len++
			var up
			, clone = el.cloneNode(true)
			, scope = El.scope(clone, data)
			, before = nodes[i] || comm
			if (!before.parentNode) return
			nodes.splice(i, 0, clone)
			scope.i = i
			scope._scope = scope
			scope.len = this.length
			scope[attrName || "item"] = item
			El.append(before.parentNode, clone, before)
			El.render(clone, scope)
			if (typeof item.on === "function") {
				item.on("change", up = El.render.bind(clone, clone))
				El.on(clone, "kill", function() {
					item.off("change", up)
				})
			}
		}

		function remove(item, i) {
			El.kill(nodes.splice(i, 1)[0])
		}
	}

	bindings.fixReadonlyCheckbox = fixReadonlyCheckbox
	function fixReadonlyCheckbox(el) {
		El.on(el, "click pointerdown", function(e) {
			if ((this.firstChild || this).readOnly) {
				return Event.stop(e)
			}
		})
	}

	bindings.fn = bindingFn
	function bindingFn(el, fn) {
		return fn.apply(el, slice.call(arguments, 3))
	}

	bindings["if"] = bindingsIf
	function bindingsIf(el, enabled) {
		var parent = el.parentNode
		, scope = this
		if (enabled) {
			parent || el._ifComm && el._ifComm.parentNode.replaceChild(el, el._ifComm)
		} else {
			if (parent) {
				if (!el._ifComm) {
					El.on(el, "kill", El.kill.bind(el, el._ifComm = document.createComment("if")))
					el._ifComm.render = function() {
						El.render(el, scope)
					}
				}
				parent.replaceChild(el._ifComm, el)
			}
			return true
		}
	}

	bindings.is = function bindingIs(node, model, path, list, state) {
		var match
		, scope = this
		if (typeof model === "string") {
			state = list
			list = path
			path = model
			model = scope.model
		}
		if (model && path) {
			match = i18n.pick(state !== match ? state : model.get(path), list)
			path += "-" + list
			El.cls(node, node["_is-" + path], 0)
			El.cls(node, node["_is-" + path] = match && "is-" + match)
		}
	}

	bindings.emitForm = emitForm
	function emitForm(el, ev, a1, a2, a3, a4) {
		El.on(el, "submit", function(e) {
			var data = El.val(el)
			View.emit(ev, e, data, a1, a2, a3, a4)
			return Event.stop(e)
		})
	}

	function getChilds(node) {
		var child
		, childs = node._childs
		if (!childs) {
			for (node._childs = childs = []; child = node.firstChild;) {
				childs.push(child);
				node.removeChild(child)
			}
		}
		return childs
	}

	bindings.each = bindingsEach

	function bindingsEach(el, expr) {
		var node = el
		, child = getChilds(node)[0]
		, match = /^\s*(\w+) in (\w*)(.*)/.exec(expr)
		, fn = "with(data){var out=[],loop={i:0,offset:0},_1,_2=" + match[2]
		+ match[3].replace(/ (limit|offset):\s*(\d+)/ig, ";loop.$1=$2")
		+ ";if(_2)for(_1 in _2)if(hasOwn.call(_2,_1)&&!(loop.offset&&loop.offset--)){"
		+     "loop.i++;"
		+     "if(loop.limit&&loop.i-loop.offset>loop.limit)break;"
		+     "var clone=el.cloneNode(true)"
		+     ",scope=El.scope(clone,data);"
		+     "scope.loopKey=loop.key=_1;"
		+     "scope.loop=loop;"
		+     "scope." + match[1] + "=_2[_1];"
		+     "out.push(clone);"
		+ "};return out}"

		var childs = Function("hasOwn,el,data", fn)(hasOwn, child, this)

		El.append(El.empty(node), childs)
		El.render(node)
		return node
	}

	bindings.focus = function(el) {
		el.focus()
	}

	bindings.href = function(el, url) {
		if (url) {
			var chr = url.charAt(0)
			El.attr(el, "href", chr === "+" || chr === "%" ? "#" + View.expand(url) : url)
		}
	}
}(El.bindings)

