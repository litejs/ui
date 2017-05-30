


!function(window, document, Object, Event, protoStr) {
	var currentLang, styleNode
	, wrapProto = []
	, body = document.body
	, root = document.documentElement
	, txtAttr = "textContent" in body ? "textContent" : "innerText"
	, elCache = El.cache = {}
	, seq = 0
	, scopeData = El.data = { _: i18n, El: El }
	, templateRe = /^([ \t]*)(@?)((?:("|')(?:\\?.)*?\4|[-\w:.#[\]=])*)[ \t]*(.*?)$/gm
	, renderRe = /[;\s]*(\w+)(?:\s*(:?):((?:(["'\/])(?:\\?.)*?\3|[^;])*))?/g
	, bindings = El.bindings = {
		"class": function(name, fn) {
			;(arguments.length < 2 || fn ? addClass : rmClass)(this, name)
		},
		data: function(key, val) {
			setAttr(this, "data-" + key, val)
		},
		html: function(html) {
			this.innerHTML = html
		},
		ref: function(name) {
			elScope(this)[name] = this
		},
		"with": function(map) {
			return render(this, JSON.merge(elScope(this, true), map))
		}
	}
	, hasOwn = elCache.hasOwnProperty

	//** modernBrowser

	// JScript engine in IE<9 does not recognize vertical tabulation character
	, ie678 = !+"\v1"
	, ie67 = ie678 && /* istanbul ignore next: IE fix */ (document.documentMode|0) < 8

	, matches = El.matches = body.matches ?
		function(el, sel) {
			return el.matches(sel)
		} :
		function(el, sel) {
			return !!selectorFn(sel)(el)
		}
	, closest = El.closest = body.closest ?
		function(el, sel) {
			return el.closest(sel)
		} :
		function(el, sel) {
			return walk("parentNode", 1, el, sel)
		}


	, selectorRe = /([.#:[])([-\w]+)(?:\((.+?)\)|([~^$*|]?)=(("|')(?:\\?.)*?\6|[-\w]+))?]?/g
	, selectorLastRe = /([~\s>+]*)(?:("|')(?:\\?.)*?\2|\(.+?\)|[^\s+>])+$/
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

	function selectorFn(str) {
		// jshint evil:true
		return selectorCache[str] ||
		(selectorCache[str] = Function("m,c", "return function(_,v,a,b){return " +
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

				if (tag && tag != "*") rules[0] += "&&_.tagName=='" + tag.toUpperCase() + "'"
				if (parentSel) rules.push("(v='" + parentSel + "')", selectorMap[relation + relation])
				return rules.join("&&")
			}).join("||") + "}"
		)(matches, closest))
	}

	function walk(next, first, el, sel, nextFn) {
		var out = []
		if (typeof sel !== "function") sel = selectorFn(sel)
		for (; el; el = el[next] || nextFn && nextFn(el)) if (sel(el)) {
			if (first) return el
			out.push(el)
		}
		return first ? null : out
	}

	function find(node, sel, first) {
		return walk("firstChild", first, node.firstChild, sel, function(el) {
			var next = el.nextSibling
			while (!next && ((el = el.parentNode) !== node)) next = el.nextSibling
			return next
		})
	}

	// Note: querySelector in IE8 supports only CSS 2.1 selectors
	if (!ie678 && body.querySelector) {
		El.find = function(el, sel) {
			return el.querySelector(sel)
		}
		El.findAll = function(el, sel) {
			return new ElWrap(el.querySelectorAll(sel))
		}
	} else {
		El.find = function(el, sel) {
			return find(el, sel, true)
		}
		El.findAll = function(el, sel) {
			return new ElWrap(find(el, sel))
		}
	}

	/**
	 * Turns CSS selector like syntax to DOM Node
	 * @returns {Node}
	 *
	 * @example
	 * El("input#12.nice[type=checkbox]:checked:disabled[data-lang=en].class")
	 * <input id="12" class="nice class" type="checkbox" checked="checked" disabled="disabled" data-lang="en">
	 */

	bindings["with"].once = 1

	window.El = El

	function El(name, args, silence) {
		if (typeof name != "string") {
			return new ElWrap(name)
		}
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
			setAttr(el, pre)
		}

		return silence || !args ? el :
		(args.constructor == Object ? setAttr : append)(el, args)
	}

	function ElWrap(nodes) {
		var wrap = this
		, i = nodes.length
		/**
		 *  1. Extended array size will not updated
		 *     when array elements set directly in Android 2.2.
		 */
		if (i) {
			wrap.length = i /* 1 */
			for (; i--; ) {
				wrap[i] = nodes[i]
			}
		} else if (i == null) {
			wrap.length = 1 /* 1 */
			wrap[0] = nodes
		}
	}

	ElWrap[protoStr] = wrapProto

	wrapProto.append = function(el) {
		var elWrap = this
		if (elWrap._childId != void 0) {
			append(elWrap[elWrap._childId], el)
		} else {
			this.push(el)
		}
		return this
	}

	wrapProto.cloneNode = function(deep) {
		var clone = new ElWrap(this.map(function(el) {
			return el.cloneNode(deep)
		}))
		clone._childId = this._childId
		return clone
	}


	El.attr = function(el, key, val) {
		return arguments.length < 3 && key.constructor != Object ? getAttr(el, key) : setAttr(el, key, val)
	}

	function getAttr(el, key) {
		return el.getAttribute && el.getAttribute(key)
	}

	function setAttr(el, key, val) {
		var current

		if (key && key.constructor == Object) {
			for (current in key) {
				setAttr(el, current, key[current])
			}
			return el
		}

		/* Accept namespaced arguments
		var namespaces = {
			xlink: "http://www.w3.org/1999/xlink",
			svg: "http://www.w3.org/2000/svg"
		}

		current = key.split("|")
		if (current[1]) {
			el.setAttributeNS(namespaces[current[0]], current[1], val)
			return
		}
		*/

		current = el.getAttribute(key)

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
		// istanbul ignore next: IE fix
		if (ie67 && (key == "id" || key == "name" || key == "checked")) {
			el.mergeAttributes(document.createElement('<INPUT '+key+'="' + val + '">'), false)
		} else
		//*/
		if (key == "class") {
			addClass(el, val)
		} else if (val || val === 0) {
			if (current != val) {
				el.setAttribute(key, val)
			}
		} else if (current) {
			el.removeAttribute(key)
		}
	}

	// In Safari 2.x, innerText functions properly only
	// if an element is neither hidden (via style.display == "none")
	// nor orphaned from the document.
	// Otherwise, innerText results in an empty string.
	//
	// textContent is suported from IE9
	// Opera 9-10 have Node.text so we use Node.txt

	El.css = function(el, key, val) {
		el.style[key.camelCase()] = val || ""
	}

	El.txt = function(el, newText) {
		return arguments.length > 1 && el[txtAttr] != newText ? (
			//** modernBrowser
			// Fix for IE5-7
			//(ie67 && el.tagName == "OPTION" && (el.label = newText)),
			//*/
			el[txtAttr] = newText
		) : el[txtAttr]
	}

	El.val = valFn
	function valFn(el, val) {
		var input, step, key, value
		, i = 0
		, type = el.type
		, opts = el.options
		, checkbox = type == "checkbox" || type == "radio"

		if (el.tagName === "FORM") {
			opts = {}

			// Disabled controls do not receive focus,
			// are skipped in tabbing navigation, cannot be successfully posted.
			//
			// Read-only elements receive focus but cannot be modified by the user,
			// are included in tabbing navigation, are successfully posted.
			//
			// Read-only checkboxes can be changed by the user

			for (; input = el.elements[i++]; ) if (!input.disabled && (key = input.name || input.id)) {
				value = valFn(input)
				if (value !== void 0) {
					step = opts
					key.replace(/\[(.*?)\]/g, function(_, _key, offset) {
						if (step == opts) key = key.slice(0, offset)
						step = step[key] || (step[key] = _key && +_key != _key ? {} : [])
						key = _key
					})
					step[key || step.length] = value
				}
			}

			return opts
		}

		if (arguments.length > 1) {
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

	function append(el, child, before) {
		if (!el.nodeType) {
			return el.append ? el.append(child, before) : el
		}
		var fragment
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
					i < tmp; ) append(fragment, child[i++])
				child = fragment
			}

			if (child.nodeType) {
				tmp = el.insertBefore ? el : el[el.length - 1]
				if (i = getAttr(tmp, "data-child")) {
					before = find(tmp, Fn("v->n->n.nodeType===8&&n.nodeValue==v")(i), 1) || tmp
					tmp = before.parentNode
					// TODO:2016-07-05:lauri:handle numeric befores
				}
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

	// setAttribute("class") is broken in IE7
	// className is object in SVGElements

	function hasClass(el, name) {
		var current = el.className || ""
		, useAttr = typeof current != "string"

		if (useAttr) {
			current = el.getAttribute("class") || ""
		}

		return !!current && current.split(/\s+/).indexOf(name) > -1
	}

	function addClass(el, name) {
		var current = el.className || ""
		, useAttr = typeof current != "string"

		if (useAttr) {
			current = el.getAttribute("class") || ""
		}

		if (current) {
			name = current.split(/\s+/).indexOf(name) > -1 ? current : current + " " + name
		}

		if (current != name) {
			if (useAttr) {
				el.setAttribute("class", name)
			} else {
				el.className = name
			}
		}
		return el
	}

	function rmClass(el, name) {
		var current = el.className || ""
		, useAttr = typeof current != "string"

		if (useAttr) {
			current = el.getAttribute("class") || ""
		}

		if (current) {
			name = (" " + current + " ").replace(" " + name + " ", " ").trim()
			if (current != name) {
				if (useAttr) {
					el.setAttribute("class", name)
				} else {
					el.className = name
				}
			}
		}

		return el
	}

	// The addEventListener is supported in Internet Explorer from version 9.
	// https://developer.mozilla.org/en-US/docs/Web/Reference/Events/wheel
	// - IE8 always prevents the default of the mousewheel event.

	var wheelDiff = 120
	, addEv = "addEventListener"
	, remEv = "removeEventListener"
	, prefix = window[addEv] ? "" : (addEv = "attachEvent", remEv = "detachEvent", "on")
	, fixEv = Event.fixEv = {
		wheel:
			"onwheel" in document      ? "wheel" :      // Modern browsers
			"onmousewheel" in document ? "mousewheel" : // Webkit and IE
			"DOMMouseScroll"                            // older Firefox
	}
	, fixFn = Event.fixFn = {
		wheel: function(el, _fn) {
			return function(e) {
				var delta = (e.wheelDelta || -e.detail || -e.deltaY) / wheelDiff
				if (delta) {
					if (delta < 1 && delta > -1) {
						var diff = (delta < 0 ? -1 : 1)/delta
						delta *= diff
						wheelDiff /= diff
					}
					//TODO: fix event
					// e.deltaY =
					// e.deltaX = - 1/40 * e.wheelDeltaX|0
					// e.target = e.target || e.srcElement
					_fn.call(el, e, delta)
				}
			}
		}
	}

	function addEvent(el, ev, _fn) {
		var fn = fixFn[ev] && fixFn[ev](el, _fn) || _fn
		, fix = prefix ? function() {
			var e = window.event
			if (e) {
				e.target = e.srcElement
				e.preventDefault = preventDefault
				e.stopPropagation = stopPropagation
			}
			fn.call(el, e)
		} : fn

		el[addEv](prefix + (fixEv[ev] || ev), fix, false)

		Event.Emitter.on.call(el, ev, fix, el, _fn)
	}

	function rmEvent(el, ev, fn) {
		var evs = el._e && el._e[ev]
		, id = evs && evs.indexOf(fn)
		if (id) {
			el[remEv](prefix + (fixEv[ev] || ev), evs[id + 1])
			evs.splice(id - 1, 3)
		}
	}

	function preventDefault() {
		this.returnValue = false
	}
	function stopPropagation() {
		this.cancelBubble = this.cancel = true
	}

	Event.stop = function(e) {
		if (e.preventDefault) {
			e.stopPropagation()
			e.preventDefault()
		}
		return false
	}

	El.on = function(el, ev, fn) {
		// element.setCapture(retargetToElement)
		addEvent(el, ev, fn)
		return el
	}

	El.one = function(el, ev, fn) {
		function remove() {
			rmEvent(el, ev, fn)
			rmEvent(el, ev, remove)
		}
		addEvent(el, ev, fn)
		addEvent(el, ev, remove)
		return el
	}

	El.off = function(el, ev, fn) {
		rmEvent(el, ev, fn)
		return el
	}

	El.emit = function(el, ev) {
		Event.Emitter.emit.call(el, ev)
	}

	function empty(el) {
		for (var node; node = el.firstChild; ) {
			kill(node)
		}
		return el
	}

	function kill(el) {
		var id
		if (el._e) {
			Event.Emitter.emit.call(el, "kill")
			for (id in el._e) rmEvent(el, id)
		}
		if (el.parentNode) el.parentNode.removeChild(el)
		if (el.nodeType != 1) {
			return el.kill && el.kill()
		}
		empty(el)
		if (id = getAttr(el, "data-scope")) {
			delete elScope[id]
		}
		if (el.valObject) el.valObject = null
		return el
	}

	function elScope(node, parent, _scope) {
		if (_scope = elScope[getAttr(node, "data-scope")]) {
			return _scope
		}
		if (!parent || parent === true) {
			_scope = closest(node, "[data-scope]")
			_scope = _scope && elScope[getAttr(_scope, "data-scope")] || scopeData
		}
		if (parent) {
			setAttr(node, "data-scope", ++seq)
			_scope = elScope[seq] = Object.create(parent = (_scope || parent))
			_scope._super = parent
		}
		return _scope
	}

	function render(node, scope, skipSelf) {
		var bind, newBind, fn

		if (node.nodeType != 1) {
			return node.render ? node.render(scope) : node
		}

		// TODO:2015-05-25:lauri:Use elScope
		scope = elScope[getAttr(node, "data-scope")]
		|| scope
		|| (bind = closest(node, "[data-scope]")) && elScope[getAttr(bind, "data-scope")]
		|| scopeData

		if (bind = !skipSelf && getAttr(node, "data-bind")) {
			newBind = bind
			// i18n(bind, lang).format(scope)
			// document.documentElement.lang
			// document.getElementsByTagName('html')[0].getAttribute('lang')

			fn = "data b s r->data&&(" + bind.replace(renderRe, function(match, name, op, args) {
				var fn = bindings[name]
				if (op == ":" || fn && hasOwn.call(fn, "once")) newBind = newBind.replace(match, "")
				return fn ? (
					"(r=b['" + name + "'].call(this" + (fn.raw ? ",data,'" + args + "'" : args ? "," + args : "") + ")||r),"
				) :
				"s(this,'" + name + "'," + args + "),"
			}) + "r)"
			if (bind != newBind) setAttr(node, "data-bind", newBind)

			try {
				if (Fn(fn, node, scope)(scope, bindings, setAttr)) {
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
			render(bind, scope)
		}
		//** modernBrowser
		if (ie678 && node.nodeName == "SELECT") {
			node.parentNode.insertBefore(node, node)
		}
		//*/
		return node
	}

	function addWrapProto(key) {
		wrapProto[key] = wrap
		function wrap(a, b, c) {
			var i = 0
			, self = this
			, len = self.length
			, argi = arguments.length
			, fn = El[key]

			if (argi === 0) for (; i < len; ) fn(self[i++])
			else if (argi === 1) for (; i < len; ) fn(self[i++], a)
			else if (argi === 2) for (; i < len; ) fn(self[i++], a, b)
			else if (argi === 3) for (; i < len; ) fn(self[i++], a, b, c)
			else {
				var arr = wrapProto.slice.call(arguments)
				arr.unshift(1)
				for (; i < len; ) {
					arr[0] = self[i++]
					fn.apply(null, arr)
				}
			}
			return self
		}
	}

	El.empty = empty
	El.kill = kill
	El.render = render

	Object.keys(El).each(function(key) {
		if (!bindings[key]) {
			bindings[key] = function() {
				var arr = wrapProto.slice.call(arguments)
				arr.unshift(this)
				El[key].apply(null, arr)
			}
		}
		if (!wrapProto[key]) addWrapProto(key)
	})

	El.hasClass = hasClass
	El.addClass = addClass
	El.rmClass = rmClass
	El.append = append
	El.scope = elScope

	//** templates

	function parseTemplate(str) {
		var parent = El("div")
		, stack = [-1]
		, parentStack = []

		function work(all, indent, plugin, name, q, text, offset) {
			if (offset && all === indent) return

			for (q = indent.length; q <= stack[0]; ) {
				if (parent.plugin) {
					parent.plugin.done()
				}
				parent = parentStack.pop()
				stack.shift()
			}

			if (parent.txtMode) {
				parent.txt += all + "\n"
			} else if (plugin) {
				if (El.plugins[name]) {
					parentStack.push(parent)
					stack.unshift(q)
					parent = (new El.plugins[name](parent, text)).el
				} else {
					append(parent, all)
				}
			} else {
				if (name) {
					parentStack.push(parent)
					stack.unshift(q)
					q = El(name, 0, 1)
					append(parent, q)
					parent = q
				}
				if (text) {
					q = text.charAt(0)
					name = text.slice(1)
					if (q == ">") {
						(indent + " " + name).replace(templateRe, work)
					} else if (q == "|" || q == "\\") {
						append(parent, name) // + "\n")
					} else if (q != "/") {
						if (q != "&") {
							name = (parent.tagName == "INPUT" ? "val" : "txt")
							+ ":_('" + text.replace(/'/g, "\\'") + "').format(data)"
						}
						q = getAttr(parent, "data-bind")
						setAttr(parent, "data-bind", (q ? q + ";" : "") + name)
					}
				}
			}
		}
		str.replace(templateRe, work)
		work("", "")
	}

	function plugin(parent, name) {
		var t = this
		t.name = name
		t.parent = parent
		t.el = El("div")
		t.el.plugin = t
	}

	plugin[protoStr] = {
		_done: function() {
			var el, childId
			, t = this
			, childNodes = t.el.childNodes
			, i = childNodes.length

			for (; i--; ) {
				el = childNodes[i]
				if (el._childKey) {
					childId = i
					setAttr(el, "data-child", el._childKey)
					break
				}
			}

			if (childNodes[1]) {
				el = new ElWrap(childNodes)
				el._childId = childId
			} else {
				el = childNodes[0]
			}

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

	js[protoStr].done = Fn("Function(this.txt)()")

	El.plugins = {
		binding: js.extend({
			done: function() {
				JSON.merge(bindings, Function("return({" + this.txt + "})")())
			}
		}),
		child: plugin.extend({
			done: function() {
				var key = "@child-" + (++seq)
				, root = this.parent
				for (; (root.parentNode.parentNode || key).nodeType == 1; ) {
					root = root.parentNode
				}
				root._childKey = key
				append(this.parent, document.createComment(key))
			}
		}),
		css: js.extend({
			done: Fn("xhr.css(this.txt)")
		}),
		def: js.extend({
			done: Fn("View.def(this.params)")
		}),
		each: js.extend({
			done: function() {
				var txt = this.txt

				JSON.parse(this.params)
				.forEach(function(val) {
					if (!val || val.constructor != Object) {
						val = { item: val }
					}
					parseTemplate(txt.format(val))
				})
			}
		}),
		el: plugin,
		js: js,
		template: plugin,
		view: plugin.extend({
			done: function() {
				var fn
				, t = this
				, arr = t.name.split(/\s+/)
				, bind = getAttr(t.el, "data-bind")
				, view = View(arr[0], t._done(), arr[1], arr[2])
				if (bind) {
					fn = bind.replace(renderRe, function(match, name, op, args) {
						return "(this['" + name + "']" + (
							typeof view[name] == "function" ?
							"(" + (args || "") + "))," :
							"=" + args + "),"
						)
					}) + "1"
					Fn(fn, view, scopeData)()
				}
			}
		}),
		"view-link": plugin.extend({
			done: function() {
				var t = this
				, arr = t.name.split(/\s+/)
				View(arr[0], null, arr[2])
				.on("ping", function(opts) {
					View.show(arr[1].format(opts))
				})
			}
		})
	}

	xhr.view = xhr.tpl = El.tpl = parseTemplate
	xhr.css = function(str) {
		if (!styleNode) {
			// Safari and IE6-8 requires dynamically created
			// <style> elements to be inserted into the <head>
			append(document.getElementsByTagName("head")[0], styleNode = El("style"))
		}
		if (styleNode.styleSheet) styleNode.styleSheet.cssText += str
		else append(styleNode, str)
	}

	//*/

	El.scrollLeft = scrollLeft
	function scrollLeft() {
		return window.pageXOffset || root.scrollLeft || body.scrollLeft || 0
	}

	El.scrollTop = scrollTop
	function scrollTop() {
		return window.pageYOffset || root.scrollTop || body.scrollTop || 0
	}

	El.mouseLeft = function(e) {
		if (e.changedTouches) e = e.changedTouches[0]
		return e.pageX || e.clientX + scrollLeft()
	}

	El.mouseTop = function(e) {
		if (e.changedTouches) e = e.changedTouches[0]
		return e.pageY || e.clientY + scrollTop()
	}

	//** kb
	var kbMaps = []
	, kbKeys = {
		8:"backspace", 9:"tab",
		13:"enter", 16:"shift", 17:"ctrl", 18:"alt", 19:"pause",
		20:"caps", 27:"esc",
		33:"pgup", 34:"pgdown",
		35:"end", 36:"home",
		37:"left", 38:"up", 39:"right", 40:"down",
		45:"ins", 46:"del",
		91:"cmd",
		112:"f1", 113:"f2", 114:"f3", 115:"f4", 116:"f5", 117:"f6",
		118:"f7", 119:"f8", 120:"f9", 121:"f10", 122:"f11", 123:"f12"
	}
	, kbMod = /Mac|iPod|iPhone|iPad|Pike/.test(navigator.platform) ? "metaKey" : "ctrlKey"

	function kbRun(e, code, chr) {
		var fn, map
		, i = 0
		, el = e.target || e.srcElement
		, input = /INPUT|TEXTAREA|SELECT/i.test((el.nodeType == 3 ? el.parentNode : el).tagName)

		for (; map = kbMaps[i++]; ) {
			if (!input || map.enable_input) {
				fn = map[code] ||
				map[chr] ||
				map.num && code > 47 && code < 58 && (chr|=0, map.num) ||
				map.all
			}
			if (fn || !map.bubble) break
		}
		if (fn) fn(e, chr, el)
	}

	function kbDown(e) {
		if (kbMaps[0]) {
			var c = e.keyCode || e.which
			, code = c > 95 && c < 106 ? c - 48 : c
			, key = kbKeys[code] || String.fromCharCode(code) || code

			// Otherwise IE backspace navigates back
			if (code == 8 && kbMaps[0].backspace) {
				Event.stop(e)
			}
			kbRun(e, code, key)
			if (e.shiftKey && code != 16) kbRun(e, code, "shift+" + key)
			if (e.ctrlKey && code != 17) kbRun(e, code, "ctrl+" + key)
			if (e.altKey && code != 18) kbRun(e, code, "alt+" + key)
			if (e[kbMod] && code != 17 && code != 91) kbRun(e, code, "mod+" + key)
		}
	}

	El.addKb = kbMaps.unshift.bind(kbMaps)
	El.rmKb = function(map) {
		var i = kbMaps.indexOf(map||kbMaps[0])
		if (i > -1) kbMaps.splice(i, 1)
	}

	addEvent(document, "keydown", kbDown)
	//*/


	//** responsive
	var lastSize, lastOrient
	, breakpoints = {
		sm: 0,
		md: 601,
		lg: 1025
	}
	, setBreakpointsRated = function() {
		setBreakpoints()
	}.rate(100, true)

	function setBreakpoints(_breakpoints) {
		// document.documentElement.clientWidth is 0 in IE5
		var key, next
		, width = root.offsetWidth
		, map = breakpoints = _breakpoints || breakpoints

		for (key in map) {
			if (map[key] > width) break
			next = key
		}

		if ( next != lastSize ) {
			rmClass(root, lastSize)
			addClass(root, lastSize = next)
		}

		next = width > root.offsetHeight ? "landscape" : "portrait"

		if ( next != lastOrient) {
			rmClass(root, lastOrient)
			addClass(root, lastOrient = next)
		}

		next = window.Mediator || window.M
		if (next) next.emit("resize")
	}
	El.setBreakpoints = setBreakpoints

	setBreakpointsRated()

	addEvent(window, "resize", setBreakpointsRated)
	addEvent(window, "orientationchange", setBreakpointsRated)
	addEvent(window, "load", setBreakpointsRated)
	//*/


	//** i18n
	function i18n(text, lang) {
		lang = i18n[i18nGet(lang) || currentLang]
		return lang[text] ||
		text && lang[text = text.slice(text.indexOf(":") + 1) || text] ||
		text || ""
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
		JSON.merge(i18n[lang] || (i18n[lang] = {}), texts)
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

}(window, document, Object, Event, "prototype")


