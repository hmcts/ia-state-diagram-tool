#### Create state diagram

A tool to create a state diagram based in the JSON ccd definition for s project.

You will need java and node installed to run this tool.

**If you get errors you may need to read the following.** State diagram is produced using plantUml
which needs Graphviz see this pages for details and to troubleshoot https://plantuml.com/graphviz-dot

To run the tool standalone clone this repo and run 

```
./generate_state_diagram.sh [path to ccd def]
```

This will generate an image in the current directory called state_diagram.png.

For more info on other options run

```
./generate_state_diagram.sh -h
```

