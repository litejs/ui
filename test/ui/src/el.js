var dom = require("dom-lite")
dom.Document.prototype.querySelector = dom.Document.prototype.querySelectorAll = null
dom.HTMLElement.prototype.querySelector = dom.HTMLElement.prototype.querySelectorAll = null
dom.HTMLElement.prototype.matches = dom.HTMLElement.prototype.closest = null
dom.document.documentElement = {}

global.document = dom.document
global.Element = dom.HTMLElement
global.window = global
global.attachEvent = function() {}
global.navigator = {language: "en-US"}


require("./el-browser.js")

