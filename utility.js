'use strict';

//------------------------------------------------------------------------------
function newFilledArray(len, val) {
//------------------------------------------------------------------------------
	var a = [];
	while(len--) a.push(val);
	return a;
} // newFilledArray


//------------------------------------------------------------------------------
// PHP style HEREDOC
var HERE = function (f)
//------------------------------------------------------------------------------
{
	return f.
		toString().
		split('\n').
		slice(1,-1).
		join('\n').
		normalize('NFC');
}; // HERE


//------------------------------------------------------------------------------
// https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection
var intersection = function (x1,y1,x2,y2,x3,y3,x4,y4)
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
}


//------------------------------------------------------------------------------
String.prototype.isNumber = function ()
//------------------------------------------------------------------------------
{
	return /^\d+$/.test(this);
} // String.prototype.isNumber


//------------------------------------------------------------------------------
var getRandomInt = function (max)
//------------------------------------------------------------------------------
{
	return Math.floor (Math.random () * Math.floor (max));
} // getRandomInt


//##############################################################################
// SERVICE FUNCTIONS

//------------------------------------------------------------------------------
var bits = function (val)
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


