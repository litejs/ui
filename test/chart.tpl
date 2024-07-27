


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

