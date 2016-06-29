const gulp = require('gulp');
const babel = require('gulp-babel');
const less = require('gulp-less');
const gutil = require('gulp-util');
const plumber = require('gulp-plumber');
const path = require('path');

const paths = {
    jsx: "./build/react/**/*.js",
    less: ["./build/less/main.less",'./build/less/**/*.less'],
}

gulp.task('build-react',() => {
    return gulp.src(paths.jsx)
        .pipe(plumber({
            errorHandler:(err) => {
                gutil.log(gutil.colors.red("ERROR in jsx file"));
                gutil.log(err.message,"\n",err.codeFrame);
            }
        }))
        .pipe(babel({
            presets: ['react']
        }))
        .pipe(plumber.stop())
        .pipe(gulp.dest('./gui'))
});

gulp.task('build-less',() => {
    return gulp.src(paths.less[0])
        .pipe(plumber({
            errorHandler:(err) => {
                gutil.log(gutil.colors.red("ERROR in less file"));
                gutil.log(err.message,"\n",err.codeFrame);
            }
        }))
        .pipe(less({
            paths:[path.join(__dirname,'build','less','imports')]
        }))
        .pipe(plumber.stop())
        .pipe(gulp.dest('./gui'));
});

gulp.task('watch',() => {
    gulp.watch(paths.jsx,['build-react']);
    gulp.watch(paths.less,['build-less']);
});

gulp.task('default',['watch','build-react','build-less']);
