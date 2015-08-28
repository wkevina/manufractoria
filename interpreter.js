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

    // Returns tuple [pop tape head or not (bool), symbol to push (maybe null), new facing direction]
    Interpreter.prototype.evalCell = function(cell, tapeHead) {

        var cellFunc = codeCell.codeCells[cell.type];

        if (cellFunc) {
            return cellFunc(tapeHead);
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