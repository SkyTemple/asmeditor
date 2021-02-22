import { LitElement, html, css } from 'lit-element';
import '@material/mwc-button';

import { getCodeModel } from './app-root';
import './block-menu';
import './code-block';

class BlockEditor extends LitElement {
  static get properties() {
    return {
      nodes: { type: Array },
      dragOverNodeIndex: { type: Number },
    };
  }

  static get styles() {
    return css`
:host {
  display: block;
  position: relative;
  width: 100%;
  height: 100%;
  padding: 16px 32px;
  display: flex;
  gap: 12px;
  flex-direction: column;
}

.button-with-menu {
  position: relative;
  width: 100%;
}

.button-with-menu mwc-button {
  width: 100%;
}

.block-list {
  display: flex;
  flex-direction: column;
}

.line {
  position: relative;
  display: block;
  height: 12px;
  border-left: 1px solid #ddd;
  margin: 8px 0;
  margin-left: 50%;
  content: '';
}

.drop-indicator {
  display: block;
  height: 24px;
  margin: 8px 0;
  border: 1px solid #ddd;
  border-radius: 8px;
  text-align: center;
  color: #ddd;
}
`;
  } 

  constructor() {
    super();
    this.showMenu = false;
    this.codeModel = getCodeModel();
    this.nodes = [];
    this.dragOverNodeIndex = undefined;
  }

  async connectedCallback() {
    super.connectedCallback();
    this.codeModel.onNodeAdded.addListener(this._nodeAdded.bind(this));
    this.codeModel.onNodeRemoved.addListener(this._nodeRemoved.bind(this));

    // Add the meta node
    this.nodes.push(this.codeModel.head);
  }

  async disconnectedCallback() {
    super.disconnectedCallback();
    this.codeModel.onNodeAdded.removeListener(this._nodeAdded);
    this.codeModel.onNodeAdded.removeListener(this._nodeRemoved);
  }

  _recreateNodeList() {
    let nodes = [];
    let current = this.codeModel.head;
    nodes.push(current);
    while (current = current.next) {
      nodes.push(current);
    }

    this.nodes = nodes;
    this.requestUpdate();
  }

  _nodeAdded(node) {
    this._recreateNodeList();
  }

  _nodeRemoved(node) {
    this._recreateNodeList();
  }

  _showMenu() {
    this.shadowRoot.querySelector('block-menu').show();
  }

  _dragOver(ev) {
    ev.preventDefault();
    this.dragOverNodeIndex = ev.target.index;
  }

  _dragLeave(ev) {
    this.dragOverNodeIndex = undefined;
  }

  _drop(ev) {
    ev.preventDefault();
    let sourceNodeIndex = parseInt(ev.dataTransfer.getData('index'));
    let sourceNode = this.nodes[sourceNodeIndex];
    
    let targetNode = this.nodes[this.dragOverNodeIndex];
    if (!targetNode) {
      return;
    }
    this.dragOverNodeIndex = undefined;

    if (sourceNode === targetNode) {
      return;
    }

    this.codeModel.removeNode(sourceNode, false);
    this.codeModel.insertExistingNodeAfter(sourceNode, targetNode);
    
    this._recreateNodeList();
  }
  
  render() {
    return html`
<div class="block-list">
${this.nodes.map((node, index) => html`
  <div class="drag-drop-wrapper" @drop="${this._drop}"
      @dragover="${this._dragOver}" @dragleave="${this._dragLeave}">
    <code-block .node=${node} .index=${index}></code-block>
    ${this.dragOverNodeIndex === index 
      ? html`<div class="drop-indicator">Drop to move here</div>` : html`<div class="line"></div>`}
  </div>
`)}
</div>
<div class="button-with-menu">
  <mwc-button outlined icon="add" @click="${this._showMenu}"></mwc-button>
  <block-menu></block-menu>
</div>
`;
  }
}

customElements.define('block-editor', BlockEditor);
