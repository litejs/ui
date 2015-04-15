
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

_.add("et", {
	Header: "Pealkiri",
	Home: "Kodu",
	Users: "Kasutajad",
	"User {user}": "Kasutaja {user}",
	_welcome: "tervitustekst",
	date: "%Y %H:%M:%S %z",
	Bye: "Lõpp",
	Settings: "Suvandid",
	"Broken link": "Katkine link",
	"Error 404": "Viga 404",
	name: "Nimi"
})








!function(View, Controller) {
	var user
	, app = El(".app")


	Controller.setLang = function() {
		_.use(this.attr("lang"))
		console.log("lang", _.get())
		document.body.render()
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

	View.def("main.tpl #public,#private,404,home,login,users,users/{id},settings")

	// Add `#body` view, it is a starting point for us.
	// It could be any element on page but we want to start from `BODY`.
	View("#body", document.body)
	.on("ping", function() {
		document.body.findAll(".nav").render()
	})

	View("#private")
	.on("ping", function(opts) {
		var url = history.getUrl()
		if (!user && View.active != "login") {
			View.show("login")
		}
	})

	// Define landing page
	View.main = "home"
	View.base = "views/"

	// Read in templates from element with id=index
	//El.include("index")

	// Start a router to showing views
	history.start(View.show)

}(View, Controller)





