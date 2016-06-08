
!function(SVGElement, document, bindings) {
	var ns = "http://www.w3.org/2000/svg"
	, xlinkNs = "http://www.w3.org/1999/xlink"
	, svg = document.createElementNS && document.createElementNS(ns, "svg").createSVGRect
	, proto = SVGElement && SVGElement.prototype // From IE9

	if (!svg || !proto) {
		return
	}

	"svg circle clipPath defs g path rect text stop use linearGradient".replace(/\w+/g, c)
	//http://stackoverflow.com/questions/5736398/how-to-calculate-the-svg-path-for-an-arc-of-a-circle
	function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
		var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0
		return { x: centerX + (radius * Math.cos(angleInRadians)),
		   y: centerY + (radius * Math.sin(angleInRadians)) }
	}
	function describeArc(x, y, radius, startAngle, endAngle) {
		var start = polarToCartesian(x, y, radius, endAngle)
		, end = polarToCartesian(x, y, radius, startAngle)
		, arcSweep = endAngle - startAngle <= 180 ? "0" : "1"
		, d = [
			"M", start.x, start.y,
			"A", radius, radius, 0, arcSweep, 0, end.x, end.y
		].join(" ")
		return d
	}
	bindings.arc = function(x, y, radius, startAngle, endAngle) {
		// var length = path.getTotalLength();
		this.setAttribute("d", describeArc(x, y, radius, 3.6*startAngle, 3.6*endAngle))
	}
	bindings.xlink = function(href) {
		// https://gist.github.com/leonderijke/c5cf7c5b2e424c0061d2
		this.setAttributeNS(xlinkNs, "xlink:href", href)
	}
	bindings.xlink.once=1

	function c(name) {
		El.cache[name] = document.createElementNS(ns, name)
		El.cache["svg|"+name] = document.createElementNS(ns, name)
	}
}(this.SVGElement, document, El.bindings)

