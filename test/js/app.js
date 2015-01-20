
// Clickjacking defense,
// site should break out of the site that is framing it.
// There are multiple ways of defeating this script.
// If the user’s browser has Javascript turned off,
// the site will not display at all.
if (self !== top) throw top.location = self.location



// Mediator
var M = Object.create(Event.Emitter)

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
	xhr.logErrors = function(arr) {
		xhr("POST", "/errlog").send(arr.join("\n\n"))
	}
}(xhr)


M.on("event", function(ev) {
	var cam = ev.id && List.cameras.prototype.model.cached[ev.id]
	if (cam) {
		cam.set(ev)
	}
})


!function(window) {
	var cache = window.applicationCache
	function onUpdateReady() {
		if (cache.status === cache.UPDATEREADY) {
			cache.swapCache()
			//if (confirm("A new version of this site is available. Load it?")) {
			//	window.location.reload()
			//}
		}
	}
	if (cache) {
		// window.applicationCache.update()
		// // Check if a new cache is available on page load.
		// window.applicationCache.addEventListener('ondownloading', function(e) {
		//     window.applicationCache.abort();
		// }, false);
		// // Just abort the download when you catch the ondownloading event.


		cache.addEventListener("updateready", onUpdateReady)
		//onUpdateReady();
	}
}(this)


List.api = List.extend({
	wait: Fn.Lazy.wait.partial(['add','model','merge','on','sortFn','toString']),
	init: function(name) {
		var t = this
		t.name = name || t.path
		t.load()
	},
	load: function() {
		var t = this
		t.loaded = false
		t.emit('touch')

		t.wait();

		xhr.get(t.name, function(err, res) {
			t.loaded = true
			if (err) {
				t.resume()
				t.emit('error', err)
				return
			}
			var arr = Array.isArray(res) ? res : res.body || res.items


			arr && arr.each(function(item){
				t.add(item)
			})
			t.resume()
			t.emit('load')
		})
		return t
	},
	model: Model.extend({
		getUrl: function(){
			return this.lists[0].name + '/' + this.get('id')
		},
		save: function(data, next) {
			var t = this
			, set = Model.prototype.set
			, changed = set.call(t, data)

			if (changed.length) {
				xhr.patch(t.getUrl(), data, next)
			}
		},
		destroy: function(next){
			xhr.del(this.getUrl(), next)
		}
	}),
	create: function(data, next) {
		var t = this

		xhr.post(t.name, data, function(err, obj) {
			if (!err) t.add(obj)
			next && next(err, obj)
		})
	},
	getSchema: function(next) {
		next && next(null, this.schema)
	}
})


List.authorizations = List.api.extend({
	path: '/api/v1/authorizations',
	model: List.api.prototype.model.extend({
		set: function(data) {
			var type = data.token_type
			if (type == "Bearer" || type == "cam_token") {
				data.name = data.access_token
				data.info = type
			} else {
				data.name = type
				data.info = "username & password"
			}
			List.api.prototype.model.prototype.set.apply(this, arguments)
		}
	})
})


List.users = List.api.extend({
	path: '/api/v1/users',
	schema: {
		"title": "User",
		"type": "object",
		"properties": {
			"id": {
				"type": "integer",
				"readonly": true
			},
			"name": {
				"type": "string",
				"required": true,
				"maxLength": 99
			},
			"is_admin": { "type": "boolean", "default": false },
			"quota_mb_limit": {
				"default": -1,
				"type": "integer"
			},
			"quota_mb_used": {
				"default": 0,
				"readonly": true,
				"type": "integer"
			},
			"quota_h_limit": {
				"default": -1,
				"type": "integer"
			},
			"quota_h_used": {
				"default": 0,
				"readonly": true,
				"type": "integer"
			}
		}
	},
	model: List.api.prototype.model.extend({
		getAuthorizations: function() {
			return List.authorizations(this.getUrl() + '/authorizations')
		}
	})
})



El.cache('list-box', El('div'), function(args) {
	var el = this

	El('h2', args.title).to(el)

	var box = El('.box').to(el)

	El('.empty', args.empty||'').to(box)
	var ul = El('ul.reset.list').to(box)
	El('.loading', args.loading||' ').to(box)

	function update(){
		el.toggleClass('in-progress', !args.list.loaded)
		el.toggleClass('is-empty', args.list.loaded && !args.list.items.length)
	}

	function add_item(item, pos) {
		var row = El(args.tpl || 'row', item.data).to(ul, pos)

		args.icon && row.find('.i').addClass('i-'+args.icon)

		args.list_action && row.on('click', function(){
			args.list_action(row, item)
		})

		args.bind && Object.each(args.bind, function(fn, key){
			var el = row.find(key)
			el.on('click', function(e){
				fn(row, item, this)
				Event.stop(e)
			})
		})

		item.on('change', function(){
			row.render(item.data)
		})

		update()
	}

	function remove(item, pos){
		ul.childNodes[pos].kill()
		update()
	}

	var list = args.list

	list.loaded && list.each(add_item)

	list
	.on('load', update)
	.on('error', update)
	.on('touch', update)
		.on('add', add_item)
		.on('remove', remove)

	el.killHook=function(){
		list.non('load', update)
			.non('add', add_item)
			.non('remove', remove)
	}

	update()

	return el
})



El.include('index')



!function() {
	var user
	, app = El(".app")

	El.i18n.use("en")

	function emit_login(err, res) {
		M.authorization = res && res.authorization
		M.emit('login_' + (err || (!res.user.is_admin&&M.admin) ? 'fail' : 'ok'), res)
	}

	M.my = function(url) {
		return user && '/api/v1/users/' + user.id + '/' + url
	}

	M.on('login', function(args) {
		xhr.post(
			'/api/v1/auth',
			{ name: args.user, token: crypto.sha1(args.user +':'+ args.pass) },
			emit_login
		)
	})

	M.on('logout', function(args) {
		List.api.cached = {}
		user = null
		xhr.get(
			'/api/v1/logout',
			function(err, res) {
				history.setUrl('')
				location.reload( false )
			}
		)
	})

	M.on('login_ok', function(args) {
		user = args && args.user
		View.show(history.getUrl())
	    xhr.poll(true)
	})
	M.on('login_fail', function(args) {
		user = null
		View.show(history.getUrl())
	    xhr.poll(false)
	})


	View('body', document.body)

	View('public', app, 'body')

	View('private', app, 'body')
	.on('ping', function(){
		var url = history.getUrl()
		if (!user && View.active != 'welcome') {
			View.show('welcome')
		} else if (user != this.user) {
			this.user = user
			var userEl = this.el.find('a.user')
			if (userEl) userEl.innerHTML = user.name
		}
	})

	View('logout', 'logout', 'public')
	.on('show', function(){
		M.emit('logout')
	})


	View('home', 'index', 'private', '#app-body')
	.on('ping', function(opts) {
		var tabs = this.el.find('#tabs');
		if (tabs) for (var arr = tabs.childNodes, i = arr.length; i--;) {
			arr[i].toggleClass('s-active', View.active.indexOf(arr[i].firstChild.href.split('#')[1]) == 0 )
		}
	})

	View('welcome', 'login', 'public')
	.once('show', function(){
		var el = this.el

		var form = el.find('form')
		  , info = el.find('.err')

		function fail(d) {
			el.rmClass('loading')
		  info.innerHTML = ((d||{}).error||{}).message || 'Login failed'
		}

		M.on('login_ok', function(){
			//form.find('.login_name').value = form.find('.login_pass').value = ''
		})

		form.action = 'javascript:';
		form.on('submit', function(){
			M.once('login_fail', fail)
			M.emit('login', {user:form.find('.login_name').value, pass:el.find('.login_pass').value})
			el.addClass('loading');
			info.innerHTML = '';
		})

		el.killHook = function() {
		  M.non('login_fail', fail)
		}
		el.append_hook = function(){
			form.find('.login_name').focus()
		}
	})


	View('settings', '.settings', 'home')

	xhr.get('/api/v1/auth', emit_login)

	document.title='Caamerad'

}()








View("body", document.body)

View("home", ".index", "body")
.once("show", function(){
	El(".hi", "Hello").to(this.el)
})



View.default = "home"
history.start(View.route)
document.title = 'Demo app'
document.documentElement // html



