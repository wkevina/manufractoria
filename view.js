
var view = view || {},
    core = core || {},
    graphics = graphics || {};

(function (core, graphics) {

    function TapeView(paper, x, y, width, height) {
        this.paper = paper;
        this.tapeView = paper.g();
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
    };

    TapeView.prototype.drawTape = function drawTape(t) {

        this.tapeView.clear();

        var sw = 20;

        var MAX = Math.floor((this.width - sw) / sw);

        for (var i = 0; i < t.symbols.length && i < MAX; ++i) {
            var circle = this.paper.circle(sw*i + sw/2, sw/2, sw/2 - 2);

            var curSym = t.symbols[i];

            if (curSym === core.EMPTY) {
                circle.attr({
                    stroke: "#111",
                    strokeWidth: 2,
                    fill: "#FFF"
                });
            }

            if (curSym === core.RED) {
                circle.attr({fill: "#E10"});
            }

            if (curSym === core.BLUE) {
                circle.attr({fill: "#01F"});
            }

            if (curSym === core.GREEN) {
                circle.attr({fill: "#0F0"});
            }

            if (curSym === core.YELLOW) {
                circle.attr({fill: "#FF0"});
            }

            this.tapeView.append(circle);
        }

        this.tapeView.transform("");
        this.tapeView.transform("t" + this.x + "," + this.y);
    };

    core.TapeView = TapeView;

    /**
     GridView

     Draws a grid on the canvas
     */
    function GridView(paper, x, y, width, height, rows, cols) {
        this.paper = paper;
        this.grid = paper.g();
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.cols = cols;
        this.rows = rows;
    };

    GridView.prototype.drawGrid = function drawGrid() {
        this.grid.clear();

        var r = this.paper.rect(0,0, this.width, this.height);
        r.attr({fill: "#FFF"});
        this.grid.append(r);

        var sw = this.width / this.cols;
        var sy = this.height / this.rows;

        for (var x = 0; x <= this.cols; ++x) {
            var l = this.paper.line(x*sw, 0, x*sw, this.height);
            this.grid.append(l);
        }

        for (var y = 0; y <= this.rows; ++y) {
            var l = this.paper.line(0, y*sy, this.width, y*sy);
            this.grid.append(l);
        }

        this.grid.attr({stroke: "#000", strokeWidth: 2});

        this.grid.transform("");
        this.grid.transform("t1,1t" + this.x + "," + this.y);
    };

    /**
     GridView.getCellMatrix(col, row, corner) -> Matrix

     Returns global matrix describing location of cell

     If corner == true, uses top left corner of cell

     Otherwise, uses center of cell

     */
    GridView.prototype.getCellMatrix = function getCellMatrix(col, row, corner) {
        var transform = this.grid.transform();
        var globalMatrix = transform.globalMatrix.clone();

        var sw = this.width / this.cols;
        var sy = this.height / this.rows;

        if (!corner) {
            globalMatrix.translate(sw / 2, sy / 2);
        }
        globalMatrix.translate(sw * col, sy * row);

        return globalMatrix;
    };

    core.GridView = GridView;


    function ProgramView(paper, x, y, width, height, program) {
        this.paper = paper;
        this.program = program;
        this.width = width;
        this.height = height;
        this.cells = paper.g();
        this.gridView = new core.GridView(paper, x, y, width, height,
                                          program.rows, program.cols);

        this.gridView.drawGrid();
    }

    ProgramView.prototype.drawProgram = function drawProgram() {
		var paper = this.paper,
			grid = this.gridView,
			program = this.program;

        this.cells.clear();

		for (var x = 0; x < program.cols; ++x) {
			for (var y = 0; y < program.rows; ++y) {
				var c = program.getCell(x, y);

				if (c.type != "Empty") {

					var image = graphics.getGraphic(c.type);

					if (image) {

						paper.append(image);

						var group = paper.g(image);

						var corner = grid.getCellMatrix(x, y, true)
								.toTransformString()
								.toUpperCase();

						var o = c.orientation;

						var transform = Snap.matrix(o.a, o.b, o.c, o.d, 0, 0);
						var tstring = view.toTransformString(transform);

						group.transform(
							tstring + corner
						);
					}
				}
			}
		}

        for (var x = 0; x < this.program.cols; ++x) {
            for (var y = 0; y < this.program.rows; ++y) {
                var programCell = this.program.getCell(x, y);

                if (programCell.type != "Empty") {
                    var cellGraphic = this.paper.circle(0, 0, 10);

                    cellGraphic.transform(
                        this.gridView.getCellMatrix(x, y).toTransformString()
                    );

                    if (programCell.type == "Start") {
                        cellGraphic.attr({fill: "#0f0"});
                    } else if (programCell.type == "End") {
                        cellGraphic.attr({fill: "#F00"});
                    } else {
                        cellGraphic.attr({fill: "#00F"});
                    }

                    this.cells.append(cellGraphic);
                }
            }
        }
    };

    view.ProgramView = ProgramView;

    /**
     Utility function that converts a Snap.Matrix to a Snap transform string
     */
    view.toTransformString = function (matrix) {
        var E = "";
        var s = matrix.split();
        if (!+s.shear.toFixed(9)) {
            s.scalex = +s.scalex.toFixed(4);
            s.scaley = +s.scaley.toFixed(4);
            s.rotate = +s.rotate.toFixed(4);
            return  (s.dx || s.dy ? "t" + [+s.dx.toFixed(4), +s.dy.toFixed(4)] : E) +
                (s.scalex != 1 || s.scaley != 1 ? "s" + [s.scalex, s.scaley] : E) +
                (s.rotate ? "r" + [s.scalex*s.scaley < 0 ? 360 - s.rotate.toFixed(4) : +s.rotate.toFixed(4)] : E);

            // This is the same as what Snap.svg does by default with two major differences (original is in matrix.js)
            //
            // 1. No ",0,0" is appended to the rotate and scale strings, so they will now default to the center of the element
            //
            // 2. The complicated one: If we have been mirrored in either x or y but not both (i.e., either scalex or scaley is
            //    negative, but not both (just test if their product is negative)), our interpretation of "rotate" changes.
            //    in particular, in the mirrored case, rotate needs to be interpreted as going "backward" or "clockwise". So,
            //    to get the actual correct rotation in this case, we subtract it from 360. Whether or not the original behavior is
            //    actually incorrect on the part of Snap needs more study.

        } else {
            return "m" + [matrix.get(0), matrix.get(1), matrix.get(2), matrix.get(3), matrix.get(4), matrix.get(5)];
        }
    };

})(core, graphics);
