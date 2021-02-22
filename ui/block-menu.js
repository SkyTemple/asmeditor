import { LitElement, html, css } from 'lit-element';
import { getCodeModel } from './app-root';

import { getNodeTypeName, NODE_MAP } from '../lib/code-model';

const EXCLUDED_NODE_TYPES = ['meta', 'call'];

class BlockMenu extends LitElement {
  static get styles() {
    return css`
:host {
  display: block;
  position: absolute;
  width: 300px;
  height: 700px;
}
`;
  }

  constructor() {
    super();
    this.showMenu = false;

    this.codeModel = getCodeModel();
    this.functions = Array.from(this.codeModel.functions.keys());
    this.nodeTypes = Object.keys(NODE_MAP).filter(type => !EXCLUDED_NODE_TYPES.includes(type));
  }

  show() {
    this.shadowRoot.querySelector('mwc-menu').show();
  }

  _addNode(evt) {
    this.codeModel.addNode(evt.target.value);
  }

  _addCallNode(evt) {
    this.codeModel.addCallNode(evt.target.value);
  }
  
  render() {
    return html`
<mwc-menu>
${this.nodeTypes.map(item => html`
  <mwc-list-item group="default" @click="${this._addNode}" 
    value=${item}>${getNodeTypeName(item)}</mwc-list-item>`)}

  <li divider role="seperator"></li>

  ${this.functions.map(item => html`
    <mwc-list-item group="functions" @click="${this._addCallNode}" 
      value=${item}>${item}</mwc-list-item>`)}
</mwc-menu>
`;
  }
}

customElements.define('block-menu', BlockMenu);
