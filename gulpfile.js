const mustache = require("gulp-mustache");
const { promisify } = require("util");
const less = require("gulp-less");
const gulp = require("gulp");
const path = require("path");
const fs = require("fs");
const browserSync = require('browser-sync').create();
const plumber = require('gulp-plumber');
const autoprefixer = require('gulp-autoprefixer');
const cssnano = require('gulp-cssnano');
const htmlmin = require('gulp-htmlmin');
const rename = require("gulp-rename");
const htmlreplace = require('gulp-html-replace');
const concat = require('gulp-concat');
const clean = require('gulp-clean');
const svgo = require('gulp-svgo');
const gulpSequence = require('gulp-sequence');

const readFile = promisify(fs.readFile);

const SRC_FOLDER = "./src";
const DESTINATION_FOLDER = "./docs";

const STYLE_PATH_SRC = SRC_FOLDER + "/styles/**/*.less";
const DATA_PATH = SRC_FOLDER + "/data/db.json";
const HTML_PATH = SRC_FOLDER + "/**/*.mustache";

const IMAGE_FOLDER_SRC = SRC_FOLDER + "/images/*.*";
const IMAGE_FOLDER_DESTINATION = DESTINATION_FOLDER + "/images";

gulp.task("watch", () => {
    gulp.watch(IMAGE_FOLDER_SRC, ["images"]);
    gulp.watch(STYLE_PATH_SRC, ["less"]);
    gulp
        .watch([DATA_PATH, HTML_PATH], ["mustache"])
        .on('change', browserSync.reload);
});

gulp.task("images", () => {
    gulp
        .src(IMAGE_FOLDER_SRC)
        .pipe(plumber())
        .pipe(svgo())
        .pipe(gulp.dest(IMAGE_FOLDER_DESTINATION))
});

gulp.task("clean", () => gulp.src('./docs').pipe(clean()) );

gulp.task("less", () =>
    gulp
        .src(STYLE_PATH_SRC)
        .pipe(plumber())
        .pipe(
            less({paths: [path.join(__dirname, "less", "includes")]})
        )
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(concat('styles.min.css'))
        .pipe(cssnano())
        .pipe(gulp.dest(DESTINATION_FOLDER))
        .pipe(browserSync.stream())
);

gulp.task("mustache", async () => {
    const data = JSON.parse(await readFile(DATA_PATH, "utf-8"));
    return gulp
        .src(HTML_PATH)

        .pipe(plumber())
        .pipe(mustache(data))
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(htmlreplace({
            'css': 'styles.min.css'
        }))
        .pipe(rename( path => {
            path.extname = ".html"
        }))
        .pipe(gulp.dest(DESTINATION_FOLDER));
});


gulp.task('browser-sync', function() {
    browserSync.init({
        server: DESTINATION_FOLDER
    });
});

gulp.task("default", gulpSequence(
    "clean",
    ["images", "less", "mustache", "browser-sync"],
    "watch"
));