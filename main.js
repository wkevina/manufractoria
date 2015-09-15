
var core = core || {},
    program = program || {},
    interpreter = interpreter || {},
    graphics = graphics || {},
    view = view || {},
    tmath = tmath || {},
    loader = loader || {},
    editor = editor || {};

function App() {
    this.program = null;
    this.programView = null;
    this.interpreter = null;
    this.stepTime = 500; // default ms between steps
    this.tapeList = [];

    var linkForm = $("#link-form");
    linkForm.find("button").click(this.generateLink.bind(this));
    linkForm.find("input").val("");

    var loadForm = $("#load-form");
    loadForm.find("button").click(this.loadLevel.bind(this));

    this.controlsEl = $("#controls");

    var stopButton = this.controlsEl.find("[data-action=stop]"),
        pauseButton = this.controlsEl.find("[data-action=pause]"),
        playButton = this.controlsEl.find("[data-action=run]");

    stopButton.prop("disabled", true);
    pauseButton.prop("disabled", true);
    playButton.prop("disabled", false);

    playButton.click(() => {
        if (!this.isRunning) {
            this.editor.disable();
            this.start();

            stopButton.prop("disabled", false);
            pauseButton.prop("disabled", false);
            playButton.prop("disabled", true);

        } else if (this.isRunning && this.isPaused) {
            this.editor.disable();
            this.pause(false); // or unpause

            stopButton.prop("disabled", false);
            pauseButton.prop("disabled", false);
            playButton.prop("disabled", true);
        }
    });

    pauseButton.click(() => {
        if (this.isRunning) {
            this.pause(true);

            stopButton.prop("disabled", false);
            pauseButton.prop("disabled", true);
            playButton.prop("disabled", false);
        }
    });

    stopButton.click(() => {
        this.stop();
        this.editor.enable();
        stopButton.prop("disabled", true);
        pauseButton.prop("disabled", true);
        playButton.prop("disabled", false);
    });


    var hash = window.location.hash;

    if (hash) {
        hash = decodeURI(hash.replace('#', '')).trim();

        if (hash.startsWith("lvl")) {
            this.program = program.readLegacyProgramString(hash);
        } else {
            var level = loader.fromJson(hash);
            if (level) {
                this.program = level.program;
                this.tapeList = level.tape;
            } else {
                // Error case
                console.log("Unable to load program string");
            }

        }
    }

}

App.prototype.loadLevel = function() {
    var loadForm = $("#load-form"),
        levelString = loadForm.find("input").val().trim(),
        newProgram = null;

    if (levelString.startsWith("lvl")) {
        newProgram = program.readLegacyProgramString(levelString);

    } else {
        var level = loader.fromJson(levelString);
        if (level) {
            newProgram = level.program;
            this.tapeList = level.tape;
        } else {
            // Error case
            console.log("Unable to load program string");
        }
    }
    if (newProgram) {
        this.program = newProgram;
        this.programView.setProgram(newProgram);
        this.programView.drawProgram();
    }
};

App.prototype.generateLink = function() {
    if (this.program != null && this.tapeList != null) {
        var link = window.location.href.split("#")[0] + "#";
        link += loader.toJson("Sample", this.tapeList, this.program);
        $("#link-form").find("input").val(decodeURI(link));
    }
};

App.prototype.main = function() {

    var paper = Snap(document.getElementById("main-svg"));
    paper.rect(0, 0, 680, 550).addClass("game-bg");
    this.paper = paper;
    // Set up UI elements
    graphics.preload(paper).then(function() {

        var programLayer = paper.g().addClass("program-layer");

        //paper.appendTo(document.getElementById("main"));

        if (this.program == null) {
            this.program = new program.Program(9, 9);
            // fill in start and end with defaults
            this.program.setStart(4, 0);
            this.program.setEnd(4, 8);
        }

        this.palette = new view.Palette(paper, 10, 30, 2);

        this.programView = new view.ProgramView(
            programLayer,
            10 + this.palette.drawWidth,
            30,
            56,
            this.program
        );

        this.editor = new editor.Editor(paper, this.programView);

        this.programView.drawProgram();

        editor.init();
        this.editor.enable();

    }.bind(this));

};

App.prototype.drawToken = function(mat, animate, callback) {
    if (!this.token) {
        this.token = this.paper.circle(0, 0, 10);
    }

    this.paper.append(this.token); // make sure token is on top

    var head = this.tapeView.tape.head(),
        fill;
    if (head && head.symbol != "empty") {
        fill =  view.colorForSymbol(head);
    } else {
        fill = "#E0E";
    }
    this.token.animate({fill: fill}, this.stepTime/2);

    if (!animate) {
        this.token.transform(mat);
    } else {
        this.token.animate(
            {
                transform: mat
            },
            this.stepTime,
            mina.linear,
            function() {
                //field.drawTape();
                if (callback)
                    callback();
            }
        );
    }

};

App.prototype.start = function() {
    this.isRunning = true;
    this.isPaused = false;
    this.interpreter = new interpreter.Interpreter();

    if (this.tapeList.length === 0) {
        this.tapeList.push(new core.Tape());
    }
    var currentTape = core.Tape.clone(this.tapeList[0]);

    this.tapeView = new view.TapeView(this.paper,
                                      this.programView.x,
                                      0,
                                      this.programView.width,
                                      20,
                                      currentTape);
    this.tapeView.drawTape();

    this.interpreter.setProgram(this.program);
    this.interpreter.setTape(currentTape);
    this.interpreter.start();

    this.run();
};

App.prototype.stop = function() {
    this.isRunning = false;
    this.isPaused = false;
    this.token && this.token.remove();
    this.tapeView && this.tapeView.remove();
};

App.prototype.pause = function(shouldPause) {
    this.isPaused = shouldPause;
};

App.prototype.run = function() {

    // If we aren't running, set everything up and start the loop
    if (this.isRunning) {
        // We're running. See if the interpreter has stopped
        if (this.interpreter.running) {
            this._step();
        } else {
            console.log("Program stopped.");
            console.log("Accepted: " + this.interpreter.accept);
            this.isRunning = false;
        }
    }
};

// Calls interpreter's step and manages animation
App.prototype._step = function() {
    console.log("Step");
    if (!this.isPaused) {
        var curPos = this.interpreter.position,
            corner = this.programView.gridView.getGlobalCellMatrix(curPos.x, curPos.y);

        this.drawToken(corner);
        this.interpreter.step();

        curPos = this.interpreter.position;
        corner = this.programView.gridView.getGlobalCellMatrix(curPos.x, curPos.y);

        this.drawToken(corner, true, this.run.bind(this));
    } else {
        requestAnimationFrame(this.run.bind(this));
    }
};


/*
 Example hash level:
 #{"title":"Sample","tape":["BYRGGYRYRGRRGBYRGYRYRGYRGBRYRRBRBGBBYRBYRBGBRBYRRYRYRGBGGBGRYRRGRRYRYRRYRBRRBYRGGRBYRBRBYRRYRGRRGGRRRGYRBYRRRRRRBYRBBGBBRG"],"program":{"cols":9,"rows":9,"cells":[{"x":2,"y":1,"orientation":"ROT3","type":"Conveyor"},{"x":2,"y":2,"orientation":"ROT3","type":"BranchBR"},{"x":2,"y":3,"orientation":"ROT3","type":"BranchBR"},{"x":2,"y":4,"orientation":"ROT3","type":"BranchGY"},{"x":2,"y":5,"orientation":"ROT3","type":"BranchGY"},{"x":3,"y":1,"orientation":"ROT2","type":"Conveyor"},{"x":3,"y":2,"orientation":"ROT2","type":"BranchBR"},{"x":3,"y":3,"orientation":"ROT2","type":"BranchBR"},{"x":3,"y":4,"orientation":"ROT2","type":"BranchGY"},{"x":3,"y":5,"orientation":"ROT2","type":"BranchGY"},{"x":4,"y":1,"orientation":"ROT1","type":"Conveyor"},{"x":4,"y":2,"orientation":"ROT1","type":"BranchBR"},{"x":4,"y":3,"orientation":"ROT1","type":"BranchBR"},{"x":4,"y":4,"orientation":"ROT1","type":"BranchGY"},{"x":4,"y":5,"orientation":"ROT1","type":"BranchGY"},{"x":5,"y":1,"orientation":"ID","type":"Conveyor"},{"x":5,"y":2,"orientation":"MIR","type":"BranchBR"},{"x":5,"y":3,"orientation":"ID","type":"BranchBR"},{"x":5,"y":4,"orientation":"MIR","type":"BranchGY"},{"x":5,"y":5,"orientation":"ID","type":"BranchGY"}],"start":{"x":4,"y":0,"orientation":"ID"},"end":{"x":4,"y":8,"orientation":"ID"}}}
 */
