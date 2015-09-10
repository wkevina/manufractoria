
var editor = editor || {},
    core = core || {},
    program = program || {},
    interpreter = interpreter || {},
    graphics = graphics || {},
    view = view || {},
    tmath = tmath || {},
    codeCell = codeCell || {};

editor.events = {
    tileSelected: "tile-selected",
    cellSelected: "cell-selected",
    mirror: "mirror",
    rotate: "rotate",
    setDirection: "set-direction"
};

editor.trigger = function(event, args) {
    radio(event).broadcast(args);
};

function registerEvents(evts) {
    Object.keys(evts).forEach(function(key) {
        radio(editor.events[key]).subscribe(evts[key]);
    });
}

function Palette(paper, x, y, columns) {
    this.paper = paper;
    this.x = x;
    this.y = y;
    this.columns = columns > 0 ? columns : 1; // negative columns?
    this.width = 56;
    this.tiles = paper.g();
    this.drawWidth = columns * (56 + 20);

    // Get names of all types to draw
    this.typesToDraw = Object.keys(codeCell.codeCells);

    // calculate scaling required
    var scale_x = this.width / 56;

    this.tiles.transform(Snap.matrix().translate(x, y).scale(scale_x, scale_x));
    this.drawPalette();
}

Palette.prototype.drawPalette = function drawPalette() {
    this.tiles.clear();

    var scale_x = this.width / 56;

    var height = 56 + 20; // 56 pixel tile + 10 pixel text + 10 pixel padding
    var width = 56 + 20;
    var cellImages = this.typesToDraw.map(function(name) {
        var image = this.paper.g(graphics.getGraphic(name));
        if (image != null) return {name:name, image:image};
        else return undefined;

    }.bind(this)).filter(_.negate(_.isUndefined));

    cellImages.map(function(image, index){

        var group = this.tiles.g(),
            x_index = index % this.columns,
            y_index = Math.floor(index / this.columns),
            transform = Snap.matrix().translate(x_index * width, y_index * height);

        group.click(
            (evt, x, y) => {
                editor.trigger(
                    editor.events.tileSelected,
                    {
                        tile: image.name,
                        event: evt,
                        x: x,
                        y: y
                    }
                );
            });

        group.transform(transform.toTransformString());

        var r = group.rect(-1, -1, 58, 58);
        r.attr({
            stroke: "#111",
            fill: "#fff",
            strokeWidth: 2
        }).addClass("palette-tile-bg");

        image.image.addClass("palette-tile");
        group.append(image.image);



        var label = group.text(56/2, height - 8, image.name);
        label.attr({
            fontFamily: "monospace",
            fontSize: 10,
            textAnchor: "middle",
            text: image.name == "CrossConveyor" ? "Crossover" : image.name
        }).addClass("label-text");

        var title = Snap.parse('<title>'+image.name+'</title>');

        group.append(title);


    }, this);
};

var mousePosition = {
    x: 0,
    y: 0
};

var startEditor = function() {

    graphics.preload().then(function() {
        var paper = Snap(900, 640);
        paper.appendTo(document.getElementById("main"));

        var palette = new Palette(paper, 10, 30, 2),

            currentProgram = new program.Program(10, 10),

            controller = new Editor(paper, currentProgram),

            programView = new view.ProgramView(
                paper,
                10 + palette.drawWidth,
                30,
                56,
                currentProgram
            );

        programView.drawProgram();

        document.body.addEventListener("keydown", dispatchKeyEvents);
        document.body.addEventListener("mousemove", trackMouse);
    });

};

function dispatchKeyEvents(evt) {
    console.log(evt);
    var mouse = _.clone(mousePosition);
    switch (evt.key) {
        case "r":
            editor.trigger(editor.events.rotate, mouse);
            break;
        case "m":
            editor.trigger(editor.events.mirror, mouse);
        case "s":
            editor.trigger(editor.events.setDirection, _.extend(mouse, {dir: "UP"}));
            break;
        case "d":
            editor.trigger(editor.events.setDirection, _.extend(mouse, {dir: "RIGHT"}));
            break;
        case "w":
            editor.trigger(editor.events.setDirection, _.extend(mouse, {dir: "DOWN"}));
            break;
        case "a":
            editor.trigger(editor.events.setDirection, _.extend(mouse, {dir: "LEFT"}));
            break;
    }
}

function trackMouse(evt) {
    mousePosition.x = evt.clientX;
    mousePosition.y = evt.clientY;
}

var IDLE = Symbol("IDLE"),
    PLACING = Symbol("PLACING");

var cycleOrientation = (function() {
    var os = ["UP",
              "RIGHT",
              "DOWN",
              "LEFT"];

    return function(current) {
        if (!current)
            current = "LEFT";

        var index = (os.indexOf(current) + 1) % os.length,
            oName = os[index];

        return oName;
    };
})();

function Editor(paper, prog) {
    this.paper = paper;
    this.program = prog;
    this.tileCursor = null;
    this.state = IDLE;
    this.currentTile = null;
    this.currentOrientation = "UP";
    this.mirror = false;

    var events = {
        tileSelected: (data) => this.onTileSelected(data),
        cellSelected: (data) => this.onCellSelected(data),
        rotate: (data) => this.onRotateCell(data),
        mirror: (data) => this.onMirror(data),
        setDirection: (data) => this.onSetDirection(data)
    };

    registerEvents(events);
}

Editor.prototype.move = function move(evt, x, y) {
    if (this.state == PLACING && this.tileCursor) {

        var mousePoint = graphics.screenPointToLocal(x, y, this.paper),

            oName = this.currentOrientation,

            o = orientationByName(oName, this.mirror),

            rotate = view.toTransformString(
                Snap.matrix(o.a, o.b, o.c, o.d, 0, 0)
            ),

            translate = Snap.matrix()
                .translate(mousePoint.x - 56/2, mousePoint.y - 56/2)
                .toTransformString().toUpperCase();

        if (move.lastOrientation && move.lastOrientation != o) {
            move.animating = true;
            this.tileCursor.animate(
                {
                    transform: rotate + translate
                },
                50,
                mina.linear,
                () => move.animating = false);
        }

        if (!move.animating) {
            this.tileCursor.transform(rotate + translate);
        }

        move.lastOrientation = o;
    }
};

Editor.prototype.onTileSelected = function (data) {
    this.state = PLACING;
    this.currentTile = data.tile;
    this.currentOrientation = "UP";

    if (this.tileCursor != null)
        this.tileCursor.remove();

    var tileGraphic = this.paper.g(graphics.getGraphic(data.tile)),
        mousePoint = graphics.screenPointToLocal(data.x, data.y, this.paper);

    tileGraphic.node.style.pointerEvents = "none"; // disable click events
    tileGraphic.transform("t" + (mousePoint.x - 56/2) + "," + (mousePoint.y - 56/2));

    this.paper.mousemove(
        this.move.bind(this)
    );

    this.tileCursor = tileGraphic;
};

Editor.prototype.onCellSelected = function (data) {
    if (this.state == PLACING && this.currentTile) {
        // We can now place the tile
        this.program.setCell(data.cell.x,
                             data.cell.y,
                             this.currentTile,
                             this.currentOrientation);

        this.state = IDLE;
        this.tileCursor.remove();
        this.tileCursor.unmousemove(this.move);
        this.tileCursor = null;
        this.currentTile = null;
    }
};

Editor.prototype.onRotateCell = function (data) {
    if (this.state == PLACING) {
        this.currentOrientation = cycleOrientation(this.currentOrientation);
        this.move(data, data.x, data.y);
    }
};

Editor.prototype.onSetDirection = function (data) {
    if (this.state == PLACING) {
        var dir = data.dir,
            mir = this.mirror,
            m = tmath.Mat2x2,
            o = orientationByName(dir, mir);

        if (o && o !== this.currentOrientation) {
            this.currentOrientation = dir;
            this.move(data, data.x, data.y);
        }
    }
};

Editor.prototype.onMirror = function (data) {
    if (this.state == PLACING) {
        this.mirror = !this.mirror;
        this.move(data, data.x, data.y);
    }
};

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
