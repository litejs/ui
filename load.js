
/*! litejs.com/MIT-LICENSE.txt */

/* global document, location */

// With initial congestion window set to 2 and 1452 bytes of data in a segment.
//  - 1 round trip to get 2904 bytes, Initial Window (IW) = 2
//  - 2 round trips to get 8712 bytes, Congestion Window (CW) = 4
//  - 3 round trips to get 20328 bytes, CW = 8
//  - 4 round trips to get 43560 bytes, CW = 16
//
// Dynamically created scripts are async by default.
// HTML5 declared that scripts with an unrecognised type should not be downloaded.
//
// IE9 and below allows up to 32 stylesheets, this was increased to 4095 in IE10.
//
// Invalidate a URL in the browser's cache by sending a PUT method xmlhttprequest to it:
// xhr("PUT", url).send(null) Works in all major browsers


!function(window) {
	var rewrite = {
		//!{loadRewrite}
	}
	/*** log ***/
	, initTime = xhr._t = +new Date()
	/**/
	// Expose xhr._c for testing.
	, loaded = /*** debug ***/ xhr._c = /**/ {}

	/*** ie9 ***/
	, Fn = Function
	, execScript =
		// IE5-10, Chrome1-12
		window.execScript ||
		// THANKS: Juriy Zaytsev - Global eval [http://perfectionkills.com/global-eval-what-are-the-options/]
		// In case of local execution `e('eval')` returns undefined
		Fn("e,eval", "try{return e('eval')}catch(e){}")(eval) ||
		Fn("a", "var d=document,b=d.body,s=d.createElement('script');s.text=a;b.appendChild(s)")

	// Move setTimeout from window.prototype to window object for future patching in IE9.
	, setTimeout_ = window.setTimeout = setTimeout

	// XHR memory leak mitigation
	, xhrs = []

	// XMLHttpRequest in IE7-8 do not accept PATCH, use ActiveX.
	// IE disallows adding custom properties to ActiveX objects and read/write readystatechange after send().
	, XMLHttpRequest = +"\v1" && window.XMLHttpRequest || Fn("return new ActiveXObject('Microsoft.XMLHTTP')")
	/*/
	, execScript = eval
	, setTimeout_ = setTimeout
	/**/

	/*** log ***/
	, unsentLog = xhr._l = []
	, lastError
	, onerror = window.onerror = function(message, file, line, col, error) {
		// Do not send multiple copies of the same error.
		// file = document.currentScript.src || import.meta.url
		if (lastError !== (lastError =
			[ file
			, line
			, col || (window.event || unsentLog).errorCharacter || "?"
			, message
			].join(":")
		)) log("e", lastError, [error && (error.stack || error.stacktrace) || "-", "" + location])
	}
	, log = xhr.log = function(type, msg, extra) {
		if (unsentLog.push([new Date() - initTime, type].concat(msg, extra || [])) < 2) sendLog()
		function sendLog() {
			setTimeout_(xhr.sendLog || sendLog, 1307)
		}
	}
	/**/


	/*** theme ***/
	, ALT_THEME = "dark"
	, matchMedia = window.matchMedia
	, localStorage = window.localStorage
	if (ALT_THEME == (
		localStorage && localStorage.theme ||
		matchMedia && matchMedia("(prefers-color-scheme:dark)").matches && ALT_THEME
	)) {
		document.documentElement.className = "is-" + ALT_THEME
	}
	/**/

	window.xhr = xhr
	// next === true is for sync call
	function xhr(method, url, next, attr1, attr2) {
		var req = /*** ie9 ***/ xhrs.pop() || /**/ new XMLHttpRequest()

		// To be able to reuse the XHR object properly,
		// use the open method first and set onreadystatechange later.
		// This happens because IE resets the object implicitly
		// in the open method if the status is 'completed'.
		// MSXML 6.0 fixed that
		//
		// The downside to calling the open method after setting the callback
		// is a loss of cross-browser support for readystates.
		// http://www.quirksmode.org/blog/archives/2005/09/xmlhttp_notes_r_2.html

		// function progress(ev) {
		// 	if (ev.lengthComputable) {
		// 		var percentComplete = (ev.loaded / ev.total) * 100
		// 	}
		// }
		// req.upload.addEventListener("progress", onProgressHandler)
		// req.addEventListener("progress", onProgressHandler)
		// req.onprogress = progress

		// Vodafone 360 doesn't pass session cookies, so they need to be passed manually
		// if (sessionID) req.setRequestHeader("Cookie", sessionID);
		// if (req.getResponseHeader("Set-Cookie")) sessionID = req.getResponseHeader("Set-Cookie");

		req.open(method, rewrite[url] || url, next !== true)

		// With IE8 XMLHttpRequest gains the timeout property (length of time in milliseconds).
		// req.timeout = 10000
		// req.ontimeout = timeoutRaised

		if (next !== true) req.onreadystatechange = function() {
			if (req.readyState > 3) {
				// From the XMLHttpRequest spec:
				//
				// > For 304 Not Modified responses
				// > that are a result of a user agent generated conditional request
				// > the user agent must act as if the server gave a 200 OK response
				// > with the appropriate content.
				//
				// In other words, the browser will always give status code 200 OK,
				// even for requests that hit the browser cache.
				//
				// However, the spec also says:
				//
				// > The user agent must allow author request headers
				// > to override automatic cache validation
				// > (e.g. If-None-Match or If-Modified-Since),
				// > in which case 304 Not Modified responses must be passed through.
				//
				// So, there is a workaround to make the 304 Not Modified responses visible
				// to your JavaScript code.
				//
				//   - Opera 8.x passes 304
				//   - IE9 returns 1223 and drop all response headers from PUT/POST
				//     when it should be 204,
				//     http://www.enhanceie.com/ie/bugs.asp
				//   - File protocol and Appcache returns status code 0
				//   - Android 4.1 returns status code 0 when cache manifest is used
				//   - IE 10-11 returns status code 0 with CORS for codes 401, 403
				//     Fix: Internet options -> Trusted sites -> Custom Level ->
				//          Miscellaneous -> Access data sources across domains -> Enable
				//   - Use custom status code 1 for network error

				method = req.status || (req.responseText ? 200 : 1)
				if (next) next.call(
					req,
					(method < 200 || method > 299 && method != 304 && method != 1223) && method,
					req.responseText,
					url,
					attr1,
					attr2
				)
				req.onreadystatechange = next = null
				/*** ie9 ***/
				xhrs.push(req)
				/**/
			}
		}
		return req
	}


	/*** load ***/
	xhr.load = load
	function load(files, next, raw) {
		files = [].concat(files)
		var file
		, pos = 0
		, len = files.length
		, res = []

		for (; pos < len; pos++) if ((file = files[pos])) {
			if (loaded[file] === 2) files[pos] = 0
			else if (loaded[file]) {
				// Same file requested again before responce
				;(loaded[file].x || (loaded[file].x = [])).push(exec, res, pos)
			} else {
				// FireFox 3 throws on `xhr.send()` without arguments
				xhr("GET", file, loaded[file] = cb, pos).send(null)
			}
		}
		exec(pos = 0)

		function cb(err, str, fileName, filePos) {
			loaded[fileName] = 2
			res[filePos] = err ? (/*** log ***/ onerror(err, fileName),/**/ "") : str
			exec()
		}
		function exec() {
			if (res[pos]) {
				if (raw) {
					files[pos] = 0
				} else {
					try {
						var execResult = (xhr[files[pos].replace(/[^?]+\.|\?.*/g, "")] || execScript)(res[pos], files[pos])
						if (execResult && execResult.then) {
							res[pos] = 0
							return execResult.then(function() {
								res[pos] = ""
								exec()
							})
						}
					} catch(e) {
						/*** log ***/
						onerror(e, files[pos])
						/**/
					}
					res[pos] = ""
				}
			}
			if (res[pos] === "" || !files[pos]) {
				if (++pos < len) exec()
				/*** ie9 ***/
				// inject can be async
				else if (pos === len && execScript !== eval) setTimeout_(exec, 1)
				/**/
				else {
					if (next) next(res)
					if ((next = cb.x)) {
						for (pos = 0; next[pos]; ) next[pos++](next[pos++][next[pos++]] = "")
					}
				}
			}
		}
	}

	load([
		//!{loadFiles}
	])
	/**/

}(this) // jshint ignore:line

