'use strict';

//##############################################################################
// GLOBAL CONSTANTS
const tab = 8;
const tau = Math.PI * 2;
const radius = 20;
const diameter = radius * 2 + 1;
const column = diameter * 2;
const edge = column * 2;
const width = edge;
const height = edge;
const area = edge * edge;
const x0 = column;
const y0 = column;
const ex = diameter;
const ey = 0;
const interval = {minimum:20,maximum:30,increment:10};

const font = '16px serif';

const id = {
	figure1a:{
		canvas:'figure 1a canvas',
		title: 'figure 1a title',
		text:  'figure 1a text',
		menu:  'figure 1a menu',
	}
}
const color = {
	actual  :'#ff0000',
	fixation:'#00ff00',
	grid    :'#555555',
	vector  :'#00ffff',
};

