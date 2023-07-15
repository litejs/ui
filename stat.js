/* litejs.com/MIT-LICENSE.txt */



	var versions = [
		"ver,width,height,aWidth,aHeight,oWidth,oHeight,iWidth,iHeight,pRatio,oAngle,oType,qy,mode,ie,brave,nStandalone,touchPoints,webdriver,mem,cpus,mStandalone"
	]
	, layouts = {
		"'f":"dvorak", "b!":"bepo", ay:"azerty", qj:"colemak", qy:"qwerty", qz:"qwertz"
	}
	function decode(str, ua) {
		var arr = str.split(",")
		, keys = ("" + versions[arr[0]]).split(",")
		, out = {}
		, i = keys.length
		if (arr.length !== i) return { err: str }
		for (; i--; ) {
			out[keys[i]] = arr[i] > -1 ? +arr[i] : unescape(arr[i])
		}
		out.kb = layouts[out.qy]
		return out
	}


!function(window, document, navigator, screen) {
	// Server-Timing: cache;desc="Cache Read";dur=23.2,db;dur=53,app;dur=47.2
	// Timing-Allow-Origin: *
	var qy, baseHref
	, empty = []
	, orientation = screen.orientation || empty
	, performance = window.performance || empty
	, timingKeys = "fetch,redirect,domainLookup,connect,request,response".split(",")
	, endName = { fetch: "responseEnd", request: "responseStart" }
	, statPending = 2

	LiteJS.one("show", statCb)

	try {
		navigator.keyboard.getLayoutMap().then(function(k) {
			statCb(qy = k.get("KeyQ") + k.get("KeyY"))
		})
	} catch(e) { statCb() }

	function statCb() {
		if (--statPending < 1) {
			baseHref = LiteJS.base
			var entries = performance.getEntries ? performance.getEntries() : [ performance.timing || empty ]
			, stat = {
				d: [
					0,
					screen.width, screen.height, screen.availWidth, screen.availHeight,
					window.outerWidth, window.outerHeight, window.innerWidth, window.innerHeight,
					window.devicePixelRatio,
					orientation.angle, orientation.type,
					qy,
					document.documentMode,
					!+"\v1",
					!!navigator.brave,
					navigator.standalone, navigator.maxTouchPoints, navigator.webdriver, navigator.deviceMemory, navigator.hardwareConcurrency
				].map(statVal) + "," + [
					"(display-mode:standalone)"
					//"(prefers-color-scheme:dark)",
					//"(prefers-contrast:more)",
					//"(prefers-reduced-motion:reduce),(update:slow)"
				].map(statMedia),
				r: [
					entries[0].type,
					Date.now() - (performance.timeOrigin || xhr._s),
					document.referrer,
					baseHref
				].concat(entries.flatMap(statResource)),
				u: navigator.userAgent
			}

			console.log("DEV", stat, decode(stat.d, navigator.userAgent))
		}
	}
	function statMedia(query) {
		return statVal(matchMedia(query).matches)
	}
	function statResource(entry) {
		var type = entry.entryType
		return !type || type === "navigation" || type === "resource" ? [
			(entry.name || "").replace(baseHref, ""),
			entry.responseStatus,
			entry.encodedBodySize,
			entry.transferSize,
			entry.decodedBodySize
		].map(statVal) + "," + timingKeys.map(statDiff, entry) : []
	}
	function statVal(x) {
		return x > -9 ? +x : typeof x === "string" ? x.replace(/,|;/g, escape) : "-"
	}
	function statDiff(name) {
		return statVal(this[endName[name] || name + "End"] - this[name + "Start"])
	}
}(this, document, navigator, screen) // jshint ignore:line



/* global View

	try {
	, canvas = document.createElement("canvas")
		var context = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
		, info = context.getExtension("WEBGL_debug_renderer_info")
		renderer = context.getParameter(info.UNMASKED_RENDERER_WEBGL)
	} catch(e) {}

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

	function now() {
		return new Date() - started
	}
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
			now(),
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
}(this, document, navigator, screen) // jshint ignore:line
 */

/*
UA

iPad:    Mobile/8F190
iPad 2:  Mobile/8F191
iPad 3:  Mobile/9B176 (
I can see Mobile/8J2 on iPad2 and Mobile/9A405 on iPad1.
looks like the iPad 2 can have the same Mobile/9B176 code than the New iPad. Maybe it's because of an update of iOS?

// iPhone X if ((window.screen.height / window.screen.width == 812 / 375) && (window.devicePixelRatio == 3)) { return "iPhone X"; } // iPhone 6+/6s+/7+ and 8+ else if ((window.screen.height / window.screen.width == 736 / 414) && (window.devicePixelRatio == 3)) { return "iPhone 6 Plus, 6s Plus, 7 Plus or 8 Plus"; } // iPhone 6+/6s+/7+ and 8+ in zoom mode else if ((window.screen.height / window.screen.width == 667 / 375) && (window.devicePixelRatio == 3)) { return "iPhone 6 Plus, 6s Plus, 7 Plus or 8 Plus (display zoom)"; } // iPhone 6/6s/7 and 8 else if ((window.screen.height / window.screen.width == 667 / 375) && (window.devicePixelRatio == 2)) { return "iPhone 6, 6s, 7 or 8"; } // iPhone 5/5C/5s/SE or 6/6s/7 and 8 in zoom mode else if ((window.screen.height / window.screen.width == 1.775) && (window.devicePixelRatio == 2)) { return "iPhone 5, 5C, 5S, SE or 6, 6s, 7 and 8 (display zoom)"; } // iPhone 4/4s else if ((window.screen.height / window.screen.width == 1.5) && (window.devicePixelRatio == 2)) { return "iPhone 4 or 4s"; } // iPhone 1/3G/3GS else if ((window.screen.height / window.screen.width == 1.5) && (window.devicePixelRatio == 1)) { return "iPhone 1, 3G or 3GS"; } else { return "Not an iPhone"; }


// It seems that those values are set on tab creation and are not adjusted on device rotation.
iPad 2 screen.availWidth = 768 screen.availHeight = 1004
iPad Mini screen.availWidth = 748 screen.availHeight = 1024

*/


