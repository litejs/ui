
/* litejs.com/MIT-LICENSE.txt */


function test() {
	El.data.describe = describe

	describe("Example UI")
	.it ("should navigate")
	.collectViewsUsage()
	.collectCssUsage({
		ignoreFiles: ["css/base.css", "css/modules/grid.css", "css/modules/media.css"],
		ignoreSelectors: ["html"]
	})
	.run(function() {
		location.hash = ""
	})
	.waitSelector("a[href$='#home'].selected")
	.viewOpen("home")
	.run(function() {
		location.hash = "#users"
	})
	.waitSelector("a[href$='#users'].selected")
	.viewOpen("users")
	.countSelectors("ul.users>li", 8)

	.click("ul.users a[href]")
	.viewOpen("users/{id}", {timeout: 3000})

	.click("a[href$='#home']")
	.waitSelector("a[href$='#home'].selected")
	.viewOpen("home")

	.click("a[href$='#settings']")
	.waitSelector("a[href$='#settings'].selected")
	//.viewOpen("settings")

	.click("a[href$='#test']")
	.waitSelector("a[href$='#test'].selected")
	.viewOpen("test")

	.click("a[href$='#broken-link']")
	.viewOpen("404")

	.click("a[href$='#test']")
	.click("a[href$='#test-grid']")
	.viewOpen("test-grid")

	.click("a[href$='#test']")
	.click("a[href$='#test-form1']")
	.viewOpen("test-form1")

	.it ("should change language")
	.click("a.lang-en")
	.waitSelector("a.lang-en.selected")
	.haveText("a.home-link", "Header")

	.click("a.lang-et")
	.waitSelector("a.lang-et.selected")
	.haveText("a.home-link", "Pealkiri")

	.it ("should log in")
	.click("a[href$='#settings']")
	.waitSelector("a[href$='#settings'].selected")
	.fill("input[name=name]", "Kala")
	.click("input[type=submit]")
	.click(".top__logout")

	.it ("should be with responsive design")
	.resizeTo("360px", "640px")
	.waitSelector(".sm div")

	.resizeTo("", "")
	.goTo("testman")
	.assertViewsUsage()
	.assertCssUsage()

	.test("it shold have a good coverage", function(assert) {
		assert.plan(4)
		assert.options.noStack = true

		//delete __coverage__.l
		var sum = coverageUtils.summarizeCoverage(__coverage__)

		function add(key) {
			var map = sum[key]
			, misses = map.total-map.covered
			assert.ok(
				map.pct == 100,
				key + " coverage is " +map.pct+ "% ["+map.covered+"/"+map.total+"]")
		}
		add("statements")
		add("branches")
		add("functions")
		add("lines")
	})

	.done(function() {
		document.body.render()
	})
}


