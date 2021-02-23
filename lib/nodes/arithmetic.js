import { NodeHandlerBase } from './node-handler-base';
import { loadInputs } from './shared';

function createArithmetic(props, description) {
  return {
    description,
    inputs: [{
      name: 'Operand 1',
      type: 'int',
      value: {
        constantValue: 0,
        kind: 'last-result'
      }
    }, {
      name: 'Operand 2',
      type: 'int',
      value: {
        constantValue: 0,
        kind: 'constant'
      }
    }],
    outputs: [{
      name: 'Result',
      type: 'int',
    }],
  };
};

export function createAddition(props) {
  return createArithmetic(props, 'Addition');
}

export function createSubtraction(props) {
  return createArithmetic(props, 'Subtraction');
}

export function createMultiplication(props) {
  return createArithmetic(props, 'Multiplication');
}

class ArithmeticHandler extends NodeHandlerBase {
  generateCode(node, context) {
    let commentFormatFunction = (input, index) => input.name;
    loadInputs(node, context, commentFormatFunction);
    context.lines.push(`${this.instruction} r0, r0, r1`);
    context.lines.push('');
  }

  get instruction() {
    return new Error('Not implemented');
  }
}

export class AdditionHandler extends ArithmeticHandler {
  get instruction() {
    return 'add';
  }
}

export class SubtractionHandler extends ArithmeticHandler {
  get instruction() {
    return 'sub';
  }
}

export class MultiplicationHandler extends ArithmeticHandler {
  get instruction() {
    return 'mul';
  }
}
