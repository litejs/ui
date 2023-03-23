
/* litejs.com/MIT-LICENSE.txt */



// With initial congestion window set to 2 and 1452 bytes of data in a segment.
//
// 1 round trip to get 2904 bytes, Initial Window (IW) = 2
// 2 round trips to get 8712 bytes, Congestion Window (CW) = 4
// 3 round trips to get 20328 bytes, CW = 8
// 4 round trips to get 43560 bytes, CW = 16


// Scripts that are dynamically created and added to the document are async by default
// HTML5 declared that browsers shouldn’t download scripts with an unrecognised type


// IE9 and below allows up to 32 stylesheets, this was increased to 4095 in IE10.

// Invalidate a URL in the browser's cache by sending a PUT method xmlhttprequest to it:
// xhr("PUT", url).send(null) Works in all major browsers

// XMLHttpRequest was unsupported in IE 5-6 and PATCH is not supported in IE7-8.
// XDomainRequest is a CORS implementation in IE8/9 and was removed in IE10 in favor of using XMLHttpRequest with proper CORS
// IE does not allow to add arbitrary properties to ActiveX objects.
// IE does not allow to assign or read the readystatechange after the send().
// Last version-independent ProgID with 3.0 is good enough (MSXML2 namespace is supported from IE6).
// MSXML 6.0 has improved XSD, deprecated several legacy features
// What's New in MSXML 6.0: https://msdn.microsoft.com/en-us/library/ms753751.aspx

!function(window, Function, setTimeout) {
	xhr._s = new Date()
	var loaded = {}
	, rewrite = {
		//!{loadRewrite}
	}
	/*** activex ***/
	, XMLHttpRequest = +"\v1" && window.XMLHttpRequest || Function("return new ActiveXObject('Microsoft.XMLHTTP')")
	/**/
	, execScript =
		// IE5-10, Chrome1-12
		window.execScript ||
	/*** inject ***/
		// THANKS: Juriy Zaytsev - Global eval [http://perfectionkills.com/global-eval-what-are-the-options/]
		Function("e,eval", "try{return e('eval')==e&&e}catch(e){}")(eval) ||
		Function("a", "var d=document,b=d.body,s=d.createElement('script');s.text=a;b.removeChild(b.insertBefore(s,b.firstChild))")
	/*/
		eval
	/**/

	/*** reuse ***/
	, xhrs = []
	/**/

	/*** onerror ***/
	, lastError
	, unsentErrors = xhr._e = []
	, onerror = window.onerror = function(message, file, line, col, error) {
		// Do not send multiple copies of the same error.
		// file = document.currentScript.src || import.meta.url
		if (lastError !== (lastError =
			[ file
			, line
			, col || (window.event || unsentErrors).errorCharacter || "?"
			, message
			].join(":")
		) && 1 == unsentErrors.push(
			[ +new Date()
			, lastError
			, error && (error.stack || error.stacktrace) || "-"
			, "" + location
			]
		)) setTimeout(sendErrors, 307)
	}

	function sendErrors() {
		if (xhr.err) {
			xhr.err(unsentErrors)
		} else {
			setTimeout(sendErrors, 1307)
		}
	}
	/*/
	, onerror = nop
	/**/

	// next === true is for sync call
	//
	// Hypertext Transfer Protocol (HTTP) Status Code Registry
	// http://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml
	//

	window.xhr = xhr
	function xhr(method, url, next, attr1, attr2) {
		var xhr = /*** reuse ***/ xhrs.pop() || /**/ new XMLHttpRequest()

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

		xhr.open(method, rewrite[url] || url, next !== true)

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
				//   - Use custom status code 1 for network error

				method = xhr.status || (xhr.responseText ? 200 : 1)
				if (next) next.call(
					xhr,
					(method < 200 || method > 299 && method != 304 && method != 1223) && method,
					xhr.responseText,
					url,
					attr1,
					attr2
				)
				xhr.onreadystatechange = next = nop
				/*** reuse ***/
				xhrs.push(xhr)
				/**/
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


	/*** load ***/
	xhr.load = load
	function load(files, next) {
		if (typeof files == "string") files = [files]
		var file
		, i = 0
		, pos = 0
		, len = files && files.length
		, res = []

		for (; i < len; i++) if ((file = files[i]) && 2 !== loaded[file]) {
			if (loaded[file]) {
				// Same file requested again
				;(loaded[file].x || (loaded[file].x = [])).push(cb, file, i)
			} else {
				// FireFox 3 throws on `xhr.send()` without arguments
				xhr("GET", file, loaded[file] = cb, i).send(null)
			}
			pos++
		}

		if (!pos && next) next()
		pos = 0

		function cb(err, str, file, i) {
			loaded[file] = 2
			res[i] = err ? (onerror(err, file), "") : str
			exec()
		}
		function exec() {
			if (res[pos]) {
				try {
					;(xhr[files[pos].replace(/[^?]+\.|\?.*/g, "")] || execScript)(res[pos])
				} catch(e) {
					onerror(e, files[pos])
				}
				res[pos] = ""
			}
			if (res[pos] === "" || !files[pos]) {
				if (++pos < len) exec()
				/*** inject ***/
				// inject can be async
				else if (pos === len) setTimeout(exec, 1)
				/**/
				else {
					if (next) next()
					if ((res = cb.x)) {
						for (i = 0; res[i];) res[i++](0, "", res[i++], res[i++])
					}
				}
			}
		}
	}

	load([
		//!{loadFiles}
	])
	/**/

	function nop() {}
}(this, Function, setTimeout) // jshint ignore:line

