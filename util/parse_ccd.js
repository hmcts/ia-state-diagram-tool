const fs = require('fs');

function readInCcdFile(fileName) {
  const rawData = fs.readFileSync(fileName);
  return JSON.parse(rawData);
}

function arrayDoesNotMatch(eventName, ignoredEvents) {
  return !ignoredEvents.some(ignoredEvent => {
    return new RegExp(`^${ignoredEvent}$`).test(eventName);
  });
}

function includeEvent(eventName, ignoredEvents) {
  return arrayDoesNotMatch(eventName, ignoredEvents);
}

function includeState(preConditionState, postConditionState, ignoredStates) {
  return arrayDoesNotMatch(preConditionState, ignoredStates) && arrayDoesNotMatch(postConditionState, ignoredStates);
}

function combineLinks(linksToCombine, combinedLinks, displayTextFunction) {
  linksToCombine.forEach(link => {
    const linkKey = `${link.from} --> ${link.to}`;
    const displayText = ` ${displayTextFunction(link.text)}`;
    combinedLinks[linkKey] = combinedLinks[linkKey] ? `${combinedLinks[linkKey]}\\n${displayText}` : displayText;
  });
}

function createPlantUmlString(unauthorisedStates, roles, combinedLinks) {
  let plantUmlString = '@startuml\n';
  plantUmlString += 'hide empty description\n';
  plantUmlString += 'skinparam state {\n';
  plantUmlString += 'BackgroundColor<<allStates>> DeepSkyBlue\n';
  plantUmlString += '  BackgroundColor<<noPermission>> Gainsboro\n';
  plantUmlString += '  FontColor<<noPermission>> Gray\n';
  plantUmlString += '}\n';
  plantUmlString += 'state "All states" as allStates <<allStates>>\n';

  unauthorisedStates.forEach(unauthorisedState => {
    plantUmlString += `state ${unauthorisedState} <<noPermission>>\n`;
  });

  if (roles.length > 0) {
    // force this to be a state diagram
    plantUmlString += `state "State diagram for ${roles.join(', ')}"\n`;
  }
  Object.keys(combinedLinks).forEach(item => {
    plantUmlString += `${item} : ${combinedLinks[item]}\n`;
  });

  plantUmlString += '@enduml\n\n';
  return plantUmlString;
}

function parseCCD(baseDir, ignoredStates, ignoredEvents, roles, hideUnauthorisedEvents) {
  const events = readInCcdFile(`${baseDir}/CaseEvent.json`);
  const eventAuthorisations = readInCcdFile(`${baseDir}/AuthorisationCaseEvent.json`);
  const stateAuthorisations = readInCcdFile(`${baseDir}/AuthorisationCaseState.json`);

  const output = [];

  events.forEach(event => {
    const preConditionStates = event['PreConditionState(s)'];
    const postConditionStates = event.PostConditionState;
    const eventName = event.ID;

    const preConditionSatesArray = preConditionStates ? preConditionStates.split(';') : [ '[*]' ];

    preConditionSatesArray.forEach(preConditionState => {
      const newPreConditionState = preConditionState === '*' ? 'allStates' : preConditionState;
      const postConditionState = postConditionStates === '*' ? newPreConditionState : postConditionStates;

      if (includeState(newPreConditionState, postConditionState, ignoredStates)) {
        if (includeEvent(eventName, ignoredEvents)) {
          output.push({
            from: newPreConditionState,
            to: postConditionState,
            text: eventName
          });
        }
      }
    });
  });

  const outputForRole = (roles.length > 0) ? output.filter(event => {
    return event.text === 'start' || eventAuthorisations.some(eventAuthorisation => {
      return eventAuthorisation.CaseEventID === event.text && roles.indexOf(eventAuthorisation.UserRole) >= 0 && eventAuthorisation.CRUD.indexOf('C') >= 0;
    });
  }) : output;

  const outputForRoleReadOnly = (roles.length > 0) ? output.filter(event => {
    return event.text === 'start' || eventAuthorisations.some(eventAuthorisation => {
      return eventAuthorisation.CaseEventID === event.text && roles.indexOf(eventAuthorisation.UserRole) >= 0 && eventAuthorisation.CRUD.indexOf('C') === -1;
    });
  }) : [];

  const outputNotForRole = (roles.length > 0) ? output.filter(event => {
    return eventAuthorisations.some(eventAuthorisation => {
      return eventAuthorisation.CaseEventID === event.text && roles.indexOf(eventAuthorisation.UserRole) === -1 && outputForRole.indexOf(event) === -1;
    });
  }) : [];

  const combinedLinks = {};
  combineLinks(outputForRole, combinedLinks, text => {
    return `${text}`;
  });
  combineLinks(outputForRoleReadOnly, combinedLinks, text => {
    return `${text} (read only)`;
  });
  if (!hideUnauthorisedEvents) {
    combineLinks(outputNotForRole, combinedLinks, text => {
      return `<strike>${text}</strike>`;
    });
  }

  const authorisedStates = [];
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

  unauthorisedStates = unauthorisedStates.filter(unauthorisedState => {
    return authorisedStates.indexOf(unauthorisedState) === -1;
  });
  unauthorisedStates = [...new Set(unauthorisedStates)];

  return createPlantUmlString(unauthorisedStates, roles, combinedLinks);
}

module.exports = { parseCCD };
