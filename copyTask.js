'use strict';

var gulp = require('gulp');
var newer = require('gulp-newer');

/**
 * Builds a function that makes it easy to create gulp copy tasks
 * @param  {Array<string>} defaultTasks Array into which to push tasks that are created by this fn
 * @param  {Map<string,string>} paths object literal or map that maps names to paths
 * @param  {String} defaultDest  The glob path that is the default destination when one is not provided
 * @return {fn(name,dest)}              A function taking the task name and an optional destination that
 *                                      creates copy tasks
 */
module.exports = function(defaultTasks, paths, defaultDest) {
  if (!Array.isArray(defaultTasks)) {
    throw new Error('defaultTasks needs to be an array');
  }
  if (paths === undefined) {
    throw new Error('paths should be object literal to look names up in and find input paths');
  }
  if (defaultDest === undefined) {
    throw new Error('defaultDest should be a string output path to be used by default when not ' +
      'specified or available in the paths map');
  }
  return function copyTask(name, dest) {
    if (dest === undefined) {
      if (paths.hasOwnProperty(name + 'Out')) {
        dest = paths[name + 'Out'];
      } else {
        dest = defaultDest;
      }
    }
    gulp.task(name, function() {
      return gulp.src(paths[name])
        .pipe(newer(dest))
        .pipe(gulp.dest(dest));
    });
    defaultTasks.push(name);
  };
};
