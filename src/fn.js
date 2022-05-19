


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


	// Non-standard
	Object.each = function(obj, fn, scope, key) {
		if (obj) for (key in obj) {
			hasOwn.call(obj, key) && fn.call(scope, obj[key], key, obj)
		}
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



