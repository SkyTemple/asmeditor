import { insertCodeIntoTemplate } from './code-template.js';
import { CodeModelEvent } from './code-model-event.js';

import { createMeta, MetaHandler } from './nodes/meta.js';
import { createCall, CallHandler } from './nodes/call.js';
import { createStore, StoreHandler } from './nodes/store.js';
import { createIf, IfHandler } from './nodes/if.js';
import { createEnd, EndHandler } from './nodes/end.js';
import { 
  createAddition, createSubtraction, createMultiplication,
  AdditionHandler, SubtractionHandler, MultiplicationHandler
} from './nodes/arithmetic.js';
import { getLabelForVariableIndex } from './nodes/shared.js';

import eosMovesEnvironment from './environments/eos-moves.js';
import eosItemsEnvironment from './environments/eos-items.js';

export const ENVIRONMENTS = {
  'eos-moves': eosMovesEnvironment,
  'eos-items': eosItemsEnvironment
};

/**
 * Nodes are created by cloning the provided prototype. There is also a 
 * handler for each type which is used for validation and code generation.
 */
export const NODE_MAP = {
  'meta': ['Graph Start', createMeta, new MetaHandler()],

  'call': ['Call', createCall, new CallHandler()],
  'if': ['If', createIf, new IfHandler()],
  'store': ['Set Variable', createStore, new StoreHandler()],
  'end': ['End Execution', createEnd, new EndHandler()],

  'add': ['Add', createAddition, new AdditionHandler()],
  'sub': ['Subtract', createSubtraction, new SubtractionHandler()],
  'mul': ['Multiply', createMultiplication, new MultiplicationHandler()],
};

export class CodeModel {
  constructor(functions, region = 'us', environmentName = 'eos-moves', verboseLogging = true) {
    this.functions = functions;
    this.setEnvironment(environmentName);
    this.region = region;
    this.r10ReturnValue = false;
    this.verboseLogging = verboseLogging;
    this.subgraphs = new Map();
    this.subgraphs.set(0, this);
    this.currentSubgraphIndex = 1;

    this.onNodeAdded = new CodeModelEvent();
    this.onNodeUpdated = new CodeModelEvent();
    this.onNodeRemoved = new CodeModelEvent();
    this.onChanged = new CodeModelEvent();
    this.onVariablesUpdated = new CodeModelEvent();

    let metaNode = this._createNode('meta', {}, this);
    this.head = metaNode;
    this.tail = metaNode;
    this.variables = [];
  }

  generateCode() {
    let context = {
      model: this,
      environment: this.environment,
      lines: [],
      dataLines: [],
      stackReserveSize: 0, // How much space on the stack is needed to support all calls
      branchNum: 0,
      stringLiteralNum: 0,
    };

    let validationError = this.generateCodeForNodeList(this.head, context);

    if (validationError) {
      return "Couldn't generate code due to validation errors.\nPlease fix all blocks highlighted in red.";
    }

    this.generateCodeForVariables(context);
    
    return insertCodeIntoTemplate(context, this.region, this.environment,
      this.r10ReturnValue && this.environment === eosMovesEnvironment);
  }

  generateCodeForNodeList(current, context) {
    let validationError = false;
    while (current = current.next) { // Skip the first meta node
      if (!current.valid) {
        validationError = true;
        break;
      }
      getNodeHandler(current).generateCode(current, context);
    }
    return validationError;
  }

  generateCodeForVariables(context) {
    // Data for variables
    for (let i = 0; i < this.variables.length; i++) {
      let variable = this.variables[i];
      context.dataLines.push(`${getLabelForVariableIndex(i)}: ; Variable "${variable.name}"`);
      context.dataLines.push(`  dcd ${variable.defaultValue}`);
      context.dataLines.push(``);
    }
  }

  validateAllNodes() {
    this._validateSubgraph(this);
  }

  validateNode(node) {
    let errors = getNodeHandler(node).validate(node, this);
    node.valid = errors.length === 0;
    node.onValidated.emit(errors);
    return errors;
  }

  addNode(name, props, subgraph, overrideData = undefined) {
    subgraph = subgraph ?? this;

    let node = this._createNode(name, props, subgraph, !!overrideData);
    node.prev = subgraph.tail;
  
    subgraph.tail.next = node;
    subgraph.tail = node;
    node.subgraph = subgraph;
    node.parent = subgraph.parentNode;

    if (overrideData) {
      node.data = { ...node.data, ...overrideData };
    }
    this.validateNode(node);
    this.onNodeAdded.emit(node);
    this.onChanged.emit();
    return node;
  }

  addCallNode(functionName, subgraph) {
    let func = this.functions.get(functionName);
    if (!func) {
      throw new Error(`Unknown function '${functionName}'.`);
    }

    return this.addNode('call', { func }, subgraph);
  }

  addStoreNode(variableIndex, subgraph) {
    if (variableIndex >= this.variables.length) {
      return undefined;
    }

    let { name, type } = this.variables[variableIndex];
    return this.addNode('store', { variableRef: variableIndex, name, type }, subgraph);
  }

  insertExistingNodeAfter(node, target) {
    if (target == target.subgraph.tail) {
      target.subgraph.tail = node;
    }

    node.prev = target;
    node.next = target.next;
    if (target.next) {
      target.next.prev = node;
    }
    target.next = node;
    node.subgraph = target.subgraph;
    node.parent = target.parent;

    this.onChanged.emit();
    this.onNodeAdded.emit();
  }

  notifyNodeUpdated(node) {
    this.validateNode(node);
    this.onNodeUpdated.emit(node);
    node.onUpdated.emit(node);
    this.onChanged.emit();
  }

  notifyVariableUpdated(variable) {
    this.onVariablesUpdated.emit({ variable, index: this.variables.indexOf(variable) });
    this.onChanged.emit();
  }

  removeNode(node, persistentDelete = true) {
    let subgraph = node.subgraph ?? this;
    if (subgraph.tail === node) {
      subgraph.tail = node.prev;
    }
    if (node.next) {
      node.next.prev = node.prev;
    }
    if (node.prev) {
      node.prev.next = node.next;
    }

    if (persistentDelete) {
      if (node.data.subgraphs) {
        for (const subgraph of node.data.subgraphs) {
          this.subgraphs.delete(subgraph.subgraphIndex);
        }
      }
      this.onNodeRemoved.emit(node);
      this.onChanged.emit();
    }
  }

  getSubgraphByIndex(index) {
    return this.subgraphs.get(index);
  }

  findSubgraphIndex(subgraph) {
    for (const [key, value] of this.subgraphs) {
      if (value === subgraph) {
        return key;
      }
    }
  }

  addVariable(name, type, defaultValue) {
    let variable = { name, type, defaultValue };
    this.variables.push(variable);
    this.notifyVariableUpdated(variable);
  }

  setEnvironment(environmentName) {
    this.environmentName = environmentName;
    this.environment = ENVIRONMENTS[environmentName];
  }

  toJson() {
    let serializedProject = {
      environment: this.environmentName,
      region: this.region,
      r10ReturnValue: this.r10ReturnValue,
      variables: this.variables,
      nodes: this._serializeSubgraph(this)
    };
    return JSON.stringify(serializedProject, null, 2);
  }

  fromJson(json) {
    // Clear the current state
    this._clear();

    let serializedProject = JSON.parse(json);
    this.setEnvironment(serializedProject.environment);
    this.region = serializedProject.region;
    this.r10ReturnValue = serializedProject.r10ReturnValue;

    for (let variable of serializedProject.variables) {
      this.variables.push(variable);
      this.notifyVariableUpdated(variable);
    }

    this._deserializeSubgraph(serializedProject.nodes, this);
    this.onChanged.emit();
  }

  _createNode(type, props, subgraph, skipFactory = false) {
    let [name, factory] = getNodeMapValue(type);
    let node = {
      name,
      type,
      prev: undefined,
      next: undefined,
      data: skipFactory ? {} : factory(props),
      onUpdated: new CodeModelEvent(),
      onValidated: new CodeModelEvent(),
      subgraph
    };

    if (node.data.subgraphs) {
      for (const subgraph of node.data.subgraphs) {
        this._initSubgraph(subgraph, node);
      }
    }
    
    this._log('Created node: ', node);
    return node;
  }

  _validateSubgraph(subgraph) {
    let current = subgraph.head;
    while (current = current.next) { // Skip the first meta node
      this.validateNode(current);
  
      if (current.data.subgraphs) {
        for (const subgraph of current.data.subgraphs) {
          this._validateSubgraph(subgraph);
        }
      }
    }
  }

  _serializeSubgraph(subgraph) {
    let current = subgraph.head;
    let nodes = [];
    while (current = current.next) { // Skip the first meta node
      let node = {
        type: current.type,
        data: { ...current.data },
        subgraphs: []
      };

      delete node.data.subgraphs; // Must be deleted and reconstructed due to circular references
      if (current.data.subgraphs) {
        for (const childSubgraph of current.data.subgraphs) {
          node.subgraphs.push({ name: childSubgraph.name, nodes: this._serializeSubgraph(childSubgraph) });
        }
      }
      nodes.push(node);
    }

    return nodes;
  }

  _deserializeSubgraph(serializedNodes, subgraph) {
    for (let serializedNode of serializedNodes) {
      let node = this.addNode(serializedNode.type, {}, subgraph, serializedNode.data);

      if (serializedNode.subgraphs && serializedNode.subgraphs.length > 0) {
        node.data.subgraphs = [];
        for (let i = 0; i < serializedNode.subgraphs.length; i++) {
          let serializedSubgraph = serializedNode.subgraphs[i];
          let childSubgraph = { name: serializedSubgraph.name };
          this._initSubgraph(childSubgraph, node);
          node.data.subgraphs.push(childSubgraph);

          this._deserializeSubgraph(serializedSubgraph.nodes, childSubgraph);
        }
      }
    }
  }

  _initSubgraph(subgraph, parentNode) {
    subgraph.parentNode = parentNode;
    subgraph.head = this._createNode('meta', {}, subgraph);
    subgraph.tail = subgraph.head;
    this.subgraphs.set(this.currentSubgraphIndex, subgraph);
    subgraph.subgraphIndex = this.currentSubgraphIndex++;
  }

  _clear() {
    this.subgraphs.clear();
    this.subgraphs.set(0, this);
    this.currentSubgraphIndex = 1;
    this.variables = [];

    let current = this.head;
    while (current = current.next) { // Skip the first meta node
      this.removeNode(current);
    }
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
