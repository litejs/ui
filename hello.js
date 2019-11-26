
!function(window, document, xhr) {
	var auth, hash, poll
	, events = []

	// JSON.parse and sessionStorage IE8

	Object.each({ DELETE: "del", GET: 0, PATCH: 0, POST: 0, PUT:0 }, addMethod)

	xhr.addMethod = addMethod
	xhr.hello = hello

	function hello(data, next) {
		var put = {
			a: nameStorage(window).a
		}
		if (!put.a) {
			put.b = nameStorage(window.opener).a || sessionStorage.getItem("act")
			put.c = document.referrer
		}

		xhr.put("/hello", function(err, json) {
			auth = json && json.authorization
			poll = json && json.user
			if (json && json.a) {
				nameStorage(window, {a: json.a})
				hash = json.a
			}
			if (next) {
				next.call(this, err, json)
			}
			setTimeout(xhrPoll, 1500)
			onFocus()
		}, Object.assign(put, data))
	}

	xhr.logout = function() {
		xhr.del("/hello", function(err, json) {
			authorization = null
			location.reload()
		})
	}
	/*, ws
	try {
		new WebSocket("ws" + location.protocol.slice(4) + "//" + location.host + "/events")
		.addEventListener("open", function(ev) {
			ws = this
			ws.send(put)
		})
	} catch(e) {}
	function wsReq(method, url, next, data) {
		// Prior to version 11, Firefox only supported sending data as a string.
		ws.send(JSON.stringify({method:method,url:url,data:data}))
	}
	*/

	El.on(window, "focus", onFocus)
	El.on(window, "unload", function() {
		xhr.unload = true
		if (events.length) navigator.sendBeacon("/events", JSON.stringify(events))
	})

	function addMethod(name, method) {
		xhr[name || method.toLowerCase()] = xhr[method] = xhrReq.bind(null, method)
	}

	function xhrReq(method, url, next, data) {
		var req = xhr(method, url, function onResponse(err, txt) {
			var body = (
				req.getResponseHeader("Content-Type") == "application/json" ?
				JSON.parse(txt) :
				{ message: txt, code: err }
			)
			if (next && next.call(this, err, body, req) === true) return
			if (err) {
				View.emit(
					View._e["xhr:" + err] ? "xhr:" + err : "xhr:err",
					body, method, url, data, onResponse, xhrSend
				)
			}
		})
		xhrSend(req, data)
		return req
	}

	function xhrSend(req, data) {
		if (auth) {
			req.setRequestHeader("Authorization", auth)
		}
		if (data) {
			req.setRequestHeader("Content-Type", "application/json")
		}
		req.send(data ? JSON.stringify(data) : null)
	}

	function xhrPoll() {
		if (poll) {
			xhr.post("/events", pollHandler, events.length > 0 ? events.splice(0) : null)
		}
	}

	function pollHandler(err, res) {
		var i = 0
		, events = !err && (Array.isArray(res) ? res : res.events)
		, len = events && events.length || 0

		if (len) for (; i < len; ) {
			try {
				View.emit("event", events[i++])
			} catch(e) {
				console.error(e)
			}
		}

		setTimeout(xhrPoll, err ? 6000 : 600)
	}

	function nameStorage(win, append) {
		var data = {}
		try {
			// RE against XSS
			data = JSON.parse(win.name.match(/^{[\w:"]*}$/)[0])
		} catch(e) {}
		if (append) {
			win.name = JSON.stringify(Object.assign(data, append))
		}
		return data
	}

	function onFocus() {
		if (hash && document.hasFocus()) {
			sessionStorage.setItem("act", hash)
		}
	}
}(this, document, xhr)

