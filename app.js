
import program from "program";
import {Interpreter} from "interpreter";
import graphics from "graphics";
import * as view from "view";
import tmath from "tmath";
import loader from "loader";
import editor from "editor";
import core from "core";
import {Palette, TileControl, PlayControl} from "gui";


const MARGIN = 10, // Space between elements
      PROGRAM_WIDTH = 56 * 9, // program view width, not to exceed
      PROGRAM_HEIGHT = PROGRAM_WIDTH,
      CONTROL_X = MARGIN + PROGRAM_WIDTH + MARGIN;

class App {
    constructor(width, height) {
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
        const linkForm = $('#link-form');
        linkForm.find('button').click(this.generateLink.bind(this));
        linkForm.find('input').val('');
        const loadForm = $('#load-form');
        loadForm.find('button').click(this.loadLevel.bind(this));

        radio("play-clicked").subscribe(
            () => {
                if (!this.isRunning) {
                    this.editor.disable();
                    this.start();
                } else if (this.isRunning && this.isPaused) {
                    this.editor.disable();
                    this.pause(false); // or unpause
                }
            }
        );

        radio("pause-clicked").subscribe(
            () => {
                if (this.isRunning) {
                    this.pause(true);
                }
            }
        );

        radio("stop-clicked").subscribe(
            () => {
                this.stop();
                this.editor.enable();
            }
        );

        this.loadFromHash();

    }

    loadFromHash() {
        let hash = window.location.hash;

        if (hash) {
            hash = decodeURI(hash.replace('#', '')).trim();
            if (hash.startsWith('lvl')) {
                this.program = program.readLegacyProgramString(hash);
            } else {
                const level = loader.fromJson(hash);
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

    loadLevel() {
        let loadForm = $('#load-form'), levelString = loadForm.find('input').val().trim(), newProgram = null;
        if (levelString.startsWith('lvl')) {
            newProgram = program.readLegacyProgramString(levelString);
        } else {
            const level = loader.fromJson(levelString);
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
    generateLink() {
        if (this.program != null && this.testCases != null) {
            let link = `${ window.location.href.split('#')[0] }#`;
            link += loader.toJson('Sample', this.testCases, this.program);
            $('#link-form').find('input').val(decodeURI(link));
        }
    }
    main() {
        let paper = Snap(document.getElementById('main-svg'));

        setViewbox(paper.node, 0, 0, this.canvasSize.width, this.canvasSize.height);

        const bounds = paper.node.viewBox.baseVal;
        paper.rect(bounds.x, bounds.y, bounds.width, bounds.height).addClass('game-bg');
        this.paper = paper;
        this.scratch = paper.g();
        // Set up UI elements
        graphics.preload(paper).then(function () {

            const programLayer = paper.g().addClass('program-layer');
            //paper.appendTo(document.getElementById("main"));

            const CONTROL_WIDTH = this.canvasSize.width - CONTROL_X;

            if (this.program == null) {
                this.program = new program.Program(9, 9);
                // fill in start and end with defaults
                this.program.setStart(4, 0);
                this.program.setEnd(4, 8);
            }

            this.programView = new view.ProgramView(programLayer, MARGIN, MARGIN, this.program, 56*9, 56*9);

            this.palette = new Palette(
                paper,
                CONTROL_X + CONTROL_WIDTH / 8,
                this.canvasSize.height / 2,
                CONTROL_WIDTH * 3 / 4,
                4
            );

            this.tileControl = new TileControl(
                paper,
                CONTROL_X + 40, // x
                MARGIN, // y
                CONTROL_WIDTH / 2 - MARGIN / 2, // width
                0    // height
            );

            this.playButton = new PlayControl(
                paper,
                CONTROL_X,
                this.canvasSize.height - 68 - MARGIN,
                68
            );

            this.playButton.x = CONTROL_X + CONTROL_WIDTH / 2 - this.playButton.width / 2;

            this.editor = new editor.Editor(paper, this.programView, this.tileControl);

            this.programView.drawProgram();

            editor.init();

            this.editor.enable();

        }.bind(this));
    }
    drawToken(mat, animate, callback) {
        if (!this.token) {
            this.token = this.paper.circle(0, 0, 10);
        }
        this.paper.append(this.token);
        // make sure token is on top
        let head = this.tapeView.tape.head(), fill;
        if (head && head.symbol != 'empty') {
            fill = view.colorForSymbol(head);
        } else {
            fill = '#E0E';
        }
        this.token.animate({ fill: fill }, this.stepTime / 2);
        if (!animate) {
            this.token.transform(mat);
        } else {
            this.token.animate({ transform: mat }, this.stepTime, mina.linear, () => {
                //field.drawTape();
                if (callback)
                    callback();
            });
        }
    }
    start() {
        this.isRunning = true;
        this.isPaused = false;
        this.interpreter = new Interpreter();
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

        const currentTape = core.Tape.clone(this.currentTest.test.input),

              CONTROL_WIDTH = this.canvasSize.width - CONTROL_X;

        if (this.tapeView)
            this.tapeView.remove();
        this.tapeView = new view.TapeView(
            this.paper,
            CONTROL_X,
            MARGIN,
            CONTROL_WIDTH - 10,
            (CONTROL_WIDTH - 10) / 10,
            currentTape,
            Math.floor((this.canvasSize.height/2 - MARGIN) / ((CONTROL_WIDTH - 10) / 10))
        );
        // 3 rows
        // hide Palette
        this.palette.show(false);
        this.tapeView.drawTape();
        this.interpreter.setProgram(this.program);
        this.interpreter.setTape(currentTape);
        this.interpreter.start();
        this.update();
    }
    stop() {
        this.isRunning = false;
        this.isPaused = false;
        this.token && this.token.remove();
        this.tapeView && this.tapeView.remove();
        this.currentTest.index = 0;
        this.palette.show();
    }
    pause(shouldPause) {
        this.isPaused = shouldPause;
    }
    // Governor for state when game is running
    // Responsibilities are:
    // Determine if test case has been passed or failed
    // Call run
    update() {
        const test = this.currentTest.test, int = this.interpreter;
        if (this.isRunning) {
            if (!int.running) {
                // Interpreter has stopped
                const finishedProperly = int.accept == test.accept, correctOuput = test.output.symbols.length > 0 ? tapesAreEqual(int.tape, test.output) : // compare if output not empty
                          true;
                // otherwise ignore final tape
                console.log('Test finished.');
                console.log(finishedProperly && correctOuput ? 'Passed' : 'Failed');
                if (finishedProperly && correctOuput) {
                    if (this.currentTest.index < this.testCases.length - 1) {
                        this.currentTest.index++;
                        window.setTimeout(() => this.start());
                    }
                }
                this.isRunning = false;
            } else {
                // check for cycle limit
                this._step();
            }
        }
    }
    run() {
        // If we aren't running, set everything up and start the loop
        if (this.isRunning) {
            // We're running. See if the interpreter has stopped
            if (this.interpreter.running) {
                this._step();
            } else {
                console.log('Program stopped.');
                console.log(`Accepted: ${ this.interpreter.accept }`);
                this.isRunning = false;
            }
        }
    }
    // Calls interpreter's step and manages animation
    _step() {

        if (!this.isPaused) {

            let oldPos = this.interpreter.position,

                corner = this.exchange(
                    this.programView.gridView.getGlobalCellMatrix(oldPos.x, oldPos.y, false)
                );


            this.drawToken(corner);
            this.interpreter.step();

            let curPos = this.interpreter.position,

                curCorner = this.exchange(
                    this.programView.gridView.getGlobalCellMatrix(curPos.x, curPos.y, false)
                );

            this.drawToken(curCorner, true, this.update.bind(this));

        } else {
            requestAnimationFrame(this.update.bind(this));
        }
    }

    /**
     Convert one coordinate system to another.
     Converts from system with global matrix g to system with global matrix l

     */
    exchange(g) {
        return this.scratch.transform().globalMatrix.invert().add(g);
    }
}



function setViewbox(svgel, x, y, width, height) {
    svgel.setAttribute('viewBox', [
        x,
        y,
        width,
        height
    ].join(','));
}
function tapesAreEqual(t1, t2) {
    return loader.tapeToJson(t1) == loader.tapeToJson(t2);
}
export default App;    /*
                        Example hash level:
                        #{"title":"Sample","tape":["BYRGGYRYRGRRGBYRGYRYRGYRGBRYRRBRBGBBYRBYRBGBRBYRRYRYRGBGGBGRYRRGRRYRYRRYRBRRBYRGGRBYRBRBYRRYRGRRGGRRRGYRBYRRRRRRBYRBBGBBRG"],"program":{"cols":9,"rows":9,"cells":[{"x":2,"y":1,"orientation":"ROT3","type":"Conveyor"},{"x":2,"y":2,"orientation":"ROT3","type":"BranchBR"},{"x":2,"y":3,"orientation":"ROT3","type":"BranchBR"},{"x":2,"y":4,"orientation":"ROT3","type":"BranchGY"},{"x":2,"y":5,"orientation":"ROT3","type":"BranchGY"},{"x":3,"y":1,"orientation":"ROT2","type":"Conveyor"},{"x":3,"y":2,"orientation":"ROT2","type":"BranchBR"},{"x":3,"y":3,"orientation":"ROT2","type":"BranchBR"},{"x":3,"y":4,"orientation":"ROT2","type":"BranchGY"},{"x":3,"y":5,"orientation":"ROT2","type":"BranchGY"},{"x":4,"y":1,"orientation":"ROT1","type":"Conveyor"},{"x":4,"y":2,"orientation":"ROT1","type":"BranchBR"},{"x":4,"y":3,"orientation":"ROT1","type":"BranchBR"},{"x":4,"y":4,"orientation":"ROT1","type":"BranchGY"},{"x":4,"y":5,"orientation":"ROT1","type":"BranchGY"},{"x":5,"y":1,"orientation":"ID","type":"Conveyor"},{"x":5,"y":2,"orientation":"MIR","type":"BranchBR"},{"x":5,"y":3,"orientation":"ID","type":"BranchBR"},{"x":5,"y":4,"orientation":"MIR","type":"BranchGY"},{"x":5,"y":5,"orientation":"ID","type":"BranchGY"}],"start":{"x":4,"y":0,"orientation":"ID"},"end":{"x":4,"y":8,"orientation":"ID"}}}
                        */
