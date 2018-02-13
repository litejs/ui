@css
	::-moz-focus-inner {
		border: 0;
		padding: 0;
	}
	.form1__item-del {
		display: block;
		margin: -10px -10px 0 0;
		font-size: 20px;
		font-weight: 700;
		color: #000;
		text-shadow: 0 1px 0 #fff;
		opacity: .2;
		border: 1px solid transparent;
		line-height: 16px;
		width: 20px;
		height: 20px;
		text-align: center;
		border-radius: 4px;
	}
	.form1__item-del:hover {
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
	.btn,
	button,
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
		width: 100%;
		padding: 0 8px;
		margin: 0;
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
	button,
	input[type=submit] {                /* 1 */
		-webkit-appearance: none;   /* 1 */
		width: auto;
		padding: 0px 14px;
		text-align: center;
		/* default look */
		background-color: #ddd;
		color: #444;
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
		font-size: 1.4rem;
	}
	.btn:active, .btn:focus,
	input:active, input:focus,
	select:active, select:focus,
	textarea:active, textarea:focus {
		border-color: #257;
		outline: 0 none;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3) inset, 0 0 2px 2px #6ae;
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
		box-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.2);
	}


@el form1-row
	label.row
		.col-12.col-md-4.input__label {name}
		.col-12.col-md-8
			@child
			.input__hint {description}

@el form1-subheader
	.row
		.col-12 {title}

@el form1-fieldset
	fieldset.grid-1
		legend {schema.title || _link.title}

@el form1
	form1-row
		input.field

@el form1-hidden
	div>input.field[type=hidden]

@el form1-boolean
	form1-row
		input.field[type=checkbox] &value: value

@el form1-password
	form1-row
		input.field[type=password]

@el form1-text
	form1-row
		textarea.field

@el form1-enum
	form1-row
		select.field &each:val in data["enum"]
			option
				&val: val
				&txt: _("" + val)

@el form1-list
	form1-row
		select.field &list:api(resourceCollection.format(route)),0,value
			option
				&val: item.id
				&txt: item.name

@el form1-array
	.row
		.input.p13
			.left {name}
			.input__hint {description}
			.js-items.cf
			a.btn.right
				&if: !data.noAdd
				&txt: _(data.name + ":Add")
				&on: "click", data.add

@el form1-array-item
	.input.p3.m2b.js-del
		a.right.form1__item-del.hand ×
			&if: !data.noAdd
			&on: "click", data.del
		.grid-1.js-item

