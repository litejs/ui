


!function(exports, Function) {
	var a, b, c, O
	, P = "prototype"
	, esc = escape
	, patched = (exports.xhr || exports)._patched = []

	// The HTML5 document.head DOM tree accessor
	// doc.head = doc.head || doc.getElementsByTagName("head")[0]


	function add(key, src, force) {
		if (!O[key] || force) {
			O[key] = (
				typeof src === "string" ?
				Function("a,b,c", "var P='" + P + "',o=Object[P].hasOwnProperty;" + src) :
				src
			)
			patched.push(key)
		}
	}


	O = Function[P]
	// Chrome7, FF4, IE9, Opera 11.60, Safari 5.1.4
	add("bind", "var t=this;b=[].slice.call(arguments,1);c=function(){return t.apply(this instanceof c?this:a,b.concat(b.slice.call(arguments)))};if(t[P])c[P]=t[P];return c")


	O = Object
	O.nop = function(){}

	// Chrome5, FF4, IE9, Safari5
	add("create", "b=Object.nop;b[P]=a;a=new b;b[P]=null;return a")
	add("keys", "c=[];for(b in a)o.call(a,b)&&c.push(b);return c")

	// Object.assign ( target, source ) in ECMAScript 6
	// Chrome45, Edge, FF34, Safari9
	add("assign", "var t,k,i=1,A=arguments,l=A.length;for(;i<l;)if(t=A[i++])for(k in t)if(o.call(t,k))a[k]=t[k];return a")


	O = Array
	add("isArray", "return Object[P].toString.call(a)==='[object Array]'")

	// Chrome45, Edge, FF32, Safari9
	add("from", "a=typeof a==='string'?a.split(''):b?a:a.slice();return b?a.map(b,c):a")

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

	// Chrome24, FF15, IE10
	O = exports.performance || (exports.performance = {})
	add("now", (a = "return+new Date"))

	O = Date
	add("now", a)

	O = O[P]
	// `Date.prototype.date` is implemented in `litejs/date`.
	add("toJSON", "return this.date('iso')")

	O = exports

	add("Event", {})

	add("JSON", {
		map: {"\b":"\\b","\f":"\\f","\n":"\\n","\r":"\\r","\t":"\\t",'"':'\\"',"\\":"\\\\"},
		parse: Function("t", "return Function('return('+t+')')()"),
		stringify: Function("o", ""
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
	})


	createStorage("sessionStorage")    // Chrome5, FF2, IE8, Safari4
	createStorage("localStorage")      // Chrome5, FF3.5, IE8, Safari4

	function createStorage(name) {
		try {
			// FF4-beta with dom.storage.enabled=false throws for accessing windows.localStorage
			// iOS5 private browsing throws for localStorage.setItem()
			return exports[name].setItem(name, name)
		} catch(e){}
		var data = {}
		add(name, {
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
		})
	}


	// 20 fps is good enough
	add("requestAnimationFrame", "return setTimeout(a, 50)")
	// exports.mozRequestAnimationFrame    || // Firefox 4-23
	// exports.webkitRequestAnimationFrame || // Chrome 10-24
	// exports.msRequestAnimationFrame     || // IE 10 PP2+
	add("cancelAnimationFrame", "return clearTimeout(a)")


	// Ignore FF3 escape second non-standard argument
	// https://bugzilla.mozilla.org/show_bug.cgi?id=666448
	add("escape", function(s) { return esc(s) }, esc("a", 0) != "a")


	// Remove background image flickers on hover in IE6
	//
	// You could also use CSS
	// html { filter: expression(document.execCommand("BackgroundImageCache", false, true)); }
	eval("/*@cc_on try{document.execCommand('BackgroundImageCache',false,true)}catch(e){}@*/")
}(this, Function)



