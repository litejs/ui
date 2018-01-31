

@el Checkbox
	label.Checkbox
		input[type=checkbox].hidden
		i.Checkbox-icon.waves

@el Button
	button[type=button].Button.waves Button

@el Fab
	button[type=button].Fab.waves.raised

@el Toggle
	button[type=button].Toggle.waves

@el Radio
	button[type=button].Radio.waves

@css
	.MenuBtn {
		position: relative;
		width: 30px;
		height: 30px;
		background: transparent;
		color: #fff;
	}
	.MenuBtn-x,
	.MenuBtn-x:before,
	.MenuBtn-x:after {
		display: block;
		content: "";
		background-color: currentColor;
		position: absolute;
		width: 100%;
		height: .3em;
		border-radius: .3em;
		pointer-events: none;
		transition-property: transform;
	}
	.MenuBtn-x:before {
		transform: translate(0, -.6em);
	}
	.MenuBtn-x:after {
		transform: translate(0, .6em);
	}
	.MenuBtn--back > .MenuBtn-x,
	.MenuBtn--close > .MenuBtn-x {
		color: #666;
		transform: rotateZ(-180deg);
	}
	.MenuBtn--back > .MenuBtn-x:before {
		transform: rotateZ(45deg) scaleX(.75) translate(0, -230%);
	}
	.MenuBtn--back > .MenuBtn-x:after {
		transform: rotateZ(-45deg) scaleX(.75) translate(0, 230%)
	}
	.MenuBtn--close > .MenuBtn-x {
		background-color: transparent;
	}
	.MenuBtn--close > .MenuBtn-x:before {
		transform: rotateZ(45deg) translate(0, 0);
	}
	.MenuBtn--close > .MenuBtn-x:after {
		transform: rotateZ(-45deg) translate(0, 0);
	}

@el MenuBtn
	button[type=button].MenuBtn.reset.noselect
		.MenuBtn-x.anim


