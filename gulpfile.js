/*global require: true */

var gulp = require('gulp');
var plumber = require('gulp-plumber');
var babel = require('gulp-babel');
var sourceMaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var runSeq = require('run-sequence');
var del = require('del');
var connect = require('gulp-connect');

var dir = {
    index: ['./index.html', 'main.js'],
    sourceDir: './',
    source: ['./*.js', '!./gulpfile.js', '!main.js'],
    lib: ['!*.json',
          'libs/**/*.js',
          'node_modules/systemjs/dist/system.js',
          'node_modules/mathjs/dist/math.js'
	 ],
    libOut: './dist/libs',
    fonts: 'fonts/**/*',
    fontsOut: 'dist/fonts',
    foundation: 'js/**/*',
    foundationOut: 'dist/js',
    img: './img/**/*.svg',
    imgOut: './dist/img/',
    css: './css/*',
    cssOut: './dist/css',
    build: './dist'
};

var staticCopyTasks = [];
var copyTask = require('./copyTask')(staticCopyTasks, dir, dir.build);

copyTask('index');
copyTask('img');
copyTask('lib');
copyTask('css');
copyTask('foundation');
copyTask('fonts');

gulp.task('clean-build', function(done) {
    del(dir.build).then(function(){done();});
});

gulp.task('copy-static', function(callback) {
    runSeq(staticCopyTasks, callback);
});

gulp.task('compileApp', function() {

    var babelOptions = {
	modules: 'system',
	moduleIds: true
    };


    return gulp.src(dir.source, {
	base: dir.sourceDir
    })
	.pipe(plumber())
	.pipe(sourceMaps.init())
	.pipe(babel(babelOptions))
    //.pipe(concat('all.js'))
	.pipe(sourceMaps.write('.', {sourceMappingURLPrefix: ''}))
        .pipe(gulp.dest(dir.build));
});

gulp.task('watch', function() {
    return gulp.watch([dir.source, dir.lib, dir.index], ['build-dev']);
});

gulp.task('connect', function() {
    return connect.server({
	root: dir.build,
	livereload: false,
	host: 'localhost',
        port: 8081
    });
});

gulp.task('build-dev', function(cb) {
    runSeq('clean-build', 'copy-static', ['compileApp'], cb);
});

gulp.task('default', function(cb) {
    runSeq('build-dev', ['watch', 'connect'], cb);
});
