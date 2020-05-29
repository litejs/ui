
/* litejs.com/MIT-LICENSE.txt */



// With initial congestion window set to 2 and 1452 bytes of data in a segment.
//
// 1 round trip to get 2904 bytes, Initial Window (IW) = 2
// 2 round trips to get 8712 bytes, Congestion Window (CW)=4
// 3 round trips to get 20328 bytes, CW = 8
// 4 round trips to get 43560 bytes, CW = 16


// Scripts that are dynamically created and added to the document are async by default
// HTML5 declared that browsers shouldn’t download scripts with an unrecognised type


// IE9 and below allows up to 32 stylesheets, this was increased to 4095 in IE10.

// You can invalidate a URL in the browser's cache by sending a PUT method xmlhttprequest to it:
// xhr("PUT", url).send(null) Works in all major browsers

// XMLHttpRequest was unsupported in IE 5-6 and PATCH is not supported in IE7-8.
// IE does not allow to add arbitrary properties to ActiveX objects.
// IE does not allow to assign or read the readystatechange after the send().
// Last version-independent ProgID with 3.0 is good enough (MSXML2 is supported from IE4.01).
// MSXML 6.0 has improved XSD, deprecated several legacy features
// What's New in MSXML 6.0: https://msdn.microsoft.com/en-us/library/ms753751.aspx

!function(window, next) {
	var seq = 0
	, xhrs = []
	, loaded = {}
	, urlEscRe = /[+#\s]+/g
	, XMLHttpRequest = +"\v1" && window.XMLHttpRequest || Function("return new ActiveXObject('MSXML2.XMLHTTP')")
	, execScript = window.execScript ||
		// THANKS: Juriy Zaytsev - Global eval [http://perfectionkills.com/global-eval-what-are-the-options/]
		Function("d,Date", "return(1,eval)('(Date)')==d&&eval")(Date, 1) ||
		Function("a", "var d=document,b=d.body,s=d.createElement('script');s.text=a;b.removeChild(b.insertBefore(c,b.firstChild))")

	/*** errorLog ***/
	, lastError
	, unsentErrors = []

	window.onerror = onerror
	function onerror(message, file, line, col, error) {
		// Do not send multiple copies of the same error.
		if (lastError !== (lastError =
			[ file
			, line
			, col || (window.event || unsentErrors).errorCharacter || "?"
			, message
			].join(":")
		) && 1 == unsentErrors.push(
			[ lastError
			, error && (error.stack || error.backtrace || error.stacktrace) || "-"
			, +new Date()
			, "" + location
			]
		)) setTimeout(sendErrors, 307)
	}

	function sendErrors() {
		if (xhr.logErrors) {
			xhr.logErrors(unsentErrors)
		} else {
			setTimeout(sendErrors, 1307)
		}
	}
	/**/

	// next === true is for sync call
	//
	// Hypertext Transfer Protocol (HTTP) Status Code Registry
	// http://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml
	//

	window.xhr = xhr
	function xhr(method, url, next, attr1, attr2) {
		// encodeURI("A + B").replace(/%5[BD]/g, decodeURI).replace(/\+/g, "%2B").replace(/%20/g, "+")
		// unescape("A+%2B+B".replace(/\+/g, " "))
		var xhr = xhrs.shift() || new XMLHttpRequest()

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
		// xhr.upload.addEventListener("progress", onProgressHandler)
		// xhr.addEventListener("progress", onProgressHandler)
		// xhr.onprogress = progress


		// Vodafone 360 doesn't pass session cookies, so they need to be passed manually
		// if (sessionID) xhr.setRequestHeader("Cookie", sessionID);
		// if (xhr.getResponseHeader("Set-Cookie")) sessionID = xhr.getResponseHeader("Set-Cookie");


		xhr.open(method, url.replace(urlEscRe, encodeURIComponent).replace(/%20/g, "+"), next !== true)


		// With IE 8 XMLHttpRequest gains the timeout property.
		// With the timeout property, Web developers can specify
		// the length of time in milliseconds for the host to wait for a response
		// before timing out the connection.

		//xhr.timeout = 10000
		//xhr.ontimeout = timeoutRaised

		if (next !== true) xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
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
				//   - Use CloudFlare status "522 Connection Timed Out" for network error

				method = xhr.status || (xhr.responseText ? 200 : 522) // Reuse variable for status
				if (next) next.call(
					xhr,
					(method < 200 || method > 299 && method != 304 && method != 1223) && method,
					xhr.responseText,
					url,
					attr1,
					attr2
				)
				xhr.onreadystatechange = next = nop
				xhrs.push(xhr)
			}
		}
		return xhr
	}


	/*** require ***/
	var modules = {}
	, process = window.process = {
		env: {}
	}

	//process.memoryUsage = function() {
	//	return (window.performance || {}).memory || {}
	//}

	window.require = require
	function require(name) {
		var mod = modules[name]
		if (!mod) throw Error("Module not found: " + name)
		if (typeof mod == "string") {
			var exports = modules[name] = {}
			, module = { id: name, filename: name, exports: exports }
			Function("exports,require,module,process,global", mod).call(
				exports, exports, require, module, process, window
			)
			mod = modules[name] = module.exports
		}
		return mod
	}

	require.def = function(map, key) {
		for (key in map) modules[key] = map[key]
	}
	/**/

	/**
	 *  1. FireFox 3.0 and below throws on `xhr.send()` without arguments.
	 *     You can work around this by explicitly setting the message body to null.
	 */

	xhr.load = load
	function load(files, next, raw) {
		if (typeof files == "string") files = [files]
		var file
		, len = files && files.length
		, i = 0
		, pending = 0
		, res = []

		for (; i < len; i++) if ((file = files[i]) && file !== loaded[file]) {
			if (loaded[file]) {
				!function(old, i2) {
					loaded[file] = function(err, str, file, i) {
						old(err, str, file, i)
						cb(1, str, file, i2)
					}
				}(loaded[file], i)
			} else {
				loaded[file] = cb
				xhr("GET", file, function(err, str, file, i) {
					loaded[file](err, str, file, i)
				}, pending).send(null)                            /* 1 */
			}
			pending += 1
		}

		if (!pending && next) next()

		function cb(err, str, file, i) {
			loaded[file] = file
			if (err) {
				res[i] = ""
				onerror(err, file)
			} else {
				res[i] = str
				err = file.split("?")[0].split(".").pop()
				if (!raw && err != "js") {
					xhr[++seq] = str
					res[i] = "xhr." + err + "(xhr[" + seq + "]);delete xhr[" + seq + "]"
				}
			}
			if (!--pending) {
				if (!raw) execScript( res.join("/**/;") || ";" )
				if (next) next(files, res, raw)
			}
		}
	}

	load([/*!{loadFiles}*/], next)

	function nop() {}
}(this)

