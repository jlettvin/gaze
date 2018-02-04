'use strict';

const viewable = [
	{
		number   : 0,
		title    : 'Point fixed and verged in distance.',
		permanent: true,
		visible  : true,
		movable  : false,
		saccade  : false,
		converge : true,
		blinkdown: 0,
		point    : {x:x0,y:-10000},
		vergence : {x:x0,y:-10000},
		interval : interval.maximum,
		text     : HERE(function() {/*
Scenario 1: star (RED) centered in scene at great distance.<br />
Stationary scene.  Controls are disabled.
		*/}),
		oldtext:HERE(function() {/*
<p>
CONTROLS:
Saccades, and point movement are disabled.
Pupil size and axes display are enabled.
</p><p>
PANE 1:
A red star in the night sky is in the center of the field.
It is not visible due to its extreme distance.
</p><p>
PANE 2:
Eyes are verged on the star.
Rectus muscles have equivalent lengths and tonus.
Optic centers coincide with star.
</p><p>
PANE 3:
A trivial imitation of coincident retinal diffraction patterns.
</p><p>
PANE 4:
A trivial imitation of coincident enhanced diffraction difference rings.
</p><p>
PANE 5:
The crossover transform to map lines of sight to 3D.
</p><p>
PANE 6:
Pulse train to maintain vergence.
</p>
		*/})
	},
	{
		number   : 1,
		title    : 'Point movable. Fixed center verge.',
		permanent: false,
		visible  : true,
		movable  : true,
		saccade  : false,
		converge : false,
		blinkdown: 0,
		corner   : {x:0,y:0},
		center   : {x:0,y:0},
		point    : {x:x0,y:x0},
		vergence : {x:x0,y:y0},
		interval : interval.maximum,
		text     : HERE(function() {/*
Scenario 2: point (RED) source far right, vergence in center.<br />
Stationary vergence.  Controls are enabled.
		*/}),
		oldtext:HERE(function() {/*
<p>

Eyes are looking away from the point.
For instance staring fixedly at the center
but without following the visible point
and a trivial imitation of
a retinal diffraction pattern.
</p>
		*/})
	},
	{
		number   : 2,
		title    : 'Point movable verged by tracking.',
		permanent: false,
		visible  : true,
		movable  : true,
		saccade  : true,
		converge : true,
		blinkdown: 2,
		corner   : {x:0,y:0},
		center   : {x:0,y:0},
		point    : {x:x0,y:y0},
		vergence : {x:x0,y:y0},
		interval : interval.maximum,
		text     : HERE(function() {/*
Scenario 3: point (RED) source center, vergence in center.<br />
Active vergence.  Controls are enabled.
		*/}),
		oldtext  : HERE(function() {/*
<p>
Eyes are looking at the point.
For instance tracking a visible point
as it moves about the scene.
This include modeling saccades
and a trivial imitation of
a retinal diffraction pattern.
</p><p>
</p>
		*/})
	},
];
const scenarios = viewable.length;
