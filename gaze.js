'use strict';

//##############################################################################
// GLOBAL VARIABLES

// Translations from named to numerical accessors.
var index = {
	R:0,
	G:1,
	B:2,
	RGB:0,
	L:1,
};

// Reverse index for panes
for (var i=0; i<panes; ++i) { index[pane[i][index.L]] = i; }

// Currently displayed scenario.
var scenario = viewable[0];

// Current session control states
var session = {
	amplitude : new Float32Array (area),
	axes      : 0,
	blinkdown : 0,
	blinkon   : true,
	drift     : {S:0,D:0},
	coeff     : 12.0,
	converge  : true,
	frame     : {x:width,y:height*panes},
	indent    : 0,
	mouse     : {x:0,y:0},
	pane      : {x:width,y:height},
	pixels    : null,
	pupil     : 1,
	storage   : sessionStorage,  //window.localStorage;
	timeout   : null,
	verbose   : false,
};

// optician S(inister) = left, D(exter) = right
// axial is the angle of the eye relative to straight forward
// point is the angle between the axial line of sight and the point
var eye = {
	S:{
		point:0,
		axial:0,
		actual: {x:0,y:0},
		center: {x:0,y:0},
		foveola:{x:0,y:0},
		vector: {x:0,y:0},
	},
	D:{
		point:0,
		axial:0,
		actual: {x:0,y:0},
		center: {x:0,y:0},
		foveola:{x:0,y:0},
		vector: {x:0,y:0},
	}
};

//##############################################################################
// LIBRARY ENHANCEMENTS

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


//------------------------------------------------------------------------------
var poke = function (key, val)
//------------------------------------------------------------------------------
{
	session.storage.setItem (key, val);
} // poke


//------------------------------------------------------------------------------
var peek = function (key)
//------------------------------------------------------------------------------
{
	// test string is all digits and convert it if it is.
	var value = session.storage.getItem (key);
	return value.isNumber () ? parseInt (value) : value;
} // peek


//------------------------------------------------------------------------------
// https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection
// TODO this implementation doesn't quite work
var intersection = function (x1,y1,x2,y2,x3,y3,x4,y4)
//------------------------------------------------------------------------------
{
	var x1m2 = x1 - x2, x3m4 = x3 - x4;
	var y1m2 = y1 - y2, y3m4 = y3 - y4;
	var x1y2 = x1 * y2, x2y1 = x2 * y1;
	var x3y4 = x3 * y4, x4y3 = x4 * y3;

	var Xdenom = (x1m2*y3m4 - y1m2*x3m4);
	var Ydenom = (x1m2*y3m4 - y1m2*x3m4);

	if (Xdenom == 0 || Ydenom == 0) return [0,0];

	if (Xdenom == 0) Xdenom = 1e-128;
	if (Ydenom == 0) Ydenom = 1e-128;

	return [
		parseInt ((((x1y2-x2y1)*x3m4) - (x1m2*(x3y4-x4y3))) / Xdenom),
		parseInt ((((x1y2-x2y1)*y3m4) - (y1m2*(x3y4-x4y3))) / Ydenom)
	];
}

//------------------------------------------------------------------------------
/// @brief enables documentation of progress during calls
var call = function (fun)
//------------------------------------------------------------------------------
{
	if (Array.isArray(fun))
	{
		for (var f of fun) { call(f); }
	}
	else
	{
		var boiler = " ".repeat (session.indent) + '<';
		var plate  = fun + '>';
		if (session.verbose) console.log (boiler + plate);
		session.indent = session.indent + tab;
		window[fun] ();
		session.indent = session.indent - tab;
		if (session.verbose) console.log (boiler + '/' + plate);
	}
} // call


//------------------------------------------------------------------------------
var property = function (instance, key)
//------------------------------------------------------------------------------
{
	if (Array.isArray (key))
	{
		for (var key of keys)
		{
			property (instance, key);
		}
	}
	else
	{
		instance.setAttribute(key, peek (key));
	}
} // property


//------------------------------------------------------------------------------
var planeAxes = function (i)
//------------------------------------------------------------------------------
{
	if (session.axes)
	{
		var offset = (session.axes == 2) ? column - 10 : 0;
		var len = 8;
		var adjust = 3;
		var hor = pane[i][2].axes[0], ver = pane[i][2].axes[1];
		var y = i * edge + y0 + offset;
		var x = x0 - offset;
		var color = '#ffff00';
		// display axis lines
		line (x-len,y,x+len,y,color);
		line (x,y-len,x,y+len,color);
		session.context.fillStyle = color;
		// display axis labels
		session.context.fillText (hor, x+adjust+len, y+adjust);
		session.context.fillText (ver, x-adjust, y-adjust-len);
	}
} // planeAxes


//------------------------------------------------------------------------------
var planeRGB = function (i, q)
//------------------------------------------------------------------------------
{
	var R = pane[i][index.RGB][index.R];
	var G = pane[i][index.RGB][index.G];
	var B = pane[i][index.RGB][index.B];
	R = q ? (R<127) * 0xff : R;
	G = q ? (G<127) * 0xff : G;
	B = q ? (B<127) * 0xff : B;
	return 'rgb(' + R + ',' + G + ',' + B + ')';
} // planeRGB


//##############################################################################
// EVENT FUNCTIONS

//------------------------------------------------------------------------------
function eventMouseClick (e)
//------------------------------------------------------------------------------
{
	if (scenario.visible && !scenario.permanent)
	{
		scenario.movable = !scenario.movable;
		eventMouseMove (e);
		call ("displayAll");
	}
} // eventMouseClick


//------------------------------------------------------------------------------
function eventMouseMove (e)
//------------------------------------------------------------------------------
{
	var canvas = document.getElementById (id.figure1a.canvas);
	var x = e.clientX
		- Math.round (canvas.getBoundingClientRect().left)
		- x0
	;
	var y = e.clientY
		- Math.round (canvas.getBoundingClientRect().top);
	;
	var which = parseInt (y / edge);

	var about = document.getElementById ("paneInfo");
	about.innerHTML = pane[which][2].text;

	if (scenario.visible && scenario.movable)
	{
		y -= y0 + (index.scene * session.pane.y);
		scenario.interval = interval.minimum;
		if (session.timeout)
		{
			clearTimeout (session.timeout);
		}
		if (Math.abs (x) <= x0 && Math.abs (y) <= y0)
		{
			scenario.point.x = (session.mouse.x = x) + x0;
			scenario.point.y = (session.mouse.y = y) + y0;
			if (session.verbose)
			{
				console.log ('m(' + x + ',' + y + ')');
			}
			call ("displayAll");
		}
	}
} // eventMouseMove


//------------------------------------------------------------------------------
function eventPupilEnter (e)
//------------------------------------------------------------------------------
{
	var element = e.target;
	element.style.color = "white";
	element.style.backgroundColor = "black";
} // eventPupilEnter


//------------------------------------------------------------------------------
function eventPupilLeave (e)
//------------------------------------------------------------------------------
{
	var element = e.target;
	element.style.color = "black";
	element.style.backgroundColor = "#ffffcc";
} // eventPupilLeave


//------------------------------------------------------------------------------
function eventPupilClick (d)
//------------------------------------------------------------------------------
{
	session.pupil = d;
	call ("displayAll");
} // eventPupilClick


//------------------------------------------------------------------------------
function eventSave ()  // must be function not var for onclick
//------------------------------------------------------------------------------
{
	console.log ("Saving as:", scenario.filename);
	var element = document.getElementById("buttonSave");
	element.download = scenario.filename;
    			element.href = document.
		getElementById(id.figure1a.canvas).
		toDataURL("image/png")
		;
} // eventSave


//------------------------------------------------------------------------------
var eventSelect = function ()
//------------------------------------------------------------------------------
{
	var element = document.getElementById ("figure 1a menu");
	var value = parseInt (element.selectedOptions[0].value) - 1;
	scenario = viewable[value];
	scenario.number = value;
	call('main');
} // eventSelect


//------------------------------------------------------------------------------
function eventToggleAxes ()
//------------------------------------------------------------------------------
{
	const label = [
		'axes absent',
		'axes center',
		'axes corner'
	];
	session.axes = (session.axes + 1) % 3;
	var next = (session.axes + 1) % 3;
	var element = document.getElementById("buttonAxes");
	element.innerHTML = label[next];
	call ("displayAll");
} // eventToggleAxes


//------------------------------------------------------------------------------
function eventToggleDebug ()
//------------------------------------------------------------------------------
{
	var element = document.getElementById("buttonDebug");
	element.innerHTML = session.verbose ? "debug on" : "debug off";
	session.verbose = !session.verbose;
} // eventToggleDebug


//------------------------------------------------------------------------------
function eventToggleVerge ()
//------------------------------------------------------------------------------
{
	var element = document.getElementById("buttonVerge");
	element.innerHTML = session.converge ? "verge on" : "verge off";
	session.converge = !session.converge;
} // eventToggleVerge


//##############################################################################
// DRAWING PRIMITIVE FUNCTIONS

//------------------------------------------------------------------------------
var disk = function (x,y,r,c)
//------------------------------------------------------------------------------
{
	session.context.fillStyle = c;
	session.context.beginPath ();
	session.context.arc (x, y, r, 0, tau);
	session.context.closePath ();
	session.context.fill ();
} // disk


//------------------------------------------------------------------------------
var circle = function (x,y,r,c)
//------------------------------------------------------------------------------
{
	session.context.strokeStyle = c;
	session.context.beginPath ();
	session.context.arc (x, y, r, 0, tau);
	session.context.closePath ();
	session.context.stroke ();
} // circle


//------------------------------------------------------------------------------
var line = function (x1,y1,x2,y2,c)
//------------------------------------------------------------------------------
{
	session.context.strokeStyle = c;
	session.context.beginPath ();
	session.context.moveTo (x1,y1);
	session.context.lineTo (x2,y2);
	session.context.stroke ();
} // line


//------------------------------------------------------------------------------
var muscle = function (x,y,length)
//------------------------------------------------------------------------------
{
	var width = diameter / length;
	session.context.fillStyle = '#aa0055';
	session.context.beginPath ();
	session.context.ellipse (x,y-2*length/3,width,length,0,tau,false);
	session.context.fill ();
}


//------------------------------------------------------------------------------
var ipane = function (i,h1,h2)
//------------------------------------------------------------------------------
{
	var title = '' + (i+1) + '. ' + pane[i][index.L];
	session.context.fillStyle = planeRGB (i, false);
	session.context.fillRect (0,h1,session.pane.x,h2);
	session.context.fillStyle = planeRGB(i, true);
	session.context.fillText (title, 10, h1 + 20);
} // ipane


//##############################################################################
// NON-DISPLAY CALL FUNCTIONS

//------------------------------------------------------------------------------
var initialize = function ()
//------------------------------------------------------------------------------
{
	// reverse index labels to indices

	var buttonSave = document.getElementById("buttonSave");
	buttonSave.innerHTML = viewable[scenario.number].filename;
} // initialize


//------------------------------------------------------------------------------
var constructMenu = function ()
//------------------------------------------------------------------------------
{
	var select = document.getElementById (id.figure1a.menu);
	var value = select.selectedOptions[0].value;
	var selected = 0;
	if (value !== undefined) selected = parseInt (value) - 1;

	// Empty the current menu select
	var fc = select.firstChild;
	while (fc)
	{
		select.removeChild (fc);
		fc = select.firstChild;
	}

	// Refill the select
	for (var s=0; s<scenarios; ++s)
	{
		var option = document.createElement ('option');
		//option.setAttribute ('id', s);
		option.setAttribute ('onchange', 'eventSelect()');
		if (selected == s) option.setAttribute ('selected', true);
		option.innerHTML=''+(s+1)+'. '+viewable[s].title;
		select.appendChild (option);
	}
} // constructMenu


//##############################################################################
// DISPLAY CALL FUNCTIONS

//------------------------------------------------------------------------------
var displayAll = function ()
//------------------------------------------------------------------------------
{
	var funs = [
		'displayCanvas',
		'displayAmbient',
		'displayEyeballs',
		'displayDiffraction',
		'displayInfo',
		'displayLines',
		'displayVerge',
		'displayMotor',
		'displayExperiment',
		'displayAxes',
		'displayPoints',    // last to keep point above other content
		'displayInternals',
	];
	call (funs);

	scenario.interval += interval.increment;
	if (scenario.interval > scenario.maximum)
	{
		scenario.interval = scenario.maximum;
	}
	if (scenario.saccade)
	{
		session.timeout = setTimeout (displayAll, scenario.interval);
	}
	else
	{
		if (session.timeout)
		{
			clearTimeout(session.timeout);
		}
	}
} // displayAll


//------------------------------------------------------------------------------
var displayAmbient = function ()
//------------------------------------------------------------------------------
{
} // displayAmbient


//------------------------------------------------------------------------------
var displayAxes = function ()
//------------------------------------------------------------------------------
{
	for (var i=0; i<panes ; ++i)
	{
		planeAxes (i);
	}
} // displayAxes


//------------------------------------------------------------------------------
var displayCanvas = function ()
//------------------------------------------------------------------------------
{
	var instance = document.getElementById (id.figure1a.canvas);
	if (instance.getContext)
	{
		var h3 = session.frame.y;

		instance.width  = session.pane.x;
		instance.height = h3;

		session.context = instance.getContext ('2d');
		session.context.font = font;

		// pane color and label
		for (var i=0, h1=0, h2=session.pane.y ; i<panes ; ++i)
		{
			ipane (i,h1,h2);
 						h1 += session.pane.y;
			h2 += session.pane.y;
			//var frame = 'frame' + (i+1);
			//var element = document.getElementById (frame);
			//element.innerHTML = pane[i][1];
		}
		// image outline
		session.context.fillStyle = '#000000';
		session.context.strokeRect (0,0,session.pane.x,h3);
	}
} // displayCanvas


//------------------------------------------------------------------------------
var displayCrossover = function (axys)
//------------------------------------------------------------------------------
{
	if (!scenario.visible) return;
	// Store lineWidth temporarily to restore before return
	var lw    = session.context.linewidth;
	session.context.lineWidth = 1;

	// Calculate offset to upper left corner
	var paney = index.crossover * session.pane.y;

	// Generate the crossover background grid
	for (var i=-edge;i<=edge;i+=10)
	{
		line (i,paney,i+edge,paney+edge,color.grid);
		line (i+edge,paney,i,paney+edge,color.grid);
	}

	// Set the fixed opposing lines
	line (    edge,     paney,        0, paney+edge, '#ff0000');
	line (       0,     paney,     edge, paney+edge, '#00ff00');

	// Label the fixed opposing lines
	session.context.fillStyle = '#ff0000';
	session.context.fillText ('S',      x0/2 - 15, paney + y0 + y0/2);

	session.context.fillStyle = '#00ff00';
	session.context.fillText ('D', x0 + x0/2 +  5, paney + y0 + y0/2);

	// Calculate display for moving lines of sight
	// Extract eye-relative point source offsets
	// Expect these to be in center (0,0) coordinates
	// x is towards right, y is away from eyeballs (actually, Z axis)
	var Sxy = axys[0];    // left  eye point offset
	var Dxy = axys[1];    // right eye point offset
	var Sx = Sxy[0], Sy = Sxy[1];
	var Dx = Dxy[0], Dy = Dxy[1];

	var x1=0, y1=0, x2=0, y2=0, x3=0, y3=0, x4=0, y4=0;

	if      (Sx < 0) { x1 = +x0   ; x2 = -x0-Sx; y1 = +y0+Sx; y2 = -y0   ; }
	else if (Sx > 0) { x1 = +x0-Sx; x2 = -x0   ; y1 = +y0   ; y2 = -y0+Sx; }
	else             { x1 = +x0   ; x2 = -x0   ; y1 = +y0   ; y2 = -y0   ; }

	// X Traversal direction is negative
	if      (Dx < 0) { x3 = +x0   ; x4 = -x0-Dx; y3 = -y0-Dx; y4 = +y0   ; }
	else if (Dx > 0) { x3 = +x0-Dx; x4 = -x0   ; y3 = -y0   ; y4 = +y0-Dx; }
	else             { x3 = +x0   ; x4 = -x0   ; y3 = -y0   ; y4 = +y0   ; }

	// Show the active lines
	line (x1+x0,paney + y1+y0,x2+x0,paney + y2+y0,'#ff0000');
	line (x3+x0,paney + y3+y0,x4+x0,paney + y4+y0,'#00ff00');

	if (true)
	{
		// Intersection points do not quite work yet.
		var PSxy = intersection (x1,y1,x2,y2,edge,   0,   0,edge);
		var PDxy = intersection (x3,y3,x4,y4,   0,   0,edge,edge);
		// TODO use these as vectors to drive the rectus muscles
		eye.S.vector = {x:-(PSxy[0]-x0),y:-(PSxy[1]-x0)}; // TODO why (x0,y0)
		eye.D.vector = {x:-(PDxy[0]   ),y:-(PDxy[1]   )};
		console.log(eye.S.vector,eye.D.vector);

		// Points at intersections of active and passive lines
		disk (PSxy[0]   ,paney+PSxy[1]   ,2,'#ff0000');
		disk (PDxy[0]+x0,paney+PDxy[1]+y0,2,'#00ff00'); // TODO Why x0,y0?
	}

	// Show the (0,0) point
	disk (x0,y0+paney,2,'#ffffff');

	// Restore the lineWidth
	session.context.lineWidth = lw;
} // displayCrossover

//------------------------------------------------------------------------------
var olddisplayCrossover = function (axys)
//------------------------------------------------------------------------------
{
	if (!scenario.visible) return;
	// https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection
	// x = (d-c)/(a-b)
	// y = a * x + c;
	// pxy = [
	//      (((x1*y2-y1*x2)-(x1-x2)*(x3*y4-y3*x4))/
	//       ((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4))),
	//      (((x1*y2-y1*x2)*(y3-y4)-(y10y2)*(x3*y4-y3*x4))/
	//       (x1-x2)*(y3-y4)-(y1-y2)*(x3-x4))
	// ]

	// Store lineWidth temporarily to restore before return
	var lw    = session.context.linewidth;
	session.context.lineWidth = 1;

	// Calculate offset to upper left corner
	var paney = index.crossover * session.pane.y;

	// yn is top of crossover pane relative to center
	var yn = y0 - column;
	var yp = y0 + column;

	// Extract eye-relative point source offsets
	// Expect these to be in center coordinates
	var Sxy = axys[0];    // left  eye point offset
	var Dxy = axys[1];    // right eye point offset

	/*
	// Calculate corner offsets for eye-relative point source offsets
	var Sx = Sxy[0] + x0;
	var Dx = Dxy[0] + x0;
	var Sy = Sxy[1] + y0;
	var Dy = Dxy[1] + y0;

	// sign determines direction from center to each eye
	var Ssign = -1;
	var Dsign = 1;

	// Calculate coordinates for fixation crossover
	var x1 = Sx-Ssign*column;
	var x2 = Sx+Ssign*column;
	var x3 = Dx-Dsign*column;
	var x4 = Dx+Dsign*column;

	// y1->y2 is one line's vertical, y3-y4 is the other line's
	var y1 = yn; //Sy-Ssign*column; //yn;
	var y2 = yp; //Sy+Ssign*column; //yp;
	var y3 = yn; //Dy-Dsign*column; //yn;
	var y4 = yp; //Dy+Dsign*column; //yp;

	// Calculate location of fixation relative to point source
	var x1y2 = x1*y2, x3y4 = x3*y4;
	var x2y1 = x2*y1, x4y3 = x4*y3;

	var x1mx2 = x1-x2, x3mx4 = x3-x4;
	var y1my2 = y1-y2, y3my4 = y3-y4;

	var x1y2mx2y1 = x1*y2 - x2*y1;
	var x3y4mx4y3 = x3*y4 - x4*y3;

	var denom = x1mx2*y3my4-y1my2*x3mx4;

	// (px,py) are the fixation point coordinates
	var px = parseInt((x1y2mx2y1*x3mx4 - x3y4mx4y3*x1mx2)/denom);
	var py = parseInt((x1y2mx2y1*y3my4 - x3y4mx4y3*y1my2)/denom);

	// Offset local coordinates to canvas coordinates
	y1 += paney;
	y2 += paney;
	y3 += paney;
	y4 += paney;
	py += paney;

	// TODO why are these fudge factors needed?
	//py = (py - y0) * 3 + y0;
	//px = (px - x0) * 3 / 8 + x0;
*/

	// Generate the crossover background grid
	for (var i=-edge;i<=edge;i+=10)
	{
		line (i,paney,i+edge,paney+edge,color.grid);
		line (i+edge,paney,i,paney+edge,color.grid);
	}

	/*
	if (false)
	{
		// Display RED diagonal reticle for the hyperacute point image
		line (0, paney     , edge, paney+edge, color.actual);
		line (0, paney+edge, edge, paney     , color.actual);

		// Display GREEN reticle for fixation point
		line (x0-edge,py,x0+edge,py, color.fixation);
		line (px,y0+paney-column,px,y0+paney+column, color.fixation);
		disk (px,py+paney,2,color.fixation);

		// Display vector from hyperacute point image to fixation point
		line (x0,y0+paney,px,py,color.vector);
		disk (x0,y0+paney,2,color.actual);
	}
	else
	*/
	{
		// Display optic axis with reticle
		line (x0,paney+yn,x0,paney+yp,color.fixation);
		line ( 0,paney+y0,edge,paney+y0);
		disk (x0,y0+paney,2,color.fixation);

		// Display 3D point offset in crossover
		var Sx = Sxy[0], Sy = Sxy[1];
		var Dx = Dxy[0], Dy = Dxy[1];

		var x1 = Sx - edge, x2 = Sx + edge;
		var y1 = Sy - edge, y2 = Sy + edge;

		var x3 = Dx - edge, x4 = Dx + edge;
		var y3 = Dy + edge, y4 = Dy - edge;

		var pSx = Sx+x0, pSy = Sy+paney+y0;
		var pDx = Dx+x0, pDy = Dy+paney+y0;

		line (pSx-edge,  pSy-edge, pSx+edge,   pSy+edge, '#ff0000');
		line (    edge,     paney,        0, paney+edge, '#ff0000');
		line (       0,     paney,     edge, paney+edge, '#00ffff');
		line (pDx+edge,  pDy-edge, pDx-edge,   pDy+edge, '#00ffff');
	}

	session.context.fillStyle = '#fffff';
	session.context.fillText ('Sinister', x0, paney + y0, '#ff0000');
	console.log (x0, paney + y0);

	// Restore the lineWidth
	session.context.lineWidth = lw;
} // displayCrossover


//------------------------------------------------------------------------------
var displayDiffract = function (axys)
//------------------------------------------------------------------------------
{
	if (!scenario.visible) return;

	var paney = index.image * session.pane.y;
	//var paney = pane[index.image][2].corner.y;
	var lw = session.context.lineWidth;
	var coeff = session.coeff;
	var coeff2 = (7 * coeff) / 8;
	session.context.lineWidth = coeff2 / session.pupil; //parseInt (
		//10 * coeff * session.context.linewidth / session.pupil);
	var half = session.context.lineWidth / 2;

	for (var axy of axys)
	{
		var x = -axy[0] + x0;
		var y =  axy[1] + y0 + paney;
		var r1 = parseInt (1.219 * coeff / session.pupil);
		var r2 = parseInt ((2.219 * coeff / session.pupil) - half);
		var r3 = parseInt ((3.219 * coeff / session.pupil) - half);
		disk   (x, y, r1, '#ff000077');
		circle (x, y, r2, '#77000077');
		circle (x, y, r3, '#33000077');
	}
	session.context.lineWidth = 1;
	line (x0,paney+y0-column,x0,paney+y0+column,'#333333');
	session.context.lineWidth = lw;

	/* Airy maintains an abstract fine-grained Airy lookup table.*/
    			var u0 = 3.8317059702075125; // First zero of j1(u)/u
    			var r0 = 1.2196698912665045; // Resolve lim u0/r0==pi, u0/pi==r0
	// Initialized singletons
    			var point = [], zeros = [], peaks = [], spike = [];
} // displayDiffract


//------------------------------------------------------------------------------
var displayDiffraction = function ()
//------------------------------------------------------------------------------
{
} // displayDiffraction


//------------------------------------------------------------------------------
var displayExperiment = function ()
//------------------------------------------------------------------------------
{
	var S = parseInt(100 * eye['S'].point);
	var D = parseInt(100 * eye['D'].point);
	var POV = [[S,0],[D,0]]
	displayDiffract   (POV);
	displayHyperacute (POV);
	displayCrossover  (POV);
} // displayExperiment


//------------------------------------------------------------------------------
var displayEyeballs = function ()
//------------------------------------------------------------------------------
{
	for (var letter in eye)
	{
		var sign = (letter == 'S') ? -1 : +1;
		var eyex = x0+sign*ex;
		var eyey = y0+index.eyeballs*session.pane.y;
		var fixx = scenario.vergence.x;
		var fixy = scenario.vergence.y;
		var pntx = scenario.point.x;
		var pnty = scenario.point.y;
		var edx = eyex - fixx;
		var edy = eyey - fixy;
		var adx = eyex - pntx;
		var ady = eyey - pnty;

		// Angle of eye rotation
		var axial = Math.atan2 (edx,edy);
		//console.log ('E(',letter,')',edx,edy,axial);

		// Angle difference between axial and point
		var point = axial - Math.atan2 (adx,ady);
		session.drift[letter] = point;
		//console.log ('A(',letter,')',adx,ady,point);

		eye[letter].axial = axial;
		eye[letter].point = point;

		eye[letter].center.x = eyex;
		eye[letter].center.y = eyey;

		if (session.verbose)
		{
			prefix = (eye[letter].axial >= 0) ? "+" : "";
			console.log (
				letter + ': ' + prefix + eye[letter].axial
			);
		}
		// Calculate parameters for corneal circle
		var dr = (radius * 1) / 4;
		var rx = (radius - dr ) * Math.sin (axial);
		var ry = (radius - dr ) * Math.cos (axial);

		// Draw cornea first (black inside, white edge)
		var cornx = eyex - rx;
		var corny = eyey - ry;
		var cornr = radius / 2;
		disk   (cornx, corny, cornr, '#000000');
		circle (cornx, corny, cornr, '#ffffff');

		// Draw eyeball second (black inside, white edge)
		disk   (eyex, eyey, radius, '#000000');
		circle (eyex, eyey, radius, '#ffffff');

		// Draw pupil
		const pupils = {
			1:[17,32],
			2:[18,32],
			3:[19,32],
			4:[20,32],
			5:[21,32],
			6:[22,32],
			7:[23,32],
			8:[24,32],
		};
		var pupil = pupils[session.pupil];
		var numer = pupil[0];
		var denom = pupil[1];
		var pupr  = numer * cornr / denom;
		disk   (cornx, corny, pupr, '#000000');

		// Construct muscles having appropriate length/diameter.
		var medianLength = 10 * axial;
		var circumferential = 2 * diameter / tau;
		var Ly = -medianLength + circumferential;
		var Ry = +medianLength + circumferential;

		line (eyex-radius,eyey,eyex-radius,eyey+3*radius,"white");
		line (eyex+radius,eyey,eyex+radius,eyey+3*radius,"white");
		muscle (eyex-radius,eyey+diameter, Ly);
		muscle (eyex+radius,eyey+diameter, Ry);
		session.context.fillStyle = planeRGB(index.eyeballs, true);
		session.context.fillText (letter, eyex - 5, diameter + eyey);
	}
} // displayEyeballs


//------------------------------------------------------------------------------
var displayHyperacute = function (axys)
//------------------------------------------------------------------------------
{
	if (!scenario.visible) return;

	var paney = index.hyperacute * session.pane.y;
	var lw    = session.context.linewidth;
	session.context.lineWidth = 1;
	for (var axy of axys)
	{
		var x = -axy[0] + x0;
		var y =  axy[1] + y0 + paney;
		var show = true;
		/*
		show = (
			(scenario.blinkdown == 0) ||
			(session.blinkdown > (scenario.blinkdown - 2)));
		*/
		if (show)
		{
			var r1 = parseInt (1.219 * session.coeff / session.pupil);
			var r2 = parseInt (2.219 * session.coeff / session.pupil);
			var r3 = parseInt (3.219 * session.coeff / session.pupil);
			circle (x, y, r1, '#00ffff77');
			circle (x, y, r2, '#00777777');
			disk   (x, y,  2, '#ff000077');
		}
	}
	session.context.lineWidth = lw;

} // displayHyperacute


//------------------------------------------------------------------------------
var displayInfo = function ()
//------------------------------------------------------------------------------
{
	var text = document.getElementById (id.figure1a.text);
	text.innerHTML = scenario.text;
} // displayInfo


//------------------------------------------------------------------------------
var displayInternals = function ()
//------------------------------------------------------------------------------
{
	//document.getElementById ("key.id").innerHTML = 'scenario.number';
	//document.getElementById ("val.id").innerHTML = scenario.number;
} // displayInternals


//------------------------------------------------------------------------------
var displayLines = function ()
//------------------------------------------------------------------------------
{
	// for each eye
	// start with two points, fixation and center of eye
	// project line between from center of eye to foveola
	// draw line from foveola to fixation (or edge of scene pane)
	for (var letter in eye)
	{
		var axial = eye[letter].axial;
		var point = eye[letter].point;
		// location of fixation point
		var fixx = scenario.vergence.x;
		var fixy = scenario.vergence.y;
		// location of eyeball center
		var eyex = eye[letter].center.x;
		var eyey = eye[letter].center.y;
		// location of foveola
		var fovx = eyex + radius * Math.sin (axial);
		var fovy = eyey + radius * Math.cos (axial);
		var actx = eyex + radius * Math.sin (axial-point);
		var acty = eyey + radius * Math.cos (axial-point);
		// store foveola xy for later use
		eye[letter].foveola.x = fovx;
		eye[letter].foveola.y = fovy;
		eye[letter].actual.x  = actx;
		eye[letter].actual.y  = acty;
		// draw line from foveola to fixation point
		line (fovx,fovy,fixx,fixy,'#00aaaa');
		disk (fovx,fovy,3,'#00ffff');
		disk (fixx,fixy,3,'#00ffff');
		disk (actx,acty,3,'#ff0000');
	}
} // displayLines


//------------------------------------------------------------------------------
var displayMotor = function ()
//------------------------------------------------------------------------------
{
	var paney = index.motor * session.pane.y;

	// Calculate the midlines for vertical plotting
	var xSL = parseInt (x0 - 3 * x0 / 4);  // Left  Lateral Rectus
	var xSM = parseInt (x0 - 1 * x0 / 4);  // Left  Medial  Rectus
	var xDM = parseInt (x0 + 1 * x0 / 4);  // Right Medial  Rectus
	var xDL = parseInt (x0 + 3 * x0 / 4);  // Right Lateral Rectus

	// Graph dividers
	line (     x0,paney,     x0,paney+edge,'#007700');
	line (x0-x0/2,paney,x0-x0/2,paney+edge,'#007700');
	line (x0+x0/2,paney,x0+x0/2,paney+edge,'#007700');

	// Get local references to data
	var SL = pane[index.motor][2].SL;
	var SM = pane[index.motor][2].SM;
	var DM = pane[index.motor][2].DM;
	var DL = pane[index.motor][2].DL;

	// Create a loopable map
	var data = [
		[xSL, SL, 'SL', 'S', -1, -1],
		[xSM, SM, 'SM', 'S', -1, +1],
		[xDM, DM, 'DM', 'D', +1, +1],
		[xDL, DL, 'DL', 'D', +1, -1],
	];

	var x8 = x0 / 8;
	for (var datum of data)
	{
		var zero   = datum[0];
		var arr    = datum[1].data;
		var lbl    = datum[2];
		var letter = datum[3];
		var pulse  = datum[1].pulse;
		var off    = pane[index.motor][2].start;
		var phi    = parseInt (session.drift[letter] * 10);
		//console.log(phi);

		// Determine pulse interval change
		//pulse[1] = phi * data[4] * data[5];
		//if (session.drift > 0)
		//{
			//pulse[1] = phi;
		//}
		//else if (session.drift < 0)
		//{
			//pulse[1] = -phi
		//}

		// Add a pulse if it is time
		pulse[0] = pulse[0] - 1;

		if (pulse[0] <= 0)
		{
			pulse[0] = pulse[1] + pane[index.motor][2].standard;
			// Put a pulse in the data
			arr[off] = 1;
			// Adjust interval
		}
		else
		{
			arr[off] = 0;
		}

		// Display pulses in a running stream
		for (var j=0; j<edge; ++j)
		{
			if (arr[off])
			{
				var xl = parseInt (zero + x8 * arr[off]);
				var xr = parseInt (zero - x8 * arr[off]);
				var y = paney + j;
				line (xl,y,xr,y,'#ff7777');
			}
			off = (off - 1 + edge) % edge;
		}

		// Label the muscle signals
		session.context.fillStyle = '#ffffff';
		session.context.fillText (lbl, zero-10, paney + edge - 10);
	}
	pane[index.motor][2].start = (
		pane[index.motor][2].start + 1
	) % edge;

} // displayMotor


//------------------------------------------------------------------------------
var displayPoints = function ()
//------------------------------------------------------------------------------
{
	// TODO draw fake Airy disk and fake first ring
	if (scenario.visible)
	{
		if (scenario.blink)
		{
			if (session.blinkdown-- <= 0)
			{
				session.blinkdown = scenario.blinkdown;
				session.blinkon = !session.blinkon;
			}
			if (session.blinkon)
			{
				disk (scenario.point.x, scenario.point.y, 2, '#ff0000');
			}
		}
		else
		{
			disk (scenario.point.x, scenario.point.y, 2, '#ff0000');
		}
	}
} // displayPoints


//------------------------------------------------------------------------------
var displayVerge = function ()
//------------------------------------------------------------------------------
{
	if (scenario.visible && scenario.converge)
	{
		var rx = 0;
		var ry = 0;
		if (scenario.saccade)
		{
			rx = getRandomInt (5) - getRandomInt (5);
			ry = getRandomInt (5) - getRandomInt (5);
		}
		var dx = session.mouse.x - scenario.vergence.x + x0 + rx;
		var dy = session.mouse.y - scenario.vergence.y + y0 + ry;
		if (session.converge)
		{
			if (dx)
			{
				scenario.vergence.x += dx / bits (dx);
			}
			if (dy)
			{
				scenario.vergence.y += dy / bits (dy);
			}
		}
	}
} // displayVerge


//##############################################################################
// MAIN FUNCTION

//------------------------------------------------------------------------------
var main = function ()
//------------------------------------------------------------------------------
{
	for (var s=0;s<scenarios;++s)
	{
		viewable[s].number = s;
		viewable[s].filename = "gaze." + s + ".png";
	}
	for (var p=0;p<pane.length;++p)
	{
		pane[s][2].corner.x = 0;
		pane[s][2].center.x = x0;
		pane[s][2].corner.y = s * edge;
		pane[s][2].center.y = s * edge + y0;
	}
	var about = document.getElementById ("paneInfo");
	about.innerHTML = pane[0][2].text;
	var funs = [
		'constructMenu',
		'initialize',
		'displayAll'
	];
	call (funs);
} // main


//##############################################################################
// ENTRYPOINT

//------------------------------------------------------------------------------
window.onload = function ()
//------------------------------------------------------------------------------
{
	call('main');
} // onload

