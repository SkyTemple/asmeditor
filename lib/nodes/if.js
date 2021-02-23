import { createMeta } from './meta';
import { NodeHandlerBase } from './node-handler-base';
import { loadInputs } from './shared';

export function createIf(props) {
  return {
    description: 'If',
    inputs: [{
      name: 'Input 1',
      type: 'any',
      value: {
        constantValue: 0,
        kind: 'last-result'
      }
    }, {
      name: 'Input 2',
      type: 'any',
      value: {
        constantValue: 0,
        kind: 'constant'
      }
    }],
    operator: 'eq',
    trueSubgraph: createMeta(),
    falseSubgraph: createMeta(),
  };
};


export class IfHandler extends NodeHandlerBase {
  generateCode(node, context) {
    let commentFormatFunction = (input, index) => input.name;
    loadInputs(node, context, commentFormatFunction);
    context.lines.push(`???`);
    context.lines.push('bne ???');
  }
}
