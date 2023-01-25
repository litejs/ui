
/* litejs.com/MIT-LICENSE.txt */



!function(exports) {
	// base64url in RFC 4648 replaces '+' and '/' with '-' and '_',
	// so that using URL encoders/decoders is no longer needed

	if (!exports.atob) {
		// abcdefghijklmnopqrstuvwxyz234567
		// ybndrfg8ejkmcpqxot1uwisza345h769

		for (
			var i = 64,
			ba = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split(""),
			bm = {"=":0};
			(bm[ba[--i]] = i);
		);

		// base64_encode
		exports.btoa = function(s) {
			for (var b, out=[], i=0, len=s.length; i < len; ) {
				b = s.charCodeAt(i++)<<16 | s.charCodeAt(i++)<<8 | s.charCodeAt(i++)
				out.push(ba[b>>18&0x3f], ba[b>>12&0x3f], ba[b>>6&0x3f], ba[b&0x3f])
			}
			if ((len %= 3)) out.splice((len - 3), 2, len == 1 ? "==" : "=")
			return out.join("")
		}

		// base64_decode
		exports.atob = function(s) {
			s = s.split("")
			for (var b, out=[], i=0, len=s.length; i < len; ) {
				b = bm[s[i++]]<<18 | bm[s[i++]]<<12 | bm[s[i++]]<<6 | bm[s[i++]]
				out.push(b>>16 & 0xff, b>>8 & 0xff, b & 0xff)
			}
			if (s[len-1] == "=") out.length -= s[len-2] == "=" ? 2 : 1
			return String.fromCharCode.apply(null, out)
		}
	}
}(this) /* jshint -W030 */

