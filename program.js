
var program = program || {},
    core = core || {};
    tmath = tmath || {};

(function(core, tmath) {

    var dir = {                     // regardless of how graphics are handled, these mean:
        UP:     new tmath.Vec2(0, 1),     // +y
        DOWN:   new tmath.Vec2(0, -1),    // -y
        LEFT:   new tmath.Vec2(-1, 0),    // -x
        RIGHT:  new tmath.Vec2(1, 0)      // +x
    };

    program.directions = dir;

    var makeCellClass = function(typeID) {
        return function() {
            this.type = typeID;
            this.orientation = tmath.Mat2x2.ID();
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

    Program.prototype.setCell = function setCell(x, y, type, orientation) {
        var s = new program.cellTypes[type]();

        if (orientation) {
            s.orientation = orientation;
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

    program.readLegacyProgramString = function(s) {
        
        // [lvlString]&[codeString]&[metaInfo]

        var i = 0;

        var attrStrings = s.split("&");
        var attrs = {}

        for (i = 0; i < attrStrings.length; i ++) {
            if (attrStrings[i].startsWith("lvl=")) {
                attrs.lvl = parseInt(attrStrings[i].slice(4));
            }
            if (attrStrings[i].startsWith("code=")) {
                attrs.codeString = attrStrings[i].slice(5);
            }
            if (attrStrings[i].startsWith("ctm=")) {

                // [name];[description];[test case string];[rows/cols count];[??? always 3];[??? 1 or 0 for binary or 'normal']

                var ctmParts = attrStrings[i].slice(4).split(";");
                attrs.name = ctmParts[0];
                attrs.description = ctmParts[1];
                attrs.testCaseString = ctmParts[2];
                attrs.rows = ctmParts[3];
                attrs.cols = ctmParts[3];
            }
        }

        // Now parse the codeString part

        var typeMap = {c: "Conveyor", b: "WriteB", r: "WriteR", g: "WriteG", y: "WriteY", p: "BranchBR", q: "BranchGY", i: "CrossConveyor"};

        var p = new program.Program(attrs.cols, attrs.rows);
        var parts = attrs.codeString.split(";");

        for (var i = 0; i < parts.length; i ++) {

            // [type][column]:[row]f[orientation]

            var partString = parts[i].trim();

            if (partString.length == 0) continue;

            var fInd = _.indexOf(partString, "f");
            var cInd = _.indexOf(partString, ":");

            var original = {type: partString[0], x: parseInt(partString.slice(1, cInd)), y: parseInt(partString.slice(cInd+1, fInd)), orientation: parseInt(partString.slice(fInd+1))};

            var cellProps = {};

            cellProps.type = typeMap[original.type];
            cellProps.x = original.x - 8;
            cellProps.y = original.y - 3;

            console.log(cellProps.type, original.orientation);
            if (cellProps.type.startsWith("Branch")) {
                if (original.orientation == 0) cellProps.orientation = tmath.Mat2x2.MROT3();
                if (original.orientation == 1) cellProps.orientation = tmath.Mat2x2.MROT2();
                if (original.orientation == 2) cellProps.orientation = tmath.Mat2x2.MROT1();
                if (original.orientation == 3) cellProps.orientation = tmath.Mat2x2.MIR();
                if (original.orientation == 4) cellProps.orientation = tmath.Mat2x2.ROT3();
                if (original.orientation == 5) cellProps.orientation = tmath.Mat2x2.ROT2();
                if (original.orientation == 6) cellProps.orientation = tmath.Mat2x2.ROT1();
                if (original.orientation == 7) cellProps.orientation = tmath.Mat2x2.ID();
            } else {
                if (original.orientation == 0 || original.orientation == 4) cellProps.orientation = tmath.Mat2x2.ROT3();
                if (original.orientation == 1 || original.orientation == 5) cellProps.orientation = tmath.Mat2x2.ROT2();
                if (original.orientation == 2 || original.orientation == 6) cellProps.orientation = tmath.Mat2x2.ROT1();
                if (original.orientation == 3 || original.orientation == 7) cellProps.orientation = tmath.Mat2x2.ID();
            }

            console.log(partString, cellProps);

            p.setCell(cellProps.x, cellProps.y, cellProps.type, cellProps.orientation);

        }

        p.setStart(Math.floor(p.cols/2), 0);
        p.setEnd(Math.floor(p.cols/2), p.rows - 1);

        return p;

    }


})(core, tmath);
