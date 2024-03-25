

xhr.logErrors = function(unsentErrors) {
	xhr("POST", "/errlog").send(JSON.stringify(unsentErrors))
	unsentErrors.length = 0
}

// Clickjacking defense, break out of frames.
// If JavaScript is disabled, the site will not display at all.
if (self !== top) {
	xhr.logErrors(["Framed in " + top.location])
	throw top.location = self.location
}

var app = LiteJS({
	base: "view/",
	lang: "en",
	locales: {
		"ar": "Arabic",
		"et": "Eesti keeles",
		"fi": "Suomeksi",
		"ru": "На русском",
		"sv": "På Svenska",
		//, "lt": "Lietuviškai"
		//, "lv": "Latviski"
		//, "pl": "Polski"
		//, "de": "Deutsch"
		//, "fr": "Français"
		"en": "In English"
	},
	on: {
		nav: function() {
			console.log("Navigating to", app.route)
		},
		txt: function() {
			console.log("txt", arguments)

		},
		show: function(params, view) {
			// Re-render all .js-viewHook elements on each View change
			app.$$(".js-viewRender").render()
			scroll(0, 1)
		},
		"xhr:406": function(body, method, url, data, onResponse, send) {
			this.emit("confirm", body.title || "Not Acceptable", body, function(action) {
				if (action) {
					var req = xhr(method, url, onResponse)
					req.setRequestHeader("Accept-Confirm", action)
					send(req, data)
				}
			})
		}
	},
	param: {
		"userId pageId": function(value, name, params, ui) {
			console.log("PARAM", this, arguments)
		}
	},
	ping: {
		"users": function() {
			this.wait()()
		},
		"users/{userId}": function() {
			setTimeout(this.wait(), 2000)
			setTimeout(this.wait(), 1000)
		}
	}
})

xhr.view = xhr.tpl = xhr.el = xhr.ui


!function(window, document, navigator) {

	app.data.people = [ "Yehuda Katz", "Alan Johnson", "Charles Jolley" ]

	var timezone
	, html = document.documentElement
	, body = document.body
	, link = /./


	// Detect base from HTML <base> element
	, base = (html.getElementsByTagName("base")[0] || html).href


	history.scrollRestoration = "manual"

	El.cls(html, "is-app", "standalone" in navigator ? navigator.standalone : matchMedia("(display-mode:standalone)").matches)
	// matchMedia("(prefers-color-scheme:light)").matches


	try {
		timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
	} catch(e) {}

	app.on("setLang", function(e, el, lang) {
		console.log("setLang", arguments)
		setLang(lang)
	})
	//setLang(i18n.detect())




	document.title = "Litejs Example"

	//window._ = i18n

	El.data.window = window
	El.data.console = console
	El.data.window = window
	//El.data.alert = alert.bind(window)
	El.data.Date = Date
	El.data.Math = Math
	El.data.started = new Date()
	El.data.welcomeText = "_welcome"




	El.$b.focus = function(el) {
		el.focus()
	}

	var user

	app.on("timerTest", function(e, el) {
		setTimeout(function() {
			El.txt(el, arguments.length)
		}, 1000, 1, 2, 3)
	})

	app.on("toggleClass", function(e, el, clName, target) {
		El.cls(el, clName, !El.hasClass(el, clName))
	})

	app.on("reload", function() {
		location.reload(true)
	})

	app.on("logForm", function(e, el) {
		var data = El.val(el)
		, matches = El.get(el, "data-expect") == JSON.stringify(data)
		if (matches) {
			console.log("logForm", matches, JSON.stringify(data))
		} else {
			console.error("logForm", JSON.stringify(data),"!==",El.get(el, "data-expect"), data)
		}
	})



	//var lower = "Back", upper = "Forward"
	var lower = "Left", upper = "Right"


	app("public")
	.on("openChild", function(open, close) {
		if (close) El.cls(open.o, close.s < open.s ? "from" + upper : "from" + lower)
	})

	app("public")
	.on("closeChild", function(close, open) {
		var isOpen = close.o
		close.o = null
		El.cls(isOpen, open && open.s < close.s ? "to" + upper : "to" + lower)
		setTimeout(function() {
			El.kill(isOpen)
		}, 600)
	})


	El.on(body, "click pointerdown", "input[readonly][type=checkbox]", Event.stop)

	LiteJS.start(app.show)

	El.on(body, "click", function(e) {
		var el = e.target
		, link = !(e.altKey || e.shiftKey) && el.tagName == "A" && el.href.split("#")

		if (link && link[0] == (base || location.href.split("#")[0])) {
			if (e[El.kbMod] ? window.open(el.href, "_blank") : !LiteJS.go(link[1])) {
				return Event.stop(e)
			}
		}
	})


	if (window.console && console.log) {
		link.toString = function() {
			return "https://en.wikipedia.org/wiki/Self-XSS"
		}
		console.log(
			"%cStop!\n%cThis developer tool lets you hack and only give others access to your own account.\nSee %s for more information.",
			"font:bold 50px monospace;color:red;text-shadow:3px 3px #000,-1px -1px #fff",
			"font:20px sans-serif",
			link
		)
	}
}(this, document, navigator)


