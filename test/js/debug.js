
/**
 * Returns a function identical to this function except that
 * it prints its arguments on entry and its return value on exit.
 * This is useful for debugging function-level programs.
 */

Function.prototype.trace = function(name) {
	var fn = this
	, count = 0
	name = name || fn
	return "console" in window ?
		function() {
			var c = ++count
			console.info('->', name,c, this, arguments)
			var result = fn.apply(this, arguments)
			console.info('<-', name,c, result)
			return result
	} :
	fn
}


View.prototype.show = View.prototype.show.trace("View.show")
View.prototype.ping = View.prototype.ping.trace("View.ping")
View.prototype.emit = View.prototype.emit.trace("View.emit")
View.prototype.close = View.prototype.close.trace("View.close")

