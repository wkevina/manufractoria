/**
 Utilities for loading and saving a program and set of tapes in JSON format


 The basic format is like this:

 {
	title: title-string
 	tape: [ tape-description1, ..., tape-descriptionN ],
 	program: { ... program-description ... },
 }


 tape-description:

 A string of the characters R,B,G,Y in any combination or order


 program-description:

 {
 	cols: Number,
 	rows: Number,
	cells: [ cell-description1, cell-description2 ],
 	start: {
 		x: Number,
		y: Number,
 		orientation: orientation-description
	},
	end: {
		x: Number,
		y: Number,
 		orientation: orientation-description
	}
 }


 cell-description:

 {
	type: type-description,
 	x: Number,
	y: Number,
 	orientation: orientation-description
 }


 orientation-description:

 One of the strings ID, ROT1, ROT2, ROT3, MID, MROT1, MROT2, MROT3


 type-description:

 String specifying the type of the cell. Currently these are:

 Conveyor
 CrossConveyor
 BranchBR
 BranchGY
 WriteB
 WriteR
 WriteG
 WriteY

*/




var loader = loader || {};

(function() {

})();
