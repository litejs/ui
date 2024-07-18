
!function(exports) {
	exports.markup = markup
	function replace(a, b, c) {
		return a.replace(b, c)
	}
	var replaceIf = Function("a,b,c", "return b.test(a)&&a.replace(b,c)")

	function markup(txt) {
		var data = {
			version: "24.6",
			date: "2024-07-23"
		}
		, varRe = /^:(\w+):\s*(.*?)$/gm
		, tagMap = {
			"*": "b",
			"+": "ins",
			",": "sub",
			"- ": "li",
			"-": "del",
			".": "",
			"/": "i",
			":": "i",
			"=": "mark",
			"[": "a",
			"^": "sup",
			"_": "u",
			"`": "code",
			"~": "s"
		}
		function headFn(tag, op, text, offset, paragpaph) {
			for (; (tag = varRe.exec(paragpaph)); ) data[tag[1]] = tag[2]
			tag = ("h" + op.length) + ">"
			return "<" + (
				tag + paraFn(text)
			) + "</" + tag
		}
		function blockFn(tag, op, text, offset, paragpaph) {
			var attr=""
			text = replace(text, /\s*\{\.([ .\w]+)}$/m, function(a,m) {
				attr += " class='" + m + "'"
				return ""
			})

			tag = ("blockquote")
			return "<" + (
				tag + attr + ">" + docFn(replace(text, /^> ?/gm, ""))
			) + "</" + tag + ">"
		}
		function tagFn(tag, op, text, link) {
			tag = (tagMap[op] || "h" + op.length) + ">"
			return op === ":" ? paraFn(data[text]||"") : "<" + (
				op == "[" ?
				"a href='" + link + "'>" + paraFn(text || link.replace(/\w+:\/{0,2}/, "")) :
				tag + paraFn(text)
			) + "</" + tag
		}
		function paraFn(paragpaph) {
			return paragpaph === "---" ? "<hr>" :
				replaceIf(paragpaph, /^(={1,6}) (\S.*?)$/m, headFn) ||
				replaceIf(paragpaph, /^(> )([\s\S]*)/, blockFn) ||
				replaceIf(paragpaph, /^ ?(- )(.+)$/gm, tagFn) ||
				replaceIf(paragpaph, /(\[)(?:(.+) )?(\S+?)]/g, tagFn) ||
				replaceIf(paragpaph, /{([-*+,/:=^_`~])(.*?)\1}/g, tagFn) ||
				replace(paragpaph, /{\\/g, "{")
		}
		function docFn(txt) {
			txt = replace(txt.trim(), /^ \b/gm, "<br>").split(/\n\n+/).map(paraFn).filter(Boolean)
			return txt[1] ? txt.map(function(s){
				return s[0] !== "<" ? "<p>" + s + "</p>" : s
			}).join("\n") : txt[0]
		}
		return docFn(replace(txt, /</g, "&lt;"))
	}

}(this.El || this)
