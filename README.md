# Create state diagram

A tool to create a state diagram based in the JSON ccd definition for s project.

You will need the following installed to run this tool
- java
- node

:warning: **If you get errors you may need to read the following.** State diagram is produced using plantUml
which needs Graphviz see this pages for details and to troubleshoot https://plantuml.com/graphviz-dot

## Running standalone

To run the tool standalone clone this repo and run 

```
./generate_state_diagram.js [path to ccd def]
```

This will generate an image in the current directory called state_diagram.png.

For more info on other options run

```
./generate_state_diagram.js -h
```

## Running with yarn as part of another project
This can also be added to another project. Add this module with

```
yarn add @hmcts/ia-state-diagram-tool
```

You can then use it by adding to your package.js file

```
"scripts": {
    ...
    "create-state-diagram": "generateStateDiagram ./definitions/appeal/json/"
  },
```
