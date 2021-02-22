function loadInput(input, index, commentFormatFunction) {
  let comment = commentFormatFunction(input, index);

  let value;

  switch (input.type) {
    case 'int':
    case 'bool': {
      switch (input.value.kind) {
        case 'constant':
          value = `#${input.value.constantValue}`;
          break;
        case 'last-result':
          value = 'r0';
          break;
      }
      break;
    }

    case 'user':
      value = 'r9';
      break;
    case 'target':
      value = 'r4';
      break;
    case 'moveData':
      value = 'r8';
      break;
  }

  if (index < 4) {
    let register = `r${index}`;
    if (register === value) {
      return `; No need to mov ${register} into itself ; ${comment}`;
    }
    return `mov ${register}, ${value}; ${comment}`;
  } else {
    return `; WARNING: Stack arguments are not yet supported ; ${comment}`;
  }
}

export function loadInputs(
  node,
  lines,
  commentFormatFunction = (input, index) => `input #${index} ${input.name}`
) {
  let inputs = node.data.inputs;

  // Write inputs that read from r0 first to avoid overwriting it
  for (let i = 0; i < inputs.length; i++) {
    let input = inputs[i];
    if (input.value.kind === 'last-result') {
      let line = loadInput(input, i, commentFormatFunction);
      if (line) {
        lines.push(line);
      }
    }
  }

  // Write the other inputs
  for (let i = 0; i < inputs.length; i++) {
    let input = inputs[i];
    if (input.value.kind !== 'last-result') {
      let line = loadInput(input, i, commentFormatFunction);
      if (line) {
        lines.push(line);
      }
    }
  }
}
