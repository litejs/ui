

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
		"userId pageId": function(value, name, params) {
			var list = Data(name.slice(0, -2) + "s")

			list.get(value, function(err, item) {
				if (err) return app("404").show()
				console.log("set", name, item)
				El.data.model = item
			})
			.then(this.wait())
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
		// matchMedia("(prefers-color-scheme:light)").matches
		// window.matchMedia('(max-width: 600px)')        // Chrome 9
		// .addListener(function(e){ if (e.matches) {} }) // Chrome 9
		// .addEventListener()                            // Chrome 45
		// .onchange = function() { ... }                 // Chrome 45
		// MediaQueryList.prototype.addEventListener !== MediaQueryList.prototype.addListener


	// Detect base from HTML <base> element
	, base = (html.getElementsByTagName("base")[0] || i18n).href


	history.scrollRestoration = "manual"
	if (standalone) {
		El.cls(html, "is-app")
	}


	try {
		timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
	} catch(e) {}

	function setLang(lang) {
		html.lang = lang = i18n.use(lang)
		xhr.load("lang/" + lang + ".js", function() {
			String.alphabet = i18n("__alphabet")
			String.ordinal = i18n("__ordinal")
			String.plural = i18n("__plural")
			body.dir = i18n("dir")

			El.render(body)
		})
	}
	app.setLang = setLang
	app.on("setLang", function(e, el, lang) {
		console.log(arguments)
		setLang(lang)
	})
	setLang(i18n.detect())




	document.title = "Litejs Example"

	window._ = i18n

	El.data.window = window
	El.data._ = i18n
	El.data.console = console
	El.data.window = window
	//El.data.alert = alert.bind(window)
	El.data.Date = Date
	El.data.Math = Math
	El.data.started = new Date()
	El.data.welcomeText = "_welcome"



	El.bindings.init = function(el, fn) {
		if (typeof fn == "function") {
			fn(el)
		}
	}
	El.bindings.init.once = 1
	El.bindings.run = function() {}

	var user

	View.on("timerTest", function(e, el) {
		setTimeout(function() {
			El.txt(el, arguments.length)
		}, 1000, 1, 2, 3)
	})

	View.on("toggleClass", function(e, el, clName, target) {
		El.cls(el, clName, !El.hasClass(el, clName))
	})

	View.on("reload", function() {
		location.reload(true)
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





	xhr.load(El.findAll(body, "script[type='litejs/view']").map(function(el){return el.src}), function() {
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
}(this, document, navigator, View, i18n)


