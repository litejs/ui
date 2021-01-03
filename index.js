/*
* @version  21.1.0
* @author   Lauri Rooden <lauri@rooden.ee>
* @license  MIT License
*/



!function(Date, proto) {
	var Date$prototype = Date[proto]
	, String$prototype = String[proto]
	, Number$prototype = Number[proto]
	, maskRe = /(\[)((?:\\?.)*?)\]|([YMD])\3\3\3?|([YMDHhmsWSZ])(\4?)|[uUASwoQ]|(["\\\n\r\u2028\u2029])/g
	, dateRe = /(\d+)[-.\/](\d+)[-.\/](\d+)/
	, timeRe = /(\d+):(\d+)(?::(\d+))?(\.\d+)?(?:\s*(?:(a)|(p))\.?m\.?)?(\s*(?:Z|GMT|UTC)?(?:([-+]\d\d):?(\d\d)?)?)?/i
	, fns = Object.create(null)
	, aliases = {
		sec: "s",
		second: "s",
		seconds: "s",
		min: "m",
		minute: "m",
		minutes: "m",
		hr: "h",
		hour: "h",
		hours: "h",
		day: "D",
		days: "D",
		week: "W",
		weeks: "W",
		month: "M",
		months: "M",
		year: "Y",
		years: "Y"
	}
	, units = {
		S: 1,
		s: 1000,
		m: 60000,
		h: 3600000,
		D: 86400000,
		W: 604800000
	}
	, tmp1 = new Date()
	, tmp2 = new Date()
	, sinceFrom = new Date()
	, map = Date.fnMap = {
		w: "Day()||7",
		Y: "FullYear()%100",
		M: "Month()+1",
		D: "Date()",
		h: "Hours()",
		H: "Hours()%12||12",
		m: "Minutes()",
		s: "Seconds()",
		S: "Milliseconds()"
	}
	, locales = Date.locales = {
		en: {
			am: "AM",
			pm: "PM",
			names: "JanFebMarAprMayJunJulAugSepOctNovDecJanuaryFebruaryMarchAprilMayJuneJulyAugustSeptemberOctoberNovemberDecemberSunMonTueWedThuFriSatSundayMondayTuesdayWednesdayThursdayFridaySaturday".match(/.[a-z]+/g),
			masks: {
				LT:   "hh:mm",
				LTS:  "hh:mm:ss",
				L:    "DD/MM/YYYY",
				LL:   "D MMMM YYYY",
				LLL:  "D MMMM YYYY hh:mm",
				LLLL: "DDDD, D MMMM YYYY hh:mm"
			}
		}
	}
	, masks = Date.masks = {
		"iso": "UTC:YYYY-MM-DD[T]hh:mm:ss[Z]"
	}


	Date.makeStr = makeStr
	function makeStr(mask, utc) {
		var get = "d.get" + (utc ? "UTC" : "")
		, setA = "a.setTime(+d+((4-(" + get + map.w + "))*864e5))"
		return (utc ? mask.slice(4) : mask).replace(maskRe, function(match, quote, text, MD, single, pad, esc) {
			var str = (
				esc            ? escape(esc).replace(/%u/g, "\\u").replace(/%/g, "\\x") :
				quote          ? text :
				MD == "Y"      ? get + "FullYear()" :
				MD             ? "l.names[" + get + (MD == "M" ? "Month" : "Day" ) + "()+" + (match == "DDD" ? 24 : MD == "D" ? 31 : match == "MMM" ? 0 : 12) + "]" :
				match == "u"   ? "(d/1000)>>>0" :
				match == "U"   ? "+d" :
				match == "Q"   ? "((" + get + "Month()/3)|0)+1" :
				match == "A"   ? "l[" + get + map.h + ">11?'pm':'am']" :
				match == "o"   ? setA + ",a" + get.slice(1) + "FullYear()" :
				single == "Z"  ? "(t=o)?(t<0?((t=-t),'-'):'+')+(t<600?'0':'')+(0|(t/60))" + (pad ? "" : "+':'") + "+((t%=60)>9?t:'0'+t):'Z'" :
				single == "W"  ? "Math.ceil(((" + setA + "-a.s" + get.slice(3) + "Month(0,1))/864e5+1)/7)" :
				get + map[single || match]
			)
			return quote || esc ? str : '"+(' + (
				match == "SS" ? "(t=" + str + ")>9?t>99?t:'0'+t:'00'+t" :
				pad && single != "Z" ? "(t=" + str + ")>9?t:'0'+t" :
				str
			) + ')+"'
		})
	}

	Date$prototype.date = function(_mask, _zone) {
		var offset, undef
		, date = this
		, locale = locales[date._locale || Date._locale || "en"] || locales.en
		, mask = locale.masks && locale.masks[_mask] || masks[_mask] || _mask || masks.iso
		, zone = _zone != undef ? _zone : date._tz != undef ? date._tz : Date._tz != undef ? Date._tz : undef
		, utc = mask.slice(0, 4) == "UTC:"
		if (zone != undef && !utc) {
			offset = 60 * zone
			tmp1.setTime(+date + offset * 6e4)
			utc = mask = "UTC:" + mask
		} else {
			offset = utc ? 0 : -date.getTimezoneOffset()
			tmp1.setTime(+date)
		}
		return isNaN(+date) ? "" + date : (
			fns[mask] || (fns[mask] = Function("d,a,o,l", 'var t;return "' + makeStr(mask, utc) + '"')))(
			tmp1,
			tmp2,
			offset,
			locale
		)
	}

	addFn("add", function(amount, _unit, mask) {
		var date = this
		, unit = aliases[_unit] || _unit
		if (unit == "M" || unit == "Y" && (amount *= 12)) {
			unit = date.getUTCDate()
			date.setUTCMonth(date.getUTCMonth() + amount)
			if (unit > (unit = date.getUTCDate())) {
				date.add(-unit, "D")
			}
		} else if (amount) {
			date.setTime(date.getTime() + (amount * (units[unit] || 1)))
		}
		return mask ? date.date(mask) : date
	})

	addFn("startOf", function(_unit, mask) {
		var ms
		, date = this
		, unit = aliases[_unit] || _unit
		, zone = date._tz != ms ? date._tz : Date._tz != ms ? Date._tz : ms
		if (unit == "Y") {
			if (zone === 0) date.setUTCMonth(0, 1)
			else date.setMonth(0, 1)
			unit = "D"
		} else if (unit == "M") {
			if (zone === 0) date.setUTCDate(1)
			else date.setDate(1)
			unit = "D"
		} else if (unit == "W") {
			ms = date.getDay()
			if (ms != 1) date.setHours(-24 * (ms ? ms - 1 : 6))
			unit = "D"
		}
		zone = zone < 36 ? 3600000 * zone : -date.getTimezoneOffset() * 60000
		ms = date.getTime() + zone
		date.setTime(
			ms -
			(ms % (units[unit] || 1)) -
			zone
		)
		return mask ? date.date(mask) : date
	})

	addFn("endOf", function(unit, mask) {
		return this.add(1, unit).startOf(unit).add(-1, "S", mask)
	})

	addFn("since", function(from, _unit) {
		var diff
		, date = this
		, unit = aliases[_unit] || _unit
		if (typeof from == "string") {
			from = aliases[from] ? (sinceFrom.setTime(+date), sinceFrom.tz(date._tz).startOf(from)) : from.date()
		}
		if (units[unit]) {
			diff = (date - from) / units[unit]
		} else {
			diff = date.since("month", "S") - from.since("month", "S")
			if (diff) {
				tmp1.setTime(+date)
				diff /= units.D * tmp1.endOf("M").getUTCDate()
			}
			diff += 12 * (date.getUTCFullYear() - from.getUTCFullYear()) + date.getUTCMonth() - from.getUTCMonth()
			if (unit == "Y") {
				diff /= 12
			}
		}

		return diff
	})

	//*/


	/*
	 * // In Chrome Date.parse("01.02.2001") is Jan
	 * num = +date || Date.parse(date) || ""+date;
	 */

	String$prototype.date = function(mask, zoneOut, zoneIn) {
		var undef, date, match, year, month
		, str = this
		if (isNaN(+str)) {
			if (match = str.match(dateRe)) {
				// Big endian date, starting with the year, eg. 2011-01-31
				// Middle endian date, starting with the month, eg. 01/31/2011
				// Little endian date, starting with the day, eg. 31.01.2011
				year = match[1] > 99 ? 1 : 3
				month = Date.middleEndian ? 4 - year : 2
				date = new Date(match[year], match[month] - 1, match[6 - month - year])
			} else {
				date = new Date()
			}

			// Time
			match = str.match(timeRe) || [0, 0, 0]
			date.setHours(
				match[6] && match[1] < 12 ? +match[1] + 12 :
				match[5] && match[1] == 12 ? 0 : match[1],
				match[2], match[3]|0, (1000 * match[4])|0
			)

			// Timezone
			if (match[7]) {
				zoneIn = (match[8]|0) + ((match[9]|0)/(match[8]<0?-60:60))
			}

			if (zoneIn != undef) {
				date.tz(zoneIn)
				date.setTime(date - (60 * zoneIn + date.getTimezoneOffset()) * 60000)
			}
			return mask ? date.date(mask, zoneOut) : date
		}
		return (+str).date(mask, zoneOut, zoneIn)
	}

	Number$prototype.date = function(mask, zoneOut, zoneIn) {
		var date
		, num = this
		if (num < 4294967296) num *= 1000
		date = new Date(
			zoneIn != date ?
			tmp1.setTime(num) - (60 * zoneIn + tmp1.getTimezoneOffset()) * 60000 :
			num
		)

		return mask ? date.date(mask, zoneOut) : date
	}

	function addFn(method, fn) {
		Date$prototype[method] = fn
		String$prototype[method] = Number$prototype[method] = function(a, b, c) {
			return this.date()[method](a, b, c)
		}
	}

	function makeSetter(method) {
		Date[method] = Date$prototype[method] = function(value, mask) {
			var date = this
			date["_" + method] = value
			return mask ? date.date(mask) : date
		}
	}

	makeSetter("tz")
	makeSetter("locale")
}(Date, "prototype")
!function(exports, Object) {
	"use strict";
	var getFns = Object.create(null)
	, setFns = Object.create(null)
	, filterFns = Object.create(null)
	, KEYS = Object.keys
	, FILTER_ERR = "Invalid filter: "
	, escRe = /['\n\r\u2028\u2029]|\\(?!x2e)/g
	, pathRe = /(^$|.+?)(?:\[([^\]]*)\]|\{([^}]*)})?(\.(?=[^.])|$)/g
	, reEscRe = /[.+^=:${}()|\/\\]/g
	, keyRe = /\[(.*?)\]/g
	, globRe = /\[.+?\]|[?*]/
	, globReplace = /\?|(?=\*)/g
	, globGroup = /\[!(?=.*\])/g
	, primitiveRe = /^(-?(\d*\.)?\d+|true|false|null)$/
	, valRe = /("|')(?:\\?.)*?\1|(\w*)\{((?:("|')(?:\\?.)*?\4|\w*\{(?:("|')(?:\\?.)*?\5|[^}])*?\}|.)*?)\}|([@$]?)([^,]+)/g
	, filterRe = /(!?)(\$?)((?:[-+:.\/\w]+|\[[^\]]+\]|\{[^}]+}|\\x2e)+)(\[]|\{}|)(?:(!(?=\1)==?|(?=\1)[<>=]=?)((?:("|')(?:\\?.)*?\7|\w*\{(?:("|')(?:\\?.)*?\8|\w*\{(?:("|')(?:\\?.)*?\9|[^}])*?\}|.)*?\}|[^|&()])*))?(?=[;)|&]|$)|(([;&|])\11*|([()])|.)/g
	, onlyFilterRe = RegExp("^(?:([@*])|" + filterRe.source.slice(0, -10) + "))+$")
	, cleanRe = /(\(o=d\)&&(?!.*o=o).*)\(o=d\)&&/g
	, fns = {
		"==": "a==d",
		"===": "a===d",
		">": "a<d",
		">=": "a<=d",
		"<": "a>d",
		"<=": "a>=d",
		"~": "typeof d==='string'&&a.test(d)"
	}
	, fnMap = {
		w: "Day()||7",
		Y: "FullYear()%100",
		M: "Month()+1",
		D: "Date()",
		h: "Hours()",
		H: "Hours()%12||12",
		m: "Minutes()",
		s: "Seconds()",
		S: "Milliseconds()"
	}
	, hasOwn = fns.hasOwnProperty
	, tmpDate = new Date()
	, isArray = Array.isArray

	exports.clone = clone
	exports.matcher = matcher
	exports.get = function(obj, pointer, fallback) { return pathFn(pointer)(obj, fallback) }
	exports.isObject = isObject
	exports.mergePatch = mergePatch
	exports.set = function(obj, pointer, value) { return pathFn(pointer, true)(obj, value) }
	exports.setForm = setForm
	exports.tr = tr

	exports.get.str = pathStr
	matcher.re = filterRe
	matcher.str = filterStr
	matcher.valRe = valRe

	/**
	 * JSON Merge Patch
	 * @see https://tools.ietf.org/html/rfc7396
	 */

	function mergePatch(target, patch, changed, previous, pointer) {
		var undef, key, oldVal, val, len, nextPointer
		if (isObject(patch)) {
			if (!pointer) {
				pointer = ""
			}
			if (!isObject(target)) {
				target = {}
			}
			for (key in patch) if (
				undef !== (oldVal = target[key], val = patch[key]) &&
				hasOwn.call(patch, key) &&
				(
					undef == val ?
					undef !== oldVal && delete target[key] :
					target[key] !== val
				)
			) {
				nextPointer = pointer + "/" + key.replace(/~/g, "~0").replace(/\//g, "~1")
				len = changed && isObject(target[key]) && changed.length
				if (undef != val) {
					target[key] = mergePatch(target[key], val, changed, previous, nextPointer)
				}
				if (len === false || changed && len != changed.length) {
					changed.push(nextPointer)
					if (previous && !isObject(oldVal)) {
						previous[nextPointer] = oldVal
					}
				}
			}
		} else {
			if (changed && isObject(target)) {
				val = {}
				for (key in target) if (hasOwn.call(target, key)) {
					val[key] = null
				}
				mergePatch(target, val, changed, previous, pointer)
			}
			target = patch
		}
		return target
	}

	function escFn(str) {
		return escape(str).replace(/%u/g, "\\u").replace(/%/g, "\\x")
	}

	function pathStr(str, set) {
		return (
			str.charAt(0) === "/" ?
			str.slice(1).replace(/\./g, "\\x2e").replace(/\//g, ".").replace(/~1/g, "/").replace(/~0/g, "~") :
			str
		)
		.replace(escRe, escFn)
		.replace(pathRe, set === true ? pathSet : pathGet)
	}

	function pathGet(str, path, arr, obj, dot) {
		var v = dot ? "(o=" : "(c="
		, sub = arr || obj
		if (sub && !(sub = onlyFilterRe.exec(sub))) throw Error(FILTER_ERR + str)
		return (
			sub ?
			pathGet(0, path, 0, 0, 1) + (arr ? "i" : "j") + "(o)&&" + v + (
				sub[1] ? (arr ? "o" : "K(o)") + (sub[0] === "*" ? "" : ".length") :
				+arr == arr ?  "o[" + (arr < 0 ? "o.length" + arr : arr) + "]" :
				(arr ? "I" : "J") + "(o,f('" + sub[0] + "'))"
			) + ")" :
			v + "o['" + path + (
				arr === "" ? "'])&&i(c)&&c" :
				obj === "" ? "'])&&j(c)&&c" :
				"'])"
			)
		) + (dot ? "&&" : "")
	}

	function pathSet(str, path, arr, obj, dot) {
		var op = "o['" + path + "']"
		, out = ""
		, sub = arr || obj
		if (sub) {
			out = "(o="+(arr?"i":"j")+"(o['" + path + "'])?o['" + path + "']:(o['" + path + "']="+(arr?"[]":"{}")+"))&&"
			if (arr === "-") {
				op = "o[o.length]"
			} else if (+arr == arr) {
				op = "o[" + (arr < 0 ? "o.length" + arr : arr) + "]"
			} else {
				if (!onlyFilterRe.test(arr)) throw Error(FILTER_ERR + str)
				op = "o[t]"
				out += "(t="+(arr?"I":"J")+"(o,f('" + sub + "'),1))!=null&&"
			}
		}
		return out + (dot ?
			"(o=typeof " + op + "==='object'&&" + op + "||(" + op + "={}))&&" :
			"((c=" + op + "),(" + op + "=v),c)"
		)
	}

	function pathFn(str, set) {
		var map = set === true ? setFns : getFns
		return map[str] || (map[str] = Function(
			"i,j,I,J,K,f",
			"return function(d,v,b){var c,o,t;return (o=d)&&" +
			pathStr(str, set) +
			(set ? ",c}": "!==void 0?c:v}")
		)(isArray, isObject, inArray, inObject, KEYS, matcher))
	}

	function clone(obj) {
		var temp, key
		if (obj && typeof obj == "object") {
			// new Date().constructor() returns a string
			temp = obj instanceof Date ? new Date(+obj) :
				obj instanceof RegExp ? RegExp(obj.source, (""+obj).split("/").pop()) :
				obj.constructor()
			for (key in obj) if (hasOwn.call(obj, key)) {
				temp[key] = clone(obj[key])
			}
			obj = temp
		}
		return obj
	}

	function matcher(str, prefix, opts, getter, tmp) {
		var optimized
		, arr = []
		, key = (prefix || "") + (fns[str] || filterStr(str, opts, arr, getter))
		, fn = filterFns[key]
		if (!fn) {
			for (optimized = key; optimized != (optimized = optimized.replace(cleanRe, "$1")); );
			fn = filterFns[key] = Function(
				fns[str] ? "a" : "a,i,j,I,J,K,f,p,t",
				"return function(d,b){var o;return " + optimized + "}"
			)
			fn.source = optimized
		}
		return fns[str] ? fn : fn(
			arr, isArray, isObject, inArray, inObject, KEYS, matcher, pathFn, tmp
		)
	}

	// Date{day=1,2}
	// sliceable[start:stop:step]
	// Geo{distance=200km&lat=40&lon=-70}
	// ?pos=Geo{distance=200km&lat=@lat&lon=@lon}
	// [lon, lat] in The GeoJSON Format RFC 7946
	// IP{net=127.0.0.1/30}
	// var re = /^((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])(?:\.(?=.)|$)){4}$/
	// ["1.2.3.4", "127.0.0.1", "192.175.255.254."].map(re.test, re)

	matcher.date = function(str) {
		return matcher(str, "(t.setTime(+d)>=0)&&", null, dateGetter, tmpDate)
	}

	function dateGetter(name) {
		return "(t.get" + fnMap[name] + ")"
	}

	function filterStr(qs, opts, arr, getter) {
		return qs.replace(filterRe, worker).replace(/^[1&]&+|&+1?$/g, "") || "1"

		function worker(all, not, isOption, attr, isArray, op, val, q1, q2, q3, ext, ok2, ok1) {
			if (ext) {
				if (!ok2 && !ok1) {
					throw Error(FILTER_ERR + qs)
				}
				return ok1 ? ok1 : ok2 == ";" ? "&&" : ok2 + ok2
			}
			if (isOption) {
				if (opts) opts[attr] = val
				return "1"
			}

			var idd, m, v, isRe
			, a = []
			, pre = "(o=d)&&"

			attr = (getter || pathStr)(attr)

			if (m = attr.match(/\(c=(.*?)\)$/)) {
				if (m[1] == "K(o)") {
					pre += attr + "&&"
					attr = "c"
				} else {
					if (m.index) pre += attr.slice(0, m.index)
					attr = m[1]
				}
			}

			if (op == "!=" || op == "!==") {
				not = "!"
				op = op.slice(1)
			}
			if (isArray) {
				pre += not + (isArray === "[]" ? "i(" : "j(") + attr + ")"
			}

			if (!op) {
				return isArray === "" ? pre + not + attr : pre
			}

			if (op == "=" || op == "==") op += "="
			if (val === "") val="''"
			for (; m = valRe.exec(val); ) {
				// quote, extension, subquery, subQuote, subSubQuote, at
				// Parameterized query ?name=$name|name=:name
				isRe = 0
				v = m[6] == "$" ? "b['"+ m[7] +"']" : arrIdx(arr,
					m[1] || m[3] ? m[0].slice(m[3] ? m[2].length + 1 : 1, -1) :
					m[6] ? m[7] :
					primitiveRe.test(m[0]) ? JSON.parse(m[0]) :
					(isRe = globRe.test(m[0])) ? RegExp(
						"^" + m[0]
						.replace(reEscRe, "\\$&")
						.replace(globReplace, ".")
						.replace(globGroup, "[^") + "$",
						op === "==" ? "i" : ""
					) :
					m[0]
				)
				idd = (
					m[2] ? "f." + m[2].toLowerCase() :
					m[3] ? "f" :
					isArray || attr === "c" ? arrIdx(arr, matcher(isRe ? "~" : op)) :
					""
				) + "(" + v
				a.push(
					isArray || attr === "c" ? (isArray == "{}" ? "J(" : "I(") + attr + "," + idd + "))" :
					m[2] || m[3] ? idd + ")(" + attr + ")" :
					isRe ? "typeof " + attr + "==='string'&&" + v + ".test(" + attr + ")" :
					m[6] ? attr + "!==void 0&&" + attr + op + (
						m[6] == "$" ? "b['"+ m[7] +"']" : "p(" + v + ")(o)"
					) :
					attr + op + v
				)
			}

			return pre + (
				isArray ? (not ? "||" : "&&") : ""
			) + not + "(" + a.join("||") + ")"
		}
	}

	function arrIdx(arr, val) {
		for (
			var i = arr.length;
			0 <= --i && !(
				arr[i] === val ||
				val && val.source && val.source === arr[i].source
			);
		);
		return "a[" + (-1 < i ? i : arr.push(val) - 1) + "]"
	}

	function setForm(map, key_, val) {
		for (var match, key = key_, step = map; match = keyRe.exec(key_); ) {
			if (step === map) key = key.slice(0, match.index)
			match = match[1]
			step = step[key] || (
				step[key] = match && +match != match ? {} : []
			)
			key = match
		}
		if (isArray(step)) {
			step.push(val)
		} else if (isArray(step[key])) {
			step[key].push(val)
		} else {
			step[key] = step[key] != null ? [step[key], val] : val
		}
	}

	function tr(attrs, aclFn) {
		var attr, tmp
		, arr = []
		, map = {}
		, i = 0
		for (; attr = valRe.exec(attrs); ) {
			tmp = attr[0].split(":")
			exports.set(map, tmp[0], i)
			arr[i++] = pathFn(tmp[1] ? attr[0].slice(tmp[0].length+1) : tmp[0])
		}
		return Function(
			"g,a",
			"return function(o,a){return " +
			JSON.stringify(map).replace(/:(\d+)/g,":g[$1](o)") + "}"
		)(arr, aclFn)
	}

	function isObject(obj) {
		return !!obj && obj.constructor === Object
	}

	function inArray(a, fn, idx) {
		for (var i = -1, len = a.length; ++i < len; ) {
			if (fn(a[i])) return idx == null ? a[i] : i
		}
		return idx != null && len
	}

	function inObject(o, fn, idx) {
		for (var key in o) {
			if (fn(o[key])) return idx == null ? o[key] : key
		}
		return null
	}
// `this` refers to the `window` in browser and to the `exports` in Node.js.
}(JSON, Object)
!function(F, undef) {
	// Time to live - Run *onTimeout* if Function not called on time
	F.ttl = function(ms, onTimeout, scope) {
		var fn = this
		, tick = setTimeout(function() {
			ms = 0
			if (onTimeout) onTimeout.call(scope)
		}, ms)

		return function() {
			clearTimeout(tick)
			if (ms) fn.apply(scope === undef ? this : scope, arguments)
		}
	}

	// Run Function one time after last call
	F.once = function(ms, scope) {
		var tick, args
		, fn = this
		return function() {
			if (scope === undef) scope = this
			clearTimeout(tick)
			args = arguments
			tick = setTimeout(function() {
				fn.apply(scope, args)
			}, ms)
		}
	}

	// Maximum call rate for Function
	// leading edge, trailing edge
	F.rate = function(ms, last_call, scope) {
		var tick, args
		, fn = this
		, next = 0
		if (last_call && typeof last_call !== "function") last_call = fn
		return function() {
			if (scope === undef) scope = this
			var now = Date.now()
			clearTimeout(tick)
			if (now >= next) {
				next = now + ms
				fn.apply(scope, arguments)
			} else if (last_call) {
				args = arguments
				tick = setTimeout(function() {
					last_call.apply(scope, args)
				}, next - now)
			}
		}
	}
}(Function.prototype)
!function(exports, Object) {
	var undef
	, P = "prototype"
	, A = Array[P]
	, F = Function[P]
	, S = String[P]
	, N = Number[P]
	, slice = F.call.bind(A.slice)
	, fns = {}
	, hasOwn = fns.hasOwnProperty
	, fnRe = /('|")(?:\\?.)*?\1|\/(?:\\?.)+?\/[gim]*|\b(?:false|in|new|null|this|true|typeof|void|function|var|if|else|return)\b|\.\w+|\w+:/g
	, formatRe = /{(?!\\)((?:("|')(?:\\?.)*?\2|\\}|[^}])*)}/g
	, numbersRe = /-?\d+\.?\d*/g
	, wordRe = /\b[a-z_$][\w$]*/ig
	, unescapeRe = /{\\/g


	exports.Fn = Fn
	Fn.hold = hold
	Fn.wait = wait


	// Function extensions
	// -------------------

	F.extend = function() {
		var arg
		, fn = this
		, i = 0

		function wrapper() {
			return fn.apply(this, arguments)
		}

		for (wrapper[P] = Object.create(fn[P]); arg = arguments[i++]; ) {
			Object.assign(wrapper[P], arg)
		}
		wrapper[P].constructor = wrapper
		return wrapper
	}


	// Non-standard
	Object.each = function(obj, fn, scope, key) {
		if (obj) for (key in obj) {
			hasOwn.call(obj, key) && fn.call(scope, obj[key], key, obj)
		}
	}

	// Chrome54, FF47, Edge14, Safari10.1
	Object.values = function(obj) {
		return Object.keys(obj || {}).map(function(e) {
			return obj[e]
		})
	}

	// Non-standard
	// IE<9 bug: [1,2].splice(0).join("") == "" but should be "12"
	A.remove = arrayRemove
	function arrayRemove() {
		var arr = this
		, len = arr.length
		, o = slice(arguments)
		, lastId = -1

		for (; len--; ) if (~o.indexOf(arr[len])) {
			arr.splice(lastId = len, 1)
		}
		return lastId
	}

	A.each = A.forEach
	// uniq
	// first item preserved
	A.uniq = function() {
		for (var a = this, i = a.length; i--; ) {
			if (a.indexOf(a[i]) !== i) a.splice(i, 1)
		}
		return a
	}

	A.pushUniq = function(item) {
		return this.indexOf(item) < 0 && this.push(item)
	}

	// THANKS: Oliver Steele - Functional Javascript [http://www.osteele.com/sources/javascript/functional/]
	function Fn(expr /*, scope, mask1, ..maskN */) {
		var args = []
		, arr = expr.match(/[^"']+?->|[\s\S]+$/g)
		, scope = slice(arguments, 1)
		, key = scope.length + ":" + expr
		, fn = fns[key]

		if (!fn) {
			fn = expr.replace(fnRe, "").match(wordRe) || []
			for (; arr.length > 1; ) {
				expr = arr.pop()
				args = arr.pop().match(/\w+/g) || []
				arrayRemove.apply(fn, args)
				if (arr.length) {
					arr.push("function(" + args + "){return(" + expr + ")}" + (scope[0] ? ".bind(this)" : ""))
				}
			}
			expr = "return(" + expr + ")"

			if (scope[0]) {
				arr = Object.keys(scope).map(Fn("a->'__'+a"))
				arr[0] = "this"
				expr = (
					fn[0] ?
					"var " + fn.uniq().join("='',") + "='';" :
					""
				) + "with(" + arr.join(")with(") + "){" + expr + "}"
				args = arr.slice(1).concat(args)
			}

			fn = fns[key] = Function(args, expr)
		}

		return scope.length ? fn.bind.apply(fn, scope) : fn
	}

	Fn.keys = function(str) {
		var i, tmp
		, arr = []
		, match = str.match(formatRe)
		if (match) {
			for (i = match.length; i--; ) {
				if (tmp = match[i].replace(fnRe, "").match(wordRe)) {
					arr.push.apply(arr, tmp)
				}
			}
		}
		return arr.uniq()
	}

	S.format = function() {
		var args = A.slice.call(arguments)
		args.unshift(0)
		return this.replace(formatRe, function(_, arg) {
			args[0] = arg.replace(/\\}/g, "}")
			return Fn.apply(null, args)()
		}).replace(unescapeRe, "{")
	}

	N.format = function(data) {
		return "" + this
	}

	S.safe = function() {
		return this
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\"/g, "&quot;")
	}

	S.capitalize = function() {
		return this.charAt(0).toUpperCase() + this.slice(1)
	}

	S.lower = S.toLowerCase
	S.upper = S.toUpperCase

	N.step = function(a, add) {
		var x = ("" + a).split(".")
		, steps = this / a
		, n = ~~(steps + ((steps < 0 ? -1 : 1) * (add == undef ? .5 : add === 1 && steps == (steps|0) ? 0 : +add))) * a
		return "" + (1 in x ? n.toFixed(x[1].length) : n)
	}

	S.step = function(a, add) {
		return this.replace(numbersRe, function(num) {
			return (+num).step(a, add)
		})
	}

	N.scale = words([1000, 1000, 1000], ["","k","M","G"], {"default": "{n}{u}"})

	S.scale = function() {
		return this.replace(numbersRe, function(num) {
			return (+num).scale()
		})
	}

	S.pick = N.pick = function() {
		var val = this + "="
		for (var s, a = arguments, i = 0, len = a.length; i < len;) {
			s = a[i++]
			if (s.indexOf(val) == 0) {
				s = s.slice(val.length)
				i = len
			}
		}
		return s.replace("#", this)
	}

	S.plural = N.plural = function() {
		// Plural-Forms: nplurals=2; plural=n != 1;
		// http://www.gnu.org/software/gettext/manual/html_mono/gettext.html#Plural-forms
		return arguments[ +Fn("n->" + (String.plural || "n!=1"))( parseFloat(this) ) ].replace("#", this)
	}

	A.pluck = function(name) {
		for (var arr = this, i = arr.length, out = []; i--; ) {
			out[i] = arr[i][name]
		}
		return out
	}

	function words(steps, units, strings, overflow) {
		return function(input) {
			var n = +(arguments.length ? input : this)
			, i = 0
			, s = strings || {"default": "{n} {u}{s}"}

			for (; n>=steps[i]; ) {
				n /= steps[i++]
			}
			if (i == steps.length && overflow) {
				return overflow(this)
			}
			i = units[i]
			return (s[n < 2 ? i : i + "s"] || s["default"]).format({n: n, u: i, s: n < 2 ? "" : "s"})
		}
	}
	Fn.words = words

	function wait(fn) {
		var pending = 1
		function resume() {
			if (!--pending && fn) fn.call(this)
		}
		resume.wait = function() {
			pending++
			return resume
		}
		return resume
	}

	function hold(ignore) {
		var k
		, obj = this
		, hooks = []
		, hooked = []
		, _resume = wait(resume)
		ignore = ignore || obj.syncMethods || []

		for (k in obj) if (typeof obj[k] == "function" && ignore.indexOf(k) < 0) !function(k) {
			hooked.push(k, hasOwn.call(obj, k) && obj[k])
			obj[k] = function() {
				hooks.push(k, arguments)
				return obj
			}
		}(k)

		/**
		 * `wait` is already in hooked array,
		 * so override hooked method
		 * that will be cleared on resume.
		 */
		obj.wait = _resume.wait

		return _resume

		function resume() {
			for (var v, scope = obj, i = hooked.length; i--; i--) {
				if (hooked[i]) obj[hooked[i-1]] = hooked[i]
				else delete obj[hooked[i-1]]
			}
			// i == -1 from previous loop
			for (; v = hooks[++i]; ) {
				scope = scope[v].apply(scope, hooks[++i]) || scope
			}
			hooks = hooked = null
		}
	}

}(this, Object)
!function(exports) {
	var empty = []
	, Event = exports.Event || exports

	Event.Emitter = EventEmitter
	Event.asEmitter = asEmitter

	function EventEmitter() {}

	function asEmitter(obj) {
		obj.on = on
		obj.off = off
		obj.one = one
		obj.emit = emit
		obj.listen = listen
		obj.unlisten = unlisten
	}
	asEmitter(EventEmitter.prototype)

	function on(type, fn, scope, _origin) {
		var emitter = this === exports ? empty : this
		, events = emitter._e || (emitter._e = Object.create(null))
		if (type && fn) {
			if (typeof fn === "string") fn = emit.bind(emitter, fn)
			emit.call(emitter, "newListener", type, fn, scope, _origin)
			;(events[type] || (events[type] = [])).unshift(scope, _origin, fn)
		}
		return this
	}

	function off(type, fn, scope) {
		var i, args
		, emitter = this === exports ? empty : this
		, events = emitter._e && emitter._e[type]
		if (events) {
			for (i = events.length - 2; i > 0; i -= 3) {
				if ((events[i + 1] === fn || events[i] === fn) && events[i - 1] == scope) {
					args = events.splice(i - 1, 3)
					emit.call(emitter, "removeListener", type, args[2], args[0], args[1])
					if (fn) break
				}
			}
		}
		return this
	}

	function one(type, fn, scope) {
		var emitter = this === exports ? empty : this
		function remove() {
			off.call(emitter, type, fn, scope)
			off.call(emitter, type, remove, scope)
		}
		on.call(emitter, type, remove, scope)
		on.call(emitter, type, fn, scope)
		return this
	}

	// emitNext
	// emitLate

	function emit(type) {
		var args, i
		, emitter = this === exports ? empty : this
		, _e = emitter._e
		, arr = _e ? (_e[type] || empty).concat(_e["*"] || empty) : empty
		if (i = _e = arr.length) {
			for (args = arr.slice.call(arguments, 1); i--; ) {
				arr[i--].apply(arr[--i] || emitter, args)
			}
		}
		return _e / 3
	}

	function listen(emitter, ev, fn, scope, _origin) {
		if (emitter) {
			on.call(emitter, ev, fn, scope)
			;(this._l || (this._l = [])).push([emitter, ev, fn, scope, _origin])
		}
		return this
	}

	function unlisten(key) {
		var a, i
		, listening = this._l
		if (listening) for (i = listening.length; i--; ) {
			a = listening[i]
			if (key === "*" || a.indexOf(key) > -1) {
				listening.splice(i, 1)
				off.call(a[0], a[1], a[2], a[3])
			}
		}
		return this
	}

// `this` refers to the `window` in browser and to the `exports` in Node.js.
}(this)
/* litejs.com/MIT-LICENSE.txt */



!function(window, document, history, location) {
	var cb, base, lastRoute, iframe, tick, last
	, cleanRe = /^[#\/\!]+|[\s\/]+$/g

	// The JScript engine used in IE doesn't recognize vertical tabulation character
	// http://webreflection.blogspot.com/2009/01/32-bytes-to-know-if-your-browser-is-ie.html
	// oldIE = "\v" == "v"
	//
	// The documentMode is an IE only property, supported in IE8+.
	//
	// Starting in Internet Explorer 9 standards mode, Internet Explorer 10 standards mode,
	// and win8_appname_long apps, you cannot identify the browser as Internet Explorer
	// by testing for the equivalence of the vertical tab (\v) and the "v".
	// In earlier versions, the expression "\v" === "v" returns true.
	// In Internet Explorer 9 standards mode, Internet Explorer 10 standards mode,
	// and win8_appname_long apps, the expression returns false.
	, ie6_7 = !+"\v1" && (document.documentMode | 0) < 8

	function getUrl(_loc) {
		return (
			/*** PUSH ***/
			base ? location.pathname.slice(base.length) :
			/**/
			// bug in Firefox where location.hash is decoded
			// bug in Safari where location.pathname is decoded

			// var hash = location.href.split('#')[1] || '';
			// https://bugs.webkit.org/show_bug.cgi?id=30225
			// https://github.com/documentcloud/backbone/pull/967
			(_loc || location).href.split("#")[1] || ""
		).replace(cleanRe, "")
	}

	function setUrl(url, replace) {
		/*** PUSH ***/
		if (base) {
			history[replace ? "replaceState" : "pushState"](null, null, base + url)
		} else {
		/**/
			location[replace ? "replace" : "assign"]("#" + url)
			// Opening and closing the iframe tricks IE7 and earlier
			// to push a history entry on hash-tag change.
			if (iframe && getUrl() !== getUrl(iframe.location) ) {
				iframe.location[replace ? "replace" : iframe.document.open().close(), "assign"]("#" + url)
			}
		/*** PUSH ***/
		}
		/**/
		checkUrl()
	}

	function checkUrl() {
		if (lastRoute != (lastRoute = getUrl()) && cb) {
			cb(lastRoute)
		}
	}

	history.getUrl = getUrl
	history.setUrl = setUrl

	history.start = function(_cb) {
		cb = _cb
		/*** PUSH ***/
		// Chrome5, Firefox4, IE10, Safari5, Opera11.50
		var url
		, _base = document.documentElement.getElementsByTagName("base")[0]
		if (_base) _base = _base.href.replace(/.*:\/\/[^/]*|[^\/]*$/g, "")
		if (_base && !history.pushState) {
			url = location.pathname.slice(_base.length)
			if (url) {
				location.replace(_base + "#" + url)
			}
		}
		if (_base && history.pushState) {
			base = _base

			url = location.href.split("#")[1]
			if (url && !getUrl()) {
				setUrl(url, 1)
			}

			// Chrome and Safari emit a popstate event on page load, Firefox doesn't.
			// Firing popstate after onload is as designed.
			//
			// See the discussion on https://bugs.webkit.org/show_bug.cgi?id=41372,
			// https://code.google.com/p/chromium/issues/detail?id=63040
			// and the change to the HTML5 spec that was made:
			// http://html5.org/tools/web-apps-tracker?from=5345&to=5346.
			window.onpopstate = checkUrl
		} else
		/**/
			if ("onhashchange" in window && !ie6_7) {
			// There are onhashchange in IE7 but its not get emitted
			//
			// Basic support:
			// Chrome 5.0, Firefox 3.6, IE 8, Opera 10.6, Safari 5.0
			window.onhashchange = checkUrl
		} else {
			if (ie6_7 && !iframe) {
				// IE<9 encounters the Mixed Content warning when the URI javascript: is used.
				// IE5/6 additionally encounters the Mixed Content warning when the URI about:blank is used.
				// src="//:"
				iframe = document.body.appendChild(document.createElement('<iframe class="hide" tabindex="-1">')).contentWindow
			}
			clearInterval(tick)
			tick = setInterval(function(){
				var cur = getUrl()
				if (iframe && last === cur) cur = getUrl(iframe.location)
				if (last !== cur) {
					last = cur
					iframe ? setUrl(cur) : checkUrl()
				}
			}, 60)
		}
		checkUrl()
	}
}(this, document, history, location)
/* litejs.com/MIT-LICENSE.txt */



!function(exports) {
	var fn, lastView, lastParams, lastStr, lastUrl, syncResume
	, isArray = Array.isArray
	, capture = 1
	, fnStr = ""
	, reStr = ""
	, views = View.views = {}
	, paramCb = {}
	, hasOwn = views.hasOwnProperty
	, escapeRe = /[.*+?^=!:${}()|\[\]\/\\]/g
	, parseRe = /\{([\w%.]+?)\}|.[^{\\]*?/g
	, defaults = {
		base: "view/",
		home: "home",
		root: document.body
	}

	exports.View = View
	exports.LiteJS = LiteJS


	function LiteJS(_opts) {
		var key, name
		, opts = Object.assign({}, defaults, _opts)
		for (key in opts) if (hasOwn.call(opts, key)) {
			if (typeof View[key] == "function") {
				for (name in opts[key]) if (hasOwn.call(opts[key], name)) {
					View[key](name, opts[key][name])
				}
			} else {
				View[key] = opts[key]
			}
		}
		View("#body", opts.root)
		return View
	}

	function View(route, el, parent) {
		var view = views[route]
		if (view) {
			if (el) {
				view.el = el
				view.parent = parent && View(parent)
			}
			return view
		}
		view = this
		if (!(view instanceof View)) return new View(route, el, parent)
		views[view.route = route] = view
		view.el = el
		view.parent = parent && View(parent)

		if (route.charAt(0) != "#") {
			var params = "m[" + (view.seq = capture++) + "]?("
			, _re = route.replace(parseRe, function(_, key) {
				return key ?
					(params += "o['" + key + "']=m[" + (capture++) + "],") && "([^/]+?)" :
					_.replace(escapeRe, "\\$&")
			})

			fnStr += params + "'" + route + "'):"
			reStr += (reStr ? "|(" : "(") + _re + ")"
			fn = 0
		}
	}

	View.prototype = {
		show: function(_params) {
			var parent
			, params = lastParams = _params || {}
			, view = lastView = this
			, tmp = params._v || view
			, close = view.isOpen && view

			View.route = view.route

			for (; tmp; tmp = parent) {
				emit(syncResume = params._v = tmp, "ping", params, View)
				syncResume = null
				if (lastParams != params) return
				if (parent = tmp.parent) {
					if (parent.child && parent.child != tmp) {
						close = parent.child
					}
					parent.child = tmp
				}
				if (!tmp.el) {
					if (tmp.file) {
						xhr.load(
							tmp.file
							.replace(/^|,/g, "$&" + (View.base || ""))
							.split(","),
							view.wait()
						)
						tmp.file = null
					} else {
						View("404").show(Object.assign({}, params))
					}
					return
				}
			}

			if (view !== close) emit(view, "change", close)

			for (tmp in params) if (tmp.charAt(0) != "_") {
				if (syncResume = hasOwn.call(paramCb, tmp) && paramCb[tmp] || paramCb["*"]) {
					syncResume.call(view, params[tmp], tmp, params)
					syncResume = null
				}
			}

			bubbleDown(params, close)
		},
		wait: function() {
			var params = lastParams
			params._p = 1 + (params._p | 0)
			return function() {
				if (--params._p || lastParams != params || syncResume) return
				if (params._d) {
					bubbleDown(params)
				} else if (params._v) {
					lastView.show(params)
				}
			}
		}
	}

	function bubbleDown(params, close) {
		var tmp
		, view = params._v
		, parent = view && view.parent
		if (!view || params._p && /{/.test(view.route)) {
			return closeView(close)
		}
		if (parent && !view.isOpen || view === close) {
			closeView(close, view)
			El.scope(
				view.isOpen = view.el.cloneNode(true),
				El.scope(tmp = parent.isOpen || parent.el)
			)
			El.append(tmp, view.isOpen)
			El.render(view.isOpen)
			emit(parent, "openChild", view, close)
			emit(view, "open", params)
			if (view.kb) El.addKb(view.kb)
			close = null
		}
		if (params._d = params._v = view.child) {
			bubbleDown(params, close)
		}
		if (lastView == view) {
			emit(view, "show", params)
			blur()
		}
	}

	function closeView(view, open) {
		if (view && view.isOpen) {
			emit(view.parent, "closeChild", view, open)
			closeView(view.child)
			El.kill(view.isOpen)
			view.isOpen = null
			if (view.kb) El.rmKb(view.kb)
			emit(view, "close")
		}
	}

	function emit(view, event, a, b) {
		view.emit(event, a, b)
		View.emit(event, view, a, b)
	}

	Event.asEmitter(View)
	Event.asEmitter(View.prototype)

	View.get = get
	function get(url, params) {
		if (!fn) {
			fn = Function(
				"var r=/^\\/?(?:" + reStr + ")[\\/\\s]*$/;" +
				"return function(i,o,d){var m=r.exec(i);return m!==null?(" + fnStr + "d):d}"
			)()
		}
		return View(fn(url || View.home, params || {}, "404"))
	}

	View.ping = function(name, fn) {
		View(name).on("ping", fn)
	}

	View.show = function(url, _params) {
		if (url === true) {
			url = lastUrl
			lastUrl = 0
		}
		var params = _params || {}
		, view = get(url, params)
		if (!view.isOpen || lastUrl != url) {
			params._u = lastUrl = url
			view.show(El.data.params = params)
		}
	}

	View.param = function(name, cb, re) {
		;(isArray(name) ? name : name.split(/\s+/)).forEach(function(n) {
			paramCb[n] = cb
		})
	}

	View.def = function(str) {
		for (var match, re = /(\S+) (\S+)/g; match = re.exec(str);) {
			match[1].split(",").map(function(view) {
				view = View(expand(view, lastStr))
				view.file = (view.file ? view.file + "," : "") +
				match[2].split(",").map(function(file) {
					return views[file] ? views[file].file : expand(file, lastStr)
				})
			})
		}
	}

	View.blur = blur
	function blur() {
		// When a View completes, blur focused link
		// IE8 can throw an exception for document.activeElement.
		try {
			var el = document.activeElement
			, tag = el && el.tagName
			if (tag === "A" || tag === "BUTTON") el.blur()
		} catch(e) {}
	}

	View.expand = expand
	function expand(str, _last) {
		var chr = str.charAt(0)
		, slice = str.slice(1)
		, last = _last || lastUrl
		return (
			chr === "+" ? last + slice :
			chr === "%" ? ((chr = last.lastIndexOf(slice.charAt(0))), (chr > 0 ? last.slice(0, chr) : last)) + slice :
			(lastStr = str)
		)
	}

}(this)
/* litejs.com/MIT-LICENSE.txt */



!function(window, document, Object, Event, protoStr) {
	var styleNode
	, BIND_ATTR = "data-bind"
	, isArray = Array.isArray
	, seq = 0
	, elCache = El.cache = {}
	, wrapProto = []
	, slice = wrapProto.slice
	, hasOwn = elCache.hasOwnProperty
	, body = document.body
	, root = document.documentElement
	, txtAttr = El.T = "textContent" in body ? "textContent" : "innerText"
	, templateRe = /^([ \t]*)(%?)((?:("|')(?:\\?.)*?\4|[-\w:.#[\]]=?)*)[ \t]*([>^;@|\\\/]|!?=|)(([\])}]?).*?([[({]?))$/gm
	, renderRe = /[;\s]*(\w+)(?:\s*(:?):((?:(["'\/])(?:\\?.)*?\3|[^;])*))?/g
	, selectorRe = /([.#:[])([-\w]+)(?:\((.+?)\)|([~^$*|]?)=(("|')(?:\\?.)*?\6|[-\w]+))?]?/g
	, splitRe = /[,\s]+/
	, camelRe = /\-([a-z])/g
	, bindings = El.bindings = {
		attr: setAttr,
		cls: El.cls = acceptMany(cls),
		css: El.css = acceptMany(function(el, key, val) {
			el.style[key.replace(camelRe, camelFn)] = "" + val || ""
		}, function(el, key) {
			return getComputedStyle(el).getPropertyValue(key)
		}),
		data: function(el, key, val) {
			setAttr(el, "data-" + key, val)
		},
		html: function(el, html) {
			el.innerHTML = html
		},
		ref: function(el, name) {
			this[name] = el
		},
		txt: El.txt = function(el, txt) {
			// In Safari 2.x, innerText results an empty string
			// when style.display=="none" or node is not in dom
			//
			// innerText is implemented in IE4, textContent in IE9
			// Opera 9-10 have Node.text

			if (el[txtAttr] !== txt) el[txtAttr] = txt
		},
		val: El.val = valFn,
		"with": function(el, map) {
			var scope = elScope(el, this)
			Object.assign(scope, map)
			if (scope !== this) {
				render(el)
				return true
			}
		}
	}
	, bindMatch = []
	, scopeData = El.data = {
		_: String,
		_b: bindings,
		El: El,
		history: history,
		View: View
	}
	// After iOS 13 iPad with default enabled "desktop" option
	// is the only Macintosh with multi-touch
	, iOS = /^(Mac|iP)/.test(navigator.platform)
	// || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

	/*** ie8 ***/

	// JScript engine in IE<9 does not recognize vertical tabulation character
	, ie678 = !+"\v1"
	, ie67 = ie678 && (document.documentMode | 0) < 8

	El.matches = function(el, sel) {
		return el && body.matches.call(el, sel)
	}
	El.closest = function(el, sel) {
		return el && body.closest.call(el.closest ? el : el.parentNode, sel)
	}
	El.find = function(el, sel) {
		return body.querySelector.call(el, sel)
	}
	El.findAll = function(el, sel) {
		return new ElWrap(body.querySelectorAll.call(el, sel))
	}

	/**
	 * Turns CSS selector like syntax to DOM Node
	 * @returns {Node}
	 *
	 * @example
	 * El("input#12.nice[type=checkbox]:checked:disabled[data-lang=en].class")
	 * <input id="12" class="nice class" type="checkbox" checked="checked" disabled="disabled" data-lang="en">
	 */

	window.El = El

	function El(name) {
		if (typeof name != "string") {
			return new ElWrap(name)
		}
		var el, pres
		, pre = {}
		name = name.replace(selectorRe, function(_, op, key, _sub, fn, val, quotation) {
			pres = 1
			val = quotation ? val.slice(1, -1) : val || key
			pre[op =
				op == "." ?
				(fn = "~", "class") :
				op == "#" ?
				"id" :
				key
			] = fn && pre[op] ?
				fn == "^" ? val + pre[op] :
				pre[op] + (fn == "~" ? " " : "") + val :
				val
			return ""
		}) || "div"

		// NOTE: IE-s cloneNode consolidates the two text nodes together as one
		// http://brooknovak.wordpress.com/2009/08/23/ies-clonenode-doesnt-actually-clone/
		el = (elCache[name] || (elCache[name] = document.createElement(name))).cloneNode(true)

		if (pres) {
			setAttr(el, pre)
		}

		return el
	}

	function ElWrap(nodes) {
		var wrap = this
		, i = nodes.length
		/**
		 *  1. Extended array size will not updated
		 *     when array elements set directly in Android 2.2.
		 */
		if (i) {
			wrap.length = i /* 1 */
			for (; i--; ) {
				wrap[i] = nodes[i]
			}
		} else if (i == null) {
			wrap.length = 1 /* 1 */
			wrap[0] = nodes
		}
	}

	ElWrap[protoStr] = wrapProto

	function camelFn(_, a) {
		return a.toUpperCase()
	}

	El.attr = function(el, key, val) {
		return arguments.length < 3 && key.constructor != Object ? getAttr(el, key) : setAttr(el, key, val)
	}

	function getAttr(el, key) {
		return el && el.getAttribute && el.getAttribute(key)
	}

	function setAttr(el, key, val) {
		var current

		if (key && key.constructor == Object) {
			for (current in key) {
				setAttr(el, current, key[current])
			}
			return
		}

		/* Accept namespaced arguments
		var namespaces = {
			xlink: "http://www.w3.org/1999/xlink",
			svg: "http://www.w3.org/2000/svg"
		}

		current = key.split("|")
		if (current[1]) {
			el.setAttributeNS(namespaces[current[0]], current[1], val)
			return
		}
		*/

		current = el.getAttribute(key)

		// Note: IE5-7 doesn't set styles and removes events when you try to set them.
		//
		// in IE6, a label with a for attribute linked to a select list
		// will cause a re-selection of the first option instead of just giving focus.
		// http://webbugtrack.blogspot.com/2007/09/bug-116-for-attribute-woes-in-ie6.html

		// there are bug in IE<9 where changed 'name' param not accepted on form submit
		// IE8 and below support document.createElement('<P>')
		//
		// http://www.matts411.com/post/setting_the_name_attribute_in_ie_dom/
		// http://msdn.microsoft.com/en-us/library/ms536614(VS.85).aspx

		/*** ie8 ***/
		// istanbul ignore next: IE fix
		if (ie67 && (key == "id" || key == "name" || key == "checked")) {
			el.mergeAttributes(document.createElement('<INPUT ' + key + '="' + val + '">'), false)
		} else
		/**/
		if (key == "class") {
			cls(el, val)
		} else if (val || val === 0) {
			if (current != val) {
				el.setAttribute(key, val)
			}
		} else if (current) {
			el.removeAttribute(key)
		}
	}

	function valFn(el, val) {
		var input, step, key, value
		, i = 0
		, type = el.type
		, opts = el.options
		, checkbox = type === "checkbox" || type === "radio"

		if (el.tagName === "FORM") {
			opts = {}

			// Disabled controls do not receive focus,
			// are skipped in tabbing navigation, cannot be successfully posted.
			//
			// Read-only elements receive focus but cannot be modified by the user,
			// are included in tabbing navigation, are successfully posted.
			//
			// Read-only checkboxes can be changed by the user

			for (; input = el.elements[i++]; ) if (!input.disabled && (key = input.name || input.id)) {
				value = valFn(input)
				if (value !== void 0) {
					step = opts
					key.replace(/\[(.*?)\]/g, function(_, _key, offset) {
						if (step == opts) key = key.slice(0, offset)
						step = step[key] || (step[key] = step[key] === null || _key && +_key != _key ? {} : [])
						key = _key
					})
					step[key || step.length] = value
				}
			}

			return opts
		}

		if (arguments.length > 1) {
			if (opts) {
				value = (isArray(val) ? val : [ val ]).map(String)
				for (; input = opts[i++]; ) {
					input.selected = value.indexOf(input.value) > -1
				}
			} else if (el.val) {
				el.val(val)
			} else {
				checkbox ? (el.checked = !!val) : (el.value = val)
			}
			return
		}

		if (opts) {
			if (type === "select-multiple") {
				for (val = []; input = opts[i++]; ) {
					if (input.selected && !input.disabled) {
						val.push(input.valObject || input.value)
					}
				}
				return val
			}
			// IE8 throws error when accessing to options[-1]
			value = el.selectedIndex
			el = value > -1 && opts[value] || el
		}

		return checkbox && !el.checked ?
		(type === "radio" ? void 0 : null) :
		el.valObject !== void 0 ? el.valObject : el.value
	}

	function append(el, child, before) {
		if (!el.nodeType) {
			return el.append ? el.append(child, before) : el
		}
		var fragment
		, i = 0
		, tmp = typeof child
		if (child) {
			if (tmp == "string" || tmp == "number") child = document.createTextNode(child)
			else if ( !("nodeType" in child) && "length" in child ) {
				// document.createDocumentFragment is unsupported in IE5.5
				// fragment = "createDocumentFragment" in document ? document.createDocumentFragment() : El("div")
				for (
					tmp = child.length
					, fragment = document.createDocumentFragment();
					i < tmp; ) append(fragment, child[i++])
				child = fragment
			}

			if (child.nodeType) {
				tmp = el.insertBefore ? el : el[el.length - 1]
				if (i = getAttr(tmp, "data-child")) {
					before = findCom(tmp, i) || tmp
					tmp = before.parentNode
					// TODO:2016-07-05:lauri:handle numeric befores
				}
				/*** debug ***/
				if (tmp.namespaceURI && child.namespaceURI && tmp.namespaceURI !== child.namespaceURI && child.tagName !== "svg") {
					console.error("NAMESPACE CHANGE!", tmp.namespaceURI, child.namespaceURI, child)
				}
				/**/
				tmp.insertBefore(child,
					(before === true ? tmp.firstChild :
					typeof before == "number" ? tmp.childNodes[
						before < 0 ? tmp.childNodes.length - before - 2 : before
					] : before) || null
				)
			}
		}
		return el
	}

	function findCom(node, val) {
		for (var next, el = node.firstChild; el; ) {
			if (el.nodeType === 8 && el.nodeValue == val) return el
			next = el.firstChild || el.nextSibling
			while (!next && ((el = el.parentNode) !== node)) next = el.nextSibling
			el = next
		}
	}

	function acceptMany(fn, getter) {
		return function f(el, name, val, delay) {
			if (el && name) {
				if (delay > 0) return setTimeout(f, delay, el, name, val)
				if (name.constructor === Object) {
					for (i in name) {
						if (hasOwn.call(name, i)) f(el, i, name[i])
					}
					return
				}
				var names = isArray(name) ? name : name.split(splitRe)
				, i = 0
				, len = names.length

				if (arguments.length < 3) {
					if (getter) return getter(el, name)
					for (; i < len; ) fn(el, names[i++])
				} else {
					/*
					if (isArray(val)) {
						for (; i < len; ) fn(el, names[i], val[i++])
					} else {
						for (; i < len; ) fn(el, names[i++], val)
					}
					/*/
					for (; i < len; ) {
						fn(el, names[i++], isArray(val) ? val[i - 1] : val)
					}
					//*/
				}
			}
		}
	}

	// setAttribute("class") is broken in IE7
	// className is object in SVGElements

	El.hasClass = hasClass
	function hasClass(el, name) {
		var current = el.className || ""

		if (typeof current !== "string") {
			current = el.getAttribute("class") || ""
		}

		return !!current && current.split(splitRe).indexOf(name) > -1
	}

	function cls(el, name, set) {
		var current = el.className || ""
		, useAttr = typeof current !== "string"

		if (useAttr) {
			current = el.getAttribute("class") || ""
		}

		if (arguments.length < 3 || set) {
			if (current) {
				name = current.split(splitRe).indexOf(name) > -1 ? current : current + " " + name
			}
		} else {
			name = current ? (" " + current + " ").replace(" " + name + " ", " ").trim() : current
		}

		if (current != name) {
			if (useAttr) {
				el.setAttribute("class", name)
			} else {
				el.className = name
			}
		}
	}

	// The addEventListener is supported in Internet Explorer from version 9.
	// https://developer.mozilla.org/en-US/docs/Web/Reference/Events/wheel
	// - IE8 always prevents the default of the mousewheel event.

	var addEv = "addEventListener"
	, remEv = "removeEventListener"
	, prefix = window[addEv] ? "" : (addEv = "attachEvent", remEv = "detachEvent", "on")
	, fixEv = Event.fixEv || (Event.fixEv = {})
	, fixFn = Event.fixFn || (Event.fixFn = {})
	, emitter = new Event.Emitter

	if (iOS) {
		// iOS doesn't support beforeunload, use pagehide instead
		fixEv.beforeunload = "pagehide"
	}

	function addEvent(el, ev, _fn) {
		var fn = fixFn[ev] && fixFn[ev](el, _fn, ev) || _fn
		, fix = prefix ? function() {
			var e = new Event(ev)
			if (e.clientX !== void 0) {
				e.pageX = e.clientX + scrollLeft()
				e.pageY = e.clientY + scrollTop()
			}
			fn.call(el, e)
		} : fn

		if (fixEv[ev] !== "") {
			el[addEv](prefix + (fixEv[ev] || ev), fix, false)
		}

		emitter.on.call(el, ev, fix, el, _fn)
	}

	function rmEvent(el, ev, fn) {
		var evs = el._e && el._e[ev]
		, id = evs && evs.indexOf(fn)
		if (id > -1) {
			if (fn !== evs[id + 1] && evs[id + 1]._rm) {
				evs[id + 1]._rm()
			}
			el[remEv](prefix + (fixEv[ev] || ev), evs[id + 1])
			evs.splice(id - 1, 3)
		}
	}

	Event.stop = function(e) {
		if (e && e.preventDefault) {
			e.stopPropagation()
			e.preventDefault()
		}
		return false
	}

	function bindingOn(el, events, selector, data, handler, delay) {
		var argi = arguments.length
		if (argi == 3 || argi == 4 && typeof data == "number") {
			delay = data
			handler = selector
			selector = data = null
		} else if (argi == 4 || argi == 5 && typeof handler == "number") {
			delay = handler
			handler = data
			if (typeof selector == "string") {
				data = null
			} else {
				data = selector
				selector = null
			}
		}
		if (delay > 0) return setTimeout(bindingOn, delay, el, events, selector, data, handler)
		var fn = (
			typeof handler == "string" ? function(e) {
				var target = selector ? El.closest(e.target, selector) : el
				if (target) View.emit.apply(View, [handler, e, target].concat(data))
			} :
			selector ? function(e) {
				if (El.matches(e.target, selector)) handler(e)
			} :
			handler
		)
		, names = isArray(events) ? events : events.split(splitRe)
		, i = 0
		, len = names.length

		for (; i < len; ) {
			addEvent(el, names[i++], fn)
		}
	}
	bindingOn.once = 1
	El.on = bindings.on = bindingOn
	El.off = acceptMany(rmEvent)

	El.one = function(el, ev, fn) {
		function remove() {
			rmEvent(el, ev, fn)
			rmEvent(el, ev, remove)
		}
		addEvent(el, ev, fn)
		addEvent(el, ev, remove)
		return el
	}

	El.emit = function(el, ev) {
		emitter.emit.apply(el, slice.call(arguments, 1))
	}

	function empty(el) {
		for (var node; node = el.firstChild; ) {
			kill(node)
		}
		return el
	}

	function kill(el) {
		var id
		if (el) {
			if (el._e) {
				emitter.emit.call(el, "kill")
				for (id in el._e) rmEvent(el, id)
			}
			if (el.parentNode) {
				el.parentNode.removeChild(el)
			}
			if (el.nodeType != 1) {
				return el.kill && el.kill()
			}
			empty(el)
			if (id = el._scope) {
				delete elScope[id]
			}
			if (el.valObject) {
				el.valObject = null
			}
		}
	}

	function elScope(node, parent, fb) {
		return elScope[node._scope] || fb || (
			parent ?
			(((fb = elScope[node._scope = ++seq] = Object.create(parent))._super = parent), fb) :
			closestScope(node)
		) || scopeData

	}

	function closestScope(node) {
		for (; node = node.parentNode; ) {
			if (node._scope) return elScope[node._scope]
		}
	}

	function render(node, _scope) {
		var bind, fn
		, scope = elScope(node, 0, _scope)
		, i = 0

		if (node.nodeType != 1) {
			node.render ? node.render(scope) : node
			return
		}

		if (bind = getAttr(node, BIND_ATTR)) {
			scope._m = bindMatch
			scope._t = bind
			// i18n(bind, lang).format(scope)
			// document.documentElement.lang
			// document.getElementsByTagName('html')[0].getAttribute('lang')

			fn = "data b s B r->data&&(" + bind.replace(renderRe, function(match, name, op, args) {
				scope._m[i] = match
				var fn = bindings[name]
				return (
					(op == ":" || fn && hasOwn.call(fn, "once")) ?
					"s(this,B,data._t=data._t.replace(data._m[" + (i++)+ "],''))||" :
					""
				) + (
					fn ?
					"b['" + name + "'].call(data,this" + (fn.raw ? ",'" + args + "'" : args ? "," + args : "") :
					"s(this,'" + name + "'," + args
				) + ")||"
			}) + "r)"

			try {
				if (Fn(fn, node, scope)(scope, bindings, setAttr, BIND_ATTR)) {
					return
				}
			} catch (e) {
				/*** debug ***/
				console.error(e)
				console.error("BINDING: " + bind, node)
				/**/
				if (window.onerror) {
					window.onerror(e.message, e.fileName, e.lineNumber)
				}
			}
		}

		for (bind = node.firstChild; bind; bind = fn) {
			fn = bind.nextSibling
			render(bind, scope)
		}
		/*** ie8 ***/
		if (ie678 && node.tagName == "SELECT") {
			node.parentNode.insertBefore(node, node)
		}
		/**/
	}

	El.empty = empty
	El.kill = kill
	El.render = render

	for (var key in El) !function(key) {
		wrapProto[key] = function wrap() {
			var i = 0
			, self = this
			, len = self.length
			, arr = slice.call(arguments)
			arr.unshift(1)
			for (; i < len; ) {
				arr[0] = self[i++]
				El[key].apply(null, arr)
			}
			return self
		}
	}(key)

	wrapProto.append = function(el) {
		var elWrap = this
		if (elWrap._childId != void 0) {
			append(elWrap[elWrap._childId], el)
		} else {
			elWrap.push(el)
		}
		return elWrap
	}

	wrapProto.cloneNode = function(deep) {
		var clone = new ElWrap(this.map(function(el) {
			return el.cloneNode(deep)
		}))
		clone._childId = this._childId
		return clone
	}

	El.append = append
	El.scope = elScope

	function parseTemplate(str) {
		var parent = El("div")
		, stack = [-1]
		, parentStack = []

		function work(all, indent, plugin, name, q, op, text, mapEnd, mapStart, offset) {
			if (offset && all === indent) return

			for (q = indent.length; q <= stack[0]; ) {
				if (parent.plugin) {
					parent.plugin.done()
				}
				parent = parentStack.pop()
				stack.shift()
			}

			if (parent._r) {
				parent.txt += all + "\n"
			} else if (plugin || mapStart && (name = "map")) {
				if (El.plugins[name]) {
					parentStack.push(parent)
					stack.unshift(q)
					parent = (new El.plugins[name](parent, op + text, mapEnd ? "" : ";")).el
				} else {
					append(parent, all)
				}
			} else if (mapEnd) {
				appendBind(parent, text, "")
			} else {
				if (name) {
					parentStack.push(parent)
					stack.unshift(q)
					append(parent, parent = q = El(name))
				}
				if (text && op != "/") {
					if (op == ">") {
						(indent + " " + text).replace(templateRe, work)
					} else if (op == "|" || op == "\\") {
						append(parent, text) // + "\n")
					} else {
						if (op == "@") {
							text = text.replace(/(\w+):?/, "on:'$1',")
						} else if (op != ";" && op != "^") {
							text = (parent.tagName == "INPUT" ? "val" : "txt") + (
								op == "=" ? ":" + text.replace(/'/g, "\\'") :
								":_('" + text.replace(/'/g, "\\'") + "', data)"
							)
						}
						appendBind(parent, text, ";", op)
					}
				}
			}
		}
		str.replace(templateRe, work)
		work("", "")
	}

	function appendBind(el, val, sep, q) {
		var current = getAttr(el, BIND_ATTR)
		setAttr(el, BIND_ATTR, (current ? (
			q == "^" ?
			val + sep + current :
			current + sep + val
		) : val))
	}

	function plugin(parent, name) {
		var t = this
		t.name = name
		t.parent = parent
		t.el = El("div")
		t.el.plugin = t
	}

	plugin[protoStr] = {
		_done: function() {
			var el, childId
			, t = this
			, childNodes = t.el.childNodes
			, i = childNodes.length

			for (; i--; ) {
				el = childNodes[i]
				if (el._childKey) {
					childId = i
					setAttr(el, "data-child", el._childKey)
					break
				}
			}

			if (childNodes[1]) {
				el = new ElWrap(childNodes)
				el._childId = childId
			} else {
				el = childNodes[0]
			}

			t.el.plugin = t.el = t.parent = null
			return el
		},
		done: function() {
			var t = this
			, parent = t.parent
			elCache[t.name] = t._done()
			return parent
		}
	}

	function js(parent, params, attr1) {
		var t = this
		// Raw text mode
		t._r = t.parent = parent
		t.txt = ""
		t.plugin = t.el = t
		t.params = params
		t.a = attr1
	}

	js[protoStr].done = Fn("Function(this.txt)()")

	El.plugins = {
		binding: js.extend({
			done: function() {
				Object.assign(bindings, Function("return({" + this.txt + "})")())
			}
		}),
		child: plugin.extend({
			done: function() {
				var key = "@child-" + (++seq)
				, root = this.parent
				for (; (root.parentNode.parentNode || key).nodeType == 1; ) {
					root = root.parentNode
				}
				root._childKey = key
				append(this.parent, document.createComment(key))
			}
		}),
		css: js.extend({
			done: Fn("xhr.css(this.txt)")
		}),
		def: js.extend({
			done: Fn("View.def(this.params||this.txt)")
		}),
		each: js.extend({
			done: function() {
				var txt = this.txt

				JSON.parse(this.params)
				.each(function(val) {
					if (!val || val.constructor != Object) {
						val = { item: val }
					}
					parseTemplate(txt.format(val))
				})
			}
		}),
		el: plugin,
		js: js,
		map: js.extend({
			done: function() {
				var self = this
				, txt = (self.params + self.txt)
				appendBind(
					self.parent,
					self.a ? txt.slice(1) : txt,
					self.a
				)
			}
		}),
		template: plugin,
		view: plugin.extend({
			done: function() {
				var fn
				, t = this
				, arr = t.name.split(splitRe)
				, bind = getAttr(t.el, BIND_ATTR)
				, view = View(arr[0], t._done(), arr[1], arr[2])
				if (bind) {
					fn = bind.replace(renderRe, function(match, name, op, args) {
						return "(this['" + name + "']" + (
							typeof view[name] == "function" ?
							"(" + (args || "") + ")" :
							"=" + args
						) + "),"
					}) + "1"
					Fn(fn, view, scopeData)()
				}
			}
		}),
		"view-link": plugin.extend({
			done: function() {
				var t = this
				, arr = t.name.split(splitRe)
				View(arr[0], null, arr[2])
				.on("ping", function(opts) {
					View.show(arr[1].format(opts))
				})
			}
		})
	}

	xhr.view = xhr.tpl = El.tpl = parseTemplate
	xhr.css = function(str) {
		if (!styleNode) {
			// Safari and IE6-8 requires dynamically created
			// <style> elements to be inserted into the <head>
			append(document.getElementsByTagName("head")[0], styleNode = El("style"))
		}
		if (styleNode.styleSheet) styleNode.styleSheet.cssText += str
		else append(styleNode, str)
	}

	El.scrollLeft = scrollLeft
	function scrollLeft() {
		return window.pageXOffset || root.scrollLeft || body.scrollLeft || 0
	}

	El.scrollTop = scrollTop
	function scrollTop() {
		return window.pageYOffset || root.scrollTop || body.scrollTop || 0
	}

	/*** kb ***/
	var kbMaps = []
	, kbMod = El.kbMod = iOS ? "metaKey" : "ctrlKey"
	, kbKeys = {
		  8: "backspace", 9: "tab",
		 13: "enter",    16: "shift", 17: "ctrl",  18: "alt",  19: "pause",
		 20: "caps",     27: "esc",
		 33: "pgup",     34: "pgdown",
		 35: "end",      36: "home",
		 37: "left",     38: "up",    39: "right", 40: "down",
		 45: "ins",      46: "del",
		 91: "cmd",
		112: "f1",      113: "f2",   114: "f3",   115: "f4",  116: "f5",  117: "f6",
		118: "f7",      119: "f8",   120: "f9",   121: "f10", 122: "f11", 123: "f12"
	}

	function kbRun(e, code, chr) {
		var fn, map
		, i = 0
		, el = e.target || e.srcElement
		, input = /INPUT|TEXTAREA|SELECT/i.test((el.nodeType == 3 ? el.parentNode : el).tagName)

		for (; map = kbMaps[i++]; ) {
			if (!input || map.input) {
				fn = map[code] ||
				map[chr] ||
				map.num && code > 47 && code < 58 && (chr|=0, map.num) ||
				map.all
			}
			if (fn || !map.bubble) break
		}
		if (fn) {
			typeof fn === "string" ? View.emit(fn, e, chr, el) : fn(e, chr, el)
		}
	}

	function kbDown(e) {
		if (kbMaps[0]) {
			var c = e.keyCode || e.which
			, numpad = c > 95 && c < 106
			, code = numpad ? c - 48 : c
			, key = kbKeys[code] || String.fromCharCode(code).toLowerCase() || code

			// Otherwise IE backspace navigates back
			if (code == 8 && kbMaps[0].backspace) {
				Event.stop(e)
			}
			kbRun(e, code, key)
			if (e.shiftKey && code != 16) kbRun(e, code, "shift+" + key)
			// people in Poland use Right-Alt+S to type in Ś.
			// Right-Alt+S is mapped internally to Ctrl+Alt+S.
			// THANKS: Marcin Wichary - disappearing Polish Ś [https://medium.engineering/fa398313d4df]
			if (e.altKey) {
				if (code != 18) kbRun(e, code, "alt+" + key)
			} else if (code != 17) {
				if (e.ctrlKey) kbRun(e, code, "ctrl+" + key)
				if (e[kbMod] && code != 91) kbRun(e, code, "mod+" + key)
			}
		}
	}

	El.addKb = function(map, killEl) {
		if (map) {
			kbMaps.unshift(map)
			if (killEl) {
				// addEvent(killEl, "kill", rmKb.bind(map, map))
				emitter.on.call(killEl, "kill", rmKb.bind(map, map))
			}
		}
	}
	El.rmKb = rmKb
	function rmKb(map) {
		var i = kbMaps.indexOf(map||kbMaps[0])
		if (i > -1) kbMaps.splice(i, 1)
	}

	addEvent(document, "keydown", kbDown)
	/**/


	/*** responsive ***/
	var lastSize, lastOrient
	, breakpoints = {
		sm: 0,
		md: 601,
		lg: 1025
	}
	, setBreakpointsRated = function() {
		setBreakpoints()
	}.rate(100, true)

	function setBreakpoints(_breakpoints) {
		// document.documentElement.clientWidth is 0 in IE5
		var key, next
		, width = root.offsetWidth
		, map = breakpoints = _breakpoints || breakpoints

		for (key in map) {
			if (map[key] > width) break
			next = key
		}

		if ( next != lastSize ) {
			cls(root, lastSize, 0)
			cls(root, lastSize = next)
		}

		next = width > root.offsetHeight ? "landscape" : "portrait"

		if ( next != lastOrient) {
			cls(root, lastOrient, 0)
			cls(root, lastOrient = next)
		}

		if (next = window.View) next.emit("resize")
	}
	El.setBreakpoints = setBreakpoints

	setBreakpointsRated()

	addEvent(window, "resize", setBreakpointsRated)
	addEvent(window, "orientationchange", setBreakpointsRated)
	addEvent(window, "load", setBreakpointsRated)
	/**/
}(window, document, Object, Event, "prototype")
/* litejs.com/MIT-LICENSE.txt */



!function(bindings) {
	var hasOwn = Object.prototype.hasOwnProperty
	, slice = Array.prototype.slice

	bindingEvery.once =
	emitForm.once =
	bindingFn.once =
	bindingsEach.raw = bindingsEach.once =
	true

	bindings.every = bindingEvery
	function bindingEvery(el, list, attrName) {
		var len = 0
		, data = this
		, parent = el.parentNode
		, comm = document.createComment("every " + (list.name || list.length))
		, nodes = []

		parent.replaceChild(comm, el)

		if (list) {
			if (typeof list === "string") {
				data.model.on("change:" + list, render)
				El.on(parent, "kill", function() {
					data.model.off("change:" + list, render)
				})
				render()
			} else if (list.eachLive) {
				list.eachLive(add, remove, list)
				El.on(parent, "kill", function() {
					list.off("add", add, list).off("remove", remove, list)
				})
			} else {
				comm.render = render
				render()
			}
		}
		return true

		function render() {
			for (; len; len--) {
				remove(len)
			}
			_list = typeof list === "string" ? data.model.get(list, []) : list
			if (typeof _list === "string") _list.split(",")
			Object.each(_list, add, (
				_list.constructor === Object ? Object.keys(_list) : _list
			))
		}

		function add(item, i) {
			len++
			var up
			, clone = el.cloneNode(true)
			, scope = El.scope(clone, data)
			, before = nodes[i] || comm
			if (!before.parentNode) return
			nodes.splice(i, 0, clone)
			scope.i = i
			scope._scope = scope
			scope.len = this.length
			scope[attrName || "item"] = item
			El.append(before.parentNode, clone, before)
			El.render(clone, scope)
			if (typeof item.on === "function") {
				item.on("change", up = El.render.bind(clone, clone))
				El.on(clone, "kill", function() {
					item.off("change", up)
				})
			}
		}

		function remove(item, i) {
			El.kill(nodes.splice(i, 1)[0])
		}
	}

	bindings.fn = bindingFn
	function bindingFn(el, fn) {
		return fn.apply(el, slice.call(arguments, 3))
	}

	bindings["if"] = bindingsIf
	function bindingsIf(el, enabled) {
		var parent = el.parentNode
		, scope = this
		if (enabled) {
			parent || el._ifComm && el._ifComm.parentNode.replaceChild(el, el._ifComm)
		} else {
			if (parent) {
				if (!el._ifComm) {
					El.on(el, "kill", El.kill.bind(el, el._ifComm = document.createComment("if")))
					el._ifComm.render = function() {
						El.render(el, scope)
					}
				}
				parent.replaceChild(el._ifComm, el)
			}
			return true
		}
	}

	bindings.is = function bindingIs(node, model, path, list, state) {
		var match
		, scope = this
		if (typeof model === "string") {
			state = list
			list = path
			path = model
			model = scope.model
		}
		if (model && path) {
			match = i18n.pick(state != null ? state : model.get(path), list)
			El.cls(node, scope["_is-" + path], 0)
			El.cls(node, scope["_is-" + path] = match && "is-" + match)
		}
	}

	bindings.emitForm = emitForm
	function emitForm(el, ev, a1, a2, a3, a4) {
		El.on(el, "submit", function(e) {
			var data = El.val(el)
			View.emit(ev, e, data, a1, a2, a3, a4)
			return Event.stop(e)
		})
	}

	function getChilds(node) {
		var child
		, childs = node._childs
		if (!childs) {
			for (node._childs = childs = []; child = node.firstChild;) {
				childs.push(child);
				node.removeChild(child)
			}
		}
		return childs
	}

	bindings.each = bindingsEach

	function bindingsEach(el, expr) {
		var node = el
		, child = getChilds(node)[0]
		, match = /^\s*(\w+) in (\w*)(.*)/.exec(expr)
		, fn = "with(data){var out=[],loop={i:0,offset:0},_1,_2=" + match[2]
		+ match[3].replace(/ (limit|offset):\s*(\d+)/ig, ";loop.$1=$2")
		+ ";if(_2)for(_1 in _2)if(hasOwn.call(_2,_1)&&!(loop.offset&&loop.offset--)){"
		+     "loop.i++;"
		+     "if(loop.limit&&loop.i-loop.offset>loop.limit)break;"
		+     "var clone=el.cloneNode(true)"
		+     ",scope=El.scope(clone,data);"
		+     "scope.loopKey=loop.key=_1;"
		+     "scope.loop=loop;"
		+     "scope." + match[1] + "=_2[_1];"
		+     "out.push(clone);"
		+ "};return out}"

		var childs = Function("hasOwn,el,data", fn)(hasOwn, child, this)

		El.append(El.empty(node), childs)
		El.render(node)
		return node
	}

	bindings.focus = function(el) {
		el.focus()
	}

	bindings.href = function(el, url) {
		if (url) {
			var chr = url.charAt(0)
			El.attr(el, "href", chr === "+" || chr === "%" ? "#" + View.expand(url) : url)
		}
	}
}(El.bindings)
/* litejs.com/MIT-LICENSE.txt */



El.bindings.list = function(node, list, extra, val) {
	var child = node._child
	, data = this
	, extraLen = 0

	if (!child) {
		child = node._child = node.removeChild(node.firstChild)
	}

	if (!list || node._list == list) return

	if (node._list) clear()

	node._list = data.list = list

	El.on(node, "kill", clear)

	El.cls(node, "loading")

	if (extra) {
		extra.each(clone)
		extraLen = extra.length
	}

	list
	.each(clone)
	.on("add", clone).on("remove", remove)
	.on("startLoading", function(){
		El.cls(node, "loading")
	})
	.on("endLoading", function(){
		El.cls(node, "loading", 0)
	})
	.then(function() {
		if (val !== void 0 && El.val(node) !== val) {
			if (!this.get(val)) {
				clone({id:val,name:val}, extraLen)
				extraLen++
			}
			El.val(node, val)
		}
		El.cls(node, "loading", 0)
	})

	// Do not render childs when list initialized
	return true

	function clone(item, pos) {
		var clone = child.cloneNode(true)
		, scope = El.scope(clone, data)
		scope.item = item.data || item || {id:item,name:item}
		scope.model = item
		scope.pos = pos
		function up() {
			El.render(clone, scope)
		}
		if (item.on) {
			item.on("change", up)
			El.on(clone, "kill", function(){
				item.off("change", up)
			})
		}
		El.append(node, clone, extraLen + pos)
		return El.render(clone, scope)
	}

	function remove(item, pos) {
		El.kill(node.childNodes[extraLen + pos])
	}

	function clear() {
		var list = node._list
		El.empty(node)
		if (list) {
			node._list = null
			list.off("add", clone).off("remove", remove)
		}
	}
}