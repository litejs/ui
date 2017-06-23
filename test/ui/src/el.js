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

window.addEventListener = document.addEventListener = function(){}

global.xhr = {load: {adapter: {}}}

JSON.merge = require("../lib/json").merge

require("./el-browser.js")

