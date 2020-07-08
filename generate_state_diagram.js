const { parseCCD } = require('./util/parse_ccd');

const stateDiagram = parseCCD(process.argv[2], process.argv[3].split(','), process.argv[4].split(','), process.argv[5].split(','));

console.log(stateDiagram);
