import { LitElement, html, css } from 'lit-element';

import '@material/mwc-textfield';
import '@material/mwc-select';
import '@material/mwc-checkbox';

const KIND_DESCRIPTIONS = {
  'constant': 'Constant value',
  'last-result': 'Result of last operation',
};

class GenericInput extends LitElement {
  static get properties() {
    return {
      kind: { type: String },
      value: { type: Number },
      type: { type: String },
      annotation: { type: String },
      allowedKinds: { type: Array },
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
`;
  }

  constructor() {
    super();
    this.allowedKinds = Object.keys(KIND_DESCRIPTIONS);
    this.value = 0;
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
        constantValue: this.value
      }
    }));
  }

  _valueChanged(evt) {
    this.value = evt.target.value || Number(evt.target.checked);
    this._dispatchChangeEvent();
  }

  _kindChanged(evt) {
    this.kind = evt.target.value;
    this._dispatchChangeEvent();
  }
  
  render() {
    let options = this.allowedKinds.map(kind => html`
      <mwc-list-item ?selected="${kind === this.kind}" @change=${this._kindChanged} value="${kind}">
        ${KIND_DESCRIPTIONS[kind]}
      </mwc-list-item>
    `);

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
<mwc-select outlined @change="${this._kindChanged}" class="kind-select">${options}</mwc-select>
${valueField}
    `;
  }
}

customElements.define('generic-input', GenericInput);
