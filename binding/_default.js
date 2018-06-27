


!function(bindings) {
	var hasOwn = Object.prototype.hasOwnProperty
	, slice = Array.prototype.slice

	bindingFn.once =
	bindingOn.once =
	emitForm.once =
	bindingsEach.raw = bindingsEach.once =
	true

	bindings.fn = bindingFn
	function bindingFn(el, fn) {
		return fn.apply(el, slice.call(arguments, 3))
	}

	bindings["if"] = bindingIf
	function bindingIf(el, enabled) {
		var parent = el.parentNode
		, scope = this
		if (enabled) {
			parent || el._ifComm && el._ifComm.parentNode.replaceChild(el, el._ifComm)
		} else {
			if (parent) {
				if (!el._ifComm) {
					El.on(el, "kill", El.kill.bind(el, el._ifComm = document.createComment("if")))
					el._ifComm.render = function() {
						El.render(el, scope)
					}
				}
				parent.replaceChild(el._ifComm, el)
			}
			return true
		}
	}

	bindings.on = bindingOn
	function bindingOn(el, ev, fn, a1, a2, a3, a4, a5) {
		El.on(el, ev, typeof fn == "string" ? function(e) {
			View.emit(fn, e, el, a1, a2, a3, a4, a5)
		} : fn)
	}

	bindings.emitForm = emitForm
	function emitForm(el, ev, a1, a2, a3, a4) {
		El.on(el, "submit", function(e) {
			var data = El.val(el)
			View.emit(ev, e, data, a1, a2, a3, a4)
			return Event.stop(e)
		})
	}

	function getChilds(node) {
		var child
		, childs = node._childs
		if (!childs) {
			for (node._childs = childs = []; child = node.firstChild;) {
				childs.push(child);
				node.removeChild(child)
			}
		}
		return childs
	}

	bindings.each = bindingsEach

	function bindingsEach(el, expr) {
		var node = el
		, child = getChilds(node)[0]
		, match = /^\s*(\w+) in (\w*)(.*)/.exec(expr)
		, fn = "with(data){var out=[],loop={i:0,offset:0},_1,_2=" + match[2]
		+ match[3].replace(/ (limit|offset):\s*(\d+)/ig, ";loop.$1=$2")
		+ ";if(_2)for(_1 in _2)if(hasOwn.call(_2,_1)&&!(loop.offset&&loop.offset--)){"
		+     "loop.i++;"
		+     "if(loop.limit&&loop.i-loop.offset>loop.limit)break;"
		+     "var clone=el.cloneNode(true)"
		+     ",scope=El.scope(clone,data);"
		+     "scope.loopKey=loop.key=_1;"
		+     "scope.loop=loop;"
		+     "scope." + match[1] + "=_2[_1];"
		+     "out.push(clone);"
		+ "};return out}"

		var childs = Function("hasOwn,el,data", fn)(hasOwn, child, this)

		El.append(El.empty(node), childs)
		El.render(node)
		return node
	}

	bindings.focus = function(el) {
		el.focus()
	}

	bindings.href = function(el, url) {
		if (url) {
			var chr = url.charAt(0)
			el.href = chr === "+" || chr === "%" ? "#" + View.url(url) : url
		}
	}
}(El.bindings)

