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

    var Field = function Field(paper, width, height) {
        this.paper = paper;
        this.tapeView = paper.g();
        this.width = width;
        this.height = height;
    }

    Field.prototype.drawTape = function drawTape(t) {

        this.tapeView.clear()

        var sw = this.width / t.symbols.length;

        for (var i = 0; i < t.symbols.length; ++i) {
            var circle = this.paper.circle(sw*i + sw/2, sw/2 + 5, sw/2-5);

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

    core.main = function() {

        var t = new Tape();
        core.t = t;
        t.append(core.RED);
        t.append(core.BLUE);
        t.append(core.RED);
        t.append(core.EMPTY);
        t.append(core.BLUE);
        t.append(core.RED);
        t.append(core.BLUE);
        t.append(core.EMPTY);
        t.append(core.BLUE);

        var paper = Snap(320, 240);
        paper.appendTo(document.getElementById("main"));


        var field = new Field(paper, 320, 240);

        field.drawTape(t)

    };

})(Snap);
