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
		point    : {x:x0,y:-10000},
		vergence : {x:x0,y:-10000},
		interval : interval.maximum,
		text     : HERE(function() {/*
Scenario 1: star (RED) centered in scene at great distance.<br />
Stationary scene.  Controls are disabled.
		*/}),
	},
	{
		number   : 1,
		title    : 'Point movable. Fixed center verge.',
		permanent: false,
		visible  : true,
		movable  : true,
		saccade  : false,
		converge : false,
		corner   : {x:0,y:0},
		center   : {x:0,y:0},
		point    : {x:x0,y:x0},
		vergence : {x:x0,y:y0},
		interval : interval.maximum,
		text     : HERE(function() {/*
Scenario 2: point (RED) source far right, vergence in center.<br />
Stationary vergence.  Controls are enabled.
		*/}),
	},
	{
		number   : 2,
		title    : 'Point movable verged by tracking.',
		permanent: false,
		visible  : true,
		movable  : true,
		saccade  : true,
		converge : true,
		corner   : {x:0,y:0},
		center   : {x:0,y:0},
		point    : {x:x0,y:y0},
		vergence : {x:x0,y:y0},
		interval : interval.maximum,
		text     : HERE(function() {/*
Scenario 3: point (RED) source center, vergence in center.<br />
Active vergence.  Controls are enabled.
		*/}),
	},
];
const scenarios = viewable.length;
