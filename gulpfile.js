// node modules
const path = require('path');

// npm modules
const gulp = require('gulp');
const pump = require('pump');

// gulp modules
const babel = require('gulp-babel');
const gutil = require('gulp-util');
const less = require('gulp-less');
const watch = require('gulp-watch');

const paths = {
    react: {
        src: './react/build/**/*.js',
        out: './resources/reactjs'
    },
    less: {
        src: './less/main.less',
        out: './resources/style',
        imp: './less/imports/**/*.less'
    }
}

function logStream(err,name) {
    if(err) {
        gutil.log(gutil.colors.red('ERROR stream:'),name);
        gutil.log(err.message);
        gutil.log(err.stack);
    } else {
        gutil.log(gutil.colors.green('completed stream:'),name);
    }
}

function buildReact() {
    gutil.log('starting stream: react');
    pump([
        gulp.src(paths.react.src),
        babel({
            presets: ['react']
        }),
        gulp.dest(paths.react.out)
    ],(err) => {
        logStream(err,'react');
    });
}

function buildLess() {
    gutil.log('starting steam: less');
    pump([
        gulp.src(paths.less.src),
        less({
            paths: paths.less.imp
        }),
        gulp.dest(paths.less.out)
    ],(err) => {
        logStream(err,'less');
    });
}

gulp.task('build-react',() => {
    buildReact();
});

gulp.task('build-less',() => {
    buildLess();
});

gulp.task('watch-react',() => {
    return watch(paths.react.src,() => buildReact());
});

gulp.task('watch-less',() => {
    return watch([paths.less.src,paths.less.imp],() => buildLess());
})

gulp.task('default',['build-react','build-less','watch-react','watch-less']);
