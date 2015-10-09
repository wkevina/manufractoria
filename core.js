let core = core || {};

export default core;

import signals from "signals.js";

/* Symbols */
core.EMPTY = {symbol: 'empty'};
core.RED = {symbol: 'red'};
core.BLUE = {symbol: 'blue'};
core.GREEN = {symbol: 'green'};
core.YELLOW = {symbol: 'yellow'};

core.symbols = {
    R: core.RED,
    B: core.BLUE,
    G: core.GREEN,
    Y: core.YELLOW
};

/* Tape
 Represents an ordered queue of symbols
 */
export class Tape {
    constructor() {
        this.symbols = [];
        this.changed = new signals.Signal();
    }

    head() {
        if (this.symbols.length > 0) {
            return this.symbols[0];
        } else {
            return core.EMPTY;
        }
    }

    pop() {
        if (this.symbols.length > 0) {
            var popped = this.symbols.shift();
            this.changed.dispatch("pop");
            return popped;
        } else {
            return core.EMPTY;
        }
    }

    append(s) {
        this.symbols.push(s);
        this.changed.dispatch("append");
    }

    static clone(otherTape) {
        var newTape = new Tape();
        newTape.symbols = otherTape.symbols.slice(0);
        return newTape;
    }

};

core.Tape = Tape;
