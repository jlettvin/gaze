# Model for gaze reflex

Models are self-documenting so this README.md is very sparse.
Visit models and experiment.

<dl>

<dt><a href="https://rawgit.com/jlettvin/gaze/master/index.html">
Brain Building Kit&trade;
</a></dt><dd>
Home for new implementation.
</dd>

<dt><a href="https://rawgit.com/jlettvin/gaze/master/gaze.html">
Gaze Tracking Reflex
</a></dt><dd>
A preliminary demonstration of a complete reflex arc.
<br /><br />
This visual model illustrates the full reflex arc needed to describe
how attention is drawn to tiny moving features.
</dd>

<dt><a href="https://rawgit.com/jlettvin/gaze/master/distributor.html">
Twitch Distributor Visualization
</a></dt><dd>
A finished demonstration for how muscles are driven.
<br /><br />
Evenly distributed twitch signals and variable tonus
while avoiding exhausting individual twitch units.
<dd>

</dl>

<hr />
It is a work in progress and future directions are shown below:

TODO:

* Replace completely fake diffraction with mathematically correct diffraction.
* Cause pulses to drive muscle contraction.
* Cause muscle contraction to drive eyeball rotation.

FILES:

* Airy.js unused but will generate better data for modeling diffraction patterns.
* bessel.js unused except by Airy.js
* distributor.css style for twitch distributor visualizer
* distributor.html markup for twitch distributor visualizer
* distributor.js javascript for twitch distributor visualizer
* gaze.const.js contains needed constant values
* gaze.css styling for gaze.html
* gaze.html the model
* gaze.js support code implementing the model
* gaze.pane.js is data for shaping and filling panes
* gaze.scenarios.js is data for different model operational modes
* index.html is a list of additional related pages
* utility.js are functions not specific to the gaze model
