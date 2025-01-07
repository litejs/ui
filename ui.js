
/* litejs.com/MIT-LICENSE.txt */

/* global escape, navigator, xhr */

/*** debug ***/
console.log("LiteJS is in debug mode, but it's fine for production")
/**/

!function(window, document, history, localStorage, location, navigator, Function, Object) {
	window.El = El
	asEmitter(window.LiteJS = LiteJS)

	var UNDEF, parser, pushBase, styleNode
	, NUL = null
	, html = document.documentElement
	, body = document.body
	, splitRe = /[,\s]+/
	, emptyArr = []
	, plugins = {}
	, sources = []
	, assign = Object.assign
	, bind = El.bind.bind(El.call)
	, create = Object.create
	, hasOwn = bind(plugins.hasOwnProperty)
	, isArr = Array.isArray
	, slice = emptyArr.slice
	, elReplace = Function("a,b,c", "a&&b&&(c=a.parentNode)&&c.replaceChild(b,a)")
	, elRm = Function("a,b", "a&&(b=a.parentNode)&&b.removeChild(a)")
	, getAttr = Function("a,b", "return a&&a.getAttribute&&a.getAttribute(b)")
	, replace = Function("a,b,c", "return a.replace(b,c)")

	// JScript engine in IE8 and below does not recognize vertical tabulation character `\v`.
	// http://webreflection.blogspot.com/2009/01/32-bytes-to-know-if-your-browser-is-ie.html
	, ie678 = !+"\v1" // jshint ignore:line

	, BIND_ATTR = "data-bind"
	, elSeq = 0
	, elCache = {}
	, formatRe = /{((?:("|')(?:\\.|[^\\])*?\2|.)+?)}/g
	, renderRe = /[;\s]*([-.\w$]+)(?:([ :!])((?:(["'\/])(?:\\.|[^\\])*?\4|[^;])*))?/g
	, selectorRe = /([.#:[])([-\w]+)(?:([~^$*|]?)=(("|')(?:\\.|[^\\])*?\5|[-\w]+))?]?/g
	, templateRe = /([ \t]*)(%?)((?:("|')(?:\\.|[^\\])*?\4|[-\w:.#[\]~^$*|]=?)*) ?([\/>=@^;]|)(([\])}]?).*?([[({]?))(?=\x1f|$)/gm
	, fnCache = {}
	, fnRe = /('|")(?:\\.|[^\\])*?\1|\/(?:\\.|[^\\])+?\/[gim]*|\$el\b|\$[aos]\b|\b(?:false|in|if|new|null|this|true|typeof|void|function|var|else|return)\b|\.\w+|\w+:/g
	, wordRe = /[a-z_$][\w$]*/ig
	, camelRe = /\-([a-z])/g
	// innerText is implemented in IE4, textContent in IE9, Node.text in Opera 9-10
	// Safari 2.x innerText results an empty string when style.display=="none" or Node is not in DOM
	, txtAttr = "textContent" in html ? "textContent" /* c8 ignore next */ : "innerText"
	, bindingsCss = acceptMany(function(el, key, val) {
		el.style[replace(key, camelRe, camelFn)] = val
	})
	, bindingsOn = acceptMany(addEvent, function(el, val, selector, data) {
		return isStr(val) ? function(e) {
			var target = selector ? closest(e.target, selector) : el
			if (target) emit.apply(target, [elScope(el).$ui, val, e, target].concat(data))
		} :
		selector ? function(e, a1, a2) {
			if (matches(e.target, selector)) val(e, a1, a2)
		} :
		val
	})
	, bindings = {
		cls: acceptMany(cls),
		css: bindingsCss,
		on: bindingsOn,
		set: acceptMany(setAttr),
		txt: elTxt,
		val: elVal,
	}
	, globalScope = {
		El: El,
		$b: bindings
	}
	, elArr = {
		append: function(el) {
			var elWrap = this
			if (elWrap._s) {
				append(elWrap[elWrap._s[getAttr(el, "slot") || elWrap._s._] || 0], el)
			} else {
				elWrap.push(el)
			}
			return elWrap
		},
		cloneNode: function(deep) {
			deep = ElWrap(this, deep)
			deep._s = this._s
			return deep
		}
	}

	, Event = window.Event || window
	, fixEv = Event.fixEv || (Event.fixEv = {})
	, fixFn = Event.fixFn || (Event.fixFn = {})

	/*** markup ***/
	, blockRe = /^(?:(=+|>| -) ([\s\S]+)|\[! *(\S*) *!] ?(.*))/
	, tags = {
		" -": "ul",
		"!": "a",
		"*": "b",
		"+": "ins",
		",": "sub",
		"-": "del",
		"/": "i",
		":": "mark",
		";": "span",
		">": "blockquote",
		"@": "time",
		"^": "sup",
		"_": "u",
		"`": "code",
		"~": "s"
	}
	function inline(tag, op, text, name, link, attr) {
		return op && !isArr(text) ? "<" +
			(tag = tags[op] || "h" + op.length) +
			(tag == "a" ? " href=\"" + (link || text) + "\"" : op == "@" ? " datetime=\"" + name + "\"" : "") +
			(attr ? " class=\"" + attr.slice(1) + "\">" : ">") +
			(
				op === ">" ? doc(replace(text, /^> ?/gm, "")) :
				tag == "ul" ? "<li>" + text.split(/\n - (?=\S)/).map(inline).join("</li>\n<li>") + "</li>" :
				inline(tag == "a" ? replace(name, /^\w+:\/{0,2}/, "") : text)
			) +
			"</" + tag + ">" :
		replace(tag, /\[([-!*+,/:;@^_`~])((.+?)(?: (\S+?))?)\1(\.[.\w]+)?]/g, inline)
	}
	function block(tag, op, text, media, alt) {
		return op && !isArr(text) ? inline(tag, op, text) :
		media ? "<img src=\"" + media + "\" alt=\"" + alt + "\">" :
		blockRe.test(tag) ? replace(tag, blockRe, block) :
		tag === "---" ? "<hr>" : "<p>" + inline(tag) + "</p>"
	}
	function doc(txt) {
		return replace(txt.trim(), /^ \b/gm, "<br>").split(/\n\n+/).map(block).join("\n")
	}
	bindings.t = function(el, text) {
		el.innerHTML = inline(replace(text, /</g, "&lt;"))
	}
	bindings.d = function(el, text) {
		el.innerHTML = doc(replace(text, /</g, "&lt;"))
	}
	/**/

	/*** svg ***/
	bindings.xlink = function(el, href) {
		// In SVG2, xlink namespace is not needed, plain href can be used (Chrome50 2016, Firefox51 2017).
		el.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", href)
	}
	if (window.SVGElement) {
		each("animate animateMotion animateTransform circle clipPath defs desc ellipse feBlend feColorMatrix feComponentTransfer feComposite feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight feDropShadow feFlood feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode feMorphology feOffset fePointLight feSpecularLighting feSpotLight feTile feTurbulence filter foreignObject g image line linearGradient marker mask metadata mpath path pattern polygon polyline radialGradient rect script set stop svg switch symbol text textPath tspan use view", function(name) {
			elCache[name] = document.createElementNS("http://www.w3.org/2000/svg", name)
		})
		// a style title
	}
	/**/

	xhr.css = injectCss
	xhr.ui = function(src) {
		sources.push(src)
	}

	function asEmitter(obj) {
		obj.on = on
		obj.off = off
		obj.one = one
		obj.emit = wrap(emit)
		// emitNext, emitLate
		function wrap(fn) {
			return function(a, b, c, d, e) {
				return fn(this, a, b, c, d, e)
			}
		}
	}

	function on(type, fn, scope, _origin) {
		var emitter = this === window ? emptyArr : this
		, events = emitter._e || (emitter._e = create(NUL))
		if (type && fn) {
			emit(emitter, "newListener", type, fn, scope, _origin)
			;(events[type] || (events[type] = [])).unshift(scope, _origin, fn)
		}
		return this
	}

	function off(type, fn, scope) {
		var i, args
		, emitter = this === window ? emptyArr : this
		, events = emitter._e && emitter._e[type]
		if (events) {
			for (i = events.length - 2; i > 0; i -= 3) {
				if ((events[i + 1] === fn || events[i] === fn) && events[i - 1] == scope) {
					args = events.splice(i - 1, 3)
					emit(emitter, "removeListener", type, args[2], args[0], args[1])
					if (fn) break
				}
			}
		}
		return this
	}

	function one(type, fn, scope) {
		var emitter = this === window ? emptyArr : this
		function remove() {
			off.call(emitter, type, fn, scope)
			off.call(emitter, type, remove, scope)
		}
		on.call(emitter, type, remove, scope)
		on.call(emitter, type, fn, scope)
		return this
	}

	function emit(emitter, type) {
		if (emitter === window) emitter = emptyArr
		var args, i
		, _e = emitter._e
		, arr = _e ? (_e[type] || emptyArr).concat(_e["*"] || emptyArr) : emptyArr
		if ((_e = arr.length)) {
			for (i = _e - 1, args = slice.call(arguments, 2); i > 1; i -= 3) {
				if (arr[i]) arr[i].apply(arr[i - 2] || emitter, args)
			}
		}
		return _e / 3
	}

	function addEvent(el, ev, fn, opts) {
		var fn2 = fixFn[ev] && fixFn[ev](el, fn, ev) || fn
		, ev2 = fixEv[ev] || ev

		if (ev2 !== "" && "on" + ev2 in el) {
			// polyfilled addEventListener returns patched function
			// Since Chrome 56 touchstart/move have the { passive: true } by default.
			// preventDefault() won't work unless you set passive to false.
			fn2 = html.addEventListener.call(el, ev2, fn2, opts != UNDEF ? opts : false) || fn2
		}

		on.call(el, ev, fn2, el, fn)
	}

	function rmEvent(el, ev, fn) {
		var evs = el._e && el._e[ev]
		, id = evs && evs.indexOf(fn)
		, ev2 = fixEv[ev] || ev
		if (id > -1) {
			if (fn !== evs[id + 1] && evs[id + 1]._rm) {
				evs[id + 1]._rm()
			}
			if (ev2 !== "" && "on" + ev2 in el) {
				html.removeEventListener.call(el, ev2, evs[id + 1])
			}
			evs.splice(id - 1, 3)
		}
	}

	function eventStop(e) {
		if (e && e.preventDefault) {
			e.stopPropagation()
			e.preventDefault()
		}
		return false
	}

	function LiteJS(opts) {
		opts = assign({
			/*** breakpoints ***/
			breakpoints: {
				sm: 0,
				md: 601,
				lg: 1025
			},
			/**/
			home: "home",
			root: body
		}, opts)

		function View(route, el, parent) {
			var view = views[route]
			if (view) {
				if (el) {
					view.e = el
					view.p = parent && View(parent)
				}
				return view
			}
			view = this
			if (!(view instanceof View)) return new View(route, el, parent)
			views[view.r = route] = view
			view.e = isStr(el) ? find(html, el) : el
			view.p = parent && View(parent)

			if (route.charAt(0) !== "#") {
				fnStr += "m[" + (view.s = routeSeq++) + "]?("
				reStr += "|(" + replace(route, routeRe, function(_, expr) {
					return expr ?
						(fnStr += "p['" + expr + "']=m[" + (routeSeq++) + "],") && "([^/]+?)" :
						replace(_, reEsc, "\\$&")
				}) + ")"
				fnStr += "'" + route + "'):"
				viewFn = 0
			}
		}

		asEmitter(View)
		asEmitter(View.prototype = {
			wait: function() {
				var params = lastParams
				params._p = 1 + (params._p | 0) // pending
				return function() {
					if (--params._p || lastParams !== params || syncResume) return
					if (params._d) {
						bubbleDown(params)
					} else if (params._v) {
						viewPing(lastView, params)
					}
				}
			}
		})

		var viewFn, lastView, lastUrl, syncResume
		, fnStr = ""
		, reStr = ""
		, reEsc = /[.*+?^${}()|[\]/\\]/g
		, routeRe = /\{([\w%.]+?)\}|.[^{\\]*?/g
		, routeSeq = 1

		, views = View.views = {}
		, paramCb = {}
		, lastParams = paramCb
		, root = View("#", opts.root).e
		, $d = elScope(root, root)

		$d.$ui = assign(View, {
			$: bind(find, View, root),
			$$: bind(findAll, View, root),
			$d: $d,
			def: viewDef,
			get: viewGet,
			param: function(names, cb) {
				each(names, function(n) {
					paramCb[n] = cb
				})
			},
			parse: (parser = viewParse),
			ping: function(view, fn) {
				View(view).on("ping", fn)
			},
			show: viewShow
		})

		each(opts, function(val, opt) {
			if (isFn(View[opt])) {
				each(val, function(obj, key) {
					View[opt](key, obj)
				})
			} else {
				View[opt] = val
			}
		})

		function bubbleDown(params) {
			var view = params._v
			, close = params._c
			, parent = view && view.p
			if (!view || params._p && /{/.test(view.r)) {
				return viewClose(close)
			}
			if (parent && !view.o || view === close) {
				viewClose(close, view)
				append(parent.o || parent.e, view.o = view.e.cloneNode(true))
				render(view.o)
				viewEmit(parent, "openChild", view, close)
				viewEmit(view, "open", params)
				/*** kb ***/
				addKb(view.kb)
				/**/
				params._c = UNDEF
			}
			if ((params._d = params._v = view.c)) {
				bubbleDown(params)
			}
			if ((lastView === view)) {
				viewEmit(view, "show", params)
				blur()
			}
		}

		function viewClose(view, open) {
			if (view && view.o) {
				viewEmit(view.p, "closeChild", view, open)
				viewClose(view.c)
				elKill(view.o)
				view.o = UNDEF
				/*** kb ***/
				rmKb(view.kb)
				/**/
				viewEmit(view, "close")
			}
		}
		function viewDef(str) {
			for (var match, re = /(\S+) (\S+)/g; (match = re.exec(str)); ) {
				each(match[1], def)
			}
			function def(view) {
				view = View(expand(view))
				each(match[2], function(file) {
					view.f = (view.f ? view.f + "," : "") + (views[file] ? views[file].f : expand(file))
				})
			}
		}
		function viewEmit(view, event, a, b) {
			emit(view, event, a, b)
			emit(View, event, view, a, b)
			emit(LiteJS, event, view, a, b)
		}
		function viewEval(str, scope) {
			try {
				Function("$s,$ui,$d,$,$$", str)(scope, View, $d, View.$, View.$$)
			} catch(e) {
				throw e + "\nviewEval: " + str
			}
		}
		function viewGet(url, params) {
			if (!viewFn) {
				viewFn = Function(
					"var r=/^\\/?(?:" + reStr + ")[\\/\\s]*$/;" +
					"return function(u,p,d){var m=r.exec(u);return m!==null?(" + fnStr + "d):d}"
				)()
			}
			return View(url ? viewFn(url, params || {}, "404") : View.home)
		}
		function viewParse(str) {
			var parent = El("div")
			, stack = [-1]
			, parentStack = []

			function work(all, indent, plugin, sel, q, op, text, mapEnd, mapStart, offset) {
				if (offset && all === indent) return

				for (q = indent.length; q <= stack[0]; ) {
					if (parent.p) {
						if (parent.p.c && !parent.p.e.childNodes[0]) break
						parent.p.d(parent.p)
					}
					parent = parentStack.pop()
					stack.shift()
				}
				if (op === "@") {
					text = replace(text, /([\w,.]+):?/, "on!'$1',")
				}
				if (parent.r) {
					parent.t += "\n" + all
				} else if (plugin || mapStart && (sel = "map")) {
					if (plugins[sel]) {
						parentStack.push(parent)
						stack.unshift(q)
						parent = (new plugins[sel](parent, op + text, mapEnd ? "" : ";")).e
					} else {
						append(parent, all)
					}
				} else if (mapEnd) {
					appendBind(parent, text, "")
				} else {
					if (sel) {
						parentStack.push(parent)
						stack.unshift(q)
						append(parent, parent = El(sel))
					}
					if (text && op != "/") {
						if (op === ">") {
							replace(indent + " " + text, templateRe, work)
						} else if (op === "=") {
							append(parent, text) // + "\n")
						} else {
							if (op === "") {
								text = "txt _(" + quote(text) + ",$s)"
							}
							appendBind(parent, text, ";", op)
						}
					}
				}
			}
			replace(str, templateRe, work)
			work("", "")
			if (parent.childNodes[0]) {
				append(root, parent.childNodes)
				render(root)
				/*** debug ***/
				console.log("Outside view defined elements are rendered immediately into UI")
				/**/
			}
			if (parent.i) {
				histStart(viewShow)
			}
		}
		function viewPing(view, params) {
			var parent
			, tmp = params._v || view // Continue bubbleUp from _v
			lastParams = params
			lastView = view
			params._c = view.o ? view : params._c
			for (View.route = view.r; tmp; tmp = parent) {
				viewEmit(syncResume = params._v = tmp, "ping", params, View)
				syncResume = UNDEF
				if (lastParams !== params) return
				if ((parent = tmp.p)) {
					if (parent.c && parent.c !== tmp) {
						params._c = parent.c
					}
					parent.c = tmp
				}
				if (tmp.f) {
					return xhr.load(
						replace(tmp.f, /^|,/g, "$&" + (View.path || "")).split(","),
						bind(readTemplates, view, view.wait(tmp.f = ""))
					)
				} else if (!tmp.e) {
					if (tmp.r === "404") {
						viewParse("%view 404 #\nh2 Not found")
					}
					return viewShow("404")
				}
			}

			for (tmp in params) {
				if (tmp.charAt(0) !== "_" && (syncResume = hasOwn(paramCb, tmp) && paramCb[tmp] || paramCb["*"])) {
					syncResume(params[tmp], tmp, view, params)
					syncResume = UNDEF
				}
			}
			viewEmit(view, "nav")
			bubbleDown(params)
		}
		function viewShow(url) {
			if (url === true) {
				if (lastParams._p > 0) return
				url = lastUrl
				lastUrl = 0
			}
			var params = $d.params = { _t: Date.now() }
			, view = viewGet(url, params)
			if (!view.o || lastUrl !== url) {
				$d.url = lastUrl = expand(url)
				viewPing(view, params)
			}
		}

		function addPlugin(name, proto) {
			plugins[name] = Plugin
			function Plugin(parent, op, sep) {
				var plugin = this
				, arr = op.split(splitRe)
				plugin.n = arr[0] // name
				plugin.x = arr[1] // View parent
				plugin.u = parent
				if (plugin.r) {
					plugin.t = ""
					plugin.p = plugin.e = plugin
					plugin.o = op
					plugin.s = sep
				} else {
					if (plugin.c) {
						elCache = create(plugin.c = elCache)
					}
					plugin.e = El(name === "svg" ? name : "div")
					plugin.e.p = plugin
				}
			}
			if (proto.r) proto.d = Function("p", "p.r(p.o+p.t)")
			assign(Plugin.prototype, proto)
		}
		function usePluginContent(plugin) {
			var el = plugin.e
			, childNodes = el.childNodes
			, child = childNodes[1] ? ElWrap(childNodes) : childNodes[0]
			, contentPos = el._cp

			if (contentPos > -1) {
				if (childNodes[contentPos].nodeType < 2 && el._sk) {
					setAttr(childNodes[contentPos], "data-slot", el._sk)
				}
				child._s = el._s
			}
			if (plugin.c) elCache = plugin.c
			el.p = plugin.e = plugin.u = UNDEF
			return child
		}

		addPlugin("start", {
			d: Function("p", "p.u.i=1")
		})
		addPlugin("slot", {
			d: function(plugin) {
				var slotName = plugin.n || ++elSeq
				, parent = plugin.u
				append(parent, Comm("slot" + slotName))
				// In IE6 root div is inside documentFragment
				for (; (parent.parentNode || plugin).nodeType < 2; parent = parent.parentNode);
				;(parent._s || (parent._s = {}))[slotName] = parent.childNodes.length - 1
				if (!plugin.n) parent._s._ = parent._sk = slotName
				parent._cp = parent.childNodes.length - 1
			}
		})
		addPlugin("css",  { r: injectCss })
		addPlugin("def",  { r: viewDef })
		addPlugin("js",   { r: viewEval })
		addPlugin("each", {
			r: function() {
				var txt = this.t
				each(this.o, function(param) {
					viewParse(replace(txt, /{key}/g, param))
				})
			}
		})
		addPlugin("el", {
			c: 1,
			d: function(plugin, el) {
				el = usePluginContent(plugin)
				elCache[plugin.n] = el
			}
		})
		plugins.svg = plugins.el
		addPlugin("map", {
			r: function(txt) {
				var plugin = this
				appendBind(plugin.u, plugin.s ? txt.slice(1) : txt, plugin.s)
			}
		})
		addPlugin("view", {
			c: 1,
			d: function(plugin) {
				var expr = getAttr(plugin.e, BIND_ATTR)
				, view = View(plugin.n, usePluginContent(plugin), plugin.x)
				if (expr) {
					viewEval(replace(expr, renderRe, function(_, name, op, args) {
						return "($s." + name + (isFn(view[name]) ? "(" + (args || "") + ")" : "=" + args) + "),"
					}) + "1", view)
				}
			}
		})

		/*** breakpoints ***/
		var lastSize, lastOrient
		, breakpoints = opts.breakpoints
		, setBreakpointsRated = rate(function() {
			// document.documentElement.clientWidth is 0 in IE5
			var point, next
			, width = html.offsetWidth

			for (point in breakpoints) {
				if (breakpoints[point] > width) break
				next = point
			}

			if (next != lastSize) {
				cls(html, lastSize, 0)
				cls(html, lastSize = next)
			}

			next = width > html.offsetHeight ? "land" : "port"

			if (next != lastOrient) {
				cls(html, lastOrient, 0)
				cls(html, lastOrient = next)
			}

			emit(View, "resize")
		}, 99)

		if (breakpoints) {
			setBreakpointsRated()
			bindingsOn(window, "orientationchange resize", setBreakpointsRated)
		}
		/**/

		/*** i18n ***/
		globalScope._ = format
		var iFormat = create(NUL)
		each(opts.locales || { en: "en" }, function(translations, lang, locales) {
			translations = formatGet.t = assignDeep(assignDeep(create(opts.globals || NUL), locales), opts[lang])
			formatGet.g = getExt
			iFormat[lang] = formatGet
			var iAlias = {
				"#": "num", "num": "#",
				"*": "plural", "plural": "*",
				"?": "pick", "pick": "?",
				"@": "date", "date": "@",
				"~": "pattern", "pattern": "~"
			}
			, cache = create(NUL)
			, dateRe = /([Md])\1\1\1?|([YMDdHhmswSZ])(\2?)|[uUaSoQ]|'((?:''|[^'])*)'|(["\\\n\r\u2028\u2029])/g
			, date1 = new Date()
			, date2 = new Date()
			, iExt = formatGet.ext = {
				date: function(input, _mask, _zone) {
					var undef
					, offset = 4294967295
					, d = input * (input > offset || input < -offset ? 1 : 1000) || Date.parse(input)
					, t = translations["@"] || {}
					, mask = t[_mask] || _mask || "UTC:Y-MM-DD'T'HH:mm:ss'Z'"
					, zone = _zone != undef ? _zone : Date._tz != undef ? Date._tz : undef
					, utc = mask.slice(0, 4) == "UTC:"
					if (zone != undef && !utc) {
						offset = 60 * zone
						date1.setTime(d + offset * 6e4)
						utc = mask = "UTC:" + mask
					} else {
						date1.setTime(d)
						offset = utc ? 0 : -date1.getTimezoneOffset()
					}
					return isNaN(d) ? "" + date1 : (
						cache[mask] || (cache[mask] = Function("d,a,o,l", "var t;return \"" + dateStr(mask, utc) + "\"")))(
						date1,
						date2,
						offset,
						t
					)
				},
				lo: function(str) {
					return isStr(str) ? str.toLowerCase() : ""
				},
				map: function(input, str, sep, lastSep) {
					var arr = []
					each(input, function(val) {
						arr.push(formatGet(str, val))
					})
					lastSep = lastSep && arr.length > 1 ? lastSep + arr.pop() : ""
					return arr.join(sep || ", ") + lastSep
				},
				num: function(input, format) {
					var t = translations["#"] || {}
					return (
						cache[format = t[format] || "#" + format] || (cache[format] = Function("d", "var N=d<0&&(d=-d),n,r,o;return " + numStr(format, t)))
					)(input)
				},
				pattern: function(str, re) {
					var values = []
					, t = translations["~"] || {}
					, key = replace(str, RegExp(re || t[""] || "[\\d.]+", "g"), function(a) {
						values.push(a)
						return "#"
					})
					return str != key && t[key] ? replace(t[key], /#/g, bind(values.shift, values)) : str
				},
				pick: function(val, word) {
					for (var t = translations["?"] || {}, arr = replace((t[word] || word), /([^;=,]+?)\?/g, "$1=$1;").split(/[;=,]/), i = 1|arr.length; i > 0; ) {
						if ((i-=2) < 0 || arr[i] && (arr[i] == "" + val || +arr[i] <= val)) {
							return arr[i + 1] ? replace(arr[i + 1], "#", val) : ""
						}
					}
				},
				plural: function(n, word, expr) {
					var t = translations["*"] || {}
					return (
						cache[expr = t[""] || "n!=1"] || (cache[expr] = Function("a,n", "return (a[+(" + expr + ")]||a[0]).replace('#',n)"))
					)((t[word] || "# " + word).split(";"), n)
				},
				up: function(str) {
					return isStr(str) ? str.toUpperCase() : ""
				}
			}

			function dateStr(mask, utc) {
				var get = "d.get" + (utc ? "UTC" : "")
				, dateMap = {
					d: "Day()||7",
					M: "Month()+1",
					D: "Date()",
					H: "Hours()",
					h: "Hours()%12||12",
					m: "Minutes()",
					s: "Seconds()",
					S: "Milliseconds()"
				}
				, setA = "a.setTime(+d+((4-(" + get + dateMap.d + "))*864e5))"
				return replace((utc ? mask.slice(4) : mask), dateRe, function(match, MD, single, pad, text, esc) {
					mask = (
						esc            ? replace(replace(escape(esc), /%u/g, "\\u"), /%/g, "\\x") :
						text !== UNDEF ? replace(text, /''/g, "'") :
						MD || match == "dd" ? "l[''][" + get + (MD == "M" ? "Month()+" + (match == "MMM" ? 14 : 26) : "Day()" + (pad ? (pad = "") : "+7")) + "]" :
						match == "u"   ? "(d/1000)>>>0" :
						match == "U"   ? "+d" :
						match == "Q"   ? "((" + get + "Month()/3)|0)+1" :
						match == "a"   ? "l[" + get + dateMap.H + ">11?'pm':'am']" :
						match == "o"   ? setA + ",a" + get.slice(1) + "FullYear()" :
						single == "Y"  ? get + "FullYear()" + (pad == "Y" ? "%100" : "") :
						single == "Z"  ? "(t=o)?(t<0?((t=-t),'-'):'+')+(t<600?'0':'')+(0|(t/60))" + (pad ? (pad = "") : "+':'") + "+((t%=60)>9?t:'0'+t):'Z'" :
						single == "w"  ? "Math.ceil(((" + setA + "-a.s" + get.slice(3) + "Month(0,1))/864e5+1)/7)" :
						get + dateMap[single || match]
					)
					return text !== UNDEF || esc ? mask : "\"+(" + (
						match == "SS" ? "(t=" + mask + ")>9?t>99?t:'0'+t:'00'+t" :
						pad ? "(t=" + mask + ")>9?t:'0'+t" :
						mask
					) + ")+\""
				})
			}

			function numStr(format, t) {
				// format;NaN;negFormat;0;Infinity;-Infinity;roundPoint
				// 🯰🯱🯲🯳🯴🯵🯶🯷🯸🯹
				var conf = format.split(";")
				, nan_value = conf[1] || "-"
				, o = (t.ordinal||"").split(";")
				, pre = {
					a: "(o+=d<1e3?'':d<1e6?(d/=1e3,'k'):d<1e9?(d/=1e6,'M'):d<1e12?(d/=1e9,'G'):d<1e15?(d/=1e12,'T'):d<1e18?(d/=1e15,'P'):(d/=1e18,'E')),"
				}
				, post = {
					o: "r+(o=" + JSON.stringify(o.slice(0,-1)) + "," + o.pop() + ")"
				}
				, m2 = /([^\d#]*)([\d# .,_·']*\/?\d+)(?:(\s*)([a-z%]+)(\d*))?(.*)/.exec(conf[0])
				, m3 = /([.,\/])(\d*)$/.exec(m2[2])
				, decimals = m3 && m3[2].length || 0
				, full = m3 ? m2[2].slice(0, m3.index) : m2[2]
				, num = replace(full, /\D+/g, "")
				, sLen = num.length
				, step = decimals ? +(m3[1] === "/" ? 1 / m3[2] : num + "." + m3[2]) : num
				, decSep = m3 && m3[1]
				, fn = "d===Infinity?(N?" + quote(conf[5]||nan_value) + ":" + quote(conf[4]||nan_value) + "):d>0||d===0?(o=" + quote(m2[3]) + "," + (pre[m2[4]] || "") + "n=" + (
					// Use exponential notation to fix float rounding
					// Math.round(1.005*100)/100 = 1 instead of 1.01
					decimals ?
					"d>1e-" + (decimals + 1) + "?(n=(d+'e" + decimals + "')/" + (step + "e" + decimals) + "":
					"d>"+num+"e-1?(n=d/" + num
				) + ",Math.floor(n" + (
					conf[6] == 1 ? "%1?n+1:n" : "+" + (conf[6] || 0.5)
				) + ")*" + step + "):0,r=" + (
					m2[5] ? "(''+(+n.toPrecision(" + (m2[5]) + ")))" :
					decimals ? "n.toFixed(" + decimals + ")" :
					"n+''"
				)

				if (decimals) {
					if (decSep == "/") {
						fn += ".replace(/\\.\\d+/,'" + (
							m3[2] == 5 ?
							"⅕⅖⅗⅘'.charAt(5" :
							"⅛¼⅜½⅝¾⅞'.charAt(8"
						) + "*(n%1)-1))"
					} else if (decSep != ".") {
						fn += ".replace('.','" + decSep + "')"
					}
					if (sLen === 0) {
						fn += ",n<1&&(r=r.slice(1)||'0')"
					}
				}
				if (sLen > 1) {
					if (decimals) sLen += decimals + 1
					fn += ",r=(r.length<" + sLen + "?(1e15+r).slice(-" + sLen + "):r)"
				}

				if ((num = full.match(/[^\d#][\d#]+/g))) {
					fn += ",r=" + numJunk(num.length - 1, 0, decimals ? decimals + 1 : 0)
				}

				fn += (
					(m2[4] ? ",r=" + (post[m2[4]] || "r+o") : "") +
					// negative format
					",N&&n>0?" + replace(quote(conf[2] || "-#"), "#", "'+r+'") + ":" +
					(conf[3] ? "n===0?" + quote(conf[3]) + ":" : "") +
					(m2[1] ? quote(m2[1]) + "+r" : "r") +
					(m2[6] ? "+" + quote(m2[6]) : "")
				)

				return fn + "):" + quote(nan_value)

				function numJunk(i, lastLen, dec) {
					var len = lastLen + num[i].length - 1

					return "(n<1e" + len + (
						lastLen ? "?r.slice(0,-" + (lastLen + dec) + "):" : "?r:"
					) + (
						len < 16 ? numJunk(i?i-1:i, len, dec) : "r.slice(0,-" + (lastLen + dec) + ")"
					) + "+" + quote(num[i].charAt(0)) + "+r.slice(-" + (len + dec) + (
						lastLen ? ",-" + (lastLen + dec) : ""
					) + "))"
				}
			}

			function formatGet(str, data) {
				return format(iGet(translations, str, str || ""), data, getExt)
			}
			function getExt(obj, str) {
				var fn = cache[str] || (cache[str] = (replace(replace(str, /;\s*([#*?@~])(.*)/, function(_, op, arg) {
					return ";" + iAlias[op] + " " + quote(arg)
				}), renderRe, function(_, name, op, args) {
					fn = (_ === name) ? name : "$el." + name + "(" + fn + (args ? "," + args : "") + ")"
				}), fn === str ? str : makeFn(fn, fn)))
				return str == "$" ? obj : isStr(fn) ? iGet(obj, str, "") : isFn(fn) ? fn(iExt, obj, translations) : ""
			}
		})
		;[localStorage.lang, opts.lang, navigator.language].concat(navigator.languages, html.lang, $d.locales = Object.keys(iFormat))
		.find(View.lang = function(lang, translations) {
			if (lang && (iFormat[lang = ("" + lang).toLowerCase()] || iFormat[lang = lang.split("-")[0]])) {
				assignDeep(iFormat[html.lang = $d.lang = localStorage.lang = lang].t, translations)
				return ($d._ = iFormat[lang])
			}
		})
		function format(str, data, getter) {
			return replace(str, formatRe, function(all, path) {
				return getter(data, path, "")
			})
		}
		function iGet(obj, path, fallback) {
			return isStr(path) ? (
				isStr(obj[path]) ? obj[path] :
				(path = path.split("."))[1] && isObj(obj = obj[path[0]]) && isStr(obj[path[1]]) ? obj[path[1]] :
				fallback
			) :
			isArr(path) ? iGet(obj, path[0]) || iGet(obj, path[1]) || iGet(obj, path[2], fallback) :
			fallback
		}
		/*/
		globalScope._ = String
		/**/

		return View
	}

	function setUrl(url, rep, checkUrl) {
		/*** pushState ***/
		if (pushBase) {
			history[rep ? "replaceState" : "pushState"](NUL, NUL, pushBase + url)
		} else {
		/**/
			location[rep ? "replace" : "assign"]("#" + url)
		/*** pushState ***/
		}
		/**/
		if (checkUrl) checkUrl()
	}

	LiteJS.go = setUrl
	LiteJS.start = histStart
	function histStart(cb) {
		/*** pushState ***/
		// Chrome5, Firefox4, IE10, Safari5, Opera11.50
		var histLast
		, baseEl = find(html, "base")
		, url = getUrl()
		if (baseEl && history.pushState) {
			pushBase = replace(baseEl.href, /.*:\/\/[^/]*|[^\/]*$/g, "")

			if (url && !getUrl()) {
				setUrl(url, 1)
			}

			// Chrome and Safari emit a popstate event on page load, Firefox doesn't.
			// Firing popstate after onload is as designed.
			//
			// See the discussion on https://bugs.webkit.org/show_bug.cgi?id=41372,
			// https://code.google.com/p/chromium/issues/detail?id=63040
			// and the change to the HTML5 spec that was made:
			// http://html5.org/tools/web-apps-tracker?from=5345&to=5346.
			window.onpopstate = checkUrl
		} else
		/**/
			window.onhashchange = checkUrl
		readTemplates(checkUrl)
		function checkUrl() {
			if (cb && histLast != (histLast = getUrl())) cb(histLast)
		}
		function getUrl() {
			return replace(
				/*** pushState ***/
				pushBase ? location.pathname.slice(pushBase.length) :
				/**/
				// NOTE: in Firefox location.hash is decoded; in Safari location.pathname is decoded
				location.href.split("#")[1] || "", /^[#\/\!]+|[\s\/]+$/g, "")
		}
	}

	function Comm(name, render) {
		var comm = document.createComment(name)
		if (render) comm.render = render
		return comm
	}
	function El(name) {
		var attr
		, attrs = {}
		, el = replace(name, selectorRe, function(_, op, key, fn, val, quotation) {
			attr = 1
			val = quotation ? val.slice(1, -1) : val || key
			attrs[op =
				op === "." ?
				(fn = "~", "class") :
				op === "#" ?
				"id" :
				key
			] = fn && attrs[op] ?
				fn === "^" ? val + attrs[op] :
				attrs[op] + (fn === "~" ? " " : "") + val :
				val
			return ""
		}) || "div"

		// NOTE: IE-s cloneNode consolidates the two text nodes together as one
		// http://brooknovak.wordpress.com/2009/08/23/ies-clonenode-doesnt-actually-clone/
		el = (elCache[el] || (elCache[el] = document.createElement(el))).cloneNode(true)

		if (attr) {
			for (attr in attrs) setAttr(el, attr, attrs[attr])
		}

		return el
	}
	function ElWrap(nodes, clone) {
		for (var wrap = [], i = nodes.length; i--; ) {
			wrap[i] = clone ? nodes[i].cloneNode(clone) : nodes[i]
		}
		return assign(wrap, elArr)
	}

	assign(El, bindings, {
		emit: emit,
		empty: elEmpty,
		kill: elKill,
		off: acceptMany(rmEvent),
		one: acceptMany(function(el, ev, fn) {
			function remove() {
				rmEvent(el, ev, fn)
				rmEvent(el, ev, remove)
			}
			addEvent(el, ev, fn)
			addEvent(el, ev, remove)
		}),
		render: render,
		rm: elRm
	})

	each(El, function(fn, key) {
		elArr[key] = function() {
			var arr = this
			, i = 0
			, len = arr.length
			, arg = slice.call(arguments)
			arg.unshift(1)
			for (; i < len; ) {
				arg[0] = arr[i++]
				fn.apply(El, arg)
			}
			return arr
		}
	})

	assign(El, {
		$b: assign(bindings, {
			each: function(el, name, list) {
				/*** debug ***/
				if (el._li) throw "Binding each must be type of once: each!" + name
				/**/

				var comm = Comm("each " + name, up)
				, pos = 0
				, nodes = []

				comm.$s = this
				elReplace(el, comm)
				each(list, add)
				return { a: add, u: up }

				function add(item) {
					var clone = nodes[pos] = el.cloneNode(true)
					, subScope = elScope(clone, comm)
					append(comm.parentNode, clone, (pos ? nodes[pos - 1] : comm).nextSibling)
					subScope.$i = pos++
					subScope.$len = list.length
					subScope[name] = item
					clone[BIND_ATTR] = el[BIND_ATTR]
					/*** debug ***/
					clone._li = up
					/**/
					render(clone)
				}
				function up() {
					for (var i = list.length; pos > i; ) elKill(nodes[--pos])
					for (nodes.length = i; pos < i; ) add(list[pos])
					for (; i--; ) nodes[i].$s[name] = list[i]
				}
			},
			el: function(el, tag, fallback) {
				tag = elCache[tag] ? tag : fallback
				if (el._el !== tag) {
					var child = El(tag)
					, tmp = child._elb = el._el ? el._elb : el[BIND_ATTR]
					if (tmp) appendBind(child, tmp, ";", "^")
					child.$s = el.$s
					child._el = tag
					elReplace(el, child)
					if ((tmp = child._elc = el._el ? (elKill(el), el._elc) : el.className)) cls(child, tmp)
					render(child)
					return true
				}
			},
			"if": function(el, enabled) {
				if (enabled) {
					elReplace(el._r, el)
				} else {
					elReplace(el, el._r || (el._r = Comm("if", bind(render, el, el, this))))
					return true
				}
			},
			is: function(el, val, opts, prefix) {
				if (!prefix) prefix = "is-"
				var match = elScope(el)._.ext.pick(val, opts)
				cls(el, el[prefix + opts], 0)
				cls(el, el[prefix + opts] = match && prefix + match)
			},
			name: function(el, name) {
				setAttr(el, "name", expand(name, 1))
			},
			ref: function(el, name) {
				this[name] = el
			},
			$s: function(el) {
				var scope = elScope(el, el)
				each(slice.call(arguments, 1), function(args) {
					each(args, function(arg, i) {
						if (isStr(i)) scope[i] = arg
						else scope[arg] = setAttr(el, arg, "")
					})
				})
			},
			view: function(el, url) {
				setAttr(el, "href", (pushBase || "#") + expand(url || ""))
			}
		}),
		$d: globalScope,
		append: append,
		asEmitter: asEmitter,
		blur: blur,
		cache: elCache,
		closest: closest,
		get: getAttr,
		hasClass: hasClass,
		matches: matches,
		nearest: nearest,
		rate: rate,
		replace: elReplace,
		scope: elScope,
		scrollLeft: scrollLeft,
		scrollTop: scrollTop,
		step: step,
		stop: eventStop
	})

	function setAttr(el, key, val) {
		var current = getAttr(el, key)

		/*** ie8 ***/
		// NOTE: IE5-7 doesn't set styles and removes events when you try to set them.
		// IE6 label with a for attribute will re-select the first option of SELECT list instead of just giving focus.
		// http://webbugtrack.blogspot.com/2007/09/bug-116-for-attribute-woes-in-ie6.html
		// IE8 and below have a bug where changed 'name' not accepted on form submit
		/* c8 ignore next 3 */
		if (ie678 && (key === "id" || key === "name" || key === "checked" || key === "style")) {
			el.mergeAttributes(document.createElement("<INPUT " + key + "='" + val + "'>"), false)
		} else
		/**/
		if (key === "class") {
			cls(el, val)
		} else if (val || val === 0) {
			if (current != val) {
				el.setAttribute(key, val)
			}
		} else if (current) {
			el.removeAttribute(key)
		}
		return current
	}

	function append(el, child, before) {
		if (!el.nodeType) {
			if (el.append) el.append(child, before)
			return
		}
		var next, tmp
		, i = 0
		if (child) {
			if (isStr(child) || isNum(child)) child = document.createTextNode(child)
			else if (!child.nodeType && (i = child.length)) {
				for (tmp = document.createDocumentFragment(); i--; ) append(tmp, child[i], 0)
				child = tmp
			}

			if (child.nodeType) {
				if ((i = setAttr(child, "slot", "") || getAttr(el, "data-slot"))) {
					i = "slot" + i
					for (tmp = el.firstChild; tmp; tmp = next) {
						if (tmp.nodeType === 8 && tmp.nodeValue === i) {
							el = tmp
							break
						}
						for (next = tmp.firstChild || tmp.nextSibling; !next && tmp !== el; next = tmp.nextSibling) {
							tmp = tmp.parentNode
						}
					}
				}
				if (el.nodeType === 8) {
					before = el
					el = before.parentNode
				}
				el.insertBefore(child, (
					isNum(before) ? el.childNodes[before < 0 ? el.childNodes.length - before - 2 : before] :
					isArr(before) ? before[0] :
					before
				) || NUL)
				/*** debug ***/
				if (el.namespaceURI && child.namespaceURI && el.namespaceURI !== child.namespaceURI && el.tagName !== "foreignObject" && child.tagName !== "svg") {
					console.error("NAMESPACE CHANGE!", el, child)
				}
				/**/
			}
		}
	}

	function appendBind(el, val, sep, q) {
		var current = getAttr(el, BIND_ATTR)
		setAttr(el, BIND_ATTR, (current ? (
			q === "^" ?
			val + sep + current :
			current + sep + val
		) : val))
	}

	function hasClass(el, name) {
		var current = el.className || ""

		if (!isStr(current)) {
			current = getAttr(el, "class") || ""
		}

		return !!current && current.split(splitRe).indexOf(name) > -1
	}

	function cls(el, name, set) {
		// setAttribute("class") is broken in IE7
		// className is object on SVGElements
		var current = el.className || ""
		, useAttr = !isStr(current)
		, SP = " "

		if (useAttr) {
			current = getAttr(el, "class") || ""
		}

		if (set === UNDEF || set) {
			if (set && set !== el && set.nodeType < 2) cls(set, name, 0)
			if (current) {
				name = current.split(SP).indexOf(name) > -1 ? current : current + SP + name
			}
		} else {
			name = current ? replace(SP + current + SP, SP + name + SP, SP).trim() : current
		}

		if (current != name) {
			if (useAttr) {
				el.setAttribute("class", name)
			} else {
				el.className = name
			}
		}
	}

	function elEmpty(el) {
		for (; el.lastChild; elKill(el.lastChild));
	}
	function elKill(el, tr, delay) {
		if (el) {
			if (delay > 0) return setTimeout(elKill, delay, el, tr)
			if (tr) {
				if (isStr(tr)) cls(el, tr)
				if (isObj(tr)) bindingsCss(el, tr)
				tr = "transitionend"
				// transitionend fires for each property transitioned
				if ("on" + tr in el) return addEvent(el, tr, bind(elKill, el, el, el = UNDEF))
			}
			if (el._e) {
				emit(el, "kill")
				el._e = UNDEF
			}
			elRm(el)
			if (el.nodeType < 2) {
				el.$s = UNDEF
				elKill(el._r) // Replacement element like comment from if binding
				elEmpty(el)
				if (el.valObject !== UNDEF) {
					el.valObject = UNDEF
				}
			} else {
				if (el.kill) el.kill()
			}
		}
	}
	function elScope(el, parent) {
		return el.$s || (
			parent ? ((parent = elScope(parent)), el.$s = assign(create(parent), { $up: parent })) :
			closestScope(el)
		)
	}
	function elTxt(el, txt) {
		if (el[txtAttr] !== txt) el[txtAttr] = txt
	}
	function elVal(el, val) {
		if (!el) return ""
		var input, step, key, value
		, i = 0
		, type = el.type
		, opts = el.options
		, checkbox = type === "checkbox" || type === "radio"

		if (el.tagName === "FORM") {
			// Disabled controls do not receive focus,
			// are skipped in tabbing navigation, cannot be successfully posted.
			//
			// Read-only elements receive focus but cannot be modified by the user,
			// are included in tabbing navigation, are successfully posted.
			//
			// Read-only checkboxes can be changed by the user

			for (opts = {}; (input = el.elements[i++]); ) if (!input.disabled && (key = input.name || input.id)) {
				value = elVal(input, val != UNDEF ? val[key] : UNDEF)
				if (value !== UNDEF) {
					step = opts
					replace(key, /\[(.*?)\]/g, replacer)
					step[key || step.length] = value
				}
			}
			return opts
		}

		if (val !== UNDEF) {
			if (opts) {
				for (value = (isArr(val) ? val : [ val ]).map(String); (input = opts[i++]); ) {
					input.selected = value.indexOf(input.value) > -1
				}
			} else if (el.val) {
				el.val(val)
			} else if (checkbox) {
				el.checked = !!val
			} else {
				el.value = val
			}
			return
		}

		if (opts) {
			if (type === "select-multiple") {
				for (val = []; (input = opts[i++]); ) {
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
		(type === "radio" ? UNDEF : NUL) :
		el.valObject !== UNDEF ? el.valObject : el.value

		function replacer(_, _key, offset) {
			if (step == opts) key = key.slice(0, offset)
			step = step[key] || (step[key] = step[key] === NUL || _key && +_key != _key ? {} : [])
			key = _key
		}
	}

	function closestScope(node) {
		for (; (node = node.parentNode); ) {
			if (node.$s) return node.$s
		}
		return globalScope
	}

	function render(node, $s) {
		if (!node || node.nodeType != 1) {
			if (node && node.render) node.render()
			return
		}

		var el, next
		, scope = node.$s || $s || closestScope(node)

		/*** ie8 ***/
		if (ie678 && node.tagName === "SELECT") {
			node.parentNode.insertBefore(node, node)
		}
		/**/

		if (hydrate(node, BIND_ATTR, scope)) return
		for (el = node.firstChild; el; el = next) {
			next = el.nextSibling
			render(el, scope)
		}
		hydrate(node, "data-out", scope)
	}

	function hydrate(node, attr, scope) {
		var fn
		, expr = node[attr] || (node[attr] = setAttr(node, attr, "") || true)
		if (expr !== true) try {
			fn = fnCache[expr] || (fnCache[expr] = makeFn(expr))
			return fn(node, scope, attr, fn.o)
		} catch (e) {
			throw e + "\n" + attr + ": " + expr
		}
	}
	function makeFn(fn, raw) {
		var i = 0
		, bindOnce = []
		fn = raw || "$s&&(" + replace(fn, renderRe, function(match, name, op, args) {
			return (
				(op === "!" && (bindOnce[i] = match)) ?
				"($el[$a]=$el[$a].replace($o[" + (i++)+ "],''),0)||" :
				""
			) + "$b['" + (bindings[name] ? name + "'].call($s,$el" : "set']($el,'" + name + "'") + (args ? "," + args : "") + ")||"
		}) + "$r)"
		var vars = replace(fn, fnRe, "").match(wordRe) || []
		for (i = vars.length; i--; ) {
			if (vars.indexOf(vars[i]) !== i) vars.splice(i, 1)
			else vars[i] += "=$s." + vars[i]
		}
		fn = Function("$el,$s,$a,$o,$r", (vars[0] ? "var " + vars : "") + ";return " + fn)
		fn.o = bindOnce
		return fn
	}

	/*** kb ***/
	var kbMaps = []
	, kbMod = LiteJS.kbMod = /^(Mac|iP)/.test(navigator.platform) ? "metaKey" : "ctrlKey"
	, kbCodes = LiteJS.kbCodes = ",,,,,,,,backspace,tab,,,,enter,,,shift,ctrl,alt,pause,caps,,,,,,,esc,,,,,,pgup,pgdown,end,home,left,up,right,down,,,,,ins,del,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,cmd,,,,,,,,,,,,,,,,,,,,,f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12".split(splitRe)

	El.addKb = addKb
	El.rmKb = rmKb
	function addKb(map, killEl) {
		if (map) {
			kbMaps.unshift(map)
			if (killEl) {
				addEvent(killEl, "kill", bind(rmKb, map, map))
			}
		}
	}
	function rmKb(map) {
		map = kbMaps.indexOf(map)
		if (map > -1) kbMaps.splice(map, 1)
	}

	addEvent(document, "keydown", function(e) {
		if (kbMaps[0]) {
			var c = e.keyCode || e.which
			, numpad = c > 95 && c < 106
			, code = numpad ? c - 48 : c
			, key = kbCodes[code] || String.fromCharCode(code).toLowerCase() || code

			// Otherwise IE backspace navigates back
			if (code == 8 && kbMaps[0].backspace) {
				eventStop(e)
			}
			runKb(key)
			if (e.shiftKey && code != 16) runKb("shift+" + key)
			// people in Poland use Right-Alt+S to type in Ś.
			// Right-Alt+S is mapped internally to Ctrl+Alt+S.
			// THANKS: Marcin Wichary - disappearing Polish Ś [https://medium.engineering/fa398313d4df]
			if (e.altKey) {
				if (code != 18) runKb("alt+" + key)
			} else if (code != 17) {
				if (e.ctrlKey) runKb("ctrl+" + key)
				if (e[kbMod] && code != 91) runKb("mod+" + key)
			}
		}
		function runKb(chr) {
			for (
				var fn, map
				, i = 0
				, el = e.target
				, input = /INPUT|TEXTAREA|SELECT/i.test((el.nodeType < 2 ? el : el.parentNode).tagName);
				(map = kbMaps[i++]) && !(
					fn = !input || map.input ? map[code] || map[chr] || map.num && code > 47 && code < 58 && (chr|=0, map.num) || map.all : fn
				) && map.bubble; );
			if (isStr(fn)) setUrl(fn)
			if (isFn(fn)) fn(e, chr, el)
		}
	})
	/**/

	/*** touch ***/
	var touchEl, touchDist, touchAngle, touchMode, touchTick
	, START = "start"
	, END = "end"
	, touches = []
	, touchEv = {}

	// tap, swipe + left/right/up/down
	each("pan pinch rotate tap", function(name) {
		fixEv[name] = fixEv[name + START] = fixEv[name + END] = ""
		fixFn[name] = touchInit
	})
	function touchInit(el) {
		if (!el._ti) {
			addEvent(el, "pointerdown", touchDown)
			addEvent(el, "wheel", touchWheel)
			bindingsOn(el, "pointerup pointercancel", touchUp)
			bindingsCss(el, "touchAction msTouchAction", "none")
			el._ti = 1
		}
		function touchDown(e, e2) {
			clearTimeout(touchTick)
			var len = e ? touches.push(e) : touches.length
			, MOVE = "pointermove"
			if (touchMode || len < 1) {
				emit(touchEl, touchMode ? touchMode + END : "tap", e2, touchEv, touchEl)
				touchMode = UNDEF
			}
			if (len < 0) {
				touchEl = UNDEF
			}
			if (len === 1) {
				if (e) {
					touchEl = e.currentTarget || e.target
					touchEv.X = e.clientX
					touchEv.Y = e.clientY
					touchPos("left", "offsetWidth")
					touchPos("top", "offsetHeight")
					if (e.button === 2 || matches(touchEl, "INPUT,TEXTAREA,SELECT,.no-drag")) return
					touchTick = setTimeout(moveOne, 1500, e, 1)
				}
				moveOne(e || touches[0])
			}
			if (len === 2) {
				touchDist = touchAngle = UNDEF
				moveTwo(e)
			}
			;(len === 1 ? addEvent : rmEvent)(document, MOVE, moveOne)
			;(len === 2 ? addEvent : rmEvent)(document, MOVE, moveTwo)
			function touchPos(name, offset) {
				var val = (
					touchEl.getBBox ?
					touchEl.getAttributeNS(NUL, name == "top" ? "y":"x") :
					touchEl.style[name]
				)
				touchEv[name] = parseInt(val, 10) || 0
				if (val && val.indexOf("%") > -1) {
					touchEv[name] *= touchEl.parentNode[offset] / 100
				}
			}
		}
		function touchUp(e) {
			for (var i = touches.length; i--; ) {
				if (touches[i].pointerId == e.pointerId) {
					touches.splice(i, 1)
					break
				}
			}
			touchDown(UNDEF, e)
		}
		function touchWheel(e) {
			// IE10 enabled pinch-to-zoom gestures from multi-touch trackpad’s as mousewheel event with ctrlKey.
			// Chrome M35 and Firefox 55 followed up.
			if (!touches[0]) {
				var ev = e.ctrlKey ? "pinch" : e.altKey ? "rotate" : UNDEF
				if (ev && emit(e.currentTarget || e.target, ev, e, e.deltaY/20, 0)) {
					return eventStop(e)
				}
			}
		}
		function moveOne(e, fromTimer) {
			// In IE9 mousedown.buttons is OK but mousemove.buttons == 0
			if (touches[0].buttons && touches[0].buttons !== (e.buttons || [0, 1, 4, 2][e.which || 0])) {
				return touchUp(e)
			}
			touchEv.x = e.clientX - touchEv.X
			touchEv.y = e.clientY - touchEv.Y
			touchEv.leftPos = touchEv.x + touchEv.left
			touchEv.topPos  = touchEv.y + touchEv.top
			if (!touchMode) {
				var evs = touchEl._e
				touchMode = (
					haveEv("pan", touchEv.x > 10 || touchEv.x < -10 || touchEv.y > 10 || touchEv.y < -10) ||
					haveEv("hold", fromTimer)
				)
				if (!touchMode) return
				clearTimeout(touchTick)
				emit(touchEl, touchMode + START, e, touchEv, touchEl)
			}
			emit(touchEl, touchMode, e, touchEv, touchEl)
			function haveEv(name, set) {
				return set && (evs[name] || evs[name + START] || evs[name + END]) && name
			}
		}
		function moveTwo(e) {
			touches[ touches[0].pointerId == e.pointerId ? 0 : 1] = e
			var diff
			, x = touchEv.X - touches[1].clientX
			, y = touchEv.Y - touches[1].clientY
			, dist = Math.sqrt(x*x + y*y) | 0
			, angle = Math.atan2(y, x)

			if (touchDist !== UNDEF) {
				diff = dist - touchDist
				if (diff) emit(touchEl, "pinch", e, diff, angle)
				// GestureEvent onGestureChange: function(e) {
				//	e.target.style.transform =
				//		'scale(' + e.scale  + startScale  + ') rotate(' + e.rotation + startRotation + 'deg)'
				diff = angle - touchAngle
				if (diff) emit(touchEl, "rotate", e, diff * (180/Math.PI))
			}
			touchDist = dist
			touchAngle = angle
		}
	}
	/**/

	function closest(el, sel) {
		return el && html.closest.call(el.nodeType < 2 ? el : el.parentNode, sel)
	}
	function find(root, sel, startNode) {
		return html.querySelector.call(startNode || root, sel)
	}
	function findAll(root, sel, startNode) {
		return ElWrap(html.querySelectorAll.call(startNode || root, sel))
	}
	function matches(el, sel) {
		return el && html.matches.call(el, sel)
	}
	function nearest(el, sel) {
		return el ? find(el, sel) || nearest(el.parentNode, sel) : NUL
	}
	function acceptMany(fn, prepareVal) {
		return function f(el, name, val, selector, delay, data) {
			if (el && name) {
				var i = arguments.length
				if (i > 3 && i < 6) {
					if (isArr(selector)) {
						data = selector
						delay = selector = UNDEF
					} else if (isNum(selector)) {
						data = delay
						delay = selector
						selector = UNDEF
					}
				}
				if (delay > 0) {
					setTimeout(f, delay, el, name, val, selector, 0, data)
					return
				}
				if (isObj(name)) {
					for (delay in name) if (hasOwn(name, delay)) {
						f(el, delay, name[delay], selector, 0, data)
					}
					return
				}
				if (prepareVal) val = prepareVal(el, val, selector, data)
				selector = !prepareVal && selector ? findAll(el, selector) : isArr(el) ? el : [ el ]
				var arr = ("" + name).split(splitRe), len = arr.length
				for (delay = 0; (el = selector[delay++]); ) {
					for (i = 0; i < len; ) {
						if (arr[i]) fn(el, arr[i++], isArr(val) ? val[i - 1] : val)
					}
				}
			}
		}
	}
	function assignDeep(target, map) {
		if (map) for (var k in map) if (hasOwn(map, k)) {
			if (isObj(map[k]) && isObj(target[k]) && hasOwn(target, k)) assignDeep(target[k], map[k])
			else target[k] = map[k]
		}
		return target
	}
	function blur() {
		// IE8 can throw on accessing document.activeElement.
		try {
			document.activeElement.blur()
		} catch(e) {}
	}
	function camelFn(_, a) {
		return a.toUpperCase()
	}
	function each(arr, fn, scope, key) {
		if (arr) {
			if (isStr(arr)) arr = arr.split(splitRe)
			if (isArr(arr)) arr.forEach(fn, scope)
			else for (key in arr) if (hasOwn(arr, key)) fn.call(scope, arr[key], key, arr)
		}
	}
	function expand(str, ns) {
		var first = str.charAt(0)
		, rest = str.slice(1)
		, lastExp = expand[ns]
		return (
			first === "+" ? lastExp + rest :
			first === "%" ? ((first = lastExp.lastIndexOf(rest.charAt(0))), (first > 0 ? lastExp.slice(0, first) : lastExp)) + rest :
			(expand[ns] = str)
		)
	}
	function injectCss(cssText) {
		if (!styleNode) {
			// Safari and IE6-8 requires dynamically created
			// <style> elements to be inserted into the <head>
			append(find(html, "head"), styleNode = El("style"))
		}
		if (styleNode.styleSheet) styleNode.styleSheet.cssText += cssText
		else append(styleNode, cssText)
	}
	function isFn(fn) {
		// old WebKit returns "function" for HTML collections
		return typeof fn === "function"
	}
	function isNum(num) {
		return typeof num === "number"
	}
	function isObj(obj) {
		return !!obj && obj.constructor === Object
	}
	function isStr(str) {
		return typeof str === "string"
	}
	function quote(str) {
		return "'" + replace(replace(str || "", /'/g, "\\'"), /\n/g, "\\n") + "'"
	}
	// Maximum call rate for Function with optional leading edge and trailing edge
	function rate(fn, ms, onStart, onEnd) {
		var tick
		, next = 0
		onStart = isFn(onStart) ? onStart : (onStart === tick || onStart) && fn
		onEnd = isFn(onEnd) ? onEnd : (onEnd === tick || onEnd) && fn
		return function() {
			var now = Date.now()
			clearTimeout(tick)
			if (now >= next) {
				if (next < 1) {
					if (onStart) onStart()
				} else fn()
				next = now + ms
			}
			if (onEnd) {
				tick = setTimeout(onEnd, next - now)
			}
		}
	}
	function scrollLeft() {
		return window.pageXOffset || html.scrollLeft || body.scrollLeft || 0
	}
	function scrollTop() {
		return window.pageYOffset || html.scrollTop || body.scrollTop || 0
	}
	function step(num, factor, mid) {
		var x = ("" + factor).split(".")
		, steps = num / factor
		, n = ~~(steps + ((steps < 0 ? -1 : 1) * (mid == UNDEF ? 0.5 : mid === 1 && steps == (steps|0) ? 0 : +mid))) * factor
		return "" + (1 in x ? n.toFixed(x[1].length) : n)
	}

	function readTemplates(next) {
		xhr.load(findAll(html, "script[type=ui]").map(function(el) {
			// IE6 script.innerText is empty
			sources.push(el.innerHTML)
			elKill(el)
			return el.src
		}), function(res) {
			res = res.concat(sources, next && next.src && next.innerHTML).filter(Boolean)
			if (res[sources.length = 0]) {
				if (!parser) LiteJS.ui = LiteJS()
				each(res, parser)
			}
			if (isFn(next)) next()
		}, 1)
	}
	readTemplates(findAll(html, "script").pop())
}(this, document, history, localStorage, location, navigator, Function, Object) // jshint ignore:line

