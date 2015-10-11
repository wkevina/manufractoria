

System.config({
    map: {
        "signals.js": 'libs/js-signals/dist/signals.min.js'
    }
});

window.addEventListener("load", function() {
    console.log("Loading");

    if (window.navigator.standalone == true) {
        $(".hide-fullscreen").addClass("hide");
    }

    System.import('app').then(function(App) {
        var vertical_resolution = 524,

            aspect_ratio = 1.775,

            horizontal_resolution = vertical_resolution * aspect_ratio;

        var app = new App.default(horizontal_resolution, vertical_resolution);
        app.main();
    });
});
