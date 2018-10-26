


!function(exports) {
	var a, b, c, O
	, P = "prototype"
	, F = Function
	, esc = escape
	, patched = (exports.xhr || exports)._patched = []


	function add(key, src) {
		if (!O[key]) {
			O[key] = F("a,b,c", "var P='" + P + "',o=Object[P].hasOwnProperty;" + src)
			patched.push(key)
		}
	}

	F.nop = function(){}

	/*
	* The HTML5 document.head DOM tree accessor
	*/

	//doc.head = doc.head || doc.getElementsByTagName("head")[0]

	/*
	* Function.prototype.bind from ECMAScript5
	* Basic support: Chrome 7 Firefox 4 IE 9 Opera 11.60 Safari 5.1.4
	*
	* http://msdn.microsoft.com/en-us/library/s4esdbwz(v=vs.94).aspx
	*/
	O = F[P]
	add("bind", "var t=this;b=[].slice.call(arguments,1);c=function(){return t.apply(this instanceof c?this:a,b.concat(b.slice.call(arguments)))};if(t[P])c[P]=t[P];return c")


	// Object extensions
	// -----------------

	O = Object
	add("create", "b=Function.nop;b[P]=a;a=new b;b[P]=null;return a")
	add("keys", "c=[];for(b in a)o.call(a,b)&&c.push(b);return c")

	// Object.assign ( target, source ) in ECMAScript 6
	// Chrome 45, Firefox 34, IE Edge
	add("assign", "var t,k,i=1,A=arguments,l=A.length;for(;i<l;)if(t=A[i++])for(k in t)if(o.call(t,k))a[k]=t[k];return a")

	// Array extensions
	// ----------------

	O = Array
	add("isArray", "return Object[P].toString.call(a)==='[object Array]'")

	O = O[P]
	a = "var t=this,l=t.length,o=[],i=-1;"
	c = "if(t[i]===a)return i;return -1"
	add("indexOf",     a + "i+=b|0;while(++i<l)" + c)
	add("lastIndexOf", a + "i=(b|0)||l;i>--l&&(i=l)||i<0&&(i+=l);++i;while(--i>-1)" + c)

	b = a + "if(arguments.length<2)b=t"
	c = "b=a.call(null,b,t[i],i,t);return b"
	add("reduce",      b + "[++i];while(++i<l)" + c)
	add("reduceRight", b + "[--l];i=l;while(i--)" + c)

	b = a+"while(++i<l)if(i in t)"
	add("forEach",     b + "a.call(b,t[i],i,t)")
	add("every",       b + "if(!a.call(b,t[i],i,t))return!1;return!0")

	c = ";return o"
	add("map",         b + "o[i]=a.call(b,t[i],i,t)" + c)

	b += "if(a.call(b,t[i],i,t))"
	add("filter",      b + "o.push(t[i])" + c)
	add("some",        b + "return!0;return!1")


	O = String[P]
	add("trim", "return this.replace(/^\\s+|\\s+$/g,'')")

	// Chrome 24, FF 15, IE 10
	O = exports.performance || (exports.performance = {})
	add("now", (a = "return+new Date"))

	O = Date
	add("now", a)

	/*
	* `Date.prototype.date` is implemented in `litejs/date`.
	*/

	O = O[P]
	add("toJSON", "return this.date('iso')")

	if (!exports.Event) exports.Event = {}


	if (!exports.JSON) {
		patched.push("JSON")
		exports.JSON = {
			map: {"\b":"\\b","\f":"\\f","\n":"\\n","\r":"\\r","\t":"\\t",'"':'\\"',"\\":"\\\\"},
			parse: F("t", "return Function('return('+t+')')()"),
			stringify: F("o", ""
				+ "var i,s=[],c=typeof o;"
				+ "if(c=='string'){"
					+ "for(i=o.length;c=o.charAt(--i);s[i]=JSON.map[c]||(c<' '?'\\\\u00'+((c=c.charCodeAt(0))|4)+(c%16).toString(16):c));"
					+ "o='\"'+s.join('')+'\"'"
				+ "}"
				+ "if(o&&c=='object'){"
					+ "if(typeof o.toJSON=='function')return'\"'+o.toJSON()+'\"';"
					+ "if(Array.isArray(o)){"
						+ "for(i=o.length;i--;s[i]=JSON.stringify(o[i]));"
						+ "return'['+s.join()+']'"
					+ "}"
					+ "for(i in o)Object.prototype.hasOwnProperty.call(o,i)&&s.push(JSON.stringify(i)+':'+JSON.stringify(o[i]));"
					+ "o='{'+s.join()+'}'"
				+ "}"
				+ "return o==null?'null':''+o"
			)
		}
	}


	createStorage("localStorage")      // Chrome5, FF3.5, IE8, Safari4
	createStorage("sessionStorage")    // Chrome5, FF2, IE8, Safari4

	function createStorage(name) {
		try {
			// FF4-beta with dom.storage.enabled=false throws for accessing windows.localStorage
			// iOS5 private browsing throws for localStorage.setItem()
			return exports[name].setItem(name, name)
		} catch(e){}
		var data = {}
		exports[name] = {
			setItem: function(id, val) {
				return data[id] = String(val)
			},
			getItem: function(id) {
				return data[id]
			},
			removeItem: function(id) {
				delete data[id]
			},
			clear: function() {
				data = {}
			}
		}
		patched.push(name)
	}

	// Ignore FF3 escape second non-standard argument
	// https://bugzilla.mozilla.org/show_bug.cgi?id=666448
	if (esc("a", 0) != "a") {
		patched.push("escape")
		exports.escape = function(s) {
			return esc(s)
		}
	}

	// Remove background image flickers on hover in IE6
	//
	// You could also use CSS
	// html { filter: expression(document.execCommand("BackgroundImageCache", false, true)); }
	eval("/*@cc_on try{document.execCommand('BackgroundImageCache',false,true)}catch(e){}@*/")
}(this)



