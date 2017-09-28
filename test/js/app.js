
// Clickjacking defense,
// site should break out of the site that is framing it.
// If the user’s browser has Javascript turned off,
// the site will not display at all.
if (this != top) throw top.location = this.location

if (this.console && console.log) {
	var link = /./
	link.toString = function() { return location.href.split("#")[0] + "#selfxss" }
	console.log(
		"%cStop!\n%cThis developer tool lets you hack and give others access only to your own account.\nSee %s for more information.",
		"font:bold 50px monospace;color:red;text-shadow:3px 3px #000,-1px -1px #fff",
		"font:20px sans-serif",
		link
	)
}

xhr.logErrors = function(unsentErrors) {
	xhr("POST", "/errlog").send(JSON.stringify(unsentErrors))
	unsentErrors.length = 0
}


var _ = El.i18n

El.data.history = history
El.data.El = El
El.data.Fn = Fn
El.data.Mediator = Mediator
El.data.Date = Date
El.data.Math = Math
El.data.View = View
El.data.started = new Date()
El.data.welcomeText = "_welcome"


_.def(  { "en": "In English"
	, "et": "Eesti keeles"
	, "ru": "На русском"
	, "fi": "Suomeksi"
	, "sv": "På Svenska"
	//, "lt": "Lietuviškai"
	//, "lv": "Latviski"
	//, "pl": "Polski"
	//, "de": "Deutsch"
	//, "fr": "Français"
})

_.setLang = function(lang) {
	document.documentElement.lang = lang = _.use(lang)
	xhr.load("lang/" + lang + ".js", function() {
		Date.names = _("__date").split(" ")
		String.alphabet = _("__alphabet")
		String.ordinal = _("__ordinal")
		String.plural = _("__plural")
		JSON.merge(Date.masks, _("__dateMasks"))

		El.render(document.body)
	})
}



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

El.bindings.init = function() {}
El.bindings.init.once = 1
El.bindings.run = function() {}

!function(View, Mediator, navigator) {
	var user

	Mediator.on("login", function(e, data) {
		var err
		if (data.name != "a") {
			err = "Login fail. Try name: a"
			data = null
		}
		user = El.data.user = data
		View.show(true, {error: err})
	})

	Mediator.on("logout", function() {
		user = El.data.user = null
		View.show(true)
	})

	Mediator.logForm = function(e) {
		var data = El.val(this)
		, matches = El.attr(this, "data-expect") == JSON.stringify(data)
		if (matches) {
			console.log("logForm", matches, JSON.stringify(data), data)
		} else {
			console.error("logForm", matches, JSON.stringify(data),"!==",El.attr(this, "data-expect"), data)
		}
	}

	El.addKb({
		H: history.setUrl.bind(null, "home"),
		U: history.setUrl.bind(null, "users"),
		S: history.setUrl.bind(null, "settings"),
		T: history.setUrl.bind(null, "test")
	})

	document.title = "Litejs Example"

	// Add `#body` view, it is a starting point for us.
	// It could be any element on page but we want to start from `BODY`.
	View("#body", document.body)
	.on("ping", function() {
		El.data.user = user
		El.findAll(document.body, ".Menu,.lang").render()
	})

	View("#private")
	.on("ping", function() {
		if (!user && View.active != "login") {
			View("login").show()
		}
	})

	View.param(["userId","pageId"], function(value, name, params) {
		var key = name.slice(0, -2)
		, list = Data(key + "s")

		list.get(value, function(err, item) {
			if (err) return View("404").show()
			console.log("set", key, item)
			El.data[key] = item
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

	View.base = "views/"

	View.on("show", function() {
		// When a View completes, blur focused link
		// IE8 can throw an exception for document.activeElement.
		try {
			var el = document.activeElement
			, tag = el && el.tagName
			if (tag == "A" || tag == "BUTTON") el.blur()
		} catch(e) {}
		El.findAll(document.body, ".js-viewRender").render()
	})


	var timezone

	// Detect first available language
	, lang = _.use([].concat(
		navigator.languages, navigator.language, navigator.userLanguage, "en"
	).filter(_.get)[0])

	// Search href from HTML <base> element
	, base = (document.documentElement.getElementsByTagName("base")[0] || init).href

	try {
		timezone = Intl.DateTimeFormat().resolvedOptions().timezone
	} catch(e) {}

	// Preload lang and views
	xhr.load([
		"lang/" + lang + ".js",
		"views/Form1.tpl",
		"views/components/Segment7.tpl",
		"views/main.view"
	], init)

	function init() {
		_.setLang(lang)
		// Start a router to show views
		history.start(View.show, base && base.replace(/.*:\/\/[^/]*|[^\/]*$/g, ""))
	}

	El.on(document.body, "click", function(e) {
		var target = e.target
		, fastLink = target.tagName == "A" && target.href.split("#")

		if (
			fastLink &&
			!(e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) &&
			fastLink[0] == (base || location.href.split("#")[0])
		) {
			history.setUrl(fastLink[1])
			Event.stop(e)
		}
	})





	/*


	xhr.load(["js/test-load1.js", "js/test-load1.js", "//www.litejs.com/pub/crypto.js", "js/test-load1.js"], loadDone)
	xhr.load(["js/test-load1.js", "js/test-load2.js", "js/test-load1.js"], loadDone)
	xhr.load(["js/test-load1.js", "js/test-load2.js"], loadDone)

	function loadDone(files, res) {
		window.console && console.log("load done", files, res.map(function(str) {
			return crypto.sha1 && crypto.sha1("blob " + str.length + "\0" + str)
		}))
	}
	*/

	// Read in templates from element with id=index
	//El.include("index")



}(View, Mediator, navigator)





