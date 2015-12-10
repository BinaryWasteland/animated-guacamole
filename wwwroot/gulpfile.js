// use this to trigger code in a production environment or in a dev environment
var dev = true;

var gulp = require('gulp'),
  gp_concat = require('gulp-concat'),
  gp_rename = require('gulp-rename'),
  gp_uglify = require('gulp-uglify'),
  gp_plumber = require('gulp-plumber'),
  // gp_ngAnnotate = require('gulp-ng-annotate'),
  gp_bundler = require('gulp-bundle-assets'),
  gp_rimraf = require('gulp-rimraf'),
  gp_util = require('gulp-util'),
  gp_inject = require('gulp-inject'),
  gp_series = require('stream-series'),
  argv = require('yargs').alias('d', 'dev').argv;

// configure which files to watch and what tasks to use on file changes
gulp.task('watch', watchTask);

// Default call to gulp
gulp.task('default', ['watch', 'ugly'], function() {});

// Use this when wanting to do a push to production
gulp.task('prodrun', ['ugly', 'bundle'], productionRunTask);

// uglify, mangle and such to all of our custom code
gulp.task('ugly', ['index'], uglyTask);

// Make sure the app.min.js is removed so we dont build on it
gulp.task('clean', cleanTask);

// used to inject items into the index.html page
gulp.task('index', indexTask);

// Bundle all of our bower componet items into one
gulp.task('bundle', bundleTask);

// related to gulp.task prodrun
function productionRunTask() {
  //uglyTask();
  indexTask();
}

// related to gulp.task ugly
function uglyTask() {
  return gulp.src([
      'app/web/**/*.js',
      'app/web/*.js',
      '!app/web/**/*.min.js',
      '!app/web/*.min.js'
    ])
    .pipe(gp_plumber({
      errorHandler: my_error_handler
    }))
    .pipe(gp_concat('app.min.js'))
    // .pipe(gp_ngAnnotate())
    .pipe(gp_uglify())
    .pipe(gulp.dest('app/web'));
}

// related to gulp.task clean
function cleanTask() {
  if (!argv.dev) {
    return gulp.src('app/web/app.min.js', {
        read: false
      })
      .pipe(gp_plumber({
        errorHandler: my_error_handler
      }))
      .pipe(gp_rimraf({
        force: true
      }));
  } else {
    // return gulp.src('app/web/app.min.js', {
    //     read: false
    //   })
    //   .pipe(gp_plumber({
    //     errorHandler: my_error_handler
    //   }))
    //   .pipe(gp_rimraf({
    //     force: true
    //   }));
  }
}

function cleanBundleTask() {
  return gulp.src(['assets/libs/bundles/vendor-*.js'], {
      read: false
    })
    .pipe(gp_plumber({
      errorHandler: my_error_handler
    }))
    .pipe(gp_rimraf({
      force: true
    }));
}

// related to gulp.task index
function indexTask() {
  var target = gulp.src(['./index.html']);
  // It's not necessary to read the files (will speed up things), we're only after their paths:
  var appDevStream = gulp.src(['app/web/**/*.js',
    'app/web/*.js',
    '!app/web/**/*.min.js',
    '!app/web/*.min.js'
  ], {
    read: false
  });
  var appProdStream = gulp.src([
    'app/web/*.min.js'
  ], {
    read: false
  });
  vendorDevStream = gulp.src([

  ], {
    read: false
  });
  vendorProdStream = gulp.src([
    'assets/libs/bundles/vendor-*.js'
  ], {
    read: false
  });
  if (argv.dev) {
    return target.pipe(gp_inject(gp_series(vendorDevStream, appDevStream), {
        relative: true
      }))
      .pipe(gulp.dest('./'));
  } else {
    return target.pipe(gp_inject(gp_series(vendorProdStream, appProdStream), {
        relative: true
      }))
      .pipe(gulp.dest('./'));
  }

}

// related to gulp.task watch
function watchTask() {
  if (argv.dev) {
    gulp.watch([
      'app/web/**/*.js',
      'app/web/*.js',
      '!app/web/**/*.min.js',
      '!app/web/*.min.js'
    ], ['index']);
  } else {
    gulp.watch([
      'app/web/**/*.js',
      'app/web/*.js',
      '!app/web/**/*.min.js',
      '!app/web/*.min.js'
    ], ['ugly', 'index']);
  }
}

// related to gulp.task bundle
function bundleTask() {
  cleanBundleTask();
  return gulp.src('./bundle.config.js')
    .pipe(gp_plumber({
      errorHandler: my_error_handler
    }))
    .pipe(gp_bundler())
    .pipe(gulp.dest('./assets/libs/bundles'));
}

// Error handler which throws a beep and prints out 999 lines so it does not get out of hand
my_error_handler = function(err) {
  gp_util.beep();
  console.log('========================= ERROR! ========================');
  console.log(err.stack.substr(0, 999));
  console.log('=========================================================');
  return this.emit('end');
};
