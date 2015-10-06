let editor = editor || {};

export default editor;

import program from "program";
import graphics from "graphics";
import * as view from "view";
import tmath from "tmath";

editor.events = {
    tileSelected: "tile-selected",
    cellSelected: "cell-selected",
    mirror: "mirror",
    rotate: "rotate",
    setDirection: "set-direction",
    delete: "delete",
    hotKey: "hot-key"
};

editor.trigger = function(event, args) {
    radio(event).broadcast(args);
};

function registerEvents(evts) {
    Object.keys(evts).forEach(function(key) {
        radio(editor.events[key]).subscribe(evts[key]);
    });
}

editor.registerEvents = registerEvents;

function unregisterEvents(evts) {
    Object.keys(evts).forEach(function(key) {
        radio(editor.events[key]).unsubscribe(evts[key]);
    });
}

editor.unregisterEvents = unregisterEvents;

var startEditor = function() {

    var paper = Snap(900, 640);

    graphics.preload(paper).then(function() {

        var programLayer = paper.g().addClass("program-layer");

        paper.appendTo(document.getElementById("main"));

        var palette = new view.Palette(paper, 10, 30, 2),

            currentProgram = new program.Program(10, 10),

            programView = new view.ProgramView(
                programLayer,
                10 + palette.drawWidth,
                30,
                56,
                currentProgram
            ),

            controller = new Editor(paper, programView);

        programView.drawProgram();

        document.body.addEventListener("keydown", dispatchKeyEvents);
        document.body.addEventListener("mousemove", trackMouse);
    });

};

editor.init = function () {
    document.body.addEventListener("keydown", dispatchKeyEvents);
    document.body.addEventListener("mousemove", trackMouse);
};

function dispatchKeyEvents(evt) {
    console.log(evt);
    var data = _.clone(mousePosition),
        what = null,
        key = evt.key || String.fromCharCode(evt.keyCode).toLowerCase();


    switch (key) {
        case "r":
            what = editor.events.rotate;
            break;
        case "m":
            what = (editor.events.mirror);
            break;
        case "s":
            what = editor.events.setDirection;
            data.dir = "UP";
            break;
        case "d":
            what = editor.events.setDirection;
            data.dir = "RIGHT";
            break;
        case "w":
            what = editor.events.setDirection;
            data.dir = "DOWN";
            break;
        case "a":
            what = editor.events.setDirection;
            data.dir = "LEFT";
            break;
        case "x":
            what = editor.events.delete;
            break;
    }

    if (!what) {
        what = editor.events.hotKey;
        data.key = key;
    }

    editor.trigger(what, data);
}

var mousePosition = {
    x: 0,
    y: 0
};

function trackMouse(evt) {
    mousePosition.x = evt.clientX;
    mousePosition.y = evt.clientY;
}

var IDLE = Symbol("IDLE"),
    PLACING = Symbol("PLACING");

function cycleGenerator() {
    let os = ["UP",
              "RIGHT",
              "DOWN",
              "LEFT"];

    return function(current) {
        if (!current)
            current = "LEFT";

        let index = (os.indexOf(current) + 1) % os.length,
            oName = os[index];

        return oName;
    };
};

editor.cycleGenerator = cycleGenerator;

let cycleOrientation = cycleGenerator();

class Editor {
    constructor(paper, programView, tileControl) {
        this.paper = paper;
        this.programView = programView;
        //this.tileCursor = null;
        this.state = IDLE;
        // this.currentTile = null;
        // this.currentOrientation = "UP";
        //this.mirror = false;
        this.tileControl = tileControl;

        this._events = {
            tileSelected: (data) => this.onTileSelected(data),
            cellSelected: (data) => this.onCellSelected(data),
            rotate: (data) => this.onRotateCell(data),
            mirror: (data) => this.onMirror(data),
            setDirection: (data) => this.onSetDirection(data),
            delete: (data) => this.onDelete(data)
        };
    }

    enable() {
        registerEvents(this._events);
        this.tileControl.show(true);
    }

    disable() {
        //this.clearCursor();
        unregisterEvents(this._events);
        this.tileControl.show(false);
    }

    move(evt, x, y) {
        if (this.state == PLACING && this.tileCursor) {

            var mousePoint = graphics.screenPointToLocal(mousePosition.x, mousePosition.y, this.paper),

                oName = this.currentOrientation,

                o = orientationByName(oName, this.mirror),

                rotate = view.toTransformString(
                    Snap.matrix(o.a, o.b, o.c, o.d, 0, 0)
                ),

                translate = Snap.matrix()
                    .translate(mousePoint.x - 56/2, mousePoint.y - 56/2)
                    .toTransformString().toUpperCase();

            this.tileCursor.transform(rotate + translate);
        }
    }

    onTileSelected (data) {
        this.state = PLACING;

        this.tileControl.onTileSelected(data.tile);
        //this.currentTile = data.tile;

        // if (this.tileCursor != null)
        //     this.tileCursor.remove();

        // var tileGraphic = this.paper.g(graphics.getGraphic(data.tile)),
        //     mousePoint = graphics.screenPointToLocal(data.x, data.y, this.paper);

        // tileGraphic.node.style.pointerEvents = "none"; // disable click events

        // this.paper.mousemove(
        //     this.move.bind(this)
        // );

        // this.tileCursor = tileGraphic;

        // this.move(data, data.x, data.y);
    }

    onCellSelected (data) {
        if (this.state == PLACING && this.tileControl.currentTile) {
            // We can now place the tile

            var curCell = this.programView.program.getCell(
                data.cell.x,
                data.cell.y
            );

            if (curCell.type != "Start" && curCell.type != "End") {

                this.programView.program.setCell(data.cell.x,
                                                 data.cell.y,
                                                 this.tileControl.currentTile,
                                                 orientationByName(
                                                     this.tileControl.currentOrientation,
                                                     this.tileControl.mirror)
                                                );
            }
        }
    }

    onRotateCell (data) {
        if (this.state == PLACING) {
            this.tileControl.onRotate();
        } else if (this.state == IDLE) {
            // see if we are hovering over the programview
            var el = Snap.getElementByPoint(data.x, data.y);
            var info = el.data("tileInfo");

            if (el && info) {
                // Now have reference to cell
                var o = info.cell.orientation,
                    type = info.cell.type,
                    x = info.x,
                    y = info.y;
                o = o.compose(tmath.Mat2x2.kROT1);

                this.programView.program.setCell(x, y, type, o);
            }
        }
    }

    onSetDirection (data) {
        if (this.state == PLACING) {
            this.tileControl.onSetDirection(data.dir);
        } else if (this.state == IDLE && data && data.x && data.y) {
            // see if we are hovering over the programview
            var el = Snap.getElementByPoint(data.x, data.y);
            var info = el.data("tileInfo");

            if (el && info) {
                // Now have reference to cell
                var type = info.cell.type,
                    x = info.x,
                    y = info.y,
                    o = info.cell.orientation,
                    mirrored = isMirrored(o);

                if (type != "Start" && type != "End" && type != "Empty")

                    this.programView.program.setCell(x, y, type, orientationByName(dir, mirrored));
            }
        }
    }

    onMirror (data) {
        if (this.state == PLACING) {
            this.tileControl.onMirror();
        } else if (this.state == IDLE && data && data.x && data.y) {
            // see if we are hovering over the programview
            var el = Snap.getElementByPoint(data.x, data.y);
            var info = el.data("tileInfo");

            if (el && info) {
                // Now have reference to cell
                var o = info.cell.orientation,
                    type = info.cell.type,
                    x = info.x,
                    y = info.y;
                o = tmath.Mat2x2.kMIR.compose(o);
                if (type != "Start" && type != "End" && type != "Empty")
                    this.programView.program.setCell(x, y, type, o);
            }
        }
    }

    clearCursor() {
        this.state = IDLE;
        if (this.tileCursor) {
            this.tileCursor.remove();
            this.tileCursor.unmousemove(this.move);
            this.tileCursor = null;
        }
        this.currentTile = null;
    }

    onDelete(data) {
         if (this.state == PLACING) {
             // Reset orientation for next time
             this.tileControl.clear();
             this.state = IDLE;
        } else if (this.state == IDLE && data && data.x && data.y) {
            // see if we are hovering over the programview

            let el = Snap.getElementByPoint(data.x, data.y),

                info = el.data("tileInfo");

            if (el && info) {
                // Now have reference to cell
                let p = info.program,
                    type = info.cell.type,
                    x = info.x,
                    y = info.y;
                if (type != "Start" && type != "End" && type != "Empty")
                    p.setCell(x, y, "Empty");
            }
        }
    }
};

editor.Editor = Editor;

function orientationByName(dir, mirror) {
    var m = tmath.Mat2x2,
        regular = {
            "UP": m.kID,
            "RIGHT": m.kROT1,
            "DOWN": m.kROT2,
            "LEFT": m.kROT3
        },
        mirrored = {
            "UP": m.kMIR,
            "RIGHT": m.kMROT1,
            "DOWN": m.kMROT2,
            "LEFT": m.kMROT3
        };

    return mirror ? mirrored[dir] : regular[dir];
}

editor.orientationByName = orientationByName;

function isMirrored(orientation) {
    var m = tmath.Mat2x2,
        l = [m.kMIR, m.kMROT1, m.kMROT2, m.kMROT3];

    return l.some(
        (mat) => _.isEqual(mat, orientation)
    );
}
