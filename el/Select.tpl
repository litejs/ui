
/ Material select popper length should be as wide as longest item in list

%css
	.Select,
	.Select-box,
	.Select-edit {
		display: block;
		font-size: 14px;
		font-weight: 400;
		line-height: 30px;
		height: 30px;
		margin: 0;
		overflow: visible;
	}
	.Select-edit,
	.Select-edit:active,
	.Select-edit:focus {
		width: 100%;
		box-shadow: none;
		border: 0;
		pointer-events: none;
	}
	.Select-box {
		position: relative;
		border-radius: 4px;
		border: 1px solid #aaa;
		height: 32px;
		width: 100%;
		background: #fff;
		padding: 0 0px;
		overflow: hidden;
	}
	.Select-box:before {
		position: absolute;
		content: "▼";
		color: #999;
		right: 4px;
		pointer-events: none;
	}
	.Select-box:hover:before,
	.Select-box.is-active:before {
		color: #000;
	}
	.Select-box.is-open,
	.Select-box:focus {
		border-color: #257;
		outline: 0 none;
		box-shadow:
			0 2px 5px rgba(0, 0, 0, .5) inset,
			0 0 2px 2px #6ae;
		outline: 0 none;
	}
	.Select-box.is-open {
		height: auto;
		max-height: 80vh;
		z-index: 1;
	}
	.sm .Select-box.is-open {
		position: absolute;
		top: 10px;
		bottom: 10px;
		left: 10px;
		right: 10px;
		left: 0;
		width: 100vw;
		height: 100vh;
	}
	.Select-search,
	.Select-search:active,
	.Select-search:focus {
		display: block;
		width: 100%;
		box-shadow: none;
	}
	.Select-val {
		padding: 0px 8px;
	}
	.Select-val:hover {
		color: #fff;
		background: #3875d7;
		background-image: linear-gradient(#3875d7 20%, #2a62bc 90%);
		cursor: default;
	}
	.Cal {
		width: 240px;
		white-space: nowrap;
		overflow: hidden;
	}
	.Cal > table {
		width: 240px;
		height: 240px;
		text-align: center;
		display: inline-block;
		cursor: default;
	}
	.Cal.is-month > table {
		transform: translateX(-240px);
	}
	.Cal.is-year > table {
		transform: translateX(-480px);
	}
	.Cal-head {
		font-size: 1.4em;
		display:block;
	}
	.other,
	.weekNum,
	.weekday,
	.weekend {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		padding: 0;
	}
	.monthname:hover,
	.yearnum:hover,
	td.other:hover,
	td.weekday:hover,
	td.weekend:hover {
		background: #ddd;
	}
	.Cal-year td.act,
	.Cal-month td.act,
	.Cal-day td.act {
		box-shadow: inset 0 0 20px #666;
	}
	.yearnum {
		border-radius: 4px;
		width: 48px;
		height: 35px;
	}
	.monthname {
		font-size: 1.4em;
		border-radius: 4px;
		width: 79px;
		height: 52.5px;
	}
	.other {
		color: #999;
	}
	.weekNum {
		font-size: .8em;
		color: #999;
	}
	.weekday {
	}
	.weekend {
		color: #e00;
	}

%js
	var inFocus, defaults = {
		list: {
		},
		cal: {
			format: "LLL"
		},
		multi: {}
	}
	function Select(el, sub, opts, fill, clean) {
		var child
		, box = el.firstChild
		, input = box.firstChild
		, kb = { enter: open }
		El.on(box, "click", open)
		function open() {
			if (child) return
			box.tabIndex = -1
			El.cls(box, "is-open")
			El.append(box, child = El("Select-" + sub))
			fill(child)
			El.render(child, El.scope(child, opts))
		}
		El.on(box, "focus", function(e) {
			inFocus = box
			El.addKb(kb, box)
		})
		El.on(box, "blur", blur, 0)
		el.val = function(val, valObj) {
			El.val(input, val)
			if (valObj !== void 0) input.valObject = valObj
			if (child) {
			}
		}
		opts.kill = kill
		opts.blur = blur
		function blur(e) {
			if (child && e.key !== "Escape") return
			El.rmKb(kb)
			El.cls(box, "is-open", box.tabIndex = 0)
			setTimeout(_close, 1, e)
		}
		function _close(e) {
			if (!child) return
			try {
				var act = document.activeElement
				if (act == box || (act = act.parentNode) == box || act.parentNode == box) return
			} catch(e) {}
			kill()
		}
		function kill() {
			if (child) {
				clean()
				El.kill(child)
				child = null
				//box.blur()
			}
		}
	}
	El.$b.initCal = function(el, opts) {
		var scope = El.scope(el, el)
		, input = scope.openTarget
		, val = El.val(input)
		, now = scope.now = val ? new Date(val) : new Date()
		, dateFormat = El.get(el, "data-format") || "LLL"
		, calView = 0
		set(0)
		El.render(el)
		El.on(el, "click", "[data-calDo]", function(e) {
			var mul = El.get(e.target, "data-calDo") == "next" ? 1 : -1
			if (calView == 2) now.setFullYear(scope.year + mul * 30)
			else if (calView == 1) now.setMonth(scope.month + mul * 12)
			else now.setMonth(scope.month + mul * 1)
			set(calView,e)
		})
		El.on(el, "click", "[data-calView]", function(e) {
			set(+El.get(e.target, "data-calView"),e)
		})
		El.on(el, "click", ".Cal-day td", function(e) {
			now.setDate(e.target.i)
			set(0,e)
			El.val(input, now)
		})
		El.on(el, "click", ".Cal-month td", function(e) {
			now.setMonth(e.target.i)
			set(0,e)
		})
		El.on(el, "click", ".Cal-year td", function(e) {
			now.setFullYear(e.target.i)
			set(1,e)
		})
		function set(view, e) {
			calView = view
			var start = new Date(now)
			scope.day = 1
			scope.month = now.getMonth()
			scope.year = now.getFullYear()
			scope.yearStart = scope.year - scope.year%5 - 20
			scope.yearEnd = scope.yearStart + 29
			console.log("set",now,calView,scope)
			start.setDate(1)
			scope.dayOff = (1 - (start.getDay() || 7)) || - 7
			// (1 - (((start.getDate()%7) - start.getDay() + 1) || 7)) || -7
			scope.start = start - (scope.dayOff < -6 ? 604800000 : 0)
			start.setMonth(scope.month + 1, 0)
			scope.daysInMonth = start.getDate()
			start.setDate(0)
			scope.daysInLastMonth = start.getDate()
			El.cls(el, "is-month", view == 1)
			El.cls(el, "is-year", view == 2)
			El.render(el)
			if (e) e.stopPropagation()
		}
		return true
	}
	El.$b.SelectCal = function(el, opts) {
		Select(el, "cal", opts, initCal, function() {
		})
	}
	El.$b.SelectList = function(el, opts) {
		var search
		Select(el, "list", opts, function(child) {
			search = child[0].firstChild
			El.on(search, "blur", opts.close)
			El.on(search, "change", filter)
			search.focus()
			El.addKb({
				bubble: 1,
				input: 1,
				up: function() {
				},
				down: function() {
				},
				enter: function() {
				}
			}, child)
		}, function() {
			search = null
		})
		El.on(el, "click", ".Select-val", select)
		function select(e) {
			el.val(e.target.valueObj || e.target.textContent)
			opts.kill()
		}
		function filter() {
		}
	}
	El.$b.SelectMulti = function(el, opts) {
		Select(el, "multi", opts, function() {
		}, function() {
		})
	}

%el Select
	.Select
		.Select-box.anim[tabindex=0]
			input.Select-edit[tabindex=-1]
			%slot

%el Select-cal
	.m2.Cal
		;initCal!
		%el Btns
			.bt.is-primary.left.bold[data-calDo=prev] ⬅
			.bt.is-primary.right.bold[data-calDo=next] ➡
		table[cellspacing=0].Cal-day.anim
			caption.Cal-head
				Btns
				span.m01[data-calView=1]
					;txt dNames[now.getMonth()+12]
				span.m01[data-calView=2]
					;txt now.getFullYear()
			tr
				th \xa0
				th ;each!item in [1, 2, 3, 4, 5, 6, 7]
					;txt!dNames[item<7?item + 24 : 24]
					;cls!item <6?"weekday":"weekend"
			tr ;each!row in [0,1,2,3,4,5]
				td.weekNum ;txt! El.$d._date(start-(-row*604800000), "w")
				td
					;each!col in [1, 2, 3, 4, 5, 6, 7]
					;cls!"act", ($el.i = row*7 + col + dayOff) == day
					;cls!$el.i < 1 || $el.i > daysInMonth ? "other" : col < 6 ? "weekday" : "weekend"
					;txt!$el.i < 1 ? daysInLastMonth + $el.i : $el.i > daysInMonth ? $el.i - daysInMonth : $el.i
		table[cellspacing=0].Cal-month.anim
			caption.Cal-head[data-calView=2]
				Btns
				;txt now.getFullYear()
			tr.weekRow ;each!row in [0,1,2,3]
				td.monthname
					;each!col in [0, 1, 2]
					;cls!"act", ($el.i = row*3 + col) == month
					;txt dNames[$el.i]
		table[cellspacing=0].Cal-year.anim
			caption.Cal-head
				Btns
				span[data-calView=0] {yearStart} - {yearEnd}
			tr.weekRow ;each!week in [0,1,2,3,4,5]
				td.yearnum
					;each!item in [0, 1, 2, 3, 4]
					;cls! "act", ($el.i = week*5 + item + yearStart) == year
					;txt! $el.i

%el Select-list
	div.m1
		input.Select-search[tabindex=-1]
		/.Select-clear.hand ×
	.scroll
		.Select-val {item.name||item.id}
			;every: list

%el Select-multi
	div.m1
		input.Select-search[tabindex=-1]
		/.Select-clear.hand ×
	div
		.Select-val item 1
		.Select-val item 2

%el menu-cal
	.mat-Menu.shadow-1>Select-cal

%el form1-date-time
	input.field[autocomplete="off"]
		@click: ["menu-cal", "right-end", "bottom", 0, 1], "showMenu"

