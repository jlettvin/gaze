# Model for gaze reflex

Visit http://rawgit.com/jlettvin/gaze/master/gaze.html to run model.

This visual model illustrates the full reflex arc needed to describe
how attention is drawn to tiny moving features.

Models are self-documenting so this README.md is very sparse.
Visit models and experiment.

<ul>
<li><a href="https://rawgit.com/jlettvin/gaze/master/index.html">
Gaze Tracking Reflex
</a></li>
<li><a href="https://rawgit.com/jlettvin/gaze/master/distributor.html">
Twitch Distributor Visualization
</a></li>
</ul>

<hr />
It is a work in progress and future directions are shown below:

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

TODO:

* Replace completely fake diffraction with mathematically correct diffraction.
* Cause pulses to drive muscle contraction.
* Cause muscle contraction to drive eyeball rotation.
