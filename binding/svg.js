
/* litejs.com/MIT-LICENSE.txt */


/* global El */
!function(SVGElement, document, bindings) {
	var xlinkNs = "http://www.w3.org/1999/xlink"


	//http://stackoverflow.com/questions/5736398/how-to-calculate-the-svg-path-for-an-arc-of-a-circle
	function polarToCartesian(centerX, centerY, radius, angle/*InDegrees*/) {
		angle/*InRadians*/ = (angle - 90) * Math.PI / 180.0
		return {
			x: centerX + (radius * Math.cos(angle)),
			y: centerY + (radius * Math.sin(angle))
		}
	}
	function describeArc(x, y, radius, startAngle, endAngle) {
		var start = polarToCartesian(x, y, radius, endAngle)
		, end = polarToCartesian(x, y, radius, startAngle)
		, arcSweep = endAngle - startAngle <= 180 ? 0 : 1
		, d = [
			"M", start.x, start.y,
			"A", radius, radius, 0, arcSweep, 0, end.x, end.y
		].join(" ")
		return d
	}
	bindings.arc = function(el, startAngle, endAngle, radius, x, y) {
		var center = (y && x && radius) || el.viewportElement.viewBox.baseVal.width >> 1
		// var length = path.getTotalLength();
		el.setAttribute("d", describeArc(
			x || center,
			y || center,
			radius || center,
			3.6 * startAngle,
			3.6 * endAngle
		))
	}
	bindings.xlink = function(el, href) {
		// https://gist.github.com/leonderijke/c5cf7c5b2e424c0061d2
		el.setAttributeNS(xlinkNs, "xlink:href", href)
	}
	bindings.xlink.once=1

	function drawLine(node) {
		var length = node.getTotalLength()
		node.style.transition = node.style.WebkitTransition = "none"
		node.style.strokeDasharray = length + " " + length
		node.style.strokeDashoffset = length
		// Trigger a layout so styles are calculated & the browser
		// picks up the starting position before animating
		node.getBoundingClientRect()
		node.style.transition = node.style.WebkitTransition = "stroke-dashoffset 5s ease .5s"
		node.style.strokeDashoffset = "0"
	}
	var arch1 = "a? ? 0 1 0 ? -?".split("?")
	, arch2 = "a? ? 0 1 0 ? ?".split("?")
	bindings.svgLine = function(el, points, opts) {
		opts = opts || {}
		var i = 0
		, dataPoints = []
		, radius = opts.radius || 0
		, d = ["M" + (100 - radius), points[0]]
		if (radius) {
			d.push(arch1.join(radius), arch2.join(radius))
		}

		for (; ++i < points.length; ) {
			if (opts.smooth) {
				d.push("C" + (i * 100 + 50 - radius), points[i-1] + "," + (i * 100 + 50 + radius), points[i] + "," + (i * 100 + 100 - radius), points[i])
			} else {
				d.push("L" + (i * 100 + 100 - radius), points[i])
			}
			if (radius) {
				d.push(arch1.join(radius), arch2.join(radius))
			}
			//dataPoints.push(El("circle[r=3][cx=" + (i * 100 + 100) + "][cy=" + points[i] + "]"))
		}
		el.setAttribute("d", d.join(" "))
		drawLine(el)
		el.parentNode.append(dataPoints)
	}
	var svgToLastActive
	bindings.initChart = function(el) {
		El.on(el, "mouseout", function(e) {
			if (svgToLastActive && e.target == el) {
				El.cls(svgToLastActive, "is-active", svgToLastActive = null)
			}
		})
	}
	// riseOnHover
	bindings.svgToLast = function(el) {
		El.on(el, "mouseover", function() {
			if (!svgToLastActive || el != el.parentNode.lastChild) {
				El.cls(svgToLastActive, "line-active", 0)
				El.append(el.parentNode, el)
				El.cls(el, "is-active", svgToLastActive = el)
			}
		})
	}
	bindings.svgToLast.once =
	bindings.initChart.once = 1
}(this.SVGElement, document, El.bindings) // jshint ignore:line

