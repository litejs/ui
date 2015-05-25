
!function(bindings) {
	var hasOwn = Object.prototype.hasOwnProperty
	, slice = Array.prototype.slice

	bindingFn.once =
	bindingWith.once =
	bindingOn.once =
	emitForm.once =
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
		})
	}
}(El.bindings)

