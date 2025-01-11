#!/usr/bin/env node
//-
//-  Usage
//-    lj-extract-lang [FILE..]
//-
//-  Options
//-    --pretty, -p    Pretty print json output
//-
//-  Examples
//-    lj-extract-translations translations.json
//-

var fs = require("fs")
, path = require("path")
, opts = require("@litejs/cli/opts.js").opts({
	pretty: false,
	version: false
})
, extractLang = require("../extract-lang.js").extractLang
, package = require("../package.json")


if (opts._unknown[0]) {
	console.error("\nError: Unknown option: " + opts._unknown)
	usage(true)
	process.exit(1)
} else if (opts._[0]) {
	readJson(opts._[0])
} else {
	usage()
}

function usage(err) {
	if (!err && opts.version) console.log("%s v%s", package.name, package.version)
	var helpFile = module.filename
	console.log(fs.readFileSync(helpFile, "utf8").match(/^\/\/-.*/gm).join("\n").replace(/^.../gm, ""))
}

function readJson(file) {
	var lang
	, all = require(path.resolve(file))
	, i = 0
	, locales = Object.keys(all.locales)

	console.log("Extract translations: " + locales)

	for (; lang = locales[i++]; ) {
		writeJson(lang + ".json", extractLang(all, lang))
	}
}

function writeJson(file, data) {
	fs.writeFileSync(path.resolve(file), JSON.stringify(data, null, opts.pretty ? 2 : null) + "\n", "utf8")
}


