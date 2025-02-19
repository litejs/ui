

El.on(document, "visibilitychange pagehide", (xhr.sendLog = function() {
	var unsentLog = xhr._l
	if (unsentLog[0]) navigator.sendBeacon("/log", JSON.stringify(unsentLog))
	unsentLog.length = 0
}))

// Clickjacking defense, break out of frames.
// If JavaScript is disabled, the site will not display at all.
if (self !== top) {
	xhr.log("s", "Framed", "" + top.location)
	throw top.location = self.location
}

console.log(
	"%cStop!\n%cThis developer tool allows only others access to your account.\nSee https://en.wikipedia.org/wiki/Self-XSS",
	"font:bold 5em monospace;color:red;text-shadow:3px 3px #000,-1px -1px #fff",
	"font:2em sans-serif"
)

var app = LiteJS({
	path: "view/",
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
	translations: {
		Yes: {
			en: "Yes",
			et: "Jah"
		},
		No: {
			en: "No",
			et: "Ei"
		}
	},
	on: {
		nav: function() {
			console.log("Navigating to", app.route)
		},
		inc: function(ev, el, field) {
			El.scope(el)[field]++
			El.render(el)
		},
		txt: function() {
			console.log("txt", arguments)

		},
		show: function(params, view) {
			// Re-render all .js-viewHook elements on each View change
			app.$$(".js-viewRender").render()
			scroll(0, 1)
		},
		xhr406: function(body, method, url, data, onResponse, send) {
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
		"userId pageId": function(value, name, view, params) {
			console.log("PARAM", this, arguments)
		}
	},
	ping: {
		"user": function() {
			this.wait()()
		},
		"user/{useId}": function() {
			setTimeout(this.wait(), 2000)
			setTimeout(this.wait(), 1000)
		}
	}
})

xhr.view = xhr.tpl = xhr.el = xhr.ui


!function(window, document, navigator) {

	app.$d.people = [ "Yehuda Katz", "Alan Johnson", "Charles Jolley" ]

	var timezone, locale
	, html = document.documentElement
	, body = document.body


	history.scrollRestoration = "manual"

	El.cls(html, {
		"is-app": "standalone" in navigator ? navigator.standalone : matchMedia("(display-mode:standalone)").matches,
		"is-dark": localStorage.dark ? localStorage.dark > 0 : matchMedia("(prefers-color-scheme:dark)").matches
	})
	// matchMedia("(prefers-color-scheme:light)").matches


	try {
		locale = Intl.DateTimeFormat().resolvedOptions().locale
		timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
	} catch(e) {}

	xhr.load("translations.json", function(res) {
		var allJson = JSON.parse(res[0])
		app.on("setLang", setLang)
		setLang(0, 0, app.$d.lang)
		LiteJS.start(app.show)
		function setLang(e, el, lang) {
			app.lang(lang, extractLang(app, lang))
			app.lang(lang, extractLang(allJson, lang))
			El.render(app.root)
		}
	}, 1)



	document.title = "LiteJS Example"

	//window._ = i18n

	El.$d.window = window
	El.$d.console = console
	El.$d.window = window
	El.$d.parseInt = parseInt
	//El.$d.alert = alert.bind(window)
	El.$d.Date = Date
	El.$d.Math = Math
	El.$d.started = new Date()
	El.$d.welcomeText = "_welcome"





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
		console.log("openChild", open.tr)
	})

	app("public")
	.on("openChil", function(open, close) {
		if (close) El.cls(open.o, close.s < open.s ? "from" + upper : "from" + lower)
	})

	app("public")
	.on("closeChil", function(close, open) {
		var isOpen = close.o
		close.o = null
		El.cls(isOpen, open && open.s < close.s ? "to" + upper : "to" + lower)
		setTimeout(function() {
			El.kill(isOpen)
		}, 600)
	})

	El.on(window, "languagechange", function(event) {})

	El.on(body, "click pointerdown", El.stop, "input[readonly][type=checkbox]")
	El.on(body, "click", function(e) {
		var el = e.target
		, link = !(e.altKey || e.shiftKey) && el.tagName == "A" && el.href.split("#")

		if (link && link[0] == LiteJS.base) {
			if (e[El.kbMod] ? window.open(el.href, "_blank") : !LiteJS.go(link[1])) {
				return El.stop(e)
			}
		}
	})


}(this, document, navigator)


