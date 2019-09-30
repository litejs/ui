

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
	home: "home",
	root: document.body,
	on: {
		show: function(params, view) {
			// Re-render all .js-viewHook elements on each View change
			El.findAll(this.root, ".js-viewRender").render()
			scroll(0, 1)
		}
	}
})


!function(window, document, navigator, View, i18n) {
	i18n.def({
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
	})

	var timezone
	, html = document.documentElement
	, body = document.body
	, link = /./
	, standalone = "standalone" in navigator ?
		navigator.standalone :
		window.matchMedia && matchMedia("(display-mode:standalone)").matches

	// Detect first available language
	, lang = i18n.use([].concat(
		navigator.languages, navigator.language, navigator.userLanguage,
		"en" // Default language
	).filter(i18n.get)[0])

	// Detect base from HTML <base> element
	, base = (html.getElementsByTagName("base")[0] || i18n).href


	history.scrollRestoration = "manual"
	if (standalone) {
		El.cls(html, "is-app")
	}


	try {
		timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
	} catch(e) {}

	i18n.setLang = function(lang) {
		html.lang = lang = i18n.use(lang)
		xhr.load("lang/" + lang + ".js", function() {
			Date.names = i18n("__date").split(" ")
			String.alphabet = i18n("__alphabet")
			String.ordinal = i18n("__ordinal")
			String.plural = i18n("__plural")
			Object.assign(Date.masks, i18n("__dateMasks"))
			body.dir = i18n("dir")

			El.render(body)
		})
	}


	View.on("xhr:406", function(body, method, url, data, onResponse, send) {
		View.emit("confirm", body.title || "Not Acceptable", body, function(action) {
			if (action) {
				var req = xhr(method, url, onResponse)
				req.setRequestHeader("Accept-Confirm", action)
				send(req, data)
			}
		})
	})







	document.title = "Litejs Example"

	window._ = i18n

	El.data.window = window
	El.data.Fn = Fn
	El.data.console = console
	El.data.window = window
	//El.data.alert = alert.bind(window)
	El.data.Date = Date
	El.data.Math = Math
	El.data.started = new Date()
	El.data.welcomeText = "_welcome"


	El.bindings.fixReadonlyCheckbox = function(el) {
		function False(e) {
			console.log(this.readOnly)
			if (this.readOnly) {
				Event.stop(e)
				return false
			}
		}
		El.on(el, "click", False)
		El.on(el, "mousedown", False)
	}
	El.bindings.fixReadonlyCheckbox.once = 1

	El.bindings.init = function(el, fn) {
		if (typeof fn == "function") {
			fn(el)
		}
	}
	El.bindings.init.once = 1
	El.bindings.run = function() {}

	var user

	View.on("login", function(e, data) {
		var err
		if (data.name != "a") {
			err = "Login fail. Try name: a"
			data = null
		}
		user = El.data.user = data
		View.show(true, {error: err})
	})

	View.on("timerTest", function(e, el) {
		setTimeout(function() {
			El.txt(el, arguments.length)
		}, 1000, 1, 2, 3)
	})

	View.on("toggleClass", function(e, el, clName, target) {
		El.cls(el, clName, !El.hasClass(el, clName))
	})

	View.on("logout", function() {
		user = El.data.user = null
		View.show(true)
	})

	View.on("reload", function() {
		location.reload(true)
	})
	View.on("updateready", function(e) {
		View.emit("confirm", "Update is ready, load?", function(confirmed) {
			if (confirmed) {
				View.emit("up")
			}
		})
	})

	View.on("logForm", function(e, el) {
		var data = El.val(el)
		, matches = El.attr(el, "data-expect") == JSON.stringify(data)
		if (matches) {
			console.log("logForm", matches, JSON.stringify(data))
		} else {
			console.error("logForm", JSON.stringify(data),"!==",El.attr(el, "data-expect"), data)
		}
	})


	El.addKb({
		H: history.setUrl.bind(null, "home"),
		U: history.setUrl.bind(null, "users"),
		S: history.setUrl.bind(null, "settings"),
		T: history.setUrl.bind(null, "test")
	})


	View("#body")
	.on("ping", function() {
		El.data.user = user
		El.findAll(body, ".Menu,.lang").render()
	})

	View("#private")
	.on("ping", function() {
		if (!user && View.route != "login") {
			View("login").show()
		}
	})

	//var lower = "Back", upper = "Forward"
	var lower = "Left", upper = "Right"

	View("public")
	.on("openChild", function(open, close) {
		if (close) El.cls(open.isOpen, close.seq < open.seq ? "from" + upper : "from" + lower)
	})

	View("public")
	.on("closeChild", function(close, open) {
		var isOpen = close.isOpen
		close.isOpen = null
		El.cls(isOpen, open && open.seq < close.seq ? "to" + upper : "to" + lower)
		setTimeout(function() {
			El.kill(isOpen)
		}, 600)
	})

	View.param(["userId","pageId"], function(value, name, params) {
		var key = name.slice(0, -2)
		, list = Data(key + "s")

		list.get(value, function(err, item) {
			if (err) return View("404").show()
			console.log("set", key, item)
			El.data.model = item
		})
		.then(this.wait())
	})

	View("users/{userId}")
	.on("ping", function() {
		setTimeout(this.wait(), 2000)
		setTimeout(this.wait(), 1000)
	})

	View("users")
	.on("ping", function() {
		this.wait()()
	})




	i18n.setLang(lang)



	xhr.load(El.findAll(body, "script[type='litejs/view']").pluck("src"), function() {
		// Start a router to show views
		history.start(View.show)
	})

	El.on(body, "click", function(e) {
		var el = e.target
		, link = !(e.altKey || e.shiftKey) && el.tagName == "A" && el.href.split("#")

		if (link && link[0] == (base || location.href.split("#")[0])) {
			if (e[El.kbMod] ? window.open(el.href, "_blank") : !history.setUrl(link[1])) {
				return Event.stop(e)
			}
		}
	})

	if (window.console && console.log) {
		link.toString = function() {
			return "https://en.wikipedia.org/wiki/Self-XSS"
		}
		console.log(
			"%cStop!\n%cThis developer tool lets you hack and give others access only to your own account.\nSee %s for more information.",
			"font:bold 50px monospace;color:red;text-shadow:3px 3px #000,-1px -1px #fff",
			"font:20px sans-serif",
			link
		)
	}
}(this, document, navigator, View, El.i18n)


