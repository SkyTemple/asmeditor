function loadInput(input, index, commentFormatFunction) {
  let comment = commentFormatFunction(input, index);

  let instruction = 'mov';
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
        case 'variable-ref':
          instruction = 'ldr';
          value = `=${getLabelForVariableIndex(input.value.constantValue)}`
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

  let code = [];
  let register = index < 4 ? `r${index}` : 'r0';
  if (register !== value) {
    code.push(`${instruction} ${register}, ${value} ; ${comment}`);
  } else {
    // code.push(`; No need to mov ${register} into itself ; ${comment}`);
  }
  if (index >= 4) {
    let stackOffset = (index - 4) * 4;
    code.push(`str r0, [r13, #+0x${stackOffset.toString(16)}]`)
  }

  return code;
}

export function loadInputs(
  node,
  context,
  commentFormatFunction = (input, index) => `input #${index} ${input.name}`
) {
  let lines = context.lines;
  let inputs = node.data.inputs;

  // Write inputs that read from r0 first to avoid overwriting it
  for (let i = 0; i < inputs.length; i++) {
    let input = inputs[i];
    if (input.value.kind === 'last-result') {
      let inputLines = loadInput(input, i, commentFormatFunction);
      for (let line of inputLines) {
        lines.push(line);
      }
    }
  }

  // Write other stack arguments
  for (let i = 4; i < inputs.length; i++) {
    let input = inputs[i];
    if (input.value.kind !== 'last-result') {
      let inputLines = loadInput(input, i, commentFormatFunction);
      for (let line of inputLines) {
        lines.push(line);
      }
    }
  }

  // Write the other inputs
  for (let i = 0; i < 4 && i < inputs.length; i++) {
    let input = inputs[i];
    if (input.value.kind !== 'last-result') {
      let inputLines = loadInput(input, i, commentFormatFunction);
      for (let line of inputLines) {
        lines.push(line);
      }
    }
  }

  // Each argument after the third takes up four bytes on the stack
  let stackReserveSize = Math.max((inputs.length - 4) * 4, 0);
  context.stackReserveSize = Math.max(stackReserveSize, context.stackReserveSize);
}

export function isTypeCompatible(type1, type2) {
  if (type1 === 'any' || type2 === 'any') {
    return true;
  }

  return type1 === type2;
}

// Source: https://github.com/Kingcom/armips/blob/e6783c4b2611838dbe50057b373f0514747a865e/Archs/ARM/CArmInstruction.cpp#L37
export function canShiftIntermediate(value) {
  for (let i = 0; i < 32; i += 2) {
		let andval = Math.abs((0xFFFFFF00 >> i) | (0xFFFFFF00 << (-i & 31)));

		if ((value & andval) == 0) {
			return true;
		}
	}
	return false;
}

export function getLabelForVariableIndex(index) {
  return `uservariable_${index}`;
}
