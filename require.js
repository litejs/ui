

!function(window) {
	var modules = {}
	, process = window.process = {
		env: {}
	}

	//process.memoryUsage = function() {
	//	return (window.performance || {}).memory || {}
	//}

	window.require = require
	function require(name) {
		var mod = modules[name]
		if (!mod) throw Error("Module not found: " + name)
		if (typeof mod == "string") {
			var exports = modules[name] = {}
			, module = { id: name, filename: name, exports: exports }
			Function("exports,require,module,process,global", mod).call(
				exports, exports, require, module, process, window
			)
			mod = modules[name] = module.exports
		}
		return mod
	}

	require.def = function(map, key) {
		for (key in map) modules[key] = map[key]
	}
}(this) // jshint ignore:line


