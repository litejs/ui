
!function(window, xhr) {
	var auth, poll
	, put = getName(window)

	if (!put.a) {
		put.b = getName(window.opener).a || sessionStorage.getItem("last")
		put.c = document.referrer
	}

	// JSON.parse and sessionStorage IE8

	Object.each(
		{ DELETE: "del", GET: 0, PATCH: 0, POST: 0, PUT:0 },
		function(name, method) {
			xhr[name || method.toLowerCase()] = xhr[method] = xhrReq.bind(null, method)
		}
	)

	xhr.hello = function(data, next) {
		xhr.put("/hello", function(err, json) {
			auth = !err && json.authorization
			if (!err && json.a) {
				put.a = json.a
				window.name = JSON.stringify(put)
			}
			if (next) {
				next(err, json)
			}
			setTimeout(xhrPoll, 1500)
		}, data)
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


	function xhrReq(method, url, next, data) {
		var req = xhr(method, url, function onResponse(err, txt) {
			var body = (
				req.getResponseHeader("Content-Type") == "application/json" ?
				JSON.parse(txt) :
				txt
			)
			if (err) {
				View.emit("xhr:" + err, body, method, url, data, onResponse, xhrSend)
			} else if (next) {
				next(err, body, req)
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
		if (auth) {
			xhr.put("/events", pollHandler)
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

	function getName(a) {
		try {
			// RE against XSS
			a = JSON.parse(a.name.match(/^{[\w:"]*}$/)[0])
		} catch(e) {
			a = {}
		}
		return a
	}

	El.on(window, "focus", onFocus)
	function onFocus() {
		sessionStorage.setItem("last", put.a)
	}
}(this, xhr)

