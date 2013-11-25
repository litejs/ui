
function Nop(){}

!function(root, scripts){
	var xhrs = []


	function lazy(obj, name, str) {
		if (!obj[name]) obj[name] = new Function("a,b,c,d", str)
	}
	/*
	function lazy(obj, name, str) {
		obj[name] || (obj[name] = function() {
			return (obj[name] = new Function("a,b,c,d", str)).apply(this, arguments)
		})
	}
	*/

	// XMLHttpRequest was unsupported in IE 5-6
	// MSXML version 3.0 was the last version of MSXML to support version-independent ProgIDs.
	lazy(root, "XMLHttpRequest", "return new ActiveXObject('MSXML2.XMLHTTP')");


	// eval in a global context for non-IE & non-Chrome (removed form v8 on 2011-05-23: Version 3.3.9)
	// THANKS: Juriy Zaytsev - Global eval [http://perfectionkills.com/global-eval-what-are-the-options/]
	if (!root.execScript && Function("d,Date","return(1,eval)('(Date)')===d")(Date,1)) root.execScript = eval

	lazy(root, "execScript", "d=document;b=d.body;c=d.createElement('script');c.text=a;b.insertBefore(c,b.firstChild)");


	function xhr(method, url, next) {
		var r = xhrs.shift() || new XMLHttpRequest()
		/*
		* To be able to reuse the XHR object properly, 
		* use the open method first and set onreadystatechange later. 
		* This happens because IE resets the object implicitly 
		* in the open method if the status is 'completed'.
		*
		* The downside to calling the open method after setting the callback 
		* is a loss of cross-browser support for readystates.
		* http://www.quirksmode.org/blog/archives/2005/09/xmlhttp_notes_r_2.html
		*/


		/*
		* Vodafone 360 doesn't pass session cookies, so they need to be passed manually
		* if (sessionID) req.setRequestHeader("Cookie", sessionID);
		* if (req.getResponseHeader("Set-Cookie")) sessionID = req.getResponseHeader("Set-Cookie");
		*/

		r.open(method, url, next !== true)
		if (next !== true) r.onreadystatechange = function() {
			if (r.readyState == 4) {
				/*
				* r.status == 304 // file found, but determined unchanged and loaded from cache
				* Opera 8.x really loves that status
				*/
				method = r.status // Reuse variable for status
				next && next.call(r, (method < 200 || method > 299) && method, r.responseText)
				r.onreadystatechange = next = Nop
				xhrs.push(r)
			}
		}
		return r
	}

	function load(files, next) {
		if (typeof files == "string") files = [files]
		for (var len = files.length, i=len, res = [];i--;) !function(i) {
			xhr("GET", files[i], function(err, str) {
				res[i] = str
				if (!--len) {
					execScript( res.join("/**/;") )
					next && next()
					res = null
				}
			}).send()
		}(i)
	}

	/*
	* Function.prototype.bind is most missing fn
	* http://kangax.github.io/es5-compat-table/
	*/
	Function.prototype.bind || scripts.unshift("up.js")
	load(scripts)

	xhr.load = load

	root.xhr = xhr
}(this, [])

