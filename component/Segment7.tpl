
%css
	.Segment7 {
		position: relative;
		height: 1em;
		width: .5em;
	}
	.Seg-V, .Seg-H {
		position: absolute;
		top: 0;
		left: .105em;
		height: .098em;
		width: .28em;
		background-color: currentColor;
	}
	.Seg-V + .Seg-V { top: .392em; }
	.Seg-V + .Seg-V + .Seg-V { top: .784em; }
	.Seg:before, .Seg:after {
		position: absolute;
		content: "";
		border: .049em solid transparent;
	}
	.Seg-V:before {
	    	left: -.098em;
		border-right-color: currentColor;
	}
	.Seg-V:after {
		right: -.098em;
		border-left-color: currentColor;
	}
	.Seg-H:before {
	    	top: -.098em;
		border-bottom-color: currentColor;
	}
	.Seg-H:after {
		bottom: -.098em;
		border-top-color: currentColor;
	}
	.Seg-H {
		top: .105em;
		left: 0;
		height: .28em;
		width: .098em;
	}
	.Seg-H + .Seg-H {
		left: .392em;
	}
	.Seg-H + .Seg-H + .Seg-H {
		top: .497em;
	}
	.Seg-H + .Seg-H + .Seg-H + .Seg-H {
		left: 0;
	}
	[data-value="0"]>[off~="0"],
	[data-value="1"]>[off~="1"],
	[data-value="2"]>[off~="2"],
	[data-value="3"]>[off~="3"],
	[data-value="4"]>[off~="4"],
	[data-value="5"]>[off~="5"],
	[data-value="6"]>[off~="6"],
	[data-value="7"]>[off~="7"],
	[data-value="8"]>[off~="8"],
	[data-value="9"]>[off~="9"],
	[data-value="a"]>[off~="a"],
	[data-value="b"]>[off~="b"],
	[data-value="c"]>[off~="c"],
	[data-value="d"]>[off~="d"],
	[data-value="e"]>[off~="e"],
	[data-value="f"]>[off~="f"] {
		color: rgba(0,0,0,0.07);
	}

%el Segment7
	.Segment7.left
		.Seg.Seg-V.Seg-A[off="1 4 b d"]
		.Seg.Seg-V.Seg-G[off="0 1 7 c"]
		.Seg.Seg-V.Seg-D[off="1 4 7 a f"]
		.Seg.Seg-H.Seg-F[off="1 2 3 7 d"]
		.Seg.Seg-H.Seg-B[off="5 6 b c e f"]
		.Seg.Seg-H.Seg-C[off="2 c e f"]
		.Seg.Seg-H.Seg-E[off="1 3 4 5 7 9"]
