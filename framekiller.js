/* globals self, top, document */

// Clickjacking defense
//  - If JavaScript is disabled, the site will not display at all
//  - Top-level navigation requires a user gesture
//    https://github.com/WICG/interventions/issues/16
if (self !== top) throw "Framed: " + document.referrer


