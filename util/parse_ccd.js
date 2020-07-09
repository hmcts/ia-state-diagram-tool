const fs = require('fs');

function readInCcdFile(fileName) {
  const rawData = fs.readFileSync(fileName);
  return JSON.parse(rawData);
}

function parseCCD(baseDir, ignoredStates, ignoredEvents, roles, hideUnauthorisedEvents) {
  const events = readInCcdFile(baseDir + '/CaseEvent.json');
  const eventAuthorisations = readInCcdFile(baseDir + '/AuthorisationCaseEvent.json');
  const stateAuthorisations = readInCcdFile(baseDir + '/AuthorisationCaseState.json');

  const output = [];

  events.forEach(event => {
    const preConditionStates = event['PreConditionState(s)'];
    const postConditionStates = event['PostConditionState'];
    const eventName = event.ID;

    const preConditionSatesArray = preConditionStates ? preConditionStates.split(';') : [ '[*]' ];

    preConditionSatesArray.forEach(preConditionState => {
      const newPreConditionState = preConditionState === '*' ? 'allStates' : preConditionState;
      const postConditionState = postConditionStates === '*' ? newPreConditionState : postConditionStates;

      if (includeState(newPreConditionState, postConditionState, ignoredStates)) {
        if (includeEvent(eventName, ignoredEvents)) {
          output.push({
            "from": newPreConditionState,
            "to": postConditionState,
            "text": eventName
          })
        }
      }
    });
  });

  const outputForRole = (roles.length > 0) ? output.filter(event => {
    return event.text === 'start' || eventAuthorisations.some(eventAuthorisation => {
      return eventAuthorisation.CaseEventID === event.text &&
        roles.indexOf(eventAuthorisation.UserRole) >= 0 && eventAuthorisation.CRUD.indexOf('C') >= 0;
    });
  }) : output;

  const outputForRoleReadOnly = (roles.length > 0) ? output.filter(event => {
    return event.text === 'start' || eventAuthorisations.some(eventAuthorisation => {
      return eventAuthorisation.CaseEventID === event.text &&
        roles.indexOf(eventAuthorisation.UserRole) >= 0 && eventAuthorisation.CRUD.indexOf('C') == -1;
    });
  }) : [];

  const outputNotForRole = (roles.length > 0) ? output.filter(event => {
    return eventAuthorisations.some(eventAuthorisation => {
      return eventAuthorisation.CaseEventID === event.text &&
        roles.indexOf(eventAuthorisation.UserRole) === -1 &&
        outputForRole.indexOf(event) === -1;
    });
  }) : [];

  const combinedLinks = {};
  outputForRole.forEach(link => {
    combinedLinks[`${link.from} --> ${link.to}`] = combinedLinks[`${link.from} --> ${link.to}`] ?
      combinedLinks[`${link.from} --> ${link.to}`] + `\\n ${link.text}` :
      link.text;
  });

  const combinedLinksReadOnly = {};
  outputForRoleReadOnly.forEach(link => {
    combinedLinks[`${link.from} --> ${link.to}`] = combinedLinks[`${link.from} --> ${link.to}`] ?
      combinedLinks[`${link.from} --> ${link.to}`] + `\\n ${link.text} (read only)` :
      `${link.text} (read only)`;
  });

  if (!hideUnauthorisedEvents) {
    const combinedLinksNotForRole = {};
    outputNotForRole.forEach(link => {
      combinedLinks[`${link.from} --> ${link.to}`] = combinedLinks[`${link.from} --> ${link.to}`] ?
        combinedLinks[`${link.from} --> ${link.to}`] + `\\n <strike>${link.text}</strike>` :
        ` <strike>${link.text}</strike>`;
    });
  }

  let authorisedStates = [];
  let unauthorisedStates = [];
  if (roles.length > 0) {
    stateAuthorisations.forEach(stateAuthorisation => {
      if (ignoredStates.indexOf(stateAuthorisation.CaseStateID) === -1) {
        if (roles.indexOf(stateAuthorisation.UserRole) === -1) {
          unauthorisedStates.push(stateAuthorisation.CaseStateID);
        } else {
          authorisedStates.push(stateAuthorisation.CaseStateID);
        }
      }
    });
  }

  unauthorisedStates = unauthorisedStates.filter(unauthorisedState => authorisedStates.indexOf(unauthorisedState) === -1);
  unauthorisedStates = [...new Set(unauthorisedStates)];

  var plantUmlString = '@startuml\n';
  plantUmlString += 'hide empty description\n';
  plantUmlString += 'skinparam state {\n' +
    '  BackgroundColor<<allStates>> DeepSkyBlue\n' +
    '  BackgroundColor<<noPermission>> Gainsboro\n' +
    '  FontColor<<noPermission>> Gray\n' +
    '}\n' +
    'state "All states" as allStates <<allStates>>\n';

  unauthorisedStates.forEach(unauthorisedState => plantUmlString += `state ${unauthorisedState} <<noPermission>>\n`);

  if (roles.length > 0) {
    plantUmlString += `state "State diagram for ${roles.join(", ")}"\n`; // force this to be a state diagram
  }
  Object.keys(combinedLinks).forEach(function (item) {
    plantUmlString += `${item} : ${combinedLinks[item]}\n`;
  });

  plantUmlString += '@enduml\n\n';

  //fs.writeFileSync(outputFile, plantUmlString);
  return plantUmlString;
}

function arrayDoesNotMatch(eventName, ignoredEvents) {
  return !ignoredEvents.some(ignoredEvent => new RegExp('^' + ignoredEvent + '$').test(eventName));
}

function includeEvent(eventName, ignoredEvents) {
  return arrayDoesNotMatch(eventName, ignoredEvents);
}

function includeState(preConditionState, postConditionState, ignoredStates) {
  return arrayDoesNotMatch(preConditionState, ignoredStates) && arrayDoesNotMatch(postConditionState, ignoredStates)
}

module.exports = {
  parseCCD
};
