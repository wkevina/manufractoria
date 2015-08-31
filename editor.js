
var editor = editor || {},
	core = core || {},
    program = program || {},
    interpreter = interpreter || {},
    graphics = graphics || {},
    view = view || {},
    tmath = tmath || {},
	codeCell = codeCell || {};

function Palette(paper, x, y) {
	this.paper = paper;
	this.x = x;
	this.y = y;
	this.tiles = paper.g();

	// Get names of all types to draw
	this.typesToDraw = Object.keys(codeCell.codeCells);

	this.tiles.transform(Snap.matrix().translate(x, y));
	this.drawPalette();
}

Palette.prototype.drawPalette = function drawPalette() {
	this.tiles.clear();

	var cellImages = this.typesToDraw.map(function(name) {
		var image = graphics.getGraphic(name);
		if (image != null) return {name:name, image:image};
		else return undefined;

	}).filter(_.negate(_.isUndefined));

	cellImages.map(function(image, index){
		this.paper.append(image.image);
		var group = this.tiles.g();
		var transform = Snap.matrix().translate(0, index*(56));
		group.transform(transform.toTransformString());

		var r = group.rect(0, 0, 56, 56);
		r.attr({stroke: "#333", fill: "#fff"});

		group.append(image.image);
//		group.attr();

		var title = Snap.parse('<title>'+image.name+'</title>');
		group.append(title);
	}, this);
};

var startEditor = function() {

    graphics.preload().then(function() {
		var paper = Snap(640, 640);
		paper.appendTo(document.getElementById("main"));
		var palette = new Palette(paper, 10, 30);
    });

};
