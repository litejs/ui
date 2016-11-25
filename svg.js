


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
		var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0
		return {
			x: centerX + (radius * Math.cos(angleInRadians)),
			y: centerY + (radius * Math.sin(angleInRadians))
		}
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
	bindings.arc = function(startAngle, endAngle, radius, x, y) {
		var center = (y && x && radius) || this.viewportElement.viewBox.baseVal.width >> 1
		// var length = path.getTotalLength();
		this.setAttribute("d", describeArc(
			x || center,
			y || center,
			radius || center,
			3.6 * startAngle,
			3.6 * endAngle
		))
	}
	bindings.xlink = function(href) {
		// https://gist.github.com/leonderijke/c5cf7c5b2e424c0061d2
		this.setAttributeNS(xlinkNs, "xlink:href", href)
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
	bindings.svgLine = function(points, opts) {
		opts = opts || {}
		var i = 0
		, dataPoints = []
		, radius = opts.radius || 0
		, d = ["M" + (100 - radius), points[0]]
		if (radius) {
			d.push(arch1.join(radius), arch2.join(radius))
		}

		for (; ++i < points.length; ) {
			d.push("C" + (i * 100 + 50 - radius), points[i-1] + "," + (i * 100 + 50 + radius), points[i] + "," + (i * 100 + 100 - radius), points[i])
			//d.push("C" + (i * 100 + 50), points[i-1] + "," + (i * 100 + 50), points[i] + "," + (i * 100 + 100 - radius), points[i])
			if (radius) {
				d.push(arch1.join(radius), arch2.join(radius))
			}
			//dataPoints.push(El("circle[r=3][cx=" + (i * 100 + 100) + "][cy=" + points[i] + "]"))
		}
		this.setAttribute("d", d.join(" "))
		drawLine(this)
		this.parentNode.append(dataPoints)
	}
	var svgToLastActive
	bindings.initChart = function() {
		var node = this
		node.on("mouseout", function(e) {
			if (svgToLastActive && e.target == node) {
				svgToLastActive.rmClass("is-active")
				svgToLastActive = null
			}
		})
	}
	// riseOnHover
	bindings.svgToLast = function() {
		var node = this
		node.on("mouseover", function() {
			if (!svgToLastActive || node != node.parentNode.lastChild) {
				if (svgToLastActive) svgToLastActive.rmClass("line-active")
				node.after(node.parentNode.lastChild)
				node.addClass("is-active")
				svgToLastActive = node
			}
		})
	}
	bindings.svgToLast.once =
	bindings.initChart.once = 1
	function c(name) {
		El.cache[name] = document.createElementNS(ns, name)
		El.cache["svg|"+name] = document.createElementNS(ns, name)
	}
}(this.SVGElement, document, El.bindings)

