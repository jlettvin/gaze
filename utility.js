'use strict';


// TODO
// document.querySelector("link[rel*='icon']").href = "favicon.ico";


//------------------------------------------------------------------------------
// PHP and shell style HEREDOC
function HEREDOC (f)
//------------------------------------------------------------------------------
{
	return f.
		toString().
		split('\n').
		slice(1,-1).
		join('\n').
		normalize('NFC');
} // HEREDOC


//------------------------------------------------------------------------------
String.prototype.isNumber = function ()
//------------------------------------------------------------------------------
{
	return /^\d+$/.test(this);
} // String.prototype.isNumber


//------------------------------------------------------------------------------
function newRandomInt (max)
//------------------------------------------------------------------------------
{
	return Math.floor (Math.random () * Math.floor (max));
} // newRandomInt


//------------------------------------------------------------------------------
function newArray (count, value) {
//------------------------------------------------------------------------------
	var a = [];
	if (count > 0) while (--count) a.push (value);
	return a;
} // newRange


//------------------------------------------------------------------------------
function newRange (start, stop, step=1) {
//------------------------------------------------------------------------------
	var a = [];
	var neg = (stop < start);
	if (stop < start) while(start > stop) { a.push(start); start += step; }
	else              while(start < stop) { a.push(start); start += step; }
	return a;
} // newRange


//------------------------------------------------------------------------------
// newHexagonal generates a list of coordinates for unit circle centers
// which fit within a larger circle of specified radius without edge-bleed.
function newHexagonal (radius)
// radius is a whole number used to count unit circles from center to the edge.
// Mathematically correct visual approximation of hexagonal spacing.
// Coordinates returned are not sequentially ordered.
// Packed unit circles a unit equilateral triangle.
// With one edge horizontal, a dropped vertical cuts the base in half (0.5).
// This makes a right triangle of hypotenuse == 1.0 and short leg == 0.5.
//   sqrt(1.0**2 - 0.5**2) == sqrt(0.75)
//------------------------------------------------------------------------------
{
	var epsilon = 0.35; // fudge factor to bring fibers close to the sarcolemma.
	var X       = parseFloat (radius), Y = parseFloat (radius);
	var R       = parseFloat (radius + epsilon);
	var odd     = 1;
	var Hyp     = 1.0;
	var Sin     = 0.5;
	var Cos     = Math.sqrt (Hyp**2 - Sin**2);

	var coordinates = [];
	for (var y = 0; y <= +Y; y += Cos) {
		odd = (odd + 1) & 1;
		var dx = (odd) ? Sin : 0;
		for (var x = dx; x <= X+dx; x+=1.0) {
			var r = Math.sqrt (x*x + y*y);
			if (r < R) {
				if (x == 0 && y == 0) {
					coordinates.push([+x,+y]);
				} else if (x == 0) {
					coordinates.push([x,-y]);
					coordinates.push([x,+y]);
				} else if (y == 0) {
					coordinates.push([-x,y]);
					coordinates.push([+x,y]);
				} else {
					coordinates.push([-x,-y]);
					coordinates.push([-x,+y]);
					coordinates.push([+x,-y]);
					coordinates.push([+x,+y]);
				}
			}
		}
	}
	return coordinates;
} // newHexagons


//------------------------------------------------------------------------------
// Fisher-Yates shuffle
function shuffle (array)
//------------------------------------------------------------------------------
{
	var i = 0, j = 0, temp = null

	for (i = array.length - 1; i > 0; i -= 1) {
		j        = Math.floor(Math.random() * (i + 1))
		temp     = array[i]
		array[i] = array[j]
		array[j] = temp
	}
} // shuffle


//------------------------------------------------------------------------------
// https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection
function intersection (x1,y1,x2,y2,x3,y3,x4,y4)
//------------------------------------------------------------------------------
{
	var x1m2 = x1 - x2, x3m4 = x3 - x4;
	var y1m2 = y1 - y2, y3m4 = y3 - y4;
	var x1y2 = x1 * y2, x2y1 = x2 * y1;
	var x3y4 = x3 * y4, x4y3 = x4 * y3;

	var Xdenom = (x1m2*y3m4 - y1m2*x3m4);
	var Ydenom = (x1m2*y3m4 - y1m2*x3m4);

	//if (Xdenom == 0 || Ydenom == 0) return [0,0];

	if (Xdenom == 0) Xdenom = 1e-128;
	if (Ydenom == 0) Ydenom = 1e-128;

	return [
		parseInt ((((x1y2-x2y1)*x3m4) - (x1m2*(x3y4-x4y3))) / Xdenom),
		parseInt ((((x1y2-x2y1)*y3m4) - (y1m2*(x3y4-x4y3))) / Ydenom)
	];
} // intersection


//------------------------------------------------------------------------------
function bits (val)
//------------------------------------------------------------------------------
{
	//val /= 16;
	val *= val * (val < 0) ? -1 : 1;
	var ret = 1;
	while (val)
	{
		ret += 1;
		val = val >> 1;
	}
	return ret;
} // bits

//------------------------------------------------------------------------------
function header (id, items)
//------------------------------------------------------------------------------
{
	var element = document.getElementById (id);
	if (element) {
	}
	/*
		<header>
			<table width="100%" bgcolor="white" align="center">
				<tr><td align="left">
				<big><big><big><b><i>
					Brain Building Kit&trade;
				</i></b></big></big></big>
			<br />
			<big><big><big><b>BBK&trade;</b></big></big></big>
			<br />
				</td><td align="right">
					<big><b><u><i>Mathematics of the Brain </i></u></b></big>
<br />
artificial brain assembly tools 
<br />
with sample neuron and brain libraries

				</td></tr>
			</table>
		</header>
	*/
}

//------------------------------------------------------------------------------
function includeHTML() {
	// NONFUNCTIONAL
//------------------------------------------------------------------------------
  console.log ("includeHTML");
  var z, i, elmnt, file, xhttp;
  /*loop through a collection of all HTML elements:*/
  z = document.getElementsByTagName("*");
  for (i = 0; i < z.length; i++) {
    elmnt = z[i];
    /*search for elements with a certain atrribute:*/
    file = elmnt.getAttribute("w3-include-html");
    if (file) {
      /*make an HTTP request using the attribute value as the file name:*/
      xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
          if (this.status == 200) {elmnt.innerHTML = this.responseText;}
          if (this.status == 404) {elmnt.innerHTML = "Page not found.";}
          /*remove the attribute, and call this function once more:*/
          elmnt.removeAttribute("w3-include-html");
          includeHTML();
        }
      } 
      xhttp.open("GET", file, true);
      xhttp.send();
      /*exit the function:*/
      return;
    }
  }
}

//------------------------------------------------------------------------------
function doWiki ()
//------------------------------------------------------------------------------
{
	console.log ("doWiki");
	var elements = document.getElementsByClassName ("wiki");
	var key = elements.length;

	while (key--) {
		var markdown = elements[key];
		var wikisrc = markdown.getElementsByClassName ("wiki.src");
		var wikitgt = markdown.getElementsByClassName ("wiki.tgt");

		if (wikitgt.length === 0) {
			console.log("make");
			wikitgt = document.createElement ("div");
			wikitgt.setAttribute ("class", "wiki.tgt");
			markdown.appendChild (wikitgt);
		} else {
			console.log("prep");
			wikitgt = wikitgt[0];
		}

		console.log ("wiki.tgt",wikitgt);

		if (wikisrc.length == 1 && wikitgt) {
			wikisrc = wikisrc[0];
			var src = wikisrc.innerHTML;
			var tgt = wikitgt.innerHTML;
			wikitgt.innerHTML = wikisrc.innerHTML;
			var dbg = [];
			var tgt = document.jlettvin.wiki.markdown (src, dbg);
			wikitgt.innerHTML = tgt;
		}
	}
}

//------------------------------------------------------------------------------
function doHeader (title, subtitle='')
//------------------------------------------------------------------------------
{
	var body = document.getElementsByTagName ('body')[0];
	var content = HEREDOC (function () {/*
<header>
	<table width="100%" bgcolor="white" align="center">
		<tr><td align="left">
		<big><big><big><b><i>
			Brain Building Kit&trade;
		</i></b></big></big></big>
	<br />
	<big><big><big><b>BBK&trade;</b></big></big></big>
	<br />
		</td><td align="center">
			<h3>{title}<h3>
			{subtitle}
		</td><td align="right">
			<big><b><u><i>Mathematics of the Brain </i></u></b></big>
			<br />artificial brain assembly tools 
			<br />with sample neuron and brain libraries
		</td></tr>
	</table>
</header>
	*/});

	var header = body.getElementsByTagName ('header');
	if (header.length) {
		header = header[0];
	} else {
		header = document.createElement ('header');
		body.appendChild (header);
	}
	content = content.replace ("{title}", title);
	content = content.replace ("{subtitle}", subtitle);
	header.innerHTML = content;
}

//------------------------------------------------------------------------------
function doFooter ()
//------------------------------------------------------------------------------
{
	console.log ("doFooter");
	var content = HEREDOC (function () {/*
		<footer>
			<hr />
			<small><b bgcolor="white" class="copyright">
				Copyright&copy; 2018 Jonathan D. Lettvin, All Rights Reserved
			</b></small>
		</footer>
	*/});

	var body = document.getElementsByTagName ('body')[0];
	var footer = body.getElementsByTagName ('footer');
	if (footer.length) {
		footer = footer[0];
	} else {
		footer = document.createElement ('footer');
		body.appendChild (footer);
	}
	footer.innerHTML = content;
}

//------------------------------------------------------------------------------
function doInfo ()
//------------------------------------------------------------------------------
{
	console.log ("doInfo");
	var ids = document.querySelectorAll('*[id]')
	for (var id of ids) {
		console.log (id);
	}
}

//------------------------------------------------------------------------------
function ulButtons (specification)
//------------------------------------------------------------------------------
{
	var buttons = specification.items;
	var ul = document.getElementById("ulButtons");
	if (ul) {
		for (var candidate of buttons) {
			if (candidate.URL && candidate.title && candidate.tooltip) {
				console.log ("button title:", candidate.title);

				var a       = document.createElement ('a');
				a.href      = candidate.URL;
				a.innerHTML = candidate.title;

				var span          = document.createElement ('span');
				span.setAttribute ("class", "tooltiptext");
				span.innerHTML    = candidate.tooltip;

				var li = document.createElement ('li');

				var button          = document.createElement ('button');
				button.setAttribute ("class", "tooltip");


				button.appendChild (a);
				button.appendChild (span);
				li.appendChild (button);
				ul.appendChild (li);
			}
		}

		{
			// The refresh button
			var b       = document.createElement ('b');
			b.innerHTML = "refresh";

			var span          = document.createElement ('span');
			span.setAttribute ("class", "tooltiptext");
			span.innerHTML    = "reload this page";

			var button          = document.createElement ('button');
			button.setAttribute ("class", "tooltip");
			button.setAttribute ("id", "reload");
			button.setAttribute ("onclick", "location.reload (true)");

			var li = document.createElement ('li');

			button.appendChild (b);
			button.appendChild (span);
			li.appendChild (button);
			ul.appendChild (li);
		}
	}
}

//includeHTML ();
doWiki ();  // TODO remove this
