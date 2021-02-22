const FUNCTIONS_FILE = 'data/functions.txt';
const OFFSETS_BASE_URL = 'https://raw.githubusercontent.com/irdkwia/eos-move-effects/master/lib/';

const OFFSETS_EU_FILES = [
  'dunlib_eu.asm',
  'stdlib_eu.asm',
];
const OFFSETS_US_FILES = [
  'dunlib_us.asm',
  'stdlib_us.asm',
];

function parseFunctions(functionsFile) {
  let functions = new Map();

  let lines = functionsFile.split('\n');
  for (const line of lines) {
    if (line.trim() === '' || line.startsWith('//')) {
      continue;
    }

    let [nameAndReturnDefinition, argsString] = line.split('(');
    let returnDefinition, functionName;
    if (nameAndReturnDefinition.includes('=')) {
      [returnDefinition, functionName] = nameAndReturnDefinition.split('=');
    } else {
      functionName = nameAndReturnDefinition;
    }

    let [returnValueName, returnTypeAndAnnotation] = returnDefinition
      ? returnDefinition.split(':') : [null, null];
    let [returnType, returnAnnotation] = returnTypeAndAnnotation
      ? returnTypeAndAnnotation.split('|') : [null, null];

    let argsWithType = argsString.trimRight()
      .substr(0, argsString.trimRight().length - 1).split(',');
    let args = argsWithType.map(arg => {
      let [argDefinition, defaultValue] = arg.split('=');
      let [argName, typeAndAnnotation] = argDefinition.split(':');
      let [type, annotation] = typeAndAnnotation.split('|');

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
        name: argName.trim(),
        type: type.trim(),
        annotation: annotation ? annotation.trim() : undefined,
        defaultValue: numericDefaultValue,
      };
    });
    
    functions.set(functionName.trim(), {
      name: functionName.trim(),
      args,
      // TODO: support multiple return values
      returnValue: returnType ? {
        name: returnValueName ? returnValueName.trim() : undefined,
        type: returnType ? returnType.trim() : undefined,
        annotation: returnAnnotation ? returnAnnotation.trim() : undefined
      } : undefined,
      offsets: { eu: 0, us: 0 }, 
    });

  }
  return functions;
}

function parseOffsets(functions, offsetFiles) {
  for (const { region, file } of offsetFiles) {
    for (const line of file.split('\n')) {
      if (!line.startsWith('.definelabel ')) {
        continue;
      }

      let [name, offset] = line.substr('.definelabel '.length).split(',');
      let func = functions.get(name.trim());
      if (!func) {
        continue;
      }
      func.offsets[region] = parseInt(offset.trim());
    }
  }
}

export async function loadAndParseFunctions() {
  try {
    let functionsResponse = await fetch(FUNCTIONS_FILE);
    if (!functionsResponse.ok) {
      throw new Error('Returned an error code.');
    }
    let functionsFile = await functionsResponse.text();

    let offsetFiles = [];
    for (const offsetFilePath of [...OFFSETS_EU_FILES, ...OFFSETS_US_FILES]) {
      let offsetsResponse = await fetch(OFFSETS_BASE_URL + offsetFilePath);
      if (!offsetsResponse.ok) {
        throw new Error('Returned an error code.');
      }
      offsetFiles.push({
        region: OFFSETS_EU_FILES.includes(offsetFilePath) ? 'eu' : 'us',
        file: await offsetsResponse.text()
      });
    }

    let functions = parseFunctions(functionsFile);
    parseOffsets(functions, offsetFiles);
    return functions;
  } catch (e) {
    console.error(e);
    alert('Failed to load data, please try reloading the page.');
  }
}


