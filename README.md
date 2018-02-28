# Model for gaze reflex

Visit http://rawgit.com/jlettvin/gaze/master/gaze.html to run model.

This visual model illustrates the full reflex arc needed to describe
how attention is drawn to tiny moving features.

The model is self-documenting so this README.md is very sparse.
Visit the model and experiment with it.

<a href="https://rawgit.com/jlettvin/gaze/master/index.html">Hosted Home</a>

<hr />
It is a work in progress and future directions are shown below:

FILES:

* Airy.js unused but will generate better data for modeling diffraction patterns.
* bessel.js unused except by Airy.js
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
