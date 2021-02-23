import { LitElement, html } from 'lit-element';
import '@material/mwc-circular-progress';
import '@material/mwc-button';
import '@material/mwc-select';
import '@material/mwc-formfield';
import '@material/mwc-checkbox';

import { loadAndParseFunctions } from '../lib/load-functions';
import { CodeModel } from '../lib/code-model';
import './block-editor';

class AppRoot extends LitElement {
  static get properties() {
    return { loading: { type: Boolean } };
  }

  constructor() {
    super();
    this.loading = true;
  }

  async connectedCallback() {
    super.connectedCallback();

    let functions = await loadAndParseFunctions();
    this.codeModel = new CodeModel(functions);

    this.loading = false;

    setTimeout(() => {
      this.codeEditor = CodeMirror.fromTextArea(this.querySelector('#code'), {
        lineNumbers: true,
        mode: {
          name: 'gas',
          architecture: 'ARM',
        }
      });
      this._generateCode();
    });

    this.codeModel.onChanged.addListener(this._generateCode.bind(this));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.codeModel.onChanged.removeListener(this._generateCode);
  }

  createRenderRoot() {
    // Disable shadow DOM for Codemirror
    return this;
  }

  _generateCode() {
    this.codeEditor.setValue(this.codeModel.generateCode());
  }

  _copyCode() {
    navigator.clipboard.writeText(this.codeEditor.getValue());
  }

  _regionChanged(evt) {
    this.codeModel.region = evt.target.value;
    this._generateCode();
  }

  _r10ReturnChanged(evt) {
    this.codeModel.r10ReturnValue = evt.target.checked;
    this._generateCode();
  }

  _save() {
    let a = document.createElement("a");
    let file = new Blob([this.codeEditor.getValue()], {type: 'text/plain'});
    let url = URL.createObjectURL(file);
    a.href = url;
    a.download = 'code.asm';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }
  
  render() {
    if (this.loading) {
      return html`
<div class="loading-container">
  <mwc-circular-progress indeterminate></mwc-circular-progress>
</div>
`;
    }
    return html`
<block-editor .subgraph=${this.codeModel}></block-editor>
<div class="side">

  <div class="header">
    <h2>Settings</h2>
  </div>
  <div class="settings">
    <mwc-select outlined label="Region" @change="${this._regionChanged}">
      <mwc-list-item selected value="us">US</mwc-list-item>
      <mwc-list-item value="eu">EU</mwc-list-item>
    </mwc-select>
    <mwc-formfield label="Set unknown r10 return value to true">
      <mwc-checkbox @change="${this._r10ReturnChanged}"></mwc-checkbox>
    </mwc-formfield>
  </div>

  <div class="header">
    <h2>Output</h2>
    <div class="header-options">
      <div class="buttons">
        <mwc-button raised icon="code" label="Generate" @click="${this._generateCode}"></mwc-button>
        <mwc-button outlined icon="content_copy" label="Copy" @click="${this._copyCode}"></mwc-button>
        <mwc-button outlined icon="save" label="Save" @click="${this._save}"></mwc-button>
      </div>
    </div>
  </div>
  <textarea id="code"></textarea>

  <div class="footer">
    <a href="https://github.com/tech-ticks/eos-effect-editor" rel="noreferrer noopener"
      target="_blank">GitHub</a>
    <span class="seperator"></span>
    <a href="https://github.com/tech-ticks/eos-effect-editor/issues/new" rel="noreferrer noopener"
      target="_blank">Report issue</a>
  </div>

</div>
`;
  }
}

customElements.define('app-root', AppRoot);

export function getCodeModel() {
  return document.getElementById('app-root').codeModel;
}
