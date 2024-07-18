

describe("markup.js", function() {
	var markup = require("../markup.js").markup
	, fs = require("fs")
	, path = require("path")
	require("@litejs/cli/snapshot.js")

	it ("should render markup: {i}", [
		[ 'He*llo/_ wo~rld', 'He*llo/_ wo~rld' ],
		[ 'He{*ll*}o {/world/}', 'He<b>ll</b>o <i>world</i>' ],
		[ 'He{~{*ll*}~}o {*world*}', 'He<s><b>ll</b></s>o <b>world</b>' ],
		[ '= Hello\n\nworld', '<h1>Hello</h1>\n<p>world</p>' ],
	], function(str, html, assert, mock) {
		assert.equal(markup(str), html)
		assert.end()
	})

	it ("should parse examples: {i}", [
		[ "html/article1.text" ],
	], function(fileName, assert, mock) {
		var str = fs.readFileSync(path.resolve("./test", fileName), "utf8")
		assert.matchSnapshot("./test/spec/" + fileName, markup(str))
		assert.end()
	})
})

