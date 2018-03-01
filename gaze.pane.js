'use strict';

const pane = [
	[[  0,  0,  0],'scene',     
		{
			corner: {x:0,y:0},
			center: {x:0,y:0},
			axes  : ['x','z'],
			text  : HEREDOC(function() {/*
<h3>Pane&nbsp;1 (<span id="frame1">scene</span>)</h3>
<p>
Two lines (CYAN) join eye optic centers to their common vergence point 
The vergence point (CYAN) is shown if within Pane&nbsp;1.
</p><p>
When the mouse is in Pane&nbsp;1 and movement is enabled,
the mouse moves the point source.
If verge is enabled, the vergence point follows the point.
If saccades are enabled,
when the two points coincide, the vergence point exhibits saccades.
Clicking the mouse in Pane&nbsp;1 toggles point movement.
Active vergence is only default enabled for Scenario&nbsp;3.
</p>
		*/})
		}
	],
	[[ 64, 64, 64],'eyeballs',   
		{
			corner: {x:0,y:0},
			center: {x:0,y:0},
			axes  : ['x','z'],
			text  : HEREDOC(function() {/*
<h3>Pane&nbsp;2 (<span id="frame2">eyeballs</span>)</h3>
<p>
A pair of eyeballs is shown from above (Y axis normal)
with associated lateral and medial rectus muscles for horizontal rotation.
The eyes are labelled S (Sinister == Left) and D (Dexter == Right).
The corneas and adjustable pupils are shown.
</p><p>
If visible the point source is in Pane&nbsp;1 (RED)
which projects to small diffraction patterns on both retinas (RED).
When the optic axis and projected image are coincident
the projected RED takes precedence over the center CYAN.
</p><p>
To rotate the associated eyeball
muscles change length and width as they contract and relax.
Lines of sight extend from the retinal optic center in this Pane&nbsp;(CYAN)
to the scene vergence point in Pane&nbsp;1 (CYAN).
</p>
		*/})
		}
	],
	[[  0,  0,  0],'image',     
		{
			corner: {x:0,y:0},
			center: {x:0,y:0},
			axes  : ['x','y'],
			text  : HEREDOC(function() {/*
<h3>Pane&nbsp;3 (<span id="frame3">image</span>)</h3>
<p>
Overlapping fake diffraction pattern incident on retina
are shown with relative displacement from center when
the X and Z displacement of the point source
are not the X and Z displacement of the vergence point.
Watch them lose registration when the point source
is Z-displaced from the vergence point.
</p><p>
Pupil size may be set to any integer value in the range 1-8 inclusive.
The diffraction pattern size in this Pane
adjusts to represent pupil size changes.
</p><p>
The patterns from both retinas are projected onto a common image
having the optic axis at its center.
</p>
		*/})
		}
	],
	[[  0,  0,  0],'hyperacute',
		{
			corner: {x:0,y:0},
			center: {x:0,y:0},
			axes  : ['x','y'],
			text  : HEREDOC(function() {/*
<h3>Pane&nbsp;4 (<span id="frame4">hyperacute</span>)</h3>
<p>
Airy diffraction patterns of point sources have "zeros"
between rings and between the central disk and first ring.
These zeros, adjacent to bright areas, generate rings (CYAN) of
radial difference signals around the center of the projected pattern.
</p><p>
Pupil size may be set to any integer value in the range 1-8 inclusive.
The diffraction pattern size in this Pane
adjusts to represent pupil size changes.
</p><p>
The center point (RED) is convolved from the radial transient signals
convolvable from the zeros, aka hyperacute center data.
</p><p>
The patterns from both retinas are projected onto a common image
having the optic axis at its center.
</p><p>
If you wear glasses, turn your head straight to the screen
otherwise you will see the RED point off center to the CYAN vergence point.
</p>
		*/})
		}
	],
	[[  0,  0,  0],'crossover', 
		{
			corner: {x:0,y:0},
			center: {x:0,y:0},
			axes  : ['x','z'],
			text  : HEREDOC(function() {/*
<h3>Pane&nbsp;5 (<span id="frame5">crossover</span>)</h3>
<p>
Signals from the optic nerve are delivered to the midbrain as a map.
Locations where features move in the scene map to activity locations.
The map from the left and right eyes are delivered to
separate bundles of parallel axons.
The two bundles cross each other in a 'decussation'.
Activity in the decussation form a 3D map of the scene.
We propose that a decussation performs a crossover transform
where the decussation volume supports a model of the scene.
Decussations are present throughout the spinal cord
and we propose that proprioception depends on these 3D maps.
</p><p>
The crossover transform operating on
hyperacute center data is projected
through crossing axons which project a 3D map
of point location relative to the fixation point.
A vector shows the direction which must be traversed
to bring the two into registration.
</p><p>
The 3D position information is sufficient to adjust lens focal distance.
</p>
		*/})
		}
	],
	[[  0,  0,  0],'motor', 
		{
			corner: {x:0,y:0},
			center: {x:0,y:0},
			axes  : ['x','z'],
			start : 0,
			// Standard is the countdown between equilibrium pulses
			standard:10,
			// Pulse is a pair of numbers for each muscle
			// The 1st number is the countdown to the next pulse
			// The 2nd number is the rate change value
			// The 1st number is decremented to 0 then
			// reset to standard + 2nd number.
			// When the 1st number hits 0, a pulse is displayed
			SL    : {data:newArray (edge, 0),pulse:[0,0]},
			SM    : {data:newArray (edge, 0),pulse:[0,0]},
			DM    : {data:newArray (edge, 0),pulse:[0,0]},
			DL    : {data:newArray (edge, 0),pulse:[0,0]},
			text  : HEREDOC(function() {/*
<h3>Pane&nbsp;6 (<span id="frame6">motor</span>)</h3>
<p>
Midbrain delivers signals to rectus muscles.
Equilibrium signals are delivered at a steady rate
distributed spatially to avoid exhausting muscle twitch units.
To cause rotation,
the rate is transiently increased/decreased to the
ipsilateral/contralateral rectus muscle.
To terminate the rotation, rates are reversed after which
they return to equilibrium.
(Inter-pulse intervals are still under development.)
</p><p>
The vertical graph lines in orange illustrate signals delivered to
<table align="center">
<tr><td>SL</td><td align="right">Left</td><td align="left">Lateral rectus muscle</td></tr>
<tr><td>SM</td><td align="right">Left</td><td align="left">Medial rectus muscle</td></tr>
<tr><td>DM</td><td align="right">Right</td><td align="left">Medial rectus muscle</td></tr>
<tr><td>DL</td><td align="right">Right</td><td align="left">Lateral rectus muscle</td></tr>
</table>
</p>
		*/})
//The rate of graph update should not depend on whether tracking/verging are on.
//The interval variation on differential angle should vary for each muscle.
		}
	],
	[[  0,  0,  0],'twitch', 
		{
			corner: {x:0,y:0},
			center: {x:0,y:0},
			axes  : ['x','z'],
			start : 0,
			SL    : {data:newArray (edge, 0)},
			SM    : {data:newArray (edge, 0)},
			DM    : {data:newArray (edge, 0)},
			DL    : {data:newArray (edge, 0)},
			text  : HEREDOC(function() {/*
<h3>Pane&nbsp;7 (<span id="frame7">muscle cross section</span>)</h3>
<p>
Pulses must be delivered to rectus muscle twitch units in a sequence
that guarantees maximum duty cycle recovery time for a given unit
while distributing the signal evenly over its 2D (cross-sectional)
by generating dynamic patterns.
</p><p>
In addition, the number of twitch units per unit time determines
the tonus of the muscle.
This is adjustable internally, but not offered for variation in this version.
</p><p>
Note, specifically, that the rectus muscle patterns are denser for
the rectus muscle on the side of the line of sight for that eye.
The density becomes the same when vergence is complete.
Fan-shaped cells, like those found in Clark's column
are responsible for even distribution guarantees.
These resemble cerebellar Purkinje cells.
</p><p>
Pulse patterns are only dynamic for Scenario&nbsp;3.
Like the pulse trains shown in the next pane above,
the intervals are currently tied to the rate of mouse move events.
So, while the mouse is moving, the pulse patterns update rapidly,
but they are slow.
</p>
		*/})
		}
	],
];
const panes = pane.length;

