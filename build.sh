#!/usr/bin/env bash

# Types definitions in 0.9.0 are wrong so let's get rid of them.
find node_modules/@opengsn/gsn/dist -name "*.ts" -exec rm "{}" +

rm -rf lib tmp browser
npx tsc

# I have no clue why browserify doesn't do its magic if the source js file is
# in the path specified in package.json:main. For this reason `lib` is
# temporary renamed to `tmp`.
mv lib tmp

mkdir -p browser
# About the tr -dc: something nasty here that I still don't know how it can happen.
npx browserify tmp/index.js --standalone etherea\
    | tr -dc '\0-\177'\
    | npx derequire\
    | npx terser\
    > browser/bundle.min.js

# Move `tmp` back to its original position.
mv tmp lib