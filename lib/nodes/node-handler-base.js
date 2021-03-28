import { canShiftIntermediate, isPrimitiveType, isTypeCompatible } from "./shared";

const MAX_UINT32_VALUE = 0xFFFFFFFF;

export function validateInputs(node, model) {
  if (!node.data.inputs) {
    return [];
  }

  let errors = [];
  for (let input of node.data.inputs) {
    function report(text) {
      errors.push({ input, text });
    }

    switch (input.value.kind) {

      case 'constant': {
        if (input.type === 'int') {
          let value = input.value.constantValue;
          if (isNaN(parseInt(value))) {
            report('Value must be an integer');
          } else if (value < 0) {
            report('Value must be a positive number');
          } else if (!canShiftIntermediate(value)) {
            report(`Value must be less than or equal to 255 or a shiftable immediate.`);
          } else if (value > MAX_UINT32_VALUE) {
            report(`Value must be less than or equal to ${MAX_UINT32_VALUE}.`)
          }
        }
        break;
      }

      case 'last-result': {
        let prevOutputs;
        if (node.prev.type === 'meta' && node.subgraph.parentNode) {
          // Special handling of the meta node to allow using the result
          // of the last block before the start of a subgraph
          prevOutputs = node.subgraph.parentNode.prev.data.outputs;
        } else {
          prevOutputs = node.prev.data.outputs;
        }
        if (!prevOutputs || prevOutputs.length == 0) {
          report('Result of last operation unavailable because the previous node has no outputs');
        } else if (!isTypeCompatible(prevOutputs[0].type, input.type)) {
          report(`Expected value of type "${input.type}" but got "${prevOutputs[0].type}"`);
        }
        break;
      }

      case 'variable-ref': {
        let variableIndex = input.value.constantValue;
        if (variableIndex < 0 || variableIndex >= model.variables.length) {
          report('The referenced variable does not exist.');
        } else {
          let variableType = model.variables[variableIndex].type;
          if (!isTypeCompatible(variableType, input.type)) {
            report(`Expected value of type "${input.type}" but got "${variableType}"`);
          }
        }
        break;
      }

    }

    // Check special types
    if (!isPrimitiveType(input.type) && !model.environment.registerTypes[input.type]) {
      let error = `This block is unavailable in the current project type `
        + `"${model.environment.friendlyName}" because the type "${input.type}" doesn't exist.`;
      errors.push({ text: error });
    }
  }
  return errors;
}

export class NodeHandlerBase {
  /** Returns an error string or undefined if the node is valid. */
  validate(node, model) {
    return validateInputs(node, model);
  }

  generateCode(node, context) {}

  getDescription(node) {
    return '';
  }
}
