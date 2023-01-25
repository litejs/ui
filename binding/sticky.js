
// .sticky { position: sticky; top: -1px; }
// .sticky.is-stuck { color: red; }

/* global El */
El.bindings.sticky = function sticky(el) {
	;(sticky._ob || (sticky._ob = new IntersectionObserver(function(entries) {
		entries.forEach(function(entry) {
			El.cls(entry.target, "is-stuck", entry.intersectionRatio < 1)
		})
	}, { threshold: 1 }))).observe(el)
	El.cls(el, "sticky")
}

El.bindings.sticky.once = 1


