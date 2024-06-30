
/* litejs.com/MIT-LICENSE.txt */

/* global xhr, navigator */

/*** debug ***/
console.log("LiteJS is in debug mode, but it's fine for production")
/**/

!function(window, document, history, localStorage, location, navigator, Function, Object) {
	window.El = El
	window.LiteJS = LiteJS

	var UNDEF, lastExp, parser, styleNode
	, html = document.documentElement
	, body = document.body
	, histBase, histCb, histLast
	, splitRe = /[,\s]+/
	, emptyArr = []
	, assign = Object.assign
	, create = Object.create
	, isArr = Array.isArray
	, slice = emptyArr.slice

	// JScript engine in IE8 and below does not recognize vertical tabulation character `\v`.
	// http://webreflection.blogspot.com/2009/01/32-bytes-to-know-if-your-browser-is-ie.html
	, ie678 = !+"\v1" // jshint ignore:line
	// The documentMode is an IE only property, supported in IE8 and up.
	, ie67 = ie678 && (document.documentMode | 0) < 8 // jshint ignore:line

	, BIND_ATTR = "data-bind"
	, elSeq = 0
	, elCache = {}
	, formatRe = /{((?:("|')(?:\\\2|[\s\S])*?\2|[^"'{}])+?)}/g
	, renderRe = /[;\s]*([-\w$]+)(?:([ :!])((?:(["'\/])(?:\\.|[^\\])*?\4|[^;])*))?/g
	, selectorRe = /([.#:[])([-\w]+)(?:([~^$*|]?)=(("|')(?:\\.|[^\\])*?\5|[-\w]+))?]?/g
	, templateRe = /([ \t]*)(%?)((?:("|')(?:\\.|[^\\])*?\4|[-\w:.#[\]~^$*|]=?)*) ?([\/>+=@^;]|)(([\])}]?).*?([[({]?))(?=\x1f|\n|$)+/g
	, fnCache = {}
	, fnRe = /('|")(?:\\.|[^\\])*?\1|\/(?:\\.|[^\\])+?\/[gim]*|\$el\b|\$[as]\b|\b(?:false|in|if|new|null|this|true|typeof|void|function|var|else|return)\b|\.\w+|\w+:/g
	, wordRe = /[a-z_$][\w$]*/ig
	, camelRe = /\-([a-z])/g
	// innerText is implemented in IE4, textContent in IE9, Node.text in Opera 9-10
	// Safari 2.x innerText results an empty string when style.display=="none" or Node is not in DOM
	, txtAttr = "textContent" in html ? "textContent" : "innerText"
	, bindingsCss = acceptMany(function(el, key, val) {
		el.style[key.replace(camelRe, camelFn)] = "" + val
	})
	, bindingsOn = acceptMany(addEvent, function(el, selector, data, handler) {
		return isStr(handler) ? function(e) {
			var target = selector ? closest(e.target, selector) : el
			if (target) emit.apply(elScope(el).$ui, [handler, e, target].concat(data))
		} :
		selector ? function(e) {
			if (matches(e.target, selector)) handler(e)
		} :
		handler
	})
	, bindings = {
		cls: acceptMany(cls),
		css: bindingsCss,
		on: bindingsOn,
		set: acceptMany(setAttr),
		txt: elTxt,
		val: elVal,
		view: function(el, url) {
			setAttr(el, "href", (histBase || "#") + expand(url || ""))
		}
	}
	, globalScope = {
		El: El,
		_: format,
		_f: format,
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
	, plugins = {}
	, sources = []
	, hasOwn = plugins.hasOwnProperty

	// After iOS 13 iPad with default enabled "desktop" option
	// is the only Macintosh with multi-touch
	, iOS = /^(Mac|iP)/.test(navigator.platform)
	// || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

	, Event = window.Event || window
	, fixEv = Event.fixEv || (Event.fixEv = {})
	, fixFn = Event.fixFn || (Event.fixFn = {})

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

	Event.asEmitter = asEmitter
	Event.stop = eventStop

	if (iOS) {
		// iOS doesn't support beforeunload, use pagehide instead
		fixEv.beforeunload = "pagehide"
	}


	xhr.css = injectCss
	xhr.ui = sources.push.bind(sources)

	function asEmitter(obj) {
		obj.on = on
		obj.off = off
		obj.one = one
		obj.emit = emit
		// emitNext, emitLate
	}

	function on(type, fn, scope, _origin) {
		var emitter = this === window ? emptyArr : this
		, events = emitter._e || (emitter._e = create(null))
		if (type && fn) {
			if (isStr(fn)) fn = emit.bind(emitter, fn)
			emit.call(emitter, "newListener", type, fn, scope, _origin)
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
					emit.call(emitter, "removeListener", type, args[2], args[0], args[1])
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

	function emit(type) {
		var args, i
		, emitter = this === window ? emptyArr : this
		, _e = emitter._e
		, arr = _e ? (_e[type] || emptyArr).concat(_e["*"] || emptyArr) : emptyArr
		if ((_e = arr.length)) {
			for (i = _e - 1, args = slice.call(arguments, 1); i > 1; i -= 3) {
				if (arr[i]) arr[i].apply(arr[i - 2] || emitter, args)
			}
		}
		return _e / 3
	}

	function addEvent(el, ev, fn) {
		var fn2 = fixFn[ev] && fixFn[ev](el, fn, ev) || fn
		, ev2 = fixEv[ev] || ev

		if (ev2 !== "" && "on" + ev2 in el) {
			// polyfilled addEventListener returns patched function
			// Since Chrome 56 touchstart/move have the { passive: true } by default.
			// preventDefault() won't work unless you set passive to false.
			fn2 = html.addEventListener.call(el, ev2, fn2, false) || fn2
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
			base: "",
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
				reStr += "|(" + route.replace(routeRe, function(_, expr) {
					return expr ?
						(fnStr += "p['" + expr + "']=m[" + (routeSeq++) + "],") && "([^/]+?)" :
						_.replace(reEsc, "\\$&")
				}) + ")"
				fnStr += "'" + route + "'):"
				viewFn = 0
			}
		}

		asEmitter(View)
		asEmitter(View.prototype = {
			show: function(_params) {
				var parent
				, params = lastParams = _params || {} // jshint ignore:line
				, view = lastView = this // jshint ignore:line
				, tmp = params._v || view // Continue bubbleUp from _v
				, close = view.o && view

				for (View.route = view.r; tmp; tmp = parent) {
					viewEmit(syncResume = params._v = tmp, "ping", params, View)
					syncResume = null
					if (lastParams !== params) return
					if ((parent = tmp.p)) {
						if (parent.c && parent.c !== tmp) {
							close = parent.c
						}
						parent.c = tmp
					}
					if (!tmp.e) {
						if (tmp.f) {
							xhr.load(
								tmp.f.replace(/^|,/g, "$&" + (View.base || "")).split(","),
								readTemplates.bind(view, view.wait(tmp.f = null))
							)
						} else {
							if (tmp.r === "404") {
								viewParse("%view 404 #\nh2 Not found")
							}
							View("404").show({origin:params})
						}
						return
					}
				}

				for (tmp in params) {
					if (tmp.charAt(0) !== "_" && (syncResume = hasOwn.call(paramCb, tmp) && paramCb[tmp] || paramCb["*"])) {
						syncResume.call(view, params[tmp], tmp, params, View)
						syncResume = null
					}
				}
				viewEmit(view, "nav")
				bubbleDown(params, close)
			},
			wait: function() {
				var params = lastParams
				params._p = 1 + (params._p | 0) // pending
				return function() {
					if (--params._p || lastParams !== params || syncResume) return
					if (params._d) {
						bubbleDown(params)
					} else if (params._v) {
						lastView.show(params)
					}
				}
			}
		})

		var root = opts.root
		, viewFn, lastView, lastUrl, syncResume
		, fnStr = ""
		, reStr = ""
		, reEsc = /[.*+?^${}()|[\]/\\]/g
		, routeRe = /\{([\w%.]+?)\}|.[^{\\]*?/g
		, routeSeq = 1

		, views = View.views = {}
		, paramCb = {}
		, lastParams = paramCb
		, $d = elScope(View("#", root).e, root)

		$d.$ui = assign(View, {
			$: find.bind(View, root),
			$$: findAll.bind(View, root),
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

		function appendBind(el, val, sep, q) {
			var current = getAttr(el, BIND_ATTR)
			setAttr(el, BIND_ATTR, (current ? (
				q === "^" ?
				val + sep + current :
				current + sep + val
			) : val))
		}
		function bubbleDown(params, close) {
			var view = params._v
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
				addKb(view.kb)
				close = null
			}
			if ((params._d = params._v = view.c)) {
				bubbleDown(params, close)
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
				view.o = null
				rmKb(view.kb)
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
			view.emit(event, a, b)
			View.emit(event, view, a, b)
		}
		function viewEval(str, scope) {
			try {
				Function("$s,$ui,$d,$,$$", str)(scope, View, $d, View.$, View.$$)
			} catch(e) {
				logErr(e, "viewEval: " + str)
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
						if (op === ">" || op === "+") {
							(indent + (op === "+" ? text : " " + text)).replace(templateRe, work)
						} else if (op === "=") {
							append(parent, text) // + "\n")
						} else {
							if (op === "@") {
								text = text.replace(/([\w,]+):?/, "on!'$1',")
							} else if (op === "") {
								text = "txt _('" + text.replace(/'/g, "\\'") + "',$s)"
							}
							appendBind(parent, text, ";", op)
						}
					}
				}
			}
			str.replace(templateRe, work)
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
		function viewShow(url, _params) {
			if (url === true) {
				if (lastParams._p > 0) return
				url = lastUrl
				lastUrl = 0
			}
			var params = _params || {}
			, view = viewGet(url, params)
			if (!view.o || lastUrl !== url) {
				globalScope.url = lastExp = lastUrl = url
				view.show(globalScope.params = params)
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
			if (proto.r) proto.d = Function("p", "p.r(p.o||p.t)")
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
			el.p = plugin.e = plugin.u = null
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
			r: function(params) {
				var txt = this.t
				each(params, function(param) {
					viewParse(txt.replace(/{key}/g, param))
				})
			}
		})
		addPlugin("el", {
			c: 1,
			d: function(plugin) {
				var parent = plugin.u
				, el = usePluginContent(plugin)
				elCache[plugin.n] = el
				return parent
			}
		})
		plugins.svg = plugins.el
		addPlugin("map", {
			r: function() {
				var plugin = this
				, txt = plugin.o + plugin.t
				appendBind(plugin.u, plugin.s ? txt.slice(1) : txt, plugin.s)
			}
		})
		addPlugin("view", {
			c: 1,
			d: function(plugin) {
				var bind = getAttr(plugin.e, BIND_ATTR)
				, view = View(plugin.n, usePluginContent(plugin), plugin.x)
				if (bind) {
					bind = bind.replace(renderRe, function(_, name, op, args) {
						return "($s." + name + (isFn(view[name]) ? "(" + (args || "") + ")" : "=" + args) + "),"
					}) + "1"
					viewEval(bind, view)
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

			View.emit("resize")
		}, 99)

		if (breakpoints) {
			setBreakpointsRated()
			bindingsOn(window, "orientationchange resize", setBreakpointsRated)
		}
		/**/

		/*** i18n ***/
		var iData = {}
		, iFormat = create(null)
		, iGlobals = assignDeep(create(null), opts.locales)
		each(iGlobals, function(translations, iKey) {
			translations = iData[iKey] = assignDeep(create(iGlobals), opts[iKey])
			iFormat[iKey] = function(str, data) {
				return format(get(translations, str, str || ""), data)
			}
		})
		assignDeep(iGlobals, opts.globals)
		iSet([localStorage.lang, navigator.language, navigator.userLanguage].concat(navigator.languages, opts.lang).find(iResolve))
		$d.locales = Object.keys(iFormat)
		View.lang = iSet
		function iResolve(lang) {
			return lang && (iFormat[lang = ("" + lang).toLowerCase()] || iFormat[lang = lang.split("-")[0]]) && lang
		}
		function iSet(lang, translations) {
			assignDeep(iData[lang = html.lang = $d.lang = localStorage.lang = iResolve(lang) || $d.lang || opts.lang], translations)
			return ($d._ = iFormat[lang] || format)
		}
		/**/

		return View
	}

	function getUrl() {
		return (
			/*** pushState ***/
			histBase ? location.pathname.slice(histBase.length) :
			/**/
			// bug in Firefox where location.hash is decoded
			// bug in Safari where location.pathname is decoded
			location.href.split("#")[1] || ""
		).replace(/^[#\/\!]+|[\s\/]+$/g, "")
	}
	function setUrl(url, replace) {
		/*** pushState ***/
		if (histBase) {
			history[replace ? "replaceState" : "pushState"](null, null, histBase + url)
		} else {
		/**/
			location[replace ? "replace" : "assign"]("#" + url)
		/*** pushState ***/
		}
		/**/
		return checkUrl()
	}
	function checkUrl() {
		if (histLast != (histLast = getUrl())) {
			if (histCb) histCb(histLast)
			return true
		}
	}

	LiteJS.go = setUrl
	LiteJS.start = histStart
	function histStart(cb) {
		histCb = cb
		/*** pushState ***/
		// Chrome5, Firefox4, IE10, Safari5, Opera11.50
		var url
		, base = find(html, "base")
		LiteJS.base = (base || location).href.replace(/[^\/]*(#.*)?$/, "")
		if (base) base = base.href.replace(/.*:\/\/[^/]*|[^\/]*$/g, "")
		if (base && !history.pushState) {
			url = location.pathname.slice(base.length)
			if (url) {
				location.replace(base + "#" + url)
			}
		}
		if (base && history.pushState) {
			histBase = base

			url = location.href.split("#")[1]
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
	}


	function Comm(name, render) {
		var comm = document.createComment(name)
		if (render) comm.render = render
		return comm
	}
	function El(name) {
		var attr
		, attrs = {}
		, el = name.replace(selectorRe, function(_, op, key, fn, val, quotation) {
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
		emit: elEmit,
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
		append: append,
		$b: assign(bindings, {
			each: function(el, name, list) {
				var comm = Comm("each " + name, up)
				, pos = 0
				, nodes = []
				comm.$s = this
				elReplace(el, comm)
				up()
				return { a: add, r: remove, u: up }

				function add(item) {
					var clone = nodes[pos] = el.cloneNode(true)
					, subScope = elScope(clone, comm)
					subScope.$i = pos++
					subScope.$len = list.length
					subScope[name] = item
					clone[BIND_ATTR] = el[BIND_ATTR]
					append(comm.parentNode, clone, comm)
					render(clone, subScope)
				}
				function remove(i) {
					elKill(nodes.splice(i, 1)[0])
				}
				function up() {
					for (; pos; ) remove(--pos)
					each(list, add)
				}
			},
			el: function(el, tag, fallback) {
				var child = El(elCache[tag] ? tag : fallback)
				, tmp = getAttr(el, BIND_ATTR)
				, tmp2 = getAttr(child, BIND_ATTR)
				if (tmp) setAttr(child, BIND_ATTR, tmp2 ? tmp + ";" + tmp2 : tmp)
				if ((tmp = el.className)) cls(child, tmp)
				child.$s = el.$s
				elReplace(el, child)
				render(child, this)
				return child
			},
			"if": function(el, enabled) {
				if (enabled) {
					elReplace(el._if, el)
				} else {
					elReplace(el, el._if || (el._if = Comm("if", render.bind(el, el))))
					return true
				}
			},
			is: function(el, val, opts, prefix) {
				if (!prefix) prefix = "is-"
				var match = format(val, opts)
				cls(el, el[prefix + opts], 0)
				cls(el, el[prefix + opts] = match && prefix + match)
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
			}
		}),
		blur: blur,
		cache: elCache,
		closest: closest,
		$d: globalScope,
		get: getAttr,
		hasClass: hasClass,
		matches: matches,
		rate: rate,
		replace: elReplace,
		scope: elScope,
		scrollLeft: scrollLeft,
		scrollTop: scrollTop,
		step: step
	})

	function getAttr(el, key) {
		return el && el.getAttribute && el.getAttribute(key)
	}

	function setAttr(el, key, val) {
		var current = getAttr(el, key)

		/*** ie8 ***/
		// Bug: IE5-7 doesn't set styles and removes events when you try to set them.
		// IE6 label with a for attribute will re-select the first option of SELECT list instead of just giving focus.
		// http://webbugtrack.blogspot.com/2007/09/bug-116-for-attribute-woes-in-ie6.html
		/* c8 ignore next 3 */
		if (ie67 && (key === "id" || key === "name" || key === "checked" || key === "style")) {
			// IE8 and below have a bug where changed 'name' not accepted on form submit
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
				) || null)
				/*** debug ***/
				if (el.namespaceURI && child.namespaceURI && el.namespaceURI !== child.namespaceURI && el.tagName !== "foreignObject" && child.tagName !== "svg") {
					console.error("NAMESPACE CHANGE!", el, child)
				}
				/**/
			}
		}
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

		if (useAttr) {
			current = el.getAttribute("class") || ""
		}

		if (set === UNDEF || set) {
			if (set && set !== el && set.nodeType < 2) cls(set, name, 0)
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

	function elEmit(el) {
		emit.apply(el, slice.call(arguments, 1))
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
				if ("on" + tr in el) return addEvent(el, tr, elKill.bind(el, el, el = null))
			}
			if (el._e) {
				emit.call(el, "kill")
				el._e = UNDEF
			}
			elRm(el)
			el.$s = UNDEF
			if (el.nodeType < 2) {
				elEmpty(el)
				if (el.valObject !== UNDEF) {
					el.valObject = UNDEF
				}
			} else {
				if (el.kill) el.kill()
			}
		}
	}
	function elReplace(oldChild, newChild) {
		var parent = oldChild && oldChild.parentNode
		if (parent && newChild) parent.replaceChild(newChild, oldChild)
	}
	function elRm(el) {
		var parent = el && el.parentNode
		if (parent) parent.removeChild(el)
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
					key.replace(/\[(.*?)\]/g, replacer)
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
		(type === "radio" ? UNDEF : null) :
		el.valObject !== UNDEF ? el.valObject : el.value

		function replacer(_, _key, offset) {
			if (step == opts) key = key.slice(0, offset)
			step = step[key] || (step[key] = step[key] === null || _key && +_key != _key ? {} : [])
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
		if (!node) return
		var bind, next
		, scope = node.$s || $s || closestScope(node)

		if (node.nodeType != 1) {
			if (node.render) node.render(scope)
			return
		}

		/*** ie8 ***/
		if (ie678 && node.tagName === "SELECT") {
			node.parentNode.insertBefore(node, node)
		}
		/**/

		if (hydrate(node, BIND_ATTR, scope)) return
		for (bind = node.firstChild; bind; bind = next) {
			next = bind.nextSibling
			render(bind, scope)
		}
		hydrate(node, "data-out", scope)
	}

	function hydrate(node, attr, scope) {
		var fn
		, bind = node[attr] || (node[attr] = setAttr(node, attr, "") || true)
		if (bind !== true) try {
			fn = fnCache[bind] || (fnCache[bind] = makeFn(bind))
			scope.$o = fn.o
			return fn(node, scope, attr)
		} catch (e) {
			logErr(e, attr + ": " + bind, node)
		}
	}
	function makeFn(fn) {
		var i = 0
		, bindOnce = []
		fn = "$s&&(" + fn.replace(renderRe, function(match, name, op, args) {
			return (
				(op === "!" && (bindOnce[i] = match)) ?
				"($el[$a]=$el[$a].replace($o[" + (i++)+ "],''),0)||" :
				""
			) + "$b['" + (bindings[name] ? name + "'].call($s,$el" : "set']($el,'" + name + "'") + (args ? "," + args.replace(/^\s*(\w+) in /,"'$1',") : "") + ")||"
		}) + "$r)"
		var vars = fn.replace(fnRe, "").match(wordRe) || []
		for (i = vars.length; i--; ) {
			if (vars.indexOf(vars[i]) !== i) vars.splice(i, 1)
			else vars[i] += "=$s." + vars[i]
		}
		fn = Function("$el,$s,$a,$r", "var " + vars + ";return " + fn)
		fn.o = bindOnce
		return fn
	}

	/*** kb ***/
	var kbMaps = []
	, kbMod = LiteJS.kbMod = iOS ? "metaKey" : "ctrlKey"
	, kbCodes = LiteJS.kbCodes = ",,,,,,,,backspace,tab,,,,enter,,,shift,ctrl,alt,pause,caps,,,,,,,esc,,,,,,pgup,pgdown,end,home,left,up,right,down,,,,,ins,del,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,cmd,,,,,,,,,,,,,,,,,,,,,f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12".split(splitRe)

	El.addKb = addKb
	El.rmKb = rmKb
	function addKb(map, killEl) {
		if (map) {
			kbMaps.unshift(map)
			if (killEl) {
				addEvent(killEl, "kill", rmKb.bind(map, map))
			}
		}
	}
	function rmKb(map) {
		map = kbMaps.indexOf(map)
		if (map > -1) kbMaps.splice(map, 1)
	}
	function runKb(e, code, chr) {
		var fn, map
		, i = 0
		, el = e.target || e.srcElement
		, input = /INPUT|TEXTAREA|SELECT/i.test((el.nodeType < 2 ? el : el.parentNode).tagName)

		for (; (map = kbMaps[i++]) && (
			!(fn = !input || map.input ? map[code] || map[chr] || map.num && code > 47 && code < 58 && (chr|=0, map.num) || map.all : fn) &&
			map.bubble
		););
		if (isStr(fn)) setUrl(fn)
		if (isFn(fn)) fn(e, chr, el)
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
			runKb(e, code, key)
			if (e.shiftKey && code != 16) runKb(e, code, "shift+" + key)
			// people in Poland use Right-Alt+S to type in Ś.
			// Right-Alt+S is mapped internally to Ctrl+Alt+S.
			// THANKS: Marcin Wichary - disappearing Polish Ś [https://medium.engineering/fa398313d4df]
			if (e.altKey) {
				if (code != 18) runKb(e, code, "alt+" + key)
			} else if (code != 17) {
				if (e.ctrlKey) runKb(e, code, "ctrl+" + key)
				if (e[kbMod] && code != 91) runKb(e, code, "mod+" + key)
			}
		}
	})
	/**/

	/*** touch ***/
	var touchEl, touchDist, touchAngle, touchMode
	, START = "start"
	, END = "end"
	, MS_WHICH = [0, 1, 4, 2]
	, touches = []
	, touchEv = {}

	// tap, swipe + left/right/up/down
	each("pan pinch rotate", function(name) {
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
	}
	function touchDown(e, e2) {
		var len = e ? touches.push(e) : touches.length
		, MOVE = "pointermove"
		if (touchMode) {
			elEmit(touchEl, touchMode + END, e2, touchEv, touchEl)
			touchMode = UNDEF
		}
		if (len === 0) {
			touchEl = null
		}
		if (len === 1) {
			if (e) {
				touchEl = e.currentTarget || e.target
				if (e.button === 2 || matches(e.target, "INPUT,TEXTAREA,SELECT,.no-drag")) return
			} else {
				e = touches[0]
			}
			touchEv.X = e.clientX
			touchEv.Y = e.clientY
			touchPos("left", "offsetWidth")
			touchPos("top", "offsetHeight")
			moveOne(e)
		}
		if (len === 2) {
			touchDist = touchAngle = null
			moveTwo(e)
		}
		;(len === 1 ? addEvent : rmEvent)(document, MOVE, moveOne)
		;(len === 2 ? addEvent : rmEvent)(document, MOVE, moveTwo)
		return eventStop(e)
		function touchPos(name, offset) {
			var val = (
				touchEl.getBBox ?
				touchEl.getAttributeNS(null, name == "top" ? "y":"x") :
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
		touchDown(null, e)
	}
	function touchWheel(e) {
		// IE10 enabled pinch-to-zoom gestures from multi-touch trackpad’s as mousewheel event with ctrlKey.
		// Chrome M35 and Firefox 55 followed up.
		if (!touches[0]) {
			var ev = e.ctrlKey ? "pinch" : e.altKey ? "rotate" : UNDEF
			if (ev && emit.call(e.currentTarget || e.target, ev, e, e.deltaY/20, 0)) {
				return eventStop(e)
			}
		}
	}
	function moveOne(e) {
		// In IE9 mousedown.buttons is OK but mousemove.buttons == 0
		if (touches[0].buttons && touches[0].buttons !== (e.buttons || MS_WHICH[e.which || 0])) {
			return touchUp(e)
		}
		touchEv.x = e.clientX - touchEv.X
		touchEv.y = e.clientY - touchEv.Y
		touchEv.leftPos = touchEv.x + touchEv.left
		touchEv.topPos  = touchEv.y + touchEv.top
		if (!touchMode) {
			var evs = touchEl._e
			touchMode = (
				evs.pan && (touchEv.x > 10 || touchEv.x < -10 || touchEv.y > 10 || touchEv.y < -10) ? "pan" :
				UNDEF
			)
			if (!touchMode) return
			elEmit(touchEl, touchMode + START, e, touchEv, touchEl)
		}
		elEmit(touchEl, touchMode, e, touchEv, touchEl)
	}
	function moveTwo(e) {
		touches[ touches[0].pointerId == e.pointerId ? 0 : 1] = e
		var diff
		, x = touchEv.X - touches[1].clientX
		, y = touchEv.Y - touches[1].clientY
		, dist = Math.sqrt(x*x + y*y) | 0
		, angle = Math.atan2(y, x)

		if (touchDist !== null) {
			diff = dist - touchDist
			if (diff) elEmit(touchEl, "pinch", e, diff, angle)
			// GestureEvent onGestureChange: function(e) {
			//	e.target.style.transform =
			//		'scale(' + e.scale  + startScale  + ') rotate(' + e.rotation + startRotation + 'deg)'
			diff = angle - touchAngle
			if (diff) elEmit(touchEl, "rotate", e, diff * (180/Math.PI))
		}
		touchDist = dist
		touchAngle = angle
	}
	/**/

	function find(root, sel, startNode) {
		return html.querySelector.call(startNode || root, sel)
	}
	function findAll(root, sel, startNode) {
		return ElWrap(html.querySelectorAll.call(startNode || root, sel))
	}
	function matches(el, sel) {
		return el && html.matches.call(el, sel)
	}
	function closest(el, sel) {
		return el && html.closest.call(el.nodeType < 2 ? el : el.parentNode, sel)
	}
	function acceptMany(fn, prepareVal) {
		return function f(el, names, selector, data, val, delay) {
			if (el && names) {
				var i = arguments.length
				if (i == 3 || i == 4 && isNum(data)) {
					delay = data
					val = selector
					selector = data = null
				} else if (i == 4 || i == 5 && isNum(val)) {
					delay = val
					val = data
					if (isStr(selector)) {
						data = null
					} else {
						data = selector
						selector = null
					}
				}
				if (delay > 0) {
					setTimeout(f, delay, el, names, selector, data, val, 0)
					return
				}
				if (isObj(names)) {
					for (delay in names) if (hasOwn.call(names, delay)) {
						f(el, delay, selector, data, names[delay])
					}
					return
				}
				if (prepareVal) val = prepareVal(el, selector, data, val)
				selector = !prepareVal && selector ? findAll(el, selector) : isArr(el) ? el : [ el ]
				var arr = ("" + names).split(splitRe), len = arr.length
				for (delay = 0; (el = selector[delay++]); )
				for (i = 0; i < len; ) if (arr[i]) fn(el, arr[i++], isArr(val) ? val[i - 1] : val)
			}
		}
	}
	function assignDeep(target, map) {
		if (map) for (var k in map) if (hasOwn.call(map, k)) {
			target[k] = isObj(map[k]) && isObj(target[k]) ? assignDeep(target[k], map[k]) : map[k]
		}
		return target
	}
	function blur() {
		// IE8 can throw on accessing document.activeElement.
		try {
			var el = document.activeElement
			, tag = el.tagName
			if (tag === "A" || tag === "BUTTON") el.blur()
		} catch(e) {}
	}
	function camelFn(_, a) {
		return a.toUpperCase()
	}
	function each(arr, fn, scope, key) {
		if (isStr(arr)) arr = arr.split(splitRe)
		if (isArr(arr)) arr.forEach(fn, scope)
		else if (arr) for (key in arr) if (hasOwn.call(arr, key)) fn.call(scope, arr[key], key, arr)
	}
	function expand(str) {
		var first = str.charAt(0)
		, rest = str.slice(1)
		return (
			first === "+" ? lastExp + rest :
			first === "%" ? ((first = lastExp.lastIndexOf(rest.charAt(0))), (first > 0 ? lastExp.slice(0, first) : lastExp)) + rest :
			(lastExp = str)
		)
	}
	function format(str, data) {
		return str.replace(formatRe, function(all, path) {
			return get(data, path, "")
		})
	}
	function get(obj, path, fallback) {
		return isStr(path) ? (
			obj[path] !== UNDEF ? obj[path] :
			(path = path.split("."))[1] && isObj(obj = obj[path[0]]) && obj[path[1]] !== UNDEF ? obj[path[1]] : fallback
		) :
		isArr(path) ? get(obj, path[0]) || get(obj, path[1]) || get(obj, path[2], fallback) :
		fallback
	}
	function logErr(e, source, node) {
		/*** debug ***/
		console.error(e)
		console.error(source, node)
		/**/
		if (window.onerror) {
			window.onerror(e.message, e.fileName, e.lineNumber)
		}
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
	// Maximum call rate for Function
	// leading edge, trailing edge
	function rate(fn, ms, onStart, onEnd) {
		var tick
		, next = 0
		onStart = isFn(onStart) ? onStart : (onStart === UNDEF || onStart) && fn
		onEnd = isFn(onEnd) ? onEnd : (onEnd === UNDEF || onEnd) && fn
		return function() {
			var now = Date.now()
			clearTimeout(tick)
			if (now >= next) {
				if (next < 1) {
					if (onStart) onStart()
				} else fn()
				next = now + ms
			} else if (onEnd) {
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
			res = res.concat(sources, (next || res).innerHTML).filter(Boolean)
			if (res[sources.length = 0]) {
				if (!parser) LiteJS.ui = LiteJS()
				each(res, parser)
			}
			if (isFn(next)) next()
		}, 1)
	}
	readTemplates(findAll(html, "script").pop())
}(this, document, history, localStorage, location, navigator, Function, Object) // jshint ignore:line

