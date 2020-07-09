#!/bin/bash

#OUTPUT_FILENAME=${2:-state_diagram}

DEFINITION_LOCATION=$1

for i in "$@"
do
case $i in
    -o=*|--output=*)
    OUTPUT_FILENAME="${i#*=}"
    shift # past argument=value
    ;;
    -s=*|--ignoredStates=*)
    IGNORED_STATES="${i#*=}"
    shift # past argument=value
    ;;
    -e=*|--ignoredEvents=*)
    IGNORED_EVENTS="${i#*=}"
    shift # past argument=value
    ;;
    -r=*|--roles=*)
      ROLES="${i#*=}"
      shift # past argument=value
      ;;
    -u|--hideUnauthorised)
      HIDE_UNAUTHORISED="true"
      shift # past argument=value
      ;;
    -h|--help)
      echo "Usage ./generate_state_diagram.sh [path to ccd def] [options]"
      echo ""
      echo "where options include:"
      echo "    -o, --output=...        file to output state diagram to"
      echo "    -s, --ignoredStates=... comma seperated list of states to ignore, can be a regex that matches the whole state name"
      echo "    -e, --ignoredEvents=... comma seperated list of events to ignore, can be a regex that matches the whole event name"
      echo "    -r, --roles=...         comma seperated list of roles to build the diagram for"
      echo "    -u, --hideUnauthorised  hide any events that a user is unauthoirsed to run or see"
      echo "    -h, --help              to display this help message"
      exit 0
      ;;
    *)
          # unknown option
    ;;
esac
done

OUTPUT_FILENAME=${OUTPUT_FILENAME:-state_diagram}
IGNORED_STATES=${IGNORED_STATES:-''}
IGNORED_EVENTS=${IGNORED_EVENTS:-''}
ROLES=${ROLES:-''}

echo "Output file      = ${OUTPUT_FILENAME}"
echo "Ignored states   = [${IGNORED_STATES}]"
echo "Ignored events   = [${IGNORED_EVENTS}]"
echo "Roles            = [${ROLES}]"

node ./generate_state_diagram.js "${DEFINITION_LOCATION}" "${IGNORED_STATES}" "${IGNORED_EVENTS}" "${ROLES}" "${HIDE_UNAUTHORISED}" > ${OUTPUT_FILENAME}.txt
java -jar lib/plantuml.jar ${OUTPUT_FILENAME}.txt
rm ${OUTPUT_FILENAME}.txt
