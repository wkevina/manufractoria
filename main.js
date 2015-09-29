

System.config({
    map: {
        signals: '//libs/js-signals/dist/signals.min.js'
    }
});

System.import("App").then(function(App) {
    var app = new App();
    app.main();
});
