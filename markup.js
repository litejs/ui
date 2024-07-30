
!function(exports) {
	// Extracted from ui.js to be usable outside

	var replace = function(a, b, c) {
		return a.replace(b, c)
	}
	, isArr = Array.isArray

	/*** markup ***/
	, blockRe = /^(?:(=+|>| -) ([\s\S]+)|\[! *(\S*) *!] ?(.*))/
	, tags = {
		" -": "ul",
		"!": "a",
		"*": "b",
		"+": "ins",
		",": "sub",
		"-": "del",
		"/": "i",
		":": "mark",
		";": "span",
		">": "blockquote",
		"@": "time",
		"^": "sup",
		"_": "u",
		"`": "code",
		"~": "s"
	}
	function inline(tag, op, text, name, link, attr) {
		return op && !isArr(text) ? "<" +
			(tag = tags[op] || "h" + op.length) +
			(tag == "a" ? " href=\"" + (link || text) + "\"" : op == "@" ? " datetime=\"" + name + "\"" : "") +
			(attr ? " class=\"" + attr.slice(1) + "\">" : ">") +
			(
				op === ">" ? doc(replace(text, /^> ?/gm, "")) :
				tag == "ul" ? "<li>" + text.split(/\n - (?=\S)/).map(inline).join("</li>\n<li>") + "</li>" :
				inline(tag == "a" ? replace(name, /^\w+:\/{0,2}/, "") : text)
			) +
			"</" + tag + ">" :
		replace(tag, /{([-!*+,/:;@^_`~])((.+?)(?: (\S+?))?)\1(\.[.\w]+)?}/g, inline)
	}
	function block(tag, op, text, media, alt) {
		return op && !isArr(text) ? inline(tag, op, text) :
		media ? "<img src=\"" + media + "\" alt=\"" + alt + "\">" :
		blockRe.test(tag) ? replace(tag, blockRe, block) :
		tag === "---" ? "<hr>" : "<p>" + inline(tag) + "</p>"
	}
	function doc(txt) {
		return replace(txt.trim(), /^ \b/gm, "<br>").split(/\n\n+/).map(block).join("\n")
	}
	/**/

	exports.inline = inline
	exports.doc = doc
}(this) // jshint ignore:line

