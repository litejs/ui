
!function(exports) {
	var proto = exports.prototype || exports
	if (!proto.codePointAt) proto.codePointAt = function(pos) {
		var str = this
		, code = str.charCodeAt(pos)

		return code >= 0xD800 && code <= 0xDBFF &&
		(str = str.charCodeAt(pos + 1)) >= 0xDC00 && str <= 0xDFFF ?
		(code - 0xD800) * 0x400 + str - 0xDC00 + 0x10000 :
		code === code ? code :
		void 0
	}
	exports.fromCodePoint = function() {
		var code
		, arr = arguments
		, len = arr.length
		, pos = 0
		, out = []
		, str = ""

		for (; pos < len; ) {
			code = arr[pos++]
			if (code <= 0xFFFF) {
				out.push(code)
			} else {
				code -= 0x10000
				out.push(
					(code >> 10) + 0xD800,
					(code % 0x400) + 0xDC00
				)
			}
			if (len === pos || out.length > 8191) {
				str += String.fromCharCode.apply(null, out)
				out.length = 0
			}
		}

		return str
	}
}(this.String || this)

