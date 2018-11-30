
!function(exports, Array) {
	var k, t
	, typed = [
		"Int8Array", "Uint8Array",
		"Int16Array", "Uint16Array",
		"Int32Array", "Uint32Array",
		"Float32Array", "Float64Array"
	]
	, i = typed.length
	, proto = Array.prototype

	for (; i--; ) {
		if (t = exports[typed[i]]) {
			for (k in Array) if (!t[k]) {
				t[k] = Array[k]
			}
			t = t.prototype
			for (k in proto) if (!t[k]) {
				t[k] = proto[k]
			}
		} else {
			exports[typed[i]] = Array
		}
	}
}(this, Array)

