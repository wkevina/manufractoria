var customToTransformString = function (matrix) {
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


var core = core || {},
    program = program || {},
    interpreter = interpreter || {},
    graphics = graphics || {},
    tmath = tmath || {};

(function (Snap, program, interpreter, graphics, tmath) {

    /* Symbols */
    core.EMPTY = {symbol: 'empty'};
    core.RED = {symbol: 'red'};
    core.BLUE = {symbol: 'blue'};
    core.GREEN = {symbol: 'green'};
    core.YELLOW = {symbol: 'yellow'};


    /* Tape
     Represents an ordered queue of symbols
     */
    var Tape = function Tape() {
        this.symbols = [];
    };

    Tape.prototype.head = function head() {
        if (this.symbols.length > 0) {
            return this.symbols[0];
        } else {
            return core.EMPTY;
        }
    };

    Tape.prototype.pop = function pop() {
        if (this.symbols.length > 0) {
            return this.symbols.shift();
        } else {
            return core.EMPTY;
        }
    };

    Tape.prototype.append = function append(s) {
        this.symbols.push(s);
    };

    core.Tape = Tape;

    var TapeView = function TapeView(paper, x, y, width, height) {
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

    var GridView = function GridView(paper, x, y, width, height, rows, cols) {
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

    core.main = function() {

        graphics.preload().then(function() {

            var t = new Tape();
            core.t = t;

            for (var i = 0; i < 100; ++i) {

                var choice = Math.floor(Math.random()*4);

                switch (choice) {
                case 0:
                    t.append(core.RED);
                    break;
                case 1:
                    t.append(core.BLUE);
                    break;
                case 2:
                    t.append(core.GREEN);
                    break;
                case 3:
                    t.append(core.YELLOW);
                default:
                    t.append(core.RED);
                }

            }

            if (t.head() == core.EMPTY) {
                t.pop();
            }

            var paper = Snap(640, 640);
            paper.appendTo(document.getElementById("main"));


            var field = new TapeView(paper, 0, 0, 400, 20);
            field.drawTape(t);

            var grid = new GridView(paper, 0, 30, 560, 560, 10, 10);

            grid.drawGrid();

            //var p = program.readLegacyProgramString("lvl=32&code=c12:4f3;c12:5f3;p12:6f0;c11:6f3;c11:7f3;c11:8f3;c11:9f3;c11:10f3;c11:11f2;&ctm=N1;N2;bbr:x|rrb:x;9;3;1;");
            var p = program.readLegacyProgramString("lvl=32&code=c10:4f0;c11:4f1;c12:4f2;c13:4f3;p10:5f0;p11:5f1;p12:5f2;p13:5f3;p10:6f4;p11:6f5;p12:6f6;p13:6f7;q10:7f0;q11:7f1;q12:7f2;q13:7f3;q10:8f4;q11:8f5;q12:8f6;q13:8f7;&ctm=N1;N2;bbr:x|rrb:x;9;3;0;");

            var myInterpreter = new interpreter.Interpreter();
            myInterpreter.setProgram(p);
            myInterpreter.setTape(t);

            var token = paper.circle(0, 0, 10);
            token.attr({fill: "#E0E"});

            drawProgram(paper, p, grid);

            myInterpreter.start();
            field.drawTape(t);

            function mainLoop() {

                var curPos = myInterpreter.position;
                token.transform(grid.getCellMatrix(curPos.x, curPos.y).toTransformString());

                myInterpreter.step();
                curPos = myInterpreter.position;

                var update = function() {
                    token.animate(
                        {transform:
                         grid.getCellMatrix(curPos.x, curPos.y).toTransformString()
                        },
                        500,
                        mina.linear,
                        function() {
                            field.drawTape(t);
                            mainLoop();
                        }
                    );
                };

                setTimeout(update, 100);
            }

            mainLoop();
        });

    };


    function drawProgram(paper, program, grid) {
        console.log(program);
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
                        var tstring = customToTransformString(transform);

                        group.transform(
                            tstring + corner
                        );

                        var marker = paper.circle(0, 0, 2);
                        marker.attr({fill: "#0F0"});
                        marker.transform(corner);

                    }
                }
            }
        }
    }

})(Snap, program, interpreter, graphics, tmath);
