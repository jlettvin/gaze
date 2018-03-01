'use strict';


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
//------------------------------------------------------------------------------
{
	var epsilon = 0.33; // fudge factor to bring elements close to the radius.
	var X       = parseFloat (radius), Y = parseFloat (radius);
	var R       = parseFloat (radius + epsilon);
	var odd     = 1;
	var thin    = 0.5;
	var fat     = Math.sqrt (0.8);

	var coordinates = [];
	for (var y = 0; y <= +Y; y += fat) {
		odd = (odd + 1) & 1;
		var dx = (odd) ? thin : 0;
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
