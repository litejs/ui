
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
		node.on(ev, fn)
	}
	bindings["with"] = function(node, data, map) {
		Object.merge(El.getScope(node, true), map)
		return node.render()
	}
	bindings["with"].once = 1

}(El.bindings)

