
var view = view || {},
    core = core || {},
    graphics = graphics || {};

(function (core, graphics) {

    function TapeView(paper, x, y, width, height, tape) {
        this.paper = paper;
        this.tapeView = paper.g();
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.tape = tape;

        this._sw = 20; // Parameterize this later
        this._MAX = Math.floor((this.width - this._sw) / this._sw);

        // Register for tape's changed signal
        this.tape.changed.add(this.animate.bind(this));
    };

    /**
     Performs a clean draw of the tape with no animation
     */
    TapeView.prototype.drawTape = function drawTape() {
        var MAX = this._MAX,
            sw = this._sw;

        this.tapeView.clear();

        for (var i = 0; i < this.tape.symbols.length && i < MAX; ++i) {
            var curSym = this.tape.symbols[i];
            this._appendSymbol(curSym);
        }

        this.tapeView.transform("");
        this.tapeView.transform("t" + this.x + "," + this.y);
    };

    TapeView.prototype._appendSymbol = function(symbol, offset, color) {
        offset = offset || 0;

        var sw = this._sw,
            length = this.tapeView.selectAll("*").length;

        var circle = this.tapeView.circle(sw*(length + offset) + sw/2, sw/2, sw/2 - 2);

        if (symbol === core.EMPTY) {
            circle.attr({
                stroke: "#111",
                strokeWidth: 2,
                fill: "#FFF"
            });
        } else {
            if (color) {
                circle.attr({
                    fill: "#FFF"
                });
            } else {
                circle.attr({
                    fill: colorForSymbol(symbol)
                });
            }
        }

        return circle;
    };

    TapeView.prototype.animate = function animate(action) {

        var pop = function(head, callback) {
            head.animate(
                {opacity: 0},
                100,
                mina.linear,
                function() {
                    head.remove();
                    if (callback)
                        callback();
                }
            );
        };

        var slide = (function() {
            var sw = this._sw,
                length = this.tapeView.selectAll("*").length;

            // Append symbol if necessary
            if (length < this._MAX && this.tape.symbols.length > length) {
                var c = this._appendSymbol(this.tape.symbols[length - 1], 1);
                c.attr({opacity: 0});
            }

            // Slide left
            this.tapeView.selectAll("*").animate(
                {
                    cx: "-=" + sw,
                    opacity: 1
                },
                200,
                mina.easeinout
            );

        }).bind(this);

        if (action == "pop") {
            // Dissolve first element, then slide left
            var head = this.tapeView.selectAll("*")[0];
            pop(head, slide);

        } else if (action == "append") {
            // Append symbol if it will fit
            var length = this.tapeView.selectAll("*").length;
            if (length < this._MAX && this.tape.symbols.length > length) {
                var c = this._appendSymbol(this.tape.symbols[length], 0);
                c.attr({opacity: 0});
                c.animate(
                    {
                        opacity: 1
                    },
                    50,
                    mina.easeinout
                );
            }
        }
    };

    view.TapeView = TapeView;

    function colorForSymbol(symbol) {
        if (symbol === core.RED) {
            return "#E10";
        } else if (symbol === core.BLUE) {
            return "#01F";
        } else if (symbol === core.GREEN) {
            return "#0F0";
        } else if (symbol === core.YELLOW) {
            return "#FF0";
        } else {
            return "FA3";
        }
    }

    view.colorForSymbol = colorForSymbol;

    /**
     GridView

     Draws a grid on the canvas
     */
    function GridView(paper, x, y, width, height, rows, cols) {
        this.paper = paper;
        this.grid = paper.g();
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.cols = cols;
        this.rows = rows;

        this.grid.click(this.onClick.bind(this));
    };

    GridView.prototype.onClick = function onClick(evt, x, y) {
        var cell = this.screenPointToCell(x, y);

        if (cell.x >= 0 && cell.x < this.cols &&
            cell.y >= 0 && cell.y < this.rows) {
            editor.trigger(editor.events.cellSelected, {cell: cell});
        }
    };

    GridView.prototype.remove = function remove() {
        this.grid.remove();
    };

    GridView.prototype.drawGrid = function drawGrid() {
        this.grid.clear();

        var r = this.paper.rect(0,0, this.width, this.height);
        r.attr({fill: "#FFF"});
        r.addClass("grid-bg");
        this.grid.append(r);

        var sw = this.width / this.cols;
        var sy = this.height / this.rows;

        for (var x = 0; x <= this.cols; ++x) {
            var l = this.paper.line(x*sw, 0, x*sw, this.height);
            this.grid.append(l);
        }

        for (var y = 0; y <= this.rows; ++y) {
            var l = this.paper.line(0, y*sy, this.width, y*sy);
            this.grid.append(l);
        }

        this.grid.attr({stroke: "#888", strokeWidth: 1});

        this.grid.transform("");
        this.grid.transform("t1,1t" + this.x + "," + this.y);
    };

    /**
     GridView.getCellMatrix(col, row, corner) -> Matrix

     Returns local matrix describing location of cell

     If corner == true, uses top left corner of cell

     Otherwise, uses center of cell

     */
    GridView.prototype.getCellMatrix = function getCellMatrix(col, row, corner) {
        var mat = Snap.matrix(),
            sw = this.width / this.cols,
            sy = this.height / this.rows;

        if (!corner) {
            mat.translate(sw / 2, sy / 2);
        }
        mat.translate(sw * col, sy * row);

        return mat;
    };

    /**
     GridView.getGlobalCellMatrix(col, row, corner) -> Matrix

     Returns global matrix describing location of cell

     If corner == true, uses top left corner of cell

     Otherwise, uses center of cell

     */
    GridView.prototype.getGlobalCellMatrix = function getGlobalCellMatrix(col, row, corner) {

        var transform = this.grid.transform();
        var globalMatrix = transform.globalMatrix.clone();

        var sw = this.width / this.cols;
        var sy = this.height / this.rows;

        if (!corner) {
            globalMatrix.translate(sw / 2, sy / 2);
        }

        globalMatrix.translate(sw * col, sy * row);

        return globalMatrix;
    };


    GridView.prototype.screenPointToCell = function screenPointToCell(x, y) {
        var localPoint = graphics.screenPointToLocal(x, y, this.grid),
            sw = this.width / this.cols,
            sy = this.height / this.rows,
            index_x = Math.floor(localPoint.x / sw),
            index_y = Math.floor(localPoint.y / sy);

        console.log("I think you want " + index_x + ", " + index_y);

        return {x: index_x, y: index_y};
    };

    view.GridView = GridView;


    function ProgramView(paper, x, y, tileSize, program) {
        this.paper = paper;
        this.program = program;
        this.tileSize = tileSize;
        this.cells = paper.g().addClass("cells");
        this.x = x;
        this.y = y;
        this.gridView = new GridView(paper, x, y,
                                     program.cols*tileSize,
                                     program.rows*tileSize,
                                     program.rows, program.cols);

        this.gridView.drawGrid();

        var binding = this.program.changed.add(this.drawProgram);
        binding.context = this;
    }

    ProgramView.prototype.setProgram = function setProgram(p) {
        if (this.program)
            this.program.changed.remove(this.drawProgram);

        this.program = p;
        this.gridView.remove();
        this.gridView = new GridView(this.paper, this.x, this.y,
                                     p.cols*this.tileSize,
                                     p.rows*this.tileSize,
                                     p.rows, p.cols);
        this.gridView.drawGrid();
        this.cells.clear();
    };

    ProgramView.prototype.drawProgram = function drawProgram() {
        var paper = this.paper,
            grid = this.gridView,
            program = this.program;

        this.cells.clear();
        this.cells.appendTo(this.gridView.grid);

        for (var x = 0; x < program.cols; ++x) {
            for (var y = 0; y < program.rows; ++y) {
                var c = program.getCell(x, y);

                if (c.type != "Empty") {
                    var container;
                    if (c.type == "Conveyor") {
                        container = this.drawConveyor(c, x, y);
                    } else {

                        var image = graphics.getGraphic(c.type);

                        if (image) {

                            paper.append(image);

                            var group = paper.g(image);
                            this.cells.append(group);

                            var corner = grid.getCellMatrix(x, y, true)
                                    .toTransformString()
                                    .toUpperCase();

                            var o = c.orientation;

                            var transform = Snap.matrix(o.a, o.b, o.c, o.d, 0, 0);
                            var tstring = view.toTransformString(transform);



                            group.transform(
                                tstring + corner
                            );

                            container = group;
                        }
                    }
                    if (container) {
                        container.selectAll("*").forEach((el) => {
                            el.data("tileInfo", {
                                cell: c,
                                x: x,
                                y: y,
                                program: this.program
                            }).addClass("tile-part");
                        });

                    }
                }
            }
        }
    };

    ProgramView.prototype.drawConveyor = function drawConveyor(cell, x, y) {
        var neighbors = getNeighbors(this.program, cell, x, y),

            target = {cell: cell, position: new tmath.Vec2(x, y)},

            hasLeft = neighbors.left.cell != null ? isPointingTo(neighbors.left, target) : false,

            hasRight = neighbors.right.cell != null ? isPointingTo(neighbors.right, target) : false,

            hasDown = neighbors.down.cell != null ? isPointingTo(neighbors.down, target) : false,

            image = null,

            mirror = false;

        if (!hasLeft && !hasRight) {

            image = "Conveyor";

        } else if (!hasLeft && hasRight ||
                   hasLeft && !hasRight) {

            image = hasDown ? "ConveyorTeeTwo" : "ConveyorElbow";

            mirror = hasLeft;

        } else if (!hasDown && hasLeft && hasRight) {

            image = "ConveyorTee";

        } else {

            image = "ConveyorEx";

        }

        image = graphics.getGraphic(image);

        if (image) {

            this.paper.append(image);

            var group = this.paper.g(image);
            this.cells.append(group);

            var corner = this.gridView.getCellMatrix(x, y, true)
                    .toTransformString()
                    .toUpperCase();

            var o = cell.orientation;

            if (mirror) {
                o = tmath.Mat2x2.kMIR.compose(o);
            }

            var transform = Snap.matrix(o.a, o.b, o.c, o.d, 0, 0);
            var tstring = view.toTransformString(transform);

            group.transform(
                tstring + corner
            );

            return group;
        }

        return null;

    };

    function getNeighbors(prog, cell, x, y) {
        var o = cell.orientation,
            position = new tmath.Vec2(x, y),
            down = cellToGlobal(program.directions.DOWN, o).add(position),
            left = cellToGlobal(program.directions.LEFT, o).add(position),
            right = cellToGlobal(program.directions.RIGHT, o).add(position),
            neighbors = {
                down: {cell: null, position: null},
                left: {cell: null, position: null},
                right:{cell: null, position: null}
            };

        function safeGetCell(prog, pos) {
            try {
                var cell = prog.getCell(pos.x, pos.y);
                if (cell)
                    return cell;
                else
                    return {type: "Empty"};
            } catch (e) {
                return {type: "Empty"};
            }
        }
        // Now we have vectors that point to our down, left, and right neighbors

        var downNeighbor = safeGetCell(prog, down);
        if (downNeighbor.type != "Empty") {
            neighbors.down.cell = downNeighbor;
            neighbors.down.position = down;
        }

        var leftNeighbor = safeGetCell(prog, left);
        if (leftNeighbor.type != "Empty") {
            neighbors.left.cell = leftNeighbor;
            neighbors.left.position = left;
        }

        var rightNeighbor = safeGetCell(prog, right);
        if (rightNeighbor.type != "Empty") {
            neighbors.right.cell = rightNeighbor;
            neighbors.right.position = right;
        }

        return neighbors;
    }

    function isPointingTo(source, target) {
        var direction = cellToGlobal(program.directions.UP, source.cell.orientation),
            pointedTo = source.position.add(direction),
            same = pointedTo.equals(target.position),
            isBranch = source.cell.type.indexOf("Branch") != -1;

        if (!same && (source.cell.type == "CrossConveyor" ||
                      isBranch)  ) {
            // Additional test for crossconveyor
            direction = cellToGlobal(program.directions.RIGHT, source.cell.orientation);
            pointedTo = source.position.add(direction);
            same = pointedTo.equals(target.position);

            if (!same && isBranch) {
                direction = cellToGlobal(program.directions.LEFT, source.cell.orientation);
                pointedTo = source.position.add(direction);
                same = pointedTo.equals(target.position);
            }
        }

        return same;

    }

    function cellToGlobal(d, orientation) {
        return orientation.invert().apply(d);
    }

    view.ProgramView = ProgramView;



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

    view.Palette = Palette;



    /**
     Utility function that converts a Snap.Matrix to a Snap transform string
     */
    view.toTransformString = function (matrix) {
        var E = "";
        var s = matrix.split();
        if (!+s.shear.toFixed(9)) {
            s.scalex = +s.scalex.toFixed(4);
            s.scaley = +s.scaley.toFixed(4);
            s.rotate = +s.rotate.toFixed(4);
            return  (s.dx || s.dy ? "t" + [+s.dx.toFixed(4), +s.dy.toFixed(4)] : E) +
                (s.scalex != 1 || s.scaley != 1 ? "s" + [s.scalex, s.scaley] : E) +
                (s.rotate ? "r" + [s.scalex*s.scaley < 0 ? 360 - s.rotate.toFixed(4) : +s.rotate.toFixed(4)] : E);

            // This is the same as what Snap.svg does by default with two major differences (original is in matrix.js)
            //
            // 1. No ",0,0" is appended to the rotate and scale strings, so they will now default to the center of the element
            //
            // 2. The complicated one: If we have been mirrored in either x or y but not both (i.e., either scalex or scaley is
            //    negative, but not both (just test if their product is negative)), our interpretation of "rotate" changes.
            //    in particular, in the mirrored case, rotate needs to be interpreted as going "backward" or "clockwise". So,
            //    to get the actual correct rotation in this case, we subtract it from 360. Whether or not the original behavior is
            //    actually incorrect on the part of Snap needs more study.

        } else {
            return "m" + [matrix.get(0), matrix.get(1), matrix.get(2), matrix.get(3), matrix.get(4), matrix.get(5)];
        }
    };

})(core, graphics);
