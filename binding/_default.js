
!function(bindings) {
	var hasOwn = Object.prototype.hasOwnProperty
	, slice = Array.prototype.slice

	bindingFn.once =
	bindingWith.once =
	bindingOn.once =
	emitForm.once =
	bindingsEach.raw = bindingsEach.once =
	true

	bindings.fn = bindingFn
	function bindingFn(fn) {
		return fn.apply(this, slice.call(arguments, 1))
	}

	bindings["if"] = bindingIf
	function bindingIf(enabled) {
		if (!enabled) return this.kill()
	}

	bindings.on = bindingOn
	function bindingOn(ev, fn, a1, a2) {
		if (typeof fn == "string") {
			var _fn = fn
			fn = function(e) {
				Mediator.emit(_fn, e, this, a1, a2)
			}
		}
		this.on(ev, fn)
	}

	bindings["with"] = bindingWith
	function bindingWith(map) {
		return this.render(Object.merge(El.scope(this, true), map))
	}

	bindings.emitForm = emitForm
	function emitForm(ev, a1, a2) {
		this.on("submit", function(e) {
			var data = JSON.serializeForm(this)
			Mediator.emit(ev, e, data, a1, a2)
			return false
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

	function bindingsEach(data, expr) {
		var node = this
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

		var childs = Function("hasOwn,el,data", fn)(hasOwn, child, data)

		node.empty().append(childs).render()
		return node
	}
}(El.bindings)

