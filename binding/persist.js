
/* litejs.com/MIT-LICENSE.txt */



/* global El, window */
El.$b.persist = function bindingPersist(el, key, surviveReboot) {
	var stor = window[(surviveReboot ? "local" : "session") + "Storage"]
	El.val(el, stor[key = key || el.id || el.name] || "")
	El.on(el, "keyup change blur", function() {
		stor[key] = El.val(el)
	})
}

