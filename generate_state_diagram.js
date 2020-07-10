#!/usr/bin/env node

const exec = require('child_process').exec;
const fs = require('fs');
const minimist = require('minimist');
const parseCCD = require('./util/parse_ccd');

const options = {
  alias: {
    o: 'output',
    s: 'ignoredStates',
    e: 'ignoredEvents',
    r: 'roles',
    u: 'hideUnauthorised',
    h: 'help'
  },
  default: {
    o: 'state_diagram',
    u: false
  }
};
const argv = minimist(process.argv.slice(2), options);

function printHelp() {
  console.log('Usage ./generate_state_diagram.js [path to ccd def] [options]');
  console.log('');
  console.log('where options include:');
  console.log('    -o, --output=...        file to output state diagram to');
  console.log('    -s, --ignoredStates=... comma seperated list of states to ignore, can be a regex that matches the whole state name');
  console.log('    -e, --ignoredEvents=... comma seperated list of events to ignore, can be a regex that matches the whole event name');
  console.log('    -r, --roles=...         comma seperated list of roles to build the diagram for');
  console.log('    -u, --hideUnauthorised  hide any events that a user is unauthorised to run or see');
  console.log('    -h, --help              to display this help message');
}

function splitInput(input) {
  return input ? input.split(',') : [];
}

const help = argv.h;
if (help) {
  printHelp();

  process.exit(0);
}
if (argv._.length !== 1) {
  console.log('Invalid usage');
  printHelp();

  process.exit(1);
}
const definitionLocation = argv._[0];
const outputFile = argv.o;
const ignoredStates = splitInput(argv.s);
const ignoredEvents = splitInput(argv.e);
const roles = splitInput(argv.r);
const hideUnauthorised = argv.u;

console.log(`Output file       [${outputFile}]`);
console.log(`Ignored states    [${ignoredStates}]`);
console.log(`Ignored events    [${ignoredEvents}]`);
console.log(`Roles             [${roles}]`);
console.log(`Hide unauthorised [${hideUnauthorised}]`);

const stateDiagram = parseCCD(
  definitionLocation,
  ignoredStates,
  ignoredEvents,
  roles,
  hideUnauthorised
);

const outputFileName = `${outputFile}.txt`;
fs.writeFileSync(outputFileName, stateDiagram);
exec(`java -jar ${__dirname}/lib/plantuml.jar ${outputFileName}`, (error, stdout, stderr) => {
  if (error) {
    console.log(`error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.log(`stderr: ${stderr}`);
    return;
  }
  fs.unlinkSync(`./${outputFileName}`);
});

