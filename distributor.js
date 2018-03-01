/* Copyright&copy; 2018 Jonathan D. Lettvin, All Rights Reserved. */

'use strict';

const tau  = Math.PI * 2;

//-------------------------------------------------------------------------------
// https://davidwalsh.name/add-rules-stylesheets
function addCSSRules(sheet, selector, rules, index=0) {
//-------------------------------------------------------------------------------
	if("insertRule" in sheet) {
		sheet.insertRule(selector + "{" + rules + "}", index);
	}
	else if("addRule" in sheet) {
		sheet.addRule(selector, rules, index);
	}
} // addCSSRules


//------------------------------------------------------------------------------
function box (x0,y0,x1,y1,c)
//------------------------------------------------------------------------------
{
	var the = document.distributor;
	var ctx = the.canvas.context;

	ctx.beginPath ();
	ctx.rect (x0, y0, x1, y1);
	ctx.fillStyle = c;
	ctx.fill ();
} // box

//------------------------------------------------------------------------------
function disk (x,y,r,c)
//------------------------------------------------------------------------------
{
	var the = document.distributor;
	var ctx = the.canvas.context;

	ctx.fillStyle = c;
	ctx.beginPath ();
	ctx.arc (x, y, r, 0, tau);
	ctx.closePath ();
	ctx.fill ();
} // disk


//-------------------------------------------------------------------------------
// use stored audio context, masterGain and nodeGain1 nodes
function audible (flag) {
//-------------------------------------------------------------------------------
	var the = document.distributor;

    var context      = the.audio.context;
    var masterGain   = the.audio.masterGain;
    var nodeGain1    = the.audio.nodeGain1;
	var oscillator   = the.audio.oscillator;
	var frequency    = the.audio.frequency;

	// Otherwise, stop the current oscillator
	oscillator && oscillator.stop (context.currentTime);
	oscillator = null;

	// If frequency requested is 0, do NOT make a new oscillator
	if (!flag) return;

	// Otherwise, make a new oscillator
    oscillator = new OscillatorNode (context, {type: 'square'});
	the.audio.oscillator = oscillator;

	// Then get the new oscillator going.
    oscillator.frequency.setValueAtTime (frequency, context.currentTime);
    oscillator.connect (nodeGain1);
    oscillator.start   (context.currentTime);
} // audible


//-------------------------------------------------------------------------------
function ePower (direction)
//-------------------------------------------------------------------------------
{
	var the = document.distributor;
    var strength = document.getElementById ("strength");
    if (the.running)
    {
        if (
            (direction == -1 && the.strong > 0) ||
            (direction == +1 && the.strong < the.hardest) )
        {
            the.strong += direction;
        }
    }
    strength.innerHTML = ' ' + the.strong + ' ';
	reRun ();
} // ePower


//-------------------------------------------------------------------------------
function eDelay (direction)
//-------------------------------------------------------------------------------
{
	var the = document.distributor;
    var interval = document.getElementById ("interval");
    if (the.running)
    {
        var N = the.interval.length - 1;
        if (
            (direction == -1 && the.delay > 0) ||
            (direction == +1 && the.delay < N) )
        {
            the.delay += direction;
            clearInterval (the.timer);
            the.timer = setInterval (
                loop, the.interval[the.delay]);
        }
    }
    interval.innerHTML = ' ' + the.interval[the.delay] + ' ';
	reRun ();
} // eDelay


//-------------------------------------------------------------------------------
function eSofter (e) { ePower (-1); } // eSofter
function eHarder (e) { ePower (+1); } // eHarder
function eSlower (e) { eDelay (+1); } // eSlower
function eFaster (e) { eDelay (-1); } // eFaster
//-------------------------------------------------------------------------------


//-------------------------------------------------------------------------------
function eButton (e)
//-------------------------------------------------------------------------------
{
	var the = document.distributor;
    var id = e.target.id;
    var key = document.getElementById (id).innerHTML;
    var val = the.info[key];
    var tgt = document.getElementById ('info');
    tgt.value = val;
} // eButton


//-------------------------------------------------------------------------------
function eRun (e)
//-------------------------------------------------------------------------------
{
	var the = document.distributor;
    the.running = !the.running;
    if (the.running) {
		loop ();
        the.timer = setInterval (loop, the.interval[the.delay]);
		audible (true);
    } else {
        clearInterval (the.timer);
        the.timer = null;
		audible (false);
    }
    var button = document.getElementById ("pause");
    button.innerHTML = the.running ? "PAUSE" : "START";
} // eRun


//-------------------------------------------------------------------------------
function eStep (e)
//-------------------------------------------------------------------------------
{
	var the = document.distributor;
	if (the.timer == null) {
		loop ();
	}
} // eStep


//-------------------------------------------------------------------------------
function reRun () { if (document.distributor.running) { eRun (); eRun (); } }
//-------------------------------------------------------------------------------


//-------------------------------------------------------------------------------
function loop ()
//-------------------------------------------------------------------------------
{
	var the       = document.distributor;
    var timestamp = new Date ();
    var odd       = (timestamp.getSeconds () & 1);
    var strength  = 1 + the.strong * odd * 0.5;
    var requested = the.active * strength;
	var width     = the.canvas.width;
	var height    = the.canvas.height;
	var x0        = the.canvas.x0;
	var y0        = the.canvas.y0;
	var scale     = the.scale - 1; // -1 to keep fibers within the sarcolemma
	var r0        = parseInt (scale / 2); // radius of visible fiber
	var frequency = requested * 1000 / the.interval[the.delay];

	if (the.audio.frequency != frequency) {
		the.audio.frequency = frequency;
    	audible (true);
	}

	{
		// clear the canvas back to untwitching
		box (0, 0, width, height, "#ffffcc");
		disk (x0,y0,x0,"#552222");
	}

	// Color as many fibers as requested
	while (requested--) {
        the.index = (the.index + 1) % the.fiber.length;
		var xy = the.coordinates[the.fiber[the.index]];
		disk (x0 + xy[0] * scale, y0 + xy[1] * scale, r0, 'red');
    }

	// Show the name of the tonus state
    document.getElementById ('state').innerHTML =
		the.strong ? (odd ? 'HARD' : 'soft') : 'same';
} // loop


//-------------------------------------------------------------------------------
function initializeButtons (names)
//-------------------------------------------------------------------------------
{
    var text = '';
    var i = 0;
    for (name of names)
    {
        var id = 'button' + i++;
        text += '<button id="' + id +
			'" onmouseover="eButton(event)"' +
			'" onclick="eButton(event)"' + '>' +
			name + '</button>';
    }
    var element = document.getElementById ('buttons');
    element.innerHTML = text;
} // initializeButtons


//-------------------------------------------------------------------------------
function initializeInfo ()
//-------------------------------------------------------------------------------
{
	var the = document.distributor;
    var info = the.info= {};

	info['Basic'] = HEREDOC(function () {/*
   When a muscle is cut across, all the individual muscle "fibers" are seen.
Each fiber contracts/releases quickly (a twitch).  Fibers don't stay contracted.
An idle muscle has "tonus" (persistent contraction from many twitches).
Twitching exhausts a fiber.  It must sit idle for a time before twitching again.
   Tonus is when twitches are distributed evenly over fibers in a pattern
that keeps the number of twitching fibers the same and
maximizes time between twitches for any single fiber.
   More twitches at the same time leads to stronger contraction.
The nerve that drives twitches assigns one neuron to each fiber.
The nervous system produces sequences of signals that do not exhaust fibers.
*/});

    info['HowTo'] = HEREDOC(function () {/*
   START/PAUSE animates the model.  Buttons control the interval and strength 
Hovering over buttons above the info box causes text like this to be shown.
   The delay between pulses can be changed (inversely proportional to frequency).
   The difference count of twitching units between soft/HARD can be changed.
   When running, the model shows twitching/resting muscle fibers as red/brown.
Twitch patterns show a repeating soft/HARD tonus for 1 second each.
   Muscles make sounds as fibers twitch, and the model is representative.
When running, the sound frequency is in proportion to twitch activity.
   To aid in visualizing groups of twitching fibers are shown all at once while
the accompanying sound is more consistent with uncoordinated activations.
*/});

    info['Abstract'] = HEREDOC(function () {/*
   A muscle fiber bundle model (large brown circle) is shown in cross section.
Twitching muscle fibers appear as small hexagonal pack red circles.
A muscle fiber is a twitch unit which generates a shortening force.
A muscle fiber extends the length of the muscle.
A muscle fiber is excited by a single motor neuron.
After twitching a fiber needs time to recover before the next twitch.
   This model shows that the time between fiber activations can be maximized
while activations are uniformly distributed within the bundle.
*/});

    info['Axon'] = HEREDOC(function () {/*
   A motor neuron attaches at many points along a single twitch unit.
A twitch signal is sent to all neuromuscular junctions in a muscle fiber.
A twitch unit is activated end-to-end with a single signal.
The entire length of the twitch unit contracts at the same time.
Motor neuron axon terminal arbor shapes guarantee simultaneous activation.
*/});

    info['Dendrite'] = HEREDOC(function () {/*
   The remote dendrite shape for a motor neuron feeding a muscle fiber
is shaped to sample passing gradients in a transient sweeping pattern.
Each motor neuron dendrite is shaped to detect gradients ignored by others.
   The dendrite hosts a fixed set of pre-randomized dendritic spines.
As the sweeping pattern passes across the dendritic spines
those which sample a boundary in the pattern twitch their muscle fibers.
*/});

    info['Coincidences'] = HEREDOC(function () {/*
   The remote dendrite for each motor neuron expresses a pattern
which makes its gradient detectors unique within sampled patterns.
It most likely samples the pattern in multiple places and uses
coincidence of samples to trigger the pulse that activates a muscle fiber.
*/});

    info['Discussion'] = HEREDOC(function () {/*
   As long as the pattern delivered is reliable,
twitch unit duty cycle timing requirements are satisfied.
This strategy guarantees maximum recovery time for all muscle fibers.
   The animated model below illustrates this behavior.
The code driving this image is logically equivalent to
the proposed pre-randomized sampling of a regular pattern.
   Twitch is "all or none": tonus measures average twitches per unit time.
*/});

    info['Conclusions'] = HEREDOC(function () {/*
   Muscles comprising bundles of long duty cycle twitch units
can be run efficiently if twitches are distributed evenly and
if the time between twitches is maximized for any given twitch unit.
   This simple demonstration illustrates the logical economy
enabling implementations to ignore parallelism and simply
act concurrently on all actual delivered pulses,
whether they are dense or sparse,
without the burden of unnecessary calculation.
   This is one of the economies expected in vivo.
*/});

    var keys = [];
    for (var key in info) keys.push (key);
    initializeButtons (keys);

} // info


//-------------------------------------------------------------------------------
function initializeDistributor ()
//-------------------------------------------------------------------------------
{
    document.distributor = {
        interval     : [10, 33, 100, 333, 1000],
		hardest      : 10,
        index        : 0,
        running      : true,
        strong       : 0,
        timer        : null,
		oscillator   : null,
    };
	var the = document.distributor;

	the.delay  = the.interval.length - 1;
	the.radius = 7;
	the.active = the.radius * 2;
	the.scale  = 31;

	the.diameter = 1 + 2 * the.radius;
	the.coordinates = {};
	the.fiber = [];

	var sheet = document.styleSheets[0];

	initializeTable  ();
	initializeAudio  ();
	initializeCanvas ();
    initializeInfo   ();

	document.addEventListener('keypress', (event) => {
  		//const keyName = event.key;
		eStep (event);
	});
} // initializeDistributor


//-------------------------------------------------------------------------------
function initializeTable ()
//-------------------------------------------------------------------------------
{
	var the = document.distributor;

	// Initialize display coordinates and indices
	// the.fiber is an enumeration of all visible fiber indices
	the.coordinates = newHexagonal (the.radius);
	the.fiber = newRange (0, the.coordinates.length);

	// the.fiber is shuffled and used to identify fibers to twitch
	shuffle (the.fiber);
} // initializeTable


//-------------------------------------------------------------------------------
function initializeAudio ()
//-------------------------------------------------------------------------------
{
	var the = document.distributor;

	the.audio = {};

    var context = new (window.AudioContext || window.webkitAudioContext)();

	the.audio.frequency    = 0;
	the.audio.context      = context;
	the.audio.masterGain   = context.createGain();
	the.audio.nodeGain1    = context.createGain();
	the.audio.oscillator   = null;

	var masterGain   = the.audio.masterGain;
	var nodeGain1    = the.audio.nodeGain1;

	masterGain.gain.setValueAtTime (0.5, context.currentTime);
	masterGain.connect(context.destination);

	nodeGain1.gain.setValueAtTime (0.5, context.currentTime);
	nodeGain1.connect(masterGain);
} // initializeAudio


//-------------------------------------------------------------------------------
function initializeCanvas ()
//-------------------------------------------------------------------------------
{
	var the = document.distributor;

	var element = document.getElementById ("canvas");
	var ctx     = element.getContext ("2d");
	var width   = the.scale * the.diameter;
	var height  = the.scale * the.diameter;

	element.width  = width;
	element.height = height;

	the.canvas = {
		element : element,
		context : ctx,
		width   : width,
		height  : height,
		x0      : parseInt (width  / 2),
		y0      : parseInt (height / 2),
	};

	box (0, 0, the.canvas.width, the.canvas.height, "#ffffcc");
	disk (the.canvas.x0, the.canvas.y0, the.canvas.x0, "#552222");
} // initializeCanvas

//-------------------------------------------------------------------------------
function main ()
//-------------------------------------------------------------------------------
{
	initializeDistributor ();
    eSlower ();
    eSofter ();
    eRun ();
} // main


//-------------------------------------------------------------------------------
window.onload = function ()
//-------------------------------------------------------------------------------
{
    main ();
} // window.onload
