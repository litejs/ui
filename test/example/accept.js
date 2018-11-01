
var accept = require("../../app/accept")
, negotiateAccept = accept({
    '*/json': JSON.stringify,
    // Define optional parameters with default values
    'text/csv;headers=no;delimiter=",";NULL=;br="\r\n"': {}
})
// Use `*` to respond any language request
, negotiateLanguage = accept("en,de,de-CH")

function log(o){
	console.log(JSON.stringify(o).replace(/"(\w+)":/g, "$1:"))
}

log(
negotiateAccept("text/plain")
)
// { q: null }

log(
negotiateAccept("text/plain, */*")
)
// { rule: "*/json", q: 1, match: "*/*" }

log(
negotiateAccept("text/csv, application/json;q=0.8")
)
// { rule: "*/csv", q: 1, match: "text/csv", type: "text", subtype: "csv", suffix: ""
// , headers: "no", delimiter: ",", NULL: "", br: "\r\n" } 

log(
negotiateAccept('text/csv;delimiter="|";headers=yes;NULL=NULL;br=%0A, application/json;q=0.8')
)
// { rule: "*/csv", q: 1, match: "text/csv", type: "text", subtype: "csv", suffix: ""
// , headers: "yes", delimiter: "|", NULL: "NULL", br: "\n" } 

log(
negotiateLanguage("en; q=0.5; de")
)
// {"rule":"de","match":"de","q":1}

log(
negotiateLanguage("et, *;q=0.1")
)
// {"rule":"en","match":"*","q":0.1}
