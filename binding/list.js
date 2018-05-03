
El.bindings.list = function(node, list, extra, val) {
	var child = node._child
	, data = this
	, extraLen = 0

	if (!child) {
		child = node._child = node.removeChild(node.firstChild)
	}

	if (!list || node._list == list) return

	if (node._list) clear()

	node._list = data.list = list

	El.on(node, "kill", clear)

	El.addClass(node, "loading")

	if (extra) {
		extra.each(clone)
		extraLen = extra.length
	}

	list
	.each(clone)
	.on("add", clone).on("remove", remove)
	.then(function() {
		if (val !== void 0) {
			if (!this.get(val)) {
				clone({id:val,name:val}, extraLen)
				extraLen++
			}
			El.val(node, val)
		}
		El.rmClass(node, "loading")
	})

	// Do not render childs when list initialized
	return true

	function clone(item, pos) {
		var clone = child.cloneNode(true)
		, scope = El.scope(clone, data)
		scope.item = item.data || item
		scope.model = item
		scope.pos = pos
		function up() {
			El.render(clone, scope)
		}
		if (item.on) {
			item.on("change", up)
			El.on(clone, "kill", function(){
				item.off("change", up)
			})
		}
		El.append(node, clone, extraLen + pos)
		return El.render(clone, scope)
	}

	function remove(item, pos) {
		El.kill(node.childNodes[extraLen + pos])
	}

	function clear() {
		var list = node._list
		El.empty(node)
		if (list) {
			node._list = null
			list.off("add", clone).off("remove", remove)
		}
	}
}

