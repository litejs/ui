
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

/*
document.body.on("click", function(e) {
	var target = e.target || e.srcElement
	, path = El.path(target)
	console.log("click", target.find.call(document.documentElement, path) == target, path)
})
*/

//View.prototype.show = View.prototype.show.trace("View.show")
//View.prototype.ping = View.prototype.ping.trace("View.ping")
//View.prototype.emit = View.prototype.emit.trace("View.emit")
//View.prototype.close = View.prototype.close.trace("View.close")

