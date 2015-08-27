
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

    program.cellTypes = {
        Empty: function() {
            this.type = "Empty";
            this.dir = dir.UP;
            this.mirror = false;
        },
        Start: function() {
            this.type = "Start";
            this.dir = dir.UP;
            this.mirror = false;
        },
        End: function() {
            this.type = "End";
            this.dir = dir.UP;
            this.mirror = false;
        }
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
