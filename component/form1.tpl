
@el Form1
	label.row
		.col-12.col-md-4.input__label {name}
		.col-12.col-md-8
			input.field
			.input__hint {description}

@el Form1-enum
	label.row
		.col-12.col-md-4.input__label {name}
		.col-12.col-md-8
			select.field &each:val in data["enum"]
				option
					&val: val
					&txt: _("" + val)

@el Form1-list
	label.row
		.col-12.col-md-4.input__label {name}
		.col-12.col-md-8
			select.field &list:api(resourceCollection),0,value
				option
					&val: item.id
					&txt: item.name

@el Form1-boolean
	label.row
		.col-12.col-md-4.input__label
			&txt: name
		.col-12.col-md-8
			input.field[type=checkbox]

@el Form1-array
	.row
		.col-12.col-md-4.input__label {name}
		.col-12.col-md-8
			.input.p3
				.input__hint {description}
				.js-items
				a.btn.right
					&txt: _(data.name + ":Add")
					&on: "click", data.add

@el Form1-array-item
	.input.p3.m2b.js-del
		a.right.form1__item-del.hand ×
			&on: "click", data.del
		.grid-1.js-item

