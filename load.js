


// Say you have an initial congestion window set to 2
// and you can fit 1452 bytes of data in a segment.
//
// 1 round trip to get 2904 bytes, Initial Window (IW) = 2
// 2 round trips to get 8712 bytes, Congestion Window (CW)=4
// 3 round trips to get 20328 bytes, CW = 8
// 4 round trips to get 43560 bytes, CW = 16


// Scripts that are dynamically created and added to the document are async by default
// HTML5 declared that browsers shouldn’t download scripts with an unrecognised type


!function(window, scripts, next) {
	var xhrs = []
	, loaded = {}
	, seq = 0
	, ie678 = !+"\v1"


	//** error
	, lastError
	, unsentErrors = []

	window.onerror = function(message, file, line, col, error) {
		// Do not send multiple copies of the same error.
		if (lastError !== (lastError =
			[ file
			, line
			, col || (window.event || {}).errorCharacter || "?"
			, message
			].join(":")
		) && 1 == unsentErrors.push(
			[ lastError
			, error && (error.stack || error.backtrace || error.stacktrace) || "-"
			, +new Date()
			, window.location
			].join("\n")
		)) setTimeout(sendErrors, 307)
	}

	function sendErrors() {
		if (xhr.logErrors) {
			xhr.logErrors(unsentErrors)
			unsentErrors.length = 0
		} else {
			setTimeout(sendErrors, 1307)
		}
	}
	//*/

	function nop() {}

	function lazy(obj, name, str, force) {
		if (force || !obj[name]) {
			obj[name] = new Function("a,b,c,d", str)
		}
	}
	// function lazy(obj, name, str) {
	// 	if (!obj[name]) obj[name] = function() {
	// 		return (obj[name] = new Function("a,b,c,d", str)).apply(this, arguments)
	// 	}
	// }

	// XMLHttpRequest was unsupported in IE 5-6
	// IE7-8 XMLHttpRequest PATCH is not supported, use ActiveXObject there.
	// IE does not allow to add arbitrary properties to ActiveX objects.
	// IE does not allow to assign or read the readystatechange after the send().
	// MSXML version 3.0 was the last version of MSXML to support version-independent ProgIDs.
	lazy(window, "XMLHttpRequest", "return new ActiveXObject('MSXML2.XMLHTTP')", ie678)


	// eval in a global context for non-IE & non-Chrome (removed form v8 on 2011-05-23: Version 3.3.9)
	// THANKS: Juriy Zaytsev - Global eval [http://perfectionkills.com/global-eval-what-are-the-options/]
	if (!window.execScript) {
		Function("d,Date,w", "w.execScript=(1,eval)('(Date)')==d&&eval")(Date, 1, window)
	}

	lazy(window, "execScript", "d=document;b=d.body;c=d.createElement('script');c.text=a;b.removeChild(b.insertBefore(c,b.firstChild))")

	// next === true is for sync call
	//
	// Hypertext Transfer Protocol (HTTP) Status Code Registry
	// http://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml
	//

	function xhr(method, url, next, attr1, attr2) {
		var xhr = xhrs.shift() || new XMLHttpRequest()

		// To be able to reuse the XHR object properly,
		// use the open method first and set onreadystatechange later.
		// This happens because IE resets the object implicitly
		// in the open method if the status is 'completed'.
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


		xhr.open(method, url, next !== true)


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
				//   - File protocol returns status code 0
				//   - Android 4.1 returns status code 0 when cache manifest is used
				//   - IE 10-11 returns status code 0 with CORS for codes 401, 403

				method = xhr.status || 200 // Reuse variable for status
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
	window.xhr = xhr



	//** require
	var modules = {}
	, process = {
		env: {},
		nextTick: window.setImmediate || window.requestAnimationFrame || window.setTimeout
	}

	//process.memoryUsage = function() {
	//	return (window.performance || {}).memory || {}
	//}

	function require(name) {
		var mod = modules[name]
		if (!mod) throw new Error("Module not found: " + name)
		if (typeof mod == "string") {
			var exports = modules[name] = {}
			, module = { id: name, filename: name, exports: exports }
			new Function("exports,module,process,require,global", mod).call(exports, exports, module, process, require, window)
			mod = modules[name] = module.exports
		}
		return mod
	}
	window.require = require

	require.def = function(map, key) {
		for (key in map) modules[key] = map[key]
	}
	//*/


	// IE9 and below allows up to 32 stylesheets.
	// The number was increased to 4095 in IE10.

	function load(files, next) {
		if (typeof files == "string") files = [files]
		var file
		, len = files.length
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
				}, pending).send()
			}
			pending += 1
		}

		if (!pending && next) next()

		function cb(err, str, file, i) {
			loaded[file] = file
			res[i] = ""
			if (!err) {
				err = file.split("?")[0].split(".").pop()
				if (err == "js") {
					res[i] = str
				} else {
					xhr[++seq] = str
					res[i] = "El." + err + "(xhr[" + seq + "]);delete xhr[" + seq + "]"
				}
			}
			if (!--pending) {
				execScript( res.join("/**/;") )
				if (next) next(files, res)
			}
		}
	}

	// Function.prototype.bind is most missing fn
	// http://kangax.github.io/es5-compat-table/

	xhr.load = load

	load(scripts, next)

	/*
	 * You can invalidate a URL in the browser's cache by sending a PUT method xmlhttprequest to it:
	 * xhr("PUT", url).send()
	 * (Works in all major browsers)
	 */

}(this,[])

