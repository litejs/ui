
!function(bindings) {
	var hasOwn = Object.prototype.hasOwnProperty
	, slice = Array.prototype.slice

	function bindingFn(node, data, fn) {
		fn.apply(node, slice.call(arguments, 3))
	}
	bindingFn.raw = bindingFn.once = true
	bindings.init = bindings.fn = bindingFn

	bindings["if"] = function(node, data, enabled) {
		if (!enabled) return node.kill()
	}
	bindings["on"] = function(node, data, ev, fn) {
		if (typeof fn == "string") {
			var _fn = fn
			fn = function(e) {
				Mediator.emit(_fn, e)
			}
		}
		node.on(ev, fn)
	}
	bindings["with"] = function(node, data, map) {
		Object.merge(El.getScope(node, true), map)
		return node.render()
	}
	bindings["with"].once = 1

	bindings.emitForm = function(node, data, ev, a1, a2) {
		node.on("submit", function(e) {
			var data = JSON.serializeForm(this)
			Mediator.emit(ev, e, data, a1, a2)
		})
	}
}(El.bindings)

