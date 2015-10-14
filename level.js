/*global radio */


import {BaseControl,
        Palette,
        TileControl,
        PlayControl} from 'gui';

import layout from 'layout';

import {Editor} from 'editor';

import {ProgramView} from 'view';

export class LevelEditor extends BaseControl {
    constructor(paper, x, y, width, height, level) {
        super(paper, x, y);
        this.width = width;
        this.height = height;
        this.level = level;
        this.programView = null;
        this.palette = null;
        this.editor = null;

        this._createControls();
    }

    _createControls() {
        const CONTROL_WIDTH = this.width - layout.CONTROL_X;

        this.programView = new ProgramView(
            this._layer,
            layout.MARGIN, layout.MARGIN,
            this.level.program,
            layout.PROGRAM_WIDTH,
            layout.PROGRAM_HEIGHT
        );

        this.palette = new Palette(
            this._layer,
            layout.CONTROL_X + CONTROL_WIDTH / 8,
            this.height / 2,
            CONTROL_WIDTH * 3 / 4,
            4
        );

        this.tileControl = new TileControl(
            this._layer,
            layout.CONTROL_X + 40, // x
            layout.MARGIN, // y
            CONTROL_WIDTH / 2 - layout.MARGIN / 2, // width
            0    // height
        );

        this.playButton = new PlayControl(
            this._layer,
            layout.CONTROL_X,
            this.height - 68 - layout.MARGIN,
            68
        );

        this.playButton.x = layout.CONTROL_X + CONTROL_WIDTH / 2 - this.playButton.width / 2;

        this.editor = new Editor(this._layer, this.programView, this.tileControl);

        this.programView.drawProgram();

        this.editor.enable();
    }

    onVisible() {
        super.onVisible();

        radio('play-clicked').subscribe(this._onPlayClicked, this);
    }

    onVisible() {
        super.onHidden();

        radio('play-clicked').unsubscribe(this._onPlayClicked, this);
    }

    _onPlayClicked() {
        radio('editor:start-level').broadcast({level: this.level, sender: this});
    }
};

export class Level {
    constructor(title, program, testCases) {
        this.title = title;
        this.program = program;
        this.testCases = testCases;
    }
};
