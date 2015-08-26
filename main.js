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
    }

    Tape.prototype.append = function append(s) {
        this.symbols.push(s);
    }

    core.Tape = Tape;

    var TapeView = function TapeView(paper, width, height) {
        this.paper = paper;
        this.tapeView = paper.g();
        this.width = width;
        this.height = height;
    }

    TapeView.prototype.drawTape = function drawTape(t) {

        this.tapeView.clear()

        var sw = 20;

        var MAX = Math.floor((this.width - sw) / sw);

        for (var i = 0; i < t.symbols.length && i < MAX; ++i) {
            var circle = this.paper.circle(sw*i + sw/2, sw/2 + 5, sw/2 - 2);

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
    }

    var GridView = function GridView(paper, width, height) {
        this.paper = paper;
        this.grid = paper.g();
        this.width = width;
        this.height = height;
        this.cols = 0;
        this.rows = 0;
    }

    GridView.prototype.drawGrid = function drawGrid(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        
        this.grid.clear();

        var sw = this.width / cols;
        var sy = this.height / rows;

        for (var x = 0; x <= cols; ++x) {
            var l = this.paper.line(x*sw, 0, x*sw, this.height);
            this.grid.append(l);
        }

        for (var y = 0; y <= rows; ++y) {
            var l = this.paper.line(0, y*sy, this.width, y*sy);
            this.grid.append(l);
        }

        this.grid.attr({stroke: "#000", strokeWidth: 2});
        this.grid.transform("t1,1");
    }

    

    core.main = function() {

        var t = new Tape();
        core.t = t;

        for (var i = 0; i < 10; ++i) {
            t.append(core.RED);
            t.append(core.BLUE);
            t.append(core.RED);
            t.append(core.EMPTY);
        }
       

        var paper = Snap(640, 480);
        paper.appendTo(document.getElementById("main"));


        var field = new TapeView(paper, 640, 100);
        field.drawTape(t)

        var grid = new GridView(paper, 400, 400);

        grid.drawGrid(10, 10);
    };

})(Snap);
