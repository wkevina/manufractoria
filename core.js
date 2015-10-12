
import signals from "signals.js";

/* Symbols */
let EMPTY = {symbol: 'empty'},
    RED = {symbol: 'red'},
    BLUE = {symbol: 'blue'},
    GREEN = {symbol: 'green'},
    YELLOW = {symbol: 'yellow'},

    symbols = {
        R: RED,
        B: BLUE,
        G: GREEN,
        Y: YELLOW
    };

export {RED, GREEN, BLUE, YELLOW, symbols};

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

export default {
    Tape: Tape,
    RED: RED,
    GREEN: GREEN,
    BLUE: BLUE,
    YELLOW: YELLOW,
    symbols: symbols
};
