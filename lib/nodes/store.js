import { NodeHandlerBase } from './node-handler-base';
import { getLabelForVariableIndex, isTypeCompatible, loadInputs } from './shared';

export function createStore(props) {
  const { variableRef, name, type } = props;
  return {
    description: `Set "${name}"`,
    inputs: [{
      name: 'Value',
      type,
      value: {
        constantValue: 0,
        kind: 'constant'
      }
    }],
    outputs: [],
    variableRef,
  };
};

export class StoreHandler extends NodeHandlerBase {
  generateCode(node, context) {
    let commentFormatFunction = () => 'New value';
    loadInputs(node, context, commentFormatFunction);
    context.lines.push(`str r0, =${getLabelForVariableIndex(node.data.variableRef)}`);
    context.lines.push('');
  }

  validate(node, model) {
    let errors = super.validate(node, model);
    
    let variableIndex = node.data.variableRef;
    if (variableIndex < 0 || variableIndex >= model.variables.length) {
      errors.push({ text: 'The referenced variable does not exist.'});
    } else {
      let variableType = model.variables[variableIndex].type;
      let input = node.data.inputs[0];
      if (!isTypeCompatible(variableType, input.type)) {
        errors.push({ input, text: 'Input type doesn\'t match variable type, looks like something went extremely wrong.' });
      }
    }

    return errors;
  }
}
