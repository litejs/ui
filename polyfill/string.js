
/* litejs.com/MIT-LICENSE.txt */



!function(exports) {
	var Str = exports.String || exports
	, Str$ = Str.prototype || exports
	, fromCharCode = String.fromCharCode

	if (!Str$.startsWith) Str$.startsWith = function(str) {
		return this.lastIndexOf(str, 0) === 0
	}

	if (!Str$.endsWith) Str$.endsWith = function(str) {
		return this.indexOf(str, this.length - str.length) > -1
	}

	if (!Str$.codePointAt) Str$.codePointAt = function(pos) {
		var str = this
		, code = str.charCodeAt(pos)

		return code >= 0xD800 && code <= 0xDBFF &&
		(str = str.charCodeAt(pos + 1)) >= 0xDC00 && str <= 0xDFFF ?
		(code - 0xD800) * 0x400 + str - 0xDC00 + 0x10000 :
		code === code ? code :
		void 0
	}

	// function fromCodePoint(i) { return unescape("%u"+i.toString(16)) }
	// function fromCodePoint(i) { return unescape("%u"+ (i>0xFFFF?(0xD800+((i-65536)>>10)).toString(16)+"%u"+((i&0x3ff)+0xDC00).toString(16):i.toString(16))) }

	if (!Str.fromCodePoint) Str.fromCodePoint = function() {
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
				str += fromCharCode.apply(null, out)
				out.length = 0
			}
		}

		return str
	}

	if (!exports.TextEncoder) {
		exports.TextEncoder = exports.TextDecoder = TextEncoder
	}

	// Only utf-8 TextEncoder is supported by spec
	function TextEncoder(encoding) {
		this.encoding = encoding || "utf-8"
	}
	TextEncoder.prototype = {
		encode: function(str) {
			var s = unescape(encodeURIComponent(str))
			, len = s.length
			, arr = new Uint8Array(len)
			for (; len--; ) {
				arr[len] = s.charCodeAt(len)
			}
			return arr
		},
		decode: function(arr) {
			var i, out
			, map = TextEncoder[this.encoding]
			if (map) {
				// Single-byte codec
				out = []
				for (i = arr.length; i--; ) {
					out[i] = (
						arr[i] > 127 ?
						map.charCodeAt(arr[i] - 128) :
						arr[i]
					)
				}
				return fromCharCode.apply(null, out)
			}
			return decodeURIComponent(escape(fromCharCode.apply(null, arr)))
		}
	}
}(this)

