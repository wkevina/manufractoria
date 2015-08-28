var interpreter = interpreter || {},
    program = program || {},
    codeCell = codeCell || {};

(function(core, program, cell) {

    var Interpreter = function() {
        this.tape = new core.Tape();
        this.program = null;

        this.accept = false;
        this.running = false;

        this.position = {x: 0, y: 0};
        this.facing = program.directions.UP;
    };

    Interpreter.prototype.setProgram = function(program) {
        this.program = program;
    };

    Interpreter.prototype.setTape = function(tape) {
        this.tape = tape;
    };

    Interpreter.prototype.start = function() {
        this.accept = false;
        this.running = true;

        // Go to the start
        for (var x = 0; x < this.program.cols; x ++) {
            for (var y = 0; y < this.program.rows; y ++) {
                if (this.program.getCell(x, y).type == "Start") {
                    this.position.x = x;
                    this.position.y = y;
                }
            }
        }

        // Face +y;
        this.facing = program.directions.UP;
    };

    Interpreter.prototype._convertDirectionCore = function(d, cell, way) {

        // Ask me to explain this function in person. There is no documentation that will allow you to understand
        // unless you re-create this function yourself to see why it is the way it is. - Chase

        var nativeMap = [program.directions.UP, program.directions.LEFT, program.directions.DOWN, program.directions.RIGHT];
        var mirrorMap = [program.directions.UP, program.directions.RIGHT, program.directions.DOWN, program.directions.LEFT];
        var actualMap = cell.mirror ? mirrorMap : nativeMap;

        var refCell = _.indexOf(nativeMap, cell.dir);
        var dInd = _.indexOf(actualMap, d);

        var result = 0;
        if (way == "GC") {
            result = (dInd - refCell) % 4; // Global to Cell
        } else if (way == "CG") {
            result = (dInd + refCell) % 4; // Cell to Global
        }

        while (result < 0) result += 4; // Make '%' behave sanely :(

        return actualMap[result];
    }

    Interpreter.prototype.convertDirectionGlobalToCell = function(d, cell) {
        return this._convertDirectionCore(d, cell, "GC");
    };

    Interpreter.prototype.convertDirectionCellToGlobal = function(d, cell) {
        return this._convertDirectionCore(d, cell, "CG");
    };

    // Returns tuple [pop tape head or not (bool), symbol to push (maybe null), new facing direction]
    Interpreter.prototype.evalCell = function(cell, tapeHead) {

        var cellFunc = codeCell.codeCells[cell.type];

        var result = null;

        if (cellFunc) {
            if (cell.type == "CrossConveyor") {
                // Special case. Convert this.facing into cell coordinates for CrossConveyor's function:
                var cellFacing = this.convertDirectionGlobalToCell(this.facing, cell);
                result = cellFunc(tapeHead, cellFacing);
            } else {
                // No knowledge of current facing needed
                result = cellFunc(tapeHead);
            }

            // Convert cell's returned direction into global direction
            result[2] = this.convertDirectionCellToGlobal(result[2], cell);
            return result;
        }

        console.log("Invalid cell type.");

        return [false, null, program.directions.UP];
    };

    Interpreter.prototype.step = function() {

        if (!this.running) return;

        // Move 'facing' direction:
        if (this.facing == program.directions.UP) this.position.y += 1;
        if (this.facing == program.directions.DOWN) this.position.y -= 1;
        if (this.facing == program.directions.LEFT) this.position.x -= 1;
        if (this.facing == program.directions.RIGHT) this.position.x += 1;

        // Get state
        var cell = this.program.getCell(this.position.x, this.position.y);
        var head = this.tape.head();

        // Check if done
        if (cell.type == "Empty" || cell.type == "Start") {
            this.running = false;
            this.accept = false;
        } else if (cell.type == "End") {
            this.running = false;
            this.accept = true;
        } else {

            // Evaluate cell
            var result = this.evalCell(cell, head);

            // Perform result
            if (result[0]) {
                this.tape.pop();
            }

            if (result[1] != null) {
                this.tape.append(result[1]);
            }

            this.facing = result[2];

        }

    };

    interpreter.Interpreter = Interpreter;

})(core, program, codeCell);
