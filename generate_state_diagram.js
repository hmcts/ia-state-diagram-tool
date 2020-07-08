const { parseCCD } = require('./util/parse_ccd');

function splitInput(input) {
  return input ? input.split(',') : [];
}

const stateDiagram = parseCCD(process.argv[2], splitInput(process.argv[3]), splitInput(process.argv[4]), splitInput(process.argv[5]), process.argv[6] === 'true');

console.log(stateDiagram);
