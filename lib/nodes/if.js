import { NodeHandlerBase } from './node-handler-base';
import { loadInputs } from './shared';

const NEGATED_OPERATORS = {
  'eq': 'ne',
  'ne': 'eq',
  'gt': 'le',
  'lt': 'ge',
  'ge': 'lt',
  'le': 'gt'
};

function negateOperator(op) {
  return NEGATED_OPERATORS[op];
}

export function createIf(props, codeModel) {
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
    subgraphs: [
      {
        name: 'true',
      },
      {
        name: 'false'
      }
    ]
  };
};


export class IfHandler extends NodeHandlerBase {
  generateCode(node, context) {
    let commentFormatFunction = input => input.name;
    loadInputs(node, context, commentFormatFunction);
    context.lines.push(`cmp r0, r1`);
    let branchId = context.branchNum++;

    if (!node.data.subgraphs || node.data.subgraphs.length != 2) {
      return;
    }
    let [trueSubgraph, falseSubgraph] = node.data.subgraphs; 

    // The "false" branch can be skipped if it's empty
    let labelSuffix = falseSubgraph.head.next ? 'false' : 'end';
    context.lines.push(`b${negateOperator(node.data.operator)} branch_${branchId}_${labelSuffix}`);

    context.lines.push('');
    context.lines.push('; condition true');
    context.model.generateCodeForNodeList(trueSubgraph.head, context);

    if (falseSubgraph.head.next) {
      context.lines.push(`b branch_${branchId}_end`);
      context.lines.push('');

      context.lines.push(`branch_${branchId}_false: ; condition false`);
      context.model.generateCodeForNodeList(falseSubgraph.head, context);
    }

    context.lines.push(`branch_${branchId}_end:`);
  }

}
