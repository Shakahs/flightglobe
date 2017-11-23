require('dotenv').config();
const gulp = require('gulp');
const shell = require('gulp-shell');
const nodemon = require('gulp-nodemon');
const runSequence = require('run-sequence');
const DSNParser = require('dsn-parser');

gulp.task('nodemon', () => {
  const stream = nodemon({ // eslint-disable-line no-unused-vars
    script: 'server/index.js',
    watch: ['*.*'],
  });
});

gulp.task('default', ['nodemon']);
