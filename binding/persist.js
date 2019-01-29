
/* litejs.com/MIT-LICENSE.txt */



!function(bindings) {
	bindings.persist = bindingPersist

	function bindingPersist(el, _key, surviveReboot) {
		var value, save
		, key = _key || el.id || el.name
		, stor = (surviveReboot ? "local" : "session") + "Storage"

		// Opening a page in a new tab or window will cause a new session to be initiated

		if (window[stor]) {
			value = window[stor][key]
			save = function() {
				window[stor][key] = El.val(el)
			}
		/*** ie7
		} else if (el.addBehavior) {
			// The saveHistory behavior persists only for the current session.
			// The saveHistory behavior uses one UserData store for the entire document. Thus, if two elements write the same attribute, the first is overwritten by the second.
			// The UserData store is saved in an in-memory stream and is not saved to disk. Therefore, it is not available after the user closes Windows Internet Explorer.
			// The userData behavior persists data across sessions, using one UserData store for each object.
			// The UserData store is persisted in the cache using the save and load methods.
			// Once the UserData store has been saved, it can be reloaded even if the document has been closed and reopened.
			// https://msdn.microsoft.com/en-us/library/ms531348(v=vs.85).aspx
			// el.style.behavior = surviveReboot ? "url('#default#userData')" : "url('#default#saveHistory')"
			el.addBehavior("#default#" + (surviveReboot ? "userData" : "saveHistory"))
			if (surviveReboot) el.load("persist")
			value = el.getAttribute(key)
			save = function() {
				el.setAttribute(key, El.val(el))
				if (surviveReboot) el.save("persist")
			}
		/**/
		}
		if (value) {
			El.val(el, value)
		}
		El.on(el, "keyup change blur", save)
	}
	bindingPersist.once = bindingPersist
}(El.bindings)

