# Contribution

This article explains how to build an development environment.

## Prerequisite

- Node.js 14.0.x or later and NPM
- [TFS Cross Platform Command Line Interface(tfx-cli)](https://github.com/microsoft/tfs-cli) 0.9.3 or latter
- [Typescript](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html) 4.4.4 or latter

## installation

Clone this repo. Then install the npm packages.

```shell
npm install
```

## npm commands

### Build

Compile the TypeScript files to the js file.

```shell
npm run build
```

### Pack

Compile and Pack the code to the task directory

```shell
npm run pack
```

### Create

Compile, Pack and Create an extension `vsix` file.

```shell
npm run create
```

### Test

Currently Not Supported, however, it is coming soon.
