
/* litejs.com/MIT-LICENSE.txt */

/**
 * Returns a function identical to this function except that
 * it prints its arguments on entry and its return value on exit.
 * This is useful for debugging function-level programs.
 */

Function.prototype.trace = function(name) {
	var fn = this
	, count = 0
	name = name || fn
	return window.console ?
		function() {
			var c = ++count
			console.info('->', name,c, this, arguments)
			var result = fn.apply(this, arguments)
			console.info('<-', name,c, result)
			return result
	} :
	fn
}

xhr._load = xhr.load

xhr.now = +new Date()
xhr.load = function(files, next, raw) {
	if (typeof files == "string") files = [files]
	files = files.map(function(file) {
		return file + "?" + xhr.now
	})
	return xhr._load(files, next, raw)
}
xhr.load.adapter = xhr._load.adapter

El.path = function(node) {
	var parent
	, str = ""

	if (node && node.tagName) {
		parent = node.parentNode


		str = El.path(node.parentNode)
		if (str) str += " > "
		str += node.tagName.toLowerCase()
		if (node.id) str += "#" + node.id
		if (node.className) str += "." + node.className.replace(/\s+/g, ".")

		if (node != parent.firstChild) {
			var count = 0
			for (var n, i = 0, nodes = parent.childNodes; (n = nodes[i++]) != node; ) {
				if (n.tagName == node.tagName) count++
			}
			if (count) {
				str += ":nth-of-type(" + (count + 1) + ")"
			}
		}
	}
	return str
}


function reloadCSS(file, arr) {
	arr = arr || document.styleSheets
	for (var i = 0, el, tmp; tmp = arr[i]; i++) {
		if (tmp.href && tmp.href.indexOf(file) >- 1) {
			console.log("reloadCSS", tmp.href)
			if (el = tmp.ownerNode) {
				tmp = El("link[rel=stylesheet]")
				tmp.href = el.href.replace(/\?+\d+$/,"") + "?" + (+new Date)
				El.on(tmp, "load", function() {
					el.disabled = true
					El.kill(el)
				})
				El.append(el.parentNode, tmp, el)
			} else if (el = tmp.parentStyleSheet) {
				tmp = el.cssRules[i].cssText.replace(/(\?+\d+)?"\)/, "?" + (+new Date) + '")')
				el.insertRule(tmp, i + 1)
				killRule()
			}
			return 2
		}
		tmp = (tmp.styleSheet || tmp).cssRules
		if (tmp && reloadCSS(file, tmp)) return 1
	}
	function killRule() {
		try {
			if (el.cssRules[i + 1].styleSheet.cssRules.length) {
				el.cssRules[i].styleSheet.disabled = true
				el.deleteRule(i)
			} else throw 1
		} catch (e) {
			setTimeout(killRule, 20)
		}
	}
}

function leakedVariables(_ignore) {
	var key
	, hasOwn = Object.prototype.hasOwnProperty
	, vars = []
	, iframe = El("iframe[src='about:blank']")
	, ignore = [ "addEventListener", "removeEventListener", "dispatchEvent" ].concat(_ignore)

	iframe.style.display = "none"
	document.body.appendChild(iframe)

	var clean = iframe.contentWindow || iframe.contentDocument

	for (key in window) if (
		window[key] !== clean &&
		!hasOwn.call(clean, key) &&
		ignore.indexOf(key) === -1
	) vars.push(key)
	document.body.removeChild(iframe)
	return vars
}

/*
El.on(document.body, "click", function(e) {
	var target = e.target || e.srcElement
	, path = El.path(target)
	console.log("click", target.find.call(document.documentElement, path) == target, path)
})
*/

//View.prototype.show = View.prototype.show.trace("View.show")
//View.prototype.ping = View.prototype.ping.trace("View.ping")
//View.prototype.emit = View.prototype.emit.trace("View.emit")
//View.prototype.close = View.prototype.close.trace("View.close")

