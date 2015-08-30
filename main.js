
var core = core || {},
    program = program || {},
    interpreter = interpreter || {},
    graphics = graphics || {},
    view = view || {},
    tmath = tmath || {};

var main = function() {

    graphics.preload().then(function() {

        var t = new core.Tape();
        core.t = t;

        for (var i = 0; i < 100; ++i) {

            var choice = Math.floor(Math.random()*4);

            switch (choice) {
            case 0:
                t.append(core.RED);
                break;
            case 1:
                t.append(core.BLUE);
                break;
            case 2:
                t.append(core.GREEN);
                break;
            case 3:
                t.append(core.YELLOW);
            default:
                t.append(core.RED);
            }

        }

        if (t.head() == core.EMPTY) {
            t.pop();
        }

        var paper = Snap(640, 640);
        paper.appendTo(document.getElementById("main"));


        var field = new core.TapeView(paper, 0, 0, 400, 20);
        field.drawTape(t);

        var grid = new core.GridView(paper, 0, 30, 560, 560, 10, 10);

        grid.drawGrid();

        //var p = program.readLegacyProgramString("lvl=32&code=c12:4f3;c12:5f3;p12:6f0;c11:6f3;c11:7f3;c11:8f3;c11:9f3;c11:10f3;c11:11f2;&ctm=N1;N2;bbr:x|rrb:x;9;3;1;");
        var p = program.readLegacyProgramString("lvl=32&code=c10:4f0;c11:4f1;c12:4f2;c13:4f3;p10:5f0;p11:5f1;p12:5f2;p13:5f3;p10:6f4;p11:6f5;p12:6f6;p13:6f7;q10:7f0;q11:7f1;q12:7f2;q13:7f3;q10:8f4;q11:8f5;q12:8f6;q13:8f7;&ctm=N1;N2;bbr:x|rrb:x;9;3;0;");

        var myInterpreter = new interpreter.Interpreter();
        myInterpreter.setProgram(p);
        myInterpreter.setTape(t);

        var token = paper.circle(0, 0, 10);
        token.attr({fill: "#E0E"});

        drawProgram(paper, p, grid);

        myInterpreter.start();
        field.drawTape(t);

        function mainLoop() {

            var curPos = myInterpreter.position;
            token.transform(grid.getCellMatrix(curPos.x, curPos.y).toTransformString());

            myInterpreter.step();
            curPos = myInterpreter.position;

            var update = function() {
                token.animate(
                    {transform:
                     grid.getCellMatrix(curPos.x, curPos.y).toTransformString()
                    },
                    500,
                    mina.linear,
                    function() {
                        field.drawTape(t);
                        mainLoop();
                    }
                );
            };

            setTimeout(update, 100);
        }

        mainLoop();
    });

};


function drawProgram(paper, program, grid) {
    console.log(program);
    for (var x = 0; x < program.cols; ++x) {
        for (var y = 0; y < program.rows; ++y) {
            var c = program.getCell(x, y);

            if (c.type != "Empty") {

                var image = graphics.getGraphic(c.type);

                if (image) {

                    paper.append(image);

                    var group = paper.g(image);

                    var corner = grid.getCellMatrix(x, y, true)
                        .toTransformString()
                        .toUpperCase();

                    var o = c.orientation;
                    
                    var transform = Snap.matrix(o.a, o.b, o.c, o.d, 0, 0);
                    var tstring = view.toTransformString(transform);

                    group.transform(
                        tstring + corner
                    );

                    var marker = paper.circle(0, 0, 2);
                    marker.attr({fill: "#0F0"});
                    marker.transform(corner);

                }
            }
        }
    }
}


