global.Fn = require("../fn.js").Fn

global.Event = require("../events").Event

require("../format.js")
require("../timing.js")
require("../src/el.js")
global.i18n = window.El.i18n

El.get = function(id) {
	return document.getElementById(id)
}

function getString(node) {
	if ('outerHTML' in node)
		return node.outerHTML.toLowerCase().replace(/>[\n\r]+</g, "><").trim()

	var div = document.createElement("div")
	div.appendChild(node.cloneNode(true))
	return div.innerHTML
}

i18n.def({ "et":"Eesti keeles"
	, "en":"In English"
	, "ru":"На русском"
	, "fi":"Suomeksi"
	, "se":"på Svenska"
})

i18n.add("en", {
	date: "%a, %d %b %Y %H:%M:%S %z",
	name: "Name {date|lang}"
})

i18n.add("et", {
	date: "%Y %H:%M:%S %z",
	name: "Nimi {date|lang:'et'}"
})

/*
 * navigator.language
 * "et"
 * navigator.languages
 * ["et", "en-US", "en"]
 */
//i18n.setLang(navigator.language || navigator.userLanguage)

Date.prototype.lang = function(lang) {
	return this.format( i18n("date", lang) )
}

String.prototype.lang = function(lang) {
	return i18n(this, lang)
}

i18n.add("en", {
	firstName: "First Name",
	lastName: "Last Name"
})

i18n.use("en")

var undef
, el, h1, h2, h3, h4, input, radio, select, t1
, select1, select2
, testman = require("testman")
, map1 = {"map1": 1}
, map2 = {"map2": 2}

testman.describe.it.htmlSimilar = function(actual, expected) {
	var re = /[^\s"'=]+(=("|')(?:\\?.)*?\2)?/g
	, str1 = getString(actual).replace(/=(\w+)/g, '="$1"').match(re).sort().join(" ")
	, str2 = expected.replace(/=(\w+)/g, '="$1"').match(re).sort().join(" ")

	return this.equal(str1, str2)
}

testman
.describe("El")
.it ("should build elements")
.run(function(){
	el = El("div")
	select = El("select#id2.cl2:disabled")
	input = El.to(El("input"), document.body)
	radio = El.to(El("input[type=radio]"), document.body)
	h1 = El("h1")
	h2 = El("h2")
	h3 = El("h3")
	h4 = El("h4")
})
.htmlSimilar(el, "<div></div>")
.htmlSimilar(h1, "<h1></h1>")
.htmlSimilar(h2, "<h2></h2>")
.htmlSimilar(h3, "<h3></h3>")
.htmlSimilar(h4, "<h4></h4>")

.htmlSimilar(El(""),               "<div></div>")
.htmlSimilar(El("div"),            "<div></div>")
.htmlSimilar(El("", "element"),    "<div>element</div>")
.htmlSimilar(El("div", "element"), "<div>element</div>")
.htmlSimilar(El("p", "element"),   "<p>element</p>")
.htmlSimilar(El("#123"),           '<div id="123"></div>')

.htmlSimilar(El("div#123"),        '<div id="123"></div>')
.htmlSimilar(El("p#123"),          '<p id="123"></p>')
.htmlSimilar(El(".c-1"),           '<div class="c-1"></div>')
.htmlSimilar(El("div.c1"),         '<div class="c1"></div>')
.htmlSimilar(El("p.c1"),           '<p class="c1"></p>')
.htmlSimilar(El(".c1.c2"),         '<div class="c1 c2"></div>')
.htmlSimilar(El("div.c1.c2"),      '<div class="c1 c2"></div>')
.htmlSimilar(El("p.c1.c2"),        '<p class="c1 c2"></p>')
.htmlSimilar(El("#123.c1"),        '<div id="123" class="c1"></div>')
.htmlSimilar(El("div#123.c1"),     '<div id="123" class="c1"></div>')

.htmlSimilar(El("a[href='http://example.com/']"), '<a href="http://example.com/"></a>')
.htmlSimilar(El('a[href="http://example.com/"]'), '<a href="http://example.com/"></a>')
.htmlSimilar(El("a[href='http://example.com/'][title=link]"), '<a href="http://example.com/" title="link"></a>')
.htmlSimilar(El('a[href="http://example.com/"][title="link to site"]'), '<a href="http://example.com/" title="link to site"></a>')

.it ("shoult set attributes")
.equal(El.attr(input, {id: "set_id", title:"set title"}), input)
.equal(input.id, "set_id")
.equal(input.title, "set title")
.equal(El.attr(input, {title:"change title", name:"new name", id: "new_id"}), input)
.equal(input.title, "change title")
.equal(input.name, "new name")
.equal(input.id, "new_id")
.equal(El.attr(input, {title: null}), input)
.ok(!input.title)

.it ("has kill() and empty() methods")
.equal(El.kill(select), select)
.equal(h2.innerHTML, "")
.equal(El.empty(el), el)
.equal(el.innerHTML, "")

.it ("set childs")
.htmlSimilar(El.to(el, document.body), "<div></div>")
.htmlSimilar(El.append(el, h2), "<div><h2></h2></div>")
.htmlSimilar(El.append(el, h1, h2), "<div><h1></h1><h2></h2></div>")
.htmlSimilar(El.to(h4, el), "<h4></h4>")
.htmlSimilar(el, "<div><h1></h1><h2></h2><h4></h4></div>")
.htmlSimilar(El.to(h3, el,  h4), "<h3></h3>")
.htmlSimilar(el, "<div><h1></h1><h2></h2><h3></h3><h4></h4></div>")
.htmlSimilar(El.to(h3, el, h4), "<h3></h3>")
.htmlSimilar(el, "<div><h1></h1><h2></h2><h3></h3><h4></h4></div>")

.htmlSimilar(El.append(h1, [h2, h3]), "<h1><h2></h2><h3></h3></h1>")
.htmlSimilar(el, "<div><h1><h2></h2><h3></h3></h1><h4></h4></div>")

.htmlSimilar(El.to(select, h2), '<select id="id2" disabled="disabled" class="cl2"></select>')

.it ("should get element by id")
.equal(El.get("id2"), select)

.it ("find childs")
.equal(El.find(el, "#id2"), select)
.equal(El.find(el, ".cl2"), select)
.equal(El.find(el, "#id2.cl2"), select)
.equal(El.find(el, ".cl2#id2"), select)
.equal(El.find(el, "select"), select)
.equal(El.find(el, "select#id2"), select)
.equal(El.find(el, "select.cl2"), select)
.equal(El.find(el, "select#id2.cl2"), select)
.equal(El.find(el, "select.cl2#id2"), select)
.equal(El.find(el, "SELECT"), select)
.equal(El.find(el, "SELECT#id2"), select)
.equal(El.find(el, "SELECT.cl2"), select)
.equal(El.find(el, "SELECT#id2.cl2"), select)
.equal(El.find(el, "SELECT.cl2#id2"), select)

.equal(El.find(el, "h2"), h2)
.equal(!!El.find(el, ".cl3"), false)
.equal(El.findAll(document.body, "input").length, 2)
.equal(El.findAll(document.body, "input")[0], input)
.equal(El.findAll(document.body, "input")[1], radio)


.it ("supports boolean attributes")
.htmlSimilar(El("input:selected"), '<input selected="selected">')

.it ("has txt() method")
.equal(El.txt(el), "")
.equal(El.txt(el, ""), "")
.equal(El.txt(el, "hello"), "hello")
.equal(El.txt(el, "hello"), "hello")
.equal(El.txt(el), "hello")
.equal(El.txt(el, ""), "")
.equal(El.txt(el), "")

.it ("has val() method")
.anyOf(El.val(input), ["", undef])
.equal(El.val(input, "xx"), "xx")
.anyOf(El.val(select), ["", undef])
.equal(El.val(radio), null)
.run(function() {
	input.valObject = map1
	select.valObject = map2
})
.equal(El.val(input), map1)
.equal(El.val(select), map2)
.run(function() {
	select1 = El("select")
	select2 = El("select:multiple")
	El.append(select1, [
		El("option[value=1]"),
		El("option[value=2]:selected"),
		El("option[value=o1]"),
		El("option[value=o2]:selected"),
	])
	El.append(select2, [
		El("option[value=1]"),
		El("option[value=2]:selected"),
		El("option[value=o1]"),
		El("option[value=o2]:selected"),
	])
	// HACK: set type and options manualy as dom-lite does not handle them correctly
	select1.options = select1.childNodes
	select2.type = "select-multiple"
	select2.options = select2.childNodes

	return "2,o2" == El.val(select2)
})
//equal(select1.val(), "o2")
.equal("" + El.val(select2), "2,o2")
.equal(select2.options.length, 4)


.it ("has class methods")
.equal(el.className, "")
.equal(El.hasClass(el, "c1"), false)
.equal(El.hasClass(el, "c2"), false)
.equal(El.hasClass(el, "c3"), false)

.equal(El.addClass(el, "c1"), el)
.equal(El.hasClass(el, "c1"), true)
.equal(El.hasClass(el, "c2"), false)
.equal(El.hasClass(el, "c3"), false)

.equal(El.addClass(el, "c2"), el)
.equal(El.hasClass(el, "c1"), true)
.equal(El.hasClass(el, "c2"), true)
.equal(El.hasClass(el, "c3"), false)

.equal(El.addClass(el, "c3"), el)
.equal(El.hasClass(el, "c1"), true)
.equal(El.hasClass(el, "c2"), true)
.equal(El.hasClass(el, "c3"), true)

.equal(El.rmClass(el, "c2"), el)
.equal(El.hasClass(el, "c1"), true)
.equal(El.hasClass(el, "c2"), false)
.equal(El.hasClass(el, "c3"), true)

.equal(El.rmClass(el, "c3"), el)
.equal(El.hasClass(el, "c1"), true)
.equal(El.hasClass(el, "c2"), false)
.equal(El.hasClass(el, "c3"), false)

.equal(El.rmClass(el, "c3"), el)
.equal(El.hasClass(el, "c1"), true)
.equal(El.hasClass(el, "c2"), false)
.equal(El.hasClass(el, "c3"), false)

.equal(El.rmClass(el, "c1"), el)
.equal(El.hasClass(el, "c1"), false)
.equal(El.hasClass(el, "c2"), false)
.equal(El.hasClass(el, "c3"), false)

.equal(el.className, "")


.describe( "Templates" )
.it ("supports templates")
.run(function() {
	El.tpl([
		"@el test1",
		" a",
		"  b",
		"   i",
		"@el test2",
		" a ",
		"  b",
		"   i",
		"@el test3",
		" a ",
		"  b",
		"   i |link",
		"@el test4",
		" a ",
		"  b ",
		"   i |link",
		"@el test5",
		" a ",
		"  b",
		"   i |link>to",
		"@el test6",
		" a[href='#a>b']",
		"  b.bold ",
		"   i#ital |link",
		"@el test7",
		" a>b>i",
		"@el test8",
		" a > b>i",
		"@el test9",
		" a>b>i |link",
		"@el test10",
		" a>b[data-bind=\"class:'red',i>1\"]>i &txt:name"
	].join("\n"))
})
.htmlSimilar(El("test1"), '<a><b><i></i></b></a>')
.htmlSimilar(El("test2"), '<a><b><i></i></b></a>')
.htmlSimilar(El("test3"), '<a><b><i>link</i></b></a>')
.htmlSimilar(El("test4"), '<a><b><i>link</i></b></a>')
.htmlSimilar(El("test5"), '<a><b><i>link&gt;to</i></b></a>')
.htmlSimilar(El("test6"), '<a href="#a&gt;b"><b class="bold"><i id="ital">link</i></b></a>')

.it ("supports block expansion")
.htmlSimilar(El("test7"), '<a><b><i></i></b></a>')
.htmlSimilar(El("test8"), '<a><b><i></i></b></a>')
.htmlSimilar(El("test9"), '<a><b><i>link</i></b></a>')

.it ( "should render bindings" )
.htmlSimilar(t1 = El("test10"),
	"<a><b data-bind=\"class:'red',i&gt;1\"><i data-bind=\"txt:name\"></i></b></a>")
.htmlSimilar(El.render(t1, {i:1,name:"world"}),
	"<a><b data-bind=\"class:'red',i&gt;1\"><i data-bind=\"txt:name\">world</i></b></a>")
.htmlSimilar(El.render(t1, {i:2,name:"moon"}),
	"<a><b class=\"red\" data-bind=\"class:'red',i&gt;1\"><i data-bind=\"txt:name\">moon</i></b></a>")
/*
	htmlSimilar(El.tpl("div &css: 'margin-top', '1px'").render(),
		'<div data-bind="css: \'margin-top\', \'1px\'" style="margin-top: 1px"></div>')
	htmlSimilar(El.tpl("div &css: 'margin-top', ''").render(),
		'<div data-bind="css: \'margin-top\', \'\'" style="margin-top: "></div>')
	htmlSimilar(El.tpl("div &html: '<hr>'").render(),
		'<div data-bind="html: \'&lt;hr&gt;\'"><hr></div>')
	htmlSimilar(El.tpl("div &data: 'xx', 'y'").render(),
		'<div data-bind="data: \'xx\', \'y\'" data-xx="y"></div>')

it ( "should show set DOM propperty when plugin not found" , {skip: "Browsers does not show attrs set by node.unknown_binding = '123', should use node.set()"})
	htmlSimilar(t1 = El.tpl("a &unknown_binding:\'hello {name}\'"), '<a data-bind="unknown_binding:\'hello {name}\'"></a>')
	htmlSimilar(t1.render({name:"world"}), '<a data-bind="unknown_binding:\'hello {name}\'" unknown_binding="hello world"></a>')
	htmlSimilar(t1.render({name:"moon"}), '<a data-bind="unknown_binding:\'hello {name}\'" unknown_binding="hello moon"></a>')

*/
.test ("scope", function(assert) {
	assert.plan(3)

	var a = El("a")
	, b = El("b")
	, aScope = El.scope(a, true)
	, bScope = El.scope(b)

	El.scope(a).x = 1

	assert.equal(aScope.x, 1)
	assert.notEqual(aScope, bScope)
	assert.ok(!bScope.x)
})


