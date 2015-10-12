/**
 * User interaction classes
 */

import editor from "editor";
import graphics from "graphics";
import codeCell from "codeCell";
import {toTransformString} from "view";
import {Picker} from "picker";
import {orientationByName} from "tmath";

class BaseControl {
    constructor(paper, x, y) {
        this.paper = paper;
        this._x = x;
        this._y = y;

        this._layer = paper.g();
        this._translate();
    }

    get x() {
        return this._x;
    }

    set x(_x) {
        this._x = _x;
        this._translate();
    }

    get y() {
        return this._y;
    }

    set y(_y) {
        this._y = _y;
        this._translate();
    }

    _translate() {
        this._layer.transform(Snap.matrix().translate(this._x, this._y));
    }

    show(shouldShow) {
        shouldShow = shouldShow !== undefined ? shouldShow : true;
        this._layer.attr({
            opacity: shouldShow ? 1 : 0
        });
    }

    _translate() {
        this._layer.transform(Snap.matrix().translate(this._x, this._y));
    }
}

export class Palette extends BaseControl {

    constructor(paper, x, y, max_width, columns, margin) {
        super(paper, x, y);

        this.columns = columns > 0 ? columns : 1; // negative columns?
        this.columnWidth = 56;
        this.tiles = this._layer.g();
        this.maxWidth = max_width;
        this.margin = margin || 20;
        this.tileWidth = 56; // tiles are 56 x 56 px

        // Get names of all types to draw
        this.typesToDraw = Object.keys(codeCell.codeCells);

        var actualColumns = this.columns <= this.typesToDraw.length ?
                this.columns :
                this.typesToDraw.length;

        this.baseWidth = actualColumns * (this.tileWidth + this.margin) - this.margin;

        this.width = this.baseWidth * this.getScale();

        this.drawPalette();

        this._events = {
            hotKey: (data) => this.hotKey(data)
        };

        editor.registerEvents(this._events);
    }

    getScale() {
        return this.maxWidth / this.baseWidth;
    }

    hotKey(data) {
        var num = parseInt(data.key);
        if (!isNaN(num) && num > 0 && num <= this.typesToDraw.length) {
            editor.trigger(
                editor.events.tileSelected,
                {
                    tile: this.typesToDraw[num - 1],
                    x: data.x,
                    y: data.y
                }
            );
        }
    }

    drawPalette() {
        this.tiles.clear();

        var scale_x = this.getScale();

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
                transform = Snap.matrix().scale(scale_x).translate(x_index * width, y_index * height);

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
                textAnchor: "middle",
                text: index + 1
            }).addClass("label-text");

            var title = Snap.parse('<title>'+image.name+'</title>');

            group.append(title);
        }, this);
    }
};

/**
 * TileControl
 * GUI control for manipulating tile before placing
 *
 * @param {Snap.Element} paper Snap layer to place content
 * @param {number} x X coordinate
 * @param {number} y Y coordinate
 * @param {number} width Maximum width to fit content
 * @param {number} height Maximum height to fit contentxs
 */

export class TileControl extends BaseControl {
    constructor(paper, x, y, width, height) {
        super(paper, x, y);

        this.width = width;
        this.height = height;
        this.currentTile = null;
        this.currentOrientation = "UP";
        this.mirror = false;

        this.cycleOrientation = editor.cycleGenerator();

        this.layer = this._layer.g();
        this.tileLayer = this.layer.g();

        this.tileLayer.transform("T20,20");

        this.tileLayer.click(
            (evt)=> {
                editor.trigger(editor.events.rotate, {});
            });

        this.calculateScale();

        let down = this._makeDirButton(32, 0, 0),
            right = this._makeDirButton(20+56, 32, 90),
            up = this._makeDirButton(32, 20+56, 180),
            left = this._makeDirButton(0, 32, 270);

        function bt(el, dir) {
            el.click(() => editor.trigger(editor.events.setDirection, {dir: dir}));
        }

        bt(up, "UP"); bt(right, "RIGHT"); bt(down, "DOWN"); bt(left, "LEFT");

        let del = this._makeDeleteButton(96+32, 96*2/3, "tile-control-button", "delete");

        del.click(
            () => editor.trigger(editor.events.delete, {})
        );

        let mirror = this._makeMirrorButton(96+32, 96/3, "tile-control-button", "mirror");

        mirror.click(
            () => editor.trigger(editor.events.mirror)
        );
    }

    _makeDirButton(x, y, angle=0) {
        let button = this.layer.g();
        button.addClass("tile-control-button").addClass("direction");

        let rect = button.rect(1,1,30,18, 2, 2).attr({fill: "gray"});
        rect.addClass("bg");

        let arrow = button.path("M6,16L16,4L26,16L6,16");
        arrow.attr({fill:"white"});

        if (angle == 90) {
            x += 20;
        } else if (angle == 180) {
            y += 20;
            x += 32;
        } else if (angle == 270) {
            y += 32;
        }

        button.transform("r"+angle+",0,0"+"T"+x+","+y);

        return button;
    }



    _makeDeleteButton(x, y) {
        return makeButton(x, y, this.layer, "DeleteButton", "tile-control-button", "delete");
    }

    _makeMirrorButton(x, y) {
        return makeButton(x, y, this.layer, "MirrorButton", "tile-control-button", "mirror");
    }

    calculateScale() {
        /*
         Graphics are laid out with 56x56 tile in center with 20px gutters on all other sides
         Unscaled width = 56 + 20 + 20 = 96
         */
        let x_scale = this.width / 96;
        this.layer.transform("s"+x_scale);
    }

    onTileSelected(tile) {
        if (tile != this.currentTile) {
            this.currentTile = tile;
            this.drawTile();
            this.orientTile();
        }
    }

    drawTile() {
        this.tileLayer.clear();

        let tileGraphic = this.tileLayer.g(
            graphics.getGraphic(this.currentTile)
        );

        if (tileGraphic) {
            this.currentGraphic = tileGraphic;
            this.orientTile();
        } else {
            this.currentGraphic = null;
        }
    }

    clear() {

        this.tileLayer.clear();

        this.currentGraphic = null;
        this.currentTile = null;
        this.currentOrientation = "UP";
        this.mirror = false;
    }

    orientTile() {
        if (this.currentGraphic) {
            let oName = this.currentOrientation,

                o = orientationByName(oName, this.mirror),

                rotate = toTransformString(
                    Snap.matrix(o.a, o.b, o.c, o.d, 0, 0)
                );

            this.currentGraphic.transform(rotate + "S" + 40/56);
        }
    }

    onRotate() {
        this.currentOrientation = this.cycleOrientation(this.currentOrientation);
        this.orientTile();
    }

    onSetDirection(dir) {
        this.currentOrientation = dir;
        this.orientTile();
    }

    onMirror() {
        this.mirror = !!!this.mirror;
        this.orientTile();
    }
};

export class PlayControl extends BaseControl {
    constructor(paper, x, y, height=32) {
        super(paper, x, y);
        this.height = height;

        this.buttonLayer = this._layer.g();

        this.buttonLayer.transform("s"+height/32);

        this.play = makeButton(0, 0, this.buttonLayer, "PlayButton", "play-control", "play");
        this.pause = makeButton(32, 0, this.buttonLayer, "PauseButton", "play-control", "pause");
        this.stop = makeButton(32*2, 0, this.buttonLayer, "StopButton", "play-control", "stop");

        this.picker = new Picker({
            el: this.buttonLayer.node,
            children: ".play-control",
            class: "active"
        });

        function bc (btn, which) {
            btn.click(() => {
                radio(which+"-clicked").broadcast();
            });
        }

        bc(this.play, "play");
        bc(this.pause, "pause");
        bc(this.stop, "stop");
    }

    get width() {
        return this.height * 3;
    }
};


function makeButton(x, y, layer,  image, mainClass="", subClass="", margin=1, r=2) {
    let button = layer.g(graphics.getGraphic(image));
    button.addClass(mainClass).addClass(subClass);

    let bg = button.rect(margin, margin, 32-2*margin, 32-2*margin, r, r).prependTo(button);
    bg.attr({fill: "gray"}).addClass("bg");

    button.transform("T"+x+","+y);

    return button;
}
