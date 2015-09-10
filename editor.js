
var editor = editor || {},
    core = core || {},
    program = program || {},
    interpreter = interpreter || {},
    graphics = graphics || {},
    view = view || {},
    tmath = tmath || {},
    codeCell = codeCell || {};

editor.events = {
    tileSelected: "tile-selected"
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

var startEditor = function() {

    graphics.preload().then(function() {
        var paper = Snap(640, 640);
        paper.appendTo(document.getElementById("main"));
        var palette = new Palette(paper, 10, 30, 2);

        var controller = new Editor(paper);

        var gv = new view.GridView(paper, 150, 30, 400, 400, 10, 10);

        gv.drawGrid();

        paper.mousedown((evt, x, y) => {
            gv.screenPointToCell(x, y);
        });
    });

};

function Editor(paper) {
    this.paper = paper;
    this.tileCursor = null;

    var events = {
        tileSelected: (data) => this.onTileSelected(data)
    };

    registerEvents(events);
}

Editor.prototype.onTileSelected = function(data) {
    if (this.tileCursor != null)
        this.tileCursor.remove();

    var tileGraphic = this.paper.g(graphics.getGraphic(data.tile)),
        mousePoint = graphics.screenPointToLocal(data.x, data.y, this.paper);

    tileGraphic.transform("t" + (mousePoint.x - 56/2) + "," + (mousePoint.y - 56/2));

    var move = (evt, x, y) => {
        var mousePoint = graphics.screenPointToLocal(x, y, this.paper);
        tileGraphic.transform("t" + (mousePoint.x - 56/2) + "," + (mousePoint.y - 56/2));
    };

    this.paper.mousemove(
        move
    );

    this.paper.mousedown(
        () => {
            this.paper.unmousemove(move);
            tileGraphic.remove();
        }
    );

    this.tileCursor = tileGraphic;
};
