import { LitElement, html, css } from 'lit-element';
import { getCodeModel } from './app-root';

import '@material/mwc-button';
import '@material/mwc-icon-button';
import '@material/mwc-formfield';
import '@material/mwc-textfield';

import './generic-input';

const SUPPORTED_TYPES = ['int', 'bool'];

class CodeBlock extends LitElement {
  static get properties() {
    return {
      node: { type: Object },
      index: { type: Number },
      validationErrors: { type: Array },
    };
  }

  static get styles() {
    return css`
:host {
  display: block;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-sizing: border-box;
  background-color: rgba(150, 150, 150, 0.06);
}

.head {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: calc(100% + 1px);
  padding: 0 8px;
  font-size: 0.9rem;
  color: white;
  background-color: #6200ee;
  border: 1px solid #6200ee;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  margin: 0;
  cursor: grab;
  transition: background-color 200ms linear;
}

.head[invalid] {
  background-color: red;
}

.content {
  padding: 0 8px 16px 8px;
}

.description {
  font-size: 1.1rem;
  font-weight: 500;
}

.documentation {
  font-size: 0.9rem;
  color: #888;
}

.content h3 {
  font-size: 1rem;
}

.inputs, .outputs {
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  margin: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input .fields {
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: center;
}

.input .errors {
  margin: 0;
  padding: 0;
  line-height: 1.5rem;
  font-size: 0.8rem;
  color: red;
}

.input .input-name {
  display: inline-block;
  width: 250px;
}

.output {
  display: flex;
  flex-direction: row;
  gap: 4px;
}

.output .output-type {
  color: #999;
}
`;
  }

  constructor() {
    super();
    this.node = {};
    this.index = 0;
    this.codeModel = getCodeModel();
    this.validationErrors = [];
  }

  connectedCallback() {
    super.connectedCallback();
    this.node.onValidated.addListener(this._nodeValidated.bind(this));

    this.codeModel.validateNode(this.node);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.node.onValidated.removeAllListeners();
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    if (changedProperties.has('node')) {
      this.node.onValidated.removeAllListeners();
      this.node.onValidated.addListener(this._nodeValidated.bind(this));
      this.codeModel.validateNode(this.node);
    }
  }

  _inputChange(evt, input) {
    input.value = evt.detail;
    this.codeModel.notifyNodeUpdated(this.node);
  }

  _nodeValidated(errors) {
    this.validationErrors = errors;
    if (errors.length > 0) {
      this.classList.add('error');
    } else {
      this.classList.remove('error');
    }
  }

  _dragStart(ev) {
    if (this._isMeta) {
      ev.preventDefault();
      return;
    }
    ev.dataTransfer.setData('node', this.node);
    ev.dataTransfer.setData('index', this.index);
  }

  _remove() {
    this.codeModel.removeNode(this.node);
  }

  get _isValid() {
    return this.validationErrors.length === 0;
  }

  get _isMeta() {
    return this.node.type === 'meta';
  }

  _renderInput(input) {
    return html`
<div class="input">
  <div class="fields">
    <p class="input-name">${input.name}</p>
    <generic-input .value=${input.value.constantValue} .kind=${input.value.kind} .type=${input.type} .annotation=${input.annotation}
      @inputChange="${evt => this._inputChange(evt, input)}">
    </generic-input>
  </div>
  <p class="documentation">${input.documentation}</p>
  <ul class="errors">
    ${this.validationErrors.filter(err => err.input === input).map(err => err.text)}
  </ul>
</div>
    `;
  }

  _renderOutput(output) {
    return html`
<div class="output">
  <span class="output-name">${output.name}</span>
  <span class="output-type">(${output.type})</span>
  <p class="documentation">${output.documentation}</p>
</div>
    `;
  }
  
  render() {
    let inputs, outputs;
    if (this.node.data.inputs && this.node.data.inputs.length) {
      inputs = this.node.data.inputs
        .filter(input => SUPPORTED_TYPES.includes(input.type))
        .map(input => this._renderInput(input));
    }
    if (this.node.data.outputs && this.node.data.outputs.length) {
      outputs = this.node.data.outputs
        .map(output => this._renderOutput(output));
    }

    return html`
<div class="head" ?invalid=${!this._isValid} draggable="true" @dragstart="${this._dragStart}">
  <h3>${this.node.name}</h3>
  ${!this._isMeta
    ? html`<mwc-icon-button icon="delete" @click="${this._remove}"></mwc-icon-button>`
    : ''}
</div>
<div class="content">
  <p class="description">${this.node.data.description}</p>
  <p class="documentation">${this.node.data.documentation}</p>
  ${inputs ?
    html`<h3>Inputs</h3><div class="inputs">${inputs}</div>`
    : ''}
  ${outputs
    ? html`<h3>Outputs</h3><div class="outputs">${outputs}</div>`
    : ''}
</div>
`;
  }
}

customElements.define('code-block', CodeBlock);
