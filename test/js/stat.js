/* litejs.com/MIT-LICENSE.txt */


/* global View */
!function(window, screen) {
	var nameData
	, body = document.body
	, started = new Date()
	, qy

	try {
		nameData = JSON.parse(window.name)
	} catch(e) {}

	try {
		// Chrome69, Opera56, Edge79
		navigator.keyboard.getLayoutMap().then(function(k) {
			qy = k.get("KeyQ") + k.get("KeyY")
			//layout = { "'f":"Dvorak", "b!":"Bepo", ay:"Azerty", qj:"Colemak", qy:"Qwerty", qz:"Qwertz" }[k.get("KeyQ") + k.get("KeyY")]
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
			qy: qy,
			screen: screen.width + "x" + screen.height,
			content: (window.innerWidth || body.offsetWidth) +
				"x" + (window.innerHeight || body.offsetHeight),
			colors: screen.colorDepth,
			timing: (window.performance || {}).timing
		}

		console.log("Stat", stat)
	})
	var events = []
	, stat = {}
	, keys = {}
	, key = 0
	, last

	function push(e) {
		var x = "" + [e.x>>5, e.y>>5]
		if (last === x && e.type === "mousemove") return
		if (!stat[e.type]) {
			stat[e.type] = 0
		}
		stat[e.type]++
		last = x
		// e.ctrlKey
		events.push(
			performance.now()|0,
			keys[e.type] || (keys[e.type] = ++key),
			last,
			(
				e.type === "click" ? getPath(e) : 0
			)
		)
	}

	setInterval(function() {
		if (events.length > 0) {
			console.log(stat, JSON.stringify(events).length, ""+events)
			events = []
		}
	}, 2000)

	document.addEventListener("click", push, true)
	document.addEventListener("mousemove", push, true)

	function getPath(e) {
		for (var i, c, nth, t, path = [], el = e.target; el && el.tagName; el = el.parentNode) {
			nth = el.parentNode && el.parentNode.childNodes || ""
			if (nth && nth[0] !== el) {
				for (i = c = 0; (t = nth[i++]);) if (t.tagName === el.tagName) {
					c++
					if (t === el) break
				}
			}
			path.unshift(
				el.tagName +
				(el.id ? "#" + el.id : "") +
				(c > 1 ? "(" + c + ")" : "")  +
				(el.className ? "." + el.className.replace(/\s+/g, ".") : "") +
				(path.length === 0 && !el.firstElementChild ? "[" + el.textContent+ "]" : "") +
				(el._e && el._e[e.type] && el._e[e.type].length ? "@" + (el._e.click.length/3) : "")
			)
		}
		path = path.join(">")
		return keys[path] || (keys[path] = ++key)
	}
}(this, screen) // jshint ignore:line





