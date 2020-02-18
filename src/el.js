
/* litejs.com/MIT-LICENSE.txt */



!function(window, document, Object, Event, protoStr) {
	var styleNode
	, BIND_ATTR = "data-bind"
	, isArray = Array.isArray
	, seq = 0
	, elCache = El.cache = {}
	, wrapProto = []
	, slice = wrapProto.slice
	, hasOwn = elCache.hasOwnProperty
	, body = document.body
	, root = document.documentElement
	, txtAttr = El.T = "textContent" in body ? "textContent" : "innerText"
	, templateRe = /^([ \t]*)(%?)((?:("|')(?:\\?.)*?\4|[-\w:.#[\]]=?)*)[ \t]*([>^;@|\\\/]|!?=|)(([\])}]?).*?([[({]?))$/gm
	, renderRe = /[;\s]*(\w+)(?:\s*(:?):((?:(["'\/])(?:\\?.)*?\3|[^;])*))?/g
	, splitRe = /[,\s]+/
	, camelRe = /\-([a-z])/g
	, camelFn = function(_, a) {
		return a.toUpperCase()
	}
	, bindings = El.bindings = {
		attr: setAttr,
		cls: El.cls = acceptMany(cls),
		css: El.css = acceptMany(function(el, key, val) {
			el.style[key.replace(camelRe, camelFn)] = "" + val || ""
		}, function(el, key) {
			return getComputedStyle(el).getPropertyValue(key)
		}),
		data: function(el, key, val) {
			setAttr(el, "data-" + key, val)
		},
		html: function(el, html) {
			el.innerHTML = html
		},
		ref: function(el, name) {
			this[name] = el
		},
		txt: El.txt = function(el, txt) {
			// In Safari 2.x, innerText results an empty string
			// when style.display=="none" or node is not in dom
			//
			// innerText is implemented in IE4, textContent in IE9
			// Opera 9-10 have Node.text

			if (el[txtAttr] !== txt) el[txtAttr] = txt
		},
		val: El.val = valFn,
		"with": function(el, map) {
			var scope = elScope(el, this)
			Object.assign(scope, map)
			if (scope !== this) {
				render(el)
				return true
			}
		}
	}
	, bindMatch = []
	, scopeData = El.data = {
		_: i18n,
		_b: bindings,
		El: El,
		history: history,
		View: View
	}
	// After iOS 13 iPad with default enabled "desktop" option
	// is the only Macintosh with multi-touch
	, iOS = /^(Mac|iP)/.test(navigator.platform)
	// || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

	/*** ie8 ***/

	// JScript engine in IE<9 does not recognize vertical tabulation character
	, ie678 = !+"\v1"
	, ie67 = ie678 && (document.documentMode | 0) < 8

	, matches = El.matches = body.matches ?
		function(el, sel) {
			return el && el.matches(sel)
		} :
		function(el, sel) {
			return !!selectorFn(sel)(el)
		}
	, closest = El.closest = body.closest ?
		function(el, sel) {
			return (el.closest ? el : el.parentNode).closest(sel)
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

	/*/
	El.matches = function(el, sel) {
		return el.matches(sel)
	}
	El.closest = function(el, sel) {
		return (el.closest ? el : el.parentNode).closest(sel)
	}
	El.find = function(el, sel) {
		return el.querySelector(sel)
	}
	El.findAll = function(el, sel) {
		return new ElWrap(el.querySelectorAll(sel))
	}
	/**/

	/**
	 * Turns CSS selector like syntax to DOM Node
	 * @returns {Node}
	 *
	 * @example
	 * El("input#12.nice[type=checkbox]:checked:disabled[data-lang=en].class")
	 * <input id="12" class="nice class" type="checkbox" checked="checked" disabled="disabled" data-lang="en">
	 */

	window.El = El

	function El(name) {
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

		return el
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
			elWrap.push(el)
		}
		return elWrap
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
		return el && el.getAttribute && el.getAttribute(key)
	}

	function setAttr(el, key, val) {
		var current

		if (key && key.constructor == Object) {
			for (current in key) {
				setAttr(el, current, key[current])
			}
			return
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

		/*** ie8 ***/
		// istanbul ignore next: IE fix
		if (ie67 && (key == "id" || key == "name" || key == "checked")) {
			el.mergeAttributes(document.createElement('<INPUT ' + key + '="' + val + '">'), false)
		} else
		/**/
		if (key == "class") {
			cls(el, val)
		} else if (val || val === 0) {
			if (current != val) {
				el.setAttribute(key, val)
			}
		} else if (current) {
			el.removeAttribute(key)
		}
	}

	function valFn(el, val) {
		var input, step, key, value
		, i = 0
		, type = el.type
		, opts = el.options
		, checkbox = type === "checkbox" || type === "radio"

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
						step = step[key] || (step[key] = step[key] === null || _key && +_key != _key ? {} : [])
						key = _key
					})
					step[key || step.length] = value
				}
			}

			return opts
		}

		if (arguments.length > 1) {
			if (opts) {
				value = (isArray(val) ? val : [ val ]).map(String)
				for (; input = opts[i++]; ) {
					input.selected = value.indexOf(input.value) > -1
				}
			} else if (el.val) {
				el.val(val)
			} else {
				checkbox ? (el.checked = !!val) : (el.value = val)
			}
			return
		}

		if (opts) {
			if (type === "select-multiple") {
				for (val = []; input = opts[i++]; ) {
					if (input.selected && !input.disabled) {
						val.push(input.valObject || input.value)
					}
				}
				return val
			}
			// IE8 throws error when accessing to options[-1]
			value = el.selectedIndex
			el = value > -1 && opts[value] || el
		}

		return checkbox && !el.checked ?
		(type === "radio" ? void 0 : null) :
		el.valObject !== void 0 ? el.valObject : el.value
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
				/*** debug ***/
				if (tmp.namespaceURI && child.namespaceURI && tmp.namespaceURI !== child.namespaceURI && child.tagName !== "svg") {
					console.error("NAMESPACE CHANGE!", tmp.namespaceURI, child.namespaceURI, child)
				}
				/**/
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

	function acceptMany(fn, getter) {
		return function f(el, name, val, delay) {
			if (el && name) {
				if (delay > 0) return setTimeout(f, delay, el, name, val)
				if (name.constructor === Object) {
					for (i in name) {
						if (hasOwn.call(name, i)) f(el, i, name[i])
					}
					return
				}
				var names = isArray(name) ? name : name.split(splitRe)
				, i = 0
				, len = names.length

				if (arguments.length < 3) {
					if (getter) return getter(el, name)
					for (; i < len; ) fn(el, names[i++])
				} else {
					/*
					if (isArray(val)) {
						for (; i < len; ) fn(el, names[i], val[i++])
					} else {
						for (; i < len; ) fn(el, names[i++], val)
					}
					/*/
					for (; i < len; ) {
						fn(el, names[i++], isArray(val) ? val[i - 1] : val)
					}
					//*/
				}
			}
		}
	}

	// setAttribute("class") is broken in IE7
	// className is object in SVGElements

	El.hasClass = hasClass
	function hasClass(el, name) {
		var current = el.className || ""

		if (typeof current !== "string") {
			current = el.getAttribute("class") || ""
		}

		return !!current && current.split(splitRe).indexOf(name) > -1
	}

	function cls(el, name, set) {
		var current = el.className || ""
		, useAttr = typeof current !== "string"

		if (useAttr) {
			current = el.getAttribute("class") || ""
		}

		if (arguments.length < 3 || set) {
			if (current) {
				name = current.split(splitRe).indexOf(name) > -1 ? current : current + " " + name
			}
		} else {
			name = current ? (" " + current + " ").replace(" " + name + " ", " ").trim() : current
		}

		if (current != name) {
			if (useAttr) {
				el.setAttribute("class", name)
			} else {
				el.className = name
			}
		}
	}

	// The addEventListener is supported in Internet Explorer from version 9.
	// https://developer.mozilla.org/en-US/docs/Web/Reference/Events/wheel
	// - IE8 always prevents the default of the mousewheel event.

	var addEv = "addEventListener"
	, remEv = "removeEventListener"
	, prefix = window[addEv] ? "" : (addEv = "attachEvent", remEv = "detachEvent", "on")
	, fixEv = Event.fixEv || (Event.fixEv = {})
	, fixFn = Event.fixFn || (Event.fixFn = {})
	, emitter = new Event.Emitter

	if (iOS) {
		// iOS doesn't support beforeunload, use pagehide instead
		fixEv.beforeunload = "pagehide"
	}

	function addEvent(el, ev, _fn) {
		var fn = fixFn[ev] && fixFn[ev](el, _fn, ev) || _fn
		, fix = prefix ? function() {
			var e = new Event(ev)
			if (e.clientX !== void 0) {
				e.pageX = e.clientX + scrollLeft()
				e.pageY = e.clientY + scrollTop()
			}
			fn.call(el, e)
		} : fn

		if (fixEv[ev] !== "") {
			el[addEv](prefix + (fixEv[ev] || ev), fix, false)
		}

		emitter.on.call(el, ev, fix, el, _fn)
	}

	function rmEvent(el, ev, fn) {
		var evs = el._e && el._e[ev]
		, id = evs && evs.indexOf(fn)
		if (id > -1) {
			if (fn !== evs[id + 1] && evs[id + 1]._rm) {
				evs[id + 1]._rm()
			}
			el[remEv](prefix + (fixEv[ev] || ev), evs[id + 1])
			evs.splice(id - 1, 3)
		}
	}

	Event.stop = function(e) {
		if (e && e.preventDefault) {
			e.stopPropagation()
			e.preventDefault()
		}
		return false
	}

	function bindingOn(el, events, selector, data, handler, delay) {
		var argi = arguments.length
		if (argi == 3 || argi == 4 && typeof data == "number") {
			delay = data
			handler = selector
			selector = data = null
		} else if (argi == 4 || argi == 5 && typeof handler == "number") {
			delay = handler
			handler = data
			if (typeof selector == "string") {
				data = null
			} else {
				data = selector
				selector = null
			}
		}
		if (delay > 0) return setTimeout(bindingOn, delay, el, events, selector, data, handler)
		var fn = (
			typeof handler == "string" ? function(e) {
				var target = selector ? El.closest(e.target, selector) : el
				if (!target) return
				var args = [handler, e, target]
				args.push.apply(args, data)
				View.emit.apply(View, args)
			} :
			selector ? function(e) {
				if (El.matches(e.target, selector)) handler(e)
			} :
			handler
		)
		, names = isArray(events) ? events : events.split(splitRe)
		, i = 0
		, len = names.length

		for (; i < len; ) {
			addEvent(el, names[i++], fn)
		}
	}
	bindingOn.once = 1
	El.on = bindings.on = bindingOn
	El.off = acceptMany(rmEvent)

	El.one = function(el, ev, fn) {
		function remove() {
			rmEvent(el, ev, fn)
			rmEvent(el, ev, remove)
		}
		addEvent(el, ev, fn)
		addEvent(el, ev, remove)
		return el
	}

	El.emit = function(el, ev) {
		emitter.emit.apply(el, slice.call(arguments, 1))
	}

	function empty(el) {
		for (var node; node = el.firstChild; ) {
			kill(node)
		}
		return el
	}

	function kill(el) {
		var id
		if (el) {
			if (el._e) {
				emitter.emit.call(el, "kill")
				for (id in el._e) rmEvent(el, id)
			}
			if (el.parentNode) {
				el.parentNode.removeChild(el)
			}
			if (el.nodeType != 1) {
				return el.kill && el.kill()
			}
			empty(el)
			if (id = el._scope) {
				delete elScope[id]
			}
			if (el.valObject) {
				el.valObject = null
			}
		}
	}

	function elScope(node, parent, fb) {
		return elScope[node._scope] || fb || (
			parent ?
			(((fb = elScope[node._scope = ++seq] = Object.create(parent))._super = parent), fb) :
			closestScope(node)
		) || scopeData

	}

	function closestScope(node) {
		for (; node = node.parentNode; ) {
			if (node._scope) return elScope[node._scope]
		}
	}

	function render(node, _scope) {
		var bind, fn
		, scope = elScope(node, 0, _scope)
		, i = 0

		if (node.nodeType != 1) {
			node.render ? node.render(scope) : node
			return
		}

		if (bind = getAttr(node, BIND_ATTR)) {
			scope._m = bindMatch
			scope._t = bind
			// i18n(bind, lang).format(scope)
			// document.documentElement.lang
			// document.getElementsByTagName('html')[0].getAttribute('lang')

			fn = "data b s B r->data&&(" + bind.replace(renderRe, function(match, name, op, args) {
				scope._m[i] = match
				var fn = bindings[name]
				return (
					(op == ":" || fn && hasOwn.call(fn, "once")) ?
					"s(this,B,data._t=data._t.replace(data._m[" + (i++)+ "],''))||" :
					""
				) + (
					fn ?
					"b['" + name + "'].call(data,this" + (fn.raw ? ",'" + args + "'" : args ? "," + args : "") :
					"s(this,'" + name + "'," + args
				) + ")||"
			}) + "r)"

			try {
				if (Fn(fn, node, scope)(scope, bindings, setAttr, BIND_ATTR)) {
					return
				}
			} catch (e) {
				/*** debug ***/
				console.error(e)
				console.error("BINDING: " + bind, node)
				/**/
				if (window.onerror) {
					window.onerror(e.message, e.fileName, e.lineNumber)
				}
			}
		}

		for (bind = node.firstChild; bind; bind = fn) {
			fn = bind.nextSibling
			render(bind, scope)
		}
		/*** ie8 ***/
		if (ie678 && node.tagName == "SELECT") {
			node.parentNode.insertBefore(node, node)
		}
		/**/
	}

	El.empty = empty
	El.kill = kill
	El.render = render

	Object.each(El, function(fn, key) {
		if (!wrapProto[key]) {
			wrapProto[key] = function wrap() {
				var i = 0
				, self = this
				, len = self.length
				, arr = slice.call(arguments)
				arr.unshift(1)
				for (; i < len; ) {
					arr[0] = self[i++]
					fn.apply(null, arr)
				}
				return self
			}
		}
	})

	El.append = append
	El.scope = elScope

	function parseTemplate(str) {
		var parent = El("div")
		, stack = [-1]
		, parentStack = []

		function work(all, indent, plugin, name, q, op, text, mapEnd, mapStart, offset) {
			if (offset && all === indent) return

			for (q = indent.length; q <= stack[0]; ) {
				if (parent.plugin) {
					parent.plugin.done()
				}
				parent = parentStack.pop()
				stack.shift()
			}

			if (parent._r) {
				parent.txt += all + "\n"
			} else if (plugin || mapStart && (name = "map")) {
				if (El.plugins[name]) {
					parentStack.push(parent)
					stack.unshift(q)
					parent = (new El.plugins[name](parent, op + text, mapEnd ? "" : ";")).el
				} else {
					append(parent, all)
				}
			} else if (mapEnd) {
				appendBind(parent, text, "")
			} else {
				if (name) {
					parentStack.push(parent)
					stack.unshift(q)
					append(parent, parent = q = El(name))
				}
				if (text && op != "/") {
					if (op == ">") {
						(indent + " " + text).replace(templateRe, work)
					} else if (op == "|" || op == "\\") {
						append(parent, text) // + "\n")
					} else {
						if (op == "@") {
							text = text.replace(/(\w+):?/, "on:'$1',")
						} else if (op != ";" && op != "^") {
							text = (parent.tagName == "INPUT" ? "val" : "txt") + (
								op == "=" ? ":" + text.replace(/'/g, "\\'") :
								":_('" + text.replace(/'/g, "\\'") + "', data)"
							)
						}
						appendBind(parent, text, ";", op)
					}
				}
			}
		}
		str.replace(templateRe, work)
		work("", "")
	}

	function appendBind(el, val, sep, q) {
		var current = getAttr(el, BIND_ATTR)
		setAttr(el, BIND_ATTR, (current ? (
			q == "^" ?
			val + sep + current :
			current + sep + val
		) : val))
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

	function js(parent, params, attr1) {
		var t = this
		// Raw text mode
		t._r = t.parent = parent
		t.txt = ""
		t.plugin = t.el = t
		t.params = params
		t.a = attr1
	}

	js[protoStr].done = Fn("Function(this.txt)()")

	El.plugins = {
		binding: js.extend({
			done: function() {
				Object.assign(bindings, Function("return({" + this.txt + "})")())
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
			done: Fn("View.def(this.params||this.txt)")
		}),
		each: js.extend({
			done: function() {
				var txt = this.txt

				JSON.parse(this.params)
				.each(function(val) {
					if (!val || val.constructor != Object) {
						val = { item: val }
					}
					parseTemplate(txt.format(val))
				})
			}
		}),
		el: plugin,
		js: js,
		map: js.extend({
			done: function() {
				var self = this
				, txt = (self.params + self.txt)
				appendBind(
					self.parent,
					self.a ? txt.slice(1) : txt,
					self.a
				)
			}
		}),
		template: plugin,
		view: plugin.extend({
			done: function() {
				var fn
				, t = this
				, arr = t.name.split(splitRe)
				, bind = getAttr(t.el, BIND_ATTR)
				, view = View(arr[0], t._done(), arr[1], arr[2])
				if (bind) {
					fn = bind.replace(renderRe, function(match, name, op, args) {
						return "(this['" + name + "']" + (
							typeof view[name] == "function" ?
							"(" + (args || "") + ")" :
							"=" + args
						) + "),"
					}) + "1"
					Fn(fn, view, scopeData)()
				}
			}
		}),
		"view-link": plugin.extend({
			done: function() {
				var t = this
				, arr = t.name.split(splitRe)
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

	El.scrollLeft = scrollLeft
	function scrollLeft() {
		return window.pageXOffset || root.scrollLeft || body.scrollLeft || 0
	}

	El.scrollTop = scrollTop
	function scrollTop() {
		return window.pageYOffset || root.scrollTop || body.scrollTop || 0
	}

	/*** kb ***/
	var kbMaps = []
	, kbMod = El.kbMod = iOS ? "metaKey" : "ctrlKey"
	, kbKeys = {
		  8: "backspace", 9: "tab",
		 13: "enter",    16: "shift", 17: "ctrl",  18: "alt",  19: "pause",
		 20: "caps",     27: "esc",
		 33: "pgup",     34: "pgdown",
		 35: "end",      36: "home",
		 37: "left",     38: "up",    39: "right", 40: "down",
		 45: "ins",      46: "del",
		 91: "cmd",
		112: "f1",      113: "f2",   114: "f3",   115: "f4",  116: "f5",  117: "f6",
		118: "f7",      119: "f8",   120: "f9",   121: "f10", 122: "f11", 123: "f12"
	}

	function kbRun(e, code, chr) {
		var fn, map
		, i = 0
		, el = e.target || e.srcElement
		, input = /INPUT|TEXTAREA|SELECT/i.test((el.nodeType == 3 ? el.parentNode : el).tagName)

		for (; map = kbMaps[i++]; ) {
			if (!input || map.input) {
				fn = map[code] ||
				map[chr] ||
				map.num && code > 47 && code < 58 && (chr|=0, map.num) ||
				map.all
			}
			if (fn || !map.bubble) break
		}
		if (fn) {
			typeof fn === "string" ? View.emit(fn, e, chr, el) : fn(e, chr, el)
		}
	}

	function kbDown(e) {
		if (kbMaps[0]) {
			var c = e.keyCode || e.which
			, numpad = c > 95 && c < 106
			, code = numpad ? c - 48 : c
			, key = kbKeys[code] || String.fromCharCode(code).toLowerCase() || code

			// Otherwise IE backspace navigates back
			if (code == 8 && kbMaps[0].backspace) {
				Event.stop(e)
			}
			kbRun(e, code, key)
			if (e.shiftKey && code != 16) kbRun(e, code, "shift+" + key)
			// people in Poland use Right-Alt+S to type in Ś.
			// Right-Alt+S is mapped internally to Ctrl+Alt+S.
			// THANKS: Marcin Wichary - disappearing Polish Ś [https://medium.engineering/fa398313d4df]
			if (e.altKey) {
				if (code != 18) kbRun(e, code, "alt+" + key)
			} else if (code != 17) {
				if (e.ctrlKey) kbRun(e, code, "ctrl+" + key)
				if (e[kbMod] && code != 91) kbRun(e, code, "mod+" + key)
			}
		}
	}

	El.addKb = function(map, killEl) {
		if (map) {
			kbMaps.unshift(map)
			if (killEl) {
				// addEvent(killEl, "kill", rmKb.bind(map, map))
				emitter.on.call(killEl, "kill", rmKb.bind(map, map))
			}
		}
	}
	El.rmKb = rmKb
	function rmKb(map) {
		var i = kbMaps.indexOf(map||kbMaps[0])
		if (i > -1) kbMaps.splice(i, 1)
	}

	addEvent(document, "keydown", kbDown)
	/**/


	/*** responsive ***/
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
			cls(root, lastSize, 0)
			cls(root, lastSize = next)
		}

		next = width > root.offsetHeight ? "landscape" : "portrait"

		if ( next != lastOrient) {
			cls(root, lastOrient, 0)
			cls(root, lastOrient = next)
		}

		if (next = window.View) next.emit("resize")
	}
	El.setBreakpoints = setBreakpoints

	setBreakpointsRated()

	addEvent(window, "resize", setBreakpointsRated)
	addEvent(window, "orientationchange", setBreakpointsRated)
	addEvent(window, "load", setBreakpointsRated)
	/**/
}(window, document, Object, Event, "prototype")

