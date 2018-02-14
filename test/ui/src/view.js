require("../../_setup")

var View = require("../../../ui/src/view").View
, globalEl = global.El

function Nop() {}
global.El = {
	data: {},
	append: Nop,
	kill: Nop,
	render: Nop
}

require("../..")
.describe("View")
.test("it should match views", function(assert) {
	var tmp, lastParams
	, el = {}
	, params = {}
	, view1 = new View("a")
	, viewHidden = View("#home")
	assert.equal(view1.el, null)
	assert.equal(view1.parent, null)
	View("a", el, "#home")
	assert.strictEqual(view1.el, el)
	assert.strictEqual(view1.parent, viewHidden)

	View.param("attr", function(value, name, params) {
		lastParams = params
	})

	var view2 = View("home")
	var view3 = View("hello/{attr}")

	assert.strictEqual(View.get("a"), view1)
	assert.strictEqual(View.get("home"), view2)
	assert.strictEqual(View.get(""), view2)
	assert.strictEqual(View.get(), view2)
	assert.strictEqual(View.get("hello/world", params), view3)
	assert.strictEqual(params.attr, "world")
	assert.equal(View.active, null)

	tmp = lastParams
	View.show("hello/moon")
	assert.equal(View.active, "hello/{attr}")
	assert.notStrictEqual(tmp, lastParams)
	tmp = lastParams
	View.show(true)
	assert.equal(View.active, "hello/{attr}")
	assert.notStrictEqual(tmp, lastParams)
	tmp = lastParams
	View.show("hello/world")
	assert.equal(View.active, "hello/{attr}")
	assert.notStrictEqual(tmp, lastParams)
	assert.end()
})
.test("it should define views with View.def", function(assert) {
	assert.notOk(View.views.a1)
	View.def("a1 a1.js,%.css")
	View.def("a2 a2.js,%-map")
	assert.ok(View.views.a1)
	assert.equal(View("a1").file, "a1.js,a1.css")
	assert.equal(View("a2").file, "a2.js,a2.js-map")

	View.def("a1 a2,x.js,+.map")
	assert.equal(View("a1").file, "a1.js,a1.css,a2.js,a2.js-map,x.js,x.js.map")
	assert.end()

})
.test("restore global El", function(assert) {
	assert.ok(global.El = globalEl)
	assert.end()
})


