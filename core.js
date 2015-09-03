var core = core || {};

(function(signals) {
    /* Symbols */
    core.EMPTY = {symbol: 'empty'};
    core.RED = {symbol: 'red'};
    core.BLUE = {symbol: 'blue'};
    core.GREEN = {symbol: 'green'};
    core.YELLOW = {symbol: 'yellow'};

    /* Tape
     Represents an ordered queue of symbols
     */
    function Tape() {
        this.symbols = [];
	this.changed = new signals.Signal();
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
	    var popped = this.symbols.shift();
	    this.changed.dispatch("pop");
            return popped;
        } else {
            return core.EMPTY;
        }
    };

    Tape.prototype.append = function append(s) {
        this.symbols.push(s);
	this.changed.dispatch("append");
    };

    core.Tape = Tape;
})(signals);
