import { NodeHandlerBase } from './node-handler-base';

export function createEnd(props) {
  return {
    description: `End execution (ignore all following blocks)`,
  };
};

export class EndHandler extends NodeHandlerBase {
  generateCode(node, context) {
    context.lines.push(`b end`);
    context.lines.push('');
  }
}
