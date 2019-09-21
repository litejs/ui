%css
	::-moz-focus-inner {
		border: 0;
		padding: 0;
	}
	.Form1-del {
		display: block;
		margin: -10px -10px 0 0;
		font-size: 20px;
		font-weight: 700;
		opacity: .2;
		border: 1px solid transparent;
		line-height: 16px;
		width: 20px;
		height: 20px;
		text-align: center;
		border-radius: 4px;
	}
	.Form1-del:hover {
		opacity: 1;
		border: 1px solid #aaa;
		background-image: linear-gradient(to bottom, #ddd, #888);
	}
	/**
	 *  1. avoid ios styling the submit button
	 */
	.input {
		display: block;
		border-radius: 4px;
		border: 1px solid #aaa;
		overflow: auto;
	}
	.field {
		width: 100%;
	}
	.btn,
	input,
	select,
	textarea {
		display: block;
		border-radius: 4px;
		border: 1px solid #aaa;
		font-size: 14px;
		font-weight: 400;
		line-height: 30px;
		height: 32px;
		padding: 0 8px;
		margin: 0;
	}
	input[type=checkbox] {
		height: auto;
	}
	textarea {
		height: 64px;
		padding: 8px;
		margin: 0;
		line-height: 1.1;
	}
	select {
		padding-right: 0;
	}
	select[multiple] {
		height: auto;
		padding: 0;
	}
	input[type=radio],
	input[type=checkbox] {
		width: auto;
		display: inline;
	}
	.btn,
	input[type=submit] {                /* 1 */
		-webkit-appearance: none;   /* 1 */
		position: relative;
		padding: 0px 14px;
		text-align: center;
		text-decoration: none;
		/* default look */
		background-color: #ddd;
		color: #444;
		cursor: pointer;
	}
	option[disabled],
	.btn.disabled,
	.btn[disabled] {
		box-shadow: none;
		cursor: not-allowed;
		font-style: italic;
		opacity: .6;
		pointer-events: none;
	}
	.group > .btn {
		border-radius: 0;
		margin-left: -1px;
		float: left;
	}
	.group > .btn:first-child {
		border-top-left-radius: 4px;
		border-bottom-left-radius: 4px;
	}
	.group > .btn:last-child {
		border-top-right-radius: 4px;
		border-bottom-right-radius: 4px;
	}
	.btn--narrow {
		line-height: 1.6;
		margin: .7em 0;
	}
	.btn__spacer {
		height: 33px;
	}
	.md .input__label,
	.lg .input__label {
		padding-right: 8px;
		text-align: right;
	}
	.input__hint {
		text-align: right;
		color: #444;
	}
	.btn:active, .btn:focus,
	input:active, input:focus,
	select:active, select:focus,
	textarea:active, textarea:focus {
		border-color: #257;
		outline: 0 none;
		box-shadow:
			0 2px 5px rgba(0, 0, 0, .5) inset,
			0 0 2px 2px #6ae;
		z-index: 1;
	}
	.btn:hover,
	.btn:focus {
		background-color: #eee;
		color: #333;
		text-decoration: none;
	}
	.btn:active,
	.btn.is-active {
		background-color: #ccc;
		box-shadow: inset 0 0 8px rgba(0, 0, 0, .5);
	}


%el form1-row
	label.row
		.col.md-w4.input__label {name}
		.col.md-w8
			%child
			.input__hint {description}

%el form1-subheader
	.col {title}

%el form1-fieldset
	fieldset.grid.b2
		legend {schema.title || _link.title || ""}

%el form1
	form1-row
		input.field

%el form1-ro
	form1-row>span ;txt: value

%el form1-hidden
	div>input.field[type=hidden]

%el form1-boolean
	form1-row
		input.field[type=checkbox] ;value: value

%el form1-boolean-ro
	form1-row>span ;txt: _(!!value)

%el form1-password
	form1-row
		input.field[type=password]

%el form1-new-password
	form1-row
		input.field[type=password][autocomplete=new-password]

%el form1-text
	form1-row
		textarea.field

%el form1-text-ro
	form1-ro

%el form1-enum
	form1-row
		select.field ;each:val in data["enum"]
			option
				;val:: val
				;txt: _("" + val)

%el form1-enum-ro
	form1-ro

%el form1-list
	form1-row
		select.field
			;list: api(resourceCollection.format(data.route, data)), required ? 0 : [""], value
			option
				;val:: item.id
				;txt:: _(item.name)

%el form1-list-ro
	form1-row>span ;txt: _(item.name)

%el form1-array
	.col
		.input.p13
			.left {name}
			.input__hint {description}
			.js-items.cf
			a.btn.right
				;if: !data.noAdd
				;txt: _(data.name + ".Add")
				@click: data.add

%el form1-array-item
	.input.p3.m2b.js-del
		a.right.Form1-del.hand ×
			;if: !data.noAdd
			;on: "click", data.del
		.grid.b2.js-item

