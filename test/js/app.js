
// Clickjacking defense,
// site should break out of the site that is framing it.
// If the user’s browser has Javascript turned off,
// the site will not display at all.
if (this != top) throw top.location = this.location



var Mediator = Object.create(Event.Emitter)
, _ = El.i18n

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

El.data.location = location


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


!function(View, Mediator) {
	var user

	function setLang(lang, next) {
		xhr.load("lang/" + lang + ".js", next)
	}


	Mediator.setLang = function() {
		setLang(_.use(this.attr("lang")), function() {
			document.body.render()
		})
	}

	Mediator.on("login", function(e, data) {
		user = data
		View.show(history.getUrl())
	})

	Mediator.on("logout", function() {
		user = null
		View.show(history.getUrl())
	})

	Mediator.logForm = function(e) {
		var data = JSON.serializeForm(this)
		console.log("logForm expect", this.attr("data-expect"))
		console.log("logForm actual", JSON.stringify(data))
	}

	document.title = "Litejs Example"

	View.def("main.tpl,main.css #public,#private,404,home,login,users,users/{id},test")
	View.def("main.tpl,main.css,settings.tpl,settings.css settings")
	View.def("main.tpl,main.css,test-form1.tpl test-form1")
	View.def("main.tpl,main.css,test-grid.tpl test-grid")

	// Add `#body` view, it is a starting point for us.
	// It could be any element on page but we want to start from `BODY`.
	View("#body", document.body)
	.on("ping", function() {
		El.data.user = user
		document.body.findAll(".menu,.lang").render()
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

	View.base = "views/"

	var lang = _.use([].concat(navigator.languages, navigator.language, navigator.userLanguage, "en").filter(_.get)[0])
	setLang(lang, init)

	// Read in templates from element with id=index
	//El.include("index")

	function init() {
		// Start a router to showing views
		history.start(View.show)
	}

}(View, Mediator)





