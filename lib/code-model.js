import { insertCodeIntoTemplate } from './code-template.js';
import { CodeModelEvent } from './code-model-event.js';

import { createMeta, MetaHandler } from './nodes/meta.js';
import { createCall, CallHandler } from './nodes/call.js';
import { 
  createAddition, createSubtraction, createMultiplication,
  AdditionHandler, SubtractionHandler, MultiplicationHandler
} from './nodes/arithmetic.js';

/**
 * Nodes are created by cloning the provided prototype. There is also a 
 * handler for each type which is used for validation and code generation.
 */
export const NODE_MAP = {
  'meta': ['Graph Start', createMeta, new MetaHandler()],

  'add': ['Add', createAddition, new AdditionHandler()],
  'sub': ['Subtract', createSubtraction, new SubtractionHandler()],
  'mul': ['Multiply', createMultiplication, new MultiplicationHandler()],

  'call': ['Call', createCall, new CallHandler()],
};

export class CodeModel {
  constructor(functions, region = 'us', verboseLogging = true) {
    this.functions = functions;
    this.region = region;
    this.r10ReturnValue = false;
    this.verboseLogging = verboseLogging;

    this.onNodeAdded = new CodeModelEvent();
    this.onNodeUpdated = new CodeModelEvent();
    this.onNodeRemoved = new CodeModelEvent();
    this.onChanged = new CodeModelEvent();

    let metaNode = this._createNode('meta');
    this.head = metaNode;
    this.tail = metaNode;
  }

  generateCode() {
    let context = {
      stackReserveSize: 0, // How much space on the stack is needed to support all calls
      lines: []
    };

    let validationError = false;
    let current = this.head; // Skip the first meta node
    while (current = current.next) {
      let errors = this.validateNode(current);
      if (errors.length > 0) {
        validationError = true;
      }
      if (!validationError) {
        getNodeHandler(current).generateCode(current, context);
      }
    }

    if (validationError) {
      return "Couldn't generate code due to validation errors.\nPlease fix all blocks highlighted in red.";
    }
    return insertCodeIntoTemplate(context, this.region, this.r10ReturnValue);
  }

  validateNode(node) {
    let errors = getNodeHandler(node).validate(node);
    node.onValidated.emit(errors);
    return errors;
  }

  addNode(name, props = {}) {
    let node = this._createNode(name, props);
    this.tail.next = node;
    node.prev = this.tail;
    this.tail = node;

    this.onNodeAdded.emit(node);
    this.onChanged.emit();
    return node;
  }

  addCallNode(functionName) {
    let func = this.functions.get(functionName);
    if (!func) {
      throw new Error(`Unknown function '${functionName}'.`);
    }

    return this.addNode('call', { func });
  }

  insertExistingNodeAfter(node, target) {
    if (target == this.tail) {
      this.tail = node;
    }

    node.prev = target;
    node.next = target.next;
    if (target.next) {
      target.next.prev = node;
    }
    target.next = node;
    node.parent = target.parent;

    this.onChanged.emit();
  }

  notifyNodeUpdated(node) {
    this.onNodeUpdated.emit(node);
    node.onUpdated.emit(node);
    this.onChanged.emit();
  }

  removeNode(node, emitEvent = true) {
    if (this.tail === node) {
      this.tail = node.prev;
    }
    if (node.next) {
      node.next.prev = node.prev;
    }
    if (node.prev) {
      node.prev.next = node.next;
    }

    if (emitEvent) {
      this.onNodeRemoved.emit(node);
      this.onChanged.emit();
    }
  }

  _createNode(type, props = {}) {
    let [name, factory] = getNodeMapValue(type);
    let node = {
      name,
      type,
      prev: undefined,
      next: undefined,
      data: factory(props),
      onUpdated: new CodeModelEvent(),
      onValidated: new CodeModelEvent(),
    };
    
    this._log('Created node: ', node);
    return node;
  }

  _log(...args) {
    if (this.verboseLogging) {
      console.log(...args);
    }
  }
}

export function getNodeMapValue(type) {
  let data = NODE_MAP[type];
  if (!data) {
    throw new Error(`Unknown node '${type}'.`);
  }
  return data;
}

export function getNodeTypeName(typeId) {
  let [name] = getNodeMapValue(typeId);
  return name;
}

export function getNodeHandler(node) {
  let [, , handler] = getNodeMapValue(node.type);
  return handler;
}
