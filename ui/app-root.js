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
    return {
      loading: { type: Boolean },
      environment: { type: String },
      region: { type: String },
      r10ReturnValue: { type: Boolean },
    };
  }

  constructor() {
    super();
    this.loading = true;
    this.environment = 'eos-moves';
    this.region = 'us';
    this.r10ReturnValue = false;
    this.fileInput = undefined;
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
    this.codeEditor?.setValue(this.codeModel.generateCode());
  }

  _copyCode() {
    navigator.clipboard.writeText(this.codeEditor.getValue());
  }

  _regionChanged(evt) {
    this.codeModel.region = evt.target.value;
    this._generateCode();
  }

  _environmentChanged(evt) {
    this.environment = evt.target.value;
    this.codeModel.setEnvironment(this.environment);
    this.codeModel.validateAllNodes();
    this._generateCode();
  }

  _r10ReturnChanged(evt) {
    this.codeModel.r10ReturnValue = evt.target.checked;
    this._generateCode();
  }

  _addVariable() {
    this.codeModel.addVariable('New Variable', 'int', 0);
    this.requestUpdate();
  }

  _changeVariableName(evt, variable) {
    variable.name = evt.target.value;
    this.codeModel.notifyVariableUpdated(variable);
  }

  _changeVariableValue(evt, variable) {
    const { type, constantValue } = evt.detail;
    variable.type = type;
    variable.defaultValue = constantValue;

    // Handle the case when an int is changed to a bool
    if (variable.type === 'bool' && variable.defaultValue > 1) {
      variable.defaultValue = 1;
    }
    this.codeModel.notifyVariableUpdated(variable);

    this.requestUpdate();
  }

  _saveCodeToFile() {
    this._saveStringToFile(this.codeEditor.getValue(), 'code.asm');
  }

  _saveProjectAsJson() {
    this._saveStringToFile(this.codeModel.toJson(), 'asmeditor-project.json');
  }

  _loadProjectFromJson() {
    if (this.fileInput) {
      // Stupid workaround since it's impossible to find out if the "cancel" button was clicked
      document.body.removeChild(this.fileInput);
      this.fileInput = undefined;
    }

    this.fileInput = document.createElement('input');
    this.fileInput.style.display = 'none';
    this.fileInput.type = 'file';
    document.body.appendChild(this.fileInput);

    this.fileInput.addEventListener('change', evt => {
      document.body.removeChild(this.fileInput);
      this.fileInput = undefined;

      let [file] = evt.target.files;
      if (!file) {
        return;
      }

      let fileReader = new FileReader();
      fileReader.addEventListener('loadend', event => {
        try {
          this.codeModel.fromJson(event.target.result);
          this.codeModel.validateAllNodes();
          this.environment = this.codeModel.environmentName;
          this.region = this.codeModel.region;
          this.r10ReturnValue = this.codeModel.r10ReturnValue;
          this._generateCode();
          this.requestUpdate();

        } catch (e) {
          alert('An error occured while trying to load the project. '
            + 'Please report this as an error and add the error message in the console '
            + '(Open with F12 on Windows)');
          console.error(e);
        }
      });
      fileReader.readAsText(file);
    });

    this.fileInput.click();
  }

  _saveStringToFile(string, fileName) {
    let a = document.createElement('a');
    let file = new Blob([string], {type: 'text/plain'});
    let url = URL.createObjectURL(file);
    a.href = url;
    a.download = fileName;
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

    let variables = this.codeModel.variables.map(variable => html`
<div class="variable">
  <div class="variable-inner">
    <mwc-textfield outlined class="name-text" label="Name"
      @change=${(evt) => this._changeVariableName(evt, variable)} value="${variable.name}">
    </mwc-textfield>
    <generic-input .value=${variable.defaultValue} .kind=${'constant'}
      .type=${variable.type} .kindSelect=${false} .typeSelect=${true}
      @inputChange="${(evt) => this._changeVariableValue(evt, variable)}">
    </generic-input>
  </div>
  ${variable.validationError ? html`<div class="errors">
    ${variable.validationError}
  </div>` : ''}
</div>`);

    const r10Select = this.environment === 'eos-moves'
     ? html`<mwc-formfield label="Set unknown r10 return value to true">
  <mwc-checkbox ?checked=${this.r10ReturnValue} @change="${this._r10ReturnChanged}"></mwc-checkbox>
</mwc-formfield>`
      : undefined;

    return html`
<block-editor .subgraph=${this.codeModel}></block-editor>
<div class="side">

  <div class="header">
    <h2>Settings</h2>
    <div class="header-options">
      <div class="buttons">
        <mwc-button outlined icon="save" label="Save Project" @click="${this._saveProjectAsJson}"></mwc-button>
        <mwc-button outlined icon="upload_file" label="Load Project" @click="${this._loadProjectFromJson}"></mwc-button>
      </div>
    </div>
  </div>
  <div class="settings">
    <mwc-select outlined label="Project type" @change="${this._environmentChanged}">
      <mwc-list-item ?selected=${this.environment === 'eos-moves'} value="eos-moves">
        Move effect</mwc-list-item>
      <mwc-list-item ?selected=${this.environment === 'eos-items'} value="eos-items">
        Item effect</mwc-list-item>
    </mwc-select>
    <mwc-select outlined label="Region" @change="${this._regionChanged}">
      <mwc-list-item ?selected=${this.region === 'us'} value="us">US</mwc-list-item>
      <mwc-list-item ?selected=${this.region === 'eu'} value="eu">EU</mwc-list-item>
    </mwc-select>
    ${r10Select}
  </div>

  <div class="header">
    <h2>Variables</h2>
    <div class="header-options">
      <div class="buttons">
        <mwc-button raised icon="add" label="Add variable" @click="${this._addVariable}"></mwc-button>
      </div>
    </div>
  </div>

  <div class="variables">
    ${variables}
  </div>

  <div class="header">
    <h2>Output</h2>
    <div class="header-options">
      <div class="buttons">
        <mwc-button raised icon="code" label="Generate" @click="${this._generateCode}"></mwc-button>
        <mwc-button outlined icon="content_copy" label="Copy" @click="${this._copyCode}"></mwc-button>
        <mwc-button outlined icon="save" label="Save Code" @click="${this._saveCodeToFile}"></mwc-button>
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
