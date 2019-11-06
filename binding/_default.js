
/* litejs.com/MIT-LICENSE.txt */



!function(bindings) {
	var hasOwn = Object.prototype.hasOwnProperty
	, slice = Array.prototype.slice

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

		parent.replaceChild(comm, el)

		if (list) {
			if (typeof list === "string") {
				data.model.on("change:" + list, render)
				render()
			} else if (list.eachLive) {
				list.eachLive(add, remove, list)
			} else {
				comm.render = render
				render()
			}
		}
		return true

		function render() {
			for (; len; len--) {
				El.kill(comm.previousSibling)
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
			scope.i = i
			scope.len = this.length
			scope[attrName || "item"] = item
			El.append(parent, clone, comm)
			El.render(clone, scope)
			if (typeof item.on === "function") {
				item.on("change", up = El.render.bind(clone, clone))
				El.on(clone, "kill", function() {
					item.off("change", up)
				})
			}
		}

		function remove(pos) {
			for (var el = comm, i = pos + 1; i--; ) {
				el = el.previousSibling
			}
			El.kill(el)
		}
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
		var i, match, val
		, scope = this
		if (typeof model === "string") {
			state = list
			list = path
			path = model
			model = scope.model
		}
		if (model && path) {
			match = val = state || model.get(path)
			if (list) {
				if (!Array.isArray(list)) {
					list = list.split(",")
				}
				i = list.length & -2

				for (; i > -1; i -= 2) {
					if (i == 0 || list[i - 1] == "" + val || +list[i - 1] <= val) {
						match = list[i]
						break
					}
				}
			}
			El.cls(node, scope["_is-" + path], 0)
			El.cls(node, scope["_is-" + path] = match && "is-" + match)
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
			el.href = chr === "+" || chr === "%" ? "#" + View.expand(url) : url
		}
	}
}(El.bindings)

