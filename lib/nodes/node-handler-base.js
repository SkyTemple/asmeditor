export class NodeHandlerBase {
  /** Returns an error string or undefined if the node is valid. */
  validate(node) {
    return undefined;
  }

  generateCode(node, lines) {}

  getDescription(node) {
    return '';
  }
}
