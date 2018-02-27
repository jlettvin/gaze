#!/usr/bin/env python

from itertools import product
from random    import shuffle
from math      import sqrt

def compile (radius):
    diameter = 1 + 2 * radius
    coordinates = [
            (y,-x)
            for (x,y) in product (xrange (-radius, radius+1), repeat=2)
            ]

    # table will be the HTML table hosting the twitch unit cut-ends.
    # comb will be a fixed randomized sequence of indices into table.
    # It is intended to be equivalent to one dendrite per comb tooth.
    # Marching round-robin sequentially through this comb provides a
    # guarantee of maximizing the time between individual specific
    # twitch unit activations.
    # TODO implement entirely in javascript.
    # utility.js already has a Fisher-Yates shuffle.
    # itertools.product is easily reimplemented as a nested (y,x) loop.
    # a comprehension to exclude cells outside the radius is simple.
    # generating the table is all that remains before this python is retired.
    table = ''
    comb = []

    last = None
    table = '<table>'
    table += '<caption align="bottom">'
    table += '<h3>Muscle Fiber Bundle Cross Section</h3>'
    table += '</caption>\n<tr>'

    table += '<td colspan="%d" bgcolor="black">' % (diameter-6)
    table += '<button id="pause" onclick="eRun(event)">STOP</button>'
    table += ' twitching, or '
    table += '<button id="reload" onclick="location.reload (true)">' \
            'reload</button>'
    table += '</td>'

    table += '<td colspan="2" bgcolor="#333333" valign="top">'
    table += 'interval (ms)<br /><br /><br />'
    table += '<button id="neg" onclick="eSlower (event)">-</button>'
    table += '<b id="interval"></b>'
    table += '<button id="pos" onclick="eFaster (event)">+</button>'
    table += '</td>'

    table += '<td colspan="2" bgcolor="#333333" valign="top">'
    table += 'strength<br /><br /><br />'
    table += '<button id="pown" onclick="eSofter (event)">-</button>'
    table += '<b id="strength">2</b>'
    table += '<button id="powp" onclick="eHarder (event)">+</button>'
    table += '</td>'

    table += '<td colspan="2" bgcolor="#333333">'
    table += 'tonus<h3 id="state">None</h3>'
    table += '</td>';

    j = 0
    for i,(x,y) in enumerate (coordinates):
        within = (sqrt (x*x + y*y) <= (radius+0.5))
        bgcolor = 'white'
        id = 'x'
        if within:
            id = 'i'
            bgcolor = '#552222'
            comb += [i]
        id = 'i' if within else 'x'
        if (y != last):
            table += '\n</tr><tr>'
            last = y
        if within:
            table += '<td class="%s%d" style="color:white;" bgcolor="%s">%d' % (
                    id, i, bgcolor, j)
            j += 1
            table += '<br /><br />(%+2d,%+2d)</td>' % (x,y)
        else:
            table += '<td bgcolor="white"></td>'
    table += '\n</tr></table>'

    shuffle (comb)
    return (comb, table)

def main ():
    comb, muscle = compile (5)
    ordered = ['<b class="i%d">%d</b>' % (i,o) for (i,o) in enumerate (comb)]
    print '''\
<!DOCTYPE html>

<html>
	<head>
        <meta charset="UTF-8">

<style>
body {
	font-family:
            Courier New, Courier,
            Lucida Sans Typewriter, Lucida Typewriter,
            monospace;
	font-size: 10px;
	font-variant: normal;
	font-weight: 200;
	line-height: 10px;
        background-color: #ffffcc;
}
h1 { font-size: 30px; }
h2 { font-size: 25px; }
h3 { font-size: 20px; }
table, th, td {
	vertical-align: middle;
	text-align: center;
}
td { height: 45px; width: 45px; color: white; }
textarea { resize: none; }
button { padding: 2px; margin: 2px; }
</style>

<script type="text/javascript" src="utility.js"></script>
<script type="text/javascript">
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

//-------------------------------------------------------------------------------
function ePower (direction)
//-------------------------------------------------------------------------------
{
    var strength = document.getElementById ("strength");
    if (document.distributor.running)
    {
        if (
            (direction == -1 && document.distributor.strong > 0) ||
            (direction == +1 && document.distributor.strong < 4) )
        {
            document.distributor.strong += direction;
        }
    }
    strength.innerHTML = ' ' + document.distributor.strong + ' ';
} // ePower


//-------------------------------------------------------------------------------
function clickBuzz (frequency, length) {
//-------------------------------------------------------------------------------
    // use stored audio context, masterGain and nodeGain1 nodes
    var audioContext = document.distributor.audioContext;
    var masterGain   = document.distributor.masterGain;
    var nodeGain1    = document.distributor.nodeGain1;

    var oscillatorNode = new OscillatorNode (audioContext, {type: 'square'});
    oscillatorNode.frequency.value = frequency;
    oscillatorNode.connect ( nodeGain1);
    oscillatorNode.start (audioContext.currentTime);
    oscillatorNode.stop  (audioContext.currentTime + length);
} // clickBuzz


//-------------------------------------------------------------------------------
function eDelay (direction)
//-------------------------------------------------------------------------------
{
    var interval = document.getElementById ("interval");
    if (document.distributor.running)
    {
        var N = document.distributor.interval.length - 1;
        if (
            (direction == -1 && document.distributor.delay > 0) ||
            (direction == +1 && document.distributor.delay < N) )
        {
            document.distributor.delay += direction;
            clearInterval (document.distributor.timer);
            document.distributor.timer = setInterval (
                loop, document.distributor.interval[document.distributor.delay]);
        }
    }
    interval.innerHTML = ' ' + \
        document.distributor.interval[document.distributor.delay] + \
        ' ';
} // eDelay


//-------------------------------------------------------------------------------
function eSofter (e)
//-------------------------------------------------------------------------------
{
    ePower (-1);
} // eSofter


//-------------------------------------------------------------------------------
function eHarder (e)
//-------------------------------------------------------------------------------
{
    ePower (+1);
} // eHarder


//-------------------------------------------------------------------------------
function eSlower (e)
//-------------------------------------------------------------------------------
{
    eDelay (-1);
} // eSlower


//-------------------------------------------------------------------------------
function eFaster (e)
//-------------------------------------------------------------------------------
{
    eDelay (+1);
} // eFaster


//-------------------------------------------------------------------------------
function eButton (e)
//-------------------------------------------------------------------------------
{
    var id = e.target.id;
    var key = document.getElementById (id).innerHTML;
    var val = document.distributor.info[key];
    var tgt = document.getElementById ('info');
    tgt.value = val;
} // eButton


//-------------------------------------------------------------------------------
function eRun (e)
//-------------------------------------------------------------------------------
{
    document.distributor.running = !document.distributor.running;
    if (document.distributor.running) {
        document.distributor.timer = setInterval (
            loop, document.distributor.interval[document.distributor.delay]);
    } else {
        clearInterval (document.distributor.timer);
        document.distributor.timer = null;
    }
    var button = document.getElementById ("pause");
    button.innerHTML = document.distributor.running ? "PAUSE" : "START";
} // eRun


//-------------------------------------------------------------------------------
function reColor (className,scheme)
//-------------------------------------------------------------------------------
{
    var colorPair = document.distributor.colors[scheme];
    //console.log (scheme, className);
    var elements = document.getElementsByClassName (className);
    for (element of elements)
    {
        element.style.backgroundColor = colorPair[0];
        element.style.color           = colorPair[1];
    }
} // reColor


//-------------------------------------------------------------------------------
function makeButtons (names)
//-------------------------------------------------------------------------------
{
    var text = '';
    var i = 0;
    for (name of names)
    {
        var id = 'button' + i++;
        text += '<button id="' + id + \
                '" onmouseover="eButton(event)"' + \
                '" onclick="eButton(event)"' + \
                '>' + \
                name + \
                '</button>';
    }
    var element = document.getElementById ('buttons');
    element.innerHTML = text;
} // makeButtons


//-------------------------------------------------------------------------------
function loop ()
//-------------------------------------------------------------------------------
{
    var date = new Date ();
    var odd = (date.getSeconds () & 1);
    var strength = 1 + document.distributor.strong * odd;
    var I = document.distributor.active * strength;

    //console.log (document.distributor.inverses);
    clickBuzz (
        I * 2000 /
        document.distributor.interval[document.distributor.delay], 0.02);
    for (classname of document.distributor.inverses)
    {
        reColor (classname, 0);
    }
    document.distributor.inverses = [];

    for (var i=0; i<I; ++i)
    {
        document.distributor.index = (document.distributor.index + 1) %% \
                document.distributor.comb;
        var classname = 'i' + document.distributor.cell[document.distributor.index];

        document.distributor.inverses.push (classname);
        reColor (classname, 1);
    }
    var state = document.getElementById ('state');
    if (document.distributor.strong == 0)
    {
        state.innerHTML = 'same';
    } else {
        state.innerHTML = odd ? 'STRONG' : 'weak';
    }
} // loop


//-------------------------------------------------------------------------------
function info ()
//-------------------------------------------------------------------------------
{
    var info = document.distributor.info= {};

    info['Abstract'] = HERE(function () {/*
   A muscle fiber bundle model is shown in cross section (each fiber a square).
A muscle fiber is a twitch unit which generates a shortening force.
A muscle fiber runs end-to-end and is excited by a single motor neuron.
After twitching a fiber needs time to recover before the next twitch.
   This model shows that the time between fiber activations can be maximized
while activations are uniformly distributed within the bundle.
    */});


    info['Running'] = HERE(function () {/*
   START/PAUSE animates the model.  Buttons control the interval and strength 
Hovering over buttons above the info box causes text like this to be shown.
   When running, the model shows twitching/resting muscle fibers as red/brown.
Twitch patterns show a repeating weak/STRONG tonus for 1 second each.
   Squares are identified by sequence numbers and center-based coordinates.
Note the (0,0) coordinates at the center of the bundle.
    */});

    info['Axon'] = HERE(function () {/*
   A motor neuron attaches at many points along a single twitch unit.
A twitch signal is sent to all neuromuscular junctions in a muscle fiber.
A twitch unit is activated end-to-end with a single signal.
The entire length of the twitch unit contracts at the same time.
Motor neuron axon terminal arbor shapes guarantee simultaneous activation.
    */});

    info['Dendrite'] = HERE(function () {/*
   The remote dendrite shape for a motor neuron feeding a muscle fiber
is shaped to sample passing gradients in a transient sweeping pattern.
Each motor neuron dendrite is shaped to detect gradients ignored by others.
   The dendrite hosts a fixed set of pre-randomized dendritic spines.
As the sweeping pattern passes across the dendritic spines
those which sample a boundary in the pattern twitch their muscle fibers.
    */});

    info['Coincidences'] = HERE(function () {/*
   The remote dendrite for each motor neuron expresses a pattern
which makes its gradient detectors unique within sampled patterns.
It most likely samples the pattern in multiple places and uses
coincidence of samples to trigger the pulse that activates a muscle fiber.
    */});

    info['Discussion'] = HERE(function () {/*
   As long as the pattern delivered is reliable,
twitch unit duty cycle timing requirements are satisfied.
This strategy guarantees maximum recovery time for all muscle fibers.
   The animated model below illustrates this behavior.
The code driving this image is logically equivalent to
the proposed pre-randomized sampling of a regular pattern.
   Twitch is "all or none": tonus measures average twitches per unit time.
    */});

    info['Conclusions'] = HERE(function () {/*
   This simple demonstration illustrates a logical economy
enabling implementations to ignore parallelism and simply
act concurrently on all actual delivered pulses,
whether they are dense or sparse,
without the burden of unnecessary calculation.
   This is one of the economies expected in vivo.
    */});

    var keys = [];
    for (key in info) keys.push (key);
    makeButtons (keys);

} // info


//-------------------------------------------------------------------------------
function main ()
//-------------------------------------------------------------------------------
{
    var audioContext = new (window.AudioContext || window.webkitAudioContext)();
    document.distributor = {
        active  :   11,
        cell    :   %s,
        colors  :       [['#552222','white'], ['#bb3333','white']],
        delay   :    3,
        interval:       [3, 10, 33, 100, 333, 1000],
        index   :    0,
        comb    :  %3d,
        inverses:   [],
        running : true,
        strong  :    2,
        timer   : null,
        audioContext: audioContext,
        masterGain  : audioContext.createGain(),
        nodeGain1   : audioContext.createGain(),
    };

    var masterGain   = document.distributor.masterGain;
    var nodeGain1    = document.distributor.nodeGain1;

    masterGain.gain.value = 0.5;
    masterGain.connect(audioContext.destination);

    nodeGain1.gain.value = 0.5;
    nodeGain1.connect(masterGain);

    info ();
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

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
</script>

	</head>
	<body>
        <div align="center">
        <h1><u>Twitch Distributor Visualization</u></h1>
        <i>Copyright&copy; 2018 Jonathan D. Lettvin, All Rights Reserved.</i>
        <br /><span id="buttons"></span>
        <br /><textarea id="info" rows="7" cols="84" readonly>
        Hover over the above buttons to fill this area with information.
        </textarea><br />
        %s
        </div>
	</body>
</html>
''' % (comb, len(comb), muscle);

if __name__ == "__main__":
    main ()