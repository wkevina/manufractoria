
import core from 'core';
import tmath from 'tmath';

const dir = {                     // regardless of how graphics are handled, these mean:
    UP:     new tmath.Vec2(0, 1),     // +y
    DOWN:   new tmath.Vec2(0, -1),    // -y
    LEFT:   new tmath.Vec2(-1, 0),    // -x
    RIGHT:  new tmath.Vec2(1, 0)      // +x
};

function makeCellClass(typeID) {
    return function() {
        this.type = typeID;
        this.orientation = tmath.Mat2x2.ID();
    };
};

let cellTypes = {
    Empty: makeCellClass('Empty'),
    Start: makeCellClass('Start'),
    End: makeCellClass('End'),
    Conveyor: makeCellClass('Conveyor'),
    CrossConveyor: makeCellClass('CrossConveyor'),
    BranchBR: makeCellClass('BranchBR'),
    BranchGY: makeCellClass('BranchGY'),
    WriteB: makeCellClass('WriteB'),
    WriteR: makeCellClass('WriteR'),
    WriteG: makeCellClass('WriteG'),
    WriteY: makeCellClass('WriteY')
};

class Program {

    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        this.cells = [];
        this.changed = new signals.Signal();

        for (let x = 0; x < cols; ++x) {
            this.cells.push([]);
            for (let y = 0; y < rows; ++y) {
                this.cells[x].push(new cellTypes.Empty());
            }
        }
    }

    getCell(x, y) {
        return this.cells[x][y];
    }

    setCell(x, y, type, orientation) {
        const s = new cellTypes[type]();

        if (orientation) {
            s.orientation = orientation;
        }

        this.cells[x][y] = s;

        this.changed.dispatch({
            event: 'set',
            x: x,
            y: y,
            type: type,
            orientation: orientation
        });
    }

    setStart(x, y) {
        this.setCell(x, y, 'Start');
    }

    setEnd(x, y) {
        this.setCell(x, y, 'End');
    }
};

function readLegacyProgramString(s) {

    // [lvlString]&[codeString]&[metaInfo]

    let i = 0;

    const attrStrings = s.split('&');
    const attrs = {};

    for (i = 0; i < attrStrings.length; i++) {
        if (attrStrings[i].startsWith('lvl=')) {
            attrs.lvl = parseInt(attrStrings[i].slice(4));
        }

        if (attrStrings[i].startsWith('code=')) {
            attrs.codeString = attrStrings[i].slice(5);
        }

        if (attrStrings[i].startsWith('ctm=')) {

            // [name];[description];[test case string];[rows/cols count];[??? always 3];[??? 1 or 0 for binary or 'normal']

            const ctmParts = attrStrings[i].slice(4).split(';');
            attrs.name = ctmParts[0];
            attrs.description = ctmParts[1];
            attrs.testCaseString = ctmParts[2];
            attrs.rows = ctmParts[3];
            attrs.cols = ctmParts[3];
        }
    }

    // Now parse the codeString part

    const typeMap = {c: 'Conveyor', b: 'WriteB', r: 'WriteR', g: 'WriteG', y: 'WriteY', p: 'BranchBR', q: 'BranchGY', i: 'CrossConveyor'};

    const p = new Program(attrs.cols, attrs.rows);
    const parts = attrs.codeString.split(';');

    for (let i = 0; i < parts.length; i++) {

        // [type][column]:[row]f[orientation]

        const partString = parts[i].trim();

        if (partString.length == 0) continue;

        const fInd = _.indexOf(partString, 'f');
        const cInd = _.indexOf(partString, ':');

        const original = {type: partString[0], x: parseInt(partString.slice(1, cInd)), y: parseInt(partString.slice(cInd + 1, fInd)), orientation: parseInt(partString.slice(fInd + 1))};

        const cellProps = {};

        cellProps.type = typeMap[original.type];
        cellProps.x = original.x - Math.round(-0.5 * (p.cols - 9) + 8);
        cellProps.y = original.y - Math.round(-0.5 * (p.cols - 9) + 3); // Lol this coordinate system
        console.log(cellProps);

        //console.log(cellProps.type, original.orientation);
        if (cellProps.type.startsWith('Branch')) {
            if (original.orientation == 0) cellProps.orientation = tmath.Mat2x2.MROT3();
            if (original.orientation == 1) cellProps.orientation = tmath.Mat2x2.MROT2();
            if (original.orientation == 2) cellProps.orientation = tmath.Mat2x2.MROT1();
            if (original.orientation == 3) cellProps.orientation = tmath.Mat2x2.MIR();
            if (original.orientation == 4) cellProps.orientation = tmath.Mat2x2.ROT3();
            if (original.orientation == 5) cellProps.orientation = tmath.Mat2x2.ROT2();
            if (original.orientation == 6) cellProps.orientation = tmath.Mat2x2.ROT1();
            if (original.orientation == 7) cellProps.orientation = tmath.Mat2x2.ID();
        } else if (!(cellProps.type == 'CrossConveyor')) {
            if (original.orientation == 0 || original.orientation == 4) cellProps.orientation = tmath.Mat2x2.ROT3();
            if (original.orientation == 1 || original.orientation == 5) cellProps.orientation = tmath.Mat2x2.ROT2();
            if (original.orientation == 2 || original.orientation == 6) cellProps.orientation = tmath.Mat2x2.ROT1();
            if (original.orientation == 3 || original.orientation == 7) cellProps.orientation = tmath.Mat2x2.ID();
        } else {
            // CrossConveyer is weird
            if (original.orientation == 5 || original.orientation == 7) cellProps.orientation = tmath.Mat2x2.ID();
            if (original.orientation == 1 || original.orientation == 6) cellProps.orientation = tmath.Mat2x2.ROT3();
            if (original.orientation == 0 || original.orientation == 2) cellProps.orientation = tmath.Mat2x2.ROT2();
            if (original.orientation == 3 || original.orientation == 4) cellProps.orientation = tmath.Mat2x2.ROT1();
        }

        p.setCell(cellProps.x, cellProps.y, cellProps.type, cellProps.orientation);

    }

    p.setStart(Math.floor(p.cols / 2), 0);
    p.setEnd(Math.floor(p.cols / 2), p.rows - 1);

    return p;

};

export default {
    directions: dir,
    cellTypes,
    Program,
    readLegacyProgramString
};
