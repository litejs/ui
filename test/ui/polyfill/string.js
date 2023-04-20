
it("ui/polyfill/string", function(assert) {
	var textEncoder
	, fn = require("../../../polyfill/string.js")

	assert.equal(fn.startsWith.call("aaa", "ab"), false)
	assert.equal(fn.startsWith.call("aba", "ab"), true)
	assert.equal(fn.endsWith.call("aaa", "ba"), false)
	assert.equal(fn.endsWith.call("aba", "ba"), true)

	assert.equal(fn.codePointAt.call("𝌆𝌆", 0), 119558)
	assert.equal(fn.codePointAt.call("𝌆𝌆", 1), 57094)

	assert.equal(fn.fromCodePoint(119558), "𝌆")

	textEncoder = new fn.TextEncoder("utf-8")
	assertEnc("äoõ", [195, 164, 111, 195, 181])

	defineEnc(
		["cp1250", "windows-1250", "x-cp1250"],
		"€�‚�„…†‡�‰Š‹ŚŤŽŹ�‘’“”•–—�™š›śťžź ˇ˘Ł¤Ą¦§¨©Ş«¬­®Ż°±˛ł´µ¶·¸ąş»Ľ˝ľżŔÁÂĂÄĹĆÇČÉĘËĚÍÎĎĐŃŇÓÔŐÖ×ŘŮÚŰÜÝŢßŕáâăäĺćçčéęëěíîďđńňóôőö÷řůúűüýţ˙"
	)

	defineEnc(
		["cp1251", "windows-1251", "x-cp1251"],
		"ЂЃ‚ѓ„…†‡€‰Љ‹ЊЌЋЏђ‘’“”•–—™љ›њќћџ ЎўЈ¤Ґ¦§Ё©Є«¬­®Ї°±Ііґµ¶·ё№є»јЅѕїАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя"
	)

	defineEnc(
		["ansi_x3.4-1968", "ascii", "cp1252", "cp819", "csisolatin1", "ibm819", "iso-8859-1", "iso-ir-100", "iso8859-1", "iso88591", "iso_8859-1", "iso_8859-1:1987", "l1", "latin1", "us-ascii", "windows-1252", "x-cp1252"],
		"€�‚ƒ„…†‡ˆ‰Š‹Œ�Ž��‘’“”•–—˜™š›œ�žŸ ¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ"
	)

	textEncoder = new fn.TextEncoder("windows-1251")
	assertEnc("Привет, мир!", [207, 240, 232, 226, 229, 242, 44, 32, 236, 232, 240, 33])

	assert.end()

	function defineEnc(labels, map) {
		for (var i = labels.length; i--; ) {
			fn.TextEncoder[labels[i]] = map
		}
	}

	function assertEnc(str, arr) {
		var u = Uint8Array.from(arr)
		if (textEncoder.encoding === "utf-8") {
			assert.equal(textEncoder.encode(str), u, "TextEncoder " + str)
		}
		assert.equal(textEncoder.decode(u), str, "TextDecoder " + str)
	}
})

