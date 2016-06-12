
// Clickjacking defense,
// site should break out of the site that is framing it.
// If the user’s browser has Javascript turned off,
// the site will not display at all.
if (this != top) throw top.location = this.location

if (this.console && console.log) {
	// Warning! This developer tool will grant others administrative access to your own account.
	console.log(
		"%cStop!\n%cThis developer tool lets you hack and give others access only to your own account.\nSee %s for more information.",
		"font:bold 50px monospace;color:red;text-shadow:#000 3px 3px",
		"font:20px sans-serif",
		location.href.split("#")[0] + "#selfxss"
	)
	// also disable javascript: links
}



var Mediator = Object.create(Event.Emitter)
, _ = El.i18n

El.data.history = history
El.data.Fn = Fn
El.data.Mediator = Mediator
El.data.Date = Date
El.data.Math = Math
El.data.View = View
El.data.started = new Date()
El.data.welcomeText = "_welcome"

El.data.emit = function(a, b, c, d, e, f) {
	return Mediator.emit.bind(Mediator, a, b, c, d, e, f)
}

_.def(  { "en": "In English"
	, "et": "Eesti keeles"
	, "ru": "На русском"
	, "fi": "Suomeksi"      // Finnish
	, "sv": "På Svenska"    // Swedish
	//, "lt": "Lietuviškai"   // Lithuanian
	//, "lv": "Latviski"      // Latvian
	//, "pl": "Polski"        // Polish
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
		Object.merge(Date.masks, _("__dateMasks"))

		document.body.render()
	})
}



El.bindings.list = function(list, extra) {
	var node = this
	, data = El.scope(node)
	, child = node._child
	, extraLen = 0

	if (!child) {
		child = node._child = node.removeChild(node.firstChild)
	}

	if (!list || node._list == list) return

	if (node._list) clear()

	node._list = data.list = list

	node.on("kill", clear)

	node.addClass("loading")

	if (extra) {
		extra.each(clone)
		extraLen = extra.length
	}

	list
	.each(clone)
	.on("add", clone).on("remove", remove)
	.then(function() {
		node.rmClass("loading")
	})

	// Do not render childs when list initialized
	return true

	function clone(item, pos) {
		var clone = child.cloneNode(true)
		, scope = El.scope(clone, data)
		scope.item = item.data || item
		scope.model = item
		function up() {
			clone.render(scope)
		}
		if (item.on) {
			item.on("change", up)
			clone.on("kill", function(){
				item.off("change", up)
			})
		}
		return clone.to(node, extraLen + pos).render(scope)
	}

	function remove(item, pos) {
		node.childNodes[extraLen + pos].kill()
	}

	function clear() {
		var list = node._list
		node.empty()
		if (list) {
			node._list = null
			list.off("add", clone).off("remove", remove)
		}
	}
}

El.bindings.fixReadonlyCheckbox = function() {
	var el = this
	function False(e) {
		console.log(this.readOnly)
		if (this.readOnly) {
			Event.stop(e)
			return false
		}
	}
	el.on("click", False).on("mousedown", False)
}
El.bindings.fixReadonlyCheckbox.once = 1

El.bindings.init = function() {}
El.bindings.init.once = 1
El.bindings.run = function() {}

!function(View, Mediator, navigator) {
	var user

	Mediator.on("login", function(e, data) {
		user = data
		View.show(true)
	})

	Mediator.on("logout", function() {
		user = null
		View.show(true)
	})

	Mediator.logForm = function(e) {
		var data = JSON.serializeForm(this)
		, matches = this.attr("data-expect") == JSON.stringify(data)
		if (matches) {
			console.log("logForm", matches, JSON.stringify(data), data)
		} else {
			console.error("logForm", matches, JSON.stringify(data),"!==",this.attr("data-expect"), data)
		}
	}

	Event.setKeyMap({
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
		document.body.findAll(".Menu,.lang").render()
	})

	View("#private")
	.on("ping", function(opts) {
		var url = history.getUrl()
		if (!user && View.active != "login") {
			View("login").show()
		}
	})

	View("users/{id}")
	.on("ping", function(opts) {
		setTimeout(this.wait(opts), 2000)
		setTimeout(this.wait(opts), 1000)
	})

	View("users")
	.on("ping", function(opts) {
		this.wait(opts)()
	})

	View.base = "views/"

	View.on("show", function() {
		// When a View completes, blur focused link
		var el = document.activeElement
		if (el && el.tagName == "A") el.blur()
	})

	var intlLang, intlZone, opts

	try {
		opts = Intl.DateTimeFormat().resolvedOptions()
		intlLang = opts.locale
		intlZone = opts.timezone
	} catch(e) { }

	var lang = [].concat(
		navigator.languages, navigator.language, navigator.userLanguage, "en"
	).filter(_.get)[0]

	xhr.load(["lang/" + _.use(lang) + ".js", "views/Form1.tpl", "views/main.view"], init)

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

	var base = document.documentElement.getElementsByTagName("base")[0]
	base = base && base.href.replace(/.*:\/\/[^/]*|[^\/]*$/g, "")

	function init() {
		_.setLang(lang)
		// Start a router to showing views
		history.start(View.show, base)
	}

	if (base && history.pushState) document.body.on("click", function(e) {
		var target = e.target
		if (target.tagName == "A") {
			history.setUrl(target.href.split("#")[1])
			Event.stop(e)
		}
	})

}(View, Mediator, navigator)





