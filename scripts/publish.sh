#!/bin/bash

# fail immediately when any script fails
set -e

# change to project root
cd $(dirname $0)/..

# Build project
npm run build:lib

# Go to build output directory
cd $(dirname $0)/../dist/mdx-rxjs

# see https://stackoverflow.com/a/8935401/1396477
hash -r

# Make it possible to install this version using `npm i -S @healthcatalyst/mdx-rxjs@latest`
npm config set tag latest

# Authorize the publish
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" >> ~/.npmrc

# Publish the package
npm publish
