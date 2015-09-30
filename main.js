

System.config({
    map: {
        "signals.js": 'libs/js-signals/dist/signals.min.js'
    }
});

System.defaultJSExtensions = true;

window.addEventListener("load", function() {
    console.log("Loading");
    System.import('app.js').then(function(App) {
        var app = new App.default();
        app.main();
    });
});
