
function Nop(){}

!function(root, scripts, next) {
	var xhrs = []


	//** error
	, lastError
	, unsentErrors = []
	, esc = escape
	, oldOnError = root.onerror

	// An error has occurred.
	// Please click 'OK' to reload.
	//
	// Reload the current page, without using the cache
	// window.location.reload(true)

	root.onerror = function(message, file, line, _col, _error) {
		var args = arguments
		, error = _error || new Error(message)
		, stack = error.stack || error.backtrace || error.stacktrace || ""

		if (oldOnError) oldOnError.apply(this, args)

		// Do not send multiple copies of the same error.
		if (lastError === (lastError =
			[ esc(file)
			, line
			, _col || (root.event || args).errorCharacter || "?"
			, esc(message)
			].join(":")
		)) return

		// In IE <9, window.onerror is called with the function call stack intact.
		// This means we can use arguments.callee.caller recursively
		// to build up a fake stacktrace.
		// It only gives us function names, but it's better than nothing.
		if (!stack) {
			for (args = args.callee; args = args && args.caller; ) {
				stack += args.toString().split(/[ {]+/)[1] + "\n"
			}
		}

		unsentErrors.push(
			[ 1 // format version
			, +new Date()
			, lastError
			, esc(stack)
			, esc(root.location)
			].join(":")
		)
	}

	setInterval(function() {
		if (unsentErrors.length && xhr.logErrors) {
			xhr.logErrors(unsentErrors)
			unsentErrors.length = 0
			// var img = new Image();
			// img.src = url + "?" + serialize(params) + "&ct=img&cb=" + new Date().getTime();
		}
	}, 307)
	//*/

	function lazy(obj, name, str) {
		if (!obj[name]) obj[name] = new Function("a,b,c,d", str)
	}
	// function lazy(obj, name, str) {
	// 	obj[name] || (obj[name] = function() {
	// 		return (obj[name] = new Function("a,b,c,d", str)).apply(this, arguments)
	// 	})
	// }

	// XMLHttpRequest was unsupported in IE 5-6
	// MSXML version 3.0 was the last version of MSXML to support version-independent ProgIDs.
	lazy(root, "XMLHttpRequest", "return new ActiveXObject('MSXML2.XMLHTTP')")


	// eval in a global context for non-IE & non-Chrome (removed form v8 on 2011-05-23: Version 3.3.9)
	// THANKS: Juriy Zaytsev - Global eval [http://perfectionkills.com/global-eval-what-are-the-options/]
	if (!root.execScript && Function("d,Date","return(1,eval)('(Date)')===d")(Date,1)) root.execScript = eval

	lazy(root, "execScript", "d=document;b=d.body;c=d.createElement('script');c.text=a;b.insertBefore(c,b.firstChild)")

	// next === true is for sync call

	function xhr(method, url, next) {
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
				// xhr.status == 304
				// file found, but determined unchanged and loaded from cache
				// Opera 8.x really loves that status
				method = xhr.status // Reuse variable for status
				if (next) next.call(xhr, (method < 200 || method > 299) && method, xhr.responseText)
				xhr.onreadystatechange = next = Nop
				xhrs.push(xhr)
			}
		}
		return xhr
	}
	root.xhr = xhr

	function load(files, next) {
		if (typeof files == "string") files = [files]
		for (var len = files.length, i=len, res = [];i--;) !function(i) {
			xhr("GET", files[i], function(err, str) {
				res[i] = err ? "" : str
				if (!--len) {
					execScript( res.join("/**/;") )
					if (next) next()
					res = null
				}
			}).send()
		}(i)
	}

	// Function.prototype.bind is most missing fn
	// http://kangax.github.io/es5-compat-table/
	if (!Function.prototype.bind) scripts.unshift("up.js")

	load(scripts, next)

	xhr.load = load

}(this, [])

