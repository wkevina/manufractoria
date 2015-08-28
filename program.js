
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
        }
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
            this.cells.append([]);
            for (var y = 0; y < rows; ++y) {
                this.cells[x].append(new program.cellTypes.Empty());
            }
        }
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
        this.setCell(x, y, "Empty");
    };

    program.Program = Program;


})(core);
