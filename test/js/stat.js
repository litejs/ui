
/* litejs.com/MIT-LICENSE.txt */


!function(window, screen) {
	var nameData
	, body = document.body
	, started = new Date()
	, layout

	try {
		nameData = JSON.parse(window.name)
	} catch(e) {}

	try {
		// Chrome69, Opera56(48 android)
		navigator.keyboard.getLayoutMap().then(function(k) {
			layout = {
				"'f": "Dvorak",
				"b!": "Bepo",
				ay: "Azerty",
				qj: "Colemak",
				qy: "Qwerty",
				qz: "Qwertz"
			}[k.get("KeyQ") + k.get("KeyY")]
		})
	} catch(e) {}

	if (!isObject(nameData)) {
		nameData = {}
	}

	/*
	var tab = nameData.i || set("i", Math.random().toString(36).slice(2))
	function set(key, val) {
		nameData[key] = val
		window.name = JSON.stringify(nameData)
		return val
	}
	*/

	function isObject(obj) {
		return obj && obj.constructor === Object
	}

	View.one("show", function() {
		// window.outerWidth - Chrome1, Firefox1, IE9, Opera9, Safari3
		var stat = {
			start: started,
			end: new Date(),
			screen: screen.width + "x" + screen.height,
			content: (window.innerWidth || body.offsetWidth) +
				"x" + (window.innerHeight || body.offsetHeight),
			colors: screen.colorDepth,
			timing: (window.performance || {}).timing
		}

		console.log("Stat", stat)
	})
}(this, screen)





