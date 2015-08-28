var core = core || {};

(function (Snap) {

    /* Symbols */
    core.EMPTY = {symbol: 'empty'};
    core.RED = {symbol: 'red'};
    core.BLUE = {symbol: 'blue'};


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

        var t = new Tape();
        core.t = t;

        for (var i = 0; i < 10; ++i) {
            t.append(core.RED);
            t.append(core.BLUE);
            t.append(core.RED);
            t.append(core.EMPTY);
        }


        var paper = Snap(640, 640);
        paper.appendTo(document.getElementById("main"));


        var field = new TapeView(paper, 0, 0, 400, 20);
        field.drawTape(t);

        var grid = new GridView(paper, 0, 30, 400, 400, 10, 10);

        grid.drawGrid();


        var interpreter = new MockInterpreter();
        interpreter.gridWidth = grid.cols;
        interpreter.gridHeight = grid.rows;

        var token = paper.circle(0, 0, 10);
        token.attr({fill: "#E0E"});

        var curPos = interpreter.position;
        token.transform(grid.getCellMatrix(curPos.x, curPos.y).toTransformString());

        function mainLoop() {

            interpreter.step();

            curPos = interpreter.position;
            var newTransform = grid.getCellMatrix(curPos.x, curPos.y).toTransformString();

            token.animate(
                {transform: newTransform},
                500,
                mina.easeinout,
                function() {
                    mainLoop();
                }
            );
        }

        mainLoop();
    };

    /**
     A Fake interpreter
     */
    function MockInterpreter() {
        this.position = {x:0, y:0};
        this.gridWidth = 0;
        this.gridHeight = 0;
    }

    MockInterpreter.prototype.step = function step() {
        function randomDir() {
            var r = Math.floor(Math.random()*4);

            switch(r) {
            case 0:
                return {x: 0, y: -1};
            case 1:
                return {x:0, y: 1};
            case 2:
                return {x:-1, y: 0};
            case 3:
                return {x: 1, y: 0};
            default:
                return {x: 0, y: -1};
            }
        }

        while (true) {
            var newDir = randomDir();
            var newX = newDir.x + this.position.x;
            var newY = newDir.y + this.position.y;

            if (newX < 0 || newX >= this.gridWidth) {
                continue;
            }
            if (newY < 0 || newY >= this.gridHeight) {
                continue;
            }

            this.position = {x: newX, y: newY};
            break;
        }

    };



})(Snap);
