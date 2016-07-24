require('babel-core/register');
require('regenerator-runtime/runtime');

var gulp = require('gulp');
var browserify = require('browserify');
var babel = require('gulp-babel');
var babelify = require('babelify');
var source = require('vinyl-source-stream');
var nodemon = require('gulp-nodemon');
var yargs = require('yargs');
var argv = require('yargs').argv;
var envify = require('envify/custom');
var mocha = require('gulp-mocha');
var eslint = require('gulp-eslint');

function restart_nodemon () {
    if (nodemon_instance) {
        console.log("Restarting nodemon");
        nodemon_instance.emit('restart');
    } else {
        console.log("Nodemon isntance not ready yet")
    }

}

gulp.task('test', function() {
    return gulp.src('test/**/*.js', {read: false})
        // gulp-mocha needs filepaths so you can't have any plugins before it
        .pipe(mocha({
            reporter: 'dot',
            timeout: 20000
        }))
        .once('error', function (e) {
            console.log(e);
            process.exit(1);
        })
        .once('end', function () {
            process.exit();
        });;
});

gulp.task('lint', function () {
    // ESLint ignores files with "node_modules" paths.
    // So, it's best to have gulp ignore the directory as well.
    // Also, Be sure to return the stream from the task;
    // Otherwise, the task may end before the stream has finished.
    return gulp.src(['./src/**/*.js*'])
        // eslint() attaches the lint output to the "eslint" property
        // of the file object so it can be used by other modules.
        .pipe(eslint())
        // eslint.format() outputs the lint results to the console.
        // Alternatively use eslint.formatEach() (see Docs).
        .pipe(eslint.format())
        // To have the process exit with an error code (1) on
        // lint error, return the stream and pipe to failAfterError last.
        .pipe(eslint.failAfterError());
});


gulp.task('babel-server', function() {

    gulp.src('src/index.js')
        .pipe(babel())
        .on('error', function(err) {
            console.log('Babel server:', err.toString());
        })
        .pipe(gulp.dest('app'));

    gulp.src('src/server/**/*.*')
        .pipe(babel())
        .on('error', function(err) {
            console.log('Babel server:', err.toString());
        })
        .pipe(gulp.dest('app/server'))
        .on('end',function() {
            restart_nodemon();
        });
});


var envify_params = {
    DOMAIN:"wrioos.com"
};
console.log(argv);
if (argv.docker) {
    console.log("Got docker param");
    envify_params['DOMAIN'] = "wrioos.local"
}

gulp.task('babel-client', function() {
    browserify({
            entries: './src/client/js/client.js',
            debug: true
        })
        .transform(babelify)
        .transform(envify(envify_params))
        .bundle()
        .pipe(source('client.js'))
        .pipe(gulp.dest('app/client'))
        .on('end',function() {
            restart_nodemon();
        });
});

gulp.task('views', function() {
    gulp.src('src/client/views/**/*.*')
        .pipe(gulp.dest('app/client/views'));

    gulp.src('hub/index.html')
        .pipe(gulp.dest('app/hub'));
});

var nodemon_instance;

gulp.task('nodemon', function() {

    if (!nodemon_instance) {
        nodemon_instance = nodemon({
            script: 'server.js',
            watch: 'src/__manual_watch__',
            ext: '__manual_watch__',
            verbose: false,
        }).on('restart', function() {
            console.log('~~~ restart server ~~~');
        });
    } else {
        nodemon_instance.emit('restart');
    }

});

gulp.task('default', ['lint','babel-server', 'babel-client', 'views']);

gulp.task('watch', ['default', 'nodemon'], function() {
    gulp.watch(['src/index.js', 'src/server/**/*.*'], ['babel-server']);
    gulp.watch('src/client/js/**/*.*', ['babel-client']);
    gulp.watch('src/client/views/**/*.*', ['views']);
});
