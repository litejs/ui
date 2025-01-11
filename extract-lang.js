
!function(exports) {
	exports.extractLang = extractLang

	function extractLang(translations, lang) {
		var missing = []
		, out = extract(translations, "")
		if (missing[0]) {
			console.error("WARNING! Missing '%s' translations: %s [%s]", lang, missing.length, missing+"")
		}
		return out

		function extract(map, path) {
			var key
			, out = {}
			, translations = map.translations
			if (!translations) return map[lang]
			for (key in translations) {
				out[key] = extract(translations[key], path + key + ".")
				if (
					out[key] === key ||
					out[key] === void 0 && missing.push(path + key) ||
					isObject(out[key]) && Object.keys(out[key]).length < 1
				) delete out[key]
			}
			return out
		}
		function isObject(obj) {
			return obj && obj.constructor === Object
		}
	}
}(this) // jshint ignore:line

