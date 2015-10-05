/**
 * User interaction classes
 */

import editor from "editor";
import graphics from "graphics";
import codeCell from "codeCell";
import {toTransformString} from "view";

export class Palette {

    constructor(paper, x, y, max_width, columns, margin) {
        this.paper = paper;
        this.x = x;
        this.y = y;
        this.columns = columns > 0 ? columns : 1; // negative columns?
        this.columnWidth = 56;
        this.tiles = paper.g();
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

        this.tiles.transform(Snap.matrix().translate(x, y));
        this.drawPalette();

        this._events = {
            hotKey: (data) => this.hotKey(data)
        };

        editor.registerEvents(this._events);
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

    show(shouldShow) {
        shouldShow = shouldShow !== undefined ? shouldShow : true;
        this.tiles.attr({
            opacity: shouldShow ? 1 : 0
        });
    }

    getScale() {
        if (this.baseWidth <= this.maxWidth)
            return 1.0; // no scaling required
        else
            return this.maxWidth / this.baseWidth;
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
                fontFamily: "monospace",
                fontSize: 10,
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

export class TileControl {
    constructor(paper, x, y, width, height) {
        this.paper = paper;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.currentTile = null;
        this.currentOrientation = "UP";
        this.mirror = false;

        this.cycleOrientation = editor.cycleGenerator();

        this._layer = paper.g();
        this.layer = this._layer.g();
        this.tileLayer = this.layer.g();

        this._layer.transform("T"+x+","+y);
        this.calculateScale();

        this.currentTile = "Conveyor";
        this.drawTile();
        // this._makeButton(32,0,0);
        // this._makeButton(32,20+56,180);
        // this._makeButton(,,90);
        // this._makeButton(32+56,20,270);
        let down = this._makeButton(32, 0, 0),
            right = this._makeButton(20+56, 32, 90),
            up = this._makeButton(32, 20+56, 180),
            left = this._makeButton(0, 32, 270);

        function bt(el, dir) {
            el.click(() => editor.trigger(editor.events.setDirection, {dir: dir}));
        }

        bt(up, "UP"); bt(right, "RIGHT"); bt(down, "DOWN"); bt(left, "LEFT");

        this._events = {
            tileSelected: (data) => this.onTileSelected(data.tile),
            // cellSelected: (data) => this.onCellSelected(data),
            rotate: (data) => this.onRotate(),
            mirror: (data) => this.onMirror(data),
            setDirection: (data) => this.onSetDirection(data.dir)
            // delete: (data) => this.onDelete(data)
        };

        editor.registerEvents(this._events);
    }

    _makeButton(x, y, angle=0) {
        let button = this.layer.g();

        let rect = button.rect(1,1,30,18, 2, 2).attr({fill: "gray"});
        rect.addClass("tile-control-button-bg");

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

    orientTile() {
        if (this.currentGraphic) {
            let oName = this.currentOrientation,

                o = editor.orientationByName(oName, this.mirror),

                rotate = toTransformString(
                    Snap.matrix(o.a, o.b, o.c, o.d, 0, 0)
                );

            this.currentGraphic.transform(rotate + "T20,20");
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
};
