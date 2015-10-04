

System.config({
    map: {
        "signals.js": 'libs/js-signals/dist/signals.min.js'
    }
});

window.addEventListener("load", function() {
    console.log("Loading");
    System.import('app').then(function(App) {
        var app = new App.default(748, 524);
        app.main();
    });
});
