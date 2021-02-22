import { NodeHandlerBase } from './node-handler-base';
import { loadInputs } from './shared';

export function createCall(props) {
  let { func } = props;
  let inputs = func.args.map(arg => ({ ...arg, value: { kind: 'constant', constantValue: arg.defaultValue } }));
  return {
    description: `Call function "${func.name}"`,
    inputs,
    outputs: func.returnValue ? [func.returnValue] : [],
    func
  };
};

export class CallHandler extends NodeHandlerBase {
  validate(node) {
    return undefined;
  }

  generateCode(node, lines) {
    let commentFormatFunction = (input, index) => `argument #${index} ${input.name}`;
    loadInputs(node, lines, commentFormatFunction);
    lines.push(`bl ${node.data.func.name}`);
    lines.push('');
  }
}
