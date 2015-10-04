/**
 * User interaction classes
 */

import editor from "editor";
import graphics from "graphics";
import codeCell from "codeCell";

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
