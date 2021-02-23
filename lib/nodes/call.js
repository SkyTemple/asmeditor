import { NodeHandlerBase } from './node-handler-base';
import { loadInputs } from './shared';

export function createCall(props) {
  let { func } = props;
  let inputs = func.args.map(arg => ({ ...arg, value: { kind: 'constant', constantValue: arg.defaultValue } }));
  return {
    description: `Call function "${func.name}"`,
    inputs,
    outputs: func.returnValue ? [func.returnValue] : [],
    documentation: func.documentation,
    func,
  };
};

export class CallHandler extends NodeHandlerBase {
  generateCode(node, context) {
    let commentFormatFunction = (input, index) => `argument #${index} ${input.name}`;
    loadInputs(node, context, commentFormatFunction);
    context.lines.push(`bl ${node.data.func.name}`);
    context.lines.push('');
  }
}
