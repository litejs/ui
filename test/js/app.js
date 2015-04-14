
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

!function(xhr) {
	var authorization, pollOpen

	xhr.get = function(url, next) {
		makeReq("GET", url, next).send()
	}

	xhr.del = function(url, next) {
		makeReq("DELETE", url, next).send()
	}

	xhr.post = function(url, data, next) {
		makeReq("POST", url, next).send(JSON.stringify(data))
	}

	xhr.patch = function(url, data, next) {
		makeReq("PATCH", url, next).send(JSON.stringify(data))
	}

	xhr.poll = function(s) {
		if (pollOpen != (pollOpen = s)) longPoll()
	}

	xhr.auth = function(data, next) {
		xhr.post("/api/v1/auth", data, function(err, json) {
			authorization = !err && json.authorization
			if (next) next(err, json)
			M.emit("login_ok/fail")
		})
	}

	xhr.logout = function() {
		xhr.post("/api/v1/logout", {}, function(err, json) {
			authorization = null
			history.setUrl('welcome', true)
			location.reload( false )
		})
	}

	function makeReq(method, url, next) {
		var req = xhr(method, url, function(err, txt) {
			if (err == 401) return M.emit("login_fail")
			// if Content-Type == "application/json"
			if (next) next(err, !err && txt && JSON.parse(txt), req)
		})
		if (authorization) req.setRequestHeader("Authorization", authorization)
		req.setRequestHeader("Content-Type", "application/json")
		return req
	}

	function longPoll() {
		if (pollOpen) xhr.get("/api/v1/logs", pollHandler)
	}

	function pollHandler(err, res) {
		var i = 0
		, events = !err && (Array.isArray(res) ? res : res.events)
		, len = events && events.length || 0

		if (len) for (;i<len;) M.emit("event", events[i++])

		setTimeout(longPoll, err ? 6000 : 600)
	}
	xhr._logErrors = function(arr) {
		xhr("POST", "/errlog").send(arr.join("\n\n"))
	}
}(xhr)








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





