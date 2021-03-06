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
	sequence  : 0,
	amplitude : new Float32Array (area),
	axes      : 0,
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
	pulsed    : {SL:false,SM:false,DM:false,DL:false},
};

// optician S(inister) = left, D(exter) = right
// axial is the angle of the eye relative to straight forward
// point is the angle between the axial line of sight and the point
var eye = {
	S:{
		point:0,
		axial:0,
		change: 0,
		actual: {x:0,y:0},
		center: {x:0,y:0},
		foveola:{x:0,y:0},
		vector: {x:0,y:0},
		muscle: {L:0,M:0},
	},
	D:{
		point:0,
		axial:0,
		change: 0,
		actual: {x:0,y:0},
		center: {x:0,y:0},
		foveola:{x:0,y:0},
		vector: {x:0,y:0},
		muscle: {L:0,M:0},
	}
};

//##############################################################################
// SERVICE FUNCTIONS

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
		'displayTwitch',
		'displayExperiment',
		'displayAxes',
		'displayPoints',    // last to keep point above other content
		'displayInternals',
	];
	call (funs);
	session.sequence++;

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
	session.context.fillStyle = '#00ff00';
	session.context.fillText ('D',      x0/2 - 15, paney + y0 + y0/2);

	session.context.fillStyle = '#ff0000';
	session.context.fillText ('S', x0 + x0/2 +  5, paney + y0 + y0/2);

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

	//var O='(', I=')(', C=')';
	//console.log (O,x1,y1,I,x2,y2,I,x3,y3,I,x4,y4,C);

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
		//console.log(eye.S.vector,eye.D.vector);

		// Points at intersections of active and passive lines
		disk (PSxy[0]   ,paney+PSxy[1]   ,2,'#ff0000');
		disk (PDxy[0]+x0,paney+PDxy[1]+y0,2,'#00ff00'); // TODO Why x0,y0?
	}

	if (       PSxy[0] < x0) { // Rotate left eye left.
		eye.S.muscle.L = +4; eye.S.muscle.M = -4;
	} else if (PSxy[0] > x0) { // Rotate left eye right
		eye.S.muscle.L = -4; eye.S.muscle.M = +4;
	} else {
		eye.S.muscle.L =  0; eye.S.muscle.M =  0;
	}

	if (       PDxy[0] < 0) { // Rotate right eye left.
		eye.D.muscle.L = -4; eye.D.muscle.M = +4;
	} else if (PDxy[0] > 0) { // Rotate right eye right
		eye.D.muscle.L = +4; eye.D.muscle.M = -4;
	} else {
		eye.D.muscle.L =  0; eye.D.muscle.M =  0;
	}

	//console.log (PSxy,PDxy);

	// Show the (0,0) point
	disk (x0,y0+paney,2,'#ffffff');

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
    //var u0 = 3.8317059702075125; // First zero of j1(u)/u
    //var r0 = 1.2196698912665045; // Resolve lim u0/r0==pi, u0/pi==r0
	// Initialized singletons
    //var point = [], zeros = [], peaks = [], spike = [];
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

		var axial = Math.atan2 (edx,edy);
		var point = 0;
		if (false)
		{
			// TODO New pulse management of rotation
			var _L = letter + 'L';
			var _M = letter + 'M';
			var offset = pane[index.motor][2].start;
			var L = pane[index.motor][2][_L].data[offset];
			var M = pane[index.motor][2][_M].data[offset];
			var force = sign * (L * +1 + M * -1);
		}
		// Angle of eye rotation
		point = axial - Math.atan2 (adx,ady);

		// Angle difference between axial and point
		session.drift[letter] = point;

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
		[xSL, SL, 'S', 'L'],
		[xSM, SM, 'S', 'M'],
		[xDM, DM, 'D', 'M'],
		[xDL, DL, 'D', 'L'],
	];

	//var offset = pane[index.motor][2].start;
	//var v = pane[index.motor][2].SL.data[offset];

	var x8 = x0 / 8;
	for (var datum of data)
	{
		var zero   = datum[0];
		var arr    = datum[1].data;
		var letter = datum[2];
		var side   = datum[3];
		var lbl    = letter + side;
		var off    = pane[index.motor][2].start;

		var modulo = (session.sequence) % (8 + eye[letter].muscle[side]);
		var pulse = modulo ? 0 : 1;
		session[lbl] = pulse;
		arr[off] = pulse;
		//eye[letter].change = 

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
		disk (scenario.point.x, scenario.point.y, 2, '#ff0000');
	}
} // displayPoints


//------------------------------------------------------------------------------
var displayTwitch = function ()
//------------------------------------------------------------------------------
{
	var paney = index.twitch * session.pane.y;

	// Calculate the midlines for vertical plotting
	var xSL = parseInt (x0 - 3 * x0 / 4);  // Left  Lateral Rectus
	var xSM = parseInt (x0 - 1 * x0 / 4);  // Left  Medial  Rectus
	var xDM = parseInt (x0 + 1 * x0 / 4);  // Right Medial  Rectus
	var xDL = parseInt (x0 + 3 * x0 / 4);  // Right Lateral Rectus

	// Get local references to data
	var SL = pane[index.motor][2].SL;
	var SM = pane[index.motor][2].SM;
	var DM = pane[index.motor][2].DM;
	var DL = pane[index.motor][2].DL;

	// Create a loopable map
	var data = [
		[xSL, SL, 'S', 'L'],
		[xSM, SM, 'S', 'M'],
		[xDM, DM, 'D', 'M'],
		[xDL, DL, 'D', 'L'],
	];

	for (var datum of data)
	{
		var zero   = datum[0];
		var arr    = datum[1].data;
		var letter = datum[2];
		var side   = datum[3];
		var lbl    = letter + side;
		var off    = pane[index.motor][2].start;
		var pulse  = session[lbl];

		// Label the muscle signals
		session.context.fillStyle = '#ffffff';
		session.context.fillText (lbl, zero-10, paney + edge - 10);

		disk (datum[0],y0+paney,radius,'#660000');
		var tonus = 8 * (1 + 2 * parseInt (pulse));
		//if (pulse)
		{
			for (var n=0;n<tonus;++n)
			{
				var xy = xyTwitch.data[xyTwitch.index++];
				disk (datum[0]+xy[0],paney + y0 + xy[1],2,'#ff0000');
			}
		}
		xyTwitch.index %= xyTwitch.size;
	}
}


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
			rx = newRandomInt (5) - newRandomInt (5);
			ry = newRandomInt (5) - newRandomInt (5);
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

