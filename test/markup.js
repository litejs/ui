

describe("markup.js", function() {
	var inline = require("../markup.js").inline
	, doc = require("../markup.js").doc
	, fs = require("fs")
	, path = require("path")
	require("@litejs/cli/snapshot.js")

	it ("resolves inline tag", function(assert) {
		var tagMap = {
			" -": "ul",
			"!": "a",
			"*": "b",
			"+": "ins",
			",": "sub",
			"-": "del",
			"/": "i",
			":": "mark",
			";": "span",
			"=": "h1",
			">": "blockquote",
			"^": "sup",
			"_": "u",
			"`": "code",
			"~": "s"
		}
		, tags = "b,ins,sub,del,s,i,mark,span,ul,a,blockquote,sup,u,code".split(",")
		, charCodes = Object.keys(tagMap).map(c=>c.charCodeAt())
		console.log("charCodes: " + charCodes)

		function getTag(op, tag) {
			return tags[(tag = op.charCodeAt())-(tag==61?0:tag>120?122:tag>93?83:tag>47?52:tag>41?42:24)] || "h" + op.length
		}

		assert.equal(Object.keys(tagMap).map(getTag), Object.values(tagMap))
		assert.end()
	})

	it ("should render inline markup: {0}", [
		[ "*Hello* world", "*Hello* world" ],
		[ "{*Hello*} {/world/}", "<b>Hello</b> <i>world</i>" ],
		[ "{~Hello~} {-world-}{+moon+}", "<s>Hello</s> <del>world</del><ins>moon</ins>" ],
		[ "Hel{^lo^} wor{,ld,}", "Hel<sup>lo</sup> wor<sub>ld</sub>" ],
		[ "{:He{_{/ll/}_}o {`world`}:}", "<mark>He<u><i>ll</i></u>o <code>world</code></mark>" ],
		[ "{@2024-07-12@}", "<time datetime=\"2024-07-12\">2024-07-12</time>" ],
		[ "See {!more /wiki!}", "See <a href=\"/wiki\">more</a>" ],
		[ "Write to {!{*me*} mailto:a@ex.com!}", "Write to <a href=\"mailto:a@ex.com\"><b>me</b></a>" ],
		[ "{!mailto:a@ex.com!.red}", "<a href=\"mailto:a@ex.com\" class=\"red\">a@ex.com</a>" ],
		[ "{!John Smith mailto:j@ex.co!}, {!mailto:js@ex.co!}, {!https://www.ee!}.", "<a href=\"mailto:j@ex.co\">John Smith</a>, <a href=\"mailto:js@ex.co\">js@ex.co</a>, <a href=\"https://www.ee\">www.ee</a>." ],
	], function(str, html, assert, mock) {
		assert.equal(inline(str), html)
		assert.end()
	})

	it ("should render docs: {0}", [
		[ "= Hello\n\nworld\n\n---\n\nAnd moon.", "<h1>Hello</h1>\n<p>world</p>\n<hr>\n<p>And moon.</p>" ],
		[ "---\n\n - First\n - Second", "<hr>\n<ul><li>First</li>\n<li>Second</li></ul>" ],
		[ "> Some\n block", "<blockquote><p>Some\n<br>block</p></blockquote>" ],
		[ "> == Hi\n>\n> > Nested", "<blockquote><h2>Hi</h2>\n<blockquote><p>Nested</p></blockquote></blockquote>" ],
		[ "[!a.jpg!] Image", "<img src=\"a.jpg\" alt=\"Image\">" ],
	], function(str, html, assert, mock) {
		assert.equal(doc(str), html)
		assert.end()
	})

	it ("should parse examples: {i}", [
		[ "html/article1.text" ],
	], function(fileName, assert, mock) {
		var str = fs.readFileSync(path.resolve("./test", fileName), "utf8")
		assert.matchSnapshot("./test/spec/" + fileName, doc(str))
		assert.end()
	})
})

