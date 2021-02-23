const FUNCTIONS_FILE = 'data/functions.txt';

function parseFunctions(functionsFile) {
  let functions = new Map();

  let lines = functionsFile.split('\n');

  let doc = '';
  let paramDoc = {};
  for (const line of lines) {
    let trimmedLine = line.trim();
    if (trimmedLine.startsWith('///')) {
      // Doc comment
      let docComment = trimmedLine.substr(3).trim();
      if (docComment.startsWith('@')) {
        let spaceSplit = docComment.split(' ');
        let argumentName = spaceSplit[0].substr(1);
        let text = '';
        if (spaceSplit.length > 1) {
          text = spaceSplit.slice(1).join(' ');
        }
        paramDoc[argumentName] = text;
      } else {
        doc += docComment + ' ';
      }

      continue;
    }

    if (trimmedLine === '' || trimmedLine.startsWith('//')) {
      // Empty or comment
      continue;
    }

    let [nameAndReturnDefinition, argsString] = line.split('(');
    let returnDefinition, functionName;
    if (nameAndReturnDefinition.includes('=')) {
      [returnDefinition, functionName] = nameAndReturnDefinition.split('=');
    } else {
      functionName = nameAndReturnDefinition;
    }

    let trimStrings = s => s ? s.trim() : undefined;

    let [returnValueName, returnTypeAndAnnotation] = returnDefinition
      ? returnDefinition.split(':') : [null, null];
    let [returnType, returnAnnotation] = returnTypeAndAnnotation
      ? returnTypeAndAnnotation.split('|') : [null, null];

    let trimmedArgs = argsString.trimRight();
    if (!trimmedArgs.endsWith(')')) {
      throw new Error('Expected ")" after argument list.')
    }
    trimmedArgs = trimmedArgs.substr(0, trimmedArgs.length - 1);

    let args = [];
    if (trimmedArgs !== '') {
      let argsWithType = trimmedArgs.split(',');
      args = argsWithType.map(arg => {
        let [argDefinition, defaultValue] = arg.split('=').map(trimStrings);
        let [argName, typeAndAnnotation] = argDefinition.split(':').map(trimStrings);
        let [type, annotation] = typeAndAnnotation.split('|').map(trimStrings);

        let trimmedDefaultValue = defaultValue ? defaultValue.trim() : 0;
        let numericDefaultValue;
        if (trimmedDefaultValue === 'true') {
          numericDefaultValue = 1;
        } else if (trimmedDefaultValue === 'false') {
          numericDefaultValue = 0;
        } else {
          numericDefaultValue = parseInt(trimmedDefaultValue);
        }

        return {
          name: argName,
          type: type,
          annotation: annotation ? annotation : undefined,
          defaultValue: numericDefaultValue,
          documentation: paramDoc[argName]
        };
      });
    }
    
    functions.set(functionName.trim(), {
      name: functionName.trim(),
      args,
      // TODO: support multiple return values
      returnValue: returnType ? {
        name: returnValueName ? returnValueName.trim() : undefined,
        type: returnType ? returnType.trim() : undefined,
        annotation: returnAnnotation ? returnAnnotation.trim() : undefined
      } : undefined,
      documentation: doc
    });

    // Start new documentation block
    doc = '';
    paramDoc = {};

  }
  return functions;
}


export async function loadAndParseFunctions() {
  try {
    let functionsResponse = await fetch(FUNCTIONS_FILE);
    if (!functionsResponse.ok) {
      throw new Error('Returned an error code.');
    }
    let functionsFile = await functionsResponse.text();

    let functions = parseFunctions(functionsFile);
    return functions;
  } catch (e) {
    console.error(e);
    alert('Failed to load data, please try reloading the page.');
  }
}


