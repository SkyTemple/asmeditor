import { isTypeCompatible } from "./shared";

// Maximum imm16 value
const MAX_VALUE = 65535;

export function validateInputs(node) {
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
        let value = input.value.constantValue;
        if (isNaN(parseInt(value))) {
          report('Value must be an integer');
        } else if (value < 0) {
          report('Value must be a positive number');
        } else if (value > MAX_VALUE) {
          report(`Value must be less than or equal to ${MAX_VALUE}`);
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

    }
  }
  return errors;
}

export class NodeHandlerBase {
  /** Returns an error string or undefined if the node is valid. */
  validate(node) {
    return validateInputs(node);
  }

  generateCode(node, context) {}

  getDescription(node) {
    return '';
  }
}
