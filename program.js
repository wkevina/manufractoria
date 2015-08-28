
var program = program || {},
    core = core || {};

(function(core) {

    var dir = {          // regardless of how graphics are handled, these mean:
        UP:     "UP",    // +y
        DOWN:   "DOWN",  // -y
        LEFT:   "LEFT",  // -x
        RIGHT:  "RIGHT"  // +x
    };

    program.directions = dir;

    var makeCellClass = function(typeID) {
        return function() {
            this.type = typeID;
            this.dir = program.directions.UP;
            this.mirror = false;
        };
    }

    program.cellTypes = {
        Empty: makeCellClass("Empty"),
        Start: makeCellClass("Start"),
        End: makeCellClass("End"),
        Conveyor: makeCellClass("Conveyor"),
        CrossConveyor: makeCellClass("CrossConveyor"),
        BranchBR: makeCellClass("BranchBR"),
        BranchGY: makeCellClass("BranchGY"),
        WriteB: makeCellClass("WriteB"),
        WriteR: makeCellClass("WriteR"),
        WriteG: makeCellClass("WriteG"),
        WriteY: makeCellClass("WriteY")
    };


    var Program = function Program(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        this.cells = [];

        for (var x = 0; x < cols; ++x) {
            this.cells.push([]);
            for (var y = 0; y < rows; ++y) {
                this.cells[x].push(new program.cellTypes.Empty());
            }
        }
    };

    Program.prototype.getCell = function getCell(x, y) {
        return this.cells[x][y];
    };

    Program.prototype.setCell = function setCell(x, y, type, direction, mirrored) {
        var s = new program.cellTypes[type]();

        if (direction) {
            s.dir = direction;
        }

        if (mirrored) {
            s.mirror = mirrored;
        }

        this.cells[x][y] = s;
    };

    Program.prototype.setStart = function(x, y) {
        this.setCell(x, y, "Start");
    };

    Program.prototype.setEnd = function(x, y) {
        this.setCell(x, y, "End");
        this.start = {x: x, y: y};
    };

    program.Program = Program;

    var ProgramView = function ProgramView(paper, x, y, width, height, program) {
        this.paper = paper;
        this.program = program;
        this.width = width;
        this.height = height;
        this.cells = paper.g();
        this.gridView = new core.GridView(paper, x, y, width, height,
                                          program.rows, program.cols);

        this.gridView.drawGrid();
    };

    ProgramView.prototype.drawProgram = function drawProgram() {
        this.cells.clear();

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

    program.ProgramView = ProgramView;


})(core);
