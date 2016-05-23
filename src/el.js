


!function(window, document, protoStr) {
	var currentLang, styleNode
	, hasOwn = Object[protoStr].hasOwnProperty
	, wrapProto = []
	, body = document.body
	, createElement = document.createElement
	, txtAttr = "textContent" in body ? "textContent" : "innerText"
	, elCache = El.cache = {}
	, scopeSeq = 0
	, scopeData = El.data = { _: i18n }
	, proto = (window.Element || El)[protoStr]
	, templateRe = /^([ \t]*)(@?)((?:("|')(?:\\?.)*?\4|[-\w\:.#\[\]=])*)[ \t]*(.*?)$/gm
	, renderRe = /[;\s]*(\w+)(?:\s*\:((?:(["'\/])(?:\\?.)*?\3|[^;])*))?/g
	, bindings = El.bindings = {
		"class": function(name, fn) {
			toggleClass.call(this, name, arguments.length < 2 || fn)
		},
		data: function(key, val) {
			this.attr("data-" + key, val)
		},
		html: function(html) {
			this.innerHTML = html
		}
	}

	//** modernBrowser

	// JScript engine in IE<9 does not recognize vertical tabulation character
	, ie678 = !+"\v1"
	, ie67 = ie678 && (document.documentMode|0) < 8

	// Element.matches is supported from Chrome 34, Firefox 34
	, matches = proto.matches = proto.matches || function(selector) {
		return !!selectorFn(selector)(this)
	}
	// Element.closest is supported from Chrome 41, Firefox 35
	, closest = proto.closest = proto.closest || function(selector) {
		for (var el = this; el && el.nodeType == 1; el = el.parentNode) {
			if (matches.call(el, selector)) return el
		}
		return null
	}

	, selectorRe = /([.#:[])([-\w]+)(?:\((.+?)\)|([~^$*|]?)=(("|')(?:\\?.)*?\6|[-\w]+))?]?/g
	, selectorLastRe = /([\s>+]*)(?:("|')(?:\\?.)*?\2|\(.+?\)|[^\s+>])+$/
	, selectorSplitRe = /\s*,\s*(?=(?:[^'"()]|"(?:\\?.)*?"|'(?:\\?.)*?'|\(.+?\))+$)/
	, selectorCache = {}
	, selectorMap = {
		"first-child": "(a=_.parentNode)&&a.firstChild==_",
		"last-child": "(a=_.parentNode)&&a.lastChild==_",
		".": "~_.className.split(/\\s+/).indexOf(a)",
		"#": "_.id==a",
		"^": "!a.indexOf(v)",
		"|": "a.split('-')[0]==v",
		"$": "a.slice(-v.length)==v",
		"~": "~a.split(/\\s+/).indexOf(v)",
		"*": "~a.indexOf(v)"
	}

	function findEl(node, sel, first) {
		var el
		, i = 0
		, out = []
		, next = node.firstChild
		, fn = selectorFn(sel)

		for (; (el = next); ) {
			if (fn(el)) {
				if (first) return el
				out.push(el)
			}
			next = el.firstChild || el.nextSibling
			while (!next && ((el = el.parentNode) !== node)) next = el.nextSibling
		}
		return first ? null : out
	}

	function selectorFn(str) {
		// jshint evil:true
		return selectorCache[str] ||
		(selectorCache[str] = Function("_,v,a,b", "return " +
			str.split(selectorSplitRe).map(function(sel) {
				var relation, from
				, rules = ["_&&_.nodeType==1"]
				, parentSel = sel.replace(selectorLastRe, function(_, _rel, a, start) {
					from = start + _rel.length
					relation = _rel.trim()
					return ""
				})
				, tag = sel.slice(from).replace(selectorRe, function(_, op, key, subSel, fn, val, quotation) {
					rules.push(
						"((v='" +
						(subSel || (quotation ? val.slice(1, -1) : val) || "").replace(/'/g, "\\'") +
						"'),(a='" + key + "'),1)"
						,
						selectorMap[op == ":" ? key : op] ||
						"(a=_.getAttribute(a))" +
						(fn ? "&&" + selectorMap[fn] : val ? "==v" : "")
					)
					return ""
				})

				if (tag && tag != "*") rules[0] += "&&_.nodeName=='" + tag.toUpperCase() + "'"
				if (parentSel) rules.push(
					relation == "+" ? "(a=_.previousSibling)" : "(a=_.parentNode)",
					( relation ? "a.matches&&a.matches('" : "a.closest&&a.closest('" ) + parentSel + "')"
				)
				return rules.join("&&")
			}).join("||")
		))
	}
	/*/
	, closest = proto.closest
	//*/


	/**
	 * Turns CSS selector like syntax to DOM Node
	 * @returns {Node}
	 *
	 * @example
	 * El("input#12.nice[type=checkbox]:checked:disabled[data-lang=en].class")
	 * <input id="12" class="nice class" type="checkbox" checked="checked" disabled="disabled" data-lang="en">
	 */

	function El(name, args, silence) {
		var el, pres
		, pre = {}
		name = name.replace(selectorRe, function(_, op, key, _sub, fn, val, quotation) {
			pres = 1
			val = quotation ? val.slice(1, -1) : val || key
			pre[op =
				op == "." ?
				(fn = "~", "class") :
				op == "#" ?
				"id" :
				key
			] = fn && pre[op] ?
				fn == "^" ? val + pre[op] :
				pre[op] + (fn == "~" ? " " : "") + val :
				val
			return ""
		}) || "div"

		// NOTE: IE-s cloneNode consolidates the two text nodes together as one
		// http://brooknovak.wordpress.com/2009/08/23/ies-clonenode-doesnt-actually-clone/
		el = (elCache[name] || (elCache[name] = document.createElement(name))).cloneNode(true)

		if (pres) {
			attr.call(el, pre)
		}

		return silence || !args ? el :
		(args.constructor == Object ? attr : append).call(el, args)
	}
	window.El = El

	function append(child, before) {
		var fragment
		, el = this
		, i = 0
		, tmp = typeof child
		if (child) {
			if (tmp == "string" || tmp == "number") child = document.createTextNode(child)
			else if ( !("nodeType" in child) && "length" in child ) {
				// document.createDocumentFragment is unsupported in IE5.5
				// fragment = "createDocumentFragment" in document ? document.createDocumentFragment() : El("div")
				for (
					tmp = child.length
					, fragment = document.createDocumentFragment();
					i < tmp; ) append.call(fragment, child[i++])
				child = fragment
			}

			if (child.nodeType) {
				tmp = el.insertBefore ? el : el[el.length - 1]
				tmp.insertBefore(child,
					(before === true ? tmp.firstChild :
					typeof before == "number" ? tmp.childNodes[
						before < 0 ? tmp.childNodes.length - before - 2 : before
					] : before) || null
				)
			}
		}
		return el
	}
	proto.append = append

	proto.after = function(silbing, before) {
		// call append so it works with DocumentFragment
		append.call(silbing.parentNode, this, before ? silbing : silbing.nextSibling)
		return this
	}

	proto.to = to
	function to(parent, before) {
		append.call(parent, this, before)
		return this
	}

	function hasClass(name) {
		var el = this
		, current = el.getAttribute("class") || ""
		return !!current && current.split(/\s+/).indexOf(name) > -1
	}
	proto.hasClass = hasClass

	function addClass(name) {
		var el = this
		, current = el.getAttribute("class") || ""

		if (current) {
			name = current.split(/\s+/).indexOf(name) > -1 ? current : current + " " + name
		}

		if (current != name) {
			el.setAttribute("class", name)
		}
		return el
	}
	proto.addClass = addClass

	function rmClass(name) {
		var el = this
		, current = el.getAttribute("class") || ""

		if (current) {
			name = (" " + current + " ").replace(" " + name + " ", " ").trim()
			if (current != name) {
				el.setAttribute("class", name)
			}
		}

		return el
	}
	proto.rmClass = rmClass

	function toggleClass(name, force) {
		if (arguments.length === 1) {
			force = !hasClass.call(this, name)
		}
		return ( force ? addClass : rmClass ).call(this, name), force
	}
	proto.toggleClass = toggleClass

	proto.empty = function() {
		for (var node, el = this; node = el.firstChild; ) kill.call(node)
		return el
	}

	function kill() {
		var id
		, el = this
		if (el.emit) el.emit("kill")
		if (el.parentNode) el.parentNode.removeChild(el)
		if (Event.removeAll) Event.removeAll(el)
		if (el.empty) el.empty()
		if (id = el.attr && el.attr("data-scope")) {
			delete elScope[id]
		}
		if (el.valObject) el.valObject = null
		return el
	}
	proto.kill = kill

	proto.on = function(ev, fn) {
		// element.setCapture(retargetToElement)
		Event.add(this, ev, fn)
		return this
	}

	proto.one = function(ev, fn) {
		var el = this
		function remove() {
			el.non(ev, fn).non(ev, remove)
		}
		return el.on(ev, fn).on(ev, remove)
	}

	proto.non = function(ev, fn) {
		Event.remove(this, ev, fn)
		return this
	}

	proto.emit = function() {
		Event.Emitter.emit.apply(this, arguments)
	}

	/*
	var namespaces = {
		xlink: "http://www.w3.org/1999/xlink",
		svg: "http://www.w3.org/2000/svg"
	}
	*/

	proto.attr = attr
	function attr(key, val) {
		var current
		, el = this

		if (key && key.constructor == Object) {
			for (val in key) {
				attr.call(el, val, key[val])
			}
			return el
		}

		/* Accept namespaced arguments
		current = key.split("|")
		if (current[1]) {
			el.setAttributeNS(namespaces[current[0]], current[1], val)
			return
		}
		*/

		current = el.getAttribute(key)

		if (arguments.length == 1) {
			return current
		}
		// Note: IE5-7 doesn't set styles and removes events when you try to set them.
		//
		// in IE6, a label with a for attribute linked to a select list
		// will cause a re-selection of the first option instead of just giving focus.
		// http://webbugtrack.blogspot.com/2007/09/bug-116-for-attribute-woes-in-ie6.html

		// there are bug in IE<9 where changed 'name' param not accepted on form submit
		// IE8 and below support document.createElement('<P>')
		//
		// http://www.matts411.com/post/setting_the_name_attribute_in_ie_dom/
		// http://msdn.microsoft.com/en-us/library/ms536614(VS.85).aspx

		//** modernBrowser
		if (ie67 && (key == "id" || key == "name" || key == "checked")) {
			el.mergeAttributes(createElement('<INPUT '+key+'="' + val + '">'), false)
		} else
		//*/
		if (key == "class") {
			addClass.call(el, val)
		} else if (val || val === 0) {
			if (current != val) {
				el.setAttribute(key, val)
			}
		} else if (current) {
			el.removeAttribute(key)
		}
	}

	proto.css = bindings.css = css
	function css(key, val) {
		this.style[key.camelCase()] = val || ""
	}

	function elScope(node, parent, _scope) {
		if (_scope = elScope[attr.call(node, "data-scope")]) {
			return _scope
		}
		if (!parent || parent === true) {
			_scope = closest.call(node, "[data-scope]")
			_scope = _scope && elScope[attr.call(_scope, "data-scope")] || scopeData
		}
		if (parent) {
			attr.call(node, "data-scope", ++scopeSeq)
			_scope = elScope[scopeSeq] = Object.create(parent = (_scope || parent))
			_scope._super = parent
		}
		return _scope
	}
	El.scope = elScope

	function render(scope, skipSelf) {
		var bind, newBind, fn
		, node = this

		if (node.nodeType != 1) {
			return node
		}

		// TODO:2015-05-25:lauri:Use elScope
		scope = elScope[attr.call(node, "data-scope")]
		|| scope
		|| (bind = closest.call(node, "[data-scope]")) && elScope[attr.call(bind, "data-scope")]
		|| scopeData

		if (bind = !skipSelf && attr.call(node, "data-bind")) {
			newBind = bind
			// i18n(bind, lang).format(scope)
			// document.documentElement.lang
			// document.getElementsByTagName('html')[0].getAttribute('lang')

			fn = "data b r->data&&(" + bind.replace(renderRe, function(match, name, args) {
				return bindings[name] ?
				(hasOwn.call(bindings[name], "once") && (newBind = newBind.replace(match, "")),
					"(r=b['" + name + "'].call(this" + (bindings[name].raw ? ",data,'" + args + "'" : args ? "," + args : "") + ")||r),") :
				"this.attr('" + name + "'," + args + "),"
			}) + "r)"
			if (bind != newBind) attr.call(node, "data-bind", newBind)

			try {
				if (Fn(fn, node, scope)(scope, bindings)) {
					return node
				}
			} catch (e) {
				//** debug
				e.message += " in binding: " + bind
				console.error(e)
				if (window.onerror) window.onerror(e.message, e.fileName, e.lineNumber)
				//*/
				return node
			}
		}

		for (bind = node.firstChild; bind; bind = newBind) {
			newBind = bind.nextSibling
			render.call(bind, scope)
		}
		//** modernBrowser
		if (ie678 && node.nodeName == "SELECT") {
			node.parentNode.insertBefore(node, node)
		}
		//*/
		return node
	}

	proto.render = render

	// In Safari 2.x, innerText functions properly only
	// if an element is neither hidden (via style.display == "none")
	// nor orphaned from the document.
	// Otherwise, innerText results in an empty string.
	//
	// textContent is suported from IE9
	// Opera 9-10 have Node.text so we use Node.txt

	proto.txt = bindings.txt = function(newText) {
		return arguments.length && this[txtAttr] != newText ? (
			//** modernBrowser
			// Fix for IE5-7
			//(ie67 && this.tagName == "OPTION" && (this.label = newText)),
			//*/
			this[txtAttr] = newText
		) : this[txtAttr]
	}

	proto.val = bindings.val = function(val) {
		var el = this
		, type = el.type
		, opts = el.options
		, checkbox = type == "checkbox" || type == "radio"

		if (arguments.length) {
			if (opts) {
				val = (Array.isArray(val) ? val : [ val ]).map(String)
				for (type = 0; el = opts[type++]; ) {
					el.selected = val.indexOf(el.value) > -1
				}
				return val
			}
			return checkbox ?
			(el.checked = !!val) :
			(el.value = val)
		}

		if (opts) {
			if (type == "select-multiple") {
				val = []
				for (type = 0; el = opts[type++]; ) {
					if (el.selected && !el.disabled) {
						val.push(el.valObject || el.value)
					}
				}
				return val
			}
			// IE8 throws error when accessing to options[-1]
			val = el.selectedIndex
			el = val > -1 && opts[val] || el
		}

		return checkbox && !el.checked ?
		(type == "radio" ? void 0 : null) :
		el.valObject || el.value
	}

	//** modernBrowser
	// Note: querySelector in IE8 supports only CSS 2.1 selectors
	proto.find = !ie678 && proto.querySelector || function(sel) {
		return findEl(this, sel, true)
	}

	proto.findAll = proto.querySelectorAll ?
		function(sel) {
			return new ElWrap(this.querySelectorAll(sel))
		} :
		function(sel) {
			return new ElWrap(findEl(this, sel))
		}
	/*/
	proto.find = proto.querySelector
	proto.findAll = function(sel) {
		return new ElWrap(this.querySelectorAll(sel))
	}
	//*/


	function ElWrap(nodes) {
		/**
		 *  1. Extended array size will not updated
		 *     when array elements set directly in Android 2.2.
		 */
		for (var pos = this.length /* 1 */ = nodes.length; pos--; ) {
			this[pos] = nodes[pos]
		}
	}
	El.wrap = ElWrap

	ElWrap[protoStr] = wrapProto

	Object.keys(proto).each(addWrapProto)

	function addWrapProto(key) {
		var first = key == "closest" || key == "find"

		wrapProto[key] = wrap
		function wrap() {
			for (var val, i = 0, len = this.length; i < len; ) {
				val = proto[key].apply(this[i++], arguments)
				if (first && val) return val
			}
			return first ? null : this
		}
	}

	addWrapProto("closest")

	wrapProto.append = function(el) {
		this.push(el)
		return this
	}

	wrapProto.cloneNode = function(deep) {
		return new ElWrap(this.map(function(el) {
			return el.cloneNode(deep)
		}))
	}

	//** modernBrowser
	// IE 6-7
	if (proto == El[protoStr]) {
		document.createElement = function(name) {
			return Object.merge(createElement(name), proto)
		}

		// NOTE: document.body will not get extended with later added extensions
		Object.merge(body, proto)
	}
	//*/

	El[protoStr] = proto

	El.css = function(str) {
		if (!styleNode) {
			// Safari and IE6-8 requires dynamically created
			// <style> elements to be inserted into the <head>
			styleNode = El("style").to(document.getElementsByTagName("head")[0])
		}
		if (styleNode.styleSheet) styleNode.styleSheet.cssText += str
		else styleNode.appendChild(document.createTextNode(str))
	}

	//** templates

	function tpl(str) {
		var root = document.createDocumentFragment()
		, parent = root
		, stack = [-1]

		function work(all, indent, plugin, name, q, text) {
			for (q = indent.length; q <= stack[0]; ) {
				stack.shift()
				parent = (parent.plugin) ? parent.plugin.done() : parent.parentNode || parent[0].parentNode
			}

			if (parent.txtMode) {
				parent.txt += all + "\n"
			} else if (plugin) {
				if (El.plugins[name]) {
					parent = (new El.plugins[name](parent, text)).el
					stack.unshift(q)
				} else {
					parent.append(all)
				}
			} else {
				if (name) {
					parent = to.call(El(name, 0, 1), parent)
					// TODO:2015-02-27:lauri:should we find a child to where put a content?
					stack.unshift(q)
				}
				if (text) {
					q = text.charAt(0)
					name = text.slice(1)
					if (q == ">") {
						(indent + " " + name).replace(templateRe, work)
					} else if (q == "|" || q == "\\") {
						parent.append(name) // + "\n")
					} else if (q != "/") {
						if (q != "&") {
							name = (parent.tagName == "INPUT" ? "val" : "txt")
							+ ":_('" + text.replace(/'/g, "\\'") + "').format(data)"
						}
						q = attr.call(parent, "data-bind")
						attr.call(parent, "data-bind", (q ? q + ";" : "") + name)
					}
				}
			}
		}
		str.replace(templateRe, work)
		root = root.childNodes
		return root.length == 1 ? root[0] : root
	}

	function template(parent, name) {
		var t = this
		t.name = name
		t.parent = parent
		t.el = El("div")
		t.el.plugin = t
	}

	template[protoStr] = {
		_done: function() {
			var t = this
			, el = t.el.childNodes.length > 1 ? new ElWrap(t.el.childNodes) : t.el.firstChild
			t.el.plugin = t.el = t.parent = null
			return el
		},
		done: function() {
			var t = this
			, parent = t.parent
			elCache[t.name] = t._done()
			return parent
		}
	}

	function js(parent, params) {
		var t = this
		t.txtMode = t.parent = parent
		t.txt = ""
		t.plugin = t.el = t
		t.params = params
	}

	js[protoStr].done = Fn("Function(this.txt)(),this.parent")

	El.plugins = {
		binding: js.extend({
			done: function() {
				Object.merge(bindings, Function("return({" + this.txt + "})")())
				return this.parent
			}
		}),
		css: js.extend({
			done: Fn("El.css(this.txt),this.parent")
		}),
		def: js.extend({
			done: Fn("View.def(this.params),this.parent")
		}),
		each: js.extend({
			done: function() {
				var txt = this.txt

				JSON.parse(this.params)
				.forEach(function(val) {
					if (!val || val.constructor != Object) {
						val = { item: val }
					}
					tpl(txt.format(val))
				})
				return this.parent
			}
		}),
		el: template,
		js: js,
		template: template,
		view: template.extend({
			done: function() {
				var t = this
				, parent = t.parent
				, arr = t.name.split(/\s+/)
				View(arr[0], t._done(), arr[1], arr[2])
				return parent
			}
		}),
		"view-link": template.extend({
			done: function() {
				var t = this
				, arr = t.name.split(/\s+/)
				View(arr[0], null, arr[2])
				.on("ping", function() {
					View.show(arr[1])
				})
				return t.parent
			}
		})
	}

	El.view = El.tpl = tpl
	//*/


	//** i18n
	function i18n(text, lang) {
		lang = i18n[i18nGet(lang) || currentLang]
		return lang[text] ||
		lang[text = text.slice(text.indexOf(":") + 1) || text] ||
		text
	}
	El.i18n = i18n

	function i18nGet(lang) {
		return lang && (
			i18n[lang = ("" + lang).toLowerCase()] ||
			i18n[lang = lang.split("-")[0]]
		) && lang
	}

	function i18nUse(lang) {
		lang = i18nGet(lang)
		if (lang && currentLang != lang) {
			i18n[currentLang = i18n.current = lang] = i18n[currentLang] || {}
		}
		return currentLang
	}

	function i18nAdd(lang, texts) {
		if (i18n.list.indexOf(lang) == -1) i18n.list.push(lang)
		Object.merge(i18n[lang] || (i18n[lang] = {}), texts)
		if (!currentLang) i18nUse(lang)
	}

	i18n.list = []
	i18n.get = i18nGet
	i18n.use = i18nUse
	i18n.add = i18nAdd
	i18n.def = function(map, key) {
		for (key in map) {
			i18nAdd(key, map)
		}
	}
	// navigator.userLanguage for IE, navigator.language for others
	// var lang = navigator.language || navigator.userLanguage;
	// i18nUse("en")
	//*/

}(window, document, "prototype")


