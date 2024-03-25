
/* litejs.com/MIT-LICENSE.txt */



/* global El */
!function(bindings, window) {
	bindings.persist = bindingPersist

	function bindingPersist(el, _key, surviveReboot) {
		var stor = (surviveReboot ? "local" : "session") + "Storage"
		, key = _key || el.id || el.name
		, value = window[stor].getItem(key)

		if (value) {
			El.val(el, value)
		}
		El.on(el, "keyup change blur", function() {
			window[stor].setItem(key, El.val(el))
		})
	}
}(El.$b, window) // jshint ignore:line

