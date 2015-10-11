System.register("app", ["program", "interpreter", "graphics", "view", "tmath", "loader", "editor", "core", "gui"], function (_export) {
    "use strict";

    var program, interpreter, graphics, view, tmath, loader, editor, core, Palette, TileControl, PlayControl, MARGIN, PROGRAM_WIDTH, PROGRAM_HEIGHT, CONTROL_X, App;

    var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function setViewbox(svgel, x, y, width, height) {
        svgel.setAttribute('viewBox', [x, y, width, height].join(','));
    }
    function tapesAreEqual(t1, t2) {
        return loader.tapeToJson(t1) == loader.tapeToJson(t2);
    }
    return {
        setters: [function (_program) {
            program = _program["default"];
        }, function (_interpreter) {
            interpreter = _interpreter["default"];
        }, function (_graphics) {
            graphics = _graphics["default"];
        }, function (_view) {
            view = _view;
        }, function (_tmath) {
            tmath = _tmath["default"];
        }, function (_loader) {
            loader = _loader["default"];
        }, function (_editor) {
            editor = _editor["default"];
        }, function (_core) {
            core = _core["default"];
        }, function (_gui) {
            Palette = _gui.Palette;
            TileControl = _gui.TileControl;
            PlayControl = _gui.PlayControl;
        }],
        execute: function () {
            MARGIN = 10;
            PROGRAM_WIDTH = 56 * 9;
            PROGRAM_HEIGHT = PROGRAM_WIDTH;
            CONTROL_X = MARGIN + PROGRAM_WIDTH + MARGIN;

            App = (function () {
                function App(width, height) {
                    var _this = this;

                    _classCallCheck(this, App);

                    this.program = null;
                    this.programView = null;
                    this.interpreter = null;
                    this.stepTime = 500; // default ms between steps
                    this.testCases = [];
                    this.currentTest = {
                        test: null,
                        index: 0
                    };
                    this.canvasSize = {
                        width: width,
                        height: height
                    };
                    var linkForm = $('#link-form');
                    linkForm.find('button').click(this.generateLink.bind(this));
                    linkForm.find('input').val('');
                    var loadForm = $('#load-form');
                    loadForm.find('button').click(this.loadLevel.bind(this));
                    this.controlsEl = $('#controls');
                    var stopButton = this.controlsEl.find('[data-action=stop]'),
                        pauseButton = this.controlsEl.find('[data-action=pause]'),
                        playButton = this.controlsEl.find('[data-action=run]');
                    stopButton.prop('disabled', true);
                    pauseButton.prop('disabled', true);
                    playButton.prop('disabled', false);

                    playButton.click(function () {
                        radio("play-clicked").broadcast();
                    });

                    pauseButton.click(function () {
                        radio("pause-clicked").broadcast();
                    });

                    stopButton.click(function () {
                        radio("stop-clicked").broadcast();
                    });

                    radio("play-clicked").subscribe(function () {
                        if (!_this.isRunning) {
                            _this.editor.disable();
                            _this.start();
                            stopButton.prop('disabled', false);
                            pauseButton.prop('disabled', false);
                            playButton.prop('disabled', true);
                        } else if (_this.isRunning && _this.isPaused) {
                            _this.editor.disable();
                            _this.pause(false); // or unpause
                            stopButton.prop('disabled', false);
                            pauseButton.prop('disabled', false);
                            playButton.prop('disabled', true);
                        }
                    });

                    radio("pause-clicked").subscribe(function () {
                        if (_this.isRunning) {
                            _this.pause(true);
                            stopButton.prop('disabled', false);
                            pauseButton.prop('disabled', true);
                            playButton.prop('disabled', false);
                        }
                    });

                    radio("stop-clicked").subscribe(function () {
                        _this.stop();
                        _this.editor.enable();
                        stopButton.prop('disabled', true);
                        pauseButton.prop('disabled', true);
                        playButton.prop('disabled', false);
                    });

                    var hash = window.location.hash;

                    if (hash) {
                        hash = decodeURI(hash.replace('#', '')).trim();
                        if (hash.startsWith('lvl')) {
                            this.program = program.readLegacyProgramString(hash);
                        } else {
                            var level = loader.fromJson(hash);
                            if (level) {
                                this.program = level.program;
                                this.testCases = level.testCases;
                            } else {
                                // Error case
                                console.log('Unable to load program string');
                            }
                        }
                    }
                }

                _createClass(App, [{
                    key: "loadLevel",
                    value: function loadLevel() {
                        var loadForm = $('#load-form'),
                            levelString = loadForm.find('input').val().trim(),
                            newProgram = null;
                        if (levelString.startsWith('lvl')) {
                            newProgram = program.readLegacyProgramString(levelString);
                        } else {
                            var level = loader.fromJson(levelString);
                            if (level) {
                                newProgram = level.program;
                                this.testCases = level.testCases;
                            } else {
                                // Error case
                                console.log('Unable to load program string');
                            }
                        }
                        if (newProgram) {
                            this.program = newProgram;
                            this.programView.setProgram(newProgram);
                            this.programView.drawProgram();
                        }
                    }
                }, {
                    key: "generateLink",
                    value: function generateLink() {
                        if (this.program != null && this.testCases != null) {
                            var link = window.location.href.split('#')[0] + "#";
                            link += loader.toJson('Sample', this.testCases, this.program);
                            $('#link-form').find('input').val(decodeURI(link));
                        }
                    }
                }, {
                    key: "main",
                    value: function main() {
                        var paper = Snap(document.getElementById('main-svg'));

                        setViewbox(paper.node, 0, 0, this.canvasSize.width, this.canvasSize.height);

                        var bounds = paper.node.viewBox.baseVal;
                        paper.rect(bounds.x, bounds.y, bounds.width, bounds.height).addClass('game-bg');
                        this.paper = paper;
                        this.scratch = paper.g();
                        // Set up UI elements
                        graphics.preload(paper).then((function () {

                            var programLayer = paper.g().addClass('program-layer');
                            //paper.appendTo(document.getElementById("main"));

                            var CONTROL_WIDTH = this.canvasSize.width - CONTROL_X;

                            if (this.program == null) {
                                this.program = new program.Program(9, 9);
                                // fill in start and end with defaults
                                this.program.setStart(4, 0);
                                this.program.setEnd(4, 8);
                            }

                            this.programView = new view.ProgramView(programLayer, MARGIN, MARGIN, this.program, 56 * 9, 56 * 9);

                            this.palette = new Palette(paper, CONTROL_X + CONTROL_WIDTH / 8, this.canvasSize.height / 2, CONTROL_WIDTH * 3 / 4, 4);

                            this.tileControl = new TileControl(paper, CONTROL_X + 40, // x
                            MARGIN, // y
                            CONTROL_WIDTH / 2 - MARGIN / 2, // width
                            0 // height
                            );

                            this.playButton = new PlayControl(paper, CONTROL_X, this.canvasSize.height - 68 - MARGIN, 68);

                            this.playButton.x = CONTROL_X + CONTROL_WIDTH / 2 - this.playButton.width / 2;

                            this.editor = new editor.Editor(paper, this.programView, this.tileControl);

                            this.programView.drawProgram();

                            editor.init();

                            this.editor.enable();
                        }).bind(this));
                    }
                }, {
                    key: "drawToken",
                    value: function drawToken(mat, animate, callback) {
                        if (!this.token) {
                            this.token = this.paper.circle(0, 0, 10);
                        }
                        this.paper.append(this.token);
                        // make sure token is on top
                        var head = this.tapeView.tape.head(),
                            fill = undefined;
                        if (head && head.symbol != 'empty') {
                            fill = view.colorForSymbol(head);
                        } else {
                            fill = '#E0E';
                        }
                        this.token.animate({ fill: fill }, this.stepTime / 2);
                        if (!animate) {
                            this.token.transform(mat);
                        } else {
                            this.token.animate({ transform: mat }, this.stepTime, mina.linear, function () {
                                //field.drawTape();
                                if (callback) callback();
                            });
                        }
                    }
                }, {
                    key: "start",
                    value: function start() {
                        this.isRunning = true;
                        this.isPaused = false;
                        this.interpreter = new interpreter.Interpreter();
                        // Special case for empty testCases
                        if (this.testCases.length === 0) {
                            this.testCases.push({
                                accept: true,
                                input: new core.Tape(),
                                output: new core.Tape(),
                                limit: 0
                            });
                        }

                        this.currentTest.test = this.testCases[this.currentTest.index];

                        var currentTape = core.Tape.clone(this.currentTest.test.input),
                            CONTROL_WIDTH = this.canvasSize.width - CONTROL_X;

                        if (this.tapeView) this.tapeView.remove();
                        this.tapeView = new view.TapeView(this.paper, CONTROL_X, MARGIN, CONTROL_WIDTH - 10, (CONTROL_WIDTH - 10) / 10, currentTape, Math.floor((this.canvasSize.height / 2 - MARGIN) / ((CONTROL_WIDTH - 10) / 10)));
                        // 3 rows
                        // hide Palette
                        this.palette.show(false);
                        this.tapeView.drawTape();
                        this.interpreter.setProgram(this.program);
                        this.interpreter.setTape(currentTape);
                        this.interpreter.start();
                        this.update();
                    }
                }, {
                    key: "stop",
                    value: function stop() {
                        this.isRunning = false;
                        this.isPaused = false;
                        this.token && this.token.remove();
                        this.tapeView && this.tapeView.remove();
                        this.currentTest.index = 0;
                        this.palette.show();
                    }
                }, {
                    key: "pause",
                    value: function pause(shouldPause) {
                        this.isPaused = shouldPause;
                    }

                    // Governor for state when game is running
                    // Responsibilities are:
                    // Determine if test case has been passed or failed
                    // Call run
                }, {
                    key: "update",
                    value: function update() {
                        var _this2 = this;

                        var test = this.currentTest.test,
                            int = this.interpreter;
                        if (this.isRunning) {
                            if (!int.running) {
                                // Interpreter has stopped
                                var finishedProperly = int.accept == test.accept,
                                    correctOuput = test.output.symbols.length > 0 ? tapesAreEqual(int.tape, test.output) : // compare if output not empty
                                true;
                                // otherwise ignore final tape
                                console.log('Test finished.');
                                console.log(finishedProperly && correctOuput ? 'Passed' : 'Failed');
                                if (finishedProperly && correctOuput) {
                                    if (this.currentTest.index < this.testCases.length - 1) {
                                        this.currentTest.index++;
                                        window.setTimeout(function () {
                                            return _this2.start();
                                        });
                                    }
                                }
                                this.isRunning = false;
                            } else {
                                // check for cycle limit
                                this._step();
                            }
                        }
                    }
                }, {
                    key: "run",
                    value: function run() {
                        // If we aren't running, set everything up and start the loop
                        if (this.isRunning) {
                            // We're running. See if the interpreter has stopped
                            if (this.interpreter.running) {
                                this._step();
                            } else {
                                console.log('Program stopped.');
                                console.log("Accepted: " + this.interpreter.accept);
                                this.isRunning = false;
                            }
                        }
                    }

                    // Calls interpreter's step and manages animation
                }, {
                    key: "_step",
                    value: function _step() {

                        if (!this.isPaused) {

                            var oldPos = this.interpreter.position,
                                corner = this.exchange(this.programView.gridView.getGlobalCellMatrix(oldPos.x, oldPos.y, false));

                            this.drawToken(corner);
                            this.interpreter.step();

                            var curPos = this.interpreter.position,
                                curCorner = this.exchange(this.programView.gridView.getGlobalCellMatrix(curPos.x, curPos.y, false));

                            this.drawToken(curCorner, true, this.update.bind(this));
                        } else {
                            requestAnimationFrame(this.update.bind(this));
                        }
                    }

                    /**
                     Convert one coordinate system to another.
                     Converts from system with global matrix g to system with global matrix l
                      */
                }, {
                    key: "exchange",
                    value: function exchange(g) {
                        return this.scratch.transform().globalMatrix.invert().add(g);
                    }
                }]);

                return App;
            })();

            _export("default", App);

            /*
             Example hash level:
             #{"title":"Sample","tape":["BYRGGYRYRGRRGBYRGYRYRGYRGBRYRRBRBGBBYRBYRBGBRBYRRYRYRGBGGBGRYRRGRRYRYRRYRBRRBYRGGRBYRBRBYRRYRGRRGGRRRGYRBYRRRRRRBYRBBGBBRG"],"program":{"cols":9,"rows":9,"cells":[{"x":2,"y":1,"orientation":"ROT3","type":"Conveyor"},{"x":2,"y":2,"orientation":"ROT3","type":"BranchBR"},{"x":2,"y":3,"orientation":"ROT3","type":"BranchBR"},{"x":2,"y":4,"orientation":"ROT3","type":"BranchGY"},{"x":2,"y":5,"orientation":"ROT3","type":"BranchGY"},{"x":3,"y":1,"orientation":"ROT2","type":"Conveyor"},{"x":3,"y":2,"orientation":"ROT2","type":"BranchBR"},{"x":3,"y":3,"orientation":"ROT2","type":"BranchBR"},{"x":3,"y":4,"orientation":"ROT2","type":"BranchGY"},{"x":3,"y":5,"orientation":"ROT2","type":"BranchGY"},{"x":4,"y":1,"orientation":"ROT1","type":"Conveyor"},{"x":4,"y":2,"orientation":"ROT1","type":"BranchBR"},{"x":4,"y":3,"orientation":"ROT1","type":"BranchBR"},{"x":4,"y":4,"orientation":"ROT1","type":"BranchGY"},{"x":4,"y":5,"orientation":"ROT1","type":"BranchGY"},{"x":5,"y":1,"orientation":"ID","type":"Conveyor"},{"x":5,"y":2,"orientation":"MIR","type":"BranchBR"},{"x":5,"y":3,"orientation":"ID","type":"BranchBR"},{"x":5,"y":4,"orientation":"MIR","type":"BranchGY"},{"x":5,"y":5,"orientation":"ID","type":"BranchGY"}],"start":{"x":4,"y":0,"orientation":"ID"},"end":{"x":4,"y":8,"orientation":"ID"}}}
             */
        }
    };
});
// Space between elements
// program view width, not to exceed
System.register("codeCell", ["program", "core"], function (_export) {
    "use strict";

    var program, core, codeCell, codeCells;
    return {
        setters: [function (_program) {
            program = _program["default"];
        }, function (_core) {
            core = _core["default"];
        }],
        execute: function () {
            codeCell = codeCell || {};

            _export("default", codeCell);

            codeCells = {

                /**
                 Conveyor
                  Moves execution UP to the next cell
                 Makes no changes to the tape
                 */
                Conveyor: function Conveyor(head) {
                    return [false, null, program.directions.UP];
                },

                /**
                 CrossConveyor
                  Moves execution UP if the previous facing was UP or DOWN
                 Moves execution RIGHT if the previous facing was RIGHT or LEFT
                 Makes no changes to the tape
                 (This cell, like conveyor, will handle orientation implicitly by letting the default orientation be ^>)
                 */
                CrossConveyor: function CrossConveyor(head, previousFacing) {
                    if (previousFacing.equals(program.directions.UP) || previousFacing.equals(program.directions.DOWN)) {
                        return [false, null, program.directions.UP];
                    } else if (previousFacing.equals(program.directions.LEFT) || previousFacing.equals(program.directions.RIGHT)) {
                        return [false, null, program.directions.RIGHT];
                    }
                },

                /**
                 BranchBR
                  If head is RED, pop tape and move LEFT
                 If head is BLUE, pop tape and move RIGHT
                 Otherwise, don't pop and move UP
                 */
                BranchBR: function BranchBR(head) {
                    if (head === core.RED) {
                        return [true, null, program.directions.LEFT];
                    }

                    if (head === core.BLUE) {
                        return [true, null, program.directions.RIGHT];
                    }

                    return [false, null, program.directions.UP];
                },

                /**
                 BranchGY
                  If head is GREEN, pop tape and move LEFT
                 If head is YELLOW, pop tape and move RIGHT
                 Otherwise, don't pop and move UP
                 */
                BranchGY: function BranchGY(head) {
                    if (head === core.GREEN) {
                        return [true, null, program.directions.LEFT];
                    }

                    if (head === core.YELLOW) {
                        return [true, null, program.directions.RIGHT];
                    }

                    return [false, null, program.directions.UP];
                },

                /**
                 Writers
                 Append <color>
                 Move UP
                 */
                WriteB: function WriteB(head) {
                    return [false, core.BLUE, program.directions.UP];
                },

                WriteR: function WriteR(head) {
                    return [false, core.RED, program.directions.UP];
                },

                WriteG: function WriteG(head) {
                    return [false, core.GREEN, program.directions.UP];
                },

                WriteY: function WriteY(head) {
                    return [false, core.YELLOW, program.directions.UP];
                }

            };

            codeCell.codeCells = codeCells;
        }
    };
});
System.register('copyTask', [], function (_export) {
  'use strict';

  var gulp, newer;
  return {
    setters: [],
    execute: function () {
      gulp = require('gulp');
      newer = require('gulp-newer');

      /**
       * Builds a function that makes it easy to create gulp copy tasks
       * @param  {Array<string>} defaultTasks Array into which to push tasks that are created by this fn
       * @param  {Map<string,string>} paths object literal or map that maps names to paths
       * @param  {String} defaultDest  The glob path that is the default destination when one is not provided
       * @return {fn(name,dest)}              A function taking the task name and an optional destination that
       *                                      creates copy tasks
       */
      module.exports = function (defaultTasks, paths, defaultDest) {
        if (!Array.isArray(defaultTasks)) {
          throw new Error('defaultTasks needs to be an array');
        }
        if (paths === undefined) {
          throw new Error('paths should be object literal to look names up in and find input paths');
        }
        if (defaultDest === undefined) {
          throw new Error('defaultDest should be a string output path to be used by default when not ' + 'specified or available in the paths map');
        }
        return function copyTask(name, dest) {
          if (dest === undefined) {
            if (paths.hasOwnProperty(name + 'Out')) {
              dest = paths[name + 'Out'];
            } else {
              dest = defaultDest;
            }
          }
          gulp.task(name, function () {
            return gulp.src(paths[name]).pipe(newer(dest)).pipe(gulp.dest(dest));
          });
          defaultTasks.push(name);
        };
      };
    }
  };
});
System.register('core', ['signals.js'], function (_export) {

    /* Symbols */
    'use strict';

    var signals, core, Tape;

    var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

    return {
        setters: [function (_signalsJs) {
            signals = _signalsJs['default'];
        }],
        execute: function () {
            core = core || {};

            _export('default', core);

            core.EMPTY = { symbol: 'empty' };
            core.RED = { symbol: 'red' };
            core.BLUE = { symbol: 'blue' };
            core.GREEN = { symbol: 'green' };
            core.YELLOW = { symbol: 'yellow' };

            core.symbols = {
                R: core.RED,
                B: core.BLUE,
                G: core.GREEN,
                Y: core.YELLOW
            };

            /* Tape
             Represents an ordered queue of symbols
             */

            Tape = (function () {
                function Tape() {
                    _classCallCheck(this, Tape);

                    this.symbols = [];
                    this.changed = new signals.Signal();
                }

                _createClass(Tape, [{
                    key: 'head',
                    value: function head() {
                        if (this.symbols.length > 0) {
                            return this.symbols[0];
                        } else {
                            return core.EMPTY;
                        }
                    }
                }, {
                    key: 'pop',
                    value: function pop() {
                        if (this.symbols.length > 0) {
                            var popped = this.symbols.shift();
                            this.changed.dispatch("pop");
                            return popped;
                        } else {
                            return core.EMPTY;
                        }
                    }
                }, {
                    key: 'append',
                    value: function append(s) {
                        this.symbols.push(s);
                        this.changed.dispatch("append");
                    }
                }], [{
                    key: 'clone',
                    value: function clone(otherTape) {
                        var newTape = new Tape();
                        newTape.symbols = otherTape.symbols.slice(0);
                        return newTape;
                    }
                }]);

                return Tape;
            })();

            _export('Tape', Tape);

            ;

            core.Tape = Tape;
        }
    };
});
System.register("editor", ["program", "graphics", "view", "tmath"], function (_export) {
    /*global radio */

    "use strict";

    var program, graphics, view, tmath, editor, startEditor, mousePosition, IDLE, PLACING, INPLACE, cycleOrientation, Editor;

    var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function registerEvents(evts) {
        Object.keys(evts).forEach(function (key) {
            radio(editor.events[key]).subscribe(evts[key]);
        });
    }

    function unregisterEvents(evts) {
        Object.keys(evts).forEach(function (key) {
            radio(editor.events[key]).unsubscribe(evts[key]);
        });
    }

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
                what = editor.events.mirror;
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
                what = editor.events["delete"];
                break;
        }

        if (!what) {
            what = editor.events.hotKey;
            data.key = key;
        }

        editor.trigger(what, data);
    }

    function trackMouse(evt) {
        mousePosition.x = evt.clientX;
        mousePosition.y = evt.clientY;
    }

    function cycleGenerator() {
        var os = ["UP", "RIGHT", "DOWN", "LEFT"];

        return function (current) {
            if (!current) current = "LEFT";

            var index = (os.indexOf(current) + 1) % os.length,
                oName = os[index];

            return oName;
        };
    }

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

    function isMirrored(orientation) {
        var m = tmath.Mat2x2,
            l = [m.kMIR, m.kMROT1, m.kMROT2, m.kMROT3];

        return l.some(function (mat) {
            return _.isEqual(mat, orientation);
        });
    }

    function nameFromOrientation(o) {
        var mirror = isMirrored(o),
            direction = "UP",
            m = tmath.Mat2x2;

        if (_.isEqual(o, m.kID) || _.isEqual(o, m.kMIR)) direction = "UP";
        if (_.isEqual(o, m.kROT1) || _.isEqual(o, m.kMROT1)) direction = "RIGHT";
        if (_.isEqual(o, m.kROT2) || _.isEqual(o, m.kMROT2)) direction = "DOWN";
        if (_.isEqual(o, m.kROT3) || _.isEqual(o, m.kMROT3)) direction = "LEFT";

        return { direction: direction, mirror: mirror };
    }
    return {
        setters: [function (_program) {
            program = _program["default"];
        }, function (_graphics) {
            graphics = _graphics["default"];
        }, function (_view) {
            view = _view;
        }, function (_tmath) {
            tmath = _tmath["default"];
        }],
        execute: function () {
            editor = editor || {};

            _export("default", editor);

            editor.events = {
                tileSelected: "tile-selected",
                cellSelected: "cell-selected",
                mirror: "mirror",
                rotate: "rotate",
                setDirection: "set-direction",
                "delete": "delete",
                hotKey: "hot-key"
            };

            editor.trigger = function (event, args) {
                radio(event).broadcast(args);
            };editor.registerEvents = registerEvents;editor.unregisterEvents = unregisterEvents;

            startEditor = function startEditor() {

                var paper = Snap(900, 640);

                graphics.preload(paper).then(function () {

                    var programLayer = paper.g().addClass("program-layer");

                    paper.appendTo(document.getElementById("main"));

                    var palette = new view.Palette(paper, 10, 30, 2),
                        currentProgram = new program.Program(10, 10),
                        programView = new view.ProgramView(programLayer, 10 + palette.drawWidth, 30, 56, currentProgram),
                        controller = new Editor(paper, programView);

                    programView.drawProgram();

                    document.body.addEventListener("keydown", dispatchKeyEvents);
                    document.body.addEventListener("mousemove", trackMouse);
                });
            };

            editor.init = function () {
                document.body.addEventListener("keydown", dispatchKeyEvents);
                document.body.addEventListener("mousemove", trackMouse);
            };mousePosition = {
                x: 0,
                y: 0
            };
            IDLE = Symbol("IDLE");
            PLACING = Symbol("PLACING");
            INPLACE = Symbol("INPLACE");
            ;

            editor.cycleGenerator = cycleGenerator;

            cycleOrientation = cycleGenerator();

            Editor = (function () {
                function Editor(paper, programView, tileControl) {
                    var _this = this;

                    _classCallCheck(this, Editor);

                    this.paper = paper;
                    this.programView = programView;
                    //this.tileCursor = null;
                    this.state = IDLE;
                    // this.currentTile = null;
                    // this.currentOrientation = "UP";
                    //this.mirror = false;
                    this.tileControl = tileControl;

                    this._events = {
                        tileSelected: function tileSelected(data) {
                            return _this.onTileSelected(data);
                        },
                        cellSelected: function cellSelected(data) {
                            return _this.onCellSelected(data);
                        },
                        rotate: function rotate(data) {
                            return _this.onRotateCell(data);
                        },
                        mirror: function mirror(data) {
                            return _this.onMirror(data);
                        },
                        setDirection: function setDirection(data) {
                            return _this.onSetDirection(data);
                        },
                        "delete": function _delete(data) {
                            return _this.onDelete(data);
                        }
                    };
                }

                _createClass(Editor, [{
                    key: "enable",
                    value: function enable() {
                        registerEvents(this._events);
                        this.tileControl.show(true);
                    }
                }, {
                    key: "disable",
                    value: function disable() {
                        //this.clearCursor();
                        unregisterEvents(this._events);
                        this.tileControl.show(false);
                    }
                }, {
                    key: "move",
                    value: function move(evt, x, y) {
                        if (this.state == PLACING && this.tileCursor) {

                            var mousePoint = graphics.screenPointToLocal(mousePosition.x, mousePosition.y, this.paper),
                                oName = this.currentOrientation,
                                o = orientationByName(oName, this.mirror),
                                rotate = view.toTransformString(Snap.matrix(o.a, o.b, o.c, o.d, 0, 0)),
                                translate = Snap.matrix().translate(mousePoint.x - 56 / 2, mousePoint.y - 56 / 2).toTransformString().toUpperCase();

                            this.tileCursor.transform(rotate + translate);
                        }
                    }
                }, {
                    key: "onTileSelected",
                    value: function onTileSelected(data) {

                        this.tileControl.onTileSelected(data.tile);

                        if (this.state === IDLE || this.state === PLACING) {
                            this.state = PLACING;
                        } else if (this.state === INPLACE) {
                            this.setInplace();
                        }
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
                }, {
                    key: "onCellSelected",
                    value: function onCellSelected(data) {
                        if (this.state == PLACING && this.tileControl.currentTile) {
                            // We can now place the tile

                            var curCell = this.programView.program.getCell(data.cell.x, data.cell.y);

                            if (curCell.type != "Start" && curCell.type != "End") {

                                this.programView.program.setCell(data.cell.x, data.cell.y, this.tileControl.currentTile, orientationByName(this.tileControl.currentOrientation, this.tileControl.mirror));
                            }
                        } else if (this.state == IDLE) {
                            var cellIndex = { x: data.cell.x, y: data.cell.y },
                                curCell = this.programView.program.getCell(cellIndex.x, cellIndex.y),
                                type = curCell.type;

                            if (type != "Start" && type != "End" && type != "Empty") {
                                this.state = INPLACE;

                                // Highlight selected cell
                                radio("highlighted").broadcast(cellIndex);

                                this.highlightedCell = cellIndex;

                                var cellState = nameFromOrientation(curCell);

                                this.tileControl.currentOrientation = cellState.direction;
                                this.tileControl.mirror = cellState.mirrored;

                                this.tileControl.onTileSelected(curCell.type);
                            }
                        } else if (this.state == INPLACE) {

                            if (this.highlightedCell && data && data.cell) {
                                var cellIndex = { x: data.cell.x, y: data.cell.y },
                                    curCell = this.programView.program.getCell(cellIndex.x, cellIndex.y),
                                    type = curCell.type;

                                if (type != "Start" && type != "End" && type != "Empty") {
                                    this.state = INPLACE;

                                    // Highlight selected cell
                                    radio("highlighted").broadcast(cellIndex);

                                    this.highlightedCell = cellIndex;

                                    var cellState = nameFromOrientation(curCell);

                                    this.tileControl.currentOrientation = cellState.direction;
                                    this.tileControl.mirror = cellState.mirrored;

                                    this.tileControl.onTileSelected(curCell.type);
                                } else if (type == "Empty") {
                                    this.clearHighlight();
                                    this.state = IDLE;
                                }
                            } else {
                                this.clearHighlight();
                                this.state = IDLE;
                            }
                        }
                    }
                }, {
                    key: "onRotateCell",
                    value: function onRotateCell(data) {
                        if (this.state == PLACING) {
                            this.tileControl.onRotate();
                        } else if (this.state == IDLE && data.x !== undefined && data.y !== undefined) {

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
                        } else if (this.state === INPLACE && this.tileControl.currentTile && this.highlightedCell) {
                            // Rotate highlighted cell
                            this.tileControl.onRotate();

                            this.programView.program.setCell(this.highlightedCell.x, this.highlightedCell.y, this.tileControl.currentTile, orientationByName(this.tileControl.currentOrientation, this.tileControl.mirror));
                        }
                    }
                }, {
                    key: "onSetDirection",
                    value: function onSetDirection(data) {
                        if (this.state == PLACING || this.state == INPLACE) {
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

                                if (type != "Start" && type != "End" && type != "Empty") this.programView.program.setCell(x, y, type, orientationByName(dir, mirrored));
                            }
                        }

                        if (this.state == INPLACE) {
                            this.setInplace();
                        }
                    }
                }, {
                    key: "setInplace",
                    value: function setInplace() {
                        if (this.tileControl.currentTile && this.highlightedCell) {

                            this.programView.program.setCell(this.highlightedCell.x, this.highlightedCell.y, this.tileControl.currentTile, orientationByName(this.tileControl.currentOrientation, this.tileControl.mirror));
                        }
                    }
                }, {
                    key: "onMirror",
                    value: function onMirror(data) {
                        if (this.state == PLACING || this.state == INPLACE) {
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
                                if (type != "Start" && type != "End" && type != "Empty") this.programView.program.setCell(x, y, type, o);
                            }
                        }

                        if (this.state == INPLACE) {
                            this.setInplace();
                        }
                    }
                }, {
                    key: "clearCursor",
                    value: function clearCursor() {
                        this.state = IDLE;
                        if (this.tileCursor) {
                            this.tileCursor.remove();
                            this.tileCursor.unmousemove(this.move);
                            this.tileCursor = null;
                        }
                        this.currentTile = null;
                    }
                }, {
                    key: "onDelete",
                    value: function onDelete(data) {
                        if (this.state == PLACING) {
                            // Reset orientation for next time
                            this.tileControl.clear();
                            this.state = IDLE;
                        } else if (this.state == IDLE && data && data.x && data.y) {
                            // see if we are hovering over the programview

                            var el = Snap.getElementByPoint(data.x, data.y),
                                info = el.data("tileInfo");

                            if (el && info) {
                                // Now have reference to cell
                                var p = info.program,
                                    type = info.cell.type,
                                    x = info.x,
                                    y = info.y;
                                if (type != "Start" && type != "End" && type != "Empty") p.setCell(x, y, "Empty");
                            }
                        } else if (this.state === INPLACE) {
                            if (this.highlightedCell) {
                                var c = this.highlightedCell;

                                this.programView.program.setCell(c.x, c.y, "Empty");
                            }
                            this.tileControl.clear();
                            this.clearHighlight();
                            this.state = IDLE;
                        }
                    }
                }, {
                    key: "clearHighlight",
                    value: function clearHighlight() {
                        this.highlightedCell = null;
                        this.tileControl.clear();
                        radio("unhighlighted").broadcast();
                    }
                }]);

                return Editor;
            })();

            ;

            editor.Editor = Editor;editor.orientationByName = orientationByName;
        }
    };
});
System.register("graphics", [], function (_export) {
    "use strict";

    var graphics, imageMap, globalCanvas, allImagePromises, preloadPromise;

    function getSVG(url) {
        if (!getSVG.cache) {
            getSVG.cache = {};
        }

        if (getSVG.cache[url] == undefined) {
            // retrieve the graphic
            var p = new Promise(function (resolve, reject) {
                Snap.load(url, function (fragment) {
                    var g = fragment.select("g");
                    getSVG.cache[url] = Promise.resolve(g);

                    resolve(g.clone());
                });
            });

            getSVG.cache[url] = p;

            return p;
        } else {
            return Promise.resolve(getSVG.cache[url]).then(function (g) {
                return g.clone();
            });
        }
    }return {
        setters: [],
        execute: function () {
            graphics = {};

            _export("default", graphics);

            imageMap = {
                Conveyor: "img/conveyor.svg",
                ConveyorElbow: "img/conveyor-elbow.svg",
                ConveyorTee: "img/conveyor-tee.svg",
                ConveyorTeeTwo: "img/conveyor-tee-2.svg",
                ConveyorEx: "img/conveyor-ex.svg",
                CrossConveyor: "img/cross-conveyor.svg",
                BranchBR: "img/branch-br.svg",
                BranchGY: "img/branch-gy.svg",
                WriteB: "img/write-blue.svg",
                WriteR: "img/write-red.svg",
                WriteY: "img/write-yellow.svg",
                WriteG: "img/write-green.svg",
                WriterConnector: "img/writer-connector.svg",
                Start: "img/start.svg",
                End: "img/end.svg",

                DeleteButton: "img/delete-button.svg",
                MirrorButton: "img/mirror-button.svg",
                PlayButton: "img/play-button.svg",
                PauseButton: "img/pause-button.svg",
                StopButton: "img/stop-button.svg"
            };
            globalCanvas = null;
            allImagePromises = Object.keys(imageMap).map(function (key) {
                var url = imageMap[key];

                var p = getSVG(url);

                p.then(function (svg) {
                    imageMap[key] = svg;
                });

                return p;
            });
            preloadPromise = Promise.all(allImagePromises);

            graphics.preload = function preload(paper) {
                globalCanvas = paper.g().attr({ visibility: "hidden" });
                return preloadPromise;
            };

            graphics.getGraphic = function getGraphic(name) {
                var original = imageMap[name];

                if (original.parent() !== globalCanvas) globalCanvas.append(original);

                if (original) {
                    return globalCanvas.use(original).attr({ visibility: "visible" });
                }

                return null;
            };

            graphics.screenPointToLocal = function screenPointToLocal(x, y, element) {
                var svg = element.node.ownerSVGElement || element.node,
                    spt = svg.createSVGPoint(),
                    mat = element.node.getScreenCTM();

                spt.x = x;
                spt.y = y;

                return spt.matrixTransform(mat.inverse());
            };;
        }
    };
});
System.register("gui", ["editor", "graphics", "codeCell", "view", "picker"], function (_export) {
    /**
     * User interaction classes
     */

    "use strict";

    var editor, graphics, codeCell, toTransformString, Picker, BaseControl, Palette, TileControl, PlayControl;

    var _get = function get(_x8, _x9, _x10) { var _again = true; _function: while (_again) { var object = _x8, property = _x9, receiver = _x10; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x8 = parent; _x9 = property; _x10 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

    var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function makeButton(x, y, layer, image) {
        var mainClass = arguments.length <= 4 || arguments[4] === undefined ? "" : arguments[4];
        var subClass = arguments.length <= 5 || arguments[5] === undefined ? "" : arguments[5];
        var margin = arguments.length <= 6 || arguments[6] === undefined ? 1 : arguments[6];
        var r = arguments.length <= 7 || arguments[7] === undefined ? 2 : arguments[7];

        var button = layer.g(graphics.getGraphic(image));
        button.addClass(mainClass).addClass(subClass);

        var bg = button.rect(margin, margin, 32 - 2 * margin, 32 - 2 * margin, r, r).prependTo(button);
        bg.attr({ fill: "gray" }).addClass("bg");

        button.transform("T" + x + "," + y);

        return button;
    }
    return {
        setters: [function (_editor) {
            editor = _editor["default"];
        }, function (_graphics) {
            graphics = _graphics["default"];
        }, function (_codeCell) {
            codeCell = _codeCell["default"];
        }, function (_view) {
            toTransformString = _view.toTransformString;
        }, function (_picker) {
            Picker = _picker.Picker;
        }],
        execute: function () {
            BaseControl = (function () {
                function BaseControl(paper, x, y) {
                    _classCallCheck(this, BaseControl);

                    this.paper = paper;
                    this._x = x;
                    this._y = y;

                    this._layer = paper.g();
                    this._translate();
                }

                _createClass(BaseControl, [{
                    key: "_translate",
                    value: function _translate() {
                        this._layer.transform(Snap.matrix().translate(this._x, this._y));
                    }
                }, {
                    key: "show",
                    value: function show(shouldShow) {
                        shouldShow = shouldShow !== undefined ? shouldShow : true;
                        this._layer.attr({
                            opacity: shouldShow ? 1 : 0
                        });
                    }
                }, {
                    key: "_translate",
                    value: function _translate() {
                        this._layer.transform(Snap.matrix().translate(this._x, this._y));
                    }
                }, {
                    key: "x",
                    get: function get() {
                        return this._x;
                    },
                    set: function set(_x) {
                        this._x = _x;
                        this._translate();
                    }
                }, {
                    key: "y",
                    get: function get() {
                        return this._y;
                    },
                    set: function set(_y) {
                        this._y = _y;
                        this._translate();
                    }
                }]);

                return BaseControl;
            })();

            Palette = (function (_BaseControl) {
                _inherits(Palette, _BaseControl);

                function Palette(paper, x, y, max_width, columns, margin) {
                    var _this = this;

                    _classCallCheck(this, Palette);

                    _get(Object.getPrototypeOf(Palette.prototype), "constructor", this).call(this, paper, x, y);

                    this.columns = columns > 0 ? columns : 1; // negative columns?
                    this.columnWidth = 56;
                    this.tiles = this._layer.g();
                    this.maxWidth = max_width;
                    this.margin = margin || 20;
                    this.tileWidth = 56; // tiles are 56 x 56 px

                    // Get names of all types to draw
                    this.typesToDraw = Object.keys(codeCell.codeCells);

                    var actualColumns = this.columns <= this.typesToDraw.length ? this.columns : this.typesToDraw.length;

                    this.baseWidth = actualColumns * (this.tileWidth + this.margin) - this.margin;

                    this.width = this.baseWidth * this.getScale();

                    this.drawPalette();

                    this._events = {
                        hotKey: function hotKey(data) {
                            return _this.hotKey(data);
                        }
                    };

                    editor.registerEvents(this._events);
                }

                _createClass(Palette, [{
                    key: "getScale",
                    value: function getScale() {
                        return this.maxWidth / this.baseWidth;
                    }
                }, {
                    key: "hotKey",
                    value: function hotKey(data) {
                        var num = parseInt(data.key);
                        if (!isNaN(num) && num > 0 && num <= this.typesToDraw.length) {
                            editor.trigger(editor.events.tileSelected, {
                                tile: this.typesToDraw[num - 1],
                                x: data.x,
                                y: data.y
                            });
                        }
                    }
                }, {
                    key: "drawPalette",
                    value: function drawPalette() {
                        this.tiles.clear();

                        var scale_x = this.getScale();

                        var height = 56 + 20; // 56 pixel tile + 10 pixel text + 10 pixel padding
                        var width = 56 + 20;
                        var cellImages = this.typesToDraw.map((function (name) {
                            var image = this.paper.g(graphics.getGraphic(name));
                            if (image != null) return { name: name, image: image };else return undefined;
                        }).bind(this)).filter(_.negate(_.isUndefined));

                        cellImages.map(function (image, index) {

                            var group = this.tiles.g(),
                                x_index = index % this.columns,
                                y_index = Math.floor(index / this.columns),
                                transform = Snap.matrix().scale(scale_x).translate(x_index * width, y_index * height);

                            group.click(function (evt, x, y) {
                                editor.trigger(editor.events.tileSelected, {
                                    tile: image.name,
                                    event: evt,
                                    x: x,
                                    y: y
                                });
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

                            var label = group.text(56 / 2, height - 8, image.name);
                            label.attr({
                                textAnchor: "middle",
                                text: index + 1
                            }).addClass("label-text");

                            var title = Snap.parse('<title>' + image.name + '</title>');

                            group.append(title);
                        }, this);
                    }
                }]);

                return Palette;
            })(BaseControl);

            _export("Palette", Palette);

            ;

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

            TileControl = (function (_BaseControl2) {
                _inherits(TileControl, _BaseControl2);

                function TileControl(paper, x, y, width, height) {
                    _classCallCheck(this, TileControl);

                    _get(Object.getPrototypeOf(TileControl.prototype), "constructor", this).call(this, paper, x, y);

                    this.width = width;
                    this.height = height;
                    this.currentTile = null;
                    this.currentOrientation = "UP";
                    this.mirror = false;

                    this.cycleOrientation = editor.cycleGenerator();

                    this.layer = this._layer.g();
                    this.tileLayer = this.layer.g();

                    this.tileLayer.transform("T20,20");

                    this.tileLayer.click(function (evt) {
                        editor.trigger(editor.events.rotate, {});
                    });

                    this.calculateScale();

                    var down = this._makeDirButton(32, 0, 0),
                        right = this._makeDirButton(20 + 56, 32, 90),
                        up = this._makeDirButton(32, 20 + 56, 180),
                        left = this._makeDirButton(0, 32, 270);

                    function bt(el, dir) {
                        el.click(function () {
                            return editor.trigger(editor.events.setDirection, { dir: dir });
                        });
                    }

                    bt(up, "UP");bt(right, "RIGHT");bt(down, "DOWN");bt(left, "LEFT");

                    var del = this._makeDeleteButton(96 + 32, 96 * 2 / 3, "tile-control-button", "delete");

                    del.click(function () {
                        return editor.trigger(editor.events["delete"], {});
                    });

                    var mirror = this._makeMirrorButton(96 + 32, 96 / 3, "tile-control-button", "mirror");

                    mirror.click(function () {
                        return editor.trigger(editor.events.mirror);
                    });
                }

                _createClass(TileControl, [{
                    key: "_makeDirButton",
                    value: function _makeDirButton(x, y) {
                        var angle = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

                        var button = this.layer.g();
                        button.addClass("tile-control-button").addClass("direction");

                        var rect = button.rect(1, 1, 30, 18, 2, 2).attr({ fill: "gray" });
                        rect.addClass("bg");

                        var arrow = button.path("M6,16L16,4L26,16L6,16");
                        arrow.attr({ fill: "white" });

                        if (angle == 90) {
                            x += 20;
                        } else if (angle == 180) {
                            y += 20;
                            x += 32;
                        } else if (angle == 270) {
                            y += 32;
                        }

                        button.transform("r" + angle + ",0,0" + "T" + x + "," + y);

                        return button;
                    }
                }, {
                    key: "_makeDeleteButton",
                    value: function _makeDeleteButton(x, y) {
                        return makeButton(x, y, this.layer, "DeleteButton", "tile-control-button", "delete");
                    }
                }, {
                    key: "_makeMirrorButton",
                    value: function _makeMirrorButton(x, y) {
                        return makeButton(x, y, this.layer, "MirrorButton", "tile-control-button", "mirror");
                    }
                }, {
                    key: "calculateScale",
                    value: function calculateScale() {
                        /*
                         Graphics are laid out with 56x56 tile in center with 20px gutters on all other sides
                         Unscaled width = 56 + 20 + 20 = 96
                         */
                        var x_scale = this.width / 96;
                        this.layer.transform("s" + x_scale);
                    }
                }, {
                    key: "onTileSelected",
                    value: function onTileSelected(tile) {
                        if (tile != this.currentTile) {
                            this.currentTile = tile;
                            this.drawTile();
                            this.orientTile();
                        }
                    }
                }, {
                    key: "drawTile",
                    value: function drawTile() {
                        this.tileLayer.clear();

                        var tileGraphic = this.tileLayer.g(graphics.getGraphic(this.currentTile));

                        if (tileGraphic) {
                            this.currentGraphic = tileGraphic;
                            this.orientTile();
                        } else {
                            this.currentGraphic = null;
                        }
                    }
                }, {
                    key: "clear",
                    value: function clear() {

                        this.tileLayer.clear();

                        this.currentGraphic = null;
                        this.currentTile = null;
                        this.currentOrientation = "UP";
                        this.mirror = false;
                    }
                }, {
                    key: "orientTile",
                    value: function orientTile() {
                        if (this.currentGraphic) {
                            var oName = this.currentOrientation,
                                o = editor.orientationByName(oName, this.mirror),
                                rotate = toTransformString(Snap.matrix(o.a, o.b, o.c, o.d, 0, 0));

                            this.currentGraphic.transform(rotate + "S" + 40 / 56);
                        }
                    }
                }, {
                    key: "onRotate",
                    value: function onRotate() {
                        this.currentOrientation = this.cycleOrientation(this.currentOrientation);
                        this.orientTile();
                    }
                }, {
                    key: "onSetDirection",
                    value: function onSetDirection(dir) {
                        this.currentOrientation = dir;
                        this.orientTile();
                    }
                }, {
                    key: "onMirror",
                    value: function onMirror() {
                        this.mirror = !!!this.mirror;
                        this.orientTile();
                    }
                }]);

                return TileControl;
            })(BaseControl);

            _export("TileControl", TileControl);

            ;

            PlayControl = (function (_BaseControl3) {
                _inherits(PlayControl, _BaseControl3);

                function PlayControl(paper, x, y) {
                    var height = arguments.length <= 3 || arguments[3] === undefined ? 32 : arguments[3];

                    _classCallCheck(this, PlayControl);

                    _get(Object.getPrototypeOf(PlayControl.prototype), "constructor", this).call(this, paper, x, y);
                    this.height = height;

                    this.buttonLayer = this._layer.g();

                    this.buttonLayer.transform("s" + height / 32);

                    this.play = makeButton(0, 0, this.buttonLayer, "PlayButton", "play-control", "play");
                    this.pause = makeButton(32, 0, this.buttonLayer, "PauseButton", "play-control", "pause");
                    this.stop = makeButton(32 * 2, 0, this.buttonLayer, "StopButton", "play-control", "stop");

                    this.picker = new Picker({
                        el: this.buttonLayer.node,
                        children: ".play-control",
                        "class": "active"
                    });

                    function bc(btn, which) {
                        btn.click(function () {
                            radio(which + "-clicked").broadcast();
                        });
                    }

                    bc(this.play, "play");
                    bc(this.pause, "pause");
                    bc(this.stop, "stop");
                }

                _createClass(PlayControl, [{
                    key: "width",
                    get: function get() {
                        return this.height * 3;
                    }
                }]);

                return PlayControl;
            })(BaseControl);

            _export("PlayControl", PlayControl);

            ;
        }
    };
});
System.register("interpreter", ["program", "codeCell", "tmath", "core"], function (_export) {
    "use strict";

    var program, codeCell, tmath, core, interpreter, Interpreter;

    var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    return {
        setters: [function (_program) {
            program = _program["default"];
        }, function (_codeCell) {
            codeCell = _codeCell["default"];
        }, function (_tmath) {
            tmath = _tmath["default"];
        }, function (_core) {
            core = _core["default"];
        }],
        execute: function () {
            interpreter = interpreter || {};

            _export("default", interpreter);

            Interpreter = (function () {
                function Interpreter() {
                    _classCallCheck(this, Interpreter);

                    this.tape = new core.Tape();
                    this.program = null;

                    this.accept = false;
                    this.running = false;

                    this.position = new tmath.Vec2(0, 0);
                    this.facing = program.directions.UP;

                    this.cycles = 0;
                }

                _createClass(Interpreter, [{
                    key: "setProgram",
                    value: function setProgram(program) {
                        this.program = program;
                    }
                }, {
                    key: "setTape",
                    value: function setTape(tape) {
                        this.tape = tape;
                    }
                }, {
                    key: "start",
                    value: function start() {
                        this.accept = false;
                        this.running = true;
                        this.cycles = 0;

                        // Go to the start
                        var _iteratorNormalCompletion = true;
                        var _didIteratorError = false;
                        var _iteratorError = undefined;

                        try {
                            for (var _iterator = _.range(this.program.cols)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                                var x = _step.value;
                                var _iteratorNormalCompletion2 = true;
                                var _didIteratorError2 = false;
                                var _iteratorError2 = undefined;

                                try {
                                    for (var _iterator2 = _.range(this.program.rows)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                                        var y = _step2.value;

                                        if (this.program.getCell(x, y).type == "Start") {
                                            this.position.x = x;
                                            this.position.y = y;
                                        }
                                    }
                                } catch (err) {
                                    _didIteratorError2 = true;
                                    _iteratorError2 = err;
                                } finally {
                                    try {
                                        if (!_iteratorNormalCompletion2 && _iterator2["return"]) {
                                            _iterator2["return"]();
                                        }
                                    } finally {
                                        if (_didIteratorError2) {
                                            throw _iteratorError2;
                                        }
                                    }
                                }
                            }

                            // Face +y;
                        } catch (err) {
                            _didIteratorError = true;
                            _iteratorError = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion && _iterator["return"]) {
                                    _iterator["return"]();
                                }
                            } finally {
                                if (_didIteratorError) {
                                    throw _iteratorError;
                                }
                            }
                        }

                        this.facing = program.directions.UP;
                    }
                }, {
                    key: "convertDirectionGlobalToCell",
                    value: function convertDirectionGlobalToCell(d, cell) {
                        return cell.orientation.apply(d);
                    }
                }, {
                    key: "convertDirectionCellToGlobal",
                    value: function convertDirectionCellToGlobal(d, cell) {
                        return cell.orientation.invert().apply(d);
                    }

                    // Returns tuple [pop tape head or not (bool), symbol to push (maybe null), new facing direction]
                }, {
                    key: "evalCell",
                    value: function evalCell(cell, tapeHead) {

                        var cellFunc = codeCell.codeCells[cell.type];

                        var result = null;

                        if (cellFunc) {
                            if (cell.type == "CrossConveyor") {
                                // Special case. Convert this.facing into cell coordinates for CrossConveyor's function:
                                var cellFacing = this.convertDirectionGlobalToCell(this.facing, cell);
                                result = cellFunc(tapeHead, cellFacing);
                            } else {
                                // No knowledge of current facing needed
                                result = cellFunc(tapeHead);
                            }

                            // Convert cell's returned direction into global direction
                            result[2] = this.convertDirectionCellToGlobal(result[2], cell);
                            return result;
                        }

                        console.log("Invalid cell type.");

                        return [false, null, program.directions.UP];
                    }
                }, {
                    key: "step",
                    value: function step() {

                        if (!this.running) return;

                        // Get state
                        var cell = this.program.getCell(this.position.x, this.position.y);
                        var head = this.tape.head();

                        // Check if done
                        if (cell.type == "Empty" || cell.type == "Start" && this.cycles > 0) {
                            this.running = false;
                            this.accept = false;
                        } else if (cell.type == "End") {
                            this.running = false;
                            this.accept = true;
                        } else {

                            // Evaluate cell
                            var result = this.evalCell(cell, head);

                            // Perform result
                            if (result[0]) {
                                this.tape.pop();
                            }

                            if (result[1] != null) {
                                this.tape.append(result[1]);
                            }

                            this.facing = result[2];

                            // Move 'facing' direction:
                            this.position = this.position.add(this.facing);
                            this.cycles += 1;
                        }
                    }
                }]);

                return Interpreter;
            })();

            interpreter.Interpreter = Interpreter;
        }
    };
});
System.register("loader", ["core", "codeCell", "tmath", "program"], function (_export) {
    /**
     Utilities for loading and saving a program and set of tapes in JSON format
    
    
     The basic format is like this:
    
     {
    	title: title-string,
    	desc: desc-string,
    	testCases: [test-case-description1, ..., test-case-description2],
     	program: { ... program-description ... },
     }
    
    
     tape-description:
    
     A string of the characters R,B,G,Y in any combination or order
    
    
     test-case-description:
    
     A test vector for the user's program. Specified using a string with this format:
    
     [a|r]:tape-description:tape-description[:cycle-limit]
    
       1           2                3              4
    
     1: Accept or reject
     2: Input tape (can be empty)
     3: Output tape (can be empty)
     4: Max iterations as number (optional)
    
    
     program-description:
    
     {
     	cols: Number,
     	rows: Number,
    	cells: [ cell-description1, cell-description2 ],
     	start: {
     		x: Number,
    		y: Number,
     		orientation: orientation-description
    	},
    	end: {
    		x: Number,
    		y: Number,
     		orientation: orientation-description
    	}
     }
    
    
     cell-description:
    
     {
    	type: type-description,
     	x: Number,
    	y: Number,
     	orientation: orientation-description
     }
    
    
     orientation-description:
    
     One of the strings ID, ROT1, ROT2, ROT3, MIR, MROT1, MROT2, MROT3
    
    
     type-description:
    
     String specifying the type of the cell. Currently these are:
    
     Conveyor
     CrossConveyor
     BranchBR
     BranchGY
     WriteB
     WriteR
     WriteG
     WriteY
    
    */

    "use strict";

    var core, codeCell, tmath, program, loader;

    function isTape(t) {
        // Ensure tapeDesc only contains B,R,G,Y
        var invalidChars = t.match(/[^RGBY]/);
        if (invalidChars != null) return false;
        return true;
    }

    function isOrientation(o) {
        var index = ["ID", "ROT1", "ROT2", "ROT3", "MIR", "MROT1", "MROT2", "MROT3"].indexOf(o);
        if (index == -1) return false;
        return true;
    }

    function isCellType(t) {
        var validTypes = Object.keys(codeCell.codeCells);
        var index = validTypes.indexOf(t);
        if (index == -1) {
            return false;
        }
        return true;
    }

    function isCoordinate(c) {
        return !isNaN(c);
    }

    function hasAll(ob, required) {
        var keys = Object.keys(ob);
        return required.every(_.partial(_.contains, keys, _));
    }

    function isCellDesc(cellDesc) {

        if (!hasAll(cellDesc, ["type", "x", "y", "orientation"])) {
            return false;
        }

        return allTrue([isCellType(cellDesc.type), isOrientation(cellDesc.orientation), isCoordinate(cellDesc.x), isCoordinate(cellDesc.y)]);
    }

    function isEndpoint(e) {
        if (!hasAll(e, ["orientation", "x", "y"])) {
            return false;
        }

        return allTrue([isOrientation(e.orientation), isCoordinate(e.x), isCoordinate(e.y)]);
    }

    function isWithinBounds(max_x, max_y) {
        return function (cell) {
            return cell.x >= 0 && cell.x <= max_x && cell.y >= 0 && cell.y <= max_y;
        };
    }

    function allTrue(l) {
        return l.every(function (p) {
            return Boolean(p);
        });
    }

    function isProgram(p) {
        if (!hasAll(p, ["start", "end", "cols", "rows", "cells"])) {
            return false;
        }

        var basic = allTrue([isCoordinate(p.cols), isCoordinate(p.rows), p.cells.every(isCellDesc), isEndpoint(p.start), isEndpoint(p.end)]);

        var bounds = isWithinBounds(p.cols - 1, p.rows - 1);

        return basic && p.cells.every(bounds) && bounds(p.start) && bounds(p.end);
    }

    function isValid(level) {
        if (!hasAll(level, ["title", "testCases", "program"])) {
            return false;
        }

        return allTrue([level.testCases.every(isTestVector), isProgram(level.program)]);
    }

    function orientationToJson(o) {
        var mat = tmath.Mat2x2;

        if (_.isEqual(o, mat.kID)) return "ID";else if (_.isEqual(o, mat.kROT1)) return "ROT1";else if (_.isEqual(o, mat.kROT2)) return "ROT2";else if (_.isEqual(o, mat.kROT3)) return "ROT3";else if (_.isEqual(o, mat.kMIR)) return "MIR";else if (_.isEqual(o, mat.kMROT1)) return "MROT1";else if (_.isEqual(o, mat.kMROT2)) return "MROT2";else if (_.isEqual(o, mat.kMROT3)) return "MROT3";else return "INVALID";
    }

    function jsonToOrientation(json) {
        var mat = tmath.Mat2x2;

        switch (json) {
            case "ID":
                return mat.kID;
            case "ROT1":
                return mat.kROT1;
            case "ROT2":
                return mat.kROT2;
            case "ROT3":
                return mat.kROT3;

            case "MIR":
                return mat.kMIR;
            case "MROT1":
                return mat.kROT1;
            case "MROT2":
                return mat.kROT2;
            case "MROT3":
                return mat.kROT3;
            default:
                return null;
        }
    }

    function programToJson(p) {
        var json = {
            cols: p.cols,
            rows: p.rows,
            cells: [],
            start: null,
            end: null
        };

        p.cells.forEach(function (column, x) {
            column.forEach(function (cell, y) {
                if (cell.type != "Empty") {
                    var ob = { x: x, y: y, orientation: orientationToJson(cell.orientation) };
                    if (cell.type == "Start") json.start = ob;else if (cell.type == "End") json.end = ob;else {
                        ob.type = cell.type;
                        json.cells.push(ob);
                    }
                }
            });
        });

        return json;
    }

    function jsonToProgram(json) {
        var p = new program.Program(parseInt(json.cols), parseInt(json.rows));

        json.cells.forEach(function (cell) {
            p.setCell(cell.x, cell.y, cell.type, jsonToOrientation(cell.orientation));
        });

        p.setStart(json.start.x, json.start.y, jsonToOrientation(json.end.orientation));

        p.setEnd(json.end.x, json.end.y, jsonToOrientation(json.end.orientation));

        return p;
    }

    function tapeToJson(t) {
        return t.symbols.reduce(function (prev, cur) {
            var end = "";
            if (cur == core.RED) end = "R";
            if (cur == core.BLUE) end = "B";
            if (cur == core.GREEN) end = "G";
            if (cur == core.YELLOW) end = "Y";
            return prev + end;
        }, "");
    }

    function jsonToTape(json) {
        var t = new core.Tape();

        Array.prototype.forEach.call(json, function (letter) {
            t.append(core.symbols[letter]);
        });

        return t;
    }

    /**
     Validate test vector string
     */
    function isTestVector(json) {
        var parts = json.split(":");

        if (parts.length < 3) {
            console.log("ERROR: test vector string does not contain all required parts");
            return false;
        }

        if (parts.length == 3) {
            parts[3] = 0; // fill in optional field with default value
        }

        return allTrue([parts[0].match(/^[ar]$/), isTape(parts[1]), isTape(parts[2]), !isNaN(parseInt(parts[3]))]);
    }

    /**
     Convert test vector object to string
     */
    function testVectorToJson(ob) {
        return [ob.accept ? "a" : "r", tapeToJson(ob.input), tapeToJson(ob.output), ob.limit].join(":");
    }

    /**
     Parse test vector string to object
     */
    function jsonToTestVector(json) {
        var parts = json.split(":"),
            accept = parts[0] == "a" ? true : false,
            input = parts[1],
            output = parts[2],
            limit = parts.length > 3 ? parseInt(parts[3]) : 0;

        if (isNaN(limit)) limit = 0;

        return {
            accept: accept,
            input: jsonToTape(input),
            output: jsonToTape(output),
            limit: limit
        };
    }

    function levelToJson(title, testCases, prog) {
        var json = {
            title: title,
            testCases: (_.isArray(testCases) ? testCases : [testCases]).map(testVectorToJson),
            program: programToJson(prog)
        };

        return json;
    }

    function jsonToLevel(json) {
        var level = {
            title: json.title,
            testCases: json.testCases.map(jsonToTestVector),
            program: jsonToProgram(json.program)
        };

        return level;
    }

    return {
        setters: [function (_core) {
            core = _core["default"];
        }, function (_codeCell) {
            codeCell = _codeCell["default"];
        }, function (_tmath) {
            tmath = _tmath["default"];
        }, function (_program) {
            program = _program["default"];
        }],
        execute: function () {
            loader = loader || {};

            _export("default", loader);

            loader.isTape = isTape;loader.isOrientation = isOrientation;loader.isCellType = isCellType;loader.isCoordinate = isCoordinate;loader.hasAll = hasAll;loader.isCellDesc = isCellDesc;loader.isEndpoint = isEndpoint;loader.isWithinBounds = isWithinBounds;loader.allTrue = allTrue;loader.isProgram = isProgram;loader.isValid = isValid;loader.orientationToJson = orientationToJson;loader.jsonToOrientation = jsonToOrientation;loader.programToJson = programToJson;loader.jsonToProgram = jsonToProgram;loader.tapeToJson = tapeToJson;loader.jsonToTape = jsonToTape;loader.isTestVector = isTestVector;loader.testVectorToJson = testVectorToJson;loader.jsonToTestVector = jsonToTestVector;loader.levelToJson = levelToJson;loader.jsonToLevel = jsonToLevel;

            loader.fromJson = function (jsonString) {
                var dejsoned = JSON.parse(jsonString);
                if (!isValid(dejsoned)) return null;

                return jsonToLevel(dejsoned);
            };

            loader.toJson = function (title, tapes, prog) {
                return JSON.stringify(levelToJson(title, tapes, prog));
            };
        }
    };
});
System.register("picker", [], function (_export) {
    "use strict";

    var Picker;

    var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    return {
        setters: [],
        execute: function () {
            Picker = (function () {
                function Picker(root) {
                    _classCallCheck(this, Picker);

                    var args = {
                        el: null, // Root element for picker
                        children: "*", // Selector for children
                        "class": "picker-selected" // Class to add to picked children
                    };

                    if (_.isUndefined(root)) console.log("Must pass argument to Picker constructor");

                    if (_.isObject(root)) args = _.defaults(_.clone(root), args);else args.el = root;

                    if (_.isString(args.el)) {
                        args.el = document.querySelector(args.el);
                    } else if (!_.isElement(args.el)) {
                        console.log("Must pass string or element to picker");
                    }

                    // copy properties to this
                    _.extend(this, args);
                    this._assignHandlers();
                }

                _createClass(Picker, [{
                    key: "_assignHandlers",
                    value: function _assignHandlers() {
                        var children = this.el.querySelectorAll(this.children);

                        var _iteratorNormalCompletion = true;
                        var _didIteratorError = false;
                        var _iteratorError = undefined;

                        try {
                            for (var _iterator = children[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                                var child = _step.value;

                                child.addEventListener("click", this._clickHandler.bind(this));
                            }
                        } catch (err) {
                            _didIteratorError = true;
                            _iteratorError = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion && _iterator["return"]) {
                                    _iterator["return"]();
                                }
                            } finally {
                                if (_didIteratorError) {
                                    throw _iteratorError;
                                }
                            }
                        }
                    }
                }, {
                    key: "_clickHandler",
                    value: function _clickHandler(mouseEvt) {
                        this.clear();

                        var elem = mouseEvt.currentTarget;
                        elem.classList.add(this["class"]);
                    }
                }, {
                    key: "clear",
                    value: function clear() {
                        var _iteratorNormalCompletion2 = true;
                        var _didIteratorError2 = false;
                        var _iteratorError2 = undefined;

                        try {
                            for (var _iterator2 = this.el.querySelectorAll(this.children)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                                var child = _step2.value;

                                child.classList.remove(this["class"]);
                            }
                        } catch (err) {
                            _didIteratorError2 = true;
                            _iteratorError2 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion2 && _iterator2["return"]) {
                                    _iterator2["return"]();
                                }
                            } finally {
                                if (_didIteratorError2) {
                                    throw _iteratorError2;
                                }
                            }
                        }
                    }
                }]);

                return Picker;
            })();

            _export("Picker", Picker);

            ;
        }
    };
});
System.register("program", ["core", "tmath"], function (_export) {
    "use strict";

    var core, tmath, program, dir, makeCellClass, Program;

    var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    return {
        setters: [function (_core) {
            core = _core["default"];
        }, function (_tmath) {
            tmath = _tmath["default"];
        }],
        execute: function () {
            program = program || {};

            _export("default", program);

            dir = { // regardless of how graphics are handled, these mean:
                UP: new tmath.Vec2(0, 1), // +y
                DOWN: new tmath.Vec2(0, -1), // -y
                LEFT: new tmath.Vec2(-1, 0), // -x
                RIGHT: new tmath.Vec2(1, 0) // +x
            };

            program.directions = dir;

            makeCellClass = function makeCellClass(typeID) {
                return function () {
                    this.type = typeID;
                    this.orientation = tmath.Mat2x2.ID();
                };
            };

            program.cellTypes = {
                Empty: makeCellClass("Empty"),
                Start: makeCellClass("Start"),
                End: makeCellClass("End"),
                Conveyor: makeCellClass("Conveyor"),
                CrossConveyor: makeCellClass("CrossConveyor"),
                BranchBR: makeCellClass("BranchBR"),
                BranchGY: makeCellClass("BranchGY"),
                WriteB: makeCellClass("WriteB"),
                WriteR: makeCellClass("WriteR"),
                WriteG: makeCellClass("WriteG"),
                WriteY: makeCellClass("WriteY")
            };

            Program = (function () {
                function Program(cols, rows) {
                    _classCallCheck(this, Program);

                    this.cols = cols;
                    this.rows = rows;
                    this.cells = [];
                    this.changed = new signals.Signal();

                    for (var x = 0; x < cols; ++x) {
                        this.cells.push([]);
                        for (var y = 0; y < rows; ++y) {
                            this.cells[x].push(new program.cellTypes.Empty());
                        }
                    }
                }

                _createClass(Program, [{
                    key: "getCell",
                    value: function getCell(x, y) {
                        return this.cells[x][y];
                    }
                }, {
                    key: "setCell",
                    value: function setCell(x, y, type, orientation) {
                        var s = new program.cellTypes[type]();

                        if (orientation) {
                            s.orientation = orientation;
                        }

                        this.cells[x][y] = s;

                        this.changed.dispatch({
                            event: "set",
                            x: x,
                            y: y,
                            type: type,
                            orientation: orientation
                        });
                    }
                }, {
                    key: "setStart",
                    value: function setStart(x, y) {
                        this.setCell(x, y, "Start");
                    }
                }, {
                    key: "setEnd",
                    value: function setEnd(x, y) {
                        this.setCell(x, y, "End");
                        this.start = { x: x, y: y };
                    }
                }]);

                return Program;
            })();

            program.Program = Program;

            program.readLegacyProgramString = function (s) {

                // [lvlString]&[codeString]&[metaInfo]

                var i = 0;

                var attrStrings = s.split("&");
                var attrs = {};

                for (i = 0; i < attrStrings.length; i++) {
                    if (attrStrings[i].startsWith("lvl=")) {
                        attrs.lvl = parseInt(attrStrings[i].slice(4));
                    }
                    if (attrStrings[i].startsWith("code=")) {
                        attrs.codeString = attrStrings[i].slice(5);
                    }
                    if (attrStrings[i].startsWith("ctm=")) {

                        // [name];[description];[test case string];[rows/cols count];[??? always 3];[??? 1 or 0 for binary or 'normal']

                        var ctmParts = attrStrings[i].slice(4).split(";");
                        attrs.name = ctmParts[0];
                        attrs.description = ctmParts[1];
                        attrs.testCaseString = ctmParts[2];
                        attrs.rows = ctmParts[3];
                        attrs.cols = ctmParts[3];
                    }
                }

                // Now parse the codeString part

                var typeMap = { c: "Conveyor", b: "WriteB", r: "WriteR", g: "WriteG", y: "WriteY", p: "BranchBR", q: "BranchGY", i: "CrossConveyor" };

                var p = new program.Program(attrs.cols, attrs.rows);
                var parts = attrs.codeString.split(";");

                for (var i = 0; i < parts.length; i++) {

                    // [type][column]:[row]f[orientation]

                    var partString = parts[i].trim();

                    if (partString.length == 0) continue;

                    var fInd = _.indexOf(partString, "f");
                    var cInd = _.indexOf(partString, ":");

                    var original = { type: partString[0], x: parseInt(partString.slice(1, cInd)), y: parseInt(partString.slice(cInd + 1, fInd)), orientation: parseInt(partString.slice(fInd + 1)) };

                    var cellProps = {};

                    cellProps.type = typeMap[original.type];
                    cellProps.x = original.x - Math.round(-0.5 * (p.cols - 9) + 8);
                    cellProps.y = original.y - Math.round(-0.5 * (p.cols - 9) + 3); // Lol this coordinate system
                    console.log(cellProps);

                    //console.log(cellProps.type, original.orientation);
                    if (cellProps.type.startsWith("Branch")) {
                        if (original.orientation == 0) cellProps.orientation = tmath.Mat2x2.MROT3();
                        if (original.orientation == 1) cellProps.orientation = tmath.Mat2x2.MROT2();
                        if (original.orientation == 2) cellProps.orientation = tmath.Mat2x2.MROT1();
                        if (original.orientation == 3) cellProps.orientation = tmath.Mat2x2.MIR();
                        if (original.orientation == 4) cellProps.orientation = tmath.Mat2x2.ROT3();
                        if (original.orientation == 5) cellProps.orientation = tmath.Mat2x2.ROT2();
                        if (original.orientation == 6) cellProps.orientation = tmath.Mat2x2.ROT1();
                        if (original.orientation == 7) cellProps.orientation = tmath.Mat2x2.ID();
                    } else if (!(cellProps.type == "CrossConveyor")) {
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
        }
    };
});
System.register("tmath", [], function (_export) {
    "use strict";

    var tmath, Vec2, Mat2x2;
    return {
        setters: [],
        execute: function () {
            tmath = tmath || {};

            _export("default", tmath);

            Vec2 = function Vec2(x, y) {
                this.x = x;
                this.y = y;
            };

            Vec2.prototype.add = function (v2) {
                return new Vec2(this.x + v2.x, this.y + v2.y);
            };

            Vec2.prototype.equals = function (v2) {
                return this.x == v2.x && this.y == v2.y;
            };

            tmath.Vec2 = Vec2;

            Mat2x2 = function Mat2x2(a, b, c, d) {
                this.a = a;
                this.b = b;
                this.c = c;
                this.d = d;
            };

            Mat2x2.ID = function () {
                return new Mat2x2(1, 0, 0, 1);
            };Mat2x2.kID = Mat2x2.ID();
            Mat2x2.ROT1 = function () {
                return new Mat2x2(0, -1, 1, 0);
            };Mat2x2.kROT1 = Mat2x2.ROT1();
            Mat2x2.ROT2 = function () {
                return new Mat2x2(-1, 0, 0, -1);
            };Mat2x2.kROT2 = Mat2x2.ROT2();
            Mat2x2.ROT3 = function () {
                return new Mat2x2(0, 1, -1, 0);
            };Mat2x2.kROT3 = Mat2x2.ROT3();
            Mat2x2.MIR = function () {
                return new Mat2x2(-1, 0, 0, 1);
            };Mat2x2.kMIR = Mat2x2.MIR();
            Mat2x2.MROT1 = function () {
                return new Mat2x2(0, 1, 1, 0);
            };Mat2x2.kMROT1 = Mat2x2.MROT1();
            Mat2x2.MROT2 = function () {
                return new Mat2x2(1, 0, 0, -1);
            };Mat2x2.kMROT2 = Mat2x2.MROT2();
            Mat2x2.MROT3 = function () {
                return new Mat2x2(0, -1, -1, 0);
            };Mat2x2.kMROT3 = Mat2x2.MROT3();

            Mat2x2.prototype.apply = function (v) {
                return new Vec2(this.a * v.x + this.b * v.y, this.c * v.x + this.d * v.y);
            };

            Mat2x2.prototype.scale = function (s) {
                return new Mat2x2(s * this.a, s * this.b, s * this.c, s * this.d);
            };

            Mat2x2.prototype.invert = function () {
                return new Mat2x2(this.d, -this.b, -this.c, this.a).scale(this.a * this.d - this.b * this.c);
            };

            Mat2x2.prototype.compose = function (m2) {
                return new Mat2x2(this.a * m2.a + this.b * m2.c, this.a * m2.b + this.b * m2.d, this.c * m2.a + this.d * m2.c, this.c * m2.b + this.d * m2.d);
            };

            Mat2x2.prototype.equals = function (m2) {
                return this.a == m2.a && this.b == m2.b && this.c == m2.c && this.d == m2.d;
            };

            tmath.Mat2x2 = Mat2x2;
        }
    };
});
System.register("view", ["core", "graphics", "editor", "codeCell", "tmath", "program"], function (_export) {
    /*global radio */

    "use strict";

    var core, graphics, editor, codeCell, tmath, program, TapeView, GridView, ProgramView;

    var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

    _export("colorForSymbol", colorForSymbol);

    /**
     GridView
    
     Draws a grid on the canvas
     */

    _export("classForSymbol", classForSymbol);

    _export("toTransformString", toTransformString);

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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
            return "#FA3";
        }
    }

    function classForSymbol(symbol) {
        if (symbol && symbol.symb && symbol.symbol != "empty") {
            if (symbol === core.RED) {
                return "symbol-red";
            } else if (symbol === core.BLUE) {
                return "symbol-blue";
            } else if (symbol === core.GREEN) {
                return "symbol-green";
            } else if (symbol === core.YELLOW) {
                return "symbol-yellow";
            }
        }
        return "";
    }

    function getNeighbors(prog, cell, x, y) {
        var o = cell.orientation,
            position = new tmath.Vec2(x, y),
            down = cellToGlobal(program.directions.DOWN, o).add(position),
            left = cellToGlobal(program.directions.LEFT, o).add(position),
            right = cellToGlobal(program.directions.RIGHT, o).add(position),
            neighbors = {
            down: { cell: null, position: null },
            left: { cell: null, position: null },
            right: { cell: null, position: null }
        };

        function safeGetCell(prog, pos) {
            try {
                var cell = prog.getCell(pos.x, pos.y);
                if (cell) return cell;else return { type: "Empty" };
            } catch (e) {
                return { type: "Empty" };
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

        if (!same && (source.cell.type == "CrossConveyor" || isBranch)) {
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

    function coordClass(x, y) {
        return "cell-x" + x + "-y" + y;
    }

    /**
     Utility function that converts a Snap.Matrix to a Snap transform string
     */

    function toTransformString(matrix) {
        var E = "";
        var s = matrix.split();
        if (! +s.shear.toFixed(9)) {
            s.scalex = +s.scalex.toFixed(4);
            s.scaley = +s.scaley.toFixed(4);
            s.rotate = +s.rotate.toFixed(4);
            return (s.dx || s.dy ? "t" + [+s.dx.toFixed(4), +s.dy.toFixed(4)] : E) + (s.scalex != 1 || s.scaley != 1 ? "s" + [s.scalex, s.scaley] : E) + (s.rotate ? "r" + [s.scalex * s.scaley < 0 ? 360 - s.rotate.toFixed(4) : +s.rotate.toFixed(4)] : E);

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
    }

    return {
        setters: [function (_core) {
            core = _core["default"];
        }, function (_graphics) {
            graphics = _graphics["default"];
        }, function (_editor) {
            editor = _editor["default"];
        }, function (_codeCell) {
            codeCell = _codeCell["default"];
        }, function (_tmath) {
            tmath = _tmath["default"];
        }, function (_program) {
            program = _program["default"];
        }],
        execute: function () {
            TapeView = (function () {
                function TapeView(paper, x, y, width, radius, tape, rows) {
                    _classCallCheck(this, TapeView);

                    this.paper = paper;
                    this.tapeView = paper.g();
                    this.width = width;
                    this.rows = rows || 1;
                    this.height = radius * this.rows;
                    this.x = x;
                    this.y = y;

                    this._sw = radius;
                    this._MAX_PER_ROW = Math.floor(this.width / this._sw);
                    this._MAX = this.rows * this._MAX_PER_ROW;

                    this.setTape(tape);
                }

                /**
                 Performs a clean draw of the tape with no animation
                 */

                _createClass(TapeView, [{
                    key: "drawTape",
                    value: function drawTape() {
                        var MAX = this._MAX,
                            sw = this._sw;

                        this.tapeView.clear();

                        for (var i = 0; i < this.tape.symbols.length && i < MAX; ++i) {
                            var curSym = this.tape.symbols[i];
                            this._appendSymbol(i, curSym);
                        }

                        for (var r = 1; r < this.rows; ++r) {
                            this.tapeView.line(0, r * this._sw, this.width, r * this._sw).addClass("tape-view-divider").attr({ stroke: "#fff" });
                        }

                        this.tapeView.transform("");
                        this.tapeView.transform("t" + this.x + "," + this.y);
                    }
                }, {
                    key: "_coordinateForIndex",
                    value: function _coordinateForIndex(index) {
                        var row = Math.floor(index / this._MAX_PER_ROW),
                            col = index % this._MAX_PER_ROW;

                        return {
                            x: col * this._sw + this._sw / 2,
                            y: row * this._sw + this._sw / 2
                        };
                    }
                }, {
                    key: "_appendSymbol",
                    value: function _appendSymbol(index, symbol, offset, color) {
                        offset = offset || 0;

                        var sw = this._sw,
                            length = this.tapeView.selectAll("circle").length,
                            coord = this._coordinateForIndex(index);

                        var circle = this.tapeView.circle(coord.x + offset * sw, coord.y, sw / 2 - 2);

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
                                }).addClass(classForSymbol(symbol));
                            }
                        }

                        return circle;
                    }
                }, {
                    key: "animate",
                    value: function animate(action) {

                        var pop = function pop(head, callback) {
                            head.animate({ opacity: 0 }, 100, mina.linear, function () {
                                head.remove();
                                if (callback) callback();
                            });
                        };

                        var slide = (function () {
                            var sw = this._sw,
                                allSymbols = this.tapeView.selectAll("circle"),
                                length = allSymbols.length;

                            // Append symbol if necessary
                            if (length < this._MAX && this.tape.symbols.length > length) {
                                var c = this._appendSymbol(length, this.tape.symbols[length - 1], 1);
                                c.attr({ opacity: 0 });
                            }

                            // Slide left
                            this.tapeView.selectAll("circle").animate({
                                cx: "-=" + sw,
                                opacity: 1
                            }, 200, mina.easeinout);

                            // Iterate over all symbols that are the beginning of a row other than the first
                            for (var beginIndex = this._MAX_PER_ROW - 1; beginIndex < length; beginIndex += this._MAX_PER_ROW) {

                                var rowFront = allSymbols[beginIndex],
                                    coord = this._coordinateForIndex(beginIndex);

                                rowFront.stop(); // cancel sliding animation

                                rowFront.animate({
                                    cx: coord.x,
                                    cy: coord.y,
                                    opacity: 1
                                }, 200, mina.linear);
                            }
                        }).bind(this);

                        if (action == "pop") {
                            // Dissolve first element, then slide left
                            var head = this.tapeView.selectAll("circle")[0];
                            pop(head, slide);
                        } else if (action == "append") {
                            // Append symbol if it will fit
                            var length = this.tapeView.selectAll("circle").length;
                            if (length < this._MAX && this.tape.symbols.length > length) {
                                var c = this._appendSymbol(length, this.tape.symbols[length], 0);
                                c.attr({ opacity: 0 });
                                c.animate({
                                    opacity: 1
                                }, 50, mina.easeinout);
                            }
                        }
                    }
                }, {
                    key: "setTape",
                    value: function setTape(newTape) {
                        if (this.tape) {
                            this.tape.changed.remove(this.animate);
                        }

                        this.tape = newTape;

                        if (newTape) {
                            // Register for tape's changed signal
                            newTape.changed.add(this.animate, this);
                        }
                    }
                }, {
                    key: "remove",
                    value: function remove() {
                        if (this.tape) this.tape.changed.remove(this.animate);
                        this.tape = null;

                        this.tapeView.remove();
                    }
                }]);

                return TapeView;
            })();

            _export("TapeView", TapeView);

            ;

            GridView = (function () {
                function GridView(paper, x, y, width, height, rows, cols) {
                    _classCallCheck(this, GridView);

                    this.paper = paper;
                    this.grid = paper.g();
                    this.width = width;
                    this.height = height;
                    this.x = x;
                    this.y = y;
                    this.cols = cols;
                    this.rows = rows;

                    this.grid.click(this.onClick.bind(this));

                    radio("highlighted").subscribe([this.highlight, this]);
                    radio("unhighlighted").subscribe([this.clearHighlight, this]);
                }

                _createClass(GridView, [{
                    key: "onClick",
                    value: function onClick(evt, x, y) {
                        var cell = this.screenPointToCell(evt.clientX, evt.clientY);

                        if (cell.x >= 0 && cell.x < this.cols && cell.y >= 0 && cell.y < this.rows) {
                            editor.trigger(editor.events.cellSelected, { cell: cell });
                        }
                    }
                }, {
                    key: "highlight",
                    value: function highlight(cell) {

                        if (cell && cell.x !== undefined && cell.y !== undefined) {
                            this.clearHighlight();

                            var sw = this.width / this.cols,
                                sh = this.height / this.rows,
                                highlight = this.grid.rect(cell.x * sw, cell.y * sh, sw, sh).addClass("highlight").attr({ fill: "white" });
                        }
                    }
                }, {
                    key: "clearHighlight",
                    value: function clearHighlight() {
                        this.grid.selectAll(".highlight").forEach(function (el) {
                            return el.remove();
                        });
                    }
                }, {
                    key: "remove",
                    value: function remove() {
                        this.grid.remove();
                        radio("hightlighted").unsubscribe(this.highlight);
                        radio("unhightlighted").unsubscribe(this.clearHighlight);
                    }
                }, {
                    key: "drawGrid",
                    value: function drawGrid() {
                        this.grid.clear();

                        var r = this.paper.rect(0, 0, this.width, this.height);
                        r.attr({ fill: "#FFF" });
                        r.addClass("grid-bg");
                        this.grid.append(r);

                        var sw = this.width / this.cols;
                        var sy = this.height / this.rows;

                        for (var x = 0; x <= this.cols; ++x) {
                            var l = this.grid.line(x * sw, 0, x * sw, this.height);
                            l.addClass("grid-line");
                        }

                        for (var y = 0; y <= this.rows; ++y) {
                            var l = this.grid.line(0, y * sy, this.width, y * sy);
                            l.addClass("grid-line");
                        }

                        this.grid.attr({ stroke: "#888", strokeWidth: 1 });

                        this.grid.transform("");
                        this.grid.transform("t" + this.x + "," + this.y);
                    }

                    /**
                     GridView.getCellMatrix(col, row, corner) -> Matrix
                      Returns local matrix describing location of cell
                      If corner == true, uses top left corner of cell
                      Otherwise, uses center of cell
                      */
                }, {
                    key: "getCellMatrix",
                    value: function getCellMatrix(col, row, corner) {
                        var mat = Snap.matrix(),
                            sw = this.width / this.cols,
                            sy = this.height / this.rows;

                        if (!corner) {
                            mat.translate(sw / 2, sy / 2);
                        }
                        mat.translate(sw * col, sy * row);

                        return mat;
                    }

                    /**
                     GridView.getGlobalCellMatrix(col, row, corner) -> Matrix
                      Returns global matrix describing location of cell
                      If corner == true, uses top left corner of cell
                      Otherwise, uses center of cell
                      */
                }, {
                    key: "getGlobalCellMatrix",
                    value: function getGlobalCellMatrix(col, row, corner) {

                        var transform = this.grid.transform();
                        var globalMatrix = transform.globalMatrix.clone();

                        var sw = this.width / this.cols;
                        var sy = this.height / this.rows;

                        if (!corner) {
                            globalMatrix.translate(sw / 2, sy / 2);
                        }

                        globalMatrix.translate(sw * col, sy * row);

                        return globalMatrix;
                    }
                }, {
                    key: "screenPointToCell",
                    value: function screenPointToCell(x, y) {
                        var localPoint = graphics.screenPointToLocal(x, y, this.grid),
                            sw = this.width / this.cols,
                            sy = this.height / this.rows,
                            index_x = Math.floor(localPoint.x / sw),
                            index_y = Math.floor(localPoint.y / sy);

                        console.log("I think you want " + index_x + ", " + index_y);

                        return { x: index_x, y: index_y };
                    }
                }]);

                return GridView;
            })();

            _export("GridView", GridView);

            ;

            ProgramView = (function () {
                function ProgramView(paper, x, y, program, maxWidth, maxHeight) {
                    _classCallCheck(this, ProgramView);

                    this.paper = paper;

                    this.x = x;
                    this.y = y;

                    this.program = program;

                    this._maxWidth = maxWidth;
                    this._maxHeight = maxHeight;

                    this.tileSize = 56;

                    this._layer = paper.g().addClass("program-view");

                    this.cells = this._layer.g().addClass("cells");

                    this.gridView = new GridView(this._layer, 0, 0, program.cols * this.tileSize, program.rows * this.tileSize, program.rows, program.cols);

                    this.width = this.gridView.width;
                    this.height = this.gridView.height;

                    this.gridView.drawGrid();

                    this.calculateTransform();

                    var binding = this.program.changed.add(this.updateCell);
                    binding.context = this;
                }

                _createClass(ProgramView, [{
                    key: "calculateTransform",
                    value: function calculateTransform() {
                        var maxw = this._maxHeight,
                            maxh = this._maxWidth,
                            scale_x = maxw / this.gridView.width,
                            scale_y = maxh / this.gridView.height,
                            scale = Math.min(scale_x, scale_y);

                        this._layer.transform("T" + this.x + "," + this.y + "s" + scale + ",0,0");
                    }
                }, {
                    key: "setProgram",
                    value: function setProgram(p) {
                        if (this.program) this.program.changed.remove(this.drawProgram);

                        this.program = p;
                        this.gridView.remove();
                        this.gridView = new GridView(this._layer, this.x, this.y, p.cols * this.tileSize, p.rows * this.tileSize, p.rows, p.cols);
                        this.gridView.drawGrid();
                        this.cells.clear();

                        this.calculateTransform();
                    }
                }, {
                    key: "updateCell",
                    value: function updateCell(data) {
                        // coordinates of updated cell
                        var x = data.x,
                            y = data.y;

                        // remove old cells in the region and redraw each
                        for (var c_x = x - 1; c_x <= x + 1; ++c_x) {
                            for (var c_y = y - 1; c_y <= y + 1; ++c_y) {
                                if (c_x >= 0 && c_x < this.program.cols && c_y >= 0 && c_y < this.program.rows) {

                                    this.gridView.grid.selectAll("." + coordClass(c_x, c_y)).forEach(function (el) {
                                        return el.remove();
                                    });

                                    this.drawTile(this.program.getCell(c_x, c_y), c_x, c_y);
                                }
                            }
                        }
                    }
                }, {
                    key: "drawTile",
                    value: function drawTile(cell, x, y) {
                        var _this = this;

                        var c = cell,
                            paper = this.paper,
                            grid = this.gridView;

                        console.log("draw");

                        if (c.type != "Empty") {
                            var container;
                            if (c.type == "Conveyor") {
                                container = this.drawConveyor(c, x, y);
                            } else if (c.type.startsWith("Write")) {
                                container = this.drawWriter(c, x, y);
                            } else {
                                var image = graphics.getGraphic(c.type);

                                if (image) {

                                    paper.append(image);

                                    var group = paper.g(image);
                                    this.cells.append(group);

                                    var corner = grid.getCellMatrix(x, y, true).toTransformString().toUpperCase();

                                    var o = c.orientation;

                                    var transform = Snap.matrix(o.a, o.b, o.c, o.d, 0, 0);
                                    var tstring = toTransformString(transform);

                                    group.transform(tstring + corner);

                                    container = group;
                                }
                            }
                            if (container) {
                                container.selectAll("*").forEach(function (el) {
                                    el.data("tileInfo", {
                                        cell: c,
                                        x: x,
                                        y: y,
                                        program: _this.program
                                    }).addClass("tile-part");
                                });

                                container.addClass(coordClass(x, y));
                            }
                        }
                    }
                }, {
                    key: "drawProgram",
                    value: function drawProgram() {
                        var paper = this.paper,
                            grid = this.gridView,
                            program = this.program;

                        this.cells.clear();
                        this.cells.appendTo(this.gridView.grid);

                        for (var x = 0; x < program.cols; ++x) {
                            for (var y = 0; y < program.rows; ++y) {
                                var c = program.getCell(x, y);
                                this.drawTile(c, x, y);
                            }
                        }
                    }
                }, {
                    key: "drawConveyor",
                    value: function drawConveyor(cell, x, y) {
                        var neighbors = getNeighbors(this.program, cell, x, y),
                            target = { cell: cell, position: new tmath.Vec2(x, y) },
                            hasLeft = neighbors.left.cell != null ? isPointingTo(neighbors.left, target) : false,
                            hasRight = neighbors.right.cell != null ? isPointingTo(neighbors.right, target) : false,
                            hasDown = neighbors.down.cell != null ? isPointingTo(neighbors.down, target) : false,
                            image = null,
                            mirror = false;

                        if (!hasLeft && !hasRight) {

                            image = "Conveyor";
                        } else if (!hasLeft && hasRight || hasLeft && !hasRight) {

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

                            var corner = this.gridView.getCellMatrix(x, y, true).toTransformString().toUpperCase();

                            var o = cell.orientation;

                            if (mirror) {
                                o = tmath.Mat2x2.kMIR.compose(o);
                            }

                            var transform = Snap.matrix(o.a, o.b, o.c, o.d, 0, 0);
                            var tstring = toTransformString(transform);

                            group.transform(tstring + corner);

                            return group;
                        }

                        return null;
                    }
                }, {
                    key: "drawWriter",
                    value: function drawWriter(cell, x, y) {
                        var neighbors = getNeighbors(this.program, cell, x, y),
                            target = { cell: cell, position: new tmath.Vec2(x, y) },
                            hasLeft = neighbors.left.cell != null ? isPointingTo(neighbors.left, target) : false,
                            hasRight = neighbors.right.cell != null ? isPointingTo(neighbors.right, target) : false,
                            image = null,
                            leftConnector = null,
                            rightConnector = null;

                        image = graphics.getGraphic(cell.type);

                        if (image) {

                            this.paper.append(image);

                            var group = this.paper.g(image);
                            this.cells.append(group);

                            if (hasRight) {
                                rightConnector = graphics.getGraphic("WriterConnector");
                                group.append(rightConnector);
                            }

                            if (hasLeft) {
                                leftConnector = group.g(graphics.getGraphic("WriterConnector"));
                                group.append(leftConnector);
                                var rot = tmath.Mat2x2.kROT2,
                                    m = Snap.matrix(rot.a, rot.b, rot.c, rot.d, 0, 0);
                                leftConnector.transform(toTransformString(m));
                            }

                            var corner = this.gridView.getCellMatrix(x, y, true).toTransformString().toUpperCase();

                            var o = cell.orientation;

                            var transform = Snap.matrix(o.a, o.b, o.c, o.d, 0, 0);
                            var tstring = toTransformString(transform);

                            group.transform(tstring + corner);

                            return group;
                        }

                        return null;
                    }
                }]);

                return ProgramView;
            })();

            _export("ProgramView", ProgramView);

            ;;
        }
    };
});
//# sourceMappingURL=all.js.map
