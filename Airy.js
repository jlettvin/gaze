/* This module saves calculating Bessel functions at all points in an image.
 * Precalculate a single find-grained Bessel function into an array.
 * Calculate the index into this array by a radius and coefficient.
 * Calculate the coefficient by a wavelength, aperture, and granularity.
 *
 *   var coefficient = this.coefficient(wavelength, aperture);
 *   var amplitude   = this.amplitude(radius, coefficient);
 *
 *   NOTE: coefficient only needs to be called once per wavelength/aperture.
 *   NOTE: amplitude is calculated by radius, so depends on coordinates.
 *
 *   TODO: Generate a vector containing (x,y) and amplitude and
 *         Add the amplitude at each (x,y) rather than convolving.
 *
 * The amplitude is the wave function amplitude for that combination of
 * radius, wavelength, and aperture.
 */
"use strict";

//console.log("AIRY: get");
var AIRY = ({
    //CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC
    // CONSTANTS CONSTANTS CONSTANTS CONSTANTS CONSTANTS CONSTANTS CONSTANTS 
    //CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC
    Zr          : 1.2196698912665045,   // constant normalizing first zero
    wavelength  : {
        IR      : 790e-9,   // Infrared limit of visual spectrum
        RED     : 566e-9,   // Peak absorption of L cones
        GREEN   : 533e-9,   // Peak absorption of M cones
        CYAN    : 498e-9,   // Peak absorption of   rods
        BLUE    : 433e-9,   // Peak absorption of S cones
        UV      : 390e-9    // Ultraviolet limit of visual spectrum
    },
    //-------------------------------------------------------------------------
    generate: function(parameter) {
        // Zero indexing is normalized to an 8mm pupil for the BLUE peak.

        // Defaults
        var verbose    = parameter.verbose;
        var verbose    = (verbose === "undefined") ? false : verbose;
        var epsilon    = parameter.epsilon      ||   5e-4;
        var wavelength = parameter.wavelength   || "BLUE";
        var aperture   = parameter.aperture     ||   8e-3;

        // Initialize
        this.used             = { };        // parameters used to calculate
        this.used.verbose     = verbose;
        this.used.epsilon     = epsilon;
        this.used.pupil       = { constricted: 1e-3, dilated: 8e-3};
        this.used.wavelength  = this.wavelength[wavelength];
        this.used.aperture    = aperture;
        this.used.granularity = 1000;      // increment count to first zero
        this.used.threshold   = 1 / 255;    // Max amplitude before last zero
        this.used.unit        = this.used.wavelength / this.used.aperture;
        this.used.almost1     = 1 - this.used.epsilon;

        // Make and fill containers
        this.made      = { };    // calculated data
        this.made.wave = [1];    // Peak at r==0
        this.made.zero = [ ];    // stored zeros
        this.made.peak = [ ];    // stored peaks
        this.made.ratio= {
            RED     : this.wavelength.RED   / this.wavelength[wavelength],
            GREEN   : this.wavelength.GREEN / this.wavelength[wavelength],
            BLUE    : this.wavelength.BLUE  / this.wavelength[wavelength]
        };

        this.used.verbose && console.log(this.used);
        this.used.verbose && console.log(this.made);

        // three is a view of the last calculated intensities.
        // a peak is discovered when the 2nd value is greater than 1st or 3rd.
        // a zero is discovered when the 2nd value is less than 1st or 3rd.
        // When a peak is discovered not greater than the limit
        // calculation terminates at the next zero.
        // end is used to detect the final peak and to terminate at the zero.
        // Indices for peaks and zeros are stored for later use
        var three = [0, 0, this.made.wave[0]];
        var end = false;

        // dr is the incremental radius.
        // For granularity * dr giving the first zero
        // the bessel function parameter is scaled by a constant
        // approximated by 1.22 named Zr
        var u0 = Math.PI * this.Zr;
        var r, dr = 1/this.used.granularity;

        for (r = dr; r <= 10; r += dr) {
            var N = this.made.wave.length;   // Not wavelength; count of values.
            var u = u0 * r;             // Bessel parameter

            // A is the normalized wave amplitude for parameter u
            // I is the intensity for that wave amplitude
            var A = 2*BESSEL.besselj(u,1)/u;
            var I = A*A;

            // Store the amplitude for use in superposition
            this.made.wave.push(A);

            // Slide the peak/zero calculation window
            three.shift();
            three.push(I);

            // Calculate the differences from center for the previous intensity
            var dn = three[1] - three[0];
            var dp = three[1] - three[2];

            // If at a peak and the peak, store it and
            // if the peak is below the chosen intensity
            // trigger termination on discovery of the next zero
            if (dn > 0 && dp > 0) {
                this.made.peak.push(N-1);
                end = (three[1] < this.limit);
            }

            // If at a zero, store it and
            // if termination is flagged, terminate the loop
            if (dn < 0 && dp < 0) {
                if (end) break;
                // If the last datum was not last zero, store this datum.
                // Otherwise DO NOT STORE IT!
                this.made.zero.push(N-1);
            }
        }

        // Show the discovered peaks and zeros.
        this.used.verbose && console.log("peaks", this.made.peak);
        this.used.verbose && console.log("zeros", this.made.zero);

        return this;
    },
    //-------------------------------------------------------------------------
    coefficient: function(wavelength, aperture) {
        // index will have a first zero at radius 1 with aperture 8e-3.
        if (
            (
             this.wavelength.IR             < wavelength    ||
             this.wavelength.UV             > wavelength    ||
             this.used.pupil.constricted    > aperture      ||
             this.used.pupil.dilated        < aperture
            )
           )
        {
            console.log(heredoc(function(){/*
either the wavelength is not visible
or the pupil size is not in the human range
            */}));
            return 0;
        }
        var unit = this.used.unit;          // used.wavelength / used.aperture
        var index = wavelength / aperture;
        return Math.floor(
                this.used.granularity * (1e-9 + unit) /
                index);
    },
    //-------------------------------------------------------------------------
    amplitude: function(radius, coefficient, mean=false) {
        // coefficient is the index of the first zero
        var index = Math.floor(1e6 * radius * coefficient + this.used.almost1);

        var ret;
        if      (radius == 0.0) { ret = 1; }
        else if (index >= this.made.wave.length) { ret = 0; }
        else if (mean) {
            var wing  = Math.floor(coefficient * 2 / 3);
            var indlo = Math.abs(index - wing);     // could be less than 0
            var indhi =         (index + wing);

            // Calculate average over 2 or 3 evenly spaced in the interval
            ret  = this.made.wave[index];    // known good
            ret += this.made.wave[indlo];    // known good

            // include upper wing if it is within range.
            if (indhi >= this.made.wave.length) ret /= 2;
            else ret = (ret + this.made.wave[indhi]) / 3;
        }
        else { ret = this.made.wave[index]; }
        return ret;
    },
    //-------------------------------------------------------------------------
    mask: function(wavelength, aperture) {
        // TODO: Generate a map from legal [x,y] values to radii.
        var data = [ ];    // [[x0,y0,a0],[x1,y1,a1],...[xn,yn,an]]
        var coefficient = this.coefficient(wavelength, aperture);
        var spread = function(x, y, a) {

            var ne = true;
            var nw = (x != 0);
            var se = (y != 0);
            var sw = (se && nw);

            ne && data.push([ x, y,a]);
            nw && data.push([-x, y,a]);
            se && data.push([ x,-y,a]);
            sw && data.push([-x,-y,a]);
        }
        return data;
    },







    //TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT
    // UNIT TESTS UNIT TESTS UNIT TESTS UNIT TESTS UNIT TESTS UNIT TESTS UNIT
    //TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT
    test  : function (aperture, color) {
        var wavelength = this.wavelength[color];                // i.e. 433e-9
        var norm       = 8e-3 / aperture;                       // i.e. 8e-3
        var zero       = this.made.ratio[color] * norm * 1e-6;  // i.e. 1e-6

        var zero2 = zero * this.made.zero[1] / this.made.zero[0];
        var zero3 = zero * this.made.zero[2] / this.made.zero[0];
        var radii = {
            "(0,0)": {radius: 0     , expect: 1.00000    },
            half   : {radius: zero/2, expect: 0.60623    },
            zero1  : {radius: zero  , expect: 1.03554e-11},
            zero2  : {radius: zero2 , expect: 1.00000e-5 },
            zero3  : {radius: zero3 , expect: 1.00000e-5 }
        };

        var coefficient = this.coefficient(wavelength, aperture);
        var test = 0;
        var pass = 0;
        for (var key in radii) {
            var radius = radii[key].radius;
            var expect = radii[key].expect;
            var val = this.amplitude(radius, coefficient);
            test += 1;
            pass += FAILPASS.almost(val, expect, this.used.epsilon, sprintf(
                        "color: %5s key: %5s zero: %2.2e calculated amplitude",
                        color, key, zero));
        }
        this.used.verbose && console.log(sprintf(
                    "       %d/%d PASS/FAIL", pass, test - pass));
    },
    //TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT
    unittest    : function() {
        console.log(HEREDOC(function(){/*
-------------------------------------------------------------------------------
Airy.js precalculates a fine-grained Bessel function as a wave amplitude array.
For a granularity, and wavelength/aperture ratio a coefficient can be generated.
The coefficient is used to index wave amplitudes.

This test parameterizes by wavelength and aperture to compare
the values at different radii to ensure that the mechanism
for requestion amplitudes for a radius and coefficient are properly fetched.
-------------------------------------------------------------------------------
*/}));
        this.test(8e-3, "BLUE" );
        this.test(8e-3, "GREEN");
        this.test(8e-3, "RED"  );
        this.test(1e-3, "BLUE" );
        this.test(1e-3, "GREEN");
        this.test(1e-3, "RED"  );
    }
    //TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT

}).generate({aperture: 8e-3, wavelength: "BLUE", verbose: false});
//console.log("AIRY: ran");


