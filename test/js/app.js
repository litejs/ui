
// Clickjacking defense,
// site should break out of the site that is framing it.
// If the user’s browser has Javascript turned off,
// the site will not display at all.
if (this != top) throw top.location = this.location



var Mediator = Object.create(Event.Emitter)
, _ = El.i18n

_.def({ "en":"In English"
	, "et":"Eesti keeles"
	, "ru":"На русском"
	, "fi":"Suomeksi"
	, "se":"på Svenska"
})

El.data.location = location



!function(View, Mediator) {
	var user
	, app = El(".app")

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

	// Add `#body` view, it is a starting point for us.
	// It could be any element on page but we want to start from `BODY`.
	View("#body", document.body)
	.on("ping", function() {
		El.data.user = user
		document.body.findAll(".nav").render()
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

	// Define landing page
	View.base = "views/"

	var lang = _.use(navigator.language || navigator.userLanguage)
	setLang(lang, init)

	// Read in templates from element with id=index
	//El.include("index")

	function init() {
		// Start a router to showing views
		history.start(View.show)
	}

}(View, Mediator)





