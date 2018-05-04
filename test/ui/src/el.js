var dom = require("dom-lite")
dom.Document.prototype.querySelector = dom.Document.prototype.querySelectorAll = null
dom.HTMLElement.prototype.querySelector = dom.HTMLElement.prototype.querySelectorAll = null
dom.HTMLElement.prototype.matches = dom.HTMLElement.prototype.closest = null
dom.document.documentElement = {}

require("../../_setup")

global.history = {}
global.View = require("../../../ui/src/view.js").View
global.document = dom.document
global.Element = dom.HTMLElement
global.window = global
global.attachEvent = function() {}
global.navigator = {language: "en-US"}

window.addEventListener = document.addEventListener = function(){}

global.xhr = {load: {adapter: {}}}

require("./el-browser.js")

