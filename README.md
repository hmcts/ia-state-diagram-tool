#### Create state diagram

A tool to create a state diagram based in the JSON ccd definition for s project.

You will need java and node installed to run this tool.

Also if you get errors you may need to read the following.
NB. State diagram is produced using plantUml which needs Graphviz see this pages for details and to troubleshoot
https://plantuml.com/graphviz-dot 

To run the tool standalone clone this repo and run 

```
./generate_state_diagram.sh [path to ccd def]
```

This will generate an image in the current directory called state_diagram.png.

For more info on other options run

```
./generate_state_diagram.sh -h
```

. If you just want to generate a state diagram for a set of roles
set the environment variable ROLES and a comma separated list of roles.

```
ROLES=role1,role2 yarn create-state-diagram
```


