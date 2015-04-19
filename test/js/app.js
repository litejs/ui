
// Clickjacking defense,
// site should break out of the site that is framing it.
// There are multiple ways of defeating this script.
// If the user’s browser has Javascript turned off,
// the site will not display at all.
if (self !== top) throw top.location = self.location



// Mediator
var M = Object.create(Event.Emitter)
, Controller = {}
, _ = El.i18n

_.def({ "en":"In English"
	, "et":"Eesti keeles"
	, "ru":"На русском"
	, "fi":"Suomeksi"
	, "se":"på Svenska"
})

El.global.location = location


!function(View, Controller) {
	var user
	, app = El(".app")

	function setLang(lang, next) {
		xhr.load("lang/" + lang + ".js", next)
	}


	Controller.setLang = function() {
		setLang(_.use(this.attr("lang")), function() {
			document.body.render()
		})
	}

	Controller.login = function(e) {
		var data = JSON.serializeForm(this)
		user = El.global.user = data
		View.show(history.getUrl())
	}

	Controller.logout = function() {
		user = null
		View.show(history.getUrl())
	}

	document.title = "Litejs Example"

	View.def("main.tpl,main.css #public,#private,404,home,login,users,users/{id},settings")

	// Add `#body` view, it is a starting point for us.
	// It could be any element on page but we want to start from `BODY`.
	View("#body", document.body)
	.on("ping", function() {
		console.log("render body")
		document.body.findAll(".nav").render()
	})

	View("#private")
	.on("ping", function(opts) {
		var url = history.getUrl()
		if (!user && View.active != "login") {
			View("login").show()
		}
	})

	View("users")
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

}(View, Controller)





