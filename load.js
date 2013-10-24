
function Nop(){}

!function(root, scripts){
	var xhrs = []
	function lazy(obj, name, str) {
		obj[name] || (obj[name] = function() {
			return (obj[name] = new Function("a,b,c,d", str)).apply(this, arguments)
		})
	}

	// XMLHttpRequest was unsupported in IE 5-6
	// MSXML version 3.0 was the last version of MSXML to support version-independent ProgIDs.
	lazy(root, "XMLHttpRequest", "return new ActiveXObject('MSXML2.XMLHTTP')");


	// eval in a global context for non-IE & non-Chrome (removed form v8 on 2011-05-23: Version 3.3.9)
	// THANKS: Juriy Zaytsev - Global eval [http://perfectionkills.com/global-eval-what-are-the-options/]
	if (!root.execScript && Function("d,Date","return(1,eval)('(Date)')===d")(Date,1)) root.execScript = eval

	lazy(root, "execScript", "d=document;b=d.body;c=d.createElement('script');c.text=a;b.insertBefore(c,b.firstChild)");


	function xhr(method, url, next) {
		var r = xhrs.shift() || new XMLHttpRequest()
		r.open(method, url, next !== true)
		if (next !== true) r.onreadystatechange = function() {
			if (r.readyState == 4) {
				next && next.call(r, r.status != 200 && r.status, r.responseText)
				r.onreadystatechange = next = Nop
				xhrs.push(r)
			}
		}
		return r
	}

	function load(files, next) {
		if (typeof files == "string") files = [files];
		for (var len = files.length, i=len, res = [];i--;) !function(i) {
			xhr("GET", files[i], function(err, str) {
				res[i] = str;
				if (!--len) {
					execScript( res.join("/**/;") );
					next && next();
					res = null;
				}
			}).send();
		}(i);
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

