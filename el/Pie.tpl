
%css
	.Pie {
		overflow: visible;
		fill: currentColor;
	}
	.arc {
		stroke: #7F3F98;
		stroke-width: 5px;
		fill: none;
		transition: all .2s;
	}
	.arc+.arc                     { stroke: #F36E21; }
	.arc+.arc+.arc                { stroke: #A6AEAE; }
	.arc+.arc+.arc+.arc           { stroke: red; }
	.arc+.arc+.arc+.arc+.arc      { stroke: green; }
	.arc+.arc+.arc+.arc+.arc+.arc { stroke: blue; }
	.arc:hover {
		stroke-width: 8px;
		filter: drop-shadow(2px 2px 2px rgba(0,0,0,.6));
	}
	.labels.x-labels {
		text-anchor: middle;
	}
	.labels.y-labels {
		text-anchor: end;
	}
	.grid {
		stroke: #ccc;
		stroke-dasharray: 0;
		stroke-width: 1;
	}
	.labels {
		font-size: 13px;
	}
	.label-title {
		font-weight: bold;
		text-transform: uppercase;
		font-size: 12px;
		fill: black;
	}
	.Chart {
		overflow: visible;
	}
	.Chart-line {
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
	}
	.Chart-line > circle {
		fill: currentColor;
	}
	.Chart-line.is-active {
		stroke-width: 3;
	}
	.data {
		fill: red;
		stroke-width: 1;
	}

%el Pie
	svg.Pie[viewBox="0 0 60 60"]



%el Chart
	svg.Chart[viewBox="0 0 600 300"][preserveAspectRatio="xMinYMid meet"]
		;initChart

%el Chart-line
	g.Chart-line
		;svgToLast
		path ;svgLine: points, {radius: radius}

%el Chart-axes
	g.labels.x-labels
		text[x="100"][y="400"] 2008
		text[x="246"][y="400"] 2009
		text[x="392"][y="400"] 2010
		text[x="538"][y="400"] 2011
		text[x="684"][y="400"] 2012
		text[x="400"][y="440"].label-title Year
	g.grid.x-grid
		line[x1="90"][x2="90"][y1="5"][y2="371"]
	g.grid.y-grid
		line[x1="90"][x2="705"][y1="370"][y2="370"]



