
!function(bindings) {
	var hasOwn = Object.prototype.hasOwnProperty
	, slice = Array.prototype.slice

	bindingFn.once = bindingFn.raw =
	bindingWith.once =
	bindingOn.once =
	emitForm.once =
	true

	bindings.fn = bindingFn
	function bindingFn(node, data, fn) {
		fn.apply(node, slice.call(arguments, 3))
	}

	bindings["if"] = bindingIf
	function bindingIf(node, data, enabled) {
		if (!enabled) return node.kill()
	}

	bindings.on = bindingOn
	function bindingOn(node, data, ev, fn, a1, a2) {
		if (typeof fn == "string") {
			var _fn = fn
			fn = function(e) {
				Mediator.emit(_fn, e, a1, a2)
			}
		}
		node.on(ev, fn)
	}

	bindings.with = bindingWith
	function bindingWith(node, data, map) {
		Object.merge(El.getScope(node, true), map)
		return node.render()
	}

	bindings.emitForm = emitForm
	function emitForm(node, data, ev, a1, a2) {
		node.on("submit", function(e) {
			var data = JSON.serializeForm(this)
			Mediator.emit(ev, e, data, a1, a2)
		})
	}
}(El.bindings)

