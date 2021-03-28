import { LitElement, html, css } from 'lit-element';

import '@material/mwc-textfield';
import '@material/mwc-select';
import '@material/mwc-checkbox';

const KIND_DESCRIPTIONS = {
  'constant': 'Constant value',
  'last-result': 'Result of last operation',
};

const VARIABLE_TYPES = [
  'int',
  'bool'
]

class GenericInput extends LitElement {
  static get properties() {
    return {
      kind: { type: String },
      value: { type: Number },
      type: { type: String },
      annotation: { type: String },
      allowedKinds: { type: Array },
      variableNames: { type: Array },

      kindSelect: { type: Boolean },
      typeSelect: { type: Boolean },
    };
  }

  static get styles() {
    return css`
:host {
  display: flex;
  gap: 8px;
}

.kind-select {
  width: 250px;
}

.type-select {
  width: 100px;
}
`;
  }

  constructor() {
    super();
    this.allowedKinds = Object.keys(KIND_DESCRIPTIONS);
    this.value = 0;
    this.kindSelect = true;
    this.variableNames = [];
  }

  connectedCallback() {
    super.connectedCallback();
    this.kind = this.kind ?? this.allowedKinds[0];
    this.value = this.value ?? 0;
  }

  _dispatchChangeEvent() {
    this.dispatchEvent(new CustomEvent('inputChange', {
      detail: {
        kind: this.kind,
        constantValue: this.value,
        type: this.type,
      }
    }));
  }

  _valueChanged(evt) {
    this.value = +evt.target.value || Number(evt.target.checked);
    this._dispatchChangeEvent();
  }

  _kindChanged(evt) {
    let kind = evt.target.value;
    if (kind.startsWith('var-')) {
      this.kind = 'variable-ref';
      this.value = +kind.substr('var-'.length); // Extract variable index from "var-[index]"
    } else {
      this.kind = kind;
    }
    this._dispatchChangeEvent();
  }

  _typeChanged(evt) {
    this.type = evt.target.value;
    this._dispatchChangeEvent();
  }
  
  render() {
    let kindOptions = this.allowedKinds.map(kind => html`
      <mwc-list-item ?selected="${kind === this.kind}" @change=${this._kindChanged} value="${kind}">
        ${KIND_DESCRIPTIONS[kind]}
      </mwc-list-item>
    `);
    let variableOptions = this.variableNames.map((varName, index) => html`
      <mwc-list-item ?selected="${this.kind === 'variable-ref' && index === this.value}" value="var-${index}">
        ${varName}</mwc-list-item>
    `);

    let kindAndVariablesField = this.kindSelect
      ? html`<mwc-select outlined @change="${this._kindChanged}" class="kind-select">
        ${kindOptions}
        <li divider role="seperator"></li>
        ${variableOptions}
      </mwc-select>`
      : undefined;

    let typeOptions = VARIABLE_TYPES.map(type => html`
      <mwc-list-item ?selected="${type === this.type}" @change=${this._typeChanged} value="${type}">
        ${type}
      </mwc-list-item>
    `);

    let typeField = this.typeSelect
      ? html`<mwc-select outlined label="Type" @change="${this._typeChanged}" class="type-select">${typeOptions}</mwc-select>`
      : undefined;

    let valueField;
    if (this.kind === 'constant') {
      switch (this.type) {
        case 'int':
          valueField = html`<mwc-textfield outlined label="Value" @change=${this._valueChanged} value="${this.value}">
            </mwc-textfield>`;
          break;
        case 'bool':
          valueField = html`<mwc-checkbox label="Value" @change=${this._valueChanged} ?checked="${this.value > 0}">
            </mwc-checkbox>`;
          break;
      }
    }

    return html`
      ${kindAndVariablesField}
      ${typeField}
      ${valueField}
    `;
  }
}

customElements.define('generic-input', GenericInput);
