const gulp = require('gulp');
const clean = require('gulp-clean');
const ts = require('gulp-typescript');
const tsProject = ts.createProject('tsconfig.json');

gulp.task('prod', () => {
  return tsProject.src()
  .pipe(tsProject())
  .pipe(gulp.dest('./dist'));
});

gulp.task('clean', () => {
  return gulp.src('./dist', { read: false, allowEmpty: true }).pipe(clean());
});

gulp.task('default', gulp.series('clean', 'prod'));
