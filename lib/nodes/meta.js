import { NodeHandlerBase } from './node-handler-base';

export function createMeta(props) {
  let { region, r10ReturnValue } = props;
  return { region, r10ReturnValue };
}

export class MetaHandler extends NodeHandlerBase {
  validate(node) {
    return undefined;
  }
}
