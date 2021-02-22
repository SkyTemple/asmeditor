(() => {
  // node_modules/lit-html/lib/dom.js
  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  var isCEPolyfill = typeof window !== "undefined" && window.customElements != null && window.customElements.polyfillWrapFlushCallback !== void 0;
  var removeNodes = (container, start, end = null) => {
    while (start !== end) {
      const n = start.nextSibling;
      container.removeChild(start);
      start = n;
    }
  };

  // node_modules/lit-html/lib/template.js
  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  var marker = `{{lit-${String(Math.random()).slice(2)}}}`;
  var nodeMarker = `<!--${marker}-->`;
  var markerRegex = new RegExp(`${marker}|${nodeMarker}`);
  var boundAttributeSuffix = "$lit$";
  var Template = class {
    constructor(result, element) {
      this.parts = [];
      this.element = element;
      const nodesToRemove = [];
      const stack = [];
      const walker = document.createTreeWalker(element.content, 133, null, false);
      let lastPartIndex = 0;
      let index = -1;
      let partIndex = 0;
      const {strings: strings9, values: {length}} = result;
      while (partIndex < length) {
        const node = walker.nextNode();
        if (node === null) {
          walker.currentNode = stack.pop();
          continue;
        }
        index++;
        if (node.nodeType === 1) {
          if (node.hasAttributes()) {
            const attributes = node.attributes;
            const {length: length2} = attributes;
            let count = 0;
            for (let i = 0; i < length2; i++) {
              if (endsWith(attributes[i].name, boundAttributeSuffix)) {
                count++;
              }
            }
            while (count-- > 0) {
              const stringForPart = strings9[partIndex];
              const name = lastAttributeNameRegex.exec(stringForPart)[2];
              const attributeLookupName = name.toLowerCase() + boundAttributeSuffix;
              const attributeValue = node.getAttribute(attributeLookupName);
              node.removeAttribute(attributeLookupName);
              const statics = attributeValue.split(markerRegex);
              this.parts.push({type: "attribute", index, name, strings: statics});
              partIndex += statics.length - 1;
            }
          }
          if (node.tagName === "TEMPLATE") {
            stack.push(node);
            walker.currentNode = node.content;
          }
        } else if (node.nodeType === 3) {
          const data = node.data;
          if (data.indexOf(marker) >= 0) {
            const parent = node.parentNode;
            const strings10 = data.split(markerRegex);
            const lastIndex = strings10.length - 1;
            for (let i = 0; i < lastIndex; i++) {
              let insert;
              let s = strings10[i];
              if (s === "") {
                insert = createMarker();
              } else {
                const match = lastAttributeNameRegex.exec(s);
                if (match !== null && endsWith(match[2], boundAttributeSuffix)) {
                  s = s.slice(0, match.index) + match[1] + match[2].slice(0, -boundAttributeSuffix.length) + match[3];
                }
                insert = document.createTextNode(s);
              }
              parent.insertBefore(insert, node);
              this.parts.push({type: "node", index: ++index});
            }
            if (strings10[lastIndex] === "") {
              parent.insertBefore(createMarker(), node);
              nodesToRemove.push(node);
            } else {
              node.data = strings10[lastIndex];
            }
            partIndex += lastIndex;
          }
        } else if (node.nodeType === 8) {
          if (node.data === marker) {
            const parent = node.parentNode;
            if (node.previousSibling === null || index === lastPartIndex) {
              index++;
              parent.insertBefore(createMarker(), node);
            }
            lastPartIndex = index;
            this.parts.push({type: "node", index});
            if (node.nextSibling === null) {
              node.data = "";
            } else {
              nodesToRemove.push(node);
              index--;
            }
            partIndex++;
          } else {
            let i = -1;
            while ((i = node.data.indexOf(marker, i + 1)) !== -1) {
              this.parts.push({type: "node", index: -1});
              partIndex++;
            }
          }
        }
      }
      for (const n of nodesToRemove) {
        n.parentNode.removeChild(n);
      }
    }
  };
  var endsWith = (str, suffix) => {
    const index = str.length - suffix.length;
    return index >= 0 && str.slice(index) === suffix;
  };
  var isTemplatePartActive = (part) => part.index !== -1;
  var createMarker = () => document.createComment("");
  var lastAttributeNameRegex = /([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F "'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;

  // node_modules/lit-html/lib/modify-template.js
  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  var walkerNodeFilter = 133;
  function removeNodesFromTemplate(template, nodesToRemove) {
    const {element: {content}, parts: parts2} = template;
    const walker = document.createTreeWalker(content, walkerNodeFilter, null, false);
    let partIndex = nextActiveIndexInTemplateParts(parts2);
    let part = parts2[partIndex];
    let nodeIndex = -1;
    let removeCount = 0;
    const nodesToRemoveInTemplate = [];
    let currentRemovingNode = null;
    while (walker.nextNode()) {
      nodeIndex++;
      const node = walker.currentNode;
      if (node.previousSibling === currentRemovingNode) {
        currentRemovingNode = null;
      }
      if (nodesToRemove.has(node)) {
        nodesToRemoveInTemplate.push(node);
        if (currentRemovingNode === null) {
          currentRemovingNode = node;
        }
      }
      if (currentRemovingNode !== null) {
        removeCount++;
      }
      while (part !== void 0 && part.index === nodeIndex) {
        part.index = currentRemovingNode !== null ? -1 : part.index - removeCount;
        partIndex = nextActiveIndexInTemplateParts(parts2, partIndex);
        part = parts2[partIndex];
      }
    }
    nodesToRemoveInTemplate.forEach((n) => n.parentNode.removeChild(n));
  }
  var countNodes = (node) => {
    let count = node.nodeType === 11 ? 0 : 1;
    const walker = document.createTreeWalker(node, walkerNodeFilter, null, false);
    while (walker.nextNode()) {
      count++;
    }
    return count;
  };
  var nextActiveIndexInTemplateParts = (parts2, startIndex = -1) => {
    for (let i = startIndex + 1; i < parts2.length; i++) {
      const part = parts2[i];
      if (isTemplatePartActive(part)) {
        return i;
      }
    }
    return -1;
  };
  function insertNodeIntoTemplate(template, node, refNode = null) {
    const {element: {content}, parts: parts2} = template;
    if (refNode === null || refNode === void 0) {
      content.appendChild(node);
      return;
    }
    const walker = document.createTreeWalker(content, walkerNodeFilter, null, false);
    let partIndex = nextActiveIndexInTemplateParts(parts2);
    let insertCount = 0;
    let walkerIndex = -1;
    while (walker.nextNode()) {
      walkerIndex++;
      const walkerNode = walker.currentNode;
      if (walkerNode === refNode) {
        insertCount = countNodes(node);
        refNode.parentNode.insertBefore(node, refNode);
      }
      while (partIndex !== -1 && parts2[partIndex].index === walkerIndex) {
        if (insertCount > 0) {
          while (partIndex !== -1) {
            parts2[partIndex].index += insertCount;
            partIndex = nextActiveIndexInTemplateParts(parts2, partIndex);
          }
          return;
        }
        partIndex = nextActiveIndexInTemplateParts(parts2, partIndex);
      }
    }
  }

  // node_modules/lit-html/lib/directive.js
  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  var directives = new WeakMap();
  var directive = (f) => (...args) => {
    const d = f(...args);
    directives.set(d, true);
    return d;
  };
  var isDirective = (o) => {
    return typeof o === "function" && directives.has(o);
  };

  // node_modules/lit-html/lib/part.js
  /**
   * @license
   * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  var noChange = {};
  var nothing = {};

  // node_modules/lit-html/lib/template-instance.js
  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  var TemplateInstance = class {
    constructor(template, processor, options) {
      this.__parts = [];
      this.template = template;
      this.processor = processor;
      this.options = options;
    }
    update(values) {
      let i = 0;
      for (const part of this.__parts) {
        if (part !== void 0) {
          part.setValue(values[i]);
        }
        i++;
      }
      for (const part of this.__parts) {
        if (part !== void 0) {
          part.commit();
        }
      }
    }
    _clone() {
      const fragment = isCEPolyfill ? this.template.element.content.cloneNode(true) : document.importNode(this.template.element.content, true);
      const stack = [];
      const parts2 = this.template.parts;
      const walker = document.createTreeWalker(fragment, 133, null, false);
      let partIndex = 0;
      let nodeIndex = 0;
      let part;
      let node = walker.nextNode();
      while (partIndex < parts2.length) {
        part = parts2[partIndex];
        if (!isTemplatePartActive(part)) {
          this.__parts.push(void 0);
          partIndex++;
          continue;
        }
        while (nodeIndex < part.index) {
          nodeIndex++;
          if (node.nodeName === "TEMPLATE") {
            stack.push(node);
            walker.currentNode = node.content;
          }
          if ((node = walker.nextNode()) === null) {
            walker.currentNode = stack.pop();
            node = walker.nextNode();
          }
        }
        if (part.type === "node") {
          const part2 = this.processor.handleTextExpression(this.options);
          part2.insertAfterNode(node.previousSibling);
          this.__parts.push(part2);
        } else {
          this.__parts.push(...this.processor.handleAttributeExpressions(node, part.name, part.strings, this.options));
        }
        partIndex++;
      }
      if (isCEPolyfill) {
        document.adoptNode(fragment);
        customElements.upgrade(fragment);
      }
      return fragment;
    }
  };

  // node_modules/lit-html/lib/template-result.js
  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  var policy = window.trustedTypes && trustedTypes.createPolicy("lit-html", {createHTML: (s) => s});
  var commentMarker = ` ${marker} `;
  var TemplateResult = class {
    constructor(strings9, values, type, processor) {
      this.strings = strings9;
      this.values = values;
      this.type = type;
      this.processor = processor;
    }
    getHTML() {
      const l = this.strings.length - 1;
      let html2 = "";
      let isCommentBinding = false;
      for (let i = 0; i < l; i++) {
        const s = this.strings[i];
        const commentOpen = s.lastIndexOf("<!--");
        isCommentBinding = (commentOpen > -1 || isCommentBinding) && s.indexOf("-->", commentOpen + 1) === -1;
        const attributeMatch = lastAttributeNameRegex.exec(s);
        if (attributeMatch === null) {
          html2 += s + (isCommentBinding ? commentMarker : nodeMarker);
        } else {
          html2 += s.substr(0, attributeMatch.index) + attributeMatch[1] + attributeMatch[2] + boundAttributeSuffix + attributeMatch[3] + marker;
        }
      }
      html2 += this.strings[l];
      return html2;
    }
    getTemplateElement() {
      const template = document.createElement("template");
      let value = this.getHTML();
      if (policy !== void 0) {
        value = policy.createHTML(value);
      }
      template.innerHTML = value;
      return template;
    }
  };

  // node_modules/lit-html/lib/parts.js
  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  var isPrimitive = (value) => {
    return value === null || !(typeof value === "object" || typeof value === "function");
  };
  var isIterable = (value) => {
    return Array.isArray(value) || !!(value && value[Symbol.iterator]);
  };
  var AttributeCommitter = class {
    constructor(element, name, strings9) {
      this.dirty = true;
      this.element = element;
      this.name = name;
      this.strings = strings9;
      this.parts = [];
      for (let i = 0; i < strings9.length - 1; i++) {
        this.parts[i] = this._createPart();
      }
    }
    _createPart() {
      return new AttributePart(this);
    }
    _getValue() {
      const strings9 = this.strings;
      const l = strings9.length - 1;
      const parts2 = this.parts;
      if (l === 1 && strings9[0] === "" && strings9[1] === "") {
        const v = parts2[0].value;
        if (typeof v === "symbol") {
          return String(v);
        }
        if (typeof v === "string" || !isIterable(v)) {
          return v;
        }
      }
      let text = "";
      for (let i = 0; i < l; i++) {
        text += strings9[i];
        const part = parts2[i];
        if (part !== void 0) {
          const v = part.value;
          if (isPrimitive(v) || !isIterable(v)) {
            text += typeof v === "string" ? v : String(v);
          } else {
            for (const t of v) {
              text += typeof t === "string" ? t : String(t);
            }
          }
        }
      }
      text += strings9[l];
      return text;
    }
    commit() {
      if (this.dirty) {
        this.dirty = false;
        this.element.setAttribute(this.name, this._getValue());
      }
    }
  };
  var AttributePart = class {
    constructor(committer) {
      this.value = void 0;
      this.committer = committer;
    }
    setValue(value) {
      if (value !== noChange && (!isPrimitive(value) || value !== this.value)) {
        this.value = value;
        if (!isDirective(value)) {
          this.committer.dirty = true;
        }
      }
    }
    commit() {
      while (isDirective(this.value)) {
        const directive2 = this.value;
        this.value = noChange;
        directive2(this);
      }
      if (this.value === noChange) {
        return;
      }
      this.committer.commit();
    }
  };
  var NodePart = class {
    constructor(options) {
      this.value = void 0;
      this.__pendingValue = void 0;
      this.options = options;
    }
    appendInto(container) {
      this.startNode = container.appendChild(createMarker());
      this.endNode = container.appendChild(createMarker());
    }
    insertAfterNode(ref) {
      this.startNode = ref;
      this.endNode = ref.nextSibling;
    }
    appendIntoPart(part) {
      part.__insert(this.startNode = createMarker());
      part.__insert(this.endNode = createMarker());
    }
    insertAfterPart(ref) {
      ref.__insert(this.startNode = createMarker());
      this.endNode = ref.endNode;
      ref.endNode = this.startNode;
    }
    setValue(value) {
      this.__pendingValue = value;
    }
    commit() {
      if (this.startNode.parentNode === null) {
        return;
      }
      while (isDirective(this.__pendingValue)) {
        const directive2 = this.__pendingValue;
        this.__pendingValue = noChange;
        directive2(this);
      }
      const value = this.__pendingValue;
      if (value === noChange) {
        return;
      }
      if (isPrimitive(value)) {
        if (value !== this.value) {
          this.__commitText(value);
        }
      } else if (value instanceof TemplateResult) {
        this.__commitTemplateResult(value);
      } else if (value instanceof Node) {
        this.__commitNode(value);
      } else if (isIterable(value)) {
        this.__commitIterable(value);
      } else if (value === nothing) {
        this.value = nothing;
        this.clear();
      } else {
        this.__commitText(value);
      }
    }
    __insert(node) {
      this.endNode.parentNode.insertBefore(node, this.endNode);
    }
    __commitNode(value) {
      if (this.value === value) {
        return;
      }
      this.clear();
      this.__insert(value);
      this.value = value;
    }
    __commitText(value) {
      const node = this.startNode.nextSibling;
      value = value == null ? "" : value;
      const valueAsString = typeof value === "string" ? value : String(value);
      if (node === this.endNode.previousSibling && node.nodeType === 3) {
        node.data = valueAsString;
      } else {
        this.__commitNode(document.createTextNode(valueAsString));
      }
      this.value = value;
    }
    __commitTemplateResult(value) {
      const template = this.options.templateFactory(value);
      if (this.value instanceof TemplateInstance && this.value.template === template) {
        this.value.update(value.values);
      } else {
        const instance = new TemplateInstance(template, value.processor, this.options);
        const fragment = instance._clone();
        instance.update(value.values);
        this.__commitNode(fragment);
        this.value = instance;
      }
    }
    __commitIterable(value) {
      if (!Array.isArray(this.value)) {
        this.value = [];
        this.clear();
      }
      const itemParts = this.value;
      let partIndex = 0;
      let itemPart;
      for (const item of value) {
        itemPart = itemParts[partIndex];
        if (itemPart === void 0) {
          itemPart = new NodePart(this.options);
          itemParts.push(itemPart);
          if (partIndex === 0) {
            itemPart.appendIntoPart(this);
          } else {
            itemPart.insertAfterPart(itemParts[partIndex - 1]);
          }
        }
        itemPart.setValue(item);
        itemPart.commit();
        partIndex++;
      }
      if (partIndex < itemParts.length) {
        itemParts.length = partIndex;
        this.clear(itemPart && itemPart.endNode);
      }
    }
    clear(startNode = this.startNode) {
      removeNodes(this.startNode.parentNode, startNode.nextSibling, this.endNode);
    }
  };
  var BooleanAttributePart = class {
    constructor(element, name, strings9) {
      this.value = void 0;
      this.__pendingValue = void 0;
      if (strings9.length !== 2 || strings9[0] !== "" || strings9[1] !== "") {
        throw new Error("Boolean attributes can only contain a single expression");
      }
      this.element = element;
      this.name = name;
      this.strings = strings9;
    }
    setValue(value) {
      this.__pendingValue = value;
    }
    commit() {
      while (isDirective(this.__pendingValue)) {
        const directive2 = this.__pendingValue;
        this.__pendingValue = noChange;
        directive2(this);
      }
      if (this.__pendingValue === noChange) {
        return;
      }
      const value = !!this.__pendingValue;
      if (this.value !== value) {
        if (value) {
          this.element.setAttribute(this.name, "");
        } else {
          this.element.removeAttribute(this.name);
        }
        this.value = value;
      }
      this.__pendingValue = noChange;
    }
  };
  var PropertyCommitter = class extends AttributeCommitter {
    constructor(element, name, strings9) {
      super(element, name, strings9);
      this.single = strings9.length === 2 && strings9[0] === "" && strings9[1] === "";
    }
    _createPart() {
      return new PropertyPart(this);
    }
    _getValue() {
      if (this.single) {
        return this.parts[0].value;
      }
      return super._getValue();
    }
    commit() {
      if (this.dirty) {
        this.dirty = false;
        this.element[this.name] = this._getValue();
      }
    }
  };
  var PropertyPart = class extends AttributePart {
  };
  var eventOptionsSupported = false;
  (() => {
    try {
      const options = {
        get capture() {
          eventOptionsSupported = true;
          return false;
        }
      };
      window.addEventListener("test", options, options);
      window.removeEventListener("test", options, options);
    } catch (_e) {
    }
  })();
  var EventPart = class {
    constructor(element, eventName, eventContext) {
      this.value = void 0;
      this.__pendingValue = void 0;
      this.element = element;
      this.eventName = eventName;
      this.eventContext = eventContext;
      this.__boundHandleEvent = (e) => this.handleEvent(e);
    }
    setValue(value) {
      this.__pendingValue = value;
    }
    commit() {
      while (isDirective(this.__pendingValue)) {
        const directive2 = this.__pendingValue;
        this.__pendingValue = noChange;
        directive2(this);
      }
      if (this.__pendingValue === noChange) {
        return;
      }
      const newListener = this.__pendingValue;
      const oldListener = this.value;
      const shouldRemoveListener = newListener == null || oldListener != null && (newListener.capture !== oldListener.capture || newListener.once !== oldListener.once || newListener.passive !== oldListener.passive);
      const shouldAddListener = newListener != null && (oldListener == null || shouldRemoveListener);
      if (shouldRemoveListener) {
        this.element.removeEventListener(this.eventName, this.__boundHandleEvent, this.__options);
      }
      if (shouldAddListener) {
        this.__options = getOptions(newListener);
        this.element.addEventListener(this.eventName, this.__boundHandleEvent, this.__options);
      }
      this.value = newListener;
      this.__pendingValue = noChange;
    }
    handleEvent(event) {
      if (typeof this.value === "function") {
        this.value.call(this.eventContext || this.element, event);
      } else {
        this.value.handleEvent(event);
      }
    }
  };
  var getOptions = (o) => o && (eventOptionsSupported ? {capture: o.capture, passive: o.passive, once: o.once} : o.capture);

  // node_modules/lit-html/lib/template-factory.js
  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  function templateFactory(result) {
    let templateCache = templateCaches.get(result.type);
    if (templateCache === void 0) {
      templateCache = {
        stringsArray: new WeakMap(),
        keyString: new Map()
      };
      templateCaches.set(result.type, templateCache);
    }
    let template = templateCache.stringsArray.get(result.strings);
    if (template !== void 0) {
      return template;
    }
    const key = result.strings.join(marker);
    template = templateCache.keyString.get(key);
    if (template === void 0) {
      template = new Template(result, result.getTemplateElement());
      templateCache.keyString.set(key, template);
    }
    templateCache.stringsArray.set(result.strings, template);
    return template;
  }
  var templateCaches = new Map();

  // node_modules/lit-html/lib/render.js
  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  var parts = new WeakMap();
  var render = (result, container, options) => {
    let part = parts.get(container);
    if (part === void 0) {
      removeNodes(container, container.firstChild);
      parts.set(container, part = new NodePart(Object.assign({templateFactory}, options)));
      part.appendInto(container);
    }
    part.setValue(result);
    part.commit();
  };

  // node_modules/lit-html/lib/default-template-processor.js
  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  var DefaultTemplateProcessor = class {
    handleAttributeExpressions(element, name, strings9, options) {
      const prefix = name[0];
      if (prefix === ".") {
        const committer2 = new PropertyCommitter(element, name.slice(1), strings9);
        return committer2.parts;
      }
      if (prefix === "@") {
        return [new EventPart(element, name.slice(1), options.eventContext)];
      }
      if (prefix === "?") {
        return [new BooleanAttributePart(element, name.slice(1), strings9)];
      }
      const committer = new AttributeCommitter(element, name, strings9);
      return committer.parts;
    }
    handleTextExpression(options) {
      return new NodePart(options);
    }
  };
  var defaultTemplateProcessor = new DefaultTemplateProcessor();

  // node_modules/lit-html/lit-html.js
  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  if (typeof window !== "undefined") {
    (window["litHtmlVersions"] || (window["litHtmlVersions"] = [])).push("1.3.0");
  }
  var html = (strings9, ...values) => new TemplateResult(strings9, values, "html", defaultTemplateProcessor);

  // node_modules/lit-html/lib/shady-render.js
  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  var getTemplateCacheKey = (type, scopeName) => `${type}--${scopeName}`;
  var compatibleShadyCSSVersion = true;
  if (typeof window.ShadyCSS === "undefined") {
    compatibleShadyCSSVersion = false;
  } else if (typeof window.ShadyCSS.prepareTemplateDom === "undefined") {
    console.warn(`Incompatible ShadyCSS version detected. Please update to at least @webcomponents/webcomponentsjs@2.0.2 and @webcomponents/shadycss@1.3.1.`);
    compatibleShadyCSSVersion = false;
  }
  var shadyTemplateFactory = (scopeName) => (result) => {
    const cacheKey = getTemplateCacheKey(result.type, scopeName);
    let templateCache = templateCaches.get(cacheKey);
    if (templateCache === void 0) {
      templateCache = {
        stringsArray: new WeakMap(),
        keyString: new Map()
      };
      templateCaches.set(cacheKey, templateCache);
    }
    let template = templateCache.stringsArray.get(result.strings);
    if (template !== void 0) {
      return template;
    }
    const key = result.strings.join(marker);
    template = templateCache.keyString.get(key);
    if (template === void 0) {
      const element = result.getTemplateElement();
      if (compatibleShadyCSSVersion) {
        window.ShadyCSS.prepareTemplateDom(element, scopeName);
      }
      template = new Template(result, element);
      templateCache.keyString.set(key, template);
    }
    templateCache.stringsArray.set(result.strings, template);
    return template;
  };
  var TEMPLATE_TYPES = ["html", "svg"];
  var removeStylesFromLitTemplates = (scopeName) => {
    TEMPLATE_TYPES.forEach((type) => {
      const templates = templateCaches.get(getTemplateCacheKey(type, scopeName));
      if (templates !== void 0) {
        templates.keyString.forEach((template) => {
          const {element: {content}} = template;
          const styles = new Set();
          Array.from(content.querySelectorAll("style")).forEach((s) => {
            styles.add(s);
          });
          removeNodesFromTemplate(template, styles);
        });
      }
    });
  };
  var shadyRenderSet = new Set();
  var prepareTemplateStyles = (scopeName, renderedDOM, template) => {
    shadyRenderSet.add(scopeName);
    const templateElement = !!template ? template.element : document.createElement("template");
    const styles = renderedDOM.querySelectorAll("style");
    const {length} = styles;
    if (length === 0) {
      window.ShadyCSS.prepareTemplateStyles(templateElement, scopeName);
      return;
    }
    const condensedStyle = document.createElement("style");
    for (let i = 0; i < length; i++) {
      const style16 = styles[i];
      style16.parentNode.removeChild(style16);
      condensedStyle.textContent += style16.textContent;
    }
    removeStylesFromLitTemplates(scopeName);
    const content = templateElement.content;
    if (!!template) {
      insertNodeIntoTemplate(template, condensedStyle, content.firstChild);
    } else {
      content.insertBefore(condensedStyle, content.firstChild);
    }
    window.ShadyCSS.prepareTemplateStyles(templateElement, scopeName);
    const style15 = content.querySelector("style");
    if (window.ShadyCSS.nativeShadow && style15 !== null) {
      renderedDOM.insertBefore(style15.cloneNode(true), renderedDOM.firstChild);
    } else if (!!template) {
      content.insertBefore(condensedStyle, content.firstChild);
      const removes = new Set();
      removes.add(condensedStyle);
      removeNodesFromTemplate(template, removes);
    }
  };
  var render2 = (result, container, options) => {
    if (!options || typeof options !== "object" || !options.scopeName) {
      throw new Error("The `scopeName` option is required.");
    }
    const scopeName = options.scopeName;
    const hasRendered = parts.has(container);
    const needsScoping = compatibleShadyCSSVersion && container.nodeType === 11 && !!container.host;
    const firstScopeRender = needsScoping && !shadyRenderSet.has(scopeName);
    const renderContainer = firstScopeRender ? document.createDocumentFragment() : container;
    render(result, renderContainer, Object.assign({templateFactory: shadyTemplateFactory(scopeName)}, options));
    if (firstScopeRender) {
      const part = parts.get(renderContainer);
      parts.delete(renderContainer);
      const template = part.value instanceof TemplateInstance ? part.value.template : void 0;
      prepareTemplateStyles(scopeName, renderContainer, template);
      removeNodes(container, container.firstChild);
      container.appendChild(renderContainer);
      parts.set(container, part);
    }
    if (!hasRendered && needsScoping) {
      window.ShadyCSS.styleElement(container.host);
    }
  };

  // node_modules/lit-element/lib/updating-element.js
  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  var _a;
  window.JSCompiler_renameProperty = (prop, _obj) => prop;
  var defaultConverter = {
    toAttribute(value, type) {
      switch (type) {
        case Boolean:
          return value ? "" : null;
        case Object:
        case Array:
          return value == null ? value : JSON.stringify(value);
      }
      return value;
    },
    fromAttribute(value, type) {
      switch (type) {
        case Boolean:
          return value !== null;
        case Number:
          return value === null ? null : Number(value);
        case Object:
        case Array:
          return JSON.parse(value);
      }
      return value;
    }
  };
  var notEqual = (value, old) => {
    return old !== value && (old === old || value === value);
  };
  var defaultPropertyDeclaration = {
    attribute: true,
    type: String,
    converter: defaultConverter,
    reflect: false,
    hasChanged: notEqual
  };
  var STATE_HAS_UPDATED = 1;
  var STATE_UPDATE_REQUESTED = 1 << 2;
  var STATE_IS_REFLECTING_TO_ATTRIBUTE = 1 << 3;
  var STATE_IS_REFLECTING_TO_PROPERTY = 1 << 4;
  var finalized = "finalized";
  var UpdatingElement = class extends HTMLElement {
    constructor() {
      super();
      this.initialize();
    }
    static get observedAttributes() {
      this.finalize();
      const attributes = [];
      this._classProperties.forEach((v, p) => {
        const attr = this._attributeNameForProperty(p, v);
        if (attr !== void 0) {
          this._attributeToPropertyMap.set(attr, p);
          attributes.push(attr);
        }
      });
      return attributes;
    }
    static _ensureClassProperties() {
      if (!this.hasOwnProperty(JSCompiler_renameProperty("_classProperties", this))) {
        this._classProperties = new Map();
        const superProperties = Object.getPrototypeOf(this)._classProperties;
        if (superProperties !== void 0) {
          superProperties.forEach((v, k) => this._classProperties.set(k, v));
        }
      }
    }
    static createProperty(name, options = defaultPropertyDeclaration) {
      this._ensureClassProperties();
      this._classProperties.set(name, options);
      if (options.noAccessor || this.prototype.hasOwnProperty(name)) {
        return;
      }
      const key = typeof name === "symbol" ? Symbol() : `__${name}`;
      const descriptor = this.getPropertyDescriptor(name, key, options);
      if (descriptor !== void 0) {
        Object.defineProperty(this.prototype, name, descriptor);
      }
    }
    static getPropertyDescriptor(name, key, options) {
      return {
        get() {
          return this[key];
        },
        set(value) {
          const oldValue = this[name];
          this[key] = value;
          this.requestUpdateInternal(name, oldValue, options);
        },
        configurable: true,
        enumerable: true
      };
    }
    static getPropertyOptions(name) {
      return this._classProperties && this._classProperties.get(name) || defaultPropertyDeclaration;
    }
    static finalize() {
      const superCtor = Object.getPrototypeOf(this);
      if (!superCtor.hasOwnProperty(finalized)) {
        superCtor.finalize();
      }
      this[finalized] = true;
      this._ensureClassProperties();
      this._attributeToPropertyMap = new Map();
      if (this.hasOwnProperty(JSCompiler_renameProperty("properties", this))) {
        const props = this.properties;
        const propKeys = [
          ...Object.getOwnPropertyNames(props),
          ...typeof Object.getOwnPropertySymbols === "function" ? Object.getOwnPropertySymbols(props) : []
        ];
        for (const p of propKeys) {
          this.createProperty(p, props[p]);
        }
      }
    }
    static _attributeNameForProperty(name, options) {
      const attribute = options.attribute;
      return attribute === false ? void 0 : typeof attribute === "string" ? attribute : typeof name === "string" ? name.toLowerCase() : void 0;
    }
    static _valueHasChanged(value, old, hasChanged = notEqual) {
      return hasChanged(value, old);
    }
    static _propertyValueFromAttribute(value, options) {
      const type = options.type;
      const converter = options.converter || defaultConverter;
      const fromAttribute = typeof converter === "function" ? converter : converter.fromAttribute;
      return fromAttribute ? fromAttribute(value, type) : value;
    }
    static _propertyValueToAttribute(value, options) {
      if (options.reflect === void 0) {
        return;
      }
      const type = options.type;
      const converter = options.converter;
      const toAttribute = converter && converter.toAttribute || defaultConverter.toAttribute;
      return toAttribute(value, type);
    }
    initialize() {
      this._updateState = 0;
      this._updatePromise = new Promise((res) => this._enableUpdatingResolver = res);
      this._changedProperties = new Map();
      this._saveInstanceProperties();
      this.requestUpdateInternal();
    }
    _saveInstanceProperties() {
      this.constructor._classProperties.forEach((_v, p) => {
        if (this.hasOwnProperty(p)) {
          const value = this[p];
          delete this[p];
          if (!this._instanceProperties) {
            this._instanceProperties = new Map();
          }
          this._instanceProperties.set(p, value);
        }
      });
    }
    _applyInstanceProperties() {
      this._instanceProperties.forEach((v, p) => this[p] = v);
      this._instanceProperties = void 0;
    }
    connectedCallback() {
      this.enableUpdating();
    }
    enableUpdating() {
      if (this._enableUpdatingResolver !== void 0) {
        this._enableUpdatingResolver();
        this._enableUpdatingResolver = void 0;
      }
    }
    disconnectedCallback() {
    }
    attributeChangedCallback(name, old, value) {
      if (old !== value) {
        this._attributeToProperty(name, value);
      }
    }
    _propertyToAttribute(name, value, options = defaultPropertyDeclaration) {
      const ctor = this.constructor;
      const attr = ctor._attributeNameForProperty(name, options);
      if (attr !== void 0) {
        const attrValue = ctor._propertyValueToAttribute(value, options);
        if (attrValue === void 0) {
          return;
        }
        this._updateState = this._updateState | STATE_IS_REFLECTING_TO_ATTRIBUTE;
        if (attrValue == null) {
          this.removeAttribute(attr);
        } else {
          this.setAttribute(attr, attrValue);
        }
        this._updateState = this._updateState & ~STATE_IS_REFLECTING_TO_ATTRIBUTE;
      }
    }
    _attributeToProperty(name, value) {
      if (this._updateState & STATE_IS_REFLECTING_TO_ATTRIBUTE) {
        return;
      }
      const ctor = this.constructor;
      const propName = ctor._attributeToPropertyMap.get(name);
      if (propName !== void 0) {
        const options = ctor.getPropertyOptions(propName);
        this._updateState = this._updateState | STATE_IS_REFLECTING_TO_PROPERTY;
        this[propName] = ctor._propertyValueFromAttribute(value, options);
        this._updateState = this._updateState & ~STATE_IS_REFLECTING_TO_PROPERTY;
      }
    }
    requestUpdateInternal(name, oldValue, options) {
      let shouldRequestUpdate = true;
      if (name !== void 0) {
        const ctor = this.constructor;
        options = options || ctor.getPropertyOptions(name);
        if (ctor._valueHasChanged(this[name], oldValue, options.hasChanged)) {
          if (!this._changedProperties.has(name)) {
            this._changedProperties.set(name, oldValue);
          }
          if (options.reflect === true && !(this._updateState & STATE_IS_REFLECTING_TO_PROPERTY)) {
            if (this._reflectingProperties === void 0) {
              this._reflectingProperties = new Map();
            }
            this._reflectingProperties.set(name, options);
          }
        } else {
          shouldRequestUpdate = false;
        }
      }
      if (!this._hasRequestedUpdate && shouldRequestUpdate) {
        this._updatePromise = this._enqueueUpdate();
      }
    }
    requestUpdate(name, oldValue) {
      this.requestUpdateInternal(name, oldValue);
      return this.updateComplete;
    }
    async _enqueueUpdate() {
      this._updateState = this._updateState | STATE_UPDATE_REQUESTED;
      try {
        await this._updatePromise;
      } catch (e) {
      }
      const result = this.performUpdate();
      if (result != null) {
        await result;
      }
      return !this._hasRequestedUpdate;
    }
    get _hasRequestedUpdate() {
      return this._updateState & STATE_UPDATE_REQUESTED;
    }
    get hasUpdated() {
      return this._updateState & STATE_HAS_UPDATED;
    }
    performUpdate() {
      if (!this._hasRequestedUpdate) {
        return;
      }
      if (this._instanceProperties) {
        this._applyInstanceProperties();
      }
      let shouldUpdate = false;
      const changedProperties = this._changedProperties;
      try {
        shouldUpdate = this.shouldUpdate(changedProperties);
        if (shouldUpdate) {
          this.update(changedProperties);
        } else {
          this._markUpdated();
        }
      } catch (e) {
        shouldUpdate = false;
        this._markUpdated();
        throw e;
      }
      if (shouldUpdate) {
        if (!(this._updateState & STATE_HAS_UPDATED)) {
          this._updateState = this._updateState | STATE_HAS_UPDATED;
          this.firstUpdated(changedProperties);
        }
        this.updated(changedProperties);
      }
    }
    _markUpdated() {
      this._changedProperties = new Map();
      this._updateState = this._updateState & ~STATE_UPDATE_REQUESTED;
    }
    get updateComplete() {
      return this._getUpdateComplete();
    }
    _getUpdateComplete() {
      return this._updatePromise;
    }
    shouldUpdate(_changedProperties) {
      return true;
    }
    update(_changedProperties) {
      if (this._reflectingProperties !== void 0 && this._reflectingProperties.size > 0) {
        this._reflectingProperties.forEach((v, k) => this._propertyToAttribute(k, this[k], v));
        this._reflectingProperties = void 0;
      }
      this._markUpdated();
    }
    updated(_changedProperties) {
    }
    firstUpdated(_changedProperties) {
    }
  };
  _a = finalized;
  UpdatingElement[_a] = true;

  // node_modules/lit-element/lib/decorators.js
  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  var legacyCustomElement = (tagName, clazz) => {
    window.customElements.define(tagName, clazz);
    return clazz;
  };
  var standardCustomElement = (tagName, descriptor) => {
    const {kind, elements} = descriptor;
    return {
      kind,
      elements,
      finisher(clazz) {
        window.customElements.define(tagName, clazz);
      }
    };
  };
  var customElement = (tagName) => (classOrDescriptor) => typeof classOrDescriptor === "function" ? legacyCustomElement(tagName, classOrDescriptor) : standardCustomElement(tagName, classOrDescriptor);
  var standardProperty = (options, element) => {
    if (element.kind === "method" && element.descriptor && !("value" in element.descriptor)) {
      return Object.assign(Object.assign({}, element), {finisher(clazz) {
        clazz.createProperty(element.key, options);
      }});
    } else {
      return {
        kind: "field",
        key: Symbol(),
        placement: "own",
        descriptor: {},
        initializer() {
          if (typeof element.initializer === "function") {
            this[element.key] = element.initializer.call(this);
          }
        },
        finisher(clazz) {
          clazz.createProperty(element.key, options);
        }
      };
    }
  };
  var legacyProperty = (options, proto, name) => {
    proto.constructor.createProperty(name, options);
  };
  function property(options) {
    return (protoOrDescriptor, name) => name !== void 0 ? legacyProperty(options, protoOrDescriptor, name) : standardProperty(options, protoOrDescriptor);
  }
  function internalProperty(options) {
    return property({attribute: false, hasChanged: options === null || options === void 0 ? void 0 : options.hasChanged});
  }
  function query(selector, cache) {
    return (protoOrDescriptor, name) => {
      const descriptor = {
        get() {
          return this.renderRoot.querySelector(selector);
        },
        enumerable: true,
        configurable: true
      };
      if (cache) {
        const key = typeof name === "symbol" ? Symbol() : `__${name}`;
        descriptor.get = function() {
          if (this[key] === void 0) {
            this[key] = this.renderRoot.querySelector(selector);
          }
          return this[key];
        };
      }
      return name !== void 0 ? legacyQuery(descriptor, protoOrDescriptor, name) : standardQuery(descriptor, protoOrDescriptor);
    };
  }
  function queryAsync(selector) {
    return (protoOrDescriptor, name) => {
      const descriptor = {
        async get() {
          await this.updateComplete;
          return this.renderRoot.querySelector(selector);
        },
        enumerable: true,
        configurable: true
      };
      return name !== void 0 ? legacyQuery(descriptor, protoOrDescriptor, name) : standardQuery(descriptor, protoOrDescriptor);
    };
  }
  var legacyQuery = (descriptor, proto, name) => {
    Object.defineProperty(proto, name, descriptor);
  };
  var standardQuery = (descriptor, element) => ({
    kind: "method",
    placement: "prototype",
    key: element.key,
    descriptor
  });
  var standardEventOptions = (options, element) => {
    return Object.assign(Object.assign({}, element), {finisher(clazz) {
      Object.assign(clazz.prototype[element.key], options);
    }});
  };
  var legacyEventOptions = (options, proto, name) => {
    Object.assign(proto[name], options);
  };
  function eventOptions(options) {
    return (protoOrDescriptor, name) => name !== void 0 ? legacyEventOptions(options, protoOrDescriptor, name) : standardEventOptions(options, protoOrDescriptor);
  }
  var ElementProto = Element.prototype;
  var legacyMatches = ElementProto.msMatchesSelector || ElementProto.webkitMatchesSelector;

  // node_modules/lit-element/lib/css-tag.js
  /**
  @license
  Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
  This code may only be used under the BSD style license found at
  http://polymer.github.io/LICENSE.txt The complete set of authors may be found at
  http://polymer.github.io/AUTHORS.txt The complete set of contributors may be
  found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by Google as
  part of the polymer project is also subject to an additional IP rights grant
  found at http://polymer.github.io/PATENTS.txt
  */
  var supportsAdoptingStyleSheets = window.ShadowRoot && (window.ShadyCSS === void 0 || window.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype;
  var constructionToken = Symbol();
  var CSSResult = class {
    constructor(cssText, safeToken) {
      if (safeToken !== constructionToken) {
        throw new Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
      }
      this.cssText = cssText;
    }
    get styleSheet() {
      if (this._styleSheet === void 0) {
        if (supportsAdoptingStyleSheets) {
          this._styleSheet = new CSSStyleSheet();
          this._styleSheet.replaceSync(this.cssText);
        } else {
          this._styleSheet = null;
        }
      }
      return this._styleSheet;
    }
    toString() {
      return this.cssText;
    }
  };
  var unsafeCSS = (value) => {
    return new CSSResult(String(value), constructionToken);
  };
  var textFromCSSResult = (value) => {
    if (value instanceof CSSResult) {
      return value.cssText;
    } else if (typeof value === "number") {
      return value;
    } else {
      throw new Error(`Value passed to 'css' function must be a 'css' function result: ${value}. Use 'unsafeCSS' to pass non-literal values, but
            take care to ensure page security.`);
    }
  };
  var css = (strings9, ...values) => {
    const cssText = values.reduce((acc, v, idx) => acc + textFromCSSResult(v) + strings9[idx + 1], strings9[0]);
    return new CSSResult(cssText, constructionToken);
  };

  // node_modules/lit-element/lit-element.js
  /**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  (window["litElementVersions"] || (window["litElementVersions"] = [])).push("2.4.0");
  var renderNotImplemented = {};
  var LitElement = class extends UpdatingElement {
    static getStyles() {
      return this.styles;
    }
    static _getUniqueStyles() {
      if (this.hasOwnProperty(JSCompiler_renameProperty("_styles", this))) {
        return;
      }
      const userStyles = this.getStyles();
      if (Array.isArray(userStyles)) {
        const addStyles = (styles2, set2) => styles2.reduceRight((set3, s) => Array.isArray(s) ? addStyles(s, set3) : (set3.add(s), set3), set2);
        const set = addStyles(userStyles, new Set());
        const styles = [];
        set.forEach((v) => styles.unshift(v));
        this._styles = styles;
      } else {
        this._styles = userStyles === void 0 ? [] : [userStyles];
      }
      this._styles = this._styles.map((s) => {
        if (s instanceof CSSStyleSheet && !supportsAdoptingStyleSheets) {
          const cssText = Array.prototype.slice.call(s.cssRules).reduce((css2, rule) => css2 + rule.cssText, "");
          return unsafeCSS(cssText);
        }
        return s;
      });
    }
    initialize() {
      super.initialize();
      this.constructor._getUniqueStyles();
      this.renderRoot = this.createRenderRoot();
      if (window.ShadowRoot && this.renderRoot instanceof window.ShadowRoot) {
        this.adoptStyles();
      }
    }
    createRenderRoot() {
      return this.attachShadow({mode: "open"});
    }
    adoptStyles() {
      const styles = this.constructor._styles;
      if (styles.length === 0) {
        return;
      }
      if (window.ShadyCSS !== void 0 && !window.ShadyCSS.nativeShadow) {
        window.ShadyCSS.ScopingShim.prepareAdoptedCssText(styles.map((s) => s.cssText), this.localName);
      } else if (supportsAdoptingStyleSheets) {
        this.renderRoot.adoptedStyleSheets = styles.map((s) => s instanceof CSSStyleSheet ? s : s.styleSheet);
      } else {
        this._needsShimAdoptedStyleSheets = true;
      }
    }
    connectedCallback() {
      super.connectedCallback();
      if (this.hasUpdated && window.ShadyCSS !== void 0) {
        window.ShadyCSS.styleElement(this);
      }
    }
    update(changedProperties) {
      const templateResult = this.render();
      super.update(changedProperties);
      if (templateResult !== renderNotImplemented) {
        this.constructor.render(templateResult, this.renderRoot, {scopeName: this.localName, eventContext: this});
      }
      if (this._needsShimAdoptedStyleSheets) {
        this._needsShimAdoptedStyleSheets = false;
        this.constructor._styles.forEach((s) => {
          const style15 = document.createElement("style");
          style15.textContent = s.cssText;
          this.renderRoot.appendChild(style15);
        });
      }
    }
    render() {
      return renderNotImplemented;
    }
  };
  LitElement["finalized"] = true;
  LitElement.render = render2;

  // node_modules/tslib/tslib.es6.js
  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation.
  
  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.
  
  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** */
  function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if (d = decorators[i])
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  }

  // node_modules/lit-html/directives/class-map.js
  /**
   * @license
   * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  var ClassList = class {
    constructor(element) {
      this.classes = new Set();
      this.changed = false;
      this.element = element;
      const classList = (element.getAttribute("class") || "").split(/\s+/);
      for (const cls of classList) {
        this.classes.add(cls);
      }
    }
    add(cls) {
      this.classes.add(cls);
      this.changed = true;
    }
    remove(cls) {
      this.classes.delete(cls);
      this.changed = true;
    }
    commit() {
      if (this.changed) {
        let classString = "";
        this.classes.forEach((cls) => classString += cls + " ");
        this.element.setAttribute("class", classString);
      }
    }
  };
  var previousClassesCache = new WeakMap();
  var classMap = directive((classInfo) => (part) => {
    if (!(part instanceof AttributePart) || part instanceof PropertyPart || part.committer.name !== "class" || part.committer.parts.length > 1) {
      throw new Error("The `classMap` directive must be used in the `class` attribute and must be the only part in the attribute.");
    }
    const {committer} = part;
    const {element} = committer;
    let previousClasses = previousClassesCache.get(part);
    if (previousClasses === void 0) {
      element.setAttribute("class", committer.strings.join(" "));
      previousClassesCache.set(part, previousClasses = new Set());
    }
    const classList = element.classList || new ClassList(element);
    previousClasses.forEach((name) => {
      if (!(name in classInfo)) {
        classList.remove(name);
        previousClasses.delete(name);
      }
    });
    for (const name in classInfo) {
      const value = classInfo[name];
      if (value != previousClasses.has(name)) {
        if (value) {
          classList.add(name);
          previousClasses.add(name);
        } else {
          classList.remove(name);
          previousClasses.delete(name);
        }
      }
    }
    if (typeof classList.commit === "function") {
      classList.commit();
    }
  });

  // node_modules/lit-html/directives/if-defined.js
  /**
   * @license
   * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  var previousValues = new WeakMap();
  var ifDefined = directive((value) => (part) => {
    const previousValue = previousValues.get(part);
    if (value === void 0 && part instanceof AttributePart) {
      if (previousValue !== void 0 || !previousValues.has(part)) {
        const name = part.committer.name;
        part.committer.element.removeAttribute(name);
      }
    } else if (value !== previousValue) {
      part.setValue(value);
    }
    previousValues.set(part, value);
  });

  // node_modules/lit-html/directives/style-map.js
  /**
   * @license
   * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  var previousStylePropertyCache = new WeakMap();
  var styleMap = directive((styleInfo) => (part) => {
    if (!(part instanceof AttributePart) || part instanceof PropertyPart || part.committer.name !== "style" || part.committer.parts.length > 1) {
      throw new Error("The `styleMap` directive must be used in the style attribute and must be the only part in the attribute.");
    }
    const {committer} = part;
    const {style: style15} = committer.element;
    let previousStyleProperties = previousStylePropertyCache.get(part);
    if (previousStyleProperties === void 0) {
      style15.cssText = committer.strings.join(" ");
      previousStylePropertyCache.set(part, previousStyleProperties = new Set());
    }
    previousStyleProperties.forEach((name) => {
      if (!(name in styleInfo)) {
        previousStyleProperties.delete(name);
        if (name.indexOf("-") === -1) {
          style15[name] = null;
        } else {
          style15.removeProperty(name);
        }
      }
    });
    for (const name in styleInfo) {
      previousStyleProperties.add(name);
      if (name.indexOf("-") === -1) {
        style15[name] = styleInfo[name];
      } else {
        style15.setProperty(name, styleInfo[name]);
      }
    }
  });

  // node_modules/@material/mwc-circular-progress/mwc-circular-progress-base.js
  /**
  @license
  Copyright 2020 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var CircularProgressBase = class extends LitElement {
    constructor() {
      super(...arguments);
      this.indeterminate = false;
      this.progress = 0;
      this.density = 0;
      this.closed = false;
      this.ariaLabel = "";
    }
    open() {
      this.closed = false;
    }
    close() {
      this.closed = true;
    }
    render() {
      const classes = {
        "mdc-circular-progress--closed": this.closed,
        "mdc-circular-progress--indeterminate": this.indeterminate
      };
      const containerSideLength = 48 + this.density * 4;
      const styles = {
        width: `${containerSideLength}px`,
        height: `${containerSideLength}px`
      };
      return html`
      <div
        class="mdc-circular-progress ${classMap(classes)}"
        style="${styleMap(styles)}"
        role="progressbar"
        aria-label="${this.ariaLabel}"
        aria-valuemin="0"
        aria-valuemax="1"
        aria-valuenow="${ifDefined(this.indeterminate ? void 0 : this.progress)}">
        ${this.renderDeterminateContainer()}
        ${this.renderIndeterminateContainer()}
      </div>`;
    }
    renderDeterminateContainer() {
      const sideLength = 48 + this.density * 4;
      const center = sideLength / 2;
      const circleRadius = this.density >= -3 ? 18 + this.density * 11 / 6 : 12.5 + (this.density + 3) * 5 / 4;
      const circumference = 2 * 3.1415926 * circleRadius;
      const determinateStrokeDashOffset = (1 - this.progress) * circumference;
      const strokeWidth = this.density >= -3 ? 4 + this.density * (1 / 3) : 3 + (this.density + 3) * (1 / 6);
      return html`
      <div class="mdc-circular-progress__determinate-container">
        <svg class="mdc-circular-progress__determinate-circle-graphic"
             viewBox="0 0 ${sideLength} ${sideLength}">
          <circle class="mdc-circular-progress__determinate-track"
                  cx="${center}" cy="${center}" r="${circleRadius}"
                  stroke-width="${strokeWidth}"></circle>
          <circle class="mdc-circular-progress__determinate-circle"
                  cx="${center}" cy="${center}" r="${circleRadius}"
                  stroke-dasharray="${2 * 3.1415926 * circleRadius}"
                  stroke-dashoffset="${determinateStrokeDashOffset}"
                  stroke-width="${strokeWidth}"></circle>
        </svg>
      </div>`;
    }
    renderIndeterminateContainer() {
      return html`
      <div class="mdc-circular-progress__indeterminate-container">
        <div class="mdc-circular-progress__spinner-layer">
          ${this.renderIndeterminateSpinnerLayer()}
        </div>
      </div>`;
    }
    renderIndeterminateSpinnerLayer() {
      const sideLength = 48 + this.density * 4;
      const center = sideLength / 2;
      const circleRadius = this.density >= -3 ? 18 + this.density * 11 / 6 : 12.5 + (this.density + 3) * 5 / 4;
      const circumference = 2 * 3.1415926 * circleRadius;
      const halfCircumference = 0.5 * circumference;
      const strokeWidth = this.density >= -3 ? 4 + this.density * (1 / 3) : 3 + (this.density + 3) * (1 / 6);
      return html`
        <div class="mdc-circular-progress__circle-clipper mdc-circular-progress__circle-left">
          <svg class="mdc-circular-progress__indeterminate-circle-graphic"
               viewBox="0 0 ${sideLength} ${sideLength}">
            <circle cx="${center}" cy="${center}" r="${circleRadius}"
                    stroke-dasharray="${circumference}"
                    stroke-dashoffset="${halfCircumference}"
                    stroke-width="${strokeWidth}"></circle>
          </svg>
        </div>
        <div class="mdc-circular-progress__gap-patch">
          <svg class="mdc-circular-progress__indeterminate-circle-graphic"
               viewBox="0 0 ${sideLength} ${sideLength}">
            <circle cx="${center}" cy="${center}" r="${circleRadius}"
                    stroke-dasharray="${circumference}"
                    stroke-dashoffset="${halfCircumference}"
                    stroke-width="${strokeWidth * 0.8}"></circle>
          </svg>
        </div>
        <div class="mdc-circular-progress__circle-clipper mdc-circular-progress__circle-right">
          <svg class="mdc-circular-progress__indeterminate-circle-graphic"
               viewBox="0 0 ${sideLength} ${sideLength}">
            <circle cx="${center}" cy="${center}" r="${circleRadius}"
                    stroke-dasharray="${circumference}"
                    stroke-dashoffset="${halfCircumference}"
                    stroke-width="${strokeWidth}"></circle>
          </svg>
        </div>`;
    }
    update(changedProperties) {
      super.update(changedProperties);
      if (changedProperties.has("progress")) {
        if (this.progress > 1) {
          this.progress = 1;
        }
        if (this.progress < 0) {
          this.progress = 0;
        }
      }
    }
  };
  __decorate([
    property({type: Boolean, reflect: true})
  ], CircularProgressBase.prototype, "indeterminate", void 0);
  __decorate([
    property({type: Number, reflect: true})
  ], CircularProgressBase.prototype, "progress", void 0);
  __decorate([
    property({type: Number, reflect: true})
  ], CircularProgressBase.prototype, "density", void 0);
  __decorate([
    property({type: Boolean, reflect: true})
  ], CircularProgressBase.prototype, "closed", void 0);
  __decorate([
    property({type: String})
  ], CircularProgressBase.prototype, "ariaLabel", void 0);

  // node_modules/@material/mwc-circular-progress/mwc-circular-progress-css.js
  /**
  @license
  Copyright 2018 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var style = css`.mdc-circular-progress__determinate-circle,.mdc-circular-progress__indeterminate-circle-graphic{stroke:#6200ee;stroke:var(--mdc-theme-primary, #6200ee)}.mdc-circular-progress__determinate-track{stroke:transparent}@keyframes mdc-circular-progress-container-rotate{to{transform:rotate(360deg)}}@keyframes mdc-circular-progress-spinner-layer-rotate{12.5%{transform:rotate(135deg)}25%{transform:rotate(270deg)}37.5%{transform:rotate(405deg)}50%{transform:rotate(540deg)}62.5%{transform:rotate(675deg)}75%{transform:rotate(810deg)}87.5%{transform:rotate(945deg)}100%{transform:rotate(1080deg)}}@keyframes mdc-circular-progress-color-1-fade-in-out{from{opacity:.99}25%{opacity:.99}26%{opacity:0}89%{opacity:0}90%{opacity:.99}to{opacity:.99}}@keyframes mdc-circular-progress-color-2-fade-in-out{from{opacity:0}15%{opacity:0}25%{opacity:.99}50%{opacity:.99}51%{opacity:0}to{opacity:0}}@keyframes mdc-circular-progress-color-3-fade-in-out{from{opacity:0}40%{opacity:0}50%{opacity:.99}75%{opacity:.99}76%{opacity:0}to{opacity:0}}@keyframes mdc-circular-progress-color-4-fade-in-out{from{opacity:0}65%{opacity:0}75%{opacity:.99}90%{opacity:.99}to{opacity:0}}@keyframes mdc-circular-progress-left-spin{from{transform:rotate(265deg)}50%{transform:rotate(130deg)}to{transform:rotate(265deg)}}@keyframes mdc-circular-progress-right-spin{from{transform:rotate(-265deg)}50%{transform:rotate(-130deg)}to{transform:rotate(-265deg)}}.mdc-circular-progress{display:inline-flex;position:relative;direction:ltr;transition:opacity 250ms 0ms cubic-bezier(0.4, 0, 0.6, 1)}.mdc-circular-progress__determinate-container,.mdc-circular-progress__indeterminate-circle-graphic,.mdc-circular-progress__indeterminate-container,.mdc-circular-progress__spinner-layer{position:absolute;width:100%;height:100%}.mdc-circular-progress__determinate-container{transform:rotate(-90deg)}.mdc-circular-progress__indeterminate-container{font-size:0;letter-spacing:0;white-space:nowrap;opacity:0}.mdc-circular-progress__determinate-circle-graphic,.mdc-circular-progress__indeterminate-circle-graphic{fill:transparent}.mdc-circular-progress__determinate-circle{transition:stroke-dashoffset 500ms 0ms cubic-bezier(0, 0, 0.2, 1)}.mdc-circular-progress__gap-patch{position:absolute;top:0;left:47.5%;box-sizing:border-box;width:5%;height:100%;overflow:hidden}.mdc-circular-progress__gap-patch .mdc-circular-progress__indeterminate-circle-graphic{left:-900%;width:2000%;transform:rotate(180deg)}.mdc-circular-progress__circle-clipper{display:inline-flex;position:relative;width:50%;height:100%;overflow:hidden}.mdc-circular-progress__circle-clipper .mdc-circular-progress__indeterminate-circle-graphic{width:200%}.mdc-circular-progress__circle-right .mdc-circular-progress__indeterminate-circle-graphic{left:-100%}.mdc-circular-progress--indeterminate .mdc-circular-progress__determinate-container{opacity:0}.mdc-circular-progress--indeterminate .mdc-circular-progress__indeterminate-container{opacity:1}.mdc-circular-progress--indeterminate .mdc-circular-progress__indeterminate-container{animation:mdc-circular-progress-container-rotate 1568.2352941176ms linear infinite}.mdc-circular-progress--indeterminate .mdc-circular-progress__spinner-layer{animation:mdc-circular-progress-spinner-layer-rotate 5332ms cubic-bezier(0.4, 0, 0.2, 1) infinite both}.mdc-circular-progress--indeterminate .mdc-circular-progress__color-1{animation:mdc-circular-progress-spinner-layer-rotate 5332ms cubic-bezier(0.4, 0, 0.2, 1) infinite both,mdc-circular-progress-color-1-fade-in-out 5332ms cubic-bezier(0.4, 0, 0.2, 1) infinite both}.mdc-circular-progress--indeterminate .mdc-circular-progress__color-2{animation:mdc-circular-progress-spinner-layer-rotate 5332ms cubic-bezier(0.4, 0, 0.2, 1) infinite both,mdc-circular-progress-color-2-fade-in-out 5332ms cubic-bezier(0.4, 0, 0.2, 1) infinite both}.mdc-circular-progress--indeterminate .mdc-circular-progress__color-3{animation:mdc-circular-progress-spinner-layer-rotate 5332ms cubic-bezier(0.4, 0, 0.2, 1) infinite both,mdc-circular-progress-color-3-fade-in-out 5332ms cubic-bezier(0.4, 0, 0.2, 1) infinite both}.mdc-circular-progress--indeterminate .mdc-circular-progress__color-4{animation:mdc-circular-progress-spinner-layer-rotate 5332ms cubic-bezier(0.4, 0, 0.2, 1) infinite both,mdc-circular-progress-color-4-fade-in-out 5332ms cubic-bezier(0.4, 0, 0.2, 1) infinite both}.mdc-circular-progress--indeterminate .mdc-circular-progress__circle-left .mdc-circular-progress__indeterminate-circle-graphic{animation:mdc-circular-progress-left-spin 1333ms cubic-bezier(0.4, 0, 0.2, 1) infinite both}.mdc-circular-progress--indeterminate .mdc-circular-progress__circle-right .mdc-circular-progress__indeterminate-circle-graphic{animation:mdc-circular-progress-right-spin 1333ms cubic-bezier(0.4, 0, 0.2, 1) infinite both}.mdc-circular-progress--closed{opacity:0}:host{display:inline-flex}.mdc-circular-progress__determinate-track{stroke:transparent;stroke:var(--mdc-circular-progress-track-color, transparent)}`;

  // node_modules/@material/mwc-circular-progress/mwc-circular-progress.js
  /**
  @license
  Copyright 2018 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var CircularProgress = class CircularProgress2 extends CircularProgressBase {
  };
  CircularProgress.styles = style;
  CircularProgress = __decorate([
    customElement("mwc-circular-progress")
  ], CircularProgress);

  // node_modules/@material/mwc-icon/mwc-icon-host-css.js
  /**
  @license
  Copyright 2018 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var style2 = css`:host{font-family:var(--mdc-icon-font, "Material Icons");font-weight:normal;font-style:normal;font-size:var(--mdc-icon-size, 24px);line-height:1;letter-spacing:normal;text-transform:none;display:inline-block;white-space:nowrap;word-wrap:normal;direction:ltr;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;-moz-osx-font-smoothing:grayscale;font-feature-settings:"liga"}`;

  // node_modules/@material/mwc-icon/mwc-icon.js
  /**
  @license
  Copyright 2018 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var Icon = class Icon2 extends LitElement {
    render() {
      return html`<slot></slot>`;
    }
  };
  Icon.styles = style2;
  Icon = __decorate([
    customElement("mwc-icon")
  ], Icon);

  // node_modules/@material/dom/ponyfill.js
  /**
   * @license
   * Copyright 2018 Google Inc.
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in
   * all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   * THE SOFTWARE.
   */
  function matches(element, selector) {
    var nativeMatches = element.matches || element.webkitMatchesSelector || element.msMatchesSelector;
    return nativeMatches.call(element, selector);
  }

  // node_modules/@material/mwc-base/utils.js
  /**
  @license
  Copyright 2018 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var isNodeElement = (node) => {
    return node.nodeType === Node.ELEMENT_NODE;
  };
  function findAssignedElement(slot, selector) {
    for (const node of slot.assignedNodes({flatten: true})) {
      if (isNodeElement(node)) {
        const el = node;
        if (matches(el, selector)) {
          return el;
        }
      }
    }
    return null;
  }
  function addHasRemoveClass(element) {
    return {
      addClass: (className) => {
        element.classList.add(className);
      },
      removeClass: (className) => {
        element.classList.remove(className);
      },
      hasClass: (className) => element.classList.contains(className)
    };
  }
  var supportsPassive = false;
  var fn = () => {
  };
  var optionsBlock = {
    get passive() {
      supportsPassive = true;
      return false;
    }
  };
  document.addEventListener("x", fn, optionsBlock);
  document.removeEventListener("x", fn);
  var deepActiveElementPath = (doc = window.document) => {
    let activeElement = doc.activeElement;
    const path = [];
    if (!activeElement) {
      return path;
    }
    while (activeElement) {
      path.push(activeElement);
      if (activeElement.shadowRoot) {
        activeElement = activeElement.shadowRoot.activeElement;
      } else {
        break;
      }
    }
    return path;
  };
  var doesElementContainFocus = (element) => {
    const activePath = deepActiveElementPath();
    if (!activePath.length) {
      return false;
    }
    const deepActiveElement = activePath[activePath.length - 1];
    const focusEv = new Event("check-if-focused", {bubbles: true, composed: true});
    let composedPath = [];
    const listener = (ev) => {
      composedPath = ev.composedPath();
    };
    document.body.addEventListener("check-if-focused", listener);
    deepActiveElement.dispatchEvent(focusEv);
    document.body.removeEventListener("check-if-focused", listener);
    return composedPath.indexOf(element) !== -1;
  };

  // node_modules/@material/mwc-base/base-element.js
  /**
  @license
  Copyright 2018 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var BaseElement = class extends LitElement {
    click() {
      if (this.mdcRoot) {
        this.mdcRoot.focus();
        this.mdcRoot.click();
        return;
      }
      super.click();
    }
    createFoundation() {
      if (this.mdcFoundation !== void 0) {
        this.mdcFoundation.destroy();
      }
      if (this.mdcFoundationClass) {
        this.mdcFoundation = new this.mdcFoundationClass(this.createAdapter());
        this.mdcFoundation.init();
      }
    }
    firstUpdated() {
      this.createFoundation();
    }
  };

  // node_modules/@material/ripple/node_modules/tslib/tslib.es6.js
  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation.
  
  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.
  
  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** */
  var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf || {__proto__: []} instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2)
        if (b2.hasOwnProperty(p))
          d2[p] = b2[p];
    };
    return extendStatics(d, b);
  };
  function __extends(d, b) {
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }
  var __assign = function() {
    __assign = Object.assign || function __assign10(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s)
          if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
      }
      return t;
    };
    return __assign.apply(this, arguments);
  };

  // node_modules/@material/base/foundation.js
  /**
   * @license
   * Copyright 2016 Google Inc.
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in
   * all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   * THE SOFTWARE.
   */
  var MDCFoundation = function() {
    function MDCFoundation2(adapter) {
      if (adapter === void 0) {
        adapter = {};
      }
      this.adapter = adapter;
    }
    Object.defineProperty(MDCFoundation2, "cssClasses", {
      get: function() {
        return {};
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(MDCFoundation2, "strings", {
      get: function() {
        return {};
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(MDCFoundation2, "numbers", {
      get: function() {
        return {};
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(MDCFoundation2, "defaultAdapter", {
      get: function() {
        return {};
      },
      enumerable: true,
      configurable: true
    });
    MDCFoundation2.prototype.init = function() {
    };
    MDCFoundation2.prototype.destroy = function() {
    };
    return MDCFoundation2;
  }();

  // node_modules/@material/ripple/constants.js
  /**
   * @license
   * Copyright 2016 Google Inc.
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in
   * all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   * THE SOFTWARE.
   */
  var cssClasses = {
    BG_FOCUSED: "mdc-ripple-upgraded--background-focused",
    FG_ACTIVATION: "mdc-ripple-upgraded--foreground-activation",
    FG_DEACTIVATION: "mdc-ripple-upgraded--foreground-deactivation",
    ROOT: "mdc-ripple-upgraded",
    UNBOUNDED: "mdc-ripple-upgraded--unbounded"
  };
  var strings = {
    VAR_FG_SCALE: "--mdc-ripple-fg-scale",
    VAR_FG_SIZE: "--mdc-ripple-fg-size",
    VAR_FG_TRANSLATE_END: "--mdc-ripple-fg-translate-end",
    VAR_FG_TRANSLATE_START: "--mdc-ripple-fg-translate-start",
    VAR_LEFT: "--mdc-ripple-left",
    VAR_TOP: "--mdc-ripple-top"
  };
  var numbers = {
    DEACTIVATION_TIMEOUT_MS: 225,
    FG_DEACTIVATION_MS: 150,
    INITIAL_ORIGIN_SCALE: 0.6,
    PADDING: 10,
    TAP_DELAY_MS: 300
  };

  // node_modules/@material/ripple/util.js
  function getNormalizedEventCoords(evt, pageOffset, clientRect) {
    if (!evt) {
      return {x: 0, y: 0};
    }
    var x = pageOffset.x, y = pageOffset.y;
    var documentX = x + clientRect.left;
    var documentY = y + clientRect.top;
    var normalizedX;
    var normalizedY;
    if (evt.type === "touchstart") {
      var touchEvent = evt;
      normalizedX = touchEvent.changedTouches[0].pageX - documentX;
      normalizedY = touchEvent.changedTouches[0].pageY - documentY;
    } else {
      var mouseEvent = evt;
      normalizedX = mouseEvent.pageX - documentX;
      normalizedY = mouseEvent.pageY - documentY;
    }
    return {x: normalizedX, y: normalizedY};
  }

  // node_modules/@material/ripple/foundation.js
  /**
   * @license
   * Copyright 2016 Google Inc.
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in
   * all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   * THE SOFTWARE.
   */
  var ACTIVATION_EVENT_TYPES = [
    "touchstart",
    "pointerdown",
    "mousedown",
    "keydown"
  ];
  var POINTER_DEACTIVATION_EVENT_TYPES = [
    "touchend",
    "pointerup",
    "mouseup",
    "contextmenu"
  ];
  var activatedTargets = [];
  var MDCRippleFoundation = function(_super) {
    __extends(MDCRippleFoundation2, _super);
    function MDCRippleFoundation2(adapter) {
      var _this = _super.call(this, __assign(__assign({}, MDCRippleFoundation2.defaultAdapter), adapter)) || this;
      _this.activationAnimationHasEnded_ = false;
      _this.activationTimer_ = 0;
      _this.fgDeactivationRemovalTimer_ = 0;
      _this.fgScale_ = "0";
      _this.frame_ = {width: 0, height: 0};
      _this.initialSize_ = 0;
      _this.layoutFrame_ = 0;
      _this.maxRadius_ = 0;
      _this.unboundedCoords_ = {left: 0, top: 0};
      _this.activationState_ = _this.defaultActivationState_();
      _this.activationTimerCallback_ = function() {
        _this.activationAnimationHasEnded_ = true;
        _this.runDeactivationUXLogicIfReady_();
      };
      _this.activateHandler_ = function(e) {
        return _this.activate_(e);
      };
      _this.deactivateHandler_ = function() {
        return _this.deactivate_();
      };
      _this.focusHandler_ = function() {
        return _this.handleFocus();
      };
      _this.blurHandler_ = function() {
        return _this.handleBlur();
      };
      _this.resizeHandler_ = function() {
        return _this.layout();
      };
      return _this;
    }
    Object.defineProperty(MDCRippleFoundation2, "cssClasses", {
      get: function() {
        return cssClasses;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(MDCRippleFoundation2, "strings", {
      get: function() {
        return strings;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(MDCRippleFoundation2, "numbers", {
      get: function() {
        return numbers;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(MDCRippleFoundation2, "defaultAdapter", {
      get: function() {
        return {
          addClass: function() {
            return void 0;
          },
          browserSupportsCssVars: function() {
            return true;
          },
          computeBoundingRect: function() {
            return {top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0};
          },
          containsEventTarget: function() {
            return true;
          },
          deregisterDocumentInteractionHandler: function() {
            return void 0;
          },
          deregisterInteractionHandler: function() {
            return void 0;
          },
          deregisterResizeHandler: function() {
            return void 0;
          },
          getWindowPageOffset: function() {
            return {x: 0, y: 0};
          },
          isSurfaceActive: function() {
            return true;
          },
          isSurfaceDisabled: function() {
            return true;
          },
          isUnbounded: function() {
            return true;
          },
          registerDocumentInteractionHandler: function() {
            return void 0;
          },
          registerInteractionHandler: function() {
            return void 0;
          },
          registerResizeHandler: function() {
            return void 0;
          },
          removeClass: function() {
            return void 0;
          },
          updateCssVariable: function() {
            return void 0;
          }
        };
      },
      enumerable: true,
      configurable: true
    });
    MDCRippleFoundation2.prototype.init = function() {
      var _this = this;
      var supportsPressRipple = this.supportsPressRipple_();
      this.registerRootHandlers_(supportsPressRipple);
      if (supportsPressRipple) {
        var _a2 = MDCRippleFoundation2.cssClasses, ROOT_1 = _a2.ROOT, UNBOUNDED_1 = _a2.UNBOUNDED;
        requestAnimationFrame(function() {
          _this.adapter.addClass(ROOT_1);
          if (_this.adapter.isUnbounded()) {
            _this.adapter.addClass(UNBOUNDED_1);
            _this.layoutInternal_();
          }
        });
      }
    };
    MDCRippleFoundation2.prototype.destroy = function() {
      var _this = this;
      if (this.supportsPressRipple_()) {
        if (this.activationTimer_) {
          clearTimeout(this.activationTimer_);
          this.activationTimer_ = 0;
          this.adapter.removeClass(MDCRippleFoundation2.cssClasses.FG_ACTIVATION);
        }
        if (this.fgDeactivationRemovalTimer_) {
          clearTimeout(this.fgDeactivationRemovalTimer_);
          this.fgDeactivationRemovalTimer_ = 0;
          this.adapter.removeClass(MDCRippleFoundation2.cssClasses.FG_DEACTIVATION);
        }
        var _a2 = MDCRippleFoundation2.cssClasses, ROOT_2 = _a2.ROOT, UNBOUNDED_2 = _a2.UNBOUNDED;
        requestAnimationFrame(function() {
          _this.adapter.removeClass(ROOT_2);
          _this.adapter.removeClass(UNBOUNDED_2);
          _this.removeCssVars_();
        });
      }
      this.deregisterRootHandlers_();
      this.deregisterDeactivationHandlers_();
    };
    MDCRippleFoundation2.prototype.activate = function(evt) {
      this.activate_(evt);
    };
    MDCRippleFoundation2.prototype.deactivate = function() {
      this.deactivate_();
    };
    MDCRippleFoundation2.prototype.layout = function() {
      var _this = this;
      if (this.layoutFrame_) {
        cancelAnimationFrame(this.layoutFrame_);
      }
      this.layoutFrame_ = requestAnimationFrame(function() {
        _this.layoutInternal_();
        _this.layoutFrame_ = 0;
      });
    };
    MDCRippleFoundation2.prototype.setUnbounded = function(unbounded) {
      var UNBOUNDED = MDCRippleFoundation2.cssClasses.UNBOUNDED;
      if (unbounded) {
        this.adapter.addClass(UNBOUNDED);
      } else {
        this.adapter.removeClass(UNBOUNDED);
      }
    };
    MDCRippleFoundation2.prototype.handleFocus = function() {
      var _this = this;
      requestAnimationFrame(function() {
        return _this.adapter.addClass(MDCRippleFoundation2.cssClasses.BG_FOCUSED);
      });
    };
    MDCRippleFoundation2.prototype.handleBlur = function() {
      var _this = this;
      requestAnimationFrame(function() {
        return _this.adapter.removeClass(MDCRippleFoundation2.cssClasses.BG_FOCUSED);
      });
    };
    MDCRippleFoundation2.prototype.supportsPressRipple_ = function() {
      return this.adapter.browserSupportsCssVars();
    };
    MDCRippleFoundation2.prototype.defaultActivationState_ = function() {
      return {
        activationEvent: void 0,
        hasDeactivationUXRun: false,
        isActivated: false,
        isProgrammatic: false,
        wasActivatedByPointer: false,
        wasElementMadeActive: false
      };
    };
    MDCRippleFoundation2.prototype.registerRootHandlers_ = function(supportsPressRipple) {
      var _this = this;
      if (supportsPressRipple) {
        ACTIVATION_EVENT_TYPES.forEach(function(evtType) {
          _this.adapter.registerInteractionHandler(evtType, _this.activateHandler_);
        });
        if (this.adapter.isUnbounded()) {
          this.adapter.registerResizeHandler(this.resizeHandler_);
        }
      }
      this.adapter.registerInteractionHandler("focus", this.focusHandler_);
      this.adapter.registerInteractionHandler("blur", this.blurHandler_);
    };
    MDCRippleFoundation2.prototype.registerDeactivationHandlers_ = function(evt) {
      var _this = this;
      if (evt.type === "keydown") {
        this.adapter.registerInteractionHandler("keyup", this.deactivateHandler_);
      } else {
        POINTER_DEACTIVATION_EVENT_TYPES.forEach(function(evtType) {
          _this.adapter.registerDocumentInteractionHandler(evtType, _this.deactivateHandler_);
        });
      }
    };
    MDCRippleFoundation2.prototype.deregisterRootHandlers_ = function() {
      var _this = this;
      ACTIVATION_EVENT_TYPES.forEach(function(evtType) {
        _this.adapter.deregisterInteractionHandler(evtType, _this.activateHandler_);
      });
      this.adapter.deregisterInteractionHandler("focus", this.focusHandler_);
      this.adapter.deregisterInteractionHandler("blur", this.blurHandler_);
      if (this.adapter.isUnbounded()) {
        this.adapter.deregisterResizeHandler(this.resizeHandler_);
      }
    };
    MDCRippleFoundation2.prototype.deregisterDeactivationHandlers_ = function() {
      var _this = this;
      this.adapter.deregisterInteractionHandler("keyup", this.deactivateHandler_);
      POINTER_DEACTIVATION_EVENT_TYPES.forEach(function(evtType) {
        _this.adapter.deregisterDocumentInteractionHandler(evtType, _this.deactivateHandler_);
      });
    };
    MDCRippleFoundation2.prototype.removeCssVars_ = function() {
      var _this = this;
      var rippleStrings = MDCRippleFoundation2.strings;
      var keys = Object.keys(rippleStrings);
      keys.forEach(function(key) {
        if (key.indexOf("VAR_") === 0) {
          _this.adapter.updateCssVariable(rippleStrings[key], null);
        }
      });
    };
    MDCRippleFoundation2.prototype.activate_ = function(evt) {
      var _this = this;
      if (this.adapter.isSurfaceDisabled()) {
        return;
      }
      var activationState = this.activationState_;
      if (activationState.isActivated) {
        return;
      }
      var previousActivationEvent = this.previousActivationEvent_;
      var isSameInteraction = previousActivationEvent && evt !== void 0 && previousActivationEvent.type !== evt.type;
      if (isSameInteraction) {
        return;
      }
      activationState.isActivated = true;
      activationState.isProgrammatic = evt === void 0;
      activationState.activationEvent = evt;
      activationState.wasActivatedByPointer = activationState.isProgrammatic ? false : evt !== void 0 && (evt.type === "mousedown" || evt.type === "touchstart" || evt.type === "pointerdown");
      var hasActivatedChild = evt !== void 0 && activatedTargets.length > 0 && activatedTargets.some(function(target) {
        return _this.adapter.containsEventTarget(target);
      });
      if (hasActivatedChild) {
        this.resetActivationState_();
        return;
      }
      if (evt !== void 0) {
        activatedTargets.push(evt.target);
        this.registerDeactivationHandlers_(evt);
      }
      activationState.wasElementMadeActive = this.checkElementMadeActive_(evt);
      if (activationState.wasElementMadeActive) {
        this.animateActivation_();
      }
      requestAnimationFrame(function() {
        activatedTargets = [];
        if (!activationState.wasElementMadeActive && evt !== void 0 && (evt.key === " " || evt.keyCode === 32)) {
          activationState.wasElementMadeActive = _this.checkElementMadeActive_(evt);
          if (activationState.wasElementMadeActive) {
            _this.animateActivation_();
          }
        }
        if (!activationState.wasElementMadeActive) {
          _this.activationState_ = _this.defaultActivationState_();
        }
      });
    };
    MDCRippleFoundation2.prototype.checkElementMadeActive_ = function(evt) {
      return evt !== void 0 && evt.type === "keydown" ? this.adapter.isSurfaceActive() : true;
    };
    MDCRippleFoundation2.prototype.animateActivation_ = function() {
      var _this = this;
      var _a2 = MDCRippleFoundation2.strings, VAR_FG_TRANSLATE_START = _a2.VAR_FG_TRANSLATE_START, VAR_FG_TRANSLATE_END = _a2.VAR_FG_TRANSLATE_END;
      var _b = MDCRippleFoundation2.cssClasses, FG_DEACTIVATION = _b.FG_DEACTIVATION, FG_ACTIVATION = _b.FG_ACTIVATION;
      var DEACTIVATION_TIMEOUT_MS = MDCRippleFoundation2.numbers.DEACTIVATION_TIMEOUT_MS;
      this.layoutInternal_();
      var translateStart = "";
      var translateEnd = "";
      if (!this.adapter.isUnbounded()) {
        var _c = this.getFgTranslationCoordinates_(), startPoint = _c.startPoint, endPoint = _c.endPoint;
        translateStart = startPoint.x + "px, " + startPoint.y + "px";
        translateEnd = endPoint.x + "px, " + endPoint.y + "px";
      }
      this.adapter.updateCssVariable(VAR_FG_TRANSLATE_START, translateStart);
      this.adapter.updateCssVariable(VAR_FG_TRANSLATE_END, translateEnd);
      clearTimeout(this.activationTimer_);
      clearTimeout(this.fgDeactivationRemovalTimer_);
      this.rmBoundedActivationClasses_();
      this.adapter.removeClass(FG_DEACTIVATION);
      this.adapter.computeBoundingRect();
      this.adapter.addClass(FG_ACTIVATION);
      this.activationTimer_ = setTimeout(function() {
        return _this.activationTimerCallback_();
      }, DEACTIVATION_TIMEOUT_MS);
    };
    MDCRippleFoundation2.prototype.getFgTranslationCoordinates_ = function() {
      var _a2 = this.activationState_, activationEvent = _a2.activationEvent, wasActivatedByPointer = _a2.wasActivatedByPointer;
      var startPoint;
      if (wasActivatedByPointer) {
        startPoint = getNormalizedEventCoords(activationEvent, this.adapter.getWindowPageOffset(), this.adapter.computeBoundingRect());
      } else {
        startPoint = {
          x: this.frame_.width / 2,
          y: this.frame_.height / 2
        };
      }
      startPoint = {
        x: startPoint.x - this.initialSize_ / 2,
        y: startPoint.y - this.initialSize_ / 2
      };
      var endPoint = {
        x: this.frame_.width / 2 - this.initialSize_ / 2,
        y: this.frame_.height / 2 - this.initialSize_ / 2
      };
      return {startPoint, endPoint};
    };
    MDCRippleFoundation2.prototype.runDeactivationUXLogicIfReady_ = function() {
      var _this = this;
      var FG_DEACTIVATION = MDCRippleFoundation2.cssClasses.FG_DEACTIVATION;
      var _a2 = this.activationState_, hasDeactivationUXRun = _a2.hasDeactivationUXRun, isActivated = _a2.isActivated;
      var activationHasEnded = hasDeactivationUXRun || !isActivated;
      if (activationHasEnded && this.activationAnimationHasEnded_) {
        this.rmBoundedActivationClasses_();
        this.adapter.addClass(FG_DEACTIVATION);
        this.fgDeactivationRemovalTimer_ = setTimeout(function() {
          _this.adapter.removeClass(FG_DEACTIVATION);
        }, numbers.FG_DEACTIVATION_MS);
      }
    };
    MDCRippleFoundation2.prototype.rmBoundedActivationClasses_ = function() {
      var FG_ACTIVATION = MDCRippleFoundation2.cssClasses.FG_ACTIVATION;
      this.adapter.removeClass(FG_ACTIVATION);
      this.activationAnimationHasEnded_ = false;
      this.adapter.computeBoundingRect();
    };
    MDCRippleFoundation2.prototype.resetActivationState_ = function() {
      var _this = this;
      this.previousActivationEvent_ = this.activationState_.activationEvent;
      this.activationState_ = this.defaultActivationState_();
      setTimeout(function() {
        return _this.previousActivationEvent_ = void 0;
      }, MDCRippleFoundation2.numbers.TAP_DELAY_MS);
    };
    MDCRippleFoundation2.prototype.deactivate_ = function() {
      var _this = this;
      var activationState = this.activationState_;
      if (!activationState.isActivated) {
        return;
      }
      var state = __assign({}, activationState);
      if (activationState.isProgrammatic) {
        requestAnimationFrame(function() {
          return _this.animateDeactivation_(state);
        });
        this.resetActivationState_();
      } else {
        this.deregisterDeactivationHandlers_();
        requestAnimationFrame(function() {
          _this.activationState_.hasDeactivationUXRun = true;
          _this.animateDeactivation_(state);
          _this.resetActivationState_();
        });
      }
    };
    MDCRippleFoundation2.prototype.animateDeactivation_ = function(_a2) {
      var wasActivatedByPointer = _a2.wasActivatedByPointer, wasElementMadeActive = _a2.wasElementMadeActive;
      if (wasActivatedByPointer || wasElementMadeActive) {
        this.runDeactivationUXLogicIfReady_();
      }
    };
    MDCRippleFoundation2.prototype.layoutInternal_ = function() {
      var _this = this;
      this.frame_ = this.adapter.computeBoundingRect();
      var maxDim = Math.max(this.frame_.height, this.frame_.width);
      var getBoundedRadius = function() {
        var hypotenuse = Math.sqrt(Math.pow(_this.frame_.width, 2) + Math.pow(_this.frame_.height, 2));
        return hypotenuse + MDCRippleFoundation2.numbers.PADDING;
      };
      this.maxRadius_ = this.adapter.isUnbounded() ? maxDim : getBoundedRadius();
      var initialSize = Math.floor(maxDim * MDCRippleFoundation2.numbers.INITIAL_ORIGIN_SCALE);
      if (this.adapter.isUnbounded() && initialSize % 2 !== 0) {
        this.initialSize_ = initialSize - 1;
      } else {
        this.initialSize_ = initialSize;
      }
      this.fgScale_ = "" + this.maxRadius_ / this.initialSize_;
      this.updateLayoutCssVars_();
    };
    MDCRippleFoundation2.prototype.updateLayoutCssVars_ = function() {
      var _a2 = MDCRippleFoundation2.strings, VAR_FG_SIZE = _a2.VAR_FG_SIZE, VAR_LEFT = _a2.VAR_LEFT, VAR_TOP = _a2.VAR_TOP, VAR_FG_SCALE = _a2.VAR_FG_SCALE;
      this.adapter.updateCssVariable(VAR_FG_SIZE, this.initialSize_ + "px");
      this.adapter.updateCssVariable(VAR_FG_SCALE, this.fgScale_);
      if (this.adapter.isUnbounded()) {
        this.unboundedCoords_ = {
          left: Math.round(this.frame_.width / 2 - this.initialSize_ / 2),
          top: Math.round(this.frame_.height / 2 - this.initialSize_ / 2)
        };
        this.adapter.updateCssVariable(VAR_LEFT, this.unboundedCoords_.left + "px");
        this.adapter.updateCssVariable(VAR_TOP, this.unboundedCoords_.top + "px");
      }
    };
    return MDCRippleFoundation2;
  }(MDCFoundation);
  var foundation_default = MDCRippleFoundation;

  // node_modules/@material/mwc-ripple/mwc-ripple-base.js
  /**
  @license
  Copyright 2018 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var RippleBase = class extends BaseElement {
    constructor() {
      super(...arguments);
      this.primary = false;
      this.accent = false;
      this.unbounded = false;
      this.disabled = false;
      this.activated = false;
      this.selected = false;
      this.hovering = false;
      this.bgFocused = false;
      this.fgActivation = false;
      this.fgDeactivation = false;
      this.fgScale = "";
      this.fgSize = "";
      this.translateStart = "";
      this.translateEnd = "";
      this.leftPos = "";
      this.topPos = "";
      this.mdcFoundationClass = foundation_default;
    }
    get isActive() {
      return (this.parentElement || this).matches(":active");
    }
    createAdapter() {
      return {
        browserSupportsCssVars: () => true,
        isUnbounded: () => this.unbounded,
        isSurfaceActive: () => this.isActive,
        isSurfaceDisabled: () => this.disabled,
        addClass: (className) => {
          switch (className) {
            case "mdc-ripple-upgraded--background-focused":
              this.bgFocused = true;
              break;
            case "mdc-ripple-upgraded--foreground-activation":
              this.fgActivation = true;
              break;
            case "mdc-ripple-upgraded--foreground-deactivation":
              this.fgDeactivation = true;
              break;
            default:
              break;
          }
        },
        removeClass: (className) => {
          switch (className) {
            case "mdc-ripple-upgraded--background-focused":
              this.bgFocused = false;
              break;
            case "mdc-ripple-upgraded--foreground-activation":
              this.fgActivation = false;
              break;
            case "mdc-ripple-upgraded--foreground-deactivation":
              this.fgDeactivation = false;
              break;
            default:
              break;
          }
        },
        containsEventTarget: () => true,
        registerInteractionHandler: () => void 0,
        deregisterInteractionHandler: () => void 0,
        registerDocumentInteractionHandler: () => void 0,
        deregisterDocumentInteractionHandler: () => void 0,
        registerResizeHandler: () => void 0,
        deregisterResizeHandler: () => void 0,
        updateCssVariable: (varName, value) => {
          switch (varName) {
            case "--mdc-ripple-fg-scale":
              this.fgScale = value;
              break;
            case "--mdc-ripple-fg-size":
              this.fgSize = value;
              break;
            case "--mdc-ripple-fg-translate-end":
              this.translateEnd = value;
              break;
            case "--mdc-ripple-fg-translate-start":
              this.translateStart = value;
              break;
            case "--mdc-ripple-left":
              this.leftPos = value;
              break;
            case "--mdc-ripple-top":
              this.topPos = value;
              break;
            default:
              break;
          }
        },
        computeBoundingRect: () => (this.parentElement || this).getBoundingClientRect(),
        getWindowPageOffset: () => ({x: window.pageXOffset, y: window.pageYOffset})
      };
    }
    startPress(ev) {
      this.waitForFoundation(() => {
        this.mdcFoundation.activate(ev);
      });
    }
    endPress() {
      this.waitForFoundation(() => {
        this.mdcFoundation.deactivate();
      });
    }
    startFocus() {
      this.waitForFoundation(() => {
        this.mdcFoundation.handleFocus();
      });
    }
    endFocus() {
      this.waitForFoundation(() => {
        this.mdcFoundation.handleBlur();
      });
    }
    startHover() {
      this.hovering = true;
    }
    endHover() {
      this.hovering = false;
    }
    waitForFoundation(fn2) {
      if (this.mdcFoundation) {
        fn2();
      } else {
        this.updateComplete.then(fn2);
      }
    }
    render() {
      const shouldActivateInPrimary = this.activated && (this.primary || !this.accent);
      const shouldSelectInPrimary = this.selected && (this.primary || !this.accent);
      const classes = {
        "mdc-ripple-surface--accent": this.accent,
        "mdc-ripple-surface--primary--activated": shouldActivateInPrimary,
        "mdc-ripple-surface--accent--activated": this.accent && this.activated,
        "mdc-ripple-surface--primary--selected": shouldSelectInPrimary,
        "mdc-ripple-surface--accent--selected": this.accent && this.selected,
        "mdc-ripple-surface--disabled": this.disabled,
        "mdc-ripple-surface--hover": this.hovering,
        "mdc-ripple-surface--primary": this.primary,
        "mdc-ripple-surface--selected": this.selected,
        "mdc-ripple-upgraded--background-focused": this.bgFocused,
        "mdc-ripple-upgraded--foreground-activation": this.fgActivation,
        "mdc-ripple-upgraded--foreground-deactivation": this.fgDeactivation,
        "mdc-ripple-upgraded--unbounded": this.unbounded
      };
      return html`
        <div class="mdc-ripple-surface mdc-ripple-upgraded ${classMap(classes)}"
          style="${styleMap({
        "--mdc-ripple-fg-scale": this.fgScale,
        "--mdc-ripple-fg-size": this.fgSize,
        "--mdc-ripple-fg-translate-end": this.translateEnd,
        "--mdc-ripple-fg-translate-start": this.translateStart,
        "--mdc-ripple-left": this.leftPos,
        "--mdc-ripple-top": this.topPos
      })}"></div>`;
    }
  };
  __decorate([
    query(".mdc-ripple-surface")
  ], RippleBase.prototype, "mdcRoot", void 0);
  __decorate([
    property({type: Boolean})
  ], RippleBase.prototype, "primary", void 0);
  __decorate([
    property({type: Boolean})
  ], RippleBase.prototype, "accent", void 0);
  __decorate([
    property({type: Boolean})
  ], RippleBase.prototype, "unbounded", void 0);
  __decorate([
    property({type: Boolean})
  ], RippleBase.prototype, "disabled", void 0);
  __decorate([
    property({type: Boolean})
  ], RippleBase.prototype, "activated", void 0);
  __decorate([
    property({type: Boolean})
  ], RippleBase.prototype, "selected", void 0);
  __decorate([
    internalProperty()
  ], RippleBase.prototype, "hovering", void 0);
  __decorate([
    internalProperty()
  ], RippleBase.prototype, "bgFocused", void 0);
  __decorate([
    internalProperty()
  ], RippleBase.prototype, "fgActivation", void 0);
  __decorate([
    internalProperty()
  ], RippleBase.prototype, "fgDeactivation", void 0);
  __decorate([
    internalProperty()
  ], RippleBase.prototype, "fgScale", void 0);
  __decorate([
    internalProperty()
  ], RippleBase.prototype, "fgSize", void 0);
  __decorate([
    internalProperty()
  ], RippleBase.prototype, "translateStart", void 0);
  __decorate([
    internalProperty()
  ], RippleBase.prototype, "translateEnd", void 0);
  __decorate([
    internalProperty()
  ], RippleBase.prototype, "leftPos", void 0);
  __decorate([
    internalProperty()
  ], RippleBase.prototype, "topPos", void 0);

  // node_modules/@material/mwc-ripple/mwc-ripple-css.js
  /**
  @license
  Copyright 2018 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var style3 = css`.mdc-ripple-surface{--mdc-ripple-fg-size: 0;--mdc-ripple-left: 0;--mdc-ripple-top: 0;--mdc-ripple-fg-scale: 1;--mdc-ripple-fg-translate-end: 0;--mdc-ripple-fg-translate-start: 0;-webkit-tap-highlight-color:rgba(0,0,0,0);will-change:transform,opacity;position:relative;outline:none;overflow:hidden}.mdc-ripple-surface::before,.mdc-ripple-surface::after{position:absolute;border-radius:50%;opacity:0;pointer-events:none;content:""}.mdc-ripple-surface::before{transition:opacity 15ms linear,background-color 15ms linear;z-index:1;z-index:var(--mdc-ripple-z-index, 1)}.mdc-ripple-surface::after{z-index:0;z-index:var(--mdc-ripple-z-index, 0)}.mdc-ripple-surface.mdc-ripple-upgraded::before{transform:scale(var(--mdc-ripple-fg-scale, 1))}.mdc-ripple-surface.mdc-ripple-upgraded::after{top:0;left:0;transform:scale(0);transform-origin:center center}.mdc-ripple-surface.mdc-ripple-upgraded--unbounded::after{top:var(--mdc-ripple-top, 0);left:var(--mdc-ripple-left, 0)}.mdc-ripple-surface.mdc-ripple-upgraded--foreground-activation::after{animation:mdc-ripple-fg-radius-in 225ms forwards,mdc-ripple-fg-opacity-in 75ms forwards}.mdc-ripple-surface.mdc-ripple-upgraded--foreground-deactivation::after{animation:mdc-ripple-fg-opacity-out 150ms;transform:translate(var(--mdc-ripple-fg-translate-end, 0)) scale(var(--mdc-ripple-fg-scale, 1))}.mdc-ripple-surface::before,.mdc-ripple-surface::after{background-color:#000;background-color:var(--mdc-ripple-color, #000)}.mdc-ripple-surface:hover::before,.mdc-ripple-surface.mdc-ripple-surface--hover::before{opacity:0.04;opacity:var(--mdc-ripple-hover-opacity, 0.04)}.mdc-ripple-surface.mdc-ripple-upgraded--background-focused::before,.mdc-ripple-surface:not(.mdc-ripple-upgraded):focus::before{transition-duration:75ms;opacity:0.12;opacity:var(--mdc-ripple-focus-opacity, 0.12)}.mdc-ripple-surface:not(.mdc-ripple-upgraded)::after{transition:opacity 150ms linear}.mdc-ripple-surface:not(.mdc-ripple-upgraded):active::after{transition-duration:75ms;opacity:0.12;opacity:var(--mdc-ripple-press-opacity, 0.12)}.mdc-ripple-surface.mdc-ripple-upgraded{--mdc-ripple-fg-opacity: var(--mdc-ripple-press-opacity, 0.12)}.mdc-ripple-surface::before,.mdc-ripple-surface::after{top:calc(50% - 100%);left:calc(50% - 100%);width:200%;height:200%}.mdc-ripple-surface.mdc-ripple-upgraded::after{width:var(--mdc-ripple-fg-size, 100%);height:var(--mdc-ripple-fg-size, 100%)}.mdc-ripple-surface[data-mdc-ripple-is-unbounded],.mdc-ripple-upgraded--unbounded{overflow:visible}.mdc-ripple-surface[data-mdc-ripple-is-unbounded]::before,.mdc-ripple-surface[data-mdc-ripple-is-unbounded]::after,.mdc-ripple-upgraded--unbounded::before,.mdc-ripple-upgraded--unbounded::after{top:calc(50% - 50%);left:calc(50% - 50%);width:100%;height:100%}.mdc-ripple-surface[data-mdc-ripple-is-unbounded].mdc-ripple-upgraded::before,.mdc-ripple-surface[data-mdc-ripple-is-unbounded].mdc-ripple-upgraded::after,.mdc-ripple-upgraded--unbounded.mdc-ripple-upgraded::before,.mdc-ripple-upgraded--unbounded.mdc-ripple-upgraded::after{top:var(--mdc-ripple-top, calc(50% - 50%));left:var(--mdc-ripple-left, calc(50% - 50%));width:var(--mdc-ripple-fg-size, 100%);height:var(--mdc-ripple-fg-size, 100%)}.mdc-ripple-surface[data-mdc-ripple-is-unbounded].mdc-ripple-upgraded::after,.mdc-ripple-upgraded--unbounded.mdc-ripple-upgraded::after{width:var(--mdc-ripple-fg-size, 100%);height:var(--mdc-ripple-fg-size, 100%)}@keyframes mdc-ripple-fg-radius-in{from{animation-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transform:translate(var(--mdc-ripple-fg-translate-start, 0)) scale(1)}to{transform:translate(var(--mdc-ripple-fg-translate-end, 0)) scale(var(--mdc-ripple-fg-scale, 1))}}@keyframes mdc-ripple-fg-opacity-in{from{animation-timing-function:linear;opacity:0}to{opacity:var(--mdc-ripple-fg-opacity, 0)}}@keyframes mdc-ripple-fg-opacity-out{from{animation-timing-function:linear;opacity:var(--mdc-ripple-fg-opacity, 0)}to{opacity:0}}:host{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;display:block}:host .mdc-ripple-surface{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;will-change:unset}.mdc-ripple-surface--primary::before,.mdc-ripple-surface--primary::after{background-color:#6200ee;background-color:var(--mdc-ripple-color, var(--mdc-theme-primary, #6200ee))}.mdc-ripple-surface--primary:hover::before,.mdc-ripple-surface--primary.mdc-ripple-surface--hover::before{opacity:0.04;opacity:var(--mdc-ripple-hover-opacity, 0.04)}.mdc-ripple-surface--primary.mdc-ripple-upgraded--background-focused::before,.mdc-ripple-surface--primary:not(.mdc-ripple-upgraded):focus::before{transition-duration:75ms;opacity:0.12;opacity:var(--mdc-ripple-focus-opacity, 0.12)}.mdc-ripple-surface--primary:not(.mdc-ripple-upgraded)::after{transition:opacity 150ms linear}.mdc-ripple-surface--primary:not(.mdc-ripple-upgraded):active::after{transition-duration:75ms;opacity:0.12;opacity:var(--mdc-ripple-press-opacity, 0.12)}.mdc-ripple-surface--primary.mdc-ripple-upgraded{--mdc-ripple-fg-opacity: var(--mdc-ripple-press-opacity, 0.12)}.mdc-ripple-surface--primary--activated::before{opacity:0.12;opacity:var(--mdc-ripple-activated-opacity, 0.12)}.mdc-ripple-surface--primary--activated::before,.mdc-ripple-surface--primary--activated::after{background-color:#6200ee;background-color:var(--mdc-ripple-color, var(--mdc-theme-primary, #6200ee))}.mdc-ripple-surface--primary--activated:hover::before,.mdc-ripple-surface--primary--activated.mdc-ripple-surface--hover::before{opacity:0.16;opacity:var(--mdc-ripple-hover-opacity, 0.16)}.mdc-ripple-surface--primary--activated.mdc-ripple-upgraded--background-focused::before,.mdc-ripple-surface--primary--activated:not(.mdc-ripple-upgraded):focus::before{transition-duration:75ms;opacity:0.24;opacity:var(--mdc-ripple-focus-opacity, 0.24)}.mdc-ripple-surface--primary--activated:not(.mdc-ripple-upgraded)::after{transition:opacity 150ms linear}.mdc-ripple-surface--primary--activated:not(.mdc-ripple-upgraded):active::after{transition-duration:75ms;opacity:0.24;opacity:var(--mdc-ripple-press-opacity, 0.24)}.mdc-ripple-surface--primary--activated.mdc-ripple-upgraded{--mdc-ripple-fg-opacity: var(--mdc-ripple-press-opacity, 0.24)}.mdc-ripple-surface--primary--selected::before{opacity:0.08;opacity:var(--mdc-ripple-selected-opacity, 0.08)}.mdc-ripple-surface--primary--selected::before,.mdc-ripple-surface--primary--selected::after{background-color:#6200ee;background-color:var(--mdc-ripple-color, var(--mdc-theme-primary, #6200ee))}.mdc-ripple-surface--primary--selected:hover::before,.mdc-ripple-surface--primary--selected.mdc-ripple-surface--hover::before{opacity:0.12;opacity:var(--mdc-ripple-hover-opacity, 0.12)}.mdc-ripple-surface--primary--selected.mdc-ripple-upgraded--background-focused::before,.mdc-ripple-surface--primary--selected:not(.mdc-ripple-upgraded):focus::before{transition-duration:75ms;opacity:0.2;opacity:var(--mdc-ripple-focus-opacity, 0.2)}.mdc-ripple-surface--primary--selected:not(.mdc-ripple-upgraded)::after{transition:opacity 150ms linear}.mdc-ripple-surface--primary--selected:not(.mdc-ripple-upgraded):active::after{transition-duration:75ms;opacity:0.2;opacity:var(--mdc-ripple-press-opacity, 0.2)}.mdc-ripple-surface--primary--selected.mdc-ripple-upgraded{--mdc-ripple-fg-opacity: var(--mdc-ripple-press-opacity, 0.2)}.mdc-ripple-surface--accent::before,.mdc-ripple-surface--accent::after{background-color:#018786;background-color:var(--mdc-ripple-color, var(--mdc-theme-secondary, #018786))}.mdc-ripple-surface--accent:hover::before,.mdc-ripple-surface--accent.mdc-ripple-surface--hover::before{opacity:0.04;opacity:var(--mdc-ripple-hover-opacity, 0.04)}.mdc-ripple-surface--accent.mdc-ripple-upgraded--background-focused::before,.mdc-ripple-surface--accent:not(.mdc-ripple-upgraded):focus::before{transition-duration:75ms;opacity:0.12;opacity:var(--mdc-ripple-focus-opacity, 0.12)}.mdc-ripple-surface--accent:not(.mdc-ripple-upgraded)::after{transition:opacity 150ms linear}.mdc-ripple-surface--accent:not(.mdc-ripple-upgraded):active::after{transition-duration:75ms;opacity:0.12;opacity:var(--mdc-ripple-press-opacity, 0.12)}.mdc-ripple-surface--accent.mdc-ripple-upgraded{--mdc-ripple-fg-opacity: var(--mdc-ripple-press-opacity, 0.12)}.mdc-ripple-surface--accent--activated::before{opacity:0.12;opacity:var(--mdc-ripple-activated-opacity, 0.12)}.mdc-ripple-surface--accent--activated::before,.mdc-ripple-surface--accent--activated::after{background-color:#018786;background-color:var(--mdc-ripple-color, var(--mdc-theme-secondary, #018786))}.mdc-ripple-surface--accent--activated:hover::before,.mdc-ripple-surface--accent--activated.mdc-ripple-surface--hover::before{opacity:0.16;opacity:var(--mdc-ripple-hover-opacity, 0.16)}.mdc-ripple-surface--accent--activated.mdc-ripple-upgraded--background-focused::before,.mdc-ripple-surface--accent--activated:not(.mdc-ripple-upgraded):focus::before{transition-duration:75ms;opacity:0.24;opacity:var(--mdc-ripple-focus-opacity, 0.24)}.mdc-ripple-surface--accent--activated:not(.mdc-ripple-upgraded)::after{transition:opacity 150ms linear}.mdc-ripple-surface--accent--activated:not(.mdc-ripple-upgraded):active::after{transition-duration:75ms;opacity:0.24;opacity:var(--mdc-ripple-press-opacity, 0.24)}.mdc-ripple-surface--accent--activated.mdc-ripple-upgraded{--mdc-ripple-fg-opacity: var(--mdc-ripple-press-opacity, 0.24)}.mdc-ripple-surface--accent--selected::before{opacity:0.08;opacity:var(--mdc-ripple-selected-opacity, 0.08)}.mdc-ripple-surface--accent--selected::before,.mdc-ripple-surface--accent--selected::after{background-color:#018786;background-color:var(--mdc-ripple-color, var(--mdc-theme-secondary, #018786))}.mdc-ripple-surface--accent--selected:hover::before,.mdc-ripple-surface--accent--selected.mdc-ripple-surface--hover::before{opacity:0.12;opacity:var(--mdc-ripple-hover-opacity, 0.12)}.mdc-ripple-surface--accent--selected.mdc-ripple-upgraded--background-focused::before,.mdc-ripple-surface--accent--selected:not(.mdc-ripple-upgraded):focus::before{transition-duration:75ms;opacity:0.2;opacity:var(--mdc-ripple-focus-opacity, 0.2)}.mdc-ripple-surface--accent--selected:not(.mdc-ripple-upgraded)::after{transition:opacity 150ms linear}.mdc-ripple-surface--accent--selected:not(.mdc-ripple-upgraded):active::after{transition-duration:75ms;opacity:0.2;opacity:var(--mdc-ripple-press-opacity, 0.2)}.mdc-ripple-surface--accent--selected.mdc-ripple-upgraded{--mdc-ripple-fg-opacity: var(--mdc-ripple-press-opacity, 0.2)}.mdc-ripple-surface--disabled{opacity:0}`;

  // node_modules/@material/mwc-ripple/mwc-ripple.js
  /**
  @license
  Copyright 2018 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var Ripple = class Ripple2 extends RippleBase {
  };
  Ripple.styles = style3;
  Ripple = __decorate([
    customElement("mwc-ripple")
  ], Ripple);

  // node_modules/@material/mwc-ripple/ripple-handlers.js
  /**
  @license
  Copyright 2020 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var RippleHandlers = class {
    constructor(rippleFn) {
      this.startPress = (ev) => {
        rippleFn().then((r) => {
          r && r.startPress(ev);
        });
      };
      this.endPress = () => {
        rippleFn().then((r) => {
          r && r.endPress();
        });
      };
      this.startFocus = () => {
        rippleFn().then((r) => {
          r && r.startFocus();
        });
      };
      this.endFocus = () => {
        rippleFn().then((r) => {
          r && r.endFocus();
        });
      };
      this.startHover = () => {
        rippleFn().then((r) => {
          r && r.startHover();
        });
      };
      this.endHover = () => {
        rippleFn().then((r) => {
          r && r.endHover();
        });
      };
    }
  };

  // node_modules/@material/mwc-button/mwc-button-base.js
  /**
  @license
  Copyright 2019 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var ButtonBase = class extends LitElement {
    constructor() {
      super(...arguments);
      this.raised = false;
      this.unelevated = false;
      this.outlined = false;
      this.dense = false;
      this.disabled = false;
      this.trailingIcon = false;
      this.fullwidth = false;
      this.icon = "";
      this.label = "";
      this.expandContent = false;
      this.shouldRenderRipple = false;
      this.rippleHandlers = new RippleHandlers(() => {
        this.shouldRenderRipple = true;
        return this.ripple;
      });
    }
    renderOverlay() {
      return html``;
    }
    renderRipple() {
      const filled = this.raised || this.unelevated;
      return this.shouldRenderRipple ? html`<mwc-ripple class="ripple" .primary="${!filled}" .disabled="${this.disabled}"></mwc-ripple>` : "";
    }
    createRenderRoot() {
      return this.attachShadow({mode: "open", delegatesFocus: true});
    }
    focus() {
      const buttonElement = this.buttonElement;
      if (buttonElement) {
        this.rippleHandlers.startFocus();
        buttonElement.focus();
      }
    }
    blur() {
      const buttonElement = this.buttonElement;
      if (buttonElement) {
        this.rippleHandlers.endFocus();
        buttonElement.blur();
      }
    }
    getRenderClasses() {
      return classMap({
        "mdc-button--raised": this.raised,
        "mdc-button--unelevated": this.unelevated,
        "mdc-button--outlined": this.outlined,
        "mdc-button--dense": this.dense
      });
    }
    render() {
      return html`
      <button
          id="button"
          class="mdc-button ${this.getRenderClasses()}"
          ?disabled="${this.disabled}"
          aria-label="${this.label || this.icon}"
          @focus="${this.handleRippleFocus}"
          @blur="${this.handleRippleBlur}"
          @mousedown="${this.handleRippleActivate}"
          @mouseenter="${this.handleRippleMouseEnter}"
          @mouseleave="${this.handleRippleMouseLeave}"
          @touchstart="${this.handleRippleActivate}"
          @touchend="${this.handleRippleDeactivate}"
          @touchcancel="${this.handleRippleDeactivate}">
        ${this.renderOverlay()}
        ${this.renderRipple()}
        <span class="leading-icon">
          <slot name="icon">
            ${this.icon && !this.trailingIcon ? this.renderIcon() : ""}
          </slot>
        </span>
        <span class="mdc-button__label">${this.label}</span>
        <span class="slot-container ${classMap({
        flex: this.expandContent
      })}">
          <slot></slot>
        </span>
        <span class="trailing-icon">
          <slot name="trailingIcon">
            ${this.icon && this.trailingIcon ? this.renderIcon() : ""}
          </slot>
        </span>
      </button>`;
    }
    renderIcon() {
      return html`
    <mwc-icon class="mdc-button__icon">
      ${this.icon}
    </mwc-icon>`;
    }
    handleRippleActivate(evt) {
      const onUp = () => {
        window.removeEventListener("mouseup", onUp);
        this.handleRippleDeactivate();
      };
      window.addEventListener("mouseup", onUp);
      this.rippleHandlers.startPress(evt);
    }
    handleRippleDeactivate() {
      this.rippleHandlers.endPress();
    }
    handleRippleMouseEnter() {
      this.rippleHandlers.startHover();
    }
    handleRippleMouseLeave() {
      this.rippleHandlers.endHover();
    }
    handleRippleFocus() {
      this.rippleHandlers.startFocus();
    }
    handleRippleBlur() {
      this.rippleHandlers.endFocus();
    }
  };
  __decorate([
    property({type: Boolean, reflect: true})
  ], ButtonBase.prototype, "raised", void 0);
  __decorate([
    property({type: Boolean, reflect: true})
  ], ButtonBase.prototype, "unelevated", void 0);
  __decorate([
    property({type: Boolean, reflect: true})
  ], ButtonBase.prototype, "outlined", void 0);
  __decorate([
    property({type: Boolean})
  ], ButtonBase.prototype, "dense", void 0);
  __decorate([
    property({type: Boolean, reflect: true})
  ], ButtonBase.prototype, "disabled", void 0);
  __decorate([
    property({type: Boolean, attribute: "trailingicon"})
  ], ButtonBase.prototype, "trailingIcon", void 0);
  __decorate([
    property({type: Boolean, reflect: true})
  ], ButtonBase.prototype, "fullwidth", void 0);
  __decorate([
    property({type: String})
  ], ButtonBase.prototype, "icon", void 0);
  __decorate([
    property({type: String})
  ], ButtonBase.prototype, "label", void 0);
  __decorate([
    property({type: Boolean})
  ], ButtonBase.prototype, "expandContent", void 0);
  __decorate([
    query("#button")
  ], ButtonBase.prototype, "buttonElement", void 0);
  __decorate([
    queryAsync("mwc-ripple")
  ], ButtonBase.prototype, "ripple", void 0);
  __decorate([
    internalProperty()
  ], ButtonBase.prototype, "shouldRenderRipple", void 0);
  __decorate([
    eventOptions({passive: true})
  ], ButtonBase.prototype, "handleRippleActivate", null);

  // node_modules/@material/mwc-button/styles-css.js
  /**
  @license
  Copyright 2018 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var style4 = css`.mdc-touch-target-wrapper{display:inline}.mdc-elevation-overlay{position:absolute;border-radius:inherit;pointer-events:none;opacity:0;opacity:var(--mdc-elevation-overlay-opacity, 0);transition:opacity 280ms cubic-bezier(0.4, 0, 0.2, 1);background-color:#fff;background-color:var(--mdc-elevation-overlay-color, #fff)}.mdc-button{-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;font-family:Roboto, sans-serif;font-family:var(--mdc-typography-button-font-family, var(--mdc-typography-font-family, Roboto, sans-serif));font-size:0.875rem;font-size:var(--mdc-typography-button-font-size, 0.875rem);line-height:2.25rem;line-height:var(--mdc-typography-button-line-height, 2.25rem);font-weight:500;font-weight:var(--mdc-typography-button-font-weight, 500);letter-spacing:0.0892857143em;letter-spacing:var(--mdc-typography-button-letter-spacing, 0.0892857143em);text-decoration:none;text-decoration:var(--mdc-typography-button-text-decoration, none);text-transform:uppercase;text-transform:var(--mdc-typography-button-text-transform, uppercase);padding:0 8px 0 8px;position:relative;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;min-width:64px;border:none;outline:none;line-height:inherit;user-select:none;-webkit-appearance:none;overflow:visible;vertical-align:middle;border-radius:4px;border-radius:var(--mdc-shape-small, 4px);height:36px}.mdc-button .mdc-elevation-overlay{width:100%;height:100%;top:0;left:0}.mdc-button::-moz-focus-inner{padding:0;border:0}.mdc-button:active{outline:none}.mdc-button:hover{cursor:pointer}.mdc-button:disabled{cursor:default;pointer-events:none}.mdc-button .mdc-button__ripple{border-radius:4px;border-radius:var(--mdc-shape-small, 4px)}.mdc-button:not(:disabled){background-color:transparent}.mdc-button:disabled{background-color:transparent}.mdc-button .mdc-button__icon{margin-left:0;margin-right:8px;display:inline-block;width:18px;height:18px;font-size:18px;vertical-align:top}[dir=rtl] .mdc-button .mdc-button__icon,.mdc-button .mdc-button__icon[dir=rtl]{margin-left:8px;margin-right:0}.mdc-button .mdc-button__touch{position:absolute;top:50%;right:0;height:48px;left:0;transform:translateY(-50%)}.mdc-button:not(:disabled){color:#6200ee;color:var(--mdc-theme-primary, #6200ee)}.mdc-button:disabled{color:rgba(0, 0, 0, 0.38)}.mdc-button__label+.mdc-button__icon{margin-left:8px;margin-right:0}[dir=rtl] .mdc-button__label+.mdc-button__icon,.mdc-button__label+.mdc-button__icon[dir=rtl]{margin-left:0;margin-right:8px}svg.mdc-button__icon{fill:currentColor}.mdc-button--raised .mdc-button__icon,.mdc-button--unelevated .mdc-button__icon,.mdc-button--outlined .mdc-button__icon{margin-left:-4px;margin-right:8px}[dir=rtl] .mdc-button--raised .mdc-button__icon,.mdc-button--raised .mdc-button__icon[dir=rtl],[dir=rtl] .mdc-button--unelevated .mdc-button__icon,.mdc-button--unelevated .mdc-button__icon[dir=rtl],[dir=rtl] .mdc-button--outlined .mdc-button__icon,.mdc-button--outlined .mdc-button__icon[dir=rtl]{margin-left:8px;margin-right:-4px}.mdc-button--raised .mdc-button__label+.mdc-button__icon,.mdc-button--unelevated .mdc-button__label+.mdc-button__icon,.mdc-button--outlined .mdc-button__label+.mdc-button__icon{margin-left:8px;margin-right:-4px}[dir=rtl] .mdc-button--raised .mdc-button__label+.mdc-button__icon,.mdc-button--raised .mdc-button__label+.mdc-button__icon[dir=rtl],[dir=rtl] .mdc-button--unelevated .mdc-button__label+.mdc-button__icon,.mdc-button--unelevated .mdc-button__label+.mdc-button__icon[dir=rtl],[dir=rtl] .mdc-button--outlined .mdc-button__label+.mdc-button__icon,.mdc-button--outlined .mdc-button__label+.mdc-button__icon[dir=rtl]{margin-left:-4px;margin-right:8px}.mdc-button--raised,.mdc-button--unelevated{padding:0 16px 0 16px}.mdc-button--raised:not(:disabled),.mdc-button--unelevated:not(:disabled){background-color:#6200ee;background-color:var(--mdc-theme-primary, #6200ee)}.mdc-button--raised:not(:disabled),.mdc-button--unelevated:not(:disabled){color:#fff;color:var(--mdc-theme-on-primary, #fff)}.mdc-button--raised:disabled,.mdc-button--unelevated:disabled{background-color:rgba(0, 0, 0, 0.12)}.mdc-button--raised:disabled,.mdc-button--unelevated:disabled{color:rgba(0, 0, 0, 0.38)}.mdc-button--raised{box-shadow:0px 3px 1px -2px rgba(0, 0, 0, 0.2),0px 2px 2px 0px rgba(0, 0, 0, 0.14),0px 1px 5px 0px rgba(0,0,0,.12);transition:box-shadow 280ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-button--raised:hover,.mdc-button--raised:focus{box-shadow:0px 2px 4px -1px rgba(0, 0, 0, 0.2),0px 4px 5px 0px rgba(0, 0, 0, 0.14),0px 1px 10px 0px rgba(0,0,0,.12)}.mdc-button--raised:active{box-shadow:0px 5px 5px -3px rgba(0, 0, 0, 0.2),0px 8px 10px 1px rgba(0, 0, 0, 0.14),0px 3px 14px 2px rgba(0,0,0,.12)}.mdc-button--raised:disabled{box-shadow:0px 0px 0px 0px rgba(0, 0, 0, 0.2),0px 0px 0px 0px rgba(0, 0, 0, 0.14),0px 0px 0px 0px rgba(0,0,0,.12)}.mdc-button--outlined{padding:0 15px 0 15px;border-width:1px;border-style:solid}.mdc-button--outlined .mdc-button__ripple{top:-1px;left:-1px;border:1px solid transparent}.mdc-button--outlined .mdc-button__touch{left:-1px;width:calc(100% + 2 * 1px)}.mdc-button--outlined:not(:disabled){border-color:rgba(0, 0, 0, 0.12)}.mdc-button--outlined:disabled{border-color:rgba(0, 0, 0, 0.12)}.mdc-button--touch{margin-top:6px;margin-bottom:6px}:host{display:inline-flex;outline:none;-webkit-tap-highlight-color:transparent;vertical-align:top}:host([fullwidth]){width:100%}:host([raised]),:host([unelevated]){--mdc-ripple-color: #fff;--mdc-ripple-focus-opacity: 0.24;--mdc-ripple-hover-opacity: 0.08;--mdc-ripple-press-opacity: 0.24}.trailing-icon ::slotted(*),.trailing-icon .mdc-button__icon,.leading-icon ::slotted(*),.leading-icon .mdc-button__icon{margin-left:0;margin-right:8px;display:inline-block;width:18px;height:18px;font-size:18px;vertical-align:top}[dir=rtl] .trailing-icon ::slotted(*),.trailing-icon ::slotted(*)[dir=rtl],[dir=rtl] .trailing-icon .mdc-button__icon,.trailing-icon .mdc-button__icon[dir=rtl],[dir=rtl] .leading-icon ::slotted(*),.leading-icon ::slotted(*)[dir=rtl],[dir=rtl] .leading-icon .mdc-button__icon,.leading-icon .mdc-button__icon[dir=rtl]{margin-left:8px;margin-right:0}.trailing-icon ::slotted(*),.trailing-icon .mdc-button__icon{margin-left:8px;margin-right:0}[dir=rtl] .trailing-icon ::slotted(*),.trailing-icon ::slotted(*)[dir=rtl],[dir=rtl] .trailing-icon .mdc-button__icon,.trailing-icon .mdc-button__icon[dir=rtl]{margin-left:0;margin-right:8px}.slot-container{display:inline-flex;align-items:center;justify-content:center}.slot-container.flex{flex:auto}.mdc-button{flex:auto;overflow:hidden;padding-left:8px;padding-left:var(--mdc-button-horizontal-padding, 8px);padding-right:8px;padding-right:var(--mdc-button-horizontal-padding, 8px)}.mdc-button--raised{box-shadow:0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12);box-shadow:var(--mdc-button-raised-box-shadow, 0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12))}.mdc-button--raised:focus{box-shadow:0px 2px 4px -1px rgba(0, 0, 0, 0.2), 0px 4px 5px 0px rgba(0, 0, 0, 0.14), 0px 1px 10px 0px rgba(0, 0, 0, 0.12);box-shadow:var(--mdc-button-raised-box-shadow-focus, var(--mdc-button-raised-box-shadow-hover, 0px 2px 4px -1px rgba(0, 0, 0, 0.2), 0px 4px 5px 0px rgba(0, 0, 0, 0.14), 0px 1px 10px 0px rgba(0, 0, 0, 0.12)))}.mdc-button--raised:hover{box-shadow:0px 2px 4px -1px rgba(0, 0, 0, 0.2), 0px 4px 5px 0px rgba(0, 0, 0, 0.14), 0px 1px 10px 0px rgba(0, 0, 0, 0.12);box-shadow:var(--mdc-button-raised-box-shadow-hover, 0px 2px 4px -1px rgba(0, 0, 0, 0.2), 0px 4px 5px 0px rgba(0, 0, 0, 0.14), 0px 1px 10px 0px rgba(0, 0, 0, 0.12))}.mdc-button--raised:active{box-shadow:0px 5px 5px -3px rgba(0, 0, 0, 0.2), 0px 8px 10px 1px rgba(0, 0, 0, 0.14), 0px 3px 14px 2px rgba(0, 0, 0, 0.12);box-shadow:var(--mdc-button-raised-box-shadow-active, 0px 5px 5px -3px rgba(0, 0, 0, 0.2), 0px 8px 10px 1px rgba(0, 0, 0, 0.14), 0px 3px 14px 2px rgba(0, 0, 0, 0.12))}.mdc-button--raised:disabled{box-shadow:0px 0px 0px 0px rgba(0, 0, 0, 0.2), 0px 0px 0px 0px rgba(0, 0, 0, 0.14), 0px 0px 0px 0px rgba(0, 0, 0, 0.12);box-shadow:var(--mdc-button-raised-box-shadow-disabled, 0px 0px 0px 0px rgba(0, 0, 0, 0.2), 0px 0px 0px 0px rgba(0, 0, 0, 0.14), 0px 0px 0px 0px rgba(0, 0, 0, 0.12))}.mdc-button--raised,.mdc-button--unelevated{padding-left:16px;padding-left:var(--mdc-button-horizontal-padding, 16px);padding-right:16px;padding-right:var(--mdc-button-horizontal-padding, 16px)}.mdc-button--outlined{border-width:1px;border-width:var(--mdc-button-outline-width, 1px);padding-left:calc(16px - 1px);padding-left:calc(var(--mdc-button-horizontal-padding, 16px) - var(--mdc-button-outline-width, 1px));padding-right:calc(16px - 1px);padding-right:calc(var(--mdc-button-horizontal-padding, 16px) - var(--mdc-button-outline-width, 1px))}.mdc-button--outlined:not(:disabled){border-color:rgba(0, 0, 0, 0.12);border-color:var(--mdc-button-outline-color, rgba(0, 0, 0, 0.12))}.mdc-button--outlined .ripple{top:calc(-1 * 1px);top:calc(-1 * var(--mdc-button-outline-width, 1px));left:calc(-1 * 1px);left:calc(-1 * var(--mdc-button-outline-width, 1px));right:initial;border-width:1px;border-width:var(--mdc-button-outline-width, 1px);border-style:solid;border-color:transparent}[dir=rtl] .mdc-button--outlined .ripple,.mdc-button--outlined .ripple[dir=rtl]{left:initial;right:calc(-1 * 1px);right:calc(-1 * var(--mdc-button-outline-width, 1px))}.mdc-button--dense{height:28px;margin-top:0;margin-bottom:0}.mdc-button--dense .mdc-button__touch{display:none}:host([disabled]){pointer-events:none}:host([disabled]) .mdc-button{color:rgba(0, 0, 0, 0.38);color:var(--mdc-button-disabled-ink-color, rgba(0, 0, 0, 0.38))}:host([disabled]) .mdc-button--raised,:host([disabled]) .mdc-button--unelevated{background-color:rgba(0, 0, 0, 0.12);background-color:var(--mdc-button-disabled-fill-color, rgba(0, 0, 0, 0.12))}:host([disabled]) .mdc-button--outlined{border-color:rgba(0, 0, 0, 0.12);border-color:var(--mdc-button-disabled-outline-color, rgba(0, 0, 0, 0.12))}`;

  // node_modules/@material/mwc-button/mwc-button.js
  /**
  @license
  Copyright 2018 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var Button = class Button2 extends ButtonBase {
  };
  Button.styles = style4;
  Button = __decorate([
    customElement("mwc-button")
  ], Button);

  // node_modules/@material/notched-outline/node_modules/tslib/tslib.es6.js
  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation.
  
  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.
  
  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** */
  var extendStatics2 = function(d, b) {
    extendStatics2 = Object.setPrototypeOf || {__proto__: []} instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2)
        if (b2.hasOwnProperty(p))
          d2[p] = b2[p];
    };
    return extendStatics2(d, b);
  };
  function __extends2(d, b) {
    extendStatics2(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }
  var __assign2 = function() {
    __assign2 = Object.assign || function __assign10(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s)
          if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
      }
      return t;
    };
    return __assign2.apply(this, arguments);
  };

  // node_modules/@material/notched-outline/constants.js
  /**
   * @license
   * Copyright 2018 Google Inc.
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in
   * all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   * THE SOFTWARE.
   */
  var strings2 = {
    NOTCH_ELEMENT_SELECTOR: ".mdc-notched-outline__notch"
  };
  var numbers2 = {
    NOTCH_ELEMENT_PADDING: 8
  };
  var cssClasses2 = {
    NO_LABEL: "mdc-notched-outline--no-label",
    OUTLINE_NOTCHED: "mdc-notched-outline--notched",
    OUTLINE_UPGRADED: "mdc-notched-outline--upgraded"
  };

  // node_modules/@material/notched-outline/foundation.js
  /**
   * @license
   * Copyright 2017 Google Inc.
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in
   * all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   * THE SOFTWARE.
   */
  var MDCNotchedOutlineFoundation = function(_super) {
    __extends2(MDCNotchedOutlineFoundation2, _super);
    function MDCNotchedOutlineFoundation2(adapter) {
      return _super.call(this, __assign2(__assign2({}, MDCNotchedOutlineFoundation2.defaultAdapter), adapter)) || this;
    }
    Object.defineProperty(MDCNotchedOutlineFoundation2, "strings", {
      get: function() {
        return strings2;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(MDCNotchedOutlineFoundation2, "cssClasses", {
      get: function() {
        return cssClasses2;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(MDCNotchedOutlineFoundation2, "numbers", {
      get: function() {
        return numbers2;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(MDCNotchedOutlineFoundation2, "defaultAdapter", {
      get: function() {
        return {
          addClass: function() {
            return void 0;
          },
          removeClass: function() {
            return void 0;
          },
          setNotchWidthProperty: function() {
            return void 0;
          },
          removeNotchWidthProperty: function() {
            return void 0;
          }
        };
      },
      enumerable: true,
      configurable: true
    });
    MDCNotchedOutlineFoundation2.prototype.notch = function(notchWidth) {
      var OUTLINE_NOTCHED = MDCNotchedOutlineFoundation2.cssClasses.OUTLINE_NOTCHED;
      if (notchWidth > 0) {
        notchWidth += numbers2.NOTCH_ELEMENT_PADDING;
      }
      this.adapter.setNotchWidthProperty(notchWidth);
      this.adapter.addClass(OUTLINE_NOTCHED);
    };
    MDCNotchedOutlineFoundation2.prototype.closeNotch = function() {
      var OUTLINE_NOTCHED = MDCNotchedOutlineFoundation2.cssClasses.OUTLINE_NOTCHED;
      this.adapter.removeClass(OUTLINE_NOTCHED);
      this.adapter.removeNotchWidthProperty();
    };
    return MDCNotchedOutlineFoundation2;
  }(MDCFoundation);

  // node_modules/@material/mwc-notched-outline/mwc-notched-outline-base.js
  /**
  @license
  Copyright 2019 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var NotchedOutlineBase = class extends BaseElement {
    constructor() {
      super(...arguments);
      this.mdcFoundationClass = MDCNotchedOutlineFoundation;
      this.width = 0;
      this.open = false;
      this.lastOpen = this.open;
    }
    createAdapter() {
      return {
        addClass: (className) => this.mdcRoot.classList.add(className),
        removeClass: (className) => this.mdcRoot.classList.remove(className),
        setNotchWidthProperty: (width) => this.notchElement.style.setProperty("width", `${width}px`),
        removeNotchWidthProperty: () => this.notchElement.style.removeProperty("width")
      };
    }
    openOrClose(shouldOpen, width) {
      if (!this.mdcFoundation) {
        return;
      }
      if (shouldOpen && width !== void 0) {
        this.mdcFoundation.notch(width);
      } else {
        this.mdcFoundation.closeNotch();
      }
    }
    render() {
      this.openOrClose(this.open, this.width);
      const classes = classMap({
        "mdc-notched-outline--notched": this.open
      });
      return html`
      <span class="mdc-notched-outline ${classes}">
        <span class="mdc-notched-outline__leading"></span>
        <span class="mdc-notched-outline__notch">
          <slot></slot>
        </span>
        <span class="mdc-notched-outline__trailing"></span>
      </span>`;
    }
  };
  __decorate([
    query(".mdc-notched-outline")
  ], NotchedOutlineBase.prototype, "mdcRoot", void 0);
  __decorate([
    property({type: Number})
  ], NotchedOutlineBase.prototype, "width", void 0);
  __decorate([
    property({type: Boolean, reflect: true})
  ], NotchedOutlineBase.prototype, "open", void 0);
  __decorate([
    query(".mdc-notched-outline__notch")
  ], NotchedOutlineBase.prototype, "notchElement", void 0);

  // node_modules/@material/mwc-notched-outline/mwc-notched-outline-css.js
  /**
  @license
  Copyright 2018 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var style5 = css`.mdc-notched-outline{display:flex;position:absolute;top:0;right:0;left:0;box-sizing:border-box;width:100%;max-width:100%;height:100%;text-align:left;pointer-events:none}[dir=rtl] .mdc-notched-outline,.mdc-notched-outline[dir=rtl]{text-align:right}.mdc-notched-outline__leading,.mdc-notched-outline__notch,.mdc-notched-outline__trailing{box-sizing:border-box;height:100%;border-top:1px solid;border-bottom:1px solid;pointer-events:none}.mdc-notched-outline__leading{border-left:1px solid;border-right:none;width:12px}[dir=rtl] .mdc-notched-outline__leading,.mdc-notched-outline__leading[dir=rtl]{border-left:none;border-right:1px solid}.mdc-notched-outline__trailing{border-left:none;border-right:1px solid;flex-grow:1}[dir=rtl] .mdc-notched-outline__trailing,.mdc-notched-outline__trailing[dir=rtl]{border-left:1px solid;border-right:none}.mdc-notched-outline__notch{flex:0 0 auto;width:auto;max-width:calc(100% - 12px * 2)}.mdc-notched-outline .mdc-floating-label{display:inline-block;position:relative;max-width:100%}.mdc-notched-outline .mdc-floating-label--float-above{text-overflow:clip}.mdc-notched-outline--upgraded .mdc-floating-label--float-above{max-width:calc(100% / 0.75)}.mdc-notched-outline--notched .mdc-notched-outline__notch{padding-left:0;padding-right:8px;border-top:none}[dir=rtl] .mdc-notched-outline--notched .mdc-notched-outline__notch,.mdc-notched-outline--notched .mdc-notched-outline__notch[dir=rtl]{padding-left:8px;padding-right:0}.mdc-notched-outline--no-label .mdc-notched-outline__notch{display:none}:host{display:block;position:absolute;right:0;left:0;box-sizing:border-box;width:100%;max-width:100%;height:100%;text-align:left;pointer-events:none}[dir=rtl] :host,:host[dir=rtl]{text-align:right}::slotted(.mdc-floating-label){display:inline-block;position:relative;top:17px;bottom:auto;max-width:100%}::slotted(.mdc-floating-label--float-above){text-overflow:clip}.mdc-notched-outline--upgraded ::slotted(.mdc-floating-label--float-above){max-width:calc(100% / .75)}.mdc-notched-outline .mdc-notched-outline__leading{border-top-left-radius:4px;border-top-left-radius:var(--mdc-shape-small, 4px);border-top-right-radius:0;border-bottom-right-radius:0;border-bottom-left-radius:4px;border-bottom-left-radius:var(--mdc-shape-small, 4px)}[dir=rtl] .mdc-notched-outline .mdc-notched-outline__leading,.mdc-notched-outline .mdc-notched-outline__leading[dir=rtl]{border-top-left-radius:0;border-top-right-radius:4px;border-top-right-radius:var(--mdc-shape-small, 4px);border-bottom-right-radius:4px;border-bottom-right-radius:var(--mdc-shape-small, 4px);border-bottom-left-radius:0}@supports(top: max(0%)){.mdc-notched-outline .mdc-notched-outline__leading{width:max(12px, var(--mdc-shape-small, 4px))}}@supports(top: max(0%)){.mdc-notched-outline .mdc-notched-outline__notch{max-width:calc(100% - max(12px, var(--mdc-shape-small, 4px)) * 2)}}.mdc-notched-outline .mdc-notched-outline__trailing{border-top-left-radius:0;border-top-right-radius:4px;border-top-right-radius:var(--mdc-shape-small, 4px);border-bottom-right-radius:4px;border-bottom-right-radius:var(--mdc-shape-small, 4px);border-bottom-left-radius:0}[dir=rtl] .mdc-notched-outline .mdc-notched-outline__trailing,.mdc-notched-outline .mdc-notched-outline__trailing[dir=rtl]{border-top-left-radius:4px;border-top-left-radius:var(--mdc-shape-small, 4px);border-top-right-radius:0;border-bottom-right-radius:0;border-bottom-left-radius:4px;border-bottom-left-radius:var(--mdc-shape-small, 4px)}.mdc-notched-outline__leading,.mdc-notched-outline__notch,.mdc-notched-outline__trailing{border-color:var(--mdc-notched-outline-border-color, var(--mdc-theme-primary, #6200ee));border-width:1px;border-width:var(--mdc-notched-outline-stroke-width, 1px)}.mdc-notched-outline--notched .mdc-notched-outline__notch{padding-top:0;padding-top:var(--mdc-notched-outline-notch-offset, 0)}`;

  // node_modules/@material/mwc-notched-outline/mwc-notched-outline.js
  /**
  @license
  Copyright 2019 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var NotchedOutline = class NotchedOutline2 extends NotchedOutlineBase {
  };
  NotchedOutline.styles = style5;
  NotchedOutline = __decorate([
    customElement("mwc-notched-outline")
  ], NotchedOutline);

  // node_modules/@material/mwc-base/observer.js
  /**
  @license
  Copyright 2018 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var observer = (observer2) => (proto, propName) => {
    if (!proto.constructor._observers) {
      proto.constructor._observers = new Map();
      const userUpdated = proto.updated;
      proto.updated = function(changedProperties) {
        userUpdated.call(this, changedProperties);
        changedProperties.forEach((v, k) => {
          const observers = this.constructor._observers;
          const observer3 = observers.get(k);
          if (observer3 !== void 0) {
            observer3.call(this, this[k], v);
          }
        });
      };
    } else if (!proto.constructor.hasOwnProperty("_observers")) {
      const observers = proto.constructor._observers;
      proto.constructor._observers = new Map();
      observers.forEach((v, k) => proto.constructor._observers.set(k, v));
    }
    proto.constructor._observers.set(propName, observer2);
  };

  // node_modules/@material/mwc-list/mwc-list-item-base.js
  /**
   @license
   Copyright 2020 Google Inc. All Rights Reserved.
  
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
  
   http://www.apache.org/licenses/LICENSE-2.0
  
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
   */
  var ListItemBase = class extends LitElement {
    constructor() {
      super(...arguments);
      this.value = "";
      this.group = null;
      this.tabindex = -1;
      this.disabled = false;
      this.twoline = false;
      this.activated = false;
      this.graphic = null;
      this.multipleGraphics = false;
      this.hasMeta = false;
      this.noninteractive = false;
      this.selected = false;
      this.shouldRenderRipple = false;
      this._managingList = null;
      this.boundOnClick = this.onClick.bind(this);
      this._firstChanged = true;
      this._skipPropRequest = false;
      this.rippleHandlers = new RippleHandlers(() => {
        this.shouldRenderRipple = true;
        return this.ripple;
      });
      this.listeners = [
        {
          target: this,
          eventNames: ["click"],
          cb: () => {
            this.onClick();
          }
        },
        {
          target: this,
          eventNames: ["mouseenter"],
          cb: this.rippleHandlers.startHover
        },
        {
          target: this,
          eventNames: ["mouseleave"],
          cb: this.rippleHandlers.endHover
        },
        {
          target: this,
          eventNames: ["focus"],
          cb: this.rippleHandlers.startFocus
        },
        {
          target: this,
          eventNames: ["blur"],
          cb: this.rippleHandlers.endFocus
        },
        {
          target: this,
          eventNames: ["mousedown", "touchstart"],
          cb: (e) => {
            const name = e.type;
            this.onDown(name === "mousedown" ? "mouseup" : "touchend", e);
          }
        }
      ];
    }
    get text() {
      const textContent = this.textContent;
      return textContent ? textContent.trim() : "";
    }
    render() {
      const text = this.renderText();
      const graphic = this.graphic ? this.renderGraphic() : html``;
      const meta = this.hasMeta ? this.renderMeta() : html``;
      return html`
      ${this.renderRipple()}
      ${graphic}
      ${text}
      ${meta}`;
    }
    renderRipple() {
      if (this.shouldRenderRipple) {
        return html`
      <mwc-ripple
        .activated=${this.activated}>
      </mwc-ripple>`;
      } else if (this.activated) {
        return html`<div class="fake-activated-ripple"></div>`;
      } else {
        return "";
      }
    }
    renderGraphic() {
      const graphicClasses = {
        multi: this.multipleGraphics
      };
      return html`
      <span class="mdc-list-item__graphic material-icons ${classMap(graphicClasses)}">
        <slot name="graphic"></slot>
      </span>`;
    }
    renderMeta() {
      return html`
      <span class="mdc-list-item__meta material-icons">
        <slot name="meta"></slot>
      </span>`;
    }
    renderText() {
      const inner = this.twoline ? this.renderTwoline() : this.renderSingleLine();
      return html`
      <span class="mdc-list-item__text">
        ${inner}
      </span>`;
    }
    renderSingleLine() {
      return html`<slot></slot>`;
    }
    renderTwoline() {
      return html`
      <span class="mdc-list-item__primary-text">
        <slot></slot>
      </span>
      <span class="mdc-list-item__secondary-text">
        <slot name="secondary"></slot>
      </span>
    `;
    }
    onClick() {
      this.fireRequestSelected(!this.selected, "interaction");
    }
    onDown(upName, evt) {
      const onUp = () => {
        window.removeEventListener(upName, onUp);
        this.rippleHandlers.endPress();
      };
      window.addEventListener(upName, onUp);
      this.rippleHandlers.startPress(evt);
    }
    fireRequestSelected(selected, source) {
      if (this.noninteractive) {
        return;
      }
      const customEv = new CustomEvent("request-selected", {bubbles: true, composed: true, detail: {source, selected}});
      this.dispatchEvent(customEv);
    }
    connectedCallback() {
      super.connectedCallback();
      if (!this.noninteractive) {
        this.setAttribute("mwc-list-item", "");
      }
      for (const listener of this.listeners) {
        for (const eventName of listener.eventNames) {
          listener.target.addEventListener(eventName, listener.cb, {passive: true});
        }
      }
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      for (const listener of this.listeners) {
        for (const eventName of listener.eventNames) {
          listener.target.removeEventListener(eventName, listener.cb);
        }
      }
      if (this._managingList) {
        this._managingList.debouncedLayout ? this._managingList.debouncedLayout(true) : this._managingList.layout(true);
      }
    }
    firstUpdated() {
      const ev = new Event("list-item-rendered", {bubbles: true, composed: true});
      this.dispatchEvent(ev);
    }
  };
  __decorate([
    query("slot")
  ], ListItemBase.prototype, "slotElement", void 0);
  __decorate([
    queryAsync("mwc-ripple")
  ], ListItemBase.prototype, "ripple", void 0);
  __decorate([
    property({type: String})
  ], ListItemBase.prototype, "value", void 0);
  __decorate([
    property({type: String, reflect: true})
  ], ListItemBase.prototype, "group", void 0);
  __decorate([
    property({type: Number, reflect: true})
  ], ListItemBase.prototype, "tabindex", void 0);
  __decorate([
    property({type: Boolean, reflect: true}),
    observer(function(value) {
      if (value) {
        this.setAttribute("aria-disabled", "true");
      } else {
        this.setAttribute("aria-disabled", "false");
      }
    })
  ], ListItemBase.prototype, "disabled", void 0);
  __decorate([
    property({type: Boolean, reflect: true})
  ], ListItemBase.prototype, "twoline", void 0);
  __decorate([
    property({type: Boolean, reflect: true})
  ], ListItemBase.prototype, "activated", void 0);
  __decorate([
    property({type: String, reflect: true})
  ], ListItemBase.prototype, "graphic", void 0);
  __decorate([
    property({type: Boolean})
  ], ListItemBase.prototype, "multipleGraphics", void 0);
  __decorate([
    property({type: Boolean})
  ], ListItemBase.prototype, "hasMeta", void 0);
  __decorate([
    property({type: Boolean, reflect: true}),
    observer(function(value) {
      if (value) {
        this.removeAttribute("aria-checked");
        this.removeAttribute("mwc-list-item");
        this.selected = false;
        this.activated = false;
        this.tabIndex = -1;
      } else {
        this.setAttribute("mwc-list-item", "");
      }
    })
  ], ListItemBase.prototype, "noninteractive", void 0);
  __decorate([
    property({type: Boolean, reflect: true}),
    observer(function(value) {
      const role = this.getAttribute("role");
      const isAriaSelectable = role === "gridcell" || role === "option" || role === "row" || role === "tab";
      if (isAriaSelectable && value) {
        this.setAttribute("aria-selected", "true");
      } else if (isAriaSelectable) {
        this.setAttribute("aria-selected", "false");
      }
      if (this._firstChanged) {
        this._firstChanged = false;
        return;
      }
      if (this._skipPropRequest) {
        return;
      }
      this.fireRequestSelected(value, "property");
    })
  ], ListItemBase.prototype, "selected", void 0);
  __decorate([
    internalProperty()
  ], ListItemBase.prototype, "shouldRenderRipple", void 0);
  __decorate([
    internalProperty()
  ], ListItemBase.prototype, "_managingList", void 0);

  // node_modules/@material/mwc-list/mwc-list-item-css.js
  /**
  @license
  Copyright 2018 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var style6 = css`:host{cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent;height:48px;display:flex;position:relative;align-items:center;justify-content:flex-start;overflow:hidden;padding:0;padding-left:var(--mdc-list-side-padding, 16px);padding-right:var(--mdc-list-side-padding, 16px);outline:none;height:48px;color:rgba(0,0,0,.87);color:var(--mdc-theme-text-primary-on-background, rgba(0, 0, 0, 0.87))}:host:focus{outline:none}:host([activated]){color:#6200ee;color:var(--mdc-theme-primary, #6200ee);--mdc-ripple-color: var(--mdc-theme-primary, #6200ee)}:host([activated]) .mdc-list-item__graphic{color:#6200ee;color:var(--mdc-theme-primary, #6200ee)}:host([activated]) .fake-activated-ripple::before{position:absolute;display:block;top:0;bottom:0;left:0;right:0;width:100%;height:100%;pointer-events:none;z-index:1;content:"";opacity:0.12;opacity:var(--mdc-ripple-activated-opacity, 0.12);background-color:#6200ee;background-color:var(--mdc-ripple-color, var(--mdc-theme-primary, #6200ee))}.mdc-list-item__graphic{flex-shrink:0;align-items:center;justify-content:center;fill:currentColor;display:inline-flex}.mdc-list-item__graphic ::slotted(*){flex-shrink:0;align-items:center;justify-content:center;fill:currentColor;width:100%;height:100%;text-align:center}.mdc-list-item__meta{width:var(--mdc-list-item-meta-size, 24px);height:var(--mdc-list-item-meta-size, 24px);margin-left:auto;margin-right:0;color:rgba(0, 0, 0, 0.38);color:var(--mdc-theme-text-hint-on-background, rgba(0, 0, 0, 0.38))}.mdc-list-item__meta.multi{width:auto}.mdc-list-item__meta ::slotted(*){width:var(--mdc-list-item-meta-size, 24px);line-height:var(--mdc-list-item-meta-size, 24px)}.mdc-list-item__meta ::slotted(.material-icons),.mdc-list-item__meta ::slotted(mwc-icon){line-height:var(--mdc-list-item-meta-size, 24px) !important}.mdc-list-item__meta ::slotted(:not(.material-icons):not(mwc-icon)){-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;font-family:Roboto, sans-serif;font-family:var(--mdc-typography-caption-font-family, var(--mdc-typography-font-family, Roboto, sans-serif));font-size:0.75rem;font-size:var(--mdc-typography-caption-font-size, 0.75rem);line-height:1.25rem;line-height:var(--mdc-typography-caption-line-height, 1.25rem);font-weight:400;font-weight:var(--mdc-typography-caption-font-weight, 400);letter-spacing:0.0333333333em;letter-spacing:var(--mdc-typography-caption-letter-spacing, 0.0333333333em);text-decoration:inherit;text-decoration:var(--mdc-typography-caption-text-decoration, inherit);text-transform:inherit;text-transform:var(--mdc-typography-caption-text-transform, inherit)}:host[dir=rtl] .mdc-list-item__meta,[dir=rtl] :host .mdc-list-item__meta{margin-left:0;margin-right:auto}.mdc-list-item__meta ::slotted(*){width:100%;height:100%}.mdc-list-item__text{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.mdc-list-item__text ::slotted([for]),.mdc-list-item__text[for]{pointer-events:none}.mdc-list-item__primary-text{text-overflow:ellipsis;white-space:nowrap;overflow:hidden;display:block;margin-top:0;line-height:normal;margin-bottom:-20px;display:block}.mdc-list-item__primary-text::before{display:inline-block;width:0;height:32px;content:"";vertical-align:0}.mdc-list-item__primary-text::after{display:inline-block;width:0;height:20px;content:"";vertical-align:-20px}.mdc-list-item__secondary-text{-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;font-family:Roboto, sans-serif;font-family:var(--mdc-typography-body2-font-family, var(--mdc-typography-font-family, Roboto, sans-serif));font-size:0.875rem;font-size:var(--mdc-typography-body2-font-size, 0.875rem);line-height:1.25rem;line-height:var(--mdc-typography-body2-line-height, 1.25rem);font-weight:400;font-weight:var(--mdc-typography-body2-font-weight, 400);letter-spacing:0.0178571429em;letter-spacing:var(--mdc-typography-body2-letter-spacing, 0.0178571429em);text-decoration:inherit;text-decoration:var(--mdc-typography-body2-text-decoration, inherit);text-transform:inherit;text-transform:var(--mdc-typography-body2-text-transform, inherit);text-overflow:ellipsis;white-space:nowrap;overflow:hidden;display:block;margin-top:0;line-height:normal;display:block}.mdc-list-item__secondary-text::before{display:inline-block;width:0;height:20px;content:"";vertical-align:0}.mdc-list--dense .mdc-list-item__secondary-text{font-size:inherit}* ::slotted(a),a{color:inherit;text-decoration:none}:host([twoline]){height:72px}:host([twoline]) .mdc-list-item__text{align-self:flex-start}:host([disabled]),:host([noninteractive]){cursor:default;pointer-events:none}:host([disabled]) .mdc-list-item__text ::slotted(*){opacity:.38}:host([disabled]) .mdc-list-item__text ::slotted(*),:host([disabled]) .mdc-list-item__primary-text ::slotted(*),:host([disabled]) .mdc-list-item__secondary-text ::slotted(*){color:#000;color:var(--mdc-theme-on-surface, #000)}.mdc-list-item__secondary-text ::slotted(*){color:rgba(0, 0, 0, 0.54);color:var(--mdc-theme-text-secondary-on-background, rgba(0, 0, 0, 0.54))}.mdc-list-item__graphic ::slotted(*){background-color:transparent;color:rgba(0, 0, 0, 0.38);color:var(--mdc-theme-text-icon-on-background, rgba(0, 0, 0, 0.38))}.mdc-list-group__subheader ::slotted(*){color:rgba(0, 0, 0, 0.87);color:var(--mdc-theme-text-primary-on-background, rgba(0, 0, 0, 0.87))}:host([graphic=avatar]) .mdc-list-item__graphic{width:var(--mdc-list-item-graphic-size, 40px);height:var(--mdc-list-item-graphic-size, 40px)}:host([graphic=avatar]) .mdc-list-item__graphic.multi{width:auto}:host([graphic=avatar]) .mdc-list-item__graphic ::slotted(*){width:var(--mdc-list-item-graphic-size, 40px);line-height:var(--mdc-list-item-graphic-size, 40px)}:host([graphic=avatar]) .mdc-list-item__graphic ::slotted(.material-icons),:host([graphic=avatar]) .mdc-list-item__graphic ::slotted(mwc-icon){line-height:var(--mdc-list-item-graphic-size, 40px) !important}:host([graphic=avatar]) .mdc-list-item__graphic ::slotted(*){border-radius:50%}:host([graphic=avatar],[graphic=medium],[graphic=large],[graphic=control]) .mdc-list-item__graphic{margin-left:0;margin-right:var(--mdc-list-item-graphic-margin, 16px)}:host[dir=rtl] :host([graphic=avatar],[graphic=medium],[graphic=large],[graphic=control]) .mdc-list-item__graphic,[dir=rtl] :host :host([graphic=avatar],[graphic=medium],[graphic=large],[graphic=control]) .mdc-list-item__graphic{margin-left:var(--mdc-list-item-graphic-margin, 16px);margin-right:0}:host([graphic=icon]) .mdc-list-item__graphic{width:var(--mdc-list-item-graphic-size, 24px);height:var(--mdc-list-item-graphic-size, 24px);margin-left:0;margin-right:var(--mdc-list-item-graphic-margin, 32px)}:host([graphic=icon]) .mdc-list-item__graphic.multi{width:auto}:host([graphic=icon]) .mdc-list-item__graphic ::slotted(*){width:var(--mdc-list-item-graphic-size, 24px);line-height:var(--mdc-list-item-graphic-size, 24px)}:host([graphic=icon]) .mdc-list-item__graphic ::slotted(.material-icons),:host([graphic=icon]) .mdc-list-item__graphic ::slotted(mwc-icon){line-height:var(--mdc-list-item-graphic-size, 24px) !important}:host[dir=rtl] :host([graphic=icon]) .mdc-list-item__graphic,[dir=rtl] :host :host([graphic=icon]) .mdc-list-item__graphic{margin-left:var(--mdc-list-item-graphic-margin, 32px);margin-right:0}:host([graphic=avatar]:not([twoLine])),:host([graphic=icon]:not([twoLine])){height:56px}:host([graphic=medium]:not([twoLine])),:host([graphic=large]:not([twoLine])){height:72px}:host([graphic=medium]) .mdc-list-item__graphic,:host([graphic=large]) .mdc-list-item__graphic{width:var(--mdc-list-item-graphic-size, 56px);height:var(--mdc-list-item-graphic-size, 56px)}:host([graphic=medium]) .mdc-list-item__graphic.multi,:host([graphic=large]) .mdc-list-item__graphic.multi{width:auto}:host([graphic=medium]) .mdc-list-item__graphic ::slotted(*),:host([graphic=large]) .mdc-list-item__graphic ::slotted(*){width:var(--mdc-list-item-graphic-size, 56px);line-height:var(--mdc-list-item-graphic-size, 56px)}:host([graphic=medium]) .mdc-list-item__graphic ::slotted(.material-icons),:host([graphic=medium]) .mdc-list-item__graphic ::slotted(mwc-icon),:host([graphic=large]) .mdc-list-item__graphic ::slotted(.material-icons),:host([graphic=large]) .mdc-list-item__graphic ::slotted(mwc-icon){line-height:var(--mdc-list-item-graphic-size, 56px) !important}:host([graphic=large]){padding-left:0px}`;

  // node_modules/@material/mwc-list/mwc-list-item.js
  /**
  @license
  Copyright 2020 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var ListItem = class ListItem2 extends ListItemBase {
  };
  ListItem.styles = style6;
  ListItem = __decorate([
    customElement("mwc-list-item")
  ], ListItem);

  // node_modules/@material/dom/keyboard.js
  /**
   * @license
   * Copyright 2020 Google Inc.
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in
   * all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   * THE SOFTWARE.
   */
  var KEY = {
    UNKNOWN: "Unknown",
    BACKSPACE: "Backspace",
    ENTER: "Enter",
    SPACEBAR: "Spacebar",
    PAGE_UP: "PageUp",
    PAGE_DOWN: "PageDown",
    END: "End",
    HOME: "Home",
    ARROW_LEFT: "ArrowLeft",
    ARROW_UP: "ArrowUp",
    ARROW_RIGHT: "ArrowRight",
    ARROW_DOWN: "ArrowDown",
    DELETE: "Delete",
    ESCAPE: "Escape"
  };
  var normalizedKeys = new Set();
  normalizedKeys.add(KEY.BACKSPACE);
  normalizedKeys.add(KEY.ENTER);
  normalizedKeys.add(KEY.SPACEBAR);
  normalizedKeys.add(KEY.PAGE_UP);
  normalizedKeys.add(KEY.PAGE_DOWN);
  normalizedKeys.add(KEY.END);
  normalizedKeys.add(KEY.HOME);
  normalizedKeys.add(KEY.ARROW_LEFT);
  normalizedKeys.add(KEY.ARROW_UP);
  normalizedKeys.add(KEY.ARROW_RIGHT);
  normalizedKeys.add(KEY.ARROW_DOWN);
  normalizedKeys.add(KEY.DELETE);
  normalizedKeys.add(KEY.ESCAPE);
  var KEY_CODE = {
    BACKSPACE: 8,
    ENTER: 13,
    SPACEBAR: 32,
    PAGE_UP: 33,
    PAGE_DOWN: 34,
    END: 35,
    HOME: 36,
    ARROW_LEFT: 37,
    ARROW_UP: 38,
    ARROW_RIGHT: 39,
    ARROW_DOWN: 40,
    DELETE: 46,
    ESCAPE: 27
  };
  var mappedKeyCodes = new Map();
  mappedKeyCodes.set(KEY_CODE.BACKSPACE, KEY.BACKSPACE);
  mappedKeyCodes.set(KEY_CODE.ENTER, KEY.ENTER);
  mappedKeyCodes.set(KEY_CODE.SPACEBAR, KEY.SPACEBAR);
  mappedKeyCodes.set(KEY_CODE.PAGE_UP, KEY.PAGE_UP);
  mappedKeyCodes.set(KEY_CODE.PAGE_DOWN, KEY.PAGE_DOWN);
  mappedKeyCodes.set(KEY_CODE.END, KEY.END);
  mappedKeyCodes.set(KEY_CODE.HOME, KEY.HOME);
  mappedKeyCodes.set(KEY_CODE.ARROW_LEFT, KEY.ARROW_LEFT);
  mappedKeyCodes.set(KEY_CODE.ARROW_UP, KEY.ARROW_UP);
  mappedKeyCodes.set(KEY_CODE.ARROW_RIGHT, KEY.ARROW_RIGHT);
  mappedKeyCodes.set(KEY_CODE.ARROW_DOWN, KEY.ARROW_DOWN);
  mappedKeyCodes.set(KEY_CODE.DELETE, KEY.DELETE);
  mappedKeyCodes.set(KEY_CODE.ESCAPE, KEY.ESCAPE);
  var navigationKeys = new Set();
  navigationKeys.add(KEY.PAGE_UP);
  navigationKeys.add(KEY.PAGE_DOWN);
  navigationKeys.add(KEY.END);
  navigationKeys.add(KEY.HOME);
  navigationKeys.add(KEY.ARROW_LEFT);
  navigationKeys.add(KEY.ARROW_UP);
  navigationKeys.add(KEY.ARROW_RIGHT);
  navigationKeys.add(KEY.ARROW_DOWN);
  function normalizeKey(evt) {
    var key = evt.key;
    if (normalizedKeys.has(key)) {
      return key;
    }
    var mappedKey = mappedKeyCodes.get(evt.keyCode);
    if (mappedKey) {
      return mappedKey;
    }
    return KEY.UNKNOWN;
  }

  // node_modules/@material/list/constants.js
  /**
   * @license
   * Copyright 2018 Google Inc.
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in
   * all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   * THE SOFTWARE.
   */
  var cssClasses3 = {
    LIST_ITEM_ACTIVATED_CLASS: "mdc-list-item--activated",
    LIST_ITEM_CLASS: "mdc-list-item",
    LIST_ITEM_DISABLED_CLASS: "mdc-list-item--disabled",
    LIST_ITEM_SELECTED_CLASS: "mdc-list-item--selected",
    LIST_ITEM_TEXT_CLASS: "mdc-list-item__text",
    LIST_ITEM_PRIMARY_TEXT_CLASS: "mdc-list-item__primary-text",
    ROOT: "mdc-list"
  };
  var strings3 = {
    ACTION_EVENT: "MDCList:action",
    ARIA_CHECKED: "aria-checked",
    ARIA_CHECKED_CHECKBOX_SELECTOR: '[role="checkbox"][aria-checked="true"]',
    ARIA_CHECKED_RADIO_SELECTOR: '[role="radio"][aria-checked="true"]',
    ARIA_CURRENT: "aria-current",
    ARIA_DISABLED: "aria-disabled",
    ARIA_ORIENTATION: "aria-orientation",
    ARIA_ORIENTATION_HORIZONTAL: "horizontal",
    ARIA_ROLE_CHECKBOX_SELECTOR: '[role="checkbox"]',
    ARIA_SELECTED: "aria-selected",
    CHECKBOX_RADIO_SELECTOR: 'input[type="checkbox"], input[type="radio"]',
    CHECKBOX_SELECTOR: 'input[type="checkbox"]',
    CHILD_ELEMENTS_TO_TOGGLE_TABINDEX: "\n    ." + cssClasses3.LIST_ITEM_CLASS + " button:not(:disabled),\n    ." + cssClasses3.LIST_ITEM_CLASS + " a\n  ",
    FOCUSABLE_CHILD_ELEMENTS: "\n    ." + cssClasses3.LIST_ITEM_CLASS + " button:not(:disabled),\n    ." + cssClasses3.LIST_ITEM_CLASS + " a,\n    ." + cssClasses3.LIST_ITEM_CLASS + ' input[type="radio"]:not(:disabled),\n    .' + cssClasses3.LIST_ITEM_CLASS + ' input[type="checkbox"]:not(:disabled)\n  ',
    RADIO_SELECTOR: 'input[type="radio"]'
  };
  var numbers3 = {
    UNSET_INDEX: -1,
    TYPEAHEAD_BUFFER_CLEAR_TIMEOUT_MS: 300
  };

  // node_modules/@material/mwc-list/mwc-list-foundation.js
  /**
   @license
   Copyright 2020 Google Inc. All Rights Reserved.
  
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
  
   http://www.apache.org/licenses/LICENSE-2.0
  
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
   */
  var findIndexDiff = (oldSet, newSet) => {
    const oldArr = Array.from(oldSet);
    const newArr = Array.from(newSet);
    const diff = {added: [], removed: []};
    const oldSorted = oldArr.sort();
    const newSorted = newArr.sort();
    let i = 0;
    let j = 0;
    while (i < oldSorted.length || j < newSorted.length) {
      const oldVal = oldSorted[i];
      const newVal = newSorted[j];
      if (oldVal === newVal) {
        i++;
        j++;
        continue;
      }
      if (oldVal !== void 0 && (newVal === void 0 || oldVal < newVal)) {
        diff.removed.push(oldVal);
        i++;
        continue;
      }
      if (newVal !== void 0 && (oldVal === void 0 || newVal < oldVal)) {
        diff.added.push(newVal);
        j++;
        continue;
      }
    }
    return diff;
  };
  var ELEMENTS_KEY_ALLOWED_IN = ["input", "button", "textarea", "select"];
  function isIndexSet(selectedIndex) {
    return selectedIndex instanceof Set;
  }
  var createSetFromIndex = (index) => {
    const entry = index === numbers3.UNSET_INDEX ? new Set() : index;
    return isIndexSet(entry) ? new Set(entry) : new Set([entry]);
  };
  var MDCListFoundation = class extends MDCFoundation {
    constructor(adapter) {
      super(Object.assign(Object.assign({}, MDCListFoundation.defaultAdapter), adapter));
      this.isMulti_ = false;
      this.wrapFocus_ = false;
      this.isVertical_ = true;
      this.selectedIndex_ = numbers3.UNSET_INDEX;
      this.focusedItemIndex_ = numbers3.UNSET_INDEX;
      this.useActivatedClass_ = false;
      this.ariaCurrentAttrValue_ = null;
    }
    static get strings() {
      return strings3;
    }
    static get numbers() {
      return numbers3;
    }
    static get defaultAdapter() {
      return {
        focusItemAtIndex: () => void 0,
        getFocusedElementIndex: () => 0,
        getListItemCount: () => 0,
        isFocusInsideList: () => false,
        isRootFocused: () => false,
        notifyAction: () => void 0,
        notifySelected: () => void 0,
        getSelectedStateForElementIndex: () => false,
        setDisabledStateForElementIndex: () => void 0,
        getDisabledStateForElementIndex: () => false,
        setSelectedStateForElementIndex: () => void 0,
        setActivatedStateForElementIndex: () => void 0,
        setTabIndexForElementIndex: () => void 0,
        setAttributeForElementIndex: () => void 0,
        getAttributeForElementIndex: () => null
      };
    }
    setWrapFocus(value) {
      this.wrapFocus_ = value;
    }
    setMulti(value) {
      this.isMulti_ = value;
      const currentIndex = this.selectedIndex_;
      if (value) {
        if (!isIndexSet(currentIndex)) {
          const isUnset = currentIndex === numbers3.UNSET_INDEX;
          this.selectedIndex_ = isUnset ? new Set() : new Set([currentIndex]);
        }
      } else {
        if (isIndexSet(currentIndex)) {
          if (currentIndex.size) {
            const vals = Array.from(currentIndex).sort();
            this.selectedIndex_ = vals[0];
          } else {
            this.selectedIndex_ = numbers3.UNSET_INDEX;
          }
        }
      }
    }
    setVerticalOrientation(value) {
      this.isVertical_ = value;
    }
    setUseActivatedClass(useActivated) {
      this.useActivatedClass_ = useActivated;
    }
    getSelectedIndex() {
      return this.selectedIndex_;
    }
    setSelectedIndex(index) {
      if (!this.isIndexValid_(index)) {
        return;
      }
      if (this.isMulti_) {
        this.setMultiSelectionAtIndex_(createSetFromIndex(index));
      } else {
        this.setSingleSelectionAtIndex_(index);
      }
    }
    handleFocusIn(_, listItemIndex) {
      if (listItemIndex >= 0) {
        this.adapter.setTabIndexForElementIndex(listItemIndex, 0);
      }
    }
    handleFocusOut(_, listItemIndex) {
      if (listItemIndex >= 0) {
        this.adapter.setTabIndexForElementIndex(listItemIndex, -1);
      }
      setTimeout(() => {
        if (!this.adapter.isFocusInsideList()) {
          this.setTabindexToFirstSelectedItem_();
        }
      }, 0);
    }
    handleKeydown(event, isRootListItem, listItemIndex) {
      const isArrowLeft = normalizeKey(event) === "ArrowLeft";
      const isArrowUp = normalizeKey(event) === "ArrowUp";
      const isArrowRight = normalizeKey(event) === "ArrowRight";
      const isArrowDown = normalizeKey(event) === "ArrowDown";
      const isHome = normalizeKey(event) === "Home";
      const isEnd = normalizeKey(event) === "End";
      const isEnter = normalizeKey(event) === "Enter";
      const isSpace = normalizeKey(event) === "Spacebar";
      if (this.adapter.isRootFocused()) {
        if (isArrowUp || isEnd) {
          event.preventDefault();
          this.focusLastElement();
        } else if (isArrowDown || isHome) {
          event.preventDefault();
          this.focusFirstElement();
        }
        return;
      }
      let currentIndex = this.adapter.getFocusedElementIndex();
      if (currentIndex === -1) {
        currentIndex = listItemIndex;
        if (currentIndex < 0) {
          return;
        }
      }
      let nextIndex;
      if (this.isVertical_ && isArrowDown || !this.isVertical_ && isArrowRight) {
        this.preventDefaultEvent(event);
        nextIndex = this.focusNextElement(currentIndex);
      } else if (this.isVertical_ && isArrowUp || !this.isVertical_ && isArrowLeft) {
        this.preventDefaultEvent(event);
        nextIndex = this.focusPrevElement(currentIndex);
      } else if (isHome) {
        this.preventDefaultEvent(event);
        nextIndex = this.focusFirstElement();
      } else if (isEnd) {
        this.preventDefaultEvent(event);
        nextIndex = this.focusLastElement();
      } else if (isEnter || isSpace) {
        if (isRootListItem) {
          const target = event.target;
          if (target && target.tagName === "A" && isEnter) {
            return;
          }
          this.preventDefaultEvent(event);
          this.setSelectedIndexOnAction_(currentIndex, true);
        }
      }
      this.focusedItemIndex_ = currentIndex;
      if (nextIndex !== void 0) {
        this.setTabindexAtIndex_(nextIndex);
        this.focusedItemIndex_ = nextIndex;
      }
    }
    handleSingleSelection(index, isInteraction, force) {
      if (index === numbers3.UNSET_INDEX) {
        return;
      }
      this.setSelectedIndexOnAction_(index, isInteraction, force);
      this.setTabindexAtIndex_(index);
      this.focusedItemIndex_ = index;
    }
    focusNextElement(index) {
      const count = this.adapter.getListItemCount();
      let nextIndex = index + 1;
      if (nextIndex >= count) {
        if (this.wrapFocus_) {
          nextIndex = 0;
        } else {
          return index;
        }
      }
      this.adapter.focusItemAtIndex(nextIndex);
      return nextIndex;
    }
    focusPrevElement(index) {
      let prevIndex = index - 1;
      if (prevIndex < 0) {
        if (this.wrapFocus_) {
          prevIndex = this.adapter.getListItemCount() - 1;
        } else {
          return index;
        }
      }
      this.adapter.focusItemAtIndex(prevIndex);
      return prevIndex;
    }
    focusFirstElement() {
      this.adapter.focusItemAtIndex(0);
      return 0;
    }
    focusLastElement() {
      const lastIndex = this.adapter.getListItemCount() - 1;
      this.adapter.focusItemAtIndex(lastIndex);
      return lastIndex;
    }
    setEnabled(itemIndex, isEnabled) {
      if (!this.isIndexValid_(itemIndex)) {
        return;
      }
      this.adapter.setDisabledStateForElementIndex(itemIndex, !isEnabled);
    }
    preventDefaultEvent(evt) {
      const target = evt.target;
      const tagName = `${target.tagName}`.toLowerCase();
      if (ELEMENTS_KEY_ALLOWED_IN.indexOf(tagName) === -1) {
        evt.preventDefault();
      }
    }
    setSingleSelectionAtIndex_(index, isInteraction = true) {
      if (this.selectedIndex_ === index) {
        return;
      }
      if (this.selectedIndex_ !== numbers3.UNSET_INDEX) {
        this.adapter.setSelectedStateForElementIndex(this.selectedIndex_, false);
        if (this.useActivatedClass_) {
          this.adapter.setActivatedStateForElementIndex(this.selectedIndex_, false);
        }
      }
      if (isInteraction) {
        this.adapter.setSelectedStateForElementIndex(index, true);
      }
      if (this.useActivatedClass_) {
        this.adapter.setActivatedStateForElementIndex(index, true);
      }
      this.setAriaForSingleSelectionAtIndex_(index);
      this.selectedIndex_ = index;
      this.adapter.notifySelected(index);
    }
    setMultiSelectionAtIndex_(newIndex, isInteraction = true) {
      const oldIndex = createSetFromIndex(this.selectedIndex_);
      const diff = findIndexDiff(oldIndex, newIndex);
      if (!diff.removed.length && !diff.added.length) {
        return;
      }
      for (const removed of diff.removed) {
        if (isInteraction) {
          this.adapter.setSelectedStateForElementIndex(removed, false);
        }
        if (this.useActivatedClass_) {
          this.adapter.setActivatedStateForElementIndex(removed, false);
        }
      }
      for (const added of diff.added) {
        if (isInteraction) {
          this.adapter.setSelectedStateForElementIndex(added, true);
        }
        if (this.useActivatedClass_) {
          this.adapter.setActivatedStateForElementIndex(added, true);
        }
      }
      this.selectedIndex_ = newIndex;
      this.adapter.notifySelected(newIndex, diff);
    }
    setAriaForSingleSelectionAtIndex_(index) {
      if (this.selectedIndex_ === numbers3.UNSET_INDEX) {
        this.ariaCurrentAttrValue_ = this.adapter.getAttributeForElementIndex(index, strings3.ARIA_CURRENT);
      }
      const isAriaCurrent = this.ariaCurrentAttrValue_ !== null;
      const ariaAttribute = isAriaCurrent ? strings3.ARIA_CURRENT : strings3.ARIA_SELECTED;
      if (this.selectedIndex_ !== numbers3.UNSET_INDEX) {
        this.adapter.setAttributeForElementIndex(this.selectedIndex_, ariaAttribute, "false");
      }
      const ariaAttributeValue = isAriaCurrent ? this.ariaCurrentAttrValue_ : "true";
      this.adapter.setAttributeForElementIndex(index, ariaAttribute, ariaAttributeValue);
    }
    setTabindexAtIndex_(index) {
      if (this.focusedItemIndex_ === numbers3.UNSET_INDEX && index !== 0) {
        this.adapter.setTabIndexForElementIndex(0, -1);
      } else if (this.focusedItemIndex_ >= 0 && this.focusedItemIndex_ !== index) {
        this.adapter.setTabIndexForElementIndex(this.focusedItemIndex_, -1);
      }
      this.adapter.setTabIndexForElementIndex(index, 0);
    }
    setTabindexToFirstSelectedItem_() {
      let targetIndex = 0;
      if (typeof this.selectedIndex_ === "number" && this.selectedIndex_ !== numbers3.UNSET_INDEX) {
        targetIndex = this.selectedIndex_;
      } else if (isIndexSet(this.selectedIndex_) && this.selectedIndex_.size > 0) {
        targetIndex = Math.min(...this.selectedIndex_);
      }
      this.setTabindexAtIndex_(targetIndex);
    }
    isIndexValid_(index) {
      if (index instanceof Set) {
        if (!this.isMulti_) {
          throw new Error("MDCListFoundation: Array of index is only supported for checkbox based list");
        }
        if (index.size === 0) {
          return true;
        } else {
          let isOneInRange = false;
          for (const entry of index) {
            isOneInRange = this.isIndexInRange_(entry);
            if (isOneInRange) {
              break;
            }
          }
          return isOneInRange;
        }
      } else if (typeof index === "number") {
        if (this.isMulti_) {
          throw new Error("MDCListFoundation: Expected array of index for checkbox based list but got number: " + index);
        }
        return index === numbers3.UNSET_INDEX || this.isIndexInRange_(index);
      } else {
        return false;
      }
    }
    isIndexInRange_(index) {
      const listSize = this.adapter.getListItemCount();
      return index >= 0 && index < listSize;
    }
    setSelectedIndexOnAction_(index, isInteraction, force) {
      if (this.adapter.getDisabledStateForElementIndex(index)) {
        return;
      }
      let checkedIndex = index;
      if (this.isMulti_) {
        checkedIndex = new Set([index]);
      }
      if (!this.isIndexValid_(checkedIndex)) {
        return;
      }
      if (this.isMulti_) {
        this.toggleMultiAtIndex(index, force, isInteraction);
      } else {
        if (isInteraction || force) {
          this.setSingleSelectionAtIndex_(index, isInteraction);
        } else {
          const isDeselection = this.selectedIndex_ === index;
          if (isDeselection) {
            this.setSingleSelectionAtIndex_(numbers3.UNSET_INDEX);
          }
        }
      }
      if (isInteraction) {
        this.adapter.notifyAction(index);
      }
    }
    toggleMultiAtIndex(index, force, isInteraction = true) {
      let newSelectionValue = false;
      if (force === void 0) {
        newSelectionValue = !this.adapter.getSelectedStateForElementIndex(index);
      } else {
        newSelectionValue = force;
      }
      const newSet = createSetFromIndex(this.selectedIndex_);
      if (newSelectionValue) {
        newSet.add(index);
      } else {
        newSet.delete(index);
      }
      this.setMultiSelectionAtIndex_(newSet, isInteraction);
    }
  };
  var mwc_list_foundation_default = MDCListFoundation;

  // node_modules/@material/mwc-list/mwc-list-base.js
  /**
  @license
  Copyright 2020 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  function debounceLayout(callback, waitInMS = 50) {
    let timeoutId;
    return function(updateItems = true) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        callback(updateItems);
      }, waitInMS);
    };
  }
  var isListItem = (element) => {
    return element.hasAttribute("mwc-list-item");
  };
  function clearAndCreateItemsReadyPromise() {
    const oldResolver = this.itemsReadyResolver;
    this.itemsReady = new Promise((res) => {
      return this.itemsReadyResolver = res;
    });
    oldResolver();
  }
  var ListBase = class extends BaseElement {
    constructor() {
      super();
      this.mdcAdapter = null;
      this.mdcFoundationClass = mwc_list_foundation_default;
      this.activatable = false;
      this.multi = false;
      this.wrapFocus = false;
      this.itemRoles = null;
      this.innerRole = null;
      this.innerAriaLabel = null;
      this.rootTabbable = false;
      this.previousTabindex = null;
      this.noninteractive = false;
      this.itemsReadyResolver = () => {
      };
      this.itemsReady = Promise.resolve([]);
      this.items_ = [];
      const debouncedFunction = debounceLayout(this.layout.bind(this));
      this.debouncedLayout = (updateItems = true) => {
        clearAndCreateItemsReadyPromise.call(this);
        debouncedFunction(updateItems);
      };
    }
    async _getUpdateComplete() {
      await super._getUpdateComplete();
      await this.itemsReady;
    }
    get assignedElements() {
      const slot = this.slotElement;
      if (slot) {
        return slot.assignedNodes({flatten: true}).filter(isNodeElement);
      }
      return [];
    }
    get items() {
      return this.items_;
    }
    updateItems() {
      const nodes = this.assignedElements;
      const listItems = [];
      for (const node of nodes) {
        if (isListItem(node)) {
          listItems.push(node);
          node._managingList = this;
        }
        if (node.hasAttribute("divider") && !node.hasAttribute("role")) {
          node.setAttribute("role", "separator");
        }
      }
      this.items_ = listItems;
      const selectedIndices = new Set();
      this.items_.forEach((item, index) => {
        if (this.itemRoles) {
          item.setAttribute("role", this.itemRoles);
        } else {
          item.removeAttribute("role");
        }
        if (item.selected) {
          selectedIndices.add(index);
        }
      });
      if (this.multi) {
        this.select(selectedIndices);
      } else {
        const index = selectedIndices.size ? selectedIndices.entries().next().value[1] : -1;
        this.select(index);
      }
      const itemsUpdatedEv = new Event("items-updated", {bubbles: true, composed: true});
      this.dispatchEvent(itemsUpdatedEv);
    }
    get selected() {
      const index = this.index;
      if (!isIndexSet(index)) {
        if (index === -1) {
          return null;
        }
        return this.items[index];
      }
      const selected = [];
      for (const entry of index) {
        selected.push(this.items[entry]);
      }
      return selected;
    }
    get index() {
      if (this.mdcFoundation) {
        return this.mdcFoundation.getSelectedIndex();
      }
      return -1;
    }
    render() {
      const role = this.innerRole === null ? void 0 : this.innerRole;
      const ariaLabel = this.innerAriaLabel === null ? void 0 : this.innerAriaLabel;
      const tabindex = this.rootTabbable ? "0" : "-1";
      return html`
      <!-- @ts-ignore -->
      <ul
          tabindex=${tabindex}
          role="${ifDefined(role)}"
          aria-label="${ifDefined(ariaLabel)}"
          class="mdc-list"
          @keydown=${this.onKeydown}
          @focusin=${this.onFocusIn}
          @focusout=${this.onFocusOut}
          @request-selected=${this.onRequestSelected}
          @list-item-rendered=${this.onListItemConnected}>
        <slot></slot>
        ${this.renderPlaceholder()}
      </ul>
    `;
    }
    renderPlaceholder() {
      if (this.emptyMessage !== void 0 && this.assignedElements.length === 0) {
        return html`
        <mwc-list-item noninteractive>${this.emptyMessage}</mwc-list-item>
      `;
      }
      return null;
    }
    firstUpdated() {
      super.firstUpdated();
      if (!this.items.length) {
        this.mdcFoundation.setMulti(this.multi);
        this.layout();
      }
    }
    onFocusIn(evt) {
      if (this.mdcFoundation && this.mdcRoot) {
        const index = this.getIndexOfTarget(evt);
        this.mdcFoundation.handleFocusIn(evt, index);
      }
    }
    onFocusOut(evt) {
      if (this.mdcFoundation && this.mdcRoot) {
        const index = this.getIndexOfTarget(evt);
        this.mdcFoundation.handleFocusOut(evt, index);
      }
    }
    onKeydown(evt) {
      if (this.mdcFoundation && this.mdcRoot) {
        const index = this.getIndexOfTarget(evt);
        const target = evt.target;
        const isRootListItem = isListItem(target);
        this.mdcFoundation.handleKeydown(evt, isRootListItem, index);
      }
    }
    onRequestSelected(evt) {
      if (this.mdcFoundation) {
        let index = this.getIndexOfTarget(evt);
        if (index === -1) {
          this.layout();
          index = this.getIndexOfTarget(evt);
          if (index === -1) {
            return;
          }
        }
        const element = this.items[index];
        if (element.disabled) {
          return;
        }
        const selected = evt.detail.selected;
        const source = evt.detail.source;
        this.mdcFoundation.handleSingleSelection(index, source === "interaction", selected);
        evt.stopPropagation();
      }
    }
    getIndexOfTarget(evt) {
      const elements = this.items;
      const path = evt.composedPath();
      for (const pathItem of path) {
        let index = -1;
        if (isNodeElement(pathItem) && isListItem(pathItem)) {
          index = elements.indexOf(pathItem);
        }
        if (index !== -1) {
          return index;
        }
      }
      return -1;
    }
    createAdapter() {
      this.mdcAdapter = {
        getListItemCount: () => {
          if (this.mdcRoot) {
            return this.items.length;
          }
          return 0;
        },
        getFocusedElementIndex: this.getFocusedItemIndex,
        getAttributeForElementIndex: (index, attr) => {
          const listElement = this.mdcRoot;
          if (!listElement) {
            return "";
          }
          const element = this.items[index];
          return element ? element.getAttribute(attr) : "";
        },
        setAttributeForElementIndex: (index, attr, val) => {
          if (!this.mdcRoot) {
            return;
          }
          const element = this.items[index];
          if (element) {
            element.setAttribute(attr, val);
          }
        },
        focusItemAtIndex: (index) => {
          const element = this.items[index];
          if (element) {
            element.focus();
          }
        },
        setTabIndexForElementIndex: (index, value) => {
          const item = this.items[index];
          if (item) {
            item.tabindex = value;
          }
        },
        notifyAction: (index) => {
          const init = {bubbles: true, composed: true};
          init.detail = {index};
          const ev = new CustomEvent("action", init);
          this.dispatchEvent(ev);
        },
        notifySelected: (index, diff) => {
          const init = {bubbles: true, composed: true};
          init.detail = {index, diff};
          const ev = new CustomEvent("selected", init);
          this.dispatchEvent(ev);
        },
        isFocusInsideList: () => {
          return doesElementContainFocus(this);
        },
        isRootFocused: () => {
          const mdcRoot = this.mdcRoot;
          const root = mdcRoot.getRootNode();
          return root.activeElement === mdcRoot;
        },
        setDisabledStateForElementIndex: (index, value) => {
          const item = this.items[index];
          if (!item) {
            return;
          }
          item.disabled = value;
        },
        getDisabledStateForElementIndex: (index) => {
          const item = this.items[index];
          if (!item) {
            return false;
          }
          return item.disabled;
        },
        setSelectedStateForElementIndex: (index, value) => {
          const item = this.items[index];
          if (!item) {
            return;
          }
          item.selected = value;
        },
        getSelectedStateForElementIndex: (index) => {
          const item = this.items[index];
          if (!item) {
            return false;
          }
          return item.selected;
        },
        setActivatedStateForElementIndex: (index, value) => {
          const item = this.items[index];
          if (!item) {
            return;
          }
          item.activated = value;
        }
      };
      return this.mdcAdapter;
    }
    selectUi(index, activate = false) {
      const item = this.items[index];
      if (item) {
        item.selected = true;
        item.activated = activate;
      }
    }
    deselectUi(index) {
      const item = this.items[index];
      if (item) {
        item.selected = false;
        item.activated = false;
      }
    }
    select(index) {
      if (!this.mdcFoundation) {
        return;
      }
      this.mdcFoundation.setSelectedIndex(index);
    }
    toggle(index, force) {
      if (this.multi) {
        this.mdcFoundation.toggleMultiAtIndex(index, force);
      }
    }
    onListItemConnected(e) {
      const target = e.target;
      this.layout(this.items.indexOf(target) === -1);
    }
    layout(updateItems = true) {
      if (updateItems) {
        this.updateItems();
      }
      const first = this.items[0];
      for (const item of this.items) {
        item.tabindex = -1;
      }
      if (first) {
        if (this.noninteractive) {
          if (!this.previousTabindex) {
            this.previousTabindex = first;
          }
        } else {
          first.tabindex = 0;
        }
      }
      this.itemsReadyResolver();
    }
    getFocusedItemIndex() {
      if (!this.mdcRoot) {
        return -1;
      }
      if (!this.items.length) {
        return -1;
      }
      const activeElementPath = deepActiveElementPath();
      if (!activeElementPath.length) {
        return -1;
      }
      for (let i = activeElementPath.length - 1; i >= 0; i--) {
        const activeItem = activeElementPath[i];
        if (isListItem(activeItem)) {
          return this.items.indexOf(activeItem);
        }
      }
      return -1;
    }
    focusItemAtIndex(index) {
      for (const item of this.items) {
        if (item.tabindex === 0) {
          item.tabindex = -1;
          break;
        }
      }
      this.items[index].tabindex = 0;
      this.items[index].focus();
    }
    focus() {
      const root = this.mdcRoot;
      if (root) {
        root.focus();
      }
    }
    blur() {
      const root = this.mdcRoot;
      if (root) {
        root.blur();
      }
    }
  };
  __decorate([
    property({type: String})
  ], ListBase.prototype, "emptyMessage", void 0);
  __decorate([
    query(".mdc-list")
  ], ListBase.prototype, "mdcRoot", void 0);
  __decorate([
    query("slot")
  ], ListBase.prototype, "slotElement", void 0);
  __decorate([
    property({type: Boolean}),
    observer(function(value) {
      if (this.mdcFoundation) {
        this.mdcFoundation.setUseActivatedClass(value);
      }
    })
  ], ListBase.prototype, "activatable", void 0);
  __decorate([
    property({type: Boolean}),
    observer(function(newValue, oldValue) {
      if (this.mdcFoundation) {
        this.mdcFoundation.setMulti(newValue);
      }
      if (oldValue !== void 0) {
        this.layout();
      }
    })
  ], ListBase.prototype, "multi", void 0);
  __decorate([
    property({type: Boolean}),
    observer(function(value) {
      if (this.mdcFoundation) {
        this.mdcFoundation.setWrapFocus(value);
      }
    })
  ], ListBase.prototype, "wrapFocus", void 0);
  __decorate([
    property({type: String}),
    observer(function(_newValue, oldValue) {
      if (oldValue !== void 0) {
        this.updateItems();
      }
    })
  ], ListBase.prototype, "itemRoles", void 0);
  __decorate([
    property({type: String})
  ], ListBase.prototype, "innerRole", void 0);
  __decorate([
    property({type: String})
  ], ListBase.prototype, "innerAriaLabel", void 0);
  __decorate([
    property({type: Boolean})
  ], ListBase.prototype, "rootTabbable", void 0);
  __decorate([
    property({type: Boolean, reflect: true}),
    observer(function(value) {
      const slot = this.slotElement;
      if (value && slot) {
        const tabbable = findAssignedElement(slot, '[tabindex="0"]');
        this.previousTabindex = tabbable;
        if (tabbable) {
          tabbable.setAttribute("tabindex", "-1");
        }
      } else if (!value && this.previousTabindex) {
        this.previousTabindex.setAttribute("tabindex", "0");
        this.previousTabindex = null;
      }
    })
  ], ListBase.prototype, "noninteractive", void 0);

  // node_modules/@material/mwc-list/mwc-list-css.js
  /**
  @license
  Copyright 2018 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var style7 = css`@keyframes mdc-ripple-fg-radius-in{from{animation-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transform:translate(var(--mdc-ripple-fg-translate-start, 0)) scale(1)}to{transform:translate(var(--mdc-ripple-fg-translate-end, 0)) scale(var(--mdc-ripple-fg-scale, 1))}}@keyframes mdc-ripple-fg-opacity-in{from{animation-timing-function:linear;opacity:0}to{opacity:var(--mdc-ripple-fg-opacity, 0)}}@keyframes mdc-ripple-fg-opacity-out{from{animation-timing-function:linear;opacity:var(--mdc-ripple-fg-opacity, 0)}to{opacity:0}}:host{display:block}.mdc-list{-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;font-family:Roboto, sans-serif;font-family:var(--mdc-typography-subtitle1-font-family, var(--mdc-typography-font-family, Roboto, sans-serif));font-size:1rem;font-size:var(--mdc-typography-subtitle1-font-size, 1rem);line-height:1.75rem;line-height:var(--mdc-typography-subtitle1-line-height, 1.75rem);font-weight:400;font-weight:var(--mdc-typography-subtitle1-font-weight, 400);letter-spacing:0.009375em;letter-spacing:var(--mdc-typography-subtitle1-letter-spacing, 0.009375em);text-decoration:inherit;text-decoration:var(--mdc-typography-subtitle1-text-decoration, inherit);text-transform:inherit;text-transform:var(--mdc-typography-subtitle1-text-transform, inherit);line-height:1.5rem;margin:0;padding:8px 0;list-style-type:none;color:rgba(0, 0, 0, 0.87);color:var(--mdc-theme-text-primary-on-background, rgba(0, 0, 0, 0.87));padding:var(--mdc-list-vertical-padding, 8px) 0}.mdc-list:focus{outline:none}.mdc-list-item{height:48px}.mdc-list--dense{padding-top:4px;padding-bottom:4px;font-size:.812rem}.mdc-list ::slotted([divider]){height:0;margin:0;border:none;border-bottom-width:1px;border-bottom-style:solid;border-bottom-color:rgba(0, 0, 0, 0.12)}.mdc-list ::slotted([divider][padded]){margin:0 var(--mdc-list-side-padding, 16px)}.mdc-list ::slotted([divider][inset]){margin-left:var(--mdc-list-inset-margin, 72px);margin-right:0;width:calc(100% - var(--mdc-list-inset-margin, 72px))}.mdc-list-group[dir=rtl] .mdc-list ::slotted([divider][inset]),[dir=rtl] .mdc-list-group .mdc-list ::slotted([divider][inset]){margin-left:0;margin-right:var(--mdc-list-inset-margin, 72px)}.mdc-list ::slotted([divider][inset][padded]){width:calc(100% - var(--mdc-list-inset-margin, 72px) - var(--mdc-list-side-padding, 16px))}.mdc-list--dense ::slotted([mwc-list-item]){height:40px}.mdc-list--dense ::slotted([mwc-list]){--mdc-list-item-graphic-size: 20px}.mdc-list--two-line.mdc-list--dense ::slotted([mwc-list-item]),.mdc-list--avatar-list.mdc-list--dense ::slotted([mwc-list-item]){height:60px}.mdc-list--avatar-list.mdc-list--dense ::slotted([mwc-list]){--mdc-list-item-graphic-size: 36px}:host([noninteractive]){pointer-events:none;cursor:default}.mdc-list--dense ::slotted(.mdc-list-item__primary-text){display:block;margin-top:0;line-height:normal;margin-bottom:-20px}.mdc-list--dense ::slotted(.mdc-list-item__primary-text)::before{display:inline-block;width:0;height:24px;content:"";vertical-align:0}.mdc-list--dense ::slotted(.mdc-list-item__primary-text)::after{display:inline-block;width:0;height:20px;content:"";vertical-align:-20px}`;

  // node_modules/@material/mwc-list/mwc-list.js
  /**
  @license
  Copyright 2020 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var List = class List2 extends ListBase {
  };
  List.styles = style7;
  List = __decorate([
    customElement("mwc-list")
  ], List);

  // node_modules/@material/menu-surface/constants.js
  /**
   * @license
   * Copyright 2018 Google Inc.
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in
   * all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   * THE SOFTWARE.
   */
  var cssClasses4 = {
    ANCHOR: "mdc-menu-surface--anchor",
    ANIMATING_CLOSED: "mdc-menu-surface--animating-closed",
    ANIMATING_OPEN: "mdc-menu-surface--animating-open",
    FIXED: "mdc-menu-surface--fixed",
    IS_OPEN_BELOW: "mdc-menu-surface--is-open-below",
    OPEN: "mdc-menu-surface--open",
    ROOT: "mdc-menu-surface"
  };
  var strings4 = {
    CLOSED_EVENT: "MDCMenuSurface:closed",
    OPENED_EVENT: "MDCMenuSurface:opened",
    FOCUSABLE_ELEMENTS: [
      "button:not(:disabled)",
      '[href]:not([aria-disabled="true"])',
      "input:not(:disabled)",
      "select:not(:disabled)",
      "textarea:not(:disabled)",
      '[tabindex]:not([tabindex="-1"]):not([aria-disabled="true"])'
    ].join(", ")
  };
  var numbers4 = {
    TRANSITION_OPEN_DURATION: 120,
    TRANSITION_CLOSE_DURATION: 75,
    MARGIN_TO_EDGE: 32,
    ANCHOR_TO_MENU_SURFACE_WIDTH_RATIO: 0.67
  };
  var CornerBit;
  (function(CornerBit2) {
    CornerBit2[CornerBit2["BOTTOM"] = 1] = "BOTTOM";
    CornerBit2[CornerBit2["CENTER"] = 2] = "CENTER";
    CornerBit2[CornerBit2["RIGHT"] = 4] = "RIGHT";
    CornerBit2[CornerBit2["FLIP_RTL"] = 8] = "FLIP_RTL";
  })(CornerBit || (CornerBit = {}));
  var Corner;
  (function(Corner2) {
    Corner2[Corner2["TOP_LEFT"] = 0] = "TOP_LEFT";
    Corner2[Corner2["TOP_RIGHT"] = 4] = "TOP_RIGHT";
    Corner2[Corner2["BOTTOM_LEFT"] = 1] = "BOTTOM_LEFT";
    Corner2[Corner2["BOTTOM_RIGHT"] = 5] = "BOTTOM_RIGHT";
    Corner2[Corner2["TOP_START"] = 8] = "TOP_START";
    Corner2[Corner2["TOP_END"] = 12] = "TOP_END";
    Corner2[Corner2["BOTTOM_START"] = 9] = "BOTTOM_START";
    Corner2[Corner2["BOTTOM_END"] = 13] = "BOTTOM_END";
  })(Corner || (Corner = {}));

  // node_modules/@material/menu-surface/node_modules/tslib/tslib.es6.js
  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation.
  
  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.
  
  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** */
  var extendStatics3 = function(d, b) {
    extendStatics3 = Object.setPrototypeOf || {__proto__: []} instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2)
        if (b2.hasOwnProperty(p))
          d2[p] = b2[p];
    };
    return extendStatics3(d, b);
  };
  function __extends3(d, b) {
    extendStatics3(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }
  var __assign3 = function() {
    __assign3 = Object.assign || function __assign10(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s)
          if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
      }
      return t;
    };
    return __assign3.apply(this, arguments);
  };
  function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m)
      return m.call(o);
    if (o && typeof o.length === "number")
      return {
        next: function() {
          if (o && i >= o.length)
            o = void 0;
          return {value: o && o[i++], done: !o};
        }
      };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
  }

  // node_modules/@material/menu-surface/foundation.js
  /**
   * @license
   * Copyright 2018 Google Inc.
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in
   * all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   * THE SOFTWARE.
   */
  var MDCMenuSurfaceFoundation = function(_super) {
    __extends3(MDCMenuSurfaceFoundation2, _super);
    function MDCMenuSurfaceFoundation2(adapter) {
      var _this = _super.call(this, __assign3(__assign3({}, MDCMenuSurfaceFoundation2.defaultAdapter), adapter)) || this;
      _this.isSurfaceOpen = false;
      _this.isQuickOpen = false;
      _this.isHoistedElement = false;
      _this.isFixedPosition = false;
      _this.openAnimationEndTimerId = 0;
      _this.closeAnimationEndTimerId = 0;
      _this.animationRequestId = 0;
      _this.anchorCorner = Corner.TOP_START;
      _this.originCorner = Corner.TOP_START;
      _this.anchorMargin = {top: 0, right: 0, bottom: 0, left: 0};
      _this.position = {x: 0, y: 0};
      return _this;
    }
    Object.defineProperty(MDCMenuSurfaceFoundation2, "cssClasses", {
      get: function() {
        return cssClasses4;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(MDCMenuSurfaceFoundation2, "strings", {
      get: function() {
        return strings4;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(MDCMenuSurfaceFoundation2, "numbers", {
      get: function() {
        return numbers4;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(MDCMenuSurfaceFoundation2, "Corner", {
      get: function() {
        return Corner;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(MDCMenuSurfaceFoundation2, "defaultAdapter", {
      get: function() {
        return {
          addClass: function() {
            return void 0;
          },
          removeClass: function() {
            return void 0;
          },
          hasClass: function() {
            return false;
          },
          hasAnchor: function() {
            return false;
          },
          isElementInContainer: function() {
            return false;
          },
          isFocused: function() {
            return false;
          },
          isRtl: function() {
            return false;
          },
          getInnerDimensions: function() {
            return {height: 0, width: 0};
          },
          getAnchorDimensions: function() {
            return null;
          },
          getWindowDimensions: function() {
            return {height: 0, width: 0};
          },
          getBodyDimensions: function() {
            return {height: 0, width: 0};
          },
          getWindowScroll: function() {
            return {x: 0, y: 0};
          },
          setPosition: function() {
            return void 0;
          },
          setMaxHeight: function() {
            return void 0;
          },
          setTransformOrigin: function() {
            return void 0;
          },
          saveFocus: function() {
            return void 0;
          },
          restoreFocus: function() {
            return void 0;
          },
          notifyClose: function() {
            return void 0;
          },
          notifyOpen: function() {
            return void 0;
          }
        };
      },
      enumerable: true,
      configurable: true
    });
    MDCMenuSurfaceFoundation2.prototype.init = function() {
      var _a2 = MDCMenuSurfaceFoundation2.cssClasses, ROOT = _a2.ROOT, OPEN = _a2.OPEN;
      if (!this.adapter.hasClass(ROOT)) {
        throw new Error(ROOT + " class required in root element.");
      }
      if (this.adapter.hasClass(OPEN)) {
        this.isSurfaceOpen = true;
      }
    };
    MDCMenuSurfaceFoundation2.prototype.destroy = function() {
      clearTimeout(this.openAnimationEndTimerId);
      clearTimeout(this.closeAnimationEndTimerId);
      cancelAnimationFrame(this.animationRequestId);
    };
    MDCMenuSurfaceFoundation2.prototype.setAnchorCorner = function(corner) {
      this.anchorCorner = corner;
    };
    MDCMenuSurfaceFoundation2.prototype.flipCornerHorizontally = function() {
      this.originCorner = this.originCorner ^ CornerBit.RIGHT;
    };
    MDCMenuSurfaceFoundation2.prototype.setAnchorMargin = function(margin) {
      this.anchorMargin.top = margin.top || 0;
      this.anchorMargin.right = margin.right || 0;
      this.anchorMargin.bottom = margin.bottom || 0;
      this.anchorMargin.left = margin.left || 0;
    };
    MDCMenuSurfaceFoundation2.prototype.setIsHoisted = function(isHoisted) {
      this.isHoistedElement = isHoisted;
    };
    MDCMenuSurfaceFoundation2.prototype.setFixedPosition = function(isFixedPosition) {
      this.isFixedPosition = isFixedPosition;
    };
    MDCMenuSurfaceFoundation2.prototype.setAbsolutePosition = function(x, y) {
      this.position.x = this.isFinite(x) ? x : 0;
      this.position.y = this.isFinite(y) ? y : 0;
    };
    MDCMenuSurfaceFoundation2.prototype.setQuickOpen = function(quickOpen) {
      this.isQuickOpen = quickOpen;
    };
    MDCMenuSurfaceFoundation2.prototype.isOpen = function() {
      return this.isSurfaceOpen;
    };
    MDCMenuSurfaceFoundation2.prototype.open = function() {
      var _this = this;
      if (this.isSurfaceOpen) {
        return;
      }
      this.adapter.saveFocus();
      if (this.isQuickOpen) {
        this.isSurfaceOpen = true;
        this.adapter.addClass(MDCMenuSurfaceFoundation2.cssClasses.OPEN);
        this.dimensions = this.adapter.getInnerDimensions();
        this.autoposition();
        this.adapter.notifyOpen();
      } else {
        this.adapter.addClass(MDCMenuSurfaceFoundation2.cssClasses.ANIMATING_OPEN);
        this.animationRequestId = requestAnimationFrame(function() {
          _this.adapter.addClass(MDCMenuSurfaceFoundation2.cssClasses.OPEN);
          _this.dimensions = _this.adapter.getInnerDimensions();
          _this.autoposition();
          _this.openAnimationEndTimerId = setTimeout(function() {
            _this.openAnimationEndTimerId = 0;
            _this.adapter.removeClass(MDCMenuSurfaceFoundation2.cssClasses.ANIMATING_OPEN);
            _this.adapter.notifyOpen();
          }, numbers4.TRANSITION_OPEN_DURATION);
        });
        this.isSurfaceOpen = true;
      }
    };
    MDCMenuSurfaceFoundation2.prototype.close = function(skipRestoreFocus) {
      var _this = this;
      if (skipRestoreFocus === void 0) {
        skipRestoreFocus = false;
      }
      if (!this.isSurfaceOpen) {
        return;
      }
      if (this.isQuickOpen) {
        this.isSurfaceOpen = false;
        if (!skipRestoreFocus) {
          this.maybeRestoreFocus();
        }
        this.adapter.removeClass(MDCMenuSurfaceFoundation2.cssClasses.OPEN);
        this.adapter.removeClass(MDCMenuSurfaceFoundation2.cssClasses.IS_OPEN_BELOW);
        this.adapter.notifyClose();
      } else {
        this.adapter.addClass(MDCMenuSurfaceFoundation2.cssClasses.ANIMATING_CLOSED);
        requestAnimationFrame(function() {
          _this.adapter.removeClass(MDCMenuSurfaceFoundation2.cssClasses.OPEN);
          _this.adapter.removeClass(MDCMenuSurfaceFoundation2.cssClasses.IS_OPEN_BELOW);
          _this.closeAnimationEndTimerId = setTimeout(function() {
            _this.closeAnimationEndTimerId = 0;
            _this.adapter.removeClass(MDCMenuSurfaceFoundation2.cssClasses.ANIMATING_CLOSED);
            _this.adapter.notifyClose();
          }, numbers4.TRANSITION_CLOSE_DURATION);
        });
        this.isSurfaceOpen = false;
        if (!skipRestoreFocus) {
          this.maybeRestoreFocus();
        }
      }
    };
    MDCMenuSurfaceFoundation2.prototype.handleBodyClick = function(evt) {
      var el = evt.target;
      if (this.adapter.isElementInContainer(el)) {
        return;
      }
      this.close();
    };
    MDCMenuSurfaceFoundation2.prototype.handleKeydown = function(evt) {
      var keyCode = evt.keyCode, key = evt.key;
      var isEscape = key === "Escape" || keyCode === 27;
      if (isEscape) {
        this.close();
      }
    };
    MDCMenuSurfaceFoundation2.prototype.autoposition = function() {
      var _a2;
      this.measurements = this.getAutoLayoutmeasurements();
      var corner = this.getoriginCorner();
      var maxMenuSurfaceHeight = this.getMenuSurfaceMaxHeight(corner);
      var verticalAlignment = this.hasBit(corner, CornerBit.BOTTOM) ? "bottom" : "top";
      var horizontalAlignment = this.hasBit(corner, CornerBit.RIGHT) ? "right" : "left";
      var horizontalOffset = this.getHorizontalOriginOffset(corner);
      var verticalOffset = this.getVerticalOriginOffset(corner);
      var _b = this.measurements, anchorSize = _b.anchorSize, surfaceSize = _b.surfaceSize;
      var position = (_a2 = {}, _a2[horizontalAlignment] = horizontalOffset, _a2[verticalAlignment] = verticalOffset, _a2);
      if (anchorSize.width / surfaceSize.width > numbers4.ANCHOR_TO_MENU_SURFACE_WIDTH_RATIO) {
        horizontalAlignment = "center";
      }
      if (this.isHoistedElement || this.isFixedPosition) {
        this.adjustPositionForHoistedElement(position);
      }
      this.adapter.setTransformOrigin(horizontalAlignment + " " + verticalAlignment);
      this.adapter.setPosition(position);
      this.adapter.setMaxHeight(maxMenuSurfaceHeight ? maxMenuSurfaceHeight + "px" : "");
      if (!this.hasBit(corner, CornerBit.BOTTOM)) {
        this.adapter.addClass(MDCMenuSurfaceFoundation2.cssClasses.IS_OPEN_BELOW);
      }
    };
    MDCMenuSurfaceFoundation2.prototype.getAutoLayoutmeasurements = function() {
      var anchorRect = this.adapter.getAnchorDimensions();
      var bodySize = this.adapter.getBodyDimensions();
      var viewportSize = this.adapter.getWindowDimensions();
      var windowScroll = this.adapter.getWindowScroll();
      if (!anchorRect) {
        anchorRect = {
          top: this.position.y,
          right: this.position.x,
          bottom: this.position.y,
          left: this.position.x,
          width: 0,
          height: 0
        };
      }
      return {
        anchorSize: anchorRect,
        bodySize,
        surfaceSize: this.dimensions,
        viewportDistance: {
          top: anchorRect.top,
          right: viewportSize.width - anchorRect.right,
          bottom: viewportSize.height - anchorRect.bottom,
          left: anchorRect.left
        },
        viewportSize,
        windowScroll
      };
    };
    MDCMenuSurfaceFoundation2.prototype.getoriginCorner = function() {
      var corner = this.originCorner;
      var _a2 = this.measurements, viewportDistance = _a2.viewportDistance, anchorSize = _a2.anchorSize, surfaceSize = _a2.surfaceSize;
      var MARGIN_TO_EDGE = MDCMenuSurfaceFoundation2.numbers.MARGIN_TO_EDGE;
      var isAnchoredToBottom = this.hasBit(this.anchorCorner, CornerBit.BOTTOM);
      var availableTop;
      var availableBottom;
      if (isAnchoredToBottom) {
        availableTop = viewportDistance.top - MARGIN_TO_EDGE + anchorSize.height + this.anchorMargin.bottom;
        availableBottom = viewportDistance.bottom - MARGIN_TO_EDGE - this.anchorMargin.bottom;
      } else {
        availableTop = viewportDistance.top - MARGIN_TO_EDGE + this.anchorMargin.top;
        availableBottom = viewportDistance.bottom - MARGIN_TO_EDGE + anchorSize.height - this.anchorMargin.top;
      }
      var isAvailableBottom = availableBottom - surfaceSize.height > 0;
      if (!isAvailableBottom && availableTop >= availableBottom) {
        corner = this.setBit(corner, CornerBit.BOTTOM);
      }
      var isRtl = this.adapter.isRtl();
      var isFlipRtl = this.hasBit(this.anchorCorner, CornerBit.FLIP_RTL);
      var hasRightBit = this.hasBit(this.anchorCorner, CornerBit.RIGHT) || this.hasBit(corner, CornerBit.RIGHT);
      var isAnchoredToRight = false;
      if (isRtl && isFlipRtl) {
        isAnchoredToRight = !hasRightBit;
      } else {
        isAnchoredToRight = hasRightBit;
      }
      var availableLeft;
      var availableRight;
      if (isAnchoredToRight) {
        availableLeft = viewportDistance.left + anchorSize.width + this.anchorMargin.right;
        availableRight = viewportDistance.right - this.anchorMargin.right;
      } else {
        availableLeft = viewportDistance.left + this.anchorMargin.left;
        availableRight = viewportDistance.right + anchorSize.width - this.anchorMargin.left;
      }
      var isAvailableLeft = availableLeft - surfaceSize.width > 0;
      var isAvailableRight = availableRight - surfaceSize.width > 0;
      var isOriginCornerAlignedToEnd = this.hasBit(corner, CornerBit.FLIP_RTL) && this.hasBit(corner, CornerBit.RIGHT);
      if (isAvailableRight && isOriginCornerAlignedToEnd && isRtl || !isAvailableLeft && isOriginCornerAlignedToEnd) {
        corner = this.unsetBit(corner, CornerBit.RIGHT);
      } else if (isAvailableLeft && isAnchoredToRight && isRtl || isAvailableLeft && !isAnchoredToRight && hasRightBit || !isAvailableRight && availableLeft >= availableRight) {
        corner = this.setBit(corner, CornerBit.RIGHT);
      }
      return corner;
    };
    MDCMenuSurfaceFoundation2.prototype.getMenuSurfaceMaxHeight = function(corner) {
      var viewportDistance = this.measurements.viewportDistance;
      var maxHeight = 0;
      var isBottomAligned = this.hasBit(corner, CornerBit.BOTTOM);
      var isBottomAnchored = this.hasBit(this.anchorCorner, CornerBit.BOTTOM);
      var MARGIN_TO_EDGE = MDCMenuSurfaceFoundation2.numbers.MARGIN_TO_EDGE;
      if (isBottomAligned) {
        maxHeight = viewportDistance.top + this.anchorMargin.top - MARGIN_TO_EDGE;
        if (!isBottomAnchored) {
          maxHeight += this.measurements.anchorSize.height;
        }
      } else {
        maxHeight = viewportDistance.bottom - this.anchorMargin.bottom + this.measurements.anchorSize.height - MARGIN_TO_EDGE;
        if (isBottomAnchored) {
          maxHeight -= this.measurements.anchorSize.height;
        }
      }
      return maxHeight;
    };
    MDCMenuSurfaceFoundation2.prototype.getHorizontalOriginOffset = function(corner) {
      var anchorSize = this.measurements.anchorSize;
      var isRightAligned = this.hasBit(corner, CornerBit.RIGHT);
      var avoidHorizontalOverlap = this.hasBit(this.anchorCorner, CornerBit.RIGHT);
      if (isRightAligned) {
        var rightOffset = avoidHorizontalOverlap ? anchorSize.width - this.anchorMargin.left : this.anchorMargin.right;
        if (this.isHoistedElement || this.isFixedPosition) {
          return rightOffset - (this.measurements.viewportSize.width - this.measurements.bodySize.width);
        }
        return rightOffset;
      }
      return avoidHorizontalOverlap ? anchorSize.width - this.anchorMargin.right : this.anchorMargin.left;
    };
    MDCMenuSurfaceFoundation2.prototype.getVerticalOriginOffset = function(corner) {
      var anchorSize = this.measurements.anchorSize;
      var isBottomAligned = this.hasBit(corner, CornerBit.BOTTOM);
      var avoidVerticalOverlap = this.hasBit(this.anchorCorner, CornerBit.BOTTOM);
      var y = 0;
      if (isBottomAligned) {
        y = avoidVerticalOverlap ? anchorSize.height - this.anchorMargin.top : -this.anchorMargin.bottom;
      } else {
        y = avoidVerticalOverlap ? anchorSize.height + this.anchorMargin.bottom : this.anchorMargin.top;
      }
      return y;
    };
    MDCMenuSurfaceFoundation2.prototype.adjustPositionForHoistedElement = function(position) {
      var e_1, _a2;
      var _b = this.measurements, windowScroll = _b.windowScroll, viewportDistance = _b.viewportDistance;
      var props = Object.keys(position);
      try {
        for (var props_1 = __values(props), props_1_1 = props_1.next(); !props_1_1.done; props_1_1 = props_1.next()) {
          var prop = props_1_1.value;
          var value = position[prop] || 0;
          value += viewportDistance[prop];
          if (!this.isFixedPosition) {
            if (prop === "top") {
              value += windowScroll.y;
            } else if (prop === "bottom") {
              value -= windowScroll.y;
            } else if (prop === "left") {
              value += windowScroll.x;
            } else {
              value -= windowScroll.x;
            }
          }
          position[prop] = value;
        }
      } catch (e_1_1) {
        e_1 = {error: e_1_1};
      } finally {
        try {
          if (props_1_1 && !props_1_1.done && (_a2 = props_1.return))
            _a2.call(props_1);
        } finally {
          if (e_1)
            throw e_1.error;
        }
      }
    };
    MDCMenuSurfaceFoundation2.prototype.maybeRestoreFocus = function() {
      var isRootFocused = this.adapter.isFocused();
      var childHasFocus = document.activeElement && this.adapter.isElementInContainer(document.activeElement);
      if (isRootFocused || childHasFocus) {
        this.adapter.restoreFocus();
      }
    };
    MDCMenuSurfaceFoundation2.prototype.hasBit = function(corner, bit) {
      return Boolean(corner & bit);
    };
    MDCMenuSurfaceFoundation2.prototype.setBit = function(corner, bit) {
      return corner | bit;
    };
    MDCMenuSurfaceFoundation2.prototype.unsetBit = function(corner, bit) {
      return corner ^ bit;
    };
    MDCMenuSurfaceFoundation2.prototype.isFinite = function(num) {
      return typeof num === "number" && isFinite(num);
    };
    return MDCMenuSurfaceFoundation2;
  }(MDCFoundation);
  var foundation_default2 = MDCMenuSurfaceFoundation;

  // node_modules/@material/mwc-menu/mwc-menu-surface-base.js
  var stringToCorner = {
    TOP_LEFT: Corner.TOP_LEFT,
    TOP_RIGHT: Corner.TOP_RIGHT,
    BOTTOM_LEFT: Corner.BOTTOM_LEFT,
    BOTTOM_RIGHT: Corner.BOTTOM_RIGHT,
    TOP_START: Corner.TOP_START,
    TOP_END: Corner.TOP_END,
    BOTTOM_START: Corner.BOTTOM_START,
    BOTTOM_END: Corner.BOTTOM_END
  };
  var MenuSurfaceBase = class extends BaseElement {
    constructor() {
      super(...arguments);
      this.mdcFoundationClass = foundation_default2;
      this.absolute = false;
      this.fullwidth = false;
      this.fixed = false;
      this.x = null;
      this.y = null;
      this.quick = false;
      this.open = false;
      this.bitwiseCorner = Corner.TOP_START;
      this.previousMenuCorner = null;
      this.menuCorner = "START";
      this.corner = "TOP_START";
      this.styleTop = "";
      this.styleLeft = "";
      this.styleRight = "";
      this.styleBottom = "";
      this.styleMaxHeight = "";
      this.styleTransformOrigin = "";
      this.anchor = null;
      this.previouslyFocused = null;
      this.previousAnchor = null;
      this.onBodyClickBound = () => void 0;
    }
    render() {
      const classes = {
        "mdc-menu-surface--fixed": this.fixed,
        "mdc-menu-surface--fullwidth": this.fullwidth
      };
      const styles = {
        top: this.styleTop,
        left: this.styleLeft,
        right: this.styleRight,
        bottom: this.styleBottom,
        "max-height": this.styleMaxHeight,
        "transform-origin": this.styleTransformOrigin
      };
      return html`
      <div
          class="mdc-menu-surface ${classMap(classes)}"
          style="${styleMap(styles)}"
          @keydown=${this.onKeydown}
          @opened=${this.registerBodyClick}
          @closed=${this.deregisterBodyClick}>
        <slot></slot>
      </div>`;
    }
    createAdapter() {
      return Object.assign(Object.assign({}, addHasRemoveClass(this.mdcRoot)), {hasAnchor: () => {
        return !!this.anchor;
      }, notifyClose: () => {
        const init = {bubbles: true, composed: true};
        const ev = new CustomEvent("closed", init);
        this.open = false;
        this.mdcRoot.dispatchEvent(ev);
      }, notifyOpen: () => {
        const init = {bubbles: true, composed: true};
        const ev = new CustomEvent("opened", init);
        this.open = true;
        this.mdcRoot.dispatchEvent(ev);
      }, isElementInContainer: () => false, isRtl: () => {
        if (this.mdcRoot) {
          return getComputedStyle(this.mdcRoot).direction === "rtl";
        }
        return false;
      }, setTransformOrigin: (origin) => {
        const root = this.mdcRoot;
        if (!root) {
          return;
        }
        this.styleTransformOrigin = origin;
      }, isFocused: () => {
        return doesElementContainFocus(this);
      }, saveFocus: () => {
        const activeElementPath = deepActiveElementPath();
        const pathLength = activeElementPath.length;
        if (!pathLength) {
          this.previouslyFocused = null;
        }
        this.previouslyFocused = activeElementPath[pathLength - 1];
      }, restoreFocus: () => {
        if (!this.previouslyFocused) {
          return;
        }
        if ("focus" in this.previouslyFocused) {
          this.previouslyFocused.focus();
        }
      }, getInnerDimensions: () => {
        const mdcRoot = this.mdcRoot;
        if (!mdcRoot) {
          return {width: 0, height: 0};
        }
        return {width: mdcRoot.offsetWidth, height: mdcRoot.offsetHeight};
      }, getAnchorDimensions: () => {
        const anchorElement = this.anchor;
        return anchorElement ? anchorElement.getBoundingClientRect() : null;
      }, getBodyDimensions: () => {
        return {
          width: document.body.clientWidth,
          height: document.body.clientHeight
        };
      }, getWindowDimensions: () => {
        return {
          width: window.innerWidth,
          height: window.innerHeight
        };
      }, getWindowScroll: () => {
        return {
          x: window.pageXOffset,
          y: window.pageYOffset
        };
      }, setPosition: (position) => {
        const mdcRoot = this.mdcRoot;
        if (!mdcRoot) {
          return;
        }
        this.styleLeft = "left" in position ? `${position.left}px` : "";
        this.styleRight = "right" in position ? `${position.right}px` : "";
        this.styleTop = "top" in position ? `${position.top}px` : "";
        this.styleBottom = "bottom" in position ? `${position.bottom}px` : "";
      }, setMaxHeight: async (height) => {
        const mdcRoot = this.mdcRoot;
        if (!mdcRoot) {
          return;
        }
        this.styleMaxHeight = height;
        await this.updateComplete;
        this.styleMaxHeight = `var(--mdc-menu-max-height, ${height})`;
      }});
    }
    onKeydown(evt) {
      if (this.mdcFoundation) {
        this.mdcFoundation.handleKeydown(evt);
      }
    }
    onBodyClick(evt) {
      const path = evt.composedPath();
      if (path.indexOf(this) === -1) {
        this.close();
      }
    }
    registerBodyClick() {
      this.onBodyClickBound = this.onBodyClick.bind(this);
      document.body.addEventListener("click", this.onBodyClickBound, {passive: true, capture: true});
    }
    deregisterBodyClick() {
      document.body.removeEventListener("click", this.onBodyClickBound, {capture: true});
    }
    close() {
      this.open = false;
    }
    show() {
      this.open = true;
    }
  };
  __decorate([
    query(".mdc-menu-surface")
  ], MenuSurfaceBase.prototype, "mdcRoot", void 0);
  __decorate([
    query("slot")
  ], MenuSurfaceBase.prototype, "slotElement", void 0);
  __decorate([
    property({type: Boolean}),
    observer(function(isAbsolute) {
      if (this.mdcFoundation && !this.fixed) {
        this.mdcFoundation.setIsHoisted(isAbsolute);
      }
    })
  ], MenuSurfaceBase.prototype, "absolute", void 0);
  __decorate([
    property({type: Boolean})
  ], MenuSurfaceBase.prototype, "fullwidth", void 0);
  __decorate([
    property({type: Boolean}),
    observer(function(isFixed) {
      if (this.mdcFoundation && !this.absolute) {
        this.mdcFoundation.setIsHoisted(isFixed);
      }
    })
  ], MenuSurfaceBase.prototype, "fixed", void 0);
  __decorate([
    property({type: Number}),
    observer(function(value) {
      if (this.mdcFoundation && this.y !== null && value !== null) {
        this.mdcFoundation.setAbsolutePosition(value, this.y);
        this.mdcFoundation.setAnchorMargin({left: value, top: this.y, right: -value, bottom: this.y});
      }
    })
  ], MenuSurfaceBase.prototype, "x", void 0);
  __decorate([
    property({type: Number}),
    observer(function(value) {
      if (this.mdcFoundation && this.x !== null && value !== null) {
        this.mdcFoundation.setAbsolutePosition(this.x, value);
        this.mdcFoundation.setAnchorMargin({left: this.x, top: value, right: -this.x, bottom: value});
      }
    })
  ], MenuSurfaceBase.prototype, "y", void 0);
  __decorate([
    property({type: Boolean}),
    observer(function(value) {
      if (this.mdcFoundation) {
        this.mdcFoundation.setQuickOpen(value);
      }
    })
  ], MenuSurfaceBase.prototype, "quick", void 0);
  __decorate([
    property({type: Boolean, reflect: true}),
    observer(function(isOpen, wasOpen) {
      if (this.mdcFoundation) {
        if (isOpen) {
          this.mdcFoundation.open();
        } else if (wasOpen !== void 0) {
          this.mdcFoundation.close();
        }
      }
    })
  ], MenuSurfaceBase.prototype, "open", void 0);
  __decorate([
    internalProperty(),
    observer(function(value) {
      if (this.mdcFoundation) {
        if (value) {
          this.mdcFoundation.setAnchorCorner(value);
        } else {
          this.mdcFoundation.setAnchorCorner(value);
        }
      }
    })
  ], MenuSurfaceBase.prototype, "bitwiseCorner", void 0);
  __decorate([
    property({type: String}),
    observer(function(value) {
      if (this.mdcFoundation) {
        const isValidValue = value === "START" || value === "END";
        const isFirstTimeSet = this.previousMenuCorner === null;
        const cornerChanged = !isFirstTimeSet && value !== this.previousMenuCorner;
        const initiallySetToEnd = isFirstTimeSet && value === "END";
        if (isValidValue && (cornerChanged || initiallySetToEnd)) {
          this.bitwiseCorner = this.bitwiseCorner ^ CornerBit.RIGHT;
          this.mdcFoundation.flipCornerHorizontally();
          this.previousMenuCorner = value;
        }
      }
    })
  ], MenuSurfaceBase.prototype, "menuCorner", void 0);
  __decorate([
    property({type: String}),
    observer(function(value) {
      if (this.mdcFoundation) {
        if (value) {
          let newCorner = stringToCorner[value];
          if (this.menuCorner === "END") {
            newCorner = newCorner ^ CornerBit.RIGHT;
          }
          this.bitwiseCorner = newCorner;
        }
      }
    })
  ], MenuSurfaceBase.prototype, "corner", void 0);
  __decorate([
    internalProperty()
  ], MenuSurfaceBase.prototype, "styleTop", void 0);
  __decorate([
    internalProperty()
  ], MenuSurfaceBase.prototype, "styleLeft", void 0);
  __decorate([
    internalProperty()
  ], MenuSurfaceBase.prototype, "styleRight", void 0);
  __decorate([
    internalProperty()
  ], MenuSurfaceBase.prototype, "styleBottom", void 0);
  __decorate([
    internalProperty()
  ], MenuSurfaceBase.prototype, "styleMaxHeight", void 0);
  __decorate([
    internalProperty()
  ], MenuSurfaceBase.prototype, "styleTransformOrigin", void 0);

  // node_modules/@material/mwc-menu/mwc-menu-surface-css.js
  /**
  @license
  Copyright 2018 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var style8 = css`.mdc-menu-surface{display:none;position:absolute;box-sizing:border-box;max-width:calc(100vw - 32px);max-height:calc(100vh - 32px);margin:0;padding:0;transform:scale(1);transform-origin:top left;opacity:0;overflow:auto;will-change:transform,opacity;z-index:8;transition:opacity .03s linear,transform .12s cubic-bezier(0, 0, 0.2, 1),height 250ms cubic-bezier(0, 0, 0.2, 1);box-shadow:0px 5px 5px -3px rgba(0, 0, 0, 0.2),0px 8px 10px 1px rgba(0, 0, 0, 0.14),0px 3px 14px 2px rgba(0,0,0,.12);background-color:#fff;background-color:var(--mdc-theme-surface, #fff);color:#000;color:var(--mdc-theme-on-surface, #000);border-radius:4px;border-radius:var(--mdc-shape-medium, 4px);transform-origin-left:top left;transform-origin-right:top right}.mdc-menu-surface:focus{outline:none}.mdc-menu-surface--open{display:inline-block;transform:scale(1);opacity:1}.mdc-menu-surface--animating-open{display:inline-block;transform:scale(0.8);opacity:0}.mdc-menu-surface--animating-closed{display:inline-block;opacity:0;transition:opacity .075s linear}[dir=rtl] .mdc-menu-surface,.mdc-menu-surface[dir=rtl]{transform-origin-left:top right;transform-origin-right:top left}.mdc-menu-surface--anchor{position:relative;overflow:visible}.mdc-menu-surface--fixed{position:fixed}.mdc-menu-surface--fullwidth{width:100%}:host(:not([open])){display:none}.mdc-menu-surface{z-index:8;z-index:var(--mdc-menu-z-index, 8);max-height:calc(100vh - 32px);max-height:var(--mdc-menu-max-height, calc(100vh - 32px))}`;

  // node_modules/@material/mwc-menu/mwc-menu-surface.js
  /**
  @license
  Copyright 2020 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var MenuSurface = class MenuSurface2 extends MenuSurfaceBase {
  };
  MenuSurface.styles = style8;
  MenuSurface = __decorate([
    customElement("mwc-menu-surface")
  ], MenuSurface);

  // node_modules/@material/menu/constants.js
  /**
   * @license
   * Copyright 2018 Google Inc.
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in
   * all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   * THE SOFTWARE.
   */
  var cssClasses5 = {
    MENU_SELECTED_LIST_ITEM: "mdc-menu-item--selected",
    MENU_SELECTION_GROUP: "mdc-menu__selection-group",
    ROOT: "mdc-menu"
  };
  var strings5 = {
    ARIA_CHECKED_ATTR: "aria-checked",
    ARIA_DISABLED_ATTR: "aria-disabled",
    CHECKBOX_SELECTOR: 'input[type="checkbox"]',
    LIST_SELECTOR: ".mdc-list",
    SELECTED_EVENT: "MDCMenu:selected"
  };
  var numbers5 = {
    FOCUS_ROOT_INDEX: -1
  };
  var DefaultFocusState;
  (function(DefaultFocusState2) {
    DefaultFocusState2[DefaultFocusState2["NONE"] = 0] = "NONE";
    DefaultFocusState2[DefaultFocusState2["LIST_ROOT"] = 1] = "LIST_ROOT";
    DefaultFocusState2[DefaultFocusState2["FIRST_ITEM"] = 2] = "FIRST_ITEM";
    DefaultFocusState2[DefaultFocusState2["LAST_ITEM"] = 3] = "LAST_ITEM";
  })(DefaultFocusState || (DefaultFocusState = {}));

  // node_modules/@material/menu/node_modules/tslib/tslib.es6.js
  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation.
  
  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.
  
  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** */
  var extendStatics4 = function(d, b) {
    extendStatics4 = Object.setPrototypeOf || {__proto__: []} instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2)
        if (b2.hasOwnProperty(p))
          d2[p] = b2[p];
    };
    return extendStatics4(d, b);
  };
  function __extends4(d, b) {
    extendStatics4(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }
  var __assign4 = function() {
    __assign4 = Object.assign || function __assign10(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s)
          if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
      }
      return t;
    };
    return __assign4.apply(this, arguments);
  };

  // node_modules/@material/menu/foundation.js
  /**
   * @license
   * Copyright 2018 Google Inc.
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in
   * all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   * THE SOFTWARE.
   */
  var MDCMenuFoundation = function(_super) {
    __extends4(MDCMenuFoundation2, _super);
    function MDCMenuFoundation2(adapter) {
      var _this = _super.call(this, __assign4(__assign4({}, MDCMenuFoundation2.defaultAdapter), adapter)) || this;
      _this.closeAnimationEndTimerId_ = 0;
      _this.defaultFocusState_ = DefaultFocusState.LIST_ROOT;
      return _this;
    }
    Object.defineProperty(MDCMenuFoundation2, "cssClasses", {
      get: function() {
        return cssClasses5;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(MDCMenuFoundation2, "strings", {
      get: function() {
        return strings5;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(MDCMenuFoundation2, "numbers", {
      get: function() {
        return numbers5;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(MDCMenuFoundation2, "defaultAdapter", {
      get: function() {
        return {
          addClassToElementAtIndex: function() {
            return void 0;
          },
          removeClassFromElementAtIndex: function() {
            return void 0;
          },
          addAttributeToElementAtIndex: function() {
            return void 0;
          },
          removeAttributeFromElementAtIndex: function() {
            return void 0;
          },
          elementContainsClass: function() {
            return false;
          },
          closeSurface: function() {
            return void 0;
          },
          getElementIndex: function() {
            return -1;
          },
          notifySelected: function() {
            return void 0;
          },
          getMenuItemCount: function() {
            return 0;
          },
          focusItemAtIndex: function() {
            return void 0;
          },
          focusListRoot: function() {
            return void 0;
          },
          getSelectedSiblingOfItemAtIndex: function() {
            return -1;
          },
          isSelectableItemAtIndex: function() {
            return false;
          }
        };
      },
      enumerable: true,
      configurable: true
    });
    MDCMenuFoundation2.prototype.destroy = function() {
      if (this.closeAnimationEndTimerId_) {
        clearTimeout(this.closeAnimationEndTimerId_);
      }
      this.adapter.closeSurface();
    };
    MDCMenuFoundation2.prototype.handleKeydown = function(evt) {
      var key = evt.key, keyCode = evt.keyCode;
      var isTab = key === "Tab" || keyCode === 9;
      if (isTab) {
        this.adapter.closeSurface(true);
      }
    };
    MDCMenuFoundation2.prototype.handleItemAction = function(listItem) {
      var _this = this;
      var index = this.adapter.getElementIndex(listItem);
      if (index < 0) {
        return;
      }
      this.adapter.notifySelected({index});
      this.adapter.closeSurface();
      this.closeAnimationEndTimerId_ = setTimeout(function() {
        var recomputedIndex = _this.adapter.getElementIndex(listItem);
        if (recomputedIndex >= 0 && _this.adapter.isSelectableItemAtIndex(recomputedIndex)) {
          _this.setSelectedIndex(recomputedIndex);
        }
      }, MDCMenuSurfaceFoundation.numbers.TRANSITION_CLOSE_DURATION);
    };
    MDCMenuFoundation2.prototype.handleMenuSurfaceOpened = function() {
      switch (this.defaultFocusState_) {
        case DefaultFocusState.FIRST_ITEM:
          this.adapter.focusItemAtIndex(0);
          break;
        case DefaultFocusState.LAST_ITEM:
          this.adapter.focusItemAtIndex(this.adapter.getMenuItemCount() - 1);
          break;
        case DefaultFocusState.NONE:
          break;
        default:
          this.adapter.focusListRoot();
          break;
      }
    };
    MDCMenuFoundation2.prototype.setDefaultFocusState = function(focusState) {
      this.defaultFocusState_ = focusState;
    };
    MDCMenuFoundation2.prototype.setSelectedIndex = function(index) {
      this.validatedIndex_(index);
      if (!this.adapter.isSelectableItemAtIndex(index)) {
        throw new Error("MDCMenuFoundation: No selection group at specified index.");
      }
      var prevSelectedIndex = this.adapter.getSelectedSiblingOfItemAtIndex(index);
      if (prevSelectedIndex >= 0) {
        this.adapter.removeAttributeFromElementAtIndex(prevSelectedIndex, strings5.ARIA_CHECKED_ATTR);
        this.adapter.removeClassFromElementAtIndex(prevSelectedIndex, cssClasses5.MENU_SELECTED_LIST_ITEM);
      }
      this.adapter.addClassToElementAtIndex(index, cssClasses5.MENU_SELECTED_LIST_ITEM);
      this.adapter.addAttributeToElementAtIndex(index, strings5.ARIA_CHECKED_ATTR, "true");
    };
    MDCMenuFoundation2.prototype.setEnabled = function(index, isEnabled) {
      this.validatedIndex_(index);
      if (isEnabled) {
        this.adapter.removeClassFromElementAtIndex(index, cssClasses3.LIST_ITEM_DISABLED_CLASS);
        this.adapter.addAttributeToElementAtIndex(index, strings5.ARIA_DISABLED_ATTR, "false");
      } else {
        this.adapter.addClassToElementAtIndex(index, cssClasses3.LIST_ITEM_DISABLED_CLASS);
        this.adapter.addAttributeToElementAtIndex(index, strings5.ARIA_DISABLED_ATTR, "true");
      }
    };
    MDCMenuFoundation2.prototype.validatedIndex_ = function(index) {
      var menuSize = this.adapter.getMenuItemCount();
      var isIndexInRange = index >= 0 && index < menuSize;
      if (!isIndexInRange) {
        throw new Error("MDCMenuFoundation: No list item at specified index.");
      }
    };
    return MDCMenuFoundation2;
  }(MDCFoundation);
  var foundation_default3 = MDCMenuFoundation;

  // node_modules/@material/mwc-menu/mwc-menu-base.js
  /**
  @license
  Copyright 2020 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var MenuBase = class extends BaseElement {
    constructor() {
      super(...arguments);
      this.mdcFoundationClass = foundation_default3;
      this.listElement_ = null;
      this.anchor = null;
      this.open = false;
      this.quick = false;
      this.wrapFocus = false;
      this.innerRole = "menu";
      this.corner = "TOP_START";
      this.x = null;
      this.y = null;
      this.absolute = false;
      this.multi = false;
      this.activatable = false;
      this.fixed = false;
      this.forceGroupSelection = false;
      this.fullwidth = false;
      this.menuCorner = "START";
      this.defaultFocus = "LIST_ROOT";
      this._listUpdateComplete = null;
    }
    get listElement() {
      if (!this.listElement_) {
        this.listElement_ = this.renderRoot.querySelector("mwc-list");
        return this.listElement_;
      }
      return this.listElement_;
    }
    get items() {
      const listElement = this.listElement;
      if (listElement) {
        return listElement.items;
      }
      return [];
    }
    get index() {
      const listElement = this.listElement;
      if (listElement) {
        return listElement.index;
      }
      return -1;
    }
    get selected() {
      const listElement = this.listElement;
      if (listElement) {
        return listElement.selected;
      }
      return null;
    }
    render() {
      const itemRoles = this.innerRole === "menu" ? "menuitem" : "option";
      return html`
      <mwc-menu-surface
          ?hidden=${!this.open}
          .anchor=${this.anchor}
          .open=${this.open}
          .quick=${this.quick}
          .corner=${this.corner}
          .x=${this.x}
          .y=${this.y}
          .absolute=${this.absolute}
          .fixed=${this.fixed}
          .fullwidth=${this.fullwidth}
          .menuCorner=${this.menuCorner}
          class="mdc-menu mdc-menu-surface"
          @closed=${this.onClosed}
          @opened=${this.onOpened}
          @keydown=${this.onKeydown}>
        <mwc-list
          rootTabbable
          .innerRole=${this.innerRole}
          .multi=${this.multi}
          class="mdc-list"
          .itemRoles=${itemRoles}
          .wrapFocus=${this.wrapFocus}
          .activatable=${this.activatable}
          @action=${this.onAction}>
        <slot></slot>
      </mwc-list>
    </mwc-menu-surface>`;
    }
    createAdapter() {
      return {
        addClassToElementAtIndex: (index, className) => {
          const listElement = this.listElement;
          if (!listElement) {
            return;
          }
          const element = listElement.items[index];
          if (!element) {
            return;
          }
          if (className === "mdc-menu-item--selected") {
            if (this.forceGroupSelection && !element.selected) {
              listElement.toggle(index, true);
            }
          } else {
            element.classList.add(className);
          }
        },
        removeClassFromElementAtIndex: (index, className) => {
          const listElement = this.listElement;
          if (!listElement) {
            return;
          }
          const element = listElement.items[index];
          if (!element) {
            return;
          }
          if (className === "mdc-menu-item--selected") {
            if (element.selected) {
              listElement.toggle(index, false);
            }
          } else {
            element.classList.remove(className);
          }
        },
        addAttributeToElementAtIndex: (index, attr, value) => {
          const listElement = this.listElement;
          if (!listElement) {
            return;
          }
          const element = listElement.items[index];
          if (!element) {
            return;
          }
          element.setAttribute(attr, value);
        },
        removeAttributeFromElementAtIndex: (index, attr) => {
          const listElement = this.listElement;
          if (!listElement) {
            return;
          }
          const element = listElement.items[index];
          if (!element) {
            return;
          }
          element.removeAttribute(attr);
        },
        elementContainsClass: (element, className) => element.classList.contains(className),
        closeSurface: () => {
          this.open = false;
        },
        getElementIndex: (element) => {
          const listElement = this.listElement;
          if (listElement) {
            return listElement.items.indexOf(element);
          }
          return -1;
        },
        notifySelected: () => {
        },
        getMenuItemCount: () => {
          const listElement = this.listElement;
          if (!listElement) {
            return 0;
          }
          return listElement.items.length;
        },
        focusItemAtIndex: (index) => {
          const listElement = this.listElement;
          if (!listElement) {
            return;
          }
          const element = listElement.items[index];
          if (element) {
            element.focus();
          }
        },
        focusListRoot: () => {
          if (this.listElement) {
            this.listElement.focus();
          }
        },
        getSelectedSiblingOfItemAtIndex: (index) => {
          const listElement = this.listElement;
          if (!listElement) {
            return -1;
          }
          const elementAtIndex = listElement.items[index];
          if (!elementAtIndex || !elementAtIndex.group) {
            return -1;
          }
          for (let i = 0; i < listElement.items.length; i++) {
            if (i === index) {
              continue;
            }
            const current = listElement.items[i];
            if (current.selected && current.group === elementAtIndex.group) {
              return i;
            }
          }
          return -1;
        },
        isSelectableItemAtIndex: (index) => {
          const listElement = this.listElement;
          if (!listElement) {
            return false;
          }
          const elementAtIndex = listElement.items[index];
          if (!elementAtIndex) {
            return false;
          }
          return elementAtIndex.hasAttribute("group");
        }
      };
    }
    onKeydown(evt) {
      if (this.mdcFoundation) {
        this.mdcFoundation.handleKeydown(evt);
      }
    }
    onAction(evt) {
      const listElement = this.listElement;
      if (this.mdcFoundation && listElement) {
        const index = evt.detail.index;
        const el = listElement.items[index];
        if (el) {
          this.mdcFoundation.handleItemAction(el);
        }
      }
    }
    onOpened() {
      this.open = true;
      if (this.mdcFoundation) {
        this.mdcFoundation.handleMenuSurfaceOpened();
      }
    }
    onClosed() {
      this.open = false;
    }
    async _getUpdateComplete() {
      await this._listUpdateComplete;
      await super._getUpdateComplete();
    }
    async firstUpdated() {
      super.firstUpdated();
      const listElement = this.listElement;
      if (listElement) {
        this._listUpdateComplete = listElement.updateComplete;
        await this._listUpdateComplete;
      }
    }
    select(index) {
      const listElement = this.listElement;
      if (listElement) {
        listElement.select(index);
      }
    }
    close() {
      this.open = false;
    }
    show() {
      this.open = true;
    }
    getFocusedItemIndex() {
      const listElement = this.listElement;
      if (listElement) {
        return listElement.getFocusedItemIndex();
      }
      return -1;
    }
    focusItemAtIndex(index) {
      const listElement = this.listElement;
      if (listElement) {
        listElement.focusItemAtIndex(index);
      }
    }
    layout(updateItems = true) {
      const listElement = this.listElement;
      if (listElement) {
        listElement.layout(updateItems);
      }
    }
  };
  __decorate([
    query(".mdc-menu")
  ], MenuBase.prototype, "mdcRoot", void 0);
  __decorate([
    query("slot")
  ], MenuBase.prototype, "slotElement", void 0);
  __decorate([
    property({type: Object})
  ], MenuBase.prototype, "anchor", void 0);
  __decorate([
    property({type: Boolean, reflect: true})
  ], MenuBase.prototype, "open", void 0);
  __decorate([
    property({type: Boolean})
  ], MenuBase.prototype, "quick", void 0);
  __decorate([
    property({type: Boolean})
  ], MenuBase.prototype, "wrapFocus", void 0);
  __decorate([
    property({type: String})
  ], MenuBase.prototype, "innerRole", void 0);
  __decorate([
    property({type: String})
  ], MenuBase.prototype, "corner", void 0);
  __decorate([
    property({type: Number})
  ], MenuBase.prototype, "x", void 0);
  __decorate([
    property({type: Number})
  ], MenuBase.prototype, "y", void 0);
  __decorate([
    property({type: Boolean})
  ], MenuBase.prototype, "absolute", void 0);
  __decorate([
    property({type: Boolean})
  ], MenuBase.prototype, "multi", void 0);
  __decorate([
    property({type: Boolean})
  ], MenuBase.prototype, "activatable", void 0);
  __decorate([
    property({type: Boolean})
  ], MenuBase.prototype, "fixed", void 0);
  __decorate([
    property({type: Boolean})
  ], MenuBase.prototype, "forceGroupSelection", void 0);
  __decorate([
    property({type: Boolean})
  ], MenuBase.prototype, "fullwidth", void 0);
  __decorate([
    property({type: String})
  ], MenuBase.prototype, "menuCorner", void 0);
  __decorate([
    property({type: String}),
    observer(function(value) {
      if (this.mdcFoundation) {
        this.mdcFoundation.setDefaultFocusState(DefaultFocusState[value]);
      }
    })
  ], MenuBase.prototype, "defaultFocus", void 0);

  // node_modules/@material/mwc-menu/mwc-menu-css.js
  /**
  @license
  Copyright 2018 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var style9 = css`mwc-list ::slotted([mwc-list-item]:not([twoline])){height:var(--mdc-menu-item-height, 48px)}mwc-list{max-width:var(--mdc-menu-max-width, auto);min-width:var(--mdc-menu-min-width, auto)}`;

  // node_modules/@material/mwc-menu/mwc-menu.js
  /**
  @license
  Copyright 2020 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var Menu = class Menu2 extends MenuBase {
  };
  Menu.styles = style9;
  Menu = __decorate([
    customElement("mwc-menu")
  ], Menu);

  // node_modules/@material/list/events.js
  /**
   * @license
   * Copyright 2020 Google Inc.
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in
   * all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   * THE SOFTWARE.
   */
  var ELEMENTS_KEY_ALLOWED_IN2 = ["input", "button", "textarea", "select"];
  var preventDefaultEvent = function(evt) {
    var target = evt.target;
    if (!target) {
      return;
    }
    var tagName = ("" + target.tagName).toLowerCase();
    if (ELEMENTS_KEY_ALLOWED_IN2.indexOf(tagName) === -1) {
      evt.preventDefault();
    }
  };

  // node_modules/@material/list/typeahead.js
  /**
   * @license
   * Copyright 2020 Google Inc.
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in
   * all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   * THE SOFTWARE.
   */
  function initState() {
    var state = {
      bufferClearTimeout: 0,
      currentFirstChar: "",
      sortedIndexCursor: 0,
      typeaheadBuffer: ""
    };
    return state;
  }
  function initSortedIndex(listItemCount, getPrimaryTextByItemIndex) {
    var sortedIndexByFirstChar = new Map();
    for (var i = 0; i < listItemCount; i++) {
      var primaryText = getPrimaryTextByItemIndex(i).trim();
      if (!primaryText) {
        continue;
      }
      var firstChar = primaryText[0].toLowerCase();
      if (!sortedIndexByFirstChar.has(firstChar)) {
        sortedIndexByFirstChar.set(firstChar, []);
      }
      sortedIndexByFirstChar.get(firstChar).push({text: primaryText.toLowerCase(), index: i});
    }
    sortedIndexByFirstChar.forEach(function(values) {
      values.sort(function(first, second) {
        return first.index - second.index;
      });
    });
    return sortedIndexByFirstChar;
  }
  function matchItem(opts, state) {
    var nextChar = opts.nextChar, focusItemAtIndex = opts.focusItemAtIndex, sortedIndexByFirstChar = opts.sortedIndexByFirstChar, focusedItemIndex = opts.focusedItemIndex, skipFocus = opts.skipFocus, isItemAtIndexDisabled = opts.isItemAtIndexDisabled;
    clearTimeout(state.bufferClearTimeout);
    state.bufferClearTimeout = setTimeout(function() {
      clearBuffer(state);
    }, numbers3.TYPEAHEAD_BUFFER_CLEAR_TIMEOUT_MS);
    state.typeaheadBuffer = state.typeaheadBuffer + nextChar;
    var index;
    if (state.typeaheadBuffer.length === 1) {
      index = matchFirstChar(sortedIndexByFirstChar, focusedItemIndex, isItemAtIndexDisabled, state);
    } else {
      index = matchAllChars(sortedIndexByFirstChar, isItemAtIndexDisabled, state);
    }
    if (index !== -1 && !skipFocus) {
      focusItemAtIndex(index);
    }
    return index;
  }
  function matchFirstChar(sortedIndexByFirstChar, focusedItemIndex, isItemAtIndexDisabled, state) {
    var firstChar = state.typeaheadBuffer[0];
    var itemsMatchingFirstChar = sortedIndexByFirstChar.get(firstChar);
    if (!itemsMatchingFirstChar) {
      return -1;
    }
    if (firstChar === state.currentFirstChar && itemsMatchingFirstChar[state.sortedIndexCursor].index === focusedItemIndex) {
      state.sortedIndexCursor = (state.sortedIndexCursor + 1) % itemsMatchingFirstChar.length;
      var newIndex = itemsMatchingFirstChar[state.sortedIndexCursor].index;
      if (!isItemAtIndexDisabled(newIndex)) {
        return newIndex;
      }
    }
    state.currentFirstChar = firstChar;
    var newCursorPosition = -1;
    var cursorPosition;
    for (cursorPosition = 0; cursorPosition < itemsMatchingFirstChar.length; cursorPosition++) {
      if (!isItemAtIndexDisabled(itemsMatchingFirstChar[cursorPosition].index)) {
        newCursorPosition = cursorPosition;
        break;
      }
    }
    for (; cursorPosition < itemsMatchingFirstChar.length; cursorPosition++) {
      if (itemsMatchingFirstChar[cursorPosition].index > focusedItemIndex && !isItemAtIndexDisabled(itemsMatchingFirstChar[cursorPosition].index)) {
        newCursorPosition = cursorPosition;
        break;
      }
    }
    if (newCursorPosition !== -1) {
      state.sortedIndexCursor = newCursorPosition;
      return itemsMatchingFirstChar[state.sortedIndexCursor].index;
    }
    return -1;
  }
  function matchAllChars(sortedIndexByFirstChar, isItemAtIndexDisabled, state) {
    var firstChar = state.typeaheadBuffer[0];
    var itemsMatchingFirstChar = sortedIndexByFirstChar.get(firstChar);
    if (!itemsMatchingFirstChar) {
      return -1;
    }
    var startingItem = itemsMatchingFirstChar[state.sortedIndexCursor];
    if (startingItem.text.lastIndexOf(state.typeaheadBuffer, 0) === 0 && !isItemAtIndexDisabled(startingItem.index)) {
      return startingItem.index;
    }
    var cursorPosition = (state.sortedIndexCursor + 1) % itemsMatchingFirstChar.length;
    var nextCursorPosition = -1;
    while (cursorPosition !== state.sortedIndexCursor) {
      var currentItem = itemsMatchingFirstChar[cursorPosition];
      var matches2 = currentItem.text.lastIndexOf(state.typeaheadBuffer, 0) === 0;
      var isEnabled = !isItemAtIndexDisabled(currentItem.index);
      if (matches2 && isEnabled) {
        nextCursorPosition = cursorPosition;
        break;
      }
      cursorPosition = (cursorPosition + 1) % itemsMatchingFirstChar.length;
    }
    if (nextCursorPosition !== -1) {
      state.sortedIndexCursor = nextCursorPosition;
      return itemsMatchingFirstChar[state.sortedIndexCursor].index;
    }
    return -1;
  }
  function isTypingInProgress(state) {
    return state.typeaheadBuffer.length > 0;
  }
  function clearBuffer(state) {
    state.typeaheadBuffer = "";
  }
  function handleKeydown(opts, state) {
    var event = opts.event, isTargetListItem = opts.isTargetListItem, focusedItemIndex = opts.focusedItemIndex, focusItemAtIndex = opts.focusItemAtIndex, sortedIndexByFirstChar = opts.sortedIndexByFirstChar, isItemAtIndexDisabled = opts.isItemAtIndexDisabled;
    var isArrowLeft = normalizeKey(event) === "ArrowLeft";
    var isArrowUp = normalizeKey(event) === "ArrowUp";
    var isArrowRight = normalizeKey(event) === "ArrowRight";
    var isArrowDown = normalizeKey(event) === "ArrowDown";
    var isHome = normalizeKey(event) === "Home";
    var isEnd = normalizeKey(event) === "End";
    var isEnter = normalizeKey(event) === "Enter";
    var isSpace = normalizeKey(event) === "Spacebar";
    if (isArrowLeft || isArrowUp || isArrowRight || isArrowDown || isHome || isEnd || isEnter) {
      return -1;
    }
    var isCharacterKey = !isSpace && event.key.length === 1;
    if (isCharacterKey) {
      preventDefaultEvent(event);
      var matchItemOpts = {
        focusItemAtIndex,
        focusedItemIndex,
        nextChar: event.key.toLowerCase(),
        sortedIndexByFirstChar,
        skipFocus: false,
        isItemAtIndexDisabled
      };
      return matchItem(matchItemOpts, state);
    }
    if (!isSpace) {
      return -1;
    }
    if (isTargetListItem) {
      preventDefaultEvent(event);
    }
    var typeaheadOnListItem = isTargetListItem && isTypingInProgress(state);
    if (typeaheadOnListItem) {
      var matchItemOpts = {
        focusItemAtIndex,
        focusedItemIndex,
        nextChar: " ",
        sortedIndexByFirstChar,
        skipFocus: false,
        isItemAtIndexDisabled
      };
      return matchItem(matchItemOpts, state);
    }
    return -1;
  }

  // node_modules/@material/mwc-base/form-element.js
  /**
  @license
  Copyright 2018 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var FormElement = class extends BaseElement {
    createRenderRoot() {
      return this.attachShadow({mode: "open", delegatesFocus: true});
    }
    click() {
      if (this.formElement) {
        this.formElement.focus();
        this.formElement.click();
      }
    }
    setAriaLabel(label) {
      if (this.formElement) {
        this.formElement.setAttribute("aria-label", label);
      }
    }
    firstUpdated() {
      super.firstUpdated();
      this.mdcRoot.addEventListener("change", (e) => {
        this.dispatchEvent(new Event("change", e));
      });
    }
  };

  // node_modules/@material/floating-label/node_modules/tslib/tslib.es6.js
  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation.
  
  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.
  
  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** */
  var extendStatics5 = function(d, b) {
    extendStatics5 = Object.setPrototypeOf || {__proto__: []} instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2)
        if (b2.hasOwnProperty(p))
          d2[p] = b2[p];
    };
    return extendStatics5(d, b);
  };
  function __extends5(d, b) {
    extendStatics5(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }
  var __assign5 = function() {
    __assign5 = Object.assign || function __assign10(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s)
          if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
      }
      return t;
    };
    return __assign5.apply(this, arguments);
  };

  // node_modules/@material/floating-label/constants.js
  /**
   * @license
   * Copyright 2016 Google Inc.
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in
   * all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   * THE SOFTWARE.
   */
  var cssClasses6 = {
    LABEL_FLOAT_ABOVE: "mdc-floating-label--float-above",
    LABEL_REQUIRED: "mdc-floating-label--required",
    LABEL_SHAKE: "mdc-floating-label--shake",
    ROOT: "mdc-floating-label"
  };

  // node_modules/@material/floating-label/foundation.js
  /**
   * @license
   * Copyright 2016 Google Inc.
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in
   * all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   * THE SOFTWARE.
   */
  var MDCFloatingLabelFoundation = function(_super) {
    __extends5(MDCFloatingLabelFoundation2, _super);
    function MDCFloatingLabelFoundation2(adapter) {
      var _this = _super.call(this, __assign5(__assign5({}, MDCFloatingLabelFoundation2.defaultAdapter), adapter)) || this;
      _this.shakeAnimationEndHandler_ = function() {
        return _this.handleShakeAnimationEnd_();
      };
      return _this;
    }
    Object.defineProperty(MDCFloatingLabelFoundation2, "cssClasses", {
      get: function() {
        return cssClasses6;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(MDCFloatingLabelFoundation2, "defaultAdapter", {
      get: function() {
        return {
          addClass: function() {
            return void 0;
          },
          removeClass: function() {
            return void 0;
          },
          getWidth: function() {
            return 0;
          },
          registerInteractionHandler: function() {
            return void 0;
          },
          deregisterInteractionHandler: function() {
            return void 0;
          }
        };
      },
      enumerable: true,
      configurable: true
    });
    MDCFloatingLabelFoundation2.prototype.init = function() {
      this.adapter.registerInteractionHandler("animationend", this.shakeAnimationEndHandler_);
    };
    MDCFloatingLabelFoundation2.prototype.destroy = function() {
      this.adapter.deregisterInteractionHandler("animationend", this.shakeAnimationEndHandler_);
    };
    MDCFloatingLabelFoundation2.prototype.getWidth = function() {
      return this.adapter.getWidth();
    };
    MDCFloatingLabelFoundation2.prototype.shake = function(shouldShake) {
      var LABEL_SHAKE = MDCFloatingLabelFoundation2.cssClasses.LABEL_SHAKE;
      if (shouldShake) {
        this.adapter.addClass(LABEL_SHAKE);
      } else {
        this.adapter.removeClass(LABEL_SHAKE);
      }
    };
    MDCFloatingLabelFoundation2.prototype.float = function(shouldFloat) {
      var _a2 = MDCFloatingLabelFoundation2.cssClasses, LABEL_FLOAT_ABOVE = _a2.LABEL_FLOAT_ABOVE, LABEL_SHAKE = _a2.LABEL_SHAKE;
      if (shouldFloat) {
        this.adapter.addClass(LABEL_FLOAT_ABOVE);
      } else {
        this.adapter.removeClass(LABEL_FLOAT_ABOVE);
        this.adapter.removeClass(LABEL_SHAKE);
      }
    };
    MDCFloatingLabelFoundation2.prototype.setRequired = function(isRequired) {
      var LABEL_REQUIRED = MDCFloatingLabelFoundation2.cssClasses.LABEL_REQUIRED;
      if (isRequired) {
        this.adapter.addClass(LABEL_REQUIRED);
      } else {
        this.adapter.removeClass(LABEL_REQUIRED);
      }
    };
    MDCFloatingLabelFoundation2.prototype.handleShakeAnimationEnd_ = function() {
      var LABEL_SHAKE = MDCFloatingLabelFoundation2.cssClasses.LABEL_SHAKE;
      this.adapter.removeClass(LABEL_SHAKE);
    };
    return MDCFloatingLabelFoundation2;
  }(MDCFoundation);

  // node_modules/@material/mwc-floating-label/mwc-floating-label-directive.js
  var createAdapter = (labelElement) => {
    return {
      addClass: (className) => labelElement.classList.add(className),
      removeClass: (className) => labelElement.classList.remove(className),
      getWidth: () => labelElement.scrollWidth,
      registerInteractionHandler: (evtType, handler) => {
        labelElement.addEventListener(evtType, handler);
      },
      deregisterInteractionHandler: (evtType, handler) => {
        labelElement.removeEventListener(evtType, handler);
      }
    };
  };
  var partToFoundationMap = new WeakMap();
  var floatingLabel = directive((label) => (part) => {
    const lastFoundation = partToFoundationMap.get(part);
    if (!lastFoundation) {
      const labelElement = part.committer.element;
      labelElement.classList.add("mdc-floating-label");
      const adapter = createAdapter(labelElement);
      const foundation = new MDCFloatingLabelFoundation(adapter);
      foundation.init();
      part.setValue(foundation);
      partToFoundationMap.set(part, {label, foundation});
    }
  });

  // node_modules/@material/line-ripple/node_modules/tslib/tslib.es6.js
  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation.
  
  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.
  
  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** */
  var extendStatics6 = function(d, b) {
    extendStatics6 = Object.setPrototypeOf || {__proto__: []} instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2)
        if (b2.hasOwnProperty(p))
          d2[p] = b2[p];
    };
    return extendStatics6(d, b);
  };
  function __extends6(d, b) {
    extendStatics6(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }
  var __assign6 = function() {
    __assign6 = Object.assign || function __assign10(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s)
          if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
      }
      return t;
    };
    return __assign6.apply(this, arguments);
  };

  // node_modules/@material/line-ripple/constants.js
  /**
   * @license
   * Copyright 2018 Google Inc.
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in
   * all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   * THE SOFTWARE.
   */
  var cssClasses7 = {
    LINE_RIPPLE_ACTIVE: "mdc-line-ripple--active",
    LINE_RIPPLE_DEACTIVATING: "mdc-line-ripple--deactivating"
  };

  // node_modules/@material/line-ripple/foundation.js
  /**
   * @license
   * Copyright 2018 Google Inc.
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in
   * all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   * THE SOFTWARE.
   */
  var MDCLineRippleFoundation = function(_super) {
    __extends6(MDCLineRippleFoundation2, _super);
    function MDCLineRippleFoundation2(adapter) {
      var _this = _super.call(this, __assign6(__assign6({}, MDCLineRippleFoundation2.defaultAdapter), adapter)) || this;
      _this.transitionEndHandler_ = function(evt) {
        return _this.handleTransitionEnd(evt);
      };
      return _this;
    }
    Object.defineProperty(MDCLineRippleFoundation2, "cssClasses", {
      get: function() {
        return cssClasses7;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(MDCLineRippleFoundation2, "defaultAdapter", {
      get: function() {
        return {
          addClass: function() {
            return void 0;
          },
          removeClass: function() {
            return void 0;
          },
          hasClass: function() {
            return false;
          },
          setStyle: function() {
            return void 0;
          },
          registerEventHandler: function() {
            return void 0;
          },
          deregisterEventHandler: function() {
            return void 0;
          }
        };
      },
      enumerable: true,
      configurable: true
    });
    MDCLineRippleFoundation2.prototype.init = function() {
      this.adapter.registerEventHandler("transitionend", this.transitionEndHandler_);
    };
    MDCLineRippleFoundation2.prototype.destroy = function() {
      this.adapter.deregisterEventHandler("transitionend", this.transitionEndHandler_);
    };
    MDCLineRippleFoundation2.prototype.activate = function() {
      this.adapter.removeClass(cssClasses7.LINE_RIPPLE_DEACTIVATING);
      this.adapter.addClass(cssClasses7.LINE_RIPPLE_ACTIVE);
    };
    MDCLineRippleFoundation2.prototype.setRippleCenter = function(xCoordinate) {
      this.adapter.setStyle("transform-origin", xCoordinate + "px center");
    };
    MDCLineRippleFoundation2.prototype.deactivate = function() {
      this.adapter.addClass(cssClasses7.LINE_RIPPLE_DEACTIVATING);
    };
    MDCLineRippleFoundation2.prototype.handleTransitionEnd = function(evt) {
      var isDeactivating = this.adapter.hasClass(cssClasses7.LINE_RIPPLE_DEACTIVATING);
      if (evt.propertyName === "opacity") {
        if (isDeactivating) {
          this.adapter.removeClass(cssClasses7.LINE_RIPPLE_ACTIVE);
          this.adapter.removeClass(cssClasses7.LINE_RIPPLE_DEACTIVATING);
        }
      }
    };
    return MDCLineRippleFoundation2;
  }(MDCFoundation);

  // node_modules/@material/mwc-line-ripple/mwc-line-ripple-directive.js
  var createAdapter2 = (lineElement) => {
    return {
      addClass: (className) => lineElement.classList.add(className),
      removeClass: (className) => lineElement.classList.remove(className),
      hasClass: (className) => lineElement.classList.contains(className),
      setStyle: (propertyName, value) => lineElement.style.setProperty(propertyName, value),
      registerEventHandler: (evtType, handler) => {
        lineElement.addEventListener(evtType, handler);
      },
      deregisterEventHandler: (evtType, handler) => {
        lineElement.removeEventListener(evtType, handler);
      }
    };
  };
  var partToFoundationMap2 = new WeakMap();
  var lineRipple = directive(() => (part) => {
    const lastFoundation = partToFoundationMap2.get(part);
    if (!lastFoundation) {
      const lineElement = part.committer.element;
      lineElement.classList.add("mdc-line-ripple");
      const adapter = createAdapter2(lineElement);
      const foundation = new MDCLineRippleFoundation(adapter);
      foundation.init();
      part.setValue(foundation);
      partToFoundationMap2.set(part, foundation);
    }
  });

  // node_modules/@material/select/node_modules/tslib/tslib.es6.js
  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation.
  
  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.
  
  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** */
  var extendStatics7 = function(d, b) {
    extendStatics7 = Object.setPrototypeOf || {__proto__: []} instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2)
        if (b2.hasOwnProperty(p))
          d2[p] = b2[p];
    };
    return extendStatics7(d, b);
  };
  function __extends7(d, b) {
    extendStatics7(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }
  var __assign7 = function() {
    __assign7 = Object.assign || function __assign10(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s)
          if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
      }
      return t;
    };
    return __assign7.apply(this, arguments);
  };

  // node_modules/@material/select/constants.js
  /**
   * @license
   * Copyright 2016 Google Inc.
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in
   * all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   * THE SOFTWARE.
   */
  var cssClasses8 = {
    ACTIVATED: "mdc-select--activated",
    DISABLED: "mdc-select--disabled",
    FOCUSED: "mdc-select--focused",
    INVALID: "mdc-select--invalid",
    MENU_INVALID: "mdc-select__menu--invalid",
    OUTLINED: "mdc-select--outlined",
    REQUIRED: "mdc-select--required",
    ROOT: "mdc-select",
    WITH_LEADING_ICON: "mdc-select--with-leading-icon"
  };
  var strings6 = {
    ARIA_CONTROLS: "aria-controls",
    ARIA_DESCRIBEDBY: "aria-describedby",
    ARIA_SELECTED_ATTR: "aria-selected",
    CHANGE_EVENT: "MDCSelect:change",
    HIDDEN_INPUT_SELECTOR: 'input[type="hidden"]',
    LABEL_SELECTOR: ".mdc-floating-label",
    LEADING_ICON_SELECTOR: ".mdc-select__icon",
    LINE_RIPPLE_SELECTOR: ".mdc-line-ripple",
    MENU_SELECTOR: ".mdc-select__menu",
    OUTLINE_SELECTOR: ".mdc-notched-outline",
    SELECTED_TEXT_SELECTOR: ".mdc-select__selected-text",
    SELECT_ANCHOR_SELECTOR: ".mdc-select__anchor",
    VALUE_ATTR: "data-value"
  };
  var numbers6 = {
    LABEL_SCALE: 0.75,
    UNSET_INDEX: -1,
    CLICK_DEBOUNCE_TIMEOUT_MS: 330
  };

  // node_modules/@material/select/foundation.js
  /**
   * @license
   * Copyright 2016 Google Inc.
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in
   * all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   * THE SOFTWARE.
   */
  var MDCSelectFoundation = function(_super) {
    __extends7(MDCSelectFoundation2, _super);
    function MDCSelectFoundation2(adapter, foundationMap) {
      if (foundationMap === void 0) {
        foundationMap = {};
      }
      var _this = _super.call(this, __assign7(__assign7({}, MDCSelectFoundation2.defaultAdapter), adapter)) || this;
      _this.disabled = false;
      _this.isMenuOpen = false;
      _this.useDefaultValidation = true;
      _this.customValidity = true;
      _this.lastSelectedIndex = numbers6.UNSET_INDEX;
      _this.clickDebounceTimeout = 0;
      _this.recentlyClicked = false;
      _this.leadingIcon = foundationMap.leadingIcon;
      _this.helperText = foundationMap.helperText;
      return _this;
    }
    Object.defineProperty(MDCSelectFoundation2, "cssClasses", {
      get: function() {
        return cssClasses8;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(MDCSelectFoundation2, "numbers", {
      get: function() {
        return numbers6;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(MDCSelectFoundation2, "strings", {
      get: function() {
        return strings6;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(MDCSelectFoundation2, "defaultAdapter", {
      get: function() {
        return {
          addClass: function() {
            return void 0;
          },
          removeClass: function() {
            return void 0;
          },
          hasClass: function() {
            return false;
          },
          activateBottomLine: function() {
            return void 0;
          },
          deactivateBottomLine: function() {
            return void 0;
          },
          getSelectedIndex: function() {
            return -1;
          },
          setSelectedIndex: function() {
            return void 0;
          },
          hasLabel: function() {
            return false;
          },
          floatLabel: function() {
            return void 0;
          },
          getLabelWidth: function() {
            return 0;
          },
          setLabelRequired: function() {
            return void 0;
          },
          hasOutline: function() {
            return false;
          },
          notchOutline: function() {
            return void 0;
          },
          closeOutline: function() {
            return void 0;
          },
          setRippleCenter: function() {
            return void 0;
          },
          notifyChange: function() {
            return void 0;
          },
          setSelectedText: function() {
            return void 0;
          },
          isSelectAnchorFocused: function() {
            return false;
          },
          getSelectAnchorAttr: function() {
            return "";
          },
          setSelectAnchorAttr: function() {
            return void 0;
          },
          removeSelectAnchorAttr: function() {
            return void 0;
          },
          addMenuClass: function() {
            return void 0;
          },
          removeMenuClass: function() {
            return void 0;
          },
          openMenu: function() {
            return void 0;
          },
          closeMenu: function() {
            return void 0;
          },
          getAnchorElement: function() {
            return null;
          },
          setMenuAnchorElement: function() {
            return void 0;
          },
          setMenuAnchorCorner: function() {
            return void 0;
          },
          setMenuWrapFocus: function() {
            return void 0;
          },
          focusMenuItemAtIndex: function() {
            return void 0;
          },
          getMenuItemCount: function() {
            return 0;
          },
          getMenuItemValues: function() {
            return [];
          },
          getMenuItemTextAtIndex: function() {
            return "";
          },
          isTypeaheadInProgress: function() {
            return false;
          },
          typeaheadMatchItem: function() {
            return -1;
          }
        };
      },
      enumerable: true,
      configurable: true
    });
    MDCSelectFoundation2.prototype.getSelectedIndex = function() {
      return this.adapter.getSelectedIndex();
    };
    MDCSelectFoundation2.prototype.setSelectedIndex = function(index, closeMenu, skipNotify) {
      if (closeMenu === void 0) {
        closeMenu = false;
      }
      if (skipNotify === void 0) {
        skipNotify = false;
      }
      if (index >= this.adapter.getMenuItemCount()) {
        return;
      }
      if (index === numbers6.UNSET_INDEX) {
        this.adapter.setSelectedText("");
      } else {
        this.adapter.setSelectedText(this.adapter.getMenuItemTextAtIndex(index).trim());
      }
      this.adapter.setSelectedIndex(index);
      if (closeMenu) {
        this.adapter.closeMenu();
      }
      if (!skipNotify && this.lastSelectedIndex !== index) {
        this.handleChange();
      }
      this.lastSelectedIndex = index;
    };
    MDCSelectFoundation2.prototype.setValue = function(value, skipNotify) {
      if (skipNotify === void 0) {
        skipNotify = false;
      }
      var index = this.adapter.getMenuItemValues().indexOf(value);
      this.setSelectedIndex(index, false, skipNotify);
    };
    MDCSelectFoundation2.prototype.getValue = function() {
      var index = this.adapter.getSelectedIndex();
      var menuItemValues = this.adapter.getMenuItemValues();
      return index !== numbers6.UNSET_INDEX ? menuItemValues[index] : "";
    };
    MDCSelectFoundation2.prototype.getDisabled = function() {
      return this.disabled;
    };
    MDCSelectFoundation2.prototype.setDisabled = function(isDisabled) {
      this.disabled = isDisabled;
      if (this.disabled) {
        this.adapter.addClass(cssClasses8.DISABLED);
        this.adapter.closeMenu();
      } else {
        this.adapter.removeClass(cssClasses8.DISABLED);
      }
      if (this.leadingIcon) {
        this.leadingIcon.setDisabled(this.disabled);
      }
      if (this.disabled) {
        this.adapter.removeSelectAnchorAttr("tabindex");
      } else {
        this.adapter.setSelectAnchorAttr("tabindex", "0");
      }
      this.adapter.setSelectAnchorAttr("aria-disabled", this.disabled.toString());
    };
    MDCSelectFoundation2.prototype.openMenu = function() {
      this.adapter.addClass(cssClasses8.ACTIVATED);
      this.adapter.openMenu();
      this.isMenuOpen = true;
      this.adapter.setSelectAnchorAttr("aria-expanded", "true");
    };
    MDCSelectFoundation2.prototype.setHelperTextContent = function(content) {
      if (this.helperText) {
        this.helperText.setContent(content);
      }
    };
    MDCSelectFoundation2.prototype.layout = function() {
      if (this.adapter.hasLabel()) {
        var optionHasValue = this.getValue().length > 0;
        var isFocused = this.adapter.hasClass(cssClasses8.FOCUSED);
        var shouldFloatAndNotch = optionHasValue || isFocused;
        var isRequired = this.adapter.hasClass(cssClasses8.REQUIRED);
        this.notchOutline(shouldFloatAndNotch);
        this.adapter.floatLabel(shouldFloatAndNotch);
        this.adapter.setLabelRequired(isRequired);
      }
    };
    MDCSelectFoundation2.prototype.layoutOptions = function() {
      var menuItemValues = this.adapter.getMenuItemValues();
      var selectedIndex = menuItemValues.indexOf(this.getValue());
      this.setSelectedIndex(selectedIndex, false, true);
    };
    MDCSelectFoundation2.prototype.handleMenuOpened = function() {
      if (this.adapter.getMenuItemValues().length === 0) {
        return;
      }
      var selectedIndex = this.getSelectedIndex();
      var focusItemIndex = selectedIndex >= 0 ? selectedIndex : 0;
      this.adapter.focusMenuItemAtIndex(focusItemIndex);
    };
    MDCSelectFoundation2.prototype.handleMenuClosed = function() {
      this.adapter.removeClass(cssClasses8.ACTIVATED);
      this.isMenuOpen = false;
      this.adapter.setSelectAnchorAttr("aria-expanded", "false");
      if (!this.adapter.isSelectAnchorFocused()) {
        this.blur();
      }
    };
    MDCSelectFoundation2.prototype.handleChange = function() {
      this.layout();
      this.adapter.notifyChange(this.getValue());
      var isRequired = this.adapter.hasClass(cssClasses8.REQUIRED);
      if (isRequired && this.useDefaultValidation) {
        this.setValid(this.isValid());
      }
    };
    MDCSelectFoundation2.prototype.handleMenuItemAction = function(index) {
      this.setSelectedIndex(index, true);
    };
    MDCSelectFoundation2.prototype.handleFocus = function() {
      this.adapter.addClass(cssClasses8.FOCUSED);
      this.layout();
      this.adapter.activateBottomLine();
    };
    MDCSelectFoundation2.prototype.handleBlur = function() {
      if (this.isMenuOpen) {
        return;
      }
      this.blur();
    };
    MDCSelectFoundation2.prototype.handleClick = function(normalizedX) {
      if (this.disabled || this.recentlyClicked) {
        return;
      }
      this.setClickDebounceTimeout();
      if (this.isMenuOpen) {
        this.adapter.closeMenu();
        return;
      }
      this.adapter.setRippleCenter(normalizedX);
      this.openMenu();
    };
    MDCSelectFoundation2.prototype.handleKeydown = function(event) {
      if (this.isMenuOpen || !this.adapter.hasClass(cssClasses8.FOCUSED)) {
        return;
      }
      var isEnter = normalizeKey(event) === KEY.ENTER;
      var isSpace = normalizeKey(event) === KEY.SPACEBAR;
      var arrowUp = normalizeKey(event) === KEY.ARROW_UP;
      var arrowDown = normalizeKey(event) === KEY.ARROW_DOWN;
      if (!isSpace && event.key && event.key.length === 1 || isSpace && this.adapter.isTypeaheadInProgress()) {
        var key = isSpace ? " " : event.key;
        var typeaheadNextIndex = this.adapter.typeaheadMatchItem(key, this.getSelectedIndex());
        if (typeaheadNextIndex >= 0) {
          this.setSelectedIndex(typeaheadNextIndex);
        }
        event.preventDefault();
        return;
      }
      if (!isEnter && !isSpace && !arrowUp && !arrowDown) {
        return;
      }
      if (arrowUp && this.getSelectedIndex() > 0) {
        this.setSelectedIndex(this.getSelectedIndex() - 1);
      } else if (arrowDown && this.getSelectedIndex() < this.adapter.getMenuItemCount() - 1) {
        this.setSelectedIndex(this.getSelectedIndex() + 1);
      }
      this.openMenu();
      event.preventDefault();
    };
    MDCSelectFoundation2.prototype.notchOutline = function(openNotch) {
      if (!this.adapter.hasOutline()) {
        return;
      }
      var isFocused = this.adapter.hasClass(cssClasses8.FOCUSED);
      if (openNotch) {
        var labelScale = numbers6.LABEL_SCALE;
        var labelWidth = this.adapter.getLabelWidth() * labelScale;
        this.adapter.notchOutline(labelWidth);
      } else if (!isFocused) {
        this.adapter.closeOutline();
      }
    };
    MDCSelectFoundation2.prototype.setLeadingIconAriaLabel = function(label) {
      if (this.leadingIcon) {
        this.leadingIcon.setAriaLabel(label);
      }
    };
    MDCSelectFoundation2.prototype.setLeadingIconContent = function(content) {
      if (this.leadingIcon) {
        this.leadingIcon.setContent(content);
      }
    };
    MDCSelectFoundation2.prototype.setUseDefaultValidation = function(useDefaultValidation) {
      this.useDefaultValidation = useDefaultValidation;
    };
    MDCSelectFoundation2.prototype.setValid = function(isValid) {
      if (!this.useDefaultValidation) {
        this.customValidity = isValid;
      }
      this.adapter.setSelectAnchorAttr("aria-invalid", (!isValid).toString());
      if (isValid) {
        this.adapter.removeClass(cssClasses8.INVALID);
        this.adapter.removeMenuClass(cssClasses8.MENU_INVALID);
      } else {
        this.adapter.addClass(cssClasses8.INVALID);
        this.adapter.addMenuClass(cssClasses8.MENU_INVALID);
      }
      this.syncHelperTextValidity(isValid);
    };
    MDCSelectFoundation2.prototype.isValid = function() {
      if (this.useDefaultValidation && this.adapter.hasClass(cssClasses8.REQUIRED) && !this.adapter.hasClass(cssClasses8.DISABLED)) {
        return this.getSelectedIndex() !== numbers6.UNSET_INDEX && (this.getSelectedIndex() !== 0 || Boolean(this.getValue()));
      }
      return this.customValidity;
    };
    MDCSelectFoundation2.prototype.setRequired = function(isRequired) {
      if (isRequired) {
        this.adapter.addClass(cssClasses8.REQUIRED);
      } else {
        this.adapter.removeClass(cssClasses8.REQUIRED);
      }
      this.adapter.setSelectAnchorAttr("aria-required", isRequired.toString());
      this.adapter.setLabelRequired(isRequired);
    };
    MDCSelectFoundation2.prototype.getRequired = function() {
      return this.adapter.getSelectAnchorAttr("aria-required") === "true";
    };
    MDCSelectFoundation2.prototype.init = function() {
      var anchorEl = this.adapter.getAnchorElement();
      if (anchorEl) {
        this.adapter.setMenuAnchorElement(anchorEl);
        this.adapter.setMenuAnchorCorner(Corner.BOTTOM_START);
      }
      this.adapter.setMenuWrapFocus(false);
      this.setDisabled(this.adapter.hasClass(cssClasses8.DISABLED));
      this.syncHelperTextValidity(!this.adapter.hasClass(cssClasses8.INVALID));
      this.layout();
      this.layoutOptions();
    };
    MDCSelectFoundation2.prototype.blur = function() {
      this.adapter.removeClass(cssClasses8.FOCUSED);
      this.layout();
      this.adapter.deactivateBottomLine();
      var isRequired = this.adapter.hasClass(cssClasses8.REQUIRED);
      if (isRequired && this.useDefaultValidation) {
        this.setValid(this.isValid());
      }
    };
    MDCSelectFoundation2.prototype.syncHelperTextValidity = function(isValid) {
      if (!this.helperText) {
        return;
      }
      this.helperText.setValidity(isValid);
      var helperTextVisible = this.helperText.isVisible();
      var helperTextId = this.helperText.getId();
      if (helperTextVisible && helperTextId) {
        this.adapter.setSelectAnchorAttr(strings6.ARIA_DESCRIBEDBY, helperTextId);
      } else {
        this.adapter.removeSelectAnchorAttr(strings6.ARIA_DESCRIBEDBY);
      }
    };
    MDCSelectFoundation2.prototype.setClickDebounceTimeout = function() {
      var _this = this;
      clearTimeout(this.clickDebounceTimeout);
      this.clickDebounceTimeout = setTimeout(function() {
        _this.recentlyClicked = false;
      }, numbers6.CLICK_DEBOUNCE_TIMEOUT_MS);
      this.recentlyClicked = true;
    };
    return MDCSelectFoundation2;
  }(MDCFoundation);
  var foundation_default4 = MDCSelectFoundation;

  // node_modules/@material/mwc-select/mwc-select-base.js
  /**
  @license
  Copyright 2020 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var createValidityObj = (customValidity = {}) => {
    const objectifiedCustomValidity = {};
    for (const propName in customValidity) {
      objectifiedCustomValidity[propName] = customValidity[propName];
    }
    return Object.assign({badInput: false, customError: false, patternMismatch: false, rangeOverflow: false, rangeUnderflow: false, stepMismatch: false, tooLong: false, tooShort: false, typeMismatch: false, valid: true, valueMissing: false}, objectifiedCustomValidity);
  };
  var SelectBase = class extends FormElement {
    constructor() {
      super(...arguments);
      this.mdcFoundationClass = foundation_default4;
      this.disabled = false;
      this.outlined = false;
      this.label = "";
      this.outlineOpen = false;
      this.outlineWidth = 0;
      this.value = "";
      this.selectedText = "";
      this.icon = "";
      this.menuOpen = false;
      this.helper = "";
      this.validateOnInitialRender = false;
      this.validationMessage = "";
      this.required = false;
      this.naturalMenuWidth = false;
      this.isUiValid = true;
      this.typeaheadState = initState();
      this.sortedIndexByFirstChar = new Map();
      this.menuElement_ = null;
      this.listeners = [];
      this.onBodyClickBound = () => void 0;
      this._menuUpdateComplete = null;
      this.renderReady = false;
      this.valueSetDirectly = false;
      this.validityTransform = null;
      this._validity = createValidityObj();
    }
    get items() {
      if (!this.menuElement_) {
        this.menuElement_ = this.menuElement;
      }
      if (this.menuElement_) {
        return this.menuElement_.items;
      }
      return [];
    }
    get selected() {
      const menuElement = this.menuElement;
      if (menuElement) {
        return menuElement.selected;
      }
      return null;
    }
    get index() {
      const menuElement = this.menuElement;
      if (menuElement) {
        return menuElement.index;
      }
      return -1;
    }
    get shouldRenderHelperText() {
      return !!this.helper || !!this.validationMessage;
    }
    get validity() {
      this._checkValidity(this.value);
      return this._validity;
    }
    render() {
      const classes = {
        "mdc-select--disabled": this.disabled,
        "mdc-select--no-label": !this.label,
        "mdc-select--filled": !this.outlined,
        "mdc-select--outlined": this.outlined,
        "mdc-select--with-leading-icon": !!this.icon,
        "mdc-select--required": this.required,
        "mdc-select--invalid": !this.isUiValid
      };
      const menuClasses = {
        "mdc-select__menu--invalid": !this.isUiValid
      };
      const describedby = this.shouldRenderHelperText ? "helper-text" : void 0;
      return html`
      <div
          class="mdc-select ${classMap(classes)}">
        <input
            class="formElement"
            .value=${this.value}
            hidden
            ?required=${this.required}>
        <!-- @ts-ignore -->
        <div class="mdc-select__anchor"
            aria-autocomplete="none"
            role="combobox"
            aria-expanded=${this.menuOpen}
            aria-invalid=${!this.isUiValid}
            aria-haspopup="listbox"
            aria-labelledby="label"
            aria-required=${this.required}
            aria-describedby=${ifDefined(describedby)}
            @click=${this.onClick}
            @focus=${this.onFocus}
            @blur=${this.onBlur}
            @keydown=${this.onKeydown}>
          ${this.renderRipple()}
          ${this.outlined ? this.renderOutline() : this.renderLabel()}
          ${this.renderLeadingIcon()}
          <span class="mdc-select__selected-text-container">
            <span class="mdc-select__selected-text">${this.selectedText}</span>
          </span>
          <span class="mdc-select__dropdown-icon">
            <svg
                class="mdc-select__dropdown-icon-graphic"
                viewBox="7 10 10 5"
                focusable="false">
              <polygon
                  class="mdc-select__dropdown-icon-inactive"
                  stroke="none"
                  fill-rule="evenodd"
                  points="7 10 12 15 17 10">
              </polygon>
              <polygon
                  class="mdc-select__dropdown-icon-active"
                  stroke="none"
                  fill-rule="evenodd"
                  points="7 15 12 10 17 15">
              </polygon>
            </svg>
          </span>
          ${this.renderLineRipple()}
        </div>
        <mwc-menu
            innerRole="listbox"
            wrapFocus
            class="mdc-select__menu mdc-menu mdc-menu-surface ${classMap(menuClasses)}"
            activatable
            .fullwidth=${!this.naturalMenuWidth}
            .open=${this.menuOpen}
            .anchor=${this.anchorElement}
            @selected=${this.onSelected}
            @opened=${this.onOpened}
            @closed=${this.onClosed}
            @items-updated=${this.onItemsUpdated}
            @keydown=${this.handleTypeahead}>
          <slot></slot>
        </mwc-menu>
      </div>
      ${this.renderHelperText()}`;
    }
    renderRipple() {
      if (this.outlined) {
        return nothing;
      }
      return html`
      <span class="mdc-select__ripple"></span>
    `;
    }
    renderOutline() {
      if (!this.outlined) {
        return nothing;
      }
      return html`
      <mwc-notched-outline
          .width=${this.outlineWidth}
          .open=${this.outlineOpen}
          class="mdc-notched-outline">
        ${this.renderLabel()}
      </mwc-notched-outline>`;
    }
    renderLabel() {
      if (!this.label) {
        return nothing;
      }
      return html`
      <span
          .floatingLabelFoundation=${floatingLabel(this.label)}
          id="label">${this.label}</span>
    `;
    }
    renderLeadingIcon() {
      if (!this.icon) {
        return nothing;
      }
      return html`<mwc-icon class="mdc-select__icon"><div>${this.icon}</div></mwc-icon>`;
    }
    renderLineRipple() {
      if (this.outlined) {
        return nothing;
      }
      return html`
      <span .lineRippleFoundation=${lineRipple()}></span>
    `;
    }
    renderHelperText() {
      if (!this.shouldRenderHelperText) {
        return nothing;
      }
      const showValidationMessage = this.validationMessage && !this.isUiValid;
      const classes = {
        "mdc-select-helper-text--validation-msg": showValidationMessage
      };
      return html`
        <p
          class="mdc-select-helper-text ${classMap(classes)}"
          id="helper-text">${showValidationMessage ? this.validationMessage : this.helper}</p>`;
    }
    createAdapter() {
      return Object.assign(Object.assign({}, addHasRemoveClass(this.mdcRoot)), {activateBottomLine: () => {
        if (this.lineRippleElement) {
          this.lineRippleElement.lineRippleFoundation.activate();
        }
      }, deactivateBottomLine: () => {
        if (this.lineRippleElement) {
          this.lineRippleElement.lineRippleFoundation.deactivate();
        }
      }, hasLabel: () => {
        return !!this.label;
      }, floatLabel: (shouldFloat) => {
        if (this.labelElement) {
          this.labelElement.floatingLabelFoundation.float(shouldFloat);
        }
      }, getLabelWidth: () => {
        if (this.labelElement) {
          return this.labelElement.floatingLabelFoundation.getWidth();
        }
        return 0;
      }, setLabelRequired: (isRequired) => {
        if (this.labelElement) {
          this.labelElement.floatingLabelFoundation.setRequired(isRequired);
        }
      }, hasOutline: () => this.outlined, notchOutline: (labelWidth) => {
        const outlineElement = this.outlineElement;
        if (outlineElement && !this.outlineOpen) {
          this.outlineWidth = labelWidth;
          this.outlineOpen = true;
        }
      }, closeOutline: () => {
        if (this.outlineElement) {
          this.outlineOpen = false;
        }
      }, setRippleCenter: (normalizedX) => {
        if (this.lineRippleElement) {
          const foundation = this.lineRippleElement.lineRippleFoundation;
          foundation.setRippleCenter(normalizedX);
        }
      }, notifyChange: async (value) => {
        if (!this.valueSetDirectly && value === this.value) {
          return;
        }
        this.valueSetDirectly = false;
        this.value = value;
        await this.updateComplete;
        const ev = new Event("change", {bubbles: true});
        this.dispatchEvent(ev);
      }, setSelectedText: (value) => this.selectedText = value, isSelectAnchorFocused: () => {
        const selectAnchorElement = this.anchorElement;
        if (!selectAnchorElement) {
          return false;
        }
        const rootNode = selectAnchorElement.getRootNode();
        return rootNode.activeElement === selectAnchorElement;
      }, getSelectAnchorAttr: (attr) => {
        const selectAnchorElement = this.anchorElement;
        if (!selectAnchorElement) {
          return null;
        }
        return selectAnchorElement.getAttribute(attr);
      }, setSelectAnchorAttr: (attr, value) => {
        const selectAnchorElement = this.anchorElement;
        if (!selectAnchorElement) {
          return;
        }
        selectAnchorElement.setAttribute(attr, value);
      }, removeSelectAnchorAttr: (attr) => {
        const selectAnchorElement = this.anchorElement;
        if (!selectAnchorElement) {
          return;
        }
        selectAnchorElement.removeAttribute(attr);
      }, openMenu: () => {
        this.menuOpen = true;
      }, closeMenu: () => {
        this.menuOpen = false;
      }, addMenuClass: () => void 0, removeMenuClass: () => void 0, getAnchorElement: () => this.anchorElement, setMenuAnchorElement: () => {
      }, setMenuAnchorCorner: () => {
        const menuElement = this.menuElement;
        if (menuElement) {
          menuElement.corner = "BOTTOM_START";
        }
      }, setMenuWrapFocus: (wrapFocus) => {
        const menuElement = this.menuElement;
        if (menuElement) {
          menuElement.wrapFocus = wrapFocus;
        }
      }, focusMenuItemAtIndex: (index) => {
        const menuElement = this.menuElement;
        if (!menuElement) {
          return;
        }
        const element = menuElement.items[index];
        if (!element) {
          return;
        }
        element.focus();
      }, getMenuItemCount: () => {
        const menuElement = this.menuElement;
        if (menuElement) {
          return menuElement.items.length;
        }
        return 0;
      }, getMenuItemValues: () => {
        const menuElement = this.menuElement;
        if (!menuElement) {
          return [];
        }
        const items = menuElement.items;
        return items.map((item) => item.value);
      }, getMenuItemTextAtIndex: (index) => {
        const menuElement = this.menuElement;
        if (!menuElement) {
          return "";
        }
        const element = menuElement.items[index];
        if (!element) {
          return "";
        }
        return element.text;
      }, getSelectedIndex: () => this.index, setSelectedIndex: () => void 0, isTypeaheadInProgress: () => isTypingInProgress(this.typeaheadState), typeaheadMatchItem: (nextChar, startingIndex) => {
        if (!this.menuElement) {
          return -1;
        }
        const opts = {
          focusItemAtIndex: (index2) => {
            this.menuElement.focusItemAtIndex(index2);
          },
          focusedItemIndex: startingIndex ? startingIndex : this.menuElement.getFocusedItemIndex(),
          nextChar,
          sortedIndexByFirstChar: this.sortedIndexByFirstChar,
          skipFocus: false,
          isItemAtIndexDisabled: (index2) => this.items[index2].disabled
        };
        const index = matchItem(opts, this.typeaheadState);
        if (index !== -1) {
          this.select(index);
        }
        return index;
      }});
    }
    checkValidity() {
      const isValid = this._checkValidity(this.value);
      if (!isValid) {
        const invalidEvent = new Event("invalid", {bubbles: false, cancelable: true});
        this.dispatchEvent(invalidEvent);
      }
      return isValid;
    }
    reportValidity() {
      const isValid = this.checkValidity();
      this.isUiValid = isValid;
      return isValid;
    }
    _checkValidity(value) {
      const nativeValidity = this.formElement.validity;
      let validity = createValidityObj(nativeValidity);
      if (this.validityTransform) {
        const customValidity = this.validityTransform(value, validity);
        validity = Object.assign(Object.assign({}, validity), customValidity);
      }
      this._validity = validity;
      return this._validity.valid;
    }
    setCustomValidity(message) {
      this.validationMessage = message;
      this.formElement.setCustomValidity(message);
    }
    async _getUpdateComplete() {
      await this._menuUpdateComplete;
      await super._getUpdateComplete();
    }
    async firstUpdated() {
      const menuElement = this.menuElement;
      if (menuElement) {
        this._menuUpdateComplete = menuElement.updateComplete;
        await this._menuUpdateComplete;
      }
      super.firstUpdated();
      this.mdcFoundation.isValid = () => true;
      this.mdcFoundation.setValid = () => void 0;
      this.mdcFoundation.setDisabled(this.disabled);
      if (this.validateOnInitialRender) {
        this.reportValidity();
      }
      if (!this.selected) {
        if (!this.items.length && this.slotElement && this.slotElement.assignedNodes({flatten: true}).length) {
          await new Promise((res) => requestAnimationFrame(res));
          await this.layout();
        }
        const hasEmptyFirstOption = this.items.length && this.items[0].value === "";
        if (!this.value && hasEmptyFirstOption) {
          this.select(0);
          return;
        }
        this.selectByValue(this.value);
      }
      this.sortedIndexByFirstChar = initSortedIndex(this.items.length, (index) => this.items[index].text);
      this.renderReady = true;
    }
    onItemsUpdated() {
      this.sortedIndexByFirstChar = initSortedIndex(this.items.length, (index) => this.items[index].text);
    }
    select(index) {
      const menuElement = this.menuElement;
      if (menuElement) {
        menuElement.select(index);
      }
    }
    selectByValue(value) {
      let indexToSelect = -1;
      for (let i = 0; i < this.items.length; i++) {
        const item = this.items[i];
        if (item.value === value) {
          indexToSelect = i;
          break;
        }
      }
      this.valueSetDirectly = true;
      this.select(indexToSelect);
      this.mdcFoundation.handleChange();
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      for (const listener of this.listeners) {
        listener.target.removeEventListener(listener.name, listener.cb);
      }
    }
    focus() {
      const focusEvt = new CustomEvent("focus");
      const selectAnchorElement = this.anchorElement;
      if (selectAnchorElement) {
        selectAnchorElement.dispatchEvent(focusEvt);
        selectAnchorElement.focus();
      }
    }
    blur() {
      const focusEvt = new CustomEvent("blur");
      const selectAnchorElement = this.anchorElement;
      if (selectAnchorElement) {
        selectAnchorElement.dispatchEvent(focusEvt);
        selectAnchorElement.blur();
      }
    }
    onFocus() {
      if (this.mdcFoundation) {
        this.mdcFoundation.handleFocus();
      }
    }
    onBlur() {
      if (this.mdcFoundation) {
        this.mdcFoundation.handleBlur();
      }
      const menuElement = this.menuElement;
      if (menuElement && !menuElement.open) {
        this.reportValidity();
      }
    }
    onClick(evt) {
      if (this.mdcFoundation) {
        this.focus();
        const targetClientRect = evt.target.getBoundingClientRect();
        let xCoord = 0;
        if ("touches" in evt) {
          xCoord = evt.touches[0].clientX;
        } else {
          xCoord = evt.clientX;
        }
        const normalizedX = xCoord - targetClientRect.left;
        this.mdcFoundation.handleClick(normalizedX);
      }
    }
    onKeydown(evt) {
      const arrowUp = normalizeKey(evt) === KEY.ARROW_UP;
      const arrowDown = normalizeKey(evt) === KEY.ARROW_DOWN;
      if (arrowDown || arrowUp) {
        const shouldSelectNextItem = arrowUp && this.index > 0;
        const shouldSelectPrevItem = arrowDown && this.index < this.items.length - 1;
        if (shouldSelectNextItem) {
          this.select(this.index - 1);
        } else if (shouldSelectPrevItem) {
          this.select(this.index + 1);
        }
        evt.preventDefault();
        this.mdcFoundation.openMenu();
        return;
      }
      this.mdcFoundation.handleKeydown(evt);
    }
    handleTypeahead(event) {
      if (!this.menuElement) {
        return;
      }
      const focusedItemIndex = this.menuElement.getFocusedItemIndex();
      const target = isNodeElement(event.target) ? event.target : null;
      const isTargetListItem = target ? target.hasAttribute("mwc-list-item") : false;
      const opts = {
        event,
        focusItemAtIndex: (index) => {
          this.menuElement.focusItemAtIndex(index);
        },
        focusedItemIndex,
        isTargetListItem,
        sortedIndexByFirstChar: this.sortedIndexByFirstChar,
        isItemAtIndexDisabled: (index) => this.items[index].disabled
      };
      handleKeydown(opts, this.typeaheadState);
    }
    async onSelected(event) {
      if (!this.mdcFoundation) {
        await this.updateComplete;
      }
      this.mdcFoundation.handleMenuItemAction(event.detail.index);
      const item = this.items[event.detail.index];
      if (item) {
        this.value = item.value;
      }
    }
    onOpened() {
      if (this.mdcFoundation) {
        this.menuOpen = true;
        this.mdcFoundation.handleMenuOpened();
      }
    }
    onClosed() {
      if (this.mdcFoundation) {
        this.menuOpen = false;
        this.mdcFoundation.handleMenuClosed();
      }
    }
    async layout(updateItems = true) {
      if (this.mdcFoundation) {
        this.mdcFoundation.layout();
      }
      await this.updateComplete;
      const menuElement = this.menuElement;
      if (menuElement) {
        menuElement.layout(updateItems);
      }
      const labelElement = this.labelElement;
      if (!labelElement) {
        this.outlineOpen = false;
        return;
      }
      const shouldFloat = !!this.label && !!this.value;
      labelElement.floatingLabelFoundation.float(shouldFloat);
      if (!this.outlined) {
        return;
      }
      this.outlineOpen = shouldFloat;
      await this.updateComplete;
      const labelWidth = labelElement.floatingLabelFoundation.getWidth();
      if (this.outlineOpen) {
        this.outlineWidth = labelWidth;
      }
    }
  };
  __decorate([
    query(".mdc-select")
  ], SelectBase.prototype, "mdcRoot", void 0);
  __decorate([
    query(".formElement")
  ], SelectBase.prototype, "formElement", void 0);
  __decorate([
    query("slot")
  ], SelectBase.prototype, "slotElement", void 0);
  __decorate([
    query("select")
  ], SelectBase.prototype, "nativeSelectElement", void 0);
  __decorate([
    query("input")
  ], SelectBase.prototype, "nativeInputElement", void 0);
  __decorate([
    query(".mdc-line-ripple")
  ], SelectBase.prototype, "lineRippleElement", void 0);
  __decorate([
    query(".mdc-floating-label")
  ], SelectBase.prototype, "labelElement", void 0);
  __decorate([
    query("mwc-notched-outline")
  ], SelectBase.prototype, "outlineElement", void 0);
  __decorate([
    query(".mdc-menu")
  ], SelectBase.prototype, "menuElement", void 0);
  __decorate([
    query(".mdc-select__anchor")
  ], SelectBase.prototype, "anchorElement", void 0);
  __decorate([
    property({type: Boolean, attribute: "disabled", reflect: true}),
    observer(function(value) {
      if (this.renderReady) {
        this.mdcFoundation.setDisabled(value);
      }
    })
  ], SelectBase.prototype, "disabled", void 0);
  __decorate([
    property({type: Boolean}),
    observer(function(_newVal, oldVal) {
      if (oldVal !== void 0 && this.outlined !== oldVal) {
        this.layout(false);
      }
    })
  ], SelectBase.prototype, "outlined", void 0);
  __decorate([
    property({type: String}),
    observer(function(_newVal, oldVal) {
      if (oldVal !== void 0 && this.label !== oldVal) {
        this.layout(false);
      }
    })
  ], SelectBase.prototype, "label", void 0);
  __decorate([
    property({type: Boolean})
  ], SelectBase.prototype, "outlineOpen", void 0);
  __decorate([
    property({type: Number})
  ], SelectBase.prototype, "outlineWidth", void 0);
  __decorate([
    property({type: String}),
    observer(function(value) {
      if (this.mdcFoundation) {
        const initialization = this.selected === null && !!value;
        const valueSetByUser = this.selected && this.selected.value !== value;
        if (initialization || valueSetByUser) {
          this.selectByValue(value);
        }
        this.reportValidity();
      }
    })
  ], SelectBase.prototype, "value", void 0);
  __decorate([
    property({type: String})
  ], SelectBase.prototype, "selectedText", void 0);
  __decorate([
    property({type: String})
  ], SelectBase.prototype, "icon", void 0);
  __decorate([
    property({type: Boolean})
  ], SelectBase.prototype, "menuOpen", void 0);
  __decorate([
    property({type: String})
  ], SelectBase.prototype, "helper", void 0);
  __decorate([
    property({type: Boolean})
  ], SelectBase.prototype, "validateOnInitialRender", void 0);
  __decorate([
    property({type: String})
  ], SelectBase.prototype, "validationMessage", void 0);
  __decorate([
    property({type: Boolean})
  ], SelectBase.prototype, "required", void 0);
  __decorate([
    property({type: Boolean})
  ], SelectBase.prototype, "naturalMenuWidth", void 0);
  __decorate([
    property({type: Boolean})
  ], SelectBase.prototype, "isUiValid", void 0);
  __decorate([
    eventOptions({capture: true})
  ], SelectBase.prototype, "handleTypeahead", null);

  // node_modules/@material/mwc-select/mwc-select-css.js
  /**
  @license
  Copyright 2018 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var style10 = css`.mdc-floating-label{-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;font-family:Roboto, sans-serif;font-family:var(--mdc-typography-subtitle1-font-family, var(--mdc-typography-font-family, Roboto, sans-serif));font-size:1rem;font-size:var(--mdc-typography-subtitle1-font-size, 1rem);font-weight:400;font-weight:var(--mdc-typography-subtitle1-font-weight, 400);letter-spacing:0.009375em;letter-spacing:var(--mdc-typography-subtitle1-letter-spacing, 0.009375em);text-decoration:inherit;text-decoration:var(--mdc-typography-subtitle1-text-decoration, inherit);text-transform:inherit;text-transform:var(--mdc-typography-subtitle1-text-transform, inherit);position:absolute;left:0;transform-origin:left top;line-height:1.15rem;text-align:left;text-overflow:ellipsis;white-space:nowrap;cursor:text;overflow:hidden;will-change:transform;transition:transform 150ms cubic-bezier(0.4, 0, 0.2, 1),color 150ms cubic-bezier(0.4, 0, 0.2, 1)}[dir=rtl] .mdc-floating-label,.mdc-floating-label[dir=rtl]{right:0;left:auto;transform-origin:right top;text-align:right}.mdc-floating-label--float-above{cursor:auto}.mdc-floating-label--required::after{margin-left:1px;margin-right:0px;content:"*"}[dir=rtl] .mdc-floating-label--required::after,.mdc-floating-label--required[dir=rtl]::after{margin-left:0;margin-right:1px}.mdc-floating-label--float-above{transform:translateY(-106%) scale(0.75)}.mdc-floating-label--shake{animation:mdc-floating-label-shake-float-above-standard 250ms 1}@keyframes mdc-floating-label-shake-float-above-standard{0%{transform:translateX(calc(0 - 0%)) translateY(-106%) scale(0.75)}33%{animation-timing-function:cubic-bezier(0.5, 0, 0.701732, 0.495819);transform:translateX(calc(4% - 0%)) translateY(-106%) scale(0.75)}66%{animation-timing-function:cubic-bezier(0.302435, 0.381352, 0.55, 0.956352);transform:translateX(calc(-4% - 0%)) translateY(-106%) scale(0.75)}100%{transform:translateX(calc(0 - 0%)) translateY(-106%) scale(0.75)}}@keyframes mdc-ripple-fg-radius-in{from{animation-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transform:translate(var(--mdc-ripple-fg-translate-start, 0)) scale(1)}to{transform:translate(var(--mdc-ripple-fg-translate-end, 0)) scale(var(--mdc-ripple-fg-scale, 1))}}@keyframes mdc-ripple-fg-opacity-in{from{animation-timing-function:linear;opacity:0}to{opacity:var(--mdc-ripple-fg-opacity, 0)}}@keyframes mdc-ripple-fg-opacity-out{from{animation-timing-function:linear;opacity:var(--mdc-ripple-fg-opacity, 0)}to{opacity:0}}.mdc-line-ripple::before,.mdc-line-ripple::after{position:absolute;bottom:0;left:0;width:100%;border-bottom-style:solid;content:""}.mdc-line-ripple::before{border-bottom-width:1px;z-index:1}.mdc-line-ripple::after{transform:scaleX(0);border-bottom-width:2px;opacity:0;z-index:2}.mdc-line-ripple::after{transition:transform 180ms cubic-bezier(0.4, 0, 0.2, 1),opacity 180ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-line-ripple--active::after{transform:scaleX(1);opacity:1}.mdc-line-ripple--deactivating::after{opacity:0}.mdc-notched-outline{display:flex;position:absolute;top:0;right:0;left:0;box-sizing:border-box;width:100%;max-width:100%;height:100%;text-align:left;pointer-events:none}[dir=rtl] .mdc-notched-outline,.mdc-notched-outline[dir=rtl]{text-align:right}.mdc-notched-outline__leading,.mdc-notched-outline__notch,.mdc-notched-outline__trailing{box-sizing:border-box;height:100%;border-top:1px solid;border-bottom:1px solid;pointer-events:none}.mdc-notched-outline__leading{border-left:1px solid;border-right:none;width:12px}[dir=rtl] .mdc-notched-outline__leading,.mdc-notched-outline__leading[dir=rtl]{border-left:none;border-right:1px solid}.mdc-notched-outline__trailing{border-left:none;border-right:1px solid;flex-grow:1}[dir=rtl] .mdc-notched-outline__trailing,.mdc-notched-outline__trailing[dir=rtl]{border-left:1px solid;border-right:none}.mdc-notched-outline__notch{flex:0 0 auto;width:auto;max-width:calc(100% - 12px * 2)}.mdc-notched-outline .mdc-floating-label{display:inline-block;position:relative;max-width:100%}.mdc-notched-outline .mdc-floating-label--float-above{text-overflow:clip}.mdc-notched-outline--upgraded .mdc-floating-label--float-above{max-width:calc(100% / 0.75)}.mdc-notched-outline--notched .mdc-notched-outline__notch{padding-left:0;padding-right:8px;border-top:none}[dir=rtl] .mdc-notched-outline--notched .mdc-notched-outline__notch,.mdc-notched-outline--notched .mdc-notched-outline__notch[dir=rtl]{padding-left:8px;padding-right:0}.mdc-notched-outline--no-label .mdc-notched-outline__notch{display:none}.mdc-select{display:inline-flex;position:relative}.mdc-select:not(.mdc-select--disabled) .mdc-select__selected-text{color:rgba(0, 0, 0, 0.87)}.mdc-select.mdc-select--disabled .mdc-select__selected-text{color:rgba(0, 0, 0, 0.38)}.mdc-select:not(.mdc-select--disabled) .mdc-floating-label{color:rgba(0, 0, 0, 0.6)}.mdc-select:not(.mdc-select--disabled).mdc-select--focused .mdc-floating-label{color:rgba(98, 0, 238, 0.87)}.mdc-select.mdc-select--disabled .mdc-floating-label{color:rgba(0, 0, 0, 0.38)}.mdc-select:not(.mdc-select--disabled) .mdc-select__dropdown-icon{fill:rgba(0, 0, 0, 0.54)}.mdc-select:not(.mdc-select--disabled).mdc-select--focused .mdc-select__dropdown-icon{fill:#6200ee;fill:var(--mdc-theme-primary, #6200ee)}.mdc-select.mdc-select--disabled .mdc-select__dropdown-icon{fill:rgba(0, 0, 0, 0.38)}.mdc-select:not(.mdc-select--disabled)+.mdc-select-helper-text{color:rgba(0, 0, 0, 0.6)}.mdc-select.mdc-select--disabled+.mdc-select-helper-text{color:rgba(0, 0, 0, 0.38)}.mdc-select:not(.mdc-select--disabled) .mdc-select__icon{color:rgba(0, 0, 0, 0.54)}.mdc-select.mdc-select--disabled .mdc-select__icon{color:rgba(0, 0, 0, 0.38)}@media screen and (-ms-high-contrast: active){.mdc-select.mdc-select--disabled .mdc-select__selected-text{color:GrayText}.mdc-select.mdc-select--disabled .mdc-select__dropdown-icon{fill:red}.mdc-select.mdc-select--disabled .mdc-floating-label{color:GrayText}.mdc-select.mdc-select--disabled .mdc-line-ripple::before{border-bottom-color:GrayText}.mdc-select.mdc-select--disabled .mdc-notched-outline__leading,.mdc-select.mdc-select--disabled .mdc-notched-outline__notch,.mdc-select.mdc-select--disabled .mdc-notched-outline__trailing{border-color:GrayText}.mdc-select.mdc-select--disabled .mdc-select__icon{color:GrayText}.mdc-select.mdc-select--disabled+.mdc-select-helper-text{color:GrayText}}.mdc-select .mdc-floating-label{top:50%;transform:translateY(-50%);pointer-events:none}.mdc-select .mdc-select__anchor{padding-left:16px;padding-right:0}[dir=rtl] .mdc-select .mdc-select__anchor,.mdc-select .mdc-select__anchor[dir=rtl]{padding-left:0;padding-right:16px}.mdc-select.mdc-select--with-leading-icon .mdc-select__anchor{padding-left:0;padding-right:0}[dir=rtl] .mdc-select.mdc-select--with-leading-icon .mdc-select__anchor,.mdc-select.mdc-select--with-leading-icon .mdc-select__anchor[dir=rtl]{padding-left:0;padding-right:0}.mdc-select .mdc-select__icon{width:24px;height:24px;font-size:24px}.mdc-select .mdc-select__dropdown-icon{width:24px;height:24px}.mdc-select .mdc-select__menu .mdc-list-item{padding-left:16px;padding-right:16px}[dir=rtl] .mdc-select .mdc-select__menu .mdc-list-item,.mdc-select .mdc-select__menu .mdc-list-item[dir=rtl]{padding-left:16px;padding-right:16px}.mdc-select .mdc-select__menu .mdc-list-item__graphic{margin-left:0;margin-right:12px}[dir=rtl] .mdc-select .mdc-select__menu .mdc-list-item__graphic,.mdc-select .mdc-select__menu .mdc-list-item__graphic[dir=rtl]{margin-left:12px;margin-right:0}.mdc-select__dropdown-icon{margin-left:12px;margin-right:12px;display:inline-flex;position:relative;align-self:center;align-items:center;justify-content:center;flex-shrink:0;pointer-events:none}.mdc-select__dropdown-icon .mdc-select__dropdown-icon-active,.mdc-select__dropdown-icon .mdc-select__dropdown-icon-inactive{position:absolute;top:0;left:0}.mdc-select__dropdown-icon .mdc-select__dropdown-icon-graphic{width:41.6666666667%;height:20.8333333333%}.mdc-select__dropdown-icon .mdc-select__dropdown-icon-inactive{opacity:1;transition:opacity 75ms linear 75ms}.mdc-select__dropdown-icon .mdc-select__dropdown-icon-active{opacity:0;transition:opacity 75ms linear}[dir=rtl] .mdc-select__dropdown-icon,.mdc-select__dropdown-icon[dir=rtl]{margin-left:12px;margin-right:12px}.mdc-select--activated .mdc-select__dropdown-icon .mdc-select__dropdown-icon-inactive{opacity:0;transition:opacity 49.5ms linear}.mdc-select--activated .mdc-select__dropdown-icon .mdc-select__dropdown-icon-active{opacity:1;transition:opacity 100.5ms linear 49.5ms}.mdc-select__anchor{width:200px;min-width:0;flex:1 1 auto;position:relative;box-sizing:border-box;overflow:hidden;outline:none;cursor:pointer}.mdc-select__anchor .mdc-floating-label--float-above{transform:translateY(-106%) scale(0.75)}.mdc-select__selected-text-container{display:flex;appearance:none;pointer-events:none;box-sizing:border-box;width:auto;min-width:0;flex-grow:1;height:28px;border:none;outline:none;padding:0;background-color:transparent;color:inherit}.mdc-select__selected-text{-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;font-family:Roboto, sans-serif;font-family:var(--mdc-typography-subtitle1-font-family, var(--mdc-typography-font-family, Roboto, sans-serif));font-size:1rem;font-size:var(--mdc-typography-subtitle1-font-size, 1rem);line-height:1.75rem;line-height:var(--mdc-typography-subtitle1-line-height, 1.75rem);font-weight:400;font-weight:var(--mdc-typography-subtitle1-font-weight, 400);letter-spacing:0.009375em;letter-spacing:var(--mdc-typography-subtitle1-letter-spacing, 0.009375em);text-decoration:inherit;text-decoration:var(--mdc-typography-subtitle1-text-decoration, inherit);text-transform:inherit;text-transform:var(--mdc-typography-subtitle1-text-transform, inherit);text-overflow:ellipsis;white-space:nowrap;overflow:hidden;display:block;width:100%;text-align:left}[dir=rtl] .mdc-select__selected-text,.mdc-select__selected-text[dir=rtl]{text-align:right}.mdc-select--invalid:not(.mdc-select--disabled) .mdc-floating-label{color:#b00020;color:var(--mdc-theme-error, #b00020)}.mdc-select--invalid:not(.mdc-select--disabled).mdc-select--focused .mdc-floating-label{color:#b00020;color:var(--mdc-theme-error, #b00020)}.mdc-select--invalid:not(.mdc-select--disabled).mdc-select--invalid+.mdc-select-helper-text--validation-msg{color:#b00020;color:var(--mdc-theme-error, #b00020)}.mdc-select--invalid:not(.mdc-select--disabled) .mdc-select__dropdown-icon{fill:#b00020;fill:var(--mdc-theme-error, #b00020)}.mdc-select--invalid:not(.mdc-select--disabled).mdc-select--focused .mdc-select__dropdown-icon{fill:#b00020;fill:var(--mdc-theme-error, #b00020)}.mdc-select--disabled{cursor:default;pointer-events:none}.mdc-select--with-leading-icon .mdc-select__menu .mdc-list-item{padding-left:12px;padding-right:12px}[dir=rtl] .mdc-select--with-leading-icon .mdc-select__menu .mdc-list-item,.mdc-select--with-leading-icon .mdc-select__menu .mdc-list-item[dir=rtl]{padding-left:12px;padding-right:12px}.mdc-select__menu .mdc-list .mdc-select__icon{margin-left:0;margin-right:0}[dir=rtl] .mdc-select__menu .mdc-list .mdc-select__icon,.mdc-select__menu .mdc-list .mdc-select__icon[dir=rtl]{margin-left:0;margin-right:0}.mdc-select__menu .mdc-list .mdc-list-item--selected,.mdc-select__menu .mdc-list .mdc-list-item--activated{color:#000;color:var(--mdc-theme-on-surface, #000)}.mdc-select__menu .mdc-list .mdc-list-item--selected .mdc-list-item__graphic,.mdc-select__menu .mdc-list .mdc-list-item--activated .mdc-list-item__graphic{color:#000;color:var(--mdc-theme-on-surface, #000)}.mdc-select--filled .mdc-select__anchor{height:56px;display:flex;align-items:baseline}.mdc-select--filled .mdc-select__anchor::before{display:inline-block;width:0;height:40px;content:"";vertical-align:0}.mdc-select--filled.mdc-select--no-label .mdc-select__anchor .mdc-select__selected-text::before{content:"​"}.mdc-select--filled.mdc-select--no-label .mdc-select__anchor .mdc-select__selected-text-container{height:100%;display:inline-flex;align-items:center}.mdc-select--filled.mdc-select--no-label .mdc-select__anchor::before{display:none}.mdc-select--filled .mdc-select__anchor{border-top-left-radius:4px;border-top-left-radius:var(--mdc-shape-small, 4px);border-top-right-radius:4px;border-top-right-radius:var(--mdc-shape-small, 4px);border-bottom-right-radius:0;border-bottom-left-radius:0}.mdc-select--filled:not(.mdc-select--disabled) .mdc-select__anchor{background-color:whitesmoke}.mdc-select--filled.mdc-select--disabled .mdc-select__anchor{background-color:#fafafa}.mdc-select--filled:not(.mdc-select--disabled) .mdc-line-ripple::before{border-bottom-color:rgba(0, 0, 0, 0.42)}.mdc-select--filled:not(.mdc-select--disabled):hover .mdc-line-ripple::before{border-bottom-color:rgba(0, 0, 0, 0.87)}.mdc-select--filled:not(.mdc-select--disabled) .mdc-line-ripple::after{border-bottom-color:#6200ee;border-bottom-color:var(--mdc-theme-primary, #6200ee)}.mdc-select--filled.mdc-select--disabled .mdc-line-ripple::before{border-bottom-color:rgba(0, 0, 0, 0.06)}.mdc-select--filled .mdc-floating-label{max-width:calc(100% - 64px)}.mdc-select--filled .mdc-floating-label--float-above{max-width:calc(100% / 0.75 - 64px / 0.75)}.mdc-select--filled .mdc-menu-surface--is-open-below{border-top-left-radius:0px;border-top-right-radius:0px}.mdc-select--filled.mdc-select--focused.mdc-line-ripple::after{transform:scale(1, 2);opacity:1}.mdc-select--filled .mdc-floating-label{left:16px;right:initial}[dir=rtl] .mdc-select--filled .mdc-floating-label,.mdc-select--filled .mdc-floating-label[dir=rtl]{left:initial;right:16px}.mdc-select--filled.mdc-select--with-leading-icon .mdc-floating-label{left:48px;right:initial}[dir=rtl] .mdc-select--filled.mdc-select--with-leading-icon .mdc-floating-label,.mdc-select--filled.mdc-select--with-leading-icon .mdc-floating-label[dir=rtl]{left:initial;right:48px}.mdc-select--filled.mdc-select--with-leading-icon .mdc-floating-label{max-width:calc(100% - 96px)}.mdc-select--filled.mdc-select--with-leading-icon .mdc-floating-label--float-above{max-width:calc(100% / 0.75 - 96px / 0.75)}.mdc-select--invalid:not(.mdc-select--disabled) .mdc-line-ripple::before{border-bottom-color:#b00020;border-bottom-color:var(--mdc-theme-error, #b00020)}.mdc-select--invalid:not(.mdc-select--disabled):hover .mdc-line-ripple::before{border-bottom-color:#b00020;border-bottom-color:var(--mdc-theme-error, #b00020)}.mdc-select--invalid:not(.mdc-select--disabled) .mdc-line-ripple::after{border-bottom-color:#b00020;border-bottom-color:var(--mdc-theme-error, #b00020)}.mdc-select--outlined{border:none}.mdc-select--outlined .mdc-select__anchor{height:56px}.mdc-select--outlined .mdc-select__anchor .mdc-floating-label--float-above{transform:translateY(-37.25px) scale(1)}.mdc-select--outlined .mdc-select__anchor .mdc-floating-label--float-above{font-size:.75rem}.mdc-select--outlined .mdc-select__anchor.mdc-notched-outline--upgraded .mdc-floating-label--float-above,.mdc-select--outlined .mdc-select__anchor .mdc-notched-outline--upgraded .mdc-floating-label--float-above{transform:translateY(-34.75px) scale(0.75)}.mdc-select--outlined .mdc-select__anchor.mdc-notched-outline--upgraded .mdc-floating-label--float-above,.mdc-select--outlined .mdc-select__anchor .mdc-notched-outline--upgraded .mdc-floating-label--float-above{font-size:1rem}.mdc-select--outlined .mdc-select__anchor .mdc-floating-label--shake{animation:mdc-floating-label-shake-float-above-select-outlined-56px 250ms 1}@keyframes mdc-floating-label-shake-float-above-select-outlined-56px{0%{transform:translateX(calc(0 - 0%)) translateY(-34.75px) scale(0.75)}33%{animation-timing-function:cubic-bezier(0.5, 0, 0.701732, 0.495819);transform:translateX(calc(4% - 0%)) translateY(-34.75px) scale(0.75)}66%{animation-timing-function:cubic-bezier(0.302435, 0.381352, 0.55, 0.956352);transform:translateX(calc(-4% - 0%)) translateY(-34.75px) scale(0.75)}100%{transform:translateX(calc(0 - 0%)) translateY(-34.75px) scale(0.75)}}.mdc-select--outlined .mdc-notched-outline .mdc-notched-outline__leading{border-top-left-radius:4px;border-top-left-radius:var(--mdc-shape-small, 4px);border-top-right-radius:0;border-bottom-right-radius:0;border-bottom-left-radius:4px;border-bottom-left-radius:var(--mdc-shape-small, 4px)}[dir=rtl] .mdc-select--outlined .mdc-notched-outline .mdc-notched-outline__leading,.mdc-select--outlined .mdc-notched-outline .mdc-notched-outline__leading[dir=rtl]{border-top-left-radius:0;border-top-right-radius:4px;border-top-right-radius:var(--mdc-shape-small, 4px);border-bottom-right-radius:4px;border-bottom-right-radius:var(--mdc-shape-small, 4px);border-bottom-left-radius:0}@supports(top: max(0%)){.mdc-select--outlined .mdc-notched-outline .mdc-notched-outline__leading{width:max(12px, var(--mdc-shape-small, 4px))}}@supports(top: max(0%)){.mdc-select--outlined .mdc-notched-outline .mdc-notched-outline__notch{max-width:calc(100% - max(12px, var(--mdc-shape-small, 4px)) * 2)}}.mdc-select--outlined .mdc-notched-outline .mdc-notched-outline__trailing{border-top-left-radius:0;border-top-right-radius:4px;border-top-right-radius:var(--mdc-shape-small, 4px);border-bottom-right-radius:4px;border-bottom-right-radius:var(--mdc-shape-small, 4px);border-bottom-left-radius:0}[dir=rtl] .mdc-select--outlined .mdc-notched-outline .mdc-notched-outline__trailing,.mdc-select--outlined .mdc-notched-outline .mdc-notched-outline__trailing[dir=rtl]{border-top-left-radius:4px;border-top-left-radius:var(--mdc-shape-small, 4px);border-top-right-radius:0;border-bottom-right-radius:0;border-bottom-left-radius:4px;border-bottom-left-radius:var(--mdc-shape-small, 4px)}@supports(top: max(0%)){.mdc-select--outlined .mdc-select__anchor{padding-left:max(16px, calc(var(--mdc-shape-small, 4px) + 4px))}}[dir=rtl] .mdc-select--outlined .mdc-select__anchor,.mdc-select--outlined .mdc-select__anchor[dir=rtl]{padding-left:0}@supports(top: max(0%)){[dir=rtl] .mdc-select--outlined .mdc-select__anchor,.mdc-select--outlined .mdc-select__anchor[dir=rtl]{padding-right:max(16px, calc(var(--mdc-shape-small, 4px) + 4px))}}@supports(top: max(0%)){.mdc-select--outlined+.mdc-select-helper-text{margin-left:max(16px, calc(var(--mdc-shape-small, 4px) + 4px))}}[dir=rtl] .mdc-select--outlined+.mdc-select-helper-text,.mdc-select--outlined+.mdc-select-helper-text[dir=rtl]{margin-left:0}@supports(top: max(0%)){[dir=rtl] .mdc-select--outlined+.mdc-select-helper-text,.mdc-select--outlined+.mdc-select-helper-text[dir=rtl]{margin-right:max(16px, calc(var(--mdc-shape-small, 4px) + 4px))}}.mdc-select--outlined:not(.mdc-select--disabled) .mdc-select__anchor{background-color:transparent}.mdc-select--outlined.mdc-select--disabled .mdc-select__anchor{background-color:transparent}.mdc-select--outlined:not(.mdc-select--disabled) .mdc-notched-outline__leading,.mdc-select--outlined:not(.mdc-select--disabled) .mdc-notched-outline__notch,.mdc-select--outlined:not(.mdc-select--disabled) .mdc-notched-outline__trailing{border-color:rgba(0, 0, 0, 0.38)}.mdc-select--outlined:not(.mdc-select--disabled):not(.mdc-select--focused) .mdc-select__anchor:hover .mdc-notched-outline .mdc-notched-outline__leading,.mdc-select--outlined:not(.mdc-select--disabled):not(.mdc-select--focused) .mdc-select__anchor:hover .mdc-notched-outline .mdc-notched-outline__notch,.mdc-select--outlined:not(.mdc-select--disabled):not(.mdc-select--focused) .mdc-select__anchor:hover .mdc-notched-outline .mdc-notched-outline__trailing{border-color:rgba(0, 0, 0, 0.87)}.mdc-select--outlined:not(.mdc-select--disabled).mdc-select--focused .mdc-notched-outline .mdc-notched-outline__leading,.mdc-select--outlined:not(.mdc-select--disabled).mdc-select--focused .mdc-notched-outline .mdc-notched-outline__notch,.mdc-select--outlined:not(.mdc-select--disabled).mdc-select--focused .mdc-notched-outline .mdc-notched-outline__trailing{border-width:2px}.mdc-select--outlined:not(.mdc-select--disabled).mdc-select--focused .mdc-notched-outline .mdc-notched-outline__leading,.mdc-select--outlined:not(.mdc-select--disabled).mdc-select--focused .mdc-notched-outline .mdc-notched-outline__notch,.mdc-select--outlined:not(.mdc-select--disabled).mdc-select--focused .mdc-notched-outline .mdc-notched-outline__trailing{border-color:#6200ee;border-color:var(--mdc-theme-primary, #6200ee)}.mdc-select--outlined.mdc-select--disabled .mdc-notched-outline__leading,.mdc-select--outlined.mdc-select--disabled .mdc-notched-outline__notch,.mdc-select--outlined.mdc-select--disabled .mdc-notched-outline__trailing{border-color:rgba(0, 0, 0, 0.06)}.mdc-select--outlined .mdc-select__anchor :not(.mdc-notched-outline--notched) .mdc-notched-outline__notch{max-width:calc(100% - 60px)}.mdc-select--outlined .mdc-select__anchor{display:flex;align-items:baseline;overflow:visible}.mdc-select--outlined .mdc-select__anchor .mdc-floating-label--shake{animation:mdc-floating-label-shake-float-above-select-outlined 250ms 1}.mdc-select--outlined .mdc-select__anchor .mdc-floating-label--float-above{transform:translateY(-37.25px) scale(1)}.mdc-select--outlined .mdc-select__anchor .mdc-floating-label--float-above{font-size:.75rem}.mdc-select--outlined .mdc-select__anchor.mdc-notched-outline--upgraded .mdc-floating-label--float-above,.mdc-select--outlined .mdc-select__anchor .mdc-notched-outline--upgraded .mdc-floating-label--float-above{transform:translateY(-34.75px) scale(0.75)}.mdc-select--outlined .mdc-select__anchor.mdc-notched-outline--upgraded .mdc-floating-label--float-above,.mdc-select--outlined .mdc-select__anchor .mdc-notched-outline--upgraded .mdc-floating-label--float-above{font-size:1rem}.mdc-select--outlined .mdc-select__anchor .mdc-notched-outline--notched .mdc-notched-outline__notch{padding-top:1px}.mdc-select--outlined .mdc-select__anchor .mdc-select__selected-text::before{content:"​"}.mdc-select--outlined .mdc-select__anchor .mdc-select__selected-text-container{height:100%;display:inline-flex;align-items:center}.mdc-select--outlined .mdc-select__anchor::before{display:none}.mdc-select--outlined .mdc-select__selected-text-container{display:flex;border:none;z-index:1;background-color:transparent}.mdc-select--outlined .mdc-select__icon{z-index:2}.mdc-select--outlined .mdc-floating-label{line-height:1.15rem;left:4px;right:initial}[dir=rtl] .mdc-select--outlined .mdc-floating-label,.mdc-select--outlined .mdc-floating-label[dir=rtl]{left:initial;right:4px}.mdc-select--outlined.mdc-select--focused .mdc-notched-outline--notched .mdc-notched-outline__notch{padding-top:2px}.mdc-select--outlined.mdc-select--invalid:not(.mdc-select--disabled) .mdc-notched-outline__leading,.mdc-select--outlined.mdc-select--invalid:not(.mdc-select--disabled) .mdc-notched-outline__notch,.mdc-select--outlined.mdc-select--invalid:not(.mdc-select--disabled) .mdc-notched-outline__trailing{border-color:#b00020;border-color:var(--mdc-theme-error, #b00020)}.mdc-select--outlined.mdc-select--invalid:not(.mdc-select--disabled):not(.mdc-select--focused) .mdc-select__anchor:hover .mdc-notched-outline .mdc-notched-outline__leading,.mdc-select--outlined.mdc-select--invalid:not(.mdc-select--disabled):not(.mdc-select--focused) .mdc-select__anchor:hover .mdc-notched-outline .mdc-notched-outline__notch,.mdc-select--outlined.mdc-select--invalid:not(.mdc-select--disabled):not(.mdc-select--focused) .mdc-select__anchor:hover .mdc-notched-outline .mdc-notched-outline__trailing{border-color:#b00020;border-color:var(--mdc-theme-error, #b00020)}.mdc-select--outlined.mdc-select--invalid:not(.mdc-select--disabled).mdc-select--focused .mdc-notched-outline .mdc-notched-outline__leading,.mdc-select--outlined.mdc-select--invalid:not(.mdc-select--disabled).mdc-select--focused .mdc-notched-outline .mdc-notched-outline__notch,.mdc-select--outlined.mdc-select--invalid:not(.mdc-select--disabled).mdc-select--focused .mdc-notched-outline .mdc-notched-outline__trailing{border-width:2px}.mdc-select--outlined.mdc-select--invalid:not(.mdc-select--disabled).mdc-select--focused .mdc-notched-outline .mdc-notched-outline__leading,.mdc-select--outlined.mdc-select--invalid:not(.mdc-select--disabled).mdc-select--focused .mdc-notched-outline .mdc-notched-outline__notch,.mdc-select--outlined.mdc-select--invalid:not(.mdc-select--disabled).mdc-select--focused .mdc-notched-outline .mdc-notched-outline__trailing{border-color:#b00020;border-color:var(--mdc-theme-error, #b00020)}.mdc-select--outlined.mdc-select--with-leading-icon .mdc-floating-label{left:36px;right:initial}[dir=rtl] .mdc-select--outlined.mdc-select--with-leading-icon .mdc-floating-label,.mdc-select--outlined.mdc-select--with-leading-icon .mdc-floating-label[dir=rtl]{left:initial;right:36px}.mdc-select--outlined.mdc-select--with-leading-icon .mdc-floating-label--float-above{transform:translateY(-37.25px) translateX(-32px) scale(1)}[dir=rtl] .mdc-select--outlined.mdc-select--with-leading-icon .mdc-floating-label--float-above,.mdc-select--outlined.mdc-select--with-leading-icon .mdc-floating-label--float-above[dir=rtl]{transform:translateY(-37.25px) translateX(32px) scale(1)}.mdc-select--outlined.mdc-select--with-leading-icon .mdc-floating-label--float-above{font-size:.75rem}.mdc-select--outlined.mdc-select--with-leading-icon.mdc-notched-outline--upgraded .mdc-floating-label--float-above,.mdc-select--outlined.mdc-select--with-leading-icon .mdc-notched-outline--upgraded .mdc-floating-label--float-above{transform:translateY(-34.75px) translateX(-32px) scale(0.75)}[dir=rtl] .mdc-select--outlined.mdc-select--with-leading-icon.mdc-notched-outline--upgraded .mdc-floating-label--float-above,.mdc-select--outlined.mdc-select--with-leading-icon.mdc-notched-outline--upgraded .mdc-floating-label--float-above[dir=rtl],[dir=rtl] .mdc-select--outlined.mdc-select--with-leading-icon .mdc-notched-outline--upgraded .mdc-floating-label--float-above,.mdc-select--outlined.mdc-select--with-leading-icon .mdc-notched-outline--upgraded .mdc-floating-label--float-above[dir=rtl]{transform:translateY(-34.75px) translateX(32px) scale(0.75)}.mdc-select--outlined.mdc-select--with-leading-icon.mdc-notched-outline--upgraded .mdc-floating-label--float-above,.mdc-select--outlined.mdc-select--with-leading-icon .mdc-notched-outline--upgraded .mdc-floating-label--float-above{font-size:1rem}.mdc-select--outlined.mdc-select--with-leading-icon .mdc-floating-label--shake{animation:mdc-floating-label-shake-float-above-select-outlined-leading-icon-56px 250ms 1}@keyframes mdc-floating-label-shake-float-above-select-outlined-leading-icon-56px{0%{transform:translateX(calc(0 - 32px)) translateY(-34.75px) scale(0.75)}33%{animation-timing-function:cubic-bezier(0.5, 0, 0.701732, 0.495819);transform:translateX(calc(4% - 32px)) translateY(-34.75px) scale(0.75)}66%{animation-timing-function:cubic-bezier(0.302435, 0.381352, 0.55, 0.956352);transform:translateX(calc(-4% - 32px)) translateY(-34.75px) scale(0.75)}100%{transform:translateX(calc(0 - 32px)) translateY(-34.75px) scale(0.75)}}[dir=rtl] .mdc-select--outlined.mdc-select--with-leading-icon .mdc-floating-label--shake,.mdc-select--outlined.mdc-select--with-leading-icon[dir=rtl] .mdc-floating-label--shake{animation:mdc-floating-label-shake-float-above-select-outlined-leading-icon-56px 250ms 1}@keyframes mdc-floating-label-shake-float-above-select-outlined-leading-icon-56px-rtl{0%{transform:translateX(calc(0 - -32px)) translateY(-34.75px) scale(0.75)}33%{animation-timing-function:cubic-bezier(0.5, 0, 0.701732, 0.495819);transform:translateX(calc(4% - -32px)) translateY(-34.75px) scale(0.75)}66%{animation-timing-function:cubic-bezier(0.302435, 0.381352, 0.55, 0.956352);transform:translateX(calc(-4% - -32px)) translateY(-34.75px) scale(0.75)}100%{transform:translateX(calc(0 - -32px)) translateY(-34.75px) scale(0.75)}}.mdc-select--outlined.mdc-select--with-leading-icon .mdc-select__anchor :not(.mdc-notched-outline--notched) .mdc-notched-outline__notch{max-width:calc(100% - 96px)}.mdc-select--outlined .mdc-menu-surface{margin-bottom:8px}.mdc-select--outlined.mdc-select--no-label .mdc-menu-surface,.mdc-select--outlined .mdc-menu-surface--is-open-below{margin-bottom:0}.mdc-select__anchor{--mdc-ripple-fg-size: 0;--mdc-ripple-left: 0;--mdc-ripple-top: 0;--mdc-ripple-fg-scale: 1;--mdc-ripple-fg-translate-end: 0;--mdc-ripple-fg-translate-start: 0;-webkit-tap-highlight-color:rgba(0,0,0,0);will-change:transform,opacity}.mdc-select__anchor .mdc-select__ripple::before,.mdc-select__anchor .mdc-select__ripple::after{position:absolute;border-radius:50%;opacity:0;pointer-events:none;content:""}.mdc-select__anchor .mdc-select__ripple::before{transition:opacity 15ms linear,background-color 15ms linear;z-index:1;z-index:var(--mdc-ripple-z-index, 1)}.mdc-select__anchor .mdc-select__ripple::after{z-index:0;z-index:var(--mdc-ripple-z-index, 0)}.mdc-select__anchor.mdc-ripple-upgraded .mdc-select__ripple::before{transform:scale(var(--mdc-ripple-fg-scale, 1))}.mdc-select__anchor.mdc-ripple-upgraded .mdc-select__ripple::after{top:0;left:0;transform:scale(0);transform-origin:center center}.mdc-select__anchor.mdc-ripple-upgraded--unbounded .mdc-select__ripple::after{top:var(--mdc-ripple-top, 0);left:var(--mdc-ripple-left, 0)}.mdc-select__anchor.mdc-ripple-upgraded--foreground-activation .mdc-select__ripple::after{animation:mdc-ripple-fg-radius-in 225ms forwards,mdc-ripple-fg-opacity-in 75ms forwards}.mdc-select__anchor.mdc-ripple-upgraded--foreground-deactivation .mdc-select__ripple::after{animation:mdc-ripple-fg-opacity-out 150ms;transform:translate(var(--mdc-ripple-fg-translate-end, 0)) scale(var(--mdc-ripple-fg-scale, 1))}.mdc-select__anchor .mdc-select__ripple::before,.mdc-select__anchor .mdc-select__ripple::after{top:calc(50% - 100%);left:calc(50% - 100%);width:200%;height:200%}.mdc-select__anchor.mdc-ripple-upgraded .mdc-select__ripple::after{width:var(--mdc-ripple-fg-size, 100%);height:var(--mdc-ripple-fg-size, 100%)}.mdc-select__anchor .mdc-select__ripple::before,.mdc-select__anchor .mdc-select__ripple::after{background-color:rgba(0, 0, 0, 0.87);background-color:var(--mdc-ripple-color, rgba(0, 0, 0, 0.87))}.mdc-select__anchor:hover .mdc-select__ripple::before,.mdc-select__anchor.mdc-ripple-surface--hover .mdc-select__ripple::before{opacity:0.04;opacity:var(--mdc-ripple-hover-opacity, 0.04)}.mdc-select__anchor.mdc-ripple-upgraded--background-focused .mdc-select__ripple::before,.mdc-select__anchor:not(.mdc-ripple-upgraded):focus .mdc-select__ripple::before{transition-duration:75ms;opacity:0.12;opacity:var(--mdc-ripple-focus-opacity, 0.12)}.mdc-select__anchor .mdc-select__ripple{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none}.mdc-select__menu .mdc-list .mdc-list-item--selected .mdc-list-item__ripple::before,.mdc-select__menu .mdc-list .mdc-list-item--selected .mdc-list-item__ripple::after{background-color:#000;background-color:var(--mdc-ripple-color, var(--mdc-theme-on-surface, #000))}.mdc-select__menu .mdc-list .mdc-list-item--selected:hover .mdc-list-item__ripple::before,.mdc-select__menu .mdc-list .mdc-list-item--selected.mdc-ripple-surface--hover .mdc-list-item__ripple::before{opacity:0.04;opacity:var(--mdc-ripple-hover-opacity, 0.04)}.mdc-select__menu .mdc-list .mdc-list-item--selected.mdc-ripple-upgraded--background-focused .mdc-list-item__ripple::before,.mdc-select__menu .mdc-list .mdc-list-item--selected:not(.mdc-ripple-upgraded):focus .mdc-list-item__ripple::before{transition-duration:75ms;opacity:0.12;opacity:var(--mdc-ripple-focus-opacity, 0.12)}.mdc-select__menu .mdc-list .mdc-list-item--selected:not(.mdc-ripple-upgraded) .mdc-list-item__ripple::after{transition:opacity 150ms linear}.mdc-select__menu .mdc-list .mdc-list-item--selected:not(.mdc-ripple-upgraded):active .mdc-list-item__ripple::after{transition-duration:75ms;opacity:0.12;opacity:var(--mdc-ripple-press-opacity, 0.12)}.mdc-select__menu .mdc-list .mdc-list-item--selected.mdc-ripple-upgraded{--mdc-ripple-fg-opacity: var(--mdc-ripple-press-opacity, 0.12)}.mdc-select-helper-text{margin:0;margin-left:16px;margin-right:16px;-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;font-family:Roboto, sans-serif;font-family:var(--mdc-typography-caption-font-family, var(--mdc-typography-font-family, Roboto, sans-serif));font-size:0.75rem;font-size:var(--mdc-typography-caption-font-size, 0.75rem);line-height:1.25rem;line-height:var(--mdc-typography-caption-line-height, 1.25rem);font-weight:400;font-weight:var(--mdc-typography-caption-font-weight, 400);letter-spacing:0.0333333333em;letter-spacing:var(--mdc-typography-caption-letter-spacing, 0.0333333333em);text-decoration:inherit;text-decoration:var(--mdc-typography-caption-text-decoration, inherit);text-transform:inherit;text-transform:var(--mdc-typography-caption-text-transform, inherit);display:block;margin-top:0;line-height:normal}[dir=rtl] .mdc-select-helper-text,.mdc-select-helper-text[dir=rtl]{margin-left:16px;margin-right:16px}.mdc-select-helper-text::before{display:inline-block;width:0;height:16px;content:"";vertical-align:0}.mdc-select-helper-text--validation-msg{opacity:0;transition:opacity 180ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-select--invalid+.mdc-select-helper-text--validation-msg,.mdc-select-helper-text--validation-msg-persistent{opacity:1}.mdc-select--with-leading-icon .mdc-select__icon{display:inline-block;box-sizing:border-box;border:none;text-decoration:none;cursor:pointer;user-select:none;flex-shrink:0;align-self:center;background-color:transparent;fill:currentColor}.mdc-select--with-leading-icon .mdc-select__icon{margin-left:12px;margin-right:12px}[dir=rtl] .mdc-select--with-leading-icon .mdc-select__icon,.mdc-select--with-leading-icon .mdc-select__icon[dir=rtl]{margin-left:12px;margin-right:12px}.mdc-select__icon:not([tabindex]),.mdc-select__icon[tabindex="-1"]{cursor:default;pointer-events:none}.material-icons{font-family:var(--mdc-icon-font, "Material Icons");font-weight:normal;font-style:normal;font-size:var(--mdc-icon-size, 24px);line-height:1;letter-spacing:normal;text-transform:none;display:inline-block;white-space:nowrap;word-wrap:normal;direction:ltr;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;-moz-osx-font-smoothing:grayscale;font-feature-settings:"liga"}:host{display:inline-block;vertical-align:top;outline:none}.mdc-select{width:100%}[hidden]{display:none}.mdc-select__icon{z-index:2}.mdc-select--with-leading-icon{--mdc-list-item-graphic-margin: calc(48px - var(--mdc-list-item-graphic-size, 24px) - var(--mdc-list-side-padding, 16px))}.mdc-select .mdc-select__anchor .mdc-select__selected-text{overflow:hidden}.mdc-select .mdc-select__anchor *{display:inline-flex}.mdc-select .mdc-select__anchor .mdc-floating-label{display:inline-block}mwc-notched-outline{--mdc-notched-outline-border-color: var(--mdc-select-outlined-idle-border-color, rgba(0, 0, 0, 0.38));--mdc-notched-outline-notch-offset: 1px}:host(:not([disabled]):hover) .mdc-select:not(.mdc-select--invalid):not(.mdc-select--focused) mwc-notched-outline{--mdc-notched-outline-border-color: var(--mdc-select-outlined-hover-border-color, rgba(0, 0, 0, 0.87))}:host(:not([disabled])) .mdc-select:not(.mdc-select--disabled) .mdc-select__selected-text{color:rgba(0, 0, 0, 0.87);color:var(--mdc-select-ink-color, rgba(0, 0, 0, 0.87))}:host(:not([disabled])) .mdc-select:not(.mdc-select--disabled) .mdc-line-ripple::before{border-bottom-color:rgba(0, 0, 0, 0.42);border-bottom-color:var(--mdc-select-idle-line-color, rgba(0, 0, 0, 0.42))}:host(:not([disabled])) .mdc-select:not(.mdc-select--disabled):hover .mdc-line-ripple::before{border-bottom-color:rgba(0, 0, 0, 0.87);border-bottom-color:var(--mdc-select-hover-line-color, rgba(0, 0, 0, 0.87))}:host(:not([disabled])) .mdc-select:not(.mdc-select--outlined):not(.mdc-select--disabled) .mdc-select__anchor{background-color:whitesmoke;background-color:var(--mdc-select-fill-color, whitesmoke)}:host(:not([disabled])) .mdc-select.mdc-select--invalid .mdc-select__dropdown-icon{fill:var(--mdc-select-error-dropdown-icon-color, var(--mdc-select-error-color, var(--mdc-theme-error, #b00020)))}:host(:not([disabled])) .mdc-select.mdc-select--invalid .mdc-floating-label,:host(:not([disabled])) .mdc-select.mdc-select--invalid .mdc-floating-label::after{color:var(--mdc-select-error-color, var(--mdc-theme-error, #b00020))}:host(:not([disabled])) .mdc-select.mdc-select--invalid mwc-notched-outline{--mdc-notched-outline-border-color: var(--mdc-select-error-color, var(--mdc-theme-error, #b00020))}.mdc-select__menu--invalid{--mdc-theme-primary: var(--mdc-select-error-color, var(--mdc-theme-error, #b00020))}:host(:not([disabled])) .mdc-select:not(.mdc-select--invalid):not(.mdc-select--focused) .mdc-floating-label,:host(:not([disabled])) .mdc-select:not(.mdc-select--invalid):not(.mdc-select--focused) .mdc-floating-label::after{color:rgba(0, 0, 0, 0.6);color:var(--mdc-select-label-ink-color, rgba(0, 0, 0, 0.6))}:host(:not([disabled])) .mdc-select:not(.mdc-select--invalid):not(.mdc-select--focused) .mdc-select__dropdown-icon{fill:rgba(0, 0, 0, 0.54);fill:var(--mdc-select-dropdown-icon-color, rgba(0, 0, 0, 0.54))}:host(:not([disabled])) .mdc-select.mdc-select--focused mwc-notched-outline{--mdc-notched-outline-stroke-width: 2px;--mdc-notched-outline-notch-offset: 2px}:host(:not([disabled])) .mdc-select.mdc-select--focused:not(.mdc-select--invalid) mwc-notched-outline{--mdc-notched-outline-border-color: var(--mdc-select-focused-label-color, var(--mdc-theme-primary, rgba(98, 0, 238, 0.87)))}:host(:not([disabled])) .mdc-select.mdc-select--focused:not(.mdc-select--invalid) .mdc-select__dropdown-icon{fill:rgba(98,0,238,.87);fill:var(--mdc-select-focused-dropdown-icon-color, var(--mdc-theme-primary, rgba(98, 0, 238, 0.87)))}:host(:not([disabled])) .mdc-select.mdc-select--focused:not(.mdc-select--invalid) .mdc-floating-label{color:#6200ee;color:var(--mdc-theme-primary, #6200ee)}:host(:not([disabled])) .mdc-select.mdc-select--focused:not(.mdc-select--invalid) .mdc-floating-label::after{color:#6200ee;color:var(--mdc-theme-primary, #6200ee)}:host(:not([disabled])) .mdc-select-helper-text:not(.mdc-select-helper-text--validation-msg){color:var(--mdc-select-label-ink-color, rgba(0, 0, 0, 0.6))}:host([disabled]){pointer-events:none}:host([disabled]) .mdc-select:not(.mdc-select--outlined).mdc-select--disabled .mdc-select__anchor{background-color:#fafafa;background-color:var(--mdc-select-disabled-fill-color, #fafafa)}:host([disabled]) .mdc-select.mdc-select--outlined mwc-notched-outline{--mdc-notched-outline-border-color: var(--mdc-select-outlined-disabled-border-color, rgba(0, 0, 0, 0.06))}:host([disabled]) .mdc-select .mdc-select__dropdown-icon{fill:rgba(0, 0, 0, 0.38);fill:var(--mdc-select-disabled-dropdown-icon-color, rgba(0, 0, 0, 0.38))}:host([disabled]) .mdc-select:not(.mdc-select--invalid):not(.mdc-select--focused) .mdc-floating-label,:host([disabled]) .mdc-select:not(.mdc-select--invalid):not(.mdc-select--focused) .mdc-floating-label::after{color:rgba(0, 0, 0, 0.38);color:var(--mdc-select-disabled-ink-color, rgba(0, 0, 0, 0.38))}:host([disabled]) .mdc-select-helper-text{color:rgba(0, 0, 0, 0.38);color:var(--mdc-select-disabled-ink-color, rgba(0, 0, 0, 0.38))}:host([disabled]) .mdc-select__selected-text{color:rgba(0, 0, 0, 0.38);color:var(--mdc-select-disabled-ink-color, rgba(0, 0, 0, 0.38))}`;

  // node_modules/@material/mwc-select/mwc-select.js
  /**
  @license
  Copyright 2020 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var Select = class Select2 extends SelectBase {
  };
  Select.styles = style10;
  Select = __decorate([
    customElement("mwc-select")
  ], Select);

  // node_modules/@material/form-field/node_modules/tslib/tslib.es6.js
  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation.
  
  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.
  
  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** */
  var extendStatics8 = function(d, b) {
    extendStatics8 = Object.setPrototypeOf || {__proto__: []} instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2)
        if (b2.hasOwnProperty(p))
          d2[p] = b2[p];
    };
    return extendStatics8(d, b);
  };
  function __extends8(d, b) {
    extendStatics8(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }
  var __assign8 = function() {
    __assign8 = Object.assign || function __assign10(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s)
          if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
      }
      return t;
    };
    return __assign8.apply(this, arguments);
  };

  // node_modules/@material/form-field/constants.js
  /**
   * @license
   * Copyright 2017 Google Inc.
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in
   * all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   * THE SOFTWARE.
   */
  var cssClasses9 = {
    ROOT: "mdc-form-field"
  };
  var strings7 = {
    LABEL_SELECTOR: ".mdc-form-field > label"
  };

  // node_modules/@material/form-field/foundation.js
  /**
   * @license
   * Copyright 2017 Google Inc.
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in
   * all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   * THE SOFTWARE.
   */
  var MDCFormFieldFoundation = function(_super) {
    __extends8(MDCFormFieldFoundation2, _super);
    function MDCFormFieldFoundation2(adapter) {
      var _this = _super.call(this, __assign8(__assign8({}, MDCFormFieldFoundation2.defaultAdapter), adapter)) || this;
      _this.click = function() {
        _this.handleClick();
      };
      return _this;
    }
    Object.defineProperty(MDCFormFieldFoundation2, "cssClasses", {
      get: function() {
        return cssClasses9;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(MDCFormFieldFoundation2, "strings", {
      get: function() {
        return strings7;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(MDCFormFieldFoundation2, "defaultAdapter", {
      get: function() {
        return {
          activateInputRipple: function() {
            return void 0;
          },
          deactivateInputRipple: function() {
            return void 0;
          },
          deregisterInteractionHandler: function() {
            return void 0;
          },
          registerInteractionHandler: function() {
            return void 0;
          }
        };
      },
      enumerable: true,
      configurable: true
    });
    MDCFormFieldFoundation2.prototype.init = function() {
      this.adapter.registerInteractionHandler("click", this.click);
    };
    MDCFormFieldFoundation2.prototype.destroy = function() {
      this.adapter.deregisterInteractionHandler("click", this.click);
    };
    MDCFormFieldFoundation2.prototype.handleClick = function() {
      var _this = this;
      this.adapter.activateInputRipple();
      requestAnimationFrame(function() {
        _this.adapter.deactivateInputRipple();
      });
    };
    return MDCFormFieldFoundation2;
  }(MDCFoundation);
  var foundation_default5 = MDCFormFieldFoundation;

  // node_modules/@material/mwc-formfield/mwc-formfield-base.js
  /**
   * @license
   * Copyright 2018 Google Inc. All Rights Reserved.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *     http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
  var FormfieldBase = class extends BaseElement {
    constructor() {
      super(...arguments);
      this.alignEnd = false;
      this.spaceBetween = false;
      this.nowrap = false;
      this.label = "";
      this.mdcFoundationClass = foundation_default5;
    }
    createAdapter() {
      return {
        registerInteractionHandler: (type, handler) => {
          this.labelEl.addEventListener(type, handler);
        },
        deregisterInteractionHandler: (type, handler) => {
          this.labelEl.removeEventListener(type, handler);
        },
        activateInputRipple: async () => {
          const input = this.input;
          if (input instanceof FormElement) {
            const ripple = await input.ripple;
            if (ripple) {
              ripple.startPress();
            }
          }
        },
        deactivateInputRipple: async () => {
          const input = this.input;
          if (input instanceof FormElement) {
            const ripple = await input.ripple;
            if (ripple) {
              ripple.endPress();
            }
          }
        }
      };
    }
    get input() {
      return findAssignedElement(this.slotEl, "*");
    }
    render() {
      const classes = {
        "mdc-form-field--align-end": this.alignEnd,
        "mdc-form-field--space-between": this.spaceBetween,
        "mdc-form-field--nowrap": this.nowrap
      };
      return html`
      <div class="mdc-form-field ${classMap(classes)}">
        <slot></slot>
        <label class="mdc-label"
               @click="${this._labelClick}">${this.label}</label>
      </div>`;
    }
    _labelClick() {
      const input = this.input;
      if (input) {
        input.focus();
        input.click();
      }
    }
  };
  __decorate([
    property({type: Boolean})
  ], FormfieldBase.prototype, "alignEnd", void 0);
  __decorate([
    property({type: Boolean})
  ], FormfieldBase.prototype, "spaceBetween", void 0);
  __decorate([
    property({type: Boolean})
  ], FormfieldBase.prototype, "nowrap", void 0);
  __decorate([
    property({type: String}),
    observer(async function(label) {
      const input = this.input;
      if (input) {
        if (input.localName === "input") {
          input.setAttribute("aria-label", label);
        } else if (input instanceof FormElement) {
          await input.updateComplete;
          input.setAriaLabel(label);
        }
      }
    })
  ], FormfieldBase.prototype, "label", void 0);
  __decorate([
    query(".mdc-form-field")
  ], FormfieldBase.prototype, "mdcRoot", void 0);
  __decorate([
    query("slot")
  ], FormfieldBase.prototype, "slotEl", void 0);
  __decorate([
    query("label")
  ], FormfieldBase.prototype, "labelEl", void 0);

  // node_modules/@material/mwc-formfield/mwc-formfield-css.js
  /**
  @license
  Copyright 2018 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var style11 = css`.mdc-form-field{-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;font-family:Roboto, sans-serif;font-family:var(--mdc-typography-body2-font-family, var(--mdc-typography-font-family, Roboto, sans-serif));font-size:0.875rem;font-size:var(--mdc-typography-body2-font-size, 0.875rem);line-height:1.25rem;line-height:var(--mdc-typography-body2-line-height, 1.25rem);font-weight:400;font-weight:var(--mdc-typography-body2-font-weight, 400);letter-spacing:0.0178571429em;letter-spacing:var(--mdc-typography-body2-letter-spacing, 0.0178571429em);text-decoration:inherit;text-decoration:var(--mdc-typography-body2-text-decoration, inherit);text-transform:inherit;text-transform:var(--mdc-typography-body2-text-transform, inherit);color:rgba(0, 0, 0, 0.87);color:var(--mdc-theme-text-primary-on-background, rgba(0, 0, 0, 0.87));display:inline-flex;align-items:center;vertical-align:middle}.mdc-form-field>label{margin-left:0;margin-right:auto;padding-left:4px;padding-right:0;order:0}[dir=rtl] .mdc-form-field>label,.mdc-form-field>label[dir=rtl]{margin-left:auto;margin-right:0}[dir=rtl] .mdc-form-field>label,.mdc-form-field>label[dir=rtl]{padding-left:0;padding-right:4px}.mdc-form-field--nowrap>label{text-overflow:ellipsis;overflow:hidden;white-space:nowrap}.mdc-form-field--align-end>label{margin-left:auto;margin-right:0;padding-left:0;padding-right:4px;order:-1}[dir=rtl] .mdc-form-field--align-end>label,.mdc-form-field--align-end>label[dir=rtl]{margin-left:0;margin-right:auto}[dir=rtl] .mdc-form-field--align-end>label,.mdc-form-field--align-end>label[dir=rtl]{padding-left:4px;padding-right:0}.mdc-form-field--space-between{justify-content:space-between}.mdc-form-field--space-between>label{margin:0}[dir=rtl] .mdc-form-field--space-between>label,.mdc-form-field--space-between>label[dir=rtl]{margin:0}:host{display:inline-flex}.mdc-form-field{width:100%}::slotted(*){-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;font-family:Roboto, sans-serif;font-family:var(--mdc-typography-body2-font-family, var(--mdc-typography-font-family, Roboto, sans-serif));font-size:0.875rem;font-size:var(--mdc-typography-body2-font-size, 0.875rem);line-height:1.25rem;line-height:var(--mdc-typography-body2-line-height, 1.25rem);font-weight:400;font-weight:var(--mdc-typography-body2-font-weight, 400);letter-spacing:0.0178571429em;letter-spacing:var(--mdc-typography-body2-letter-spacing, 0.0178571429em);text-decoration:inherit;text-decoration:var(--mdc-typography-body2-text-decoration, inherit);text-transform:inherit;text-transform:var(--mdc-typography-body2-text-transform, inherit);color:rgba(0, 0, 0, 0.87);color:var(--mdc-theme-text-primary-on-background, rgba(0, 0, 0, 0.87))}::slotted(mwc-switch){margin-right:10px}[dir=rtl] ::slotted(mwc-switch),::slotted(mwc-switch)[dir=rtl]{margin-left:10px}`;

  // node_modules/@material/mwc-formfield/mwc-formfield.js
  /**
  @license
  Copyright 2018 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var Formfield = class Formfield2 extends FormfieldBase {
  };
  Formfield.styles = style11;
  Formfield = __decorate([
    customElement("mwc-formfield")
  ], Formfield);

  // node_modules/@material/mwc-checkbox/mwc-checkbox-base.js
  /**
  @license
  Copyright 2019 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var CheckboxBase = class extends FormElement {
    constructor() {
      super(...arguments);
      this.checked = false;
      this.indeterminate = false;
      this.disabled = false;
      this.value = "";
      this.reducedTouchTarget = false;
      this.animationClass = "";
      this.shouldRenderRipple = false;
      this.focused = false;
      this.mdcFoundationClass = void 0;
      this.mdcFoundation = void 0;
      this.rippleElement = null;
      this.rippleHandlers = new RippleHandlers(() => {
        this.shouldRenderRipple = true;
        this.ripple.then((v) => this.rippleElement = v);
        return this.ripple;
      });
    }
    createAdapter() {
      return {};
    }
    update(changedProperties) {
      const oldIndeterminate = changedProperties.get("indeterminate");
      const oldChecked = changedProperties.get("checked");
      const oldDisabled = changedProperties.get("disabled");
      if (oldIndeterminate !== void 0 || oldChecked !== void 0 || oldDisabled !== void 0) {
        const oldState = this.calculateAnimationStateName(!!oldChecked, !!oldIndeterminate, !!oldDisabled);
        const newState = this.calculateAnimationStateName(this.checked, this.indeterminate, this.disabled);
        this.animationClass = `${oldState}-${newState}`;
      }
      super.update(changedProperties);
    }
    calculateAnimationStateName(checked, indeterminate, disabled) {
      if (disabled) {
        return "disabled";
      } else if (indeterminate) {
        return "indeterminate";
      } else if (checked) {
        return "checked";
      } else {
        return "unchecked";
      }
    }
    renderRipple() {
      const selected = this.indeterminate || this.checked;
      return this.shouldRenderRipple ? html`
        <mwc-ripple
          .accent="${selected}"
          .disabled="${this.disabled}"
          unbounded>
        </mwc-ripple>` : "";
    }
    render() {
      const selected = this.indeterminate || this.checked;
      const classes = {
        "mdc-checkbox--disabled": this.disabled,
        "mdc-checkbox--selected": selected,
        "mdc-checkbox--touch": !this.reducedTouchTarget,
        "mdc-ripple-upgraded--background-focused": this.focused,
        "mdc-checkbox--anim-checked-indeterminate": this.animationClass == "checked-indeterminate",
        "mdc-checkbox--anim-checked-unchecked": this.animationClass == "checked-unchecked",
        "mdc-checkbox--anim-indeterminate-checked": this.animationClass == "indeterminate-checked",
        "mdc-checkbox--anim-indeterminate-unchecked": this.animationClass == "indeterminate-unchecked",
        "mdc-checkbox--anim-unchecked-checked": this.animationClass == "unchecked-checked",
        "mdc-checkbox--anim-unchecked-indeterminate": this.animationClass == "unchecked-indeterminate"
      };
      const ariaChecked = this.indeterminate ? "mixed" : void 0;
      return html`
      <div class="mdc-checkbox mdc-checkbox--upgraded ${classMap(classes)}">
        <input type="checkbox"
              class="mdc-checkbox__native-control"
              aria-checked="${ifDefined(ariaChecked)}"
              data-indeterminate="${this.indeterminate ? "true" : "false"}"
              ?disabled="${this.disabled}"
              .indeterminate="${this.indeterminate}"
              .checked="${this.checked}"
              .value="${this.value}"
              @change="${this._changeHandler}"
              @focus="${this._handleFocus}"
              @blur="${this._handleBlur}"
              @mousedown="${this.handleRippleMouseDown}"
              @mouseenter="${this.handleRippleMouseEnter}"
              @mouseleave="${this.handleRippleMouseLeave}"
              @touchstart="${this.handleRippleTouchStart}"
              @touchend="${this.handleRippleDeactivate}"
              @touchcancel="${this.handleRippleDeactivate}">
        <div class="mdc-checkbox__background"
          @animationend="${this.resetAnimationClass}">
          <svg class="mdc-checkbox__checkmark"
              viewBox="0 0 24 24">
            <path class="mdc-checkbox__checkmark-path"
                  fill="none"
                  d="M1.73,12.91 8.1,19.28 22.79,4.59"></path>
          </svg>
          <div class="mdc-checkbox__mixedmark"></div>
        </div>
        ${this.renderRipple()}
      </div>`;
    }
    _handleFocus() {
      this.focused = true;
      this.handleRippleFocus();
    }
    _handleBlur() {
      this.focused = false;
      this.handleRippleBlur();
    }
    handleRippleMouseDown(event) {
      const onUp = () => {
        window.removeEventListener("mouseup", onUp);
        this.handleRippleDeactivate();
      };
      window.addEventListener("mouseup", onUp);
      this.rippleHandlers.startPress(event);
    }
    handleRippleTouchStart(event) {
      this.rippleHandlers.startPress(event);
    }
    handleRippleDeactivate() {
      this.rippleHandlers.endPress();
    }
    handleRippleMouseEnter() {
      this.rippleHandlers.startHover();
    }
    handleRippleMouseLeave() {
      this.rippleHandlers.endHover();
    }
    handleRippleFocus() {
      this.rippleHandlers.startFocus();
    }
    handleRippleBlur() {
      this.rippleHandlers.endFocus();
    }
    _changeHandler() {
      this.checked = this.formElement.checked;
      this.indeterminate = this.formElement.indeterminate;
    }
    resetAnimationClass() {
      this.animationClass = "";
    }
    get isRippleActive() {
      var _a2;
      return ((_a2 = this.rippleElement) === null || _a2 === void 0 ? void 0 : _a2.isActive) || false;
    }
  };
  __decorate([
    query(".mdc-checkbox")
  ], CheckboxBase.prototype, "mdcRoot", void 0);
  __decorate([
    query("input")
  ], CheckboxBase.prototype, "formElement", void 0);
  __decorate([
    property({type: Boolean, reflect: true})
  ], CheckboxBase.prototype, "checked", void 0);
  __decorate([
    property({type: Boolean})
  ], CheckboxBase.prototype, "indeterminate", void 0);
  __decorate([
    property({type: Boolean, reflect: true})
  ], CheckboxBase.prototype, "disabled", void 0);
  __decorate([
    property({type: String})
  ], CheckboxBase.prototype, "value", void 0);
  __decorate([
    property({type: Boolean})
  ], CheckboxBase.prototype, "reducedTouchTarget", void 0);
  __decorate([
    internalProperty()
  ], CheckboxBase.prototype, "animationClass", void 0);
  __decorate([
    internalProperty()
  ], CheckboxBase.prototype, "shouldRenderRipple", void 0);
  __decorate([
    internalProperty()
  ], CheckboxBase.prototype, "focused", void 0);
  __decorate([
    queryAsync("mwc-ripple")
  ], CheckboxBase.prototype, "ripple", void 0);
  __decorate([
    eventOptions({passive: true})
  ], CheckboxBase.prototype, "handleRippleTouchStart", null);

  // node_modules/@material/mwc-checkbox/mwc-checkbox-css.js
  /**
  @license
  Copyright 2018 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var style12 = css`.mdc-checkbox{padding:11px;margin-top:0px;margin-bottom:0px;margin-right:0px;margin-left:0px}.mdc-checkbox .mdc-checkbox__ripple::before,.mdc-checkbox .mdc-checkbox__ripple::after{background-color:#000;background-color:var(--mdc-ripple-color, #000)}.mdc-checkbox:hover .mdc-checkbox__ripple::before,.mdc-checkbox.mdc-ripple-surface--hover .mdc-checkbox__ripple::before{opacity:0.04;opacity:var(--mdc-ripple-hover-opacity, 0.04)}.mdc-checkbox.mdc-ripple-upgraded--background-focused .mdc-checkbox__ripple::before,.mdc-checkbox:not(.mdc-ripple-upgraded):focus .mdc-checkbox__ripple::before{transition-duration:75ms;opacity:0.12;opacity:var(--mdc-ripple-focus-opacity, 0.12)}.mdc-checkbox:not(.mdc-ripple-upgraded) .mdc-checkbox__ripple::after{transition:opacity 150ms linear}.mdc-checkbox:not(.mdc-ripple-upgraded):active .mdc-checkbox__ripple::after{transition-duration:75ms;opacity:0.12;opacity:var(--mdc-ripple-press-opacity, 0.12)}.mdc-checkbox.mdc-ripple-upgraded{--mdc-ripple-fg-opacity: var(--mdc-ripple-press-opacity, 0.12)}.mdc-checkbox .mdc-checkbox__native-control:checked~.mdc-checkbox__background::before,.mdc-checkbox .mdc-checkbox__native-control:indeterminate~.mdc-checkbox__background::before,.mdc-checkbox .mdc-checkbox__native-control[data-indeterminate=true]~.mdc-checkbox__background::before{background-color:#018786;background-color:var(--mdc-theme-secondary, #018786)}.mdc-checkbox.mdc-checkbox--selected .mdc-checkbox__ripple::before,.mdc-checkbox.mdc-checkbox--selected .mdc-checkbox__ripple::after{background-color:#018786;background-color:var(--mdc-ripple-color, var(--mdc-theme-secondary, #018786))}.mdc-checkbox.mdc-checkbox--selected:hover .mdc-checkbox__ripple::before,.mdc-checkbox.mdc-checkbox--selected.mdc-ripple-surface--hover .mdc-checkbox__ripple::before{opacity:0.04;opacity:var(--mdc-ripple-hover-opacity, 0.04)}.mdc-checkbox.mdc-checkbox--selected.mdc-ripple-upgraded--background-focused .mdc-checkbox__ripple::before,.mdc-checkbox.mdc-checkbox--selected:not(.mdc-ripple-upgraded):focus .mdc-checkbox__ripple::before{transition-duration:75ms;opacity:0.12;opacity:var(--mdc-ripple-focus-opacity, 0.12)}.mdc-checkbox.mdc-checkbox--selected:not(.mdc-ripple-upgraded) .mdc-checkbox__ripple::after{transition:opacity 150ms linear}.mdc-checkbox.mdc-checkbox--selected:not(.mdc-ripple-upgraded):active .mdc-checkbox__ripple::after{transition-duration:75ms;opacity:0.12;opacity:var(--mdc-ripple-press-opacity, 0.12)}.mdc-checkbox.mdc-checkbox--selected.mdc-ripple-upgraded{--mdc-ripple-fg-opacity: var(--mdc-ripple-press-opacity, 0.12)}.mdc-checkbox.mdc-ripple-upgraded--background-focused.mdc-checkbox--selected .mdc-checkbox__ripple::before,.mdc-checkbox.mdc-ripple-upgraded--background-focused.mdc-checkbox--selected .mdc-checkbox__ripple::after{background-color:#018786;background-color:var(--mdc-ripple-color, var(--mdc-theme-secondary, #018786))}.mdc-checkbox .mdc-checkbox__background{top:11px;left:11px}.mdc-checkbox .mdc-checkbox__background::before{top:-13px;left:-13px;width:40px;height:40px}.mdc-checkbox .mdc-checkbox__native-control{top:0px;right:0px;left:0px;width:40px;height:40px}.mdc-checkbox .mdc-checkbox__native-control:enabled:not(:checked):not(:indeterminate):not([data-indeterminate=true])~.mdc-checkbox__background{border-color:rgba(0, 0, 0, 0.54);border-color:var(--mdc-checkbox-unchecked-color, rgba(0, 0, 0, 0.54));background-color:transparent}.mdc-checkbox .mdc-checkbox__native-control:enabled:checked~.mdc-checkbox__background,.mdc-checkbox .mdc-checkbox__native-control:enabled:indeterminate~.mdc-checkbox__background,.mdc-checkbox .mdc-checkbox__native-control[data-indeterminate=true]:enabled~.mdc-checkbox__background{border-color:#018786;border-color:var(--mdc-checkbox-checked-color, var(--mdc-theme-secondary, #018786));background-color:#018786;background-color:var(--mdc-checkbox-checked-color, var(--mdc-theme-secondary, #018786))}@keyframes mdc-checkbox-fade-in-background-8A000000FF01878600000000FF018786{0%{border-color:rgba(0, 0, 0, 0.54);border-color:var(--mdc-checkbox-unchecked-color, rgba(0, 0, 0, 0.54));background-color:transparent}50%{border-color:#018786;border-color:var(--mdc-checkbox-checked-color, var(--mdc-theme-secondary, #018786));background-color:#018786;background-color:var(--mdc-checkbox-checked-color, var(--mdc-theme-secondary, #018786))}}@keyframes mdc-checkbox-fade-out-background-8A000000FF01878600000000FF018786{0%,80%{border-color:#018786;border-color:var(--mdc-checkbox-checked-color, var(--mdc-theme-secondary, #018786));background-color:#018786;background-color:var(--mdc-checkbox-checked-color, var(--mdc-theme-secondary, #018786))}100%{border-color:rgba(0, 0, 0, 0.54);border-color:var(--mdc-checkbox-unchecked-color, rgba(0, 0, 0, 0.54));background-color:transparent}}.mdc-checkbox.mdc-checkbox--anim-unchecked-checked .mdc-checkbox__native-control:enabled~.mdc-checkbox__background,.mdc-checkbox.mdc-checkbox--anim-unchecked-indeterminate .mdc-checkbox__native-control:enabled~.mdc-checkbox__background{animation-name:mdc-checkbox-fade-in-background-8A000000FF01878600000000FF018786}.mdc-checkbox.mdc-checkbox--anim-checked-unchecked .mdc-checkbox__native-control:enabled~.mdc-checkbox__background,.mdc-checkbox.mdc-checkbox--anim-indeterminate-unchecked .mdc-checkbox__native-control:enabled~.mdc-checkbox__background{animation-name:mdc-checkbox-fade-out-background-8A000000FF01878600000000FF018786}.mdc-checkbox .mdc-checkbox__native-control[disabled]:not(:checked):not(:indeterminate):not([data-indeterminate=true])~.mdc-checkbox__background{border-color:rgba(0, 0, 0, 0.38);border-color:var(--mdc-checkbox-disabled-color, rgba(0, 0, 0, 0.38));background-color:transparent}.mdc-checkbox .mdc-checkbox__native-control[disabled]:checked~.mdc-checkbox__background,.mdc-checkbox .mdc-checkbox__native-control[disabled]:indeterminate~.mdc-checkbox__background,.mdc-checkbox .mdc-checkbox__native-control[data-indeterminate=true][disabled]~.mdc-checkbox__background{border-color:transparent;background-color:rgba(0, 0, 0, 0.38);background-color:var(--mdc-checkbox-disabled-color, rgba(0, 0, 0, 0.38))}.mdc-checkbox .mdc-checkbox__native-control:enabled~.mdc-checkbox__background .mdc-checkbox__checkmark{color:#fff;color:var(--mdc-checkbox-ink-color, #fff)}.mdc-checkbox .mdc-checkbox__native-control:enabled~.mdc-checkbox__background .mdc-checkbox__mixedmark{border-color:#fff;border-color:var(--mdc-checkbox-ink-color, #fff)}.mdc-checkbox .mdc-checkbox__native-control:disabled~.mdc-checkbox__background .mdc-checkbox__checkmark{color:#fff;color:var(--mdc-checkbox-ink-color, #fff)}.mdc-checkbox .mdc-checkbox__native-control:disabled~.mdc-checkbox__background .mdc-checkbox__mixedmark{border-color:#fff;border-color:var(--mdc-checkbox-ink-color, #fff)}.mdc-touch-target-wrapper{display:inline}@keyframes mdc-checkbox-unchecked-checked-checkmark-path{0%,50%{stroke-dashoffset:29.7833385}50%{animation-timing-function:cubic-bezier(0, 0, 0.2, 1)}100%{stroke-dashoffset:0}}@keyframes mdc-checkbox-unchecked-indeterminate-mixedmark{0%,68.2%{transform:scaleX(0)}68.2%{animation-timing-function:cubic-bezier(0, 0, 0, 1)}100%{transform:scaleX(1)}}@keyframes mdc-checkbox-checked-unchecked-checkmark-path{from{animation-timing-function:cubic-bezier(0.4, 0, 1, 1);opacity:1;stroke-dashoffset:0}to{opacity:0;stroke-dashoffset:-29.7833385}}@keyframes mdc-checkbox-checked-indeterminate-checkmark{from{animation-timing-function:cubic-bezier(0, 0, 0.2, 1);transform:rotate(0deg);opacity:1}to{transform:rotate(45deg);opacity:0}}@keyframes mdc-checkbox-indeterminate-checked-checkmark{from{animation-timing-function:cubic-bezier(0.14, 0, 0, 1);transform:rotate(45deg);opacity:0}to{transform:rotate(360deg);opacity:1}}@keyframes mdc-checkbox-checked-indeterminate-mixedmark{from{animation-timing-function:mdc-animation-deceleration-curve-timing-function;transform:rotate(-45deg);opacity:0}to{transform:rotate(0deg);opacity:1}}@keyframes mdc-checkbox-indeterminate-checked-mixedmark{from{animation-timing-function:cubic-bezier(0.14, 0, 0, 1);transform:rotate(0deg);opacity:1}to{transform:rotate(315deg);opacity:0}}@keyframes mdc-checkbox-indeterminate-unchecked-mixedmark{0%{animation-timing-function:linear;transform:scaleX(1);opacity:1}32.8%,100%{transform:scaleX(0);opacity:0}}.mdc-checkbox{display:inline-block;position:relative;flex:0 0 18px;box-sizing:content-box;width:18px;height:18px;line-height:0;white-space:nowrap;cursor:pointer;vertical-align:bottom}@media screen and (-ms-high-contrast: active){.mdc-checkbox__native-control[disabled]:not(:checked):not(:indeterminate):not([data-indeterminate=true])~.mdc-checkbox__background{border-color:GrayText;border-color:var(--mdc-checkbox-disabled-color, GrayText);background-color:transparent}.mdc-checkbox__native-control[disabled]:checked~.mdc-checkbox__background,.mdc-checkbox__native-control[disabled]:indeterminate~.mdc-checkbox__background,.mdc-checkbox__native-control[data-indeterminate=true][disabled]~.mdc-checkbox__background{border-color:GrayText;background-color:transparent;background-color:var(--mdc-checkbox-disabled-color, transparent)}.mdc-checkbox__native-control:disabled~.mdc-checkbox__background .mdc-checkbox__checkmark{color:GrayText;color:var(--mdc-checkbox-ink-color, GrayText)}.mdc-checkbox__native-control:disabled~.mdc-checkbox__background .mdc-checkbox__mixedmark{border-color:GrayText;border-color:var(--mdc-checkbox-ink-color, GrayText)}.mdc-checkbox__mixedmark{margin:0 1px}}.mdc-checkbox--disabled{cursor:default;pointer-events:none}.mdc-checkbox__background{display:inline-flex;position:absolute;align-items:center;justify-content:center;box-sizing:border-box;width:18px;height:18px;border:2px solid currentColor;border-radius:2px;background-color:transparent;pointer-events:none;will-change:background-color,border-color;transition:background-color 90ms 0ms cubic-bezier(0.4, 0, 0.6, 1),border-color 90ms 0ms cubic-bezier(0.4, 0, 0.6, 1)}.mdc-checkbox__background .mdc-checkbox__background::before{background-color:#000;background-color:var(--mdc-theme-on-surface, #000)}.mdc-checkbox__checkmark{position:absolute;top:0;right:0;bottom:0;left:0;width:100%;opacity:0;transition:opacity 180ms 0ms cubic-bezier(0.4, 0, 0.6, 1)}.mdc-checkbox--upgraded .mdc-checkbox__checkmark{opacity:1}.mdc-checkbox__checkmark-path{transition:stroke-dashoffset 180ms 0ms cubic-bezier(0.4, 0, 0.6, 1);stroke:currentColor;stroke-width:3.12px;stroke-dashoffset:29.7833385;stroke-dasharray:29.7833385}.mdc-checkbox__mixedmark{width:100%;height:0;transform:scaleX(0) rotate(0deg);border-width:1px;border-style:solid;opacity:0;transition:opacity 90ms 0ms cubic-bezier(0.4, 0, 0.6, 1),transform 90ms 0ms cubic-bezier(0.4, 0, 0.6, 1)}.mdc-checkbox--anim-unchecked-checked .mdc-checkbox__background,.mdc-checkbox--anim-unchecked-indeterminate .mdc-checkbox__background,.mdc-checkbox--anim-checked-unchecked .mdc-checkbox__background,.mdc-checkbox--anim-indeterminate-unchecked .mdc-checkbox__background{animation-duration:180ms;animation-timing-function:linear}.mdc-checkbox--anim-unchecked-checked .mdc-checkbox__checkmark-path{animation:mdc-checkbox-unchecked-checked-checkmark-path 180ms linear 0s;transition:none}.mdc-checkbox--anim-unchecked-indeterminate .mdc-checkbox__mixedmark{animation:mdc-checkbox-unchecked-indeterminate-mixedmark 90ms linear 0s;transition:none}.mdc-checkbox--anim-checked-unchecked .mdc-checkbox__checkmark-path{animation:mdc-checkbox-checked-unchecked-checkmark-path 90ms linear 0s;transition:none}.mdc-checkbox--anim-checked-indeterminate .mdc-checkbox__checkmark{animation:mdc-checkbox-checked-indeterminate-checkmark 90ms linear 0s;transition:none}.mdc-checkbox--anim-checked-indeterminate .mdc-checkbox__mixedmark{animation:mdc-checkbox-checked-indeterminate-mixedmark 90ms linear 0s;transition:none}.mdc-checkbox--anim-indeterminate-checked .mdc-checkbox__checkmark{animation:mdc-checkbox-indeterminate-checked-checkmark 500ms linear 0s;transition:none}.mdc-checkbox--anim-indeterminate-checked .mdc-checkbox__mixedmark{animation:mdc-checkbox-indeterminate-checked-mixedmark 500ms linear 0s;transition:none}.mdc-checkbox--anim-indeterminate-unchecked .mdc-checkbox__mixedmark{animation:mdc-checkbox-indeterminate-unchecked-mixedmark 300ms linear 0s;transition:none}.mdc-checkbox__native-control:checked~.mdc-checkbox__background,.mdc-checkbox__native-control:indeterminate~.mdc-checkbox__background,.mdc-checkbox__native-control[data-indeterminate=true]~.mdc-checkbox__background{transition:border-color 90ms 0ms cubic-bezier(0, 0, 0.2, 1),background-color 90ms 0ms cubic-bezier(0, 0, 0.2, 1)}.mdc-checkbox__native-control:checked~.mdc-checkbox__background .mdc-checkbox__checkmark-path,.mdc-checkbox__native-control:indeterminate~.mdc-checkbox__background .mdc-checkbox__checkmark-path,.mdc-checkbox__native-control[data-indeterminate=true]~.mdc-checkbox__background .mdc-checkbox__checkmark-path{stroke-dashoffset:0}.mdc-checkbox__background::before{position:absolute;transform:scale(0, 0);border-radius:50%;opacity:0;pointer-events:none;content:"";will-change:opacity,transform;transition:opacity 90ms 0ms cubic-bezier(0.4, 0, 0.6, 1),transform 90ms 0ms cubic-bezier(0.4, 0, 0.6, 1)}.mdc-checkbox__native-control:focus~.mdc-checkbox__background::before{transform:scale(1);opacity:.12;transition:opacity 80ms 0ms cubic-bezier(0, 0, 0.2, 1),transform 80ms 0ms cubic-bezier(0, 0, 0.2, 1)}.mdc-checkbox__native-control{position:absolute;margin:0;padding:0;opacity:0;cursor:inherit}.mdc-checkbox__native-control:disabled{cursor:default;pointer-events:none}.mdc-checkbox--touch{margin-top:4px;margin-bottom:4px;margin-right:4px;margin-left:4px}.mdc-checkbox--touch .mdc-checkbox__native-control{top:-4px;right:-4px;left:-4px;width:48px;height:48px}.mdc-checkbox__native-control:checked~.mdc-checkbox__background .mdc-checkbox__checkmark{transition:opacity 180ms 0ms cubic-bezier(0, 0, 0.2, 1),transform 180ms 0ms cubic-bezier(0, 0, 0.2, 1);opacity:1}.mdc-checkbox__native-control:checked~.mdc-checkbox__background .mdc-checkbox__mixedmark{transform:scaleX(1) rotate(-45deg)}.mdc-checkbox__native-control:indeterminate~.mdc-checkbox__background .mdc-checkbox__checkmark,.mdc-checkbox__native-control[data-indeterminate=true]~.mdc-checkbox__background .mdc-checkbox__checkmark{transform:rotate(45deg);opacity:0;transition:opacity 90ms 0ms cubic-bezier(0.4, 0, 0.6, 1),transform 90ms 0ms cubic-bezier(0.4, 0, 0.6, 1)}.mdc-checkbox__native-control:indeterminate~.mdc-checkbox__background .mdc-checkbox__mixedmark,.mdc-checkbox__native-control[data-indeterminate=true]~.mdc-checkbox__background .mdc-checkbox__mixedmark{transform:scaleX(1) rotate(0deg);opacity:1}.mdc-checkbox.mdc-checkbox--upgraded .mdc-checkbox__background,.mdc-checkbox.mdc-checkbox--upgraded .mdc-checkbox__checkmark,.mdc-checkbox.mdc-checkbox--upgraded .mdc-checkbox__checkmark-path,.mdc-checkbox.mdc-checkbox--upgraded .mdc-checkbox__mixedmark{transition:none}:host{outline:none;display:inline-flex;-webkit-tap-highlight-color:transparent}.mdc-checkbox .mdc-checkbox__background::before{content:none}`;

  // node_modules/@material/mwc-checkbox/mwc-checkbox.js
  /**
  @license
  Copyright 2018 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var Checkbox = class Checkbox2 extends CheckboxBase {
  };
  Checkbox.styles = style12;
  Checkbox = __decorate([
    customElement("mwc-checkbox")
  ], Checkbox);

  // lib/load-functions.js
  var FUNCTIONS_FILE = "data/functions.txt";
  var OFFSETS_BASE_URL = "https://raw.githubusercontent.com/irdkwia/eos-move-effects/master/lib/";
  var OFFSETS_EU_FILES = [
    "dunlib_eu.asm",
    "stdlib_eu.asm"
  ];
  var OFFSETS_US_FILES = [
    "dunlib_us.asm",
    "stdlib_us.asm"
  ];
  function parseFunctions(functionsFile) {
    let functions = new Map();
    let lines = functionsFile.split("\n");
    for (const line of lines) {
      if (line.trim() === "" || line.startsWith("//")) {
        continue;
      }
      let [nameAndReturnDefinition, argsString] = line.split("(");
      let returnDefinition, functionName;
      if (nameAndReturnDefinition.includes("=")) {
        [returnDefinition, functionName] = nameAndReturnDefinition.split("=");
      } else {
        functionName = nameAndReturnDefinition;
      }
      let [returnValueName, returnTypeAndAnnotation] = returnDefinition ? returnDefinition.split(":") : [null, null];
      let [returnType, returnAnnotation] = returnTypeAndAnnotation ? returnTypeAndAnnotation.split("|") : [null, null];
      let argsWithType = argsString.trimRight().substr(0, argsString.trimRight().length - 1).split(",");
      let args = argsWithType.map((arg) => {
        let [argDefinition, defaultValue] = arg.split("=");
        let [argName, typeAndAnnotation] = argDefinition.split(":");
        let [type, annotation] = typeAndAnnotation.split("|");
        let trimmedDefaultValue = defaultValue ? defaultValue.trim() : 0;
        let numericDefaultValue;
        if (trimmedDefaultValue === "true") {
          numericDefaultValue = 1;
        } else if (trimmedDefaultValue === "false") {
          numericDefaultValue = 0;
        } else {
          numericDefaultValue = parseInt(trimmedDefaultValue);
        }
        return {
          name: argName.trim(),
          type: type.trim(),
          annotation: annotation ? annotation.trim() : void 0,
          defaultValue: numericDefaultValue
        };
      });
      functions.set(functionName.trim(), {
        name: functionName.trim(),
        args,
        returnValue: returnType ? {
          name: returnValueName ? returnValueName.trim() : void 0,
          type: returnType ? returnType.trim() : void 0,
          annotation: returnAnnotation ? returnAnnotation.trim() : void 0
        } : void 0,
        offsets: {eu: 0, us: 0}
      });
    }
    return functions;
  }
  function parseOffsets(functions, offsetFiles) {
    for (const {region, file} of offsetFiles) {
      for (const line of file.split("\n")) {
        if (!line.startsWith(".definelabel ")) {
          continue;
        }
        let [name, offset] = line.substr(".definelabel ".length).split(",");
        let func = functions.get(name.trim());
        if (!func) {
          continue;
        }
        func.offsets[region] = parseInt(offset.trim());
      }
    }
  }
  async function loadAndParseFunctions() {
    try {
      let functionsResponse = await fetch(FUNCTIONS_FILE);
      if (!functionsResponse.ok) {
        throw new Error("Returned an error code.");
      }
      let functionsFile = await functionsResponse.text();
      let offsetFiles = [];
      for (const offsetFilePath of [...OFFSETS_EU_FILES, ...OFFSETS_US_FILES]) {
        let offsetsResponse = await fetch(OFFSETS_BASE_URL + offsetFilePath);
        if (!offsetsResponse.ok) {
          throw new Error("Returned an error code.");
        }
        offsetFiles.push({
          region: OFFSETS_EU_FILES.includes(offsetFilePath) ? "eu" : "us",
          file: await offsetsResponse.text()
        });
      }
      let functions = parseFunctions(functionsFile);
      parseOffsets(functions, offsetFiles);
      return functions;
    } catch (e) {
      console.error(e);
      alert("Failed to load data, please try reloading the page.");
    }
  }

  // lib/code-template.js
  var MAX_SIZE = 9624;
  var START_ADDRESS = {
    us: 36897076,
    eu: 36899700
  };
  var JUMP_ADDRESS = {
    us: 36906700,
    eu: 36909324
  };
  function insertCodeIntoTemplate(codeLines, region, r10ReturnValue) {
    return `; Template based on https://github.com/irdkwia/eos-move-effects/blob/master/template.asm
.relativeinclude on
.nds
.arm

.definelabel MaxSize, 0x${MAX_SIZE.toString(16)}

.include "lib/stdlib_${region}.asm"
.include "lib/dunlib_${region}.asm"
.definelabel MoveStartAddress, 0x${START_ADDRESS[region]}
.definelabel MoveJumpAddress, 0x${JUMP_ADDRESS[region]}

; File creation
.create "./code_out.bin", 0x${START_ADDRESS[region]}
  .org MoveStartAddress
  .area MaxSize ; Define the size of the area
    
    ; Code here
    ${codeLines.join("\n    ")}
    
  end:
    ; Always branch at the end
    ${r10ReturnValue ? "mov r10, #1" : ""}
    b MoveJumpAddress
    .pool
  .endarea
.close
`;
  }

  // lib/code-model-event.js
  var CodeModelEvent = class {
    constructor() {
      this._listeners = [];
    }
    addListener(listener, bindThis) {
      this._listeners.push(listener);
    }
    removeListener(listener) {
      let index = this._listeners.indexOf(listener);
      if (index > -1) {
        this._listeners.splice(index, 1);
      }
    }
    removeAllListeners() {
      this._listeners.splice(0, this._listeners.length);
    }
    emit(value = void 0) {
      for (const listener of this._listeners) {
        if (listener) {
          listener(value);
        }
      }
    }
  };

  // lib/nodes/node-handler-base.js
  var NodeHandlerBase = class {
    validate(node) {
      return void 0;
    }
    generateCode(node, lines) {
    }
    getDescription(node) {
      return "";
    }
  };

  // lib/nodes/meta.js
  function createMeta(props) {
    let {region, r10ReturnValue} = props;
    return {region, r10ReturnValue};
  }
  var MetaHandler = class extends NodeHandlerBase {
    validate(node) {
      return void 0;
    }
  };

  // lib/nodes/shared.js
  function loadInput(input, index, commentFormatFunction) {
    let comment = commentFormatFunction(input, index);
    let value;
    switch (input.type) {
      case "int":
      case "bool": {
        switch (input.value.kind) {
          case "constant":
            value = `#${input.value.constantValue}`;
            break;
          case "last-result":
            value = "r0";
            break;
        }
        break;
      }
      case "user":
        value = "r9";
        break;
      case "target":
        value = "r4";
        break;
      case "moveData":
        value = "r8";
        break;
    }
    if (index < 4) {
      let register = `r${index}`;
      if (register === value) {
        return `; No need to mov ${register} into itself ; ${comment}`;
      }
      return `mov ${register}, ${value}; ${comment}`;
    } else {
      return `; WARNING: Stack arguments are not yet supported ; ${comment}`;
    }
  }
  function loadInputs(node, lines, commentFormatFunction = (input, index) => `input #${index} ${input.name}`) {
    let inputs = node.data.inputs;
    for (let i = 0; i < inputs.length; i++) {
      let input = inputs[i];
      if (input.value.kind === "last-result") {
        let line = loadInput(input, i, commentFormatFunction);
        if (line) {
          lines.push(line);
        }
      }
    }
    for (let i = 0; i < inputs.length; i++) {
      let input = inputs[i];
      if (input.value.kind !== "last-result") {
        let line = loadInput(input, i, commentFormatFunction);
        if (line) {
          lines.push(line);
        }
      }
    }
  }

  // lib/nodes/call.js
  function createCall(props) {
    let {func} = props;
    let inputs = func.args.map((arg) => ({...arg, value: {kind: "constant", constantValue: arg.defaultValue}}));
    return {
      description: `Call function "${func.name}"`,
      inputs,
      outputs: func.returnValue ? [func.returnValue] : [],
      func
    };
  }
  var CallHandler = class extends NodeHandlerBase {
    validate(node) {
      return void 0;
    }
    generateCode(node, lines) {
      let commentFormatFunction = (input, index) => `argument #${index} ${input.name}`;
      loadInputs(node, lines, commentFormatFunction);
      lines.push(`bl ${node.data.func.name}`);
      lines.push("");
    }
  };

  // lib/nodes/arithmetic.js
  function createArithmetic(props, description) {
    return {
      description,
      inputs: [{
        name: "Operand 1",
        type: "int",
        value: {
          constantValue: 0,
          kind: "last-result"
        }
      }, {
        name: "Operand 2",
        type: "int",
        value: {
          constantValue: 0,
          kind: "constant"
        }
      }],
      outputs: [{
        name: "Result",
        type: "int"
      }]
    };
  }
  function createAddition(props) {
    return createArithmetic(props, "Addition");
  }
  function createSubtraction(props) {
    return createArithmetic(props, "Subtraction");
  }
  function createMultiplication(props) {
    return createArithmetic(props, "Multiplication");
  }
  function createDivision(props) {
    return createArithmetic(props, "Division");
  }
  var ArithmeticHandler = class extends NodeHandlerBase {
    generateCode(node, lines) {
      let commentFormatFunction = (input, index) => input.name;
      loadInputs(node, lines, commentFormatFunction);
      lines.push(`${this.instruction} r0, r0, r1`);
      lines.push("");
    }
    get instruction() {
      return new Error("Not implemented");
    }
  };
  var AdditionHandler = class extends ArithmeticHandler {
    get instruction() {
      return "add";
    }
  };
  var SubtractionHandler = class extends ArithmeticHandler {
    get instruction() {
      return "sub";
    }
  };
  var MultiplicationHandler = class extends ArithmeticHandler {
    get instruction() {
      return "mul";
    }
  };
  var DivisionHandler = class extends ArithmeticHandler {
    get instruction() {
      return "div";
    }
  };

  // lib/code-model.js
  var NODE_MAP = {
    meta: ["Settings", createMeta, new MetaHandler()],
    add: ["Add", createAddition, new AdditionHandler()],
    sub: ["Subtract", createSubtraction, new SubtractionHandler()],
    mul: ["Multiply", createMultiplication, new MultiplicationHandler()],
    div: ["Divide", createDivision, new DivisionHandler()],
    call: ["Call", createCall, new CallHandler()]
  };
  var CodeModel = class {
    constructor(functions, region = "us", verboseLogging = true) {
      this.functions = functions;
      this.region = region;
      this.r10ReturnValue = false;
      this.verboseLogging = verboseLogging;
      this.onNodeAdded = new CodeModelEvent();
      this.onNodeUpdated = new CodeModelEvent();
      this.onNodeRemoved = new CodeModelEvent();
      this.onChanged = new CodeModelEvent();
      let metaNode = this._createNode("meta");
      this.head = metaNode;
      this.tail = metaNode;
    }
    generateCode() {
      let codeLines = [];
      let current = this.head;
      while (current = current.next) {
        getNodeHandler(current).generateCode(current, codeLines);
      }
      return insertCodeIntoTemplate(codeLines, this.region, this.r10ReturnValue);
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
      return this.addNode("call", {func});
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
        prev: void 0,
        next: void 0,
        data: factory(props),
        onUpdated: new CodeModelEvent()
      };
      this._log("Created node: ", node);
      return node;
    }
    _log(...args) {
      if (this.verboseLogging) {
        console.log(...args);
      }
    }
  };
  function getNodeMapValue(type) {
    let data = NODE_MAP[type];
    if (!data) {
      throw new Error(`Unknown node '${type}'.`);
    }
    return data;
  }
  function getNodeTypeName(typeId) {
    let [name] = getNodeMapValue(typeId);
    return name;
  }
  function getNodeHandler(node) {
    let [, , handler] = getNodeMapValue(node.type);
    return handler;
  }

  // ui/block-menu.js
  var EXCLUDED_NODE_TYPES = ["meta", "call"];
  var BlockMenu = class extends LitElement {
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
      this.nodeTypes = Object.keys(NODE_MAP).filter((type) => !EXCLUDED_NODE_TYPES.includes(type));
    }
    show() {
      this.shadowRoot.querySelector("mwc-menu").show();
    }
    _addNode(evt) {
      this.codeModel.addNode(evt.target.value);
    }
    _addCallNode(evt) {
      this.codeModel.addCallNode(evt.target.value);
    }
    render() {
      console.log(this.nodeType);
      return html`
<mwc-menu>
${this.nodeTypes.map((item) => html`
  <mwc-list-item group="default" @click="${this._addNode}" 
    value=${item}>${getNodeTypeName(item)}</mwc-list-item>`)}

  <li divider role="seperator"></li>

  ${this.functions.map((item) => html`
    <mwc-list-item group="functions" @click="${this._addCallNode}" 
      value=${item}>${item}</mwc-list-item>`)}
</mwc-menu>
`;
    }
  };
  customElements.define("block-menu", BlockMenu);

  // node_modules/@material/mwc-icon-button/mwc-icon-button-base.js
  /**
  @license
  Copyright 2018 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var IconButtonBase = class extends LitElement {
    constructor() {
      super(...arguments);
      this.disabled = false;
      this.icon = "";
      this.label = "";
      this.shouldRenderRipple = false;
      this.rippleHandlers = new RippleHandlers(() => {
        this.shouldRenderRipple = true;
        return this.ripple;
      });
    }
    renderRipple() {
      return this.shouldRenderRipple ? html`
            <mwc-ripple
                .disabled="${this.disabled}"
                unbounded>
            </mwc-ripple>` : "";
    }
    focus() {
      const buttonElement = this.buttonElement;
      if (buttonElement) {
        this.rippleHandlers.startFocus();
        buttonElement.focus();
      }
    }
    blur() {
      const buttonElement = this.buttonElement;
      if (buttonElement) {
        this.rippleHandlers.endFocus();
        buttonElement.blur();
      }
    }
    render() {
      return html`<button
        class="mdc-icon-button"
        aria-label="${this.label || this.icon}"
        ?disabled="${this.disabled}"
        @focus="${this.handleRippleFocus}"
        @blur="${this.handleRippleBlur}"
        @mousedown="${this.handleRippleMouseDown}"
        @mouseenter="${this.handleRippleMouseEnter}"
        @mouseleave="${this.handleRippleMouseLeave}"
        @touchstart="${this.handleRippleTouchStart}"
        @touchend="${this.handleRippleDeactivate}"
        @touchcancel="${this.handleRippleDeactivate}">
      ${this.renderRipple()}
    <i class="material-icons">${this.icon}</i>
    <span class="default-slot-container">
        <slot></slot>
    </span>
  </button>`;
    }
    handleRippleMouseDown(event) {
      const onUp = () => {
        window.removeEventListener("mouseup", onUp);
        this.handleRippleDeactivate();
      };
      window.addEventListener("mouseup", onUp);
      this.rippleHandlers.startPress(event);
    }
    handleRippleTouchStart(event) {
      this.rippleHandlers.startPress(event);
    }
    handleRippleDeactivate() {
      this.rippleHandlers.endPress();
    }
    handleRippleMouseEnter() {
      this.rippleHandlers.startHover();
    }
    handleRippleMouseLeave() {
      this.rippleHandlers.endHover();
    }
    handleRippleFocus() {
      this.rippleHandlers.startFocus();
    }
    handleRippleBlur() {
      this.rippleHandlers.endFocus();
    }
  };
  __decorate([
    property({type: Boolean, reflect: true})
  ], IconButtonBase.prototype, "disabled", void 0);
  __decorate([
    property({type: String})
  ], IconButtonBase.prototype, "icon", void 0);
  __decorate([
    property({type: String})
  ], IconButtonBase.prototype, "label", void 0);
  __decorate([
    query("button")
  ], IconButtonBase.prototype, "buttonElement", void 0);
  __decorate([
    queryAsync("mwc-ripple")
  ], IconButtonBase.prototype, "ripple", void 0);
  __decorate([
    internalProperty()
  ], IconButtonBase.prototype, "shouldRenderRipple", void 0);
  __decorate([
    eventOptions({passive: true})
  ], IconButtonBase.prototype, "handleRippleMouseDown", null);
  __decorate([
    eventOptions({passive: true})
  ], IconButtonBase.prototype, "handleRippleTouchStart", null);

  // node_modules/@material/mwc-icon-button/mwc-icon-button-css.js
  /**
  @license
  Copyright 2018 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var style13 = css`.material-icons{font-family:var(--mdc-icon-font, "Material Icons");font-weight:normal;font-style:normal;font-size:var(--mdc-icon-size, 24px);line-height:1;letter-spacing:normal;text-transform:none;display:inline-block;white-space:nowrap;word-wrap:normal;direction:ltr;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;-moz-osx-font-smoothing:grayscale;font-feature-settings:"liga"}.mdc-icon-button{display:inline-block;position:relative;box-sizing:border-box;border:none;outline:none;background-color:transparent;fill:currentColor;color:inherit;font-size:24px;text-decoration:none;cursor:pointer;user-select:none;width:48px;height:48px;padding:12px}.mdc-icon-button svg,.mdc-icon-button img{width:24px;height:24px}.mdc-icon-button:disabled{color:rgba(0, 0, 0, 0.38);color:var(--mdc-theme-text-disabled-on-light, rgba(0, 0, 0, 0.38))}.mdc-icon-button:disabled{cursor:default;pointer-events:none}.mdc-icon-button__icon{display:inline-block}.mdc-icon-button__icon.mdc-icon-button__icon--on{display:none}.mdc-icon-button--on .mdc-icon-button__icon{display:none}.mdc-icon-button--on .mdc-icon-button__icon.mdc-icon-button__icon--on{display:inline-block}:host{display:inline-block;outline:none;--mdc-ripple-color: currentcolor;-webkit-tap-highlight-color:transparent}:host([disabled]){pointer-events:none}:host,.mdc-icon-button{vertical-align:top}.mdc-icon-button{width:var(--mdc-icon-button-size, 48px);height:var(--mdc-icon-button-size, 48px);padding:calc( (var(--mdc-icon-button-size, 48px) - var(--mdc-icon-size, 24px)) / 2 )}.mdc-icon-button>i{position:absolute;top:0;padding-top:inherit}.mdc-icon-button i,.mdc-icon-button svg,.mdc-icon-button img,.mdc-icon-button ::slotted(*){display:block;width:var(--mdc-icon-size, 24px);height:var(--mdc-icon-size, 24px)}`;

  // node_modules/@material/mwc-icon-button/mwc-icon-button.js
  /**
  @license
  Copyright 2018 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var IconButton = class IconButton2 extends IconButtonBase {
  };
  IconButton.styles = style13;
  IconButton = __decorate([
    customElement("mwc-icon-button")
  ], IconButton);

  // node_modules/@material/textfield/node_modules/tslib/tslib.es6.js
  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation.
  
  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.
  
  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** */
  var extendStatics9 = function(d, b) {
    extendStatics9 = Object.setPrototypeOf || {__proto__: []} instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2)
        if (b2.hasOwnProperty(p))
          d2[p] = b2[p];
    };
    return extendStatics9(d, b);
  };
  function __extends9(d, b) {
    extendStatics9(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }
  var __assign9 = function() {
    __assign9 = Object.assign || function __assign10(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s)
          if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
      }
      return t;
    };
    return __assign9.apply(this, arguments);
  };

  // node_modules/@material/textfield/constants.js
  /**
   * @license
   * Copyright 2016 Google Inc.
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in
   * all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   * THE SOFTWARE.
   */
  var strings8 = {
    ARIA_CONTROLS: "aria-controls",
    ARIA_DESCRIBEDBY: "aria-describedby",
    INPUT_SELECTOR: ".mdc-text-field__input",
    LABEL_SELECTOR: ".mdc-floating-label",
    LEADING_ICON_SELECTOR: ".mdc-text-field__icon--leading",
    LINE_RIPPLE_SELECTOR: ".mdc-line-ripple",
    OUTLINE_SELECTOR: ".mdc-notched-outline",
    PREFIX_SELECTOR: ".mdc-text-field__affix--prefix",
    SUFFIX_SELECTOR: ".mdc-text-field__affix--suffix",
    TRAILING_ICON_SELECTOR: ".mdc-text-field__icon--trailing"
  };
  var cssClasses10 = {
    DISABLED: "mdc-text-field--disabled",
    FOCUSED: "mdc-text-field--focused",
    HELPER_LINE: "mdc-text-field-helper-line",
    INVALID: "mdc-text-field--invalid",
    LABEL_FLOATING: "mdc-text-field--label-floating",
    NO_LABEL: "mdc-text-field--no-label",
    OUTLINED: "mdc-text-field--outlined",
    ROOT: "mdc-text-field",
    TEXTAREA: "mdc-text-field--textarea",
    WITH_LEADING_ICON: "mdc-text-field--with-leading-icon",
    WITH_TRAILING_ICON: "mdc-text-field--with-trailing-icon"
  };
  var numbers7 = {
    LABEL_SCALE: 0.75
  };
  var VALIDATION_ATTR_WHITELIST = [
    "pattern",
    "min",
    "max",
    "required",
    "step",
    "minlength",
    "maxlength"
  ];
  var ALWAYS_FLOAT_TYPES = [
    "color",
    "date",
    "datetime-local",
    "month",
    "range",
    "time",
    "week"
  ];

  // node_modules/@material/textfield/foundation.js
  /**
   * @license
   * Copyright 2016 Google Inc.
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in
   * all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   * THE SOFTWARE.
   */
  var POINTERDOWN_EVENTS = ["mousedown", "touchstart"];
  var INTERACTION_EVENTS = ["click", "keydown"];
  var MDCTextFieldFoundation = function(_super) {
    __extends9(MDCTextFieldFoundation2, _super);
    function MDCTextFieldFoundation2(adapter, foundationMap) {
      if (foundationMap === void 0) {
        foundationMap = {};
      }
      var _this = _super.call(this, __assign9(__assign9({}, MDCTextFieldFoundation2.defaultAdapter), adapter)) || this;
      _this.isFocused_ = false;
      _this.receivedUserInput_ = false;
      _this.isValid_ = true;
      _this.useNativeValidation_ = true;
      _this.validateOnValueChange_ = true;
      _this.helperText_ = foundationMap.helperText;
      _this.characterCounter_ = foundationMap.characterCounter;
      _this.leadingIcon_ = foundationMap.leadingIcon;
      _this.trailingIcon_ = foundationMap.trailingIcon;
      _this.inputFocusHandler_ = function() {
        return _this.activateFocus();
      };
      _this.inputBlurHandler_ = function() {
        return _this.deactivateFocus();
      };
      _this.inputInputHandler_ = function() {
        return _this.handleInput();
      };
      _this.setPointerXOffset_ = function(evt) {
        return _this.setTransformOrigin(evt);
      };
      _this.textFieldInteractionHandler_ = function() {
        return _this.handleTextFieldInteraction();
      };
      _this.validationAttributeChangeHandler_ = function(attributesList) {
        return _this.handleValidationAttributeChange(attributesList);
      };
      return _this;
    }
    Object.defineProperty(MDCTextFieldFoundation2, "cssClasses", {
      get: function() {
        return cssClasses10;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(MDCTextFieldFoundation2, "strings", {
      get: function() {
        return strings8;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(MDCTextFieldFoundation2, "numbers", {
      get: function() {
        return numbers7;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(MDCTextFieldFoundation2.prototype, "shouldAlwaysFloat_", {
      get: function() {
        var type = this.getNativeInput_().type;
        return ALWAYS_FLOAT_TYPES.indexOf(type) >= 0;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(MDCTextFieldFoundation2.prototype, "shouldFloat", {
      get: function() {
        return this.shouldAlwaysFloat_ || this.isFocused_ || !!this.getValue() || this.isBadInput_();
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(MDCTextFieldFoundation2.prototype, "shouldShake", {
      get: function() {
        return !this.isFocused_ && !this.isValid() && !!this.getValue();
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(MDCTextFieldFoundation2, "defaultAdapter", {
      get: function() {
        return {
          addClass: function() {
            return void 0;
          },
          removeClass: function() {
            return void 0;
          },
          hasClass: function() {
            return true;
          },
          setInputAttr: function() {
            return void 0;
          },
          removeInputAttr: function() {
            return void 0;
          },
          registerTextFieldInteractionHandler: function() {
            return void 0;
          },
          deregisterTextFieldInteractionHandler: function() {
            return void 0;
          },
          registerInputInteractionHandler: function() {
            return void 0;
          },
          deregisterInputInteractionHandler: function() {
            return void 0;
          },
          registerValidationAttributeChangeHandler: function() {
            return new MutationObserver(function() {
              return void 0;
            });
          },
          deregisterValidationAttributeChangeHandler: function() {
            return void 0;
          },
          getNativeInput: function() {
            return null;
          },
          isFocused: function() {
            return false;
          },
          activateLineRipple: function() {
            return void 0;
          },
          deactivateLineRipple: function() {
            return void 0;
          },
          setLineRippleTransformOrigin: function() {
            return void 0;
          },
          shakeLabel: function() {
            return void 0;
          },
          floatLabel: function() {
            return void 0;
          },
          setLabelRequired: function() {
            return void 0;
          },
          hasLabel: function() {
            return false;
          },
          getLabelWidth: function() {
            return 0;
          },
          hasOutline: function() {
            return false;
          },
          notchOutline: function() {
            return void 0;
          },
          closeOutline: function() {
            return void 0;
          }
        };
      },
      enumerable: true,
      configurable: true
    });
    MDCTextFieldFoundation2.prototype.init = function() {
      var _this = this;
      if (this.adapter.hasLabel() && this.getNativeInput_().required) {
        this.adapter.setLabelRequired(true);
      }
      if (this.adapter.isFocused()) {
        this.inputFocusHandler_();
      } else if (this.adapter.hasLabel() && this.shouldFloat) {
        this.notchOutline(true);
        this.adapter.floatLabel(true);
        this.styleFloating_(true);
      }
      this.adapter.registerInputInteractionHandler("focus", this.inputFocusHandler_);
      this.adapter.registerInputInteractionHandler("blur", this.inputBlurHandler_);
      this.adapter.registerInputInteractionHandler("input", this.inputInputHandler_);
      POINTERDOWN_EVENTS.forEach(function(evtType) {
        _this.adapter.registerInputInteractionHandler(evtType, _this.setPointerXOffset_);
      });
      INTERACTION_EVENTS.forEach(function(evtType) {
        _this.adapter.registerTextFieldInteractionHandler(evtType, _this.textFieldInteractionHandler_);
      });
      this.validationObserver_ = this.adapter.registerValidationAttributeChangeHandler(this.validationAttributeChangeHandler_);
      this.setCharacterCounter_(this.getValue().length);
    };
    MDCTextFieldFoundation2.prototype.destroy = function() {
      var _this = this;
      this.adapter.deregisterInputInteractionHandler("focus", this.inputFocusHandler_);
      this.adapter.deregisterInputInteractionHandler("blur", this.inputBlurHandler_);
      this.adapter.deregisterInputInteractionHandler("input", this.inputInputHandler_);
      POINTERDOWN_EVENTS.forEach(function(evtType) {
        _this.adapter.deregisterInputInteractionHandler(evtType, _this.setPointerXOffset_);
      });
      INTERACTION_EVENTS.forEach(function(evtType) {
        _this.adapter.deregisterTextFieldInteractionHandler(evtType, _this.textFieldInteractionHandler_);
      });
      this.adapter.deregisterValidationAttributeChangeHandler(this.validationObserver_);
    };
    MDCTextFieldFoundation2.prototype.handleTextFieldInteraction = function() {
      var nativeInput = this.adapter.getNativeInput();
      if (nativeInput && nativeInput.disabled) {
        return;
      }
      this.receivedUserInput_ = true;
    };
    MDCTextFieldFoundation2.prototype.handleValidationAttributeChange = function(attributesList) {
      var _this = this;
      attributesList.some(function(attributeName) {
        if (VALIDATION_ATTR_WHITELIST.indexOf(attributeName) > -1) {
          _this.styleValidity_(true);
          _this.adapter.setLabelRequired(_this.getNativeInput_().required);
          return true;
        }
        return false;
      });
      if (attributesList.indexOf("maxlength") > -1) {
        this.setCharacterCounter_(this.getValue().length);
      }
    };
    MDCTextFieldFoundation2.prototype.notchOutline = function(openNotch) {
      if (!this.adapter.hasOutline() || !this.adapter.hasLabel()) {
        return;
      }
      if (openNotch) {
        var labelWidth = this.adapter.getLabelWidth() * numbers7.LABEL_SCALE;
        this.adapter.notchOutline(labelWidth);
      } else {
        this.adapter.closeOutline();
      }
    };
    MDCTextFieldFoundation2.prototype.activateFocus = function() {
      this.isFocused_ = true;
      this.styleFocused_(this.isFocused_);
      this.adapter.activateLineRipple();
      if (this.adapter.hasLabel()) {
        this.notchOutline(this.shouldFloat);
        this.adapter.floatLabel(this.shouldFloat);
        this.styleFloating_(this.shouldFloat);
        this.adapter.shakeLabel(this.shouldShake);
      }
      if (this.helperText_ && (this.helperText_.isPersistent() || !this.helperText_.isValidation() || !this.isValid_)) {
        this.helperText_.showToScreenReader();
      }
    };
    MDCTextFieldFoundation2.prototype.setTransformOrigin = function(evt) {
      if (this.isDisabled() || this.adapter.hasOutline()) {
        return;
      }
      var touches = evt.touches;
      var targetEvent = touches ? touches[0] : evt;
      var targetClientRect = targetEvent.target.getBoundingClientRect();
      var normalizedX = targetEvent.clientX - targetClientRect.left;
      this.adapter.setLineRippleTransformOrigin(normalizedX);
    };
    MDCTextFieldFoundation2.prototype.handleInput = function() {
      this.autoCompleteFocus();
      this.setCharacterCounter_(this.getValue().length);
    };
    MDCTextFieldFoundation2.prototype.autoCompleteFocus = function() {
      if (!this.receivedUserInput_) {
        this.activateFocus();
      }
    };
    MDCTextFieldFoundation2.prototype.deactivateFocus = function() {
      this.isFocused_ = false;
      this.adapter.deactivateLineRipple();
      var isValid = this.isValid();
      this.styleValidity_(isValid);
      this.styleFocused_(this.isFocused_);
      if (this.adapter.hasLabel()) {
        this.notchOutline(this.shouldFloat);
        this.adapter.floatLabel(this.shouldFloat);
        this.styleFloating_(this.shouldFloat);
        this.adapter.shakeLabel(this.shouldShake);
      }
      if (!this.shouldFloat) {
        this.receivedUserInput_ = false;
      }
    };
    MDCTextFieldFoundation2.prototype.getValue = function() {
      return this.getNativeInput_().value;
    };
    MDCTextFieldFoundation2.prototype.setValue = function(value) {
      if (this.getValue() !== value) {
        this.getNativeInput_().value = value;
      }
      this.setCharacterCounter_(value.length);
      if (this.validateOnValueChange_) {
        var isValid = this.isValid();
        this.styleValidity_(isValid);
      }
      if (this.adapter.hasLabel()) {
        this.notchOutline(this.shouldFloat);
        this.adapter.floatLabel(this.shouldFloat);
        this.styleFloating_(this.shouldFloat);
        if (this.validateOnValueChange_) {
          this.adapter.shakeLabel(this.shouldShake);
        }
      }
    };
    MDCTextFieldFoundation2.prototype.isValid = function() {
      return this.useNativeValidation_ ? this.isNativeInputValid_() : this.isValid_;
    };
    MDCTextFieldFoundation2.prototype.setValid = function(isValid) {
      this.isValid_ = isValid;
      this.styleValidity_(isValid);
      var shouldShake = !isValid && !this.isFocused_ && !!this.getValue();
      if (this.adapter.hasLabel()) {
        this.adapter.shakeLabel(shouldShake);
      }
    };
    MDCTextFieldFoundation2.prototype.setValidateOnValueChange = function(shouldValidate) {
      this.validateOnValueChange_ = shouldValidate;
    };
    MDCTextFieldFoundation2.prototype.getValidateOnValueChange = function() {
      return this.validateOnValueChange_;
    };
    MDCTextFieldFoundation2.prototype.setUseNativeValidation = function(useNativeValidation) {
      this.useNativeValidation_ = useNativeValidation;
    };
    MDCTextFieldFoundation2.prototype.isDisabled = function() {
      return this.getNativeInput_().disabled;
    };
    MDCTextFieldFoundation2.prototype.setDisabled = function(disabled) {
      this.getNativeInput_().disabled = disabled;
      this.styleDisabled_(disabled);
    };
    MDCTextFieldFoundation2.prototype.setHelperTextContent = function(content) {
      if (this.helperText_) {
        this.helperText_.setContent(content);
      }
    };
    MDCTextFieldFoundation2.prototype.setLeadingIconAriaLabel = function(label) {
      if (this.leadingIcon_) {
        this.leadingIcon_.setAriaLabel(label);
      }
    };
    MDCTextFieldFoundation2.prototype.setLeadingIconContent = function(content) {
      if (this.leadingIcon_) {
        this.leadingIcon_.setContent(content);
      }
    };
    MDCTextFieldFoundation2.prototype.setTrailingIconAriaLabel = function(label) {
      if (this.trailingIcon_) {
        this.trailingIcon_.setAriaLabel(label);
      }
    };
    MDCTextFieldFoundation2.prototype.setTrailingIconContent = function(content) {
      if (this.trailingIcon_) {
        this.trailingIcon_.setContent(content);
      }
    };
    MDCTextFieldFoundation2.prototype.setCharacterCounter_ = function(currentLength) {
      if (!this.characterCounter_) {
        return;
      }
      var maxLength = this.getNativeInput_().maxLength;
      if (maxLength === -1) {
        throw new Error("MDCTextFieldFoundation: Expected maxlength html property on text input or textarea.");
      }
      this.characterCounter_.setCounterValue(currentLength, maxLength);
    };
    MDCTextFieldFoundation2.prototype.isBadInput_ = function() {
      return this.getNativeInput_().validity.badInput || false;
    };
    MDCTextFieldFoundation2.prototype.isNativeInputValid_ = function() {
      return this.getNativeInput_().validity.valid;
    };
    MDCTextFieldFoundation2.prototype.styleValidity_ = function(isValid) {
      var INVALID = MDCTextFieldFoundation2.cssClasses.INVALID;
      if (isValid) {
        this.adapter.removeClass(INVALID);
      } else {
        this.adapter.addClass(INVALID);
      }
      if (this.helperText_) {
        this.helperText_.setValidity(isValid);
        var helperTextValidation = this.helperText_.isValidation();
        if (!helperTextValidation) {
          return;
        }
        var helperTextVisible = this.helperText_.isVisible();
        var helperTextId = this.helperText_.getId();
        if (helperTextVisible && helperTextId) {
          this.adapter.setInputAttr(strings8.ARIA_DESCRIBEDBY, helperTextId);
        } else {
          this.adapter.removeInputAttr(strings8.ARIA_DESCRIBEDBY);
        }
      }
    };
    MDCTextFieldFoundation2.prototype.styleFocused_ = function(isFocused) {
      var FOCUSED = MDCTextFieldFoundation2.cssClasses.FOCUSED;
      if (isFocused) {
        this.adapter.addClass(FOCUSED);
      } else {
        this.adapter.removeClass(FOCUSED);
      }
    };
    MDCTextFieldFoundation2.prototype.styleDisabled_ = function(isDisabled) {
      var _a2 = MDCTextFieldFoundation2.cssClasses, DISABLED = _a2.DISABLED, INVALID = _a2.INVALID;
      if (isDisabled) {
        this.adapter.addClass(DISABLED);
        this.adapter.removeClass(INVALID);
      } else {
        this.adapter.removeClass(DISABLED);
      }
      if (this.leadingIcon_) {
        this.leadingIcon_.setDisabled(isDisabled);
      }
      if (this.trailingIcon_) {
        this.trailingIcon_.setDisabled(isDisabled);
      }
    };
    MDCTextFieldFoundation2.prototype.styleFloating_ = function(isFloating) {
      var LABEL_FLOATING = MDCTextFieldFoundation2.cssClasses.LABEL_FLOATING;
      if (isFloating) {
        this.adapter.addClass(LABEL_FLOATING);
      } else {
        this.adapter.removeClass(LABEL_FLOATING);
      }
    };
    MDCTextFieldFoundation2.prototype.getNativeInput_ = function() {
      var nativeInput = this.adapter ? this.adapter.getNativeInput() : null;
      return nativeInput || {
        disabled: false,
        maxLength: -1,
        required: false,
        type: "input",
        validity: {
          badInput: false,
          valid: true
        },
        value: ""
      };
    };
    return MDCTextFieldFoundation2;
  }(MDCFoundation);
  var foundation_default6 = MDCTextFieldFoundation;

  // node_modules/lit-html/directives/live.js
  /**
   * @license
   * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   */
  var live = directive((value) => (part) => {
    let previousValue;
    if (part instanceof EventPart || part instanceof NodePart) {
      throw new Error("The `live` directive is not allowed on text or event bindings");
    }
    if (part instanceof BooleanAttributePart) {
      checkStrings(part.strings);
      previousValue = part.element.hasAttribute(part.name);
      part.value = previousValue;
    } else {
      const {element, name, strings: strings9} = part.committer;
      checkStrings(strings9);
      if (part instanceof PropertyPart) {
        previousValue = element[name];
        if (previousValue === value) {
          return;
        }
      } else if (part instanceof AttributePart) {
        previousValue = element.getAttribute(name);
      }
      if (previousValue === String(value)) {
        return;
      }
    }
    part.setValue(value);
  });
  var checkStrings = (strings9) => {
    if (strings9.length !== 2 || strings9[0] !== "" || strings9[1] !== "") {
      throw new Error("`live` bindings can only contain a single expression");
    }
  };

  // node_modules/@material/mwc-textfield/mwc-textfield-base.js
  /**
  @license
  Copyright 2019 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var passiveEvents = ["touchstart", "touchmove", "scroll", "mousewheel"];
  var createValidityObj2 = (customValidity = {}) => {
    const objectifiedCustomValidity = {};
    for (const propName in customValidity) {
      objectifiedCustomValidity[propName] = customValidity[propName];
    }
    return Object.assign({badInput: false, customError: false, patternMismatch: false, rangeOverflow: false, rangeUnderflow: false, stepMismatch: false, tooLong: false, tooShort: false, typeMismatch: false, valid: true, valueMissing: false}, objectifiedCustomValidity);
  };
  var TextFieldBase = class extends FormElement {
    constructor() {
      super(...arguments);
      this.mdcFoundationClass = foundation_default6;
      this.value = "";
      this.type = "text";
      this.placeholder = "";
      this.label = "";
      this.icon = "";
      this.iconTrailing = "";
      this.disabled = false;
      this.required = false;
      this.minLength = -1;
      this.maxLength = -1;
      this.outlined = false;
      this.helper = "";
      this.validateOnInitialRender = false;
      this.validationMessage = "";
      this.autoValidate = false;
      this.pattern = "";
      this.min = "";
      this.max = "";
      this.step = null;
      this.size = null;
      this.helperPersistent = false;
      this.charCounter = false;
      this.endAligned = false;
      this.prefix = "";
      this.suffix = "";
      this.name = "";
      this.readOnly = false;
      this.autocapitalize = "";
      this.outlineOpen = false;
      this.outlineWidth = 0;
      this.isUiValid = true;
      this.focused = false;
      this._validity = createValidityObj2();
      this._outlineUpdateComplete = null;
      this.validityTransform = null;
    }
    get validity() {
      this._checkValidity(this.value);
      return this._validity;
    }
    get willValidate() {
      return this.formElement.willValidate;
    }
    get selectionStart() {
      return this.formElement.selectionStart;
    }
    get selectionEnd() {
      return this.formElement.selectionEnd;
    }
    focus() {
      const focusEvt = new CustomEvent("focus");
      this.formElement.dispatchEvent(focusEvt);
      this.formElement.focus();
    }
    blur() {
      const blurEvt = new CustomEvent("blur");
      this.formElement.dispatchEvent(blurEvt);
      this.formElement.blur();
    }
    select() {
      this.formElement.select();
    }
    setSelectionRange(selectionStart, selectionEnd, selectionDirection) {
      this.formElement.setSelectionRange(selectionStart, selectionEnd, selectionDirection);
    }
    update(changedProperties) {
      if (changedProperties.has("autoValidate") && this.mdcFoundation) {
        this.mdcFoundation.setValidateOnValueChange(this.autoValidate);
      }
      if (changedProperties.has("value") && typeof this.value !== "string") {
        this.value = `${this.value}`;
      }
      super.update(changedProperties);
    }
    render() {
      const shouldRenderCharCounter = this.charCounter && this.maxLength !== -1;
      const shouldRenderHelperText = !!this.helper || !!this.validationMessage || shouldRenderCharCounter;
      const classes = {
        "mdc-text-field--disabled": this.disabled,
        "mdc-text-field--no-label": !this.label,
        "mdc-text-field--filled": !this.outlined,
        "mdc-text-field--outlined": this.outlined,
        "mdc-text-field--with-leading-icon": this.icon,
        "mdc-text-field--with-trailing-icon": this.iconTrailing,
        "mdc-text-field--end-aligned": this.endAligned
      };
      return html`
      <label class="mdc-text-field ${classMap(classes)}">
        ${this.renderRipple()}
        ${this.outlined ? this.renderOutline() : this.renderLabel()}
        ${this.renderLeadingIcon()}
        ${this.renderPrefix()}
        ${this.renderInput(shouldRenderHelperText)}
        ${this.renderSuffix()}
        ${this.renderTrailingIcon()}
        ${this.renderLineRipple()}
      </label>
      ${this.renderHelperText(shouldRenderHelperText, shouldRenderCharCounter)}
    `;
    }
    updated(changedProperties) {
      if (changedProperties.has("value") && changedProperties.get("value") !== void 0) {
        this.mdcFoundation.setValue(this.value);
        if (this.autoValidate) {
          this.reportValidity();
        }
      }
    }
    renderRipple() {
      return this.outlined ? "" : html`
      <span class="mdc-text-field__ripple"></span>
    `;
    }
    renderOutline() {
      return !this.outlined ? "" : html`
      <mwc-notched-outline
          .width=${this.outlineWidth}
          .open=${this.outlineOpen}
          class="mdc-notched-outline">
        ${this.renderLabel()}
      </mwc-notched-outline>`;
    }
    renderLabel() {
      return !this.label ? "" : html`
      <span
          .floatingLabelFoundation=${floatingLabel(this.label)}
          id="label">${this.label}</span>
    `;
    }
    renderLeadingIcon() {
      return this.icon ? this.renderIcon(this.icon) : "";
    }
    renderTrailingIcon() {
      return this.iconTrailing ? this.renderIcon(this.iconTrailing, true) : "";
    }
    renderIcon(icon, isTrailingIcon = false) {
      const classes = {
        "mdc-text-field__icon--leading": !isTrailingIcon,
        "mdc-text-field__icon--trailing": isTrailingIcon
      };
      return html`<i class="material-icons mdc-text-field__icon ${classMap(classes)}">${icon}</i>`;
    }
    renderPrefix() {
      return this.prefix ? this.renderAffix(this.prefix) : "";
    }
    renderSuffix() {
      return this.suffix ? this.renderAffix(this.suffix, true) : "";
    }
    renderAffix(content, isSuffix = false) {
      const classes = {
        "mdc-text-field__affix--prefix": !isSuffix,
        "mdc-text-field__affix--suffix": isSuffix
      };
      return html`<span class="mdc-text-field__affix ${classMap(classes)}">
        ${content}</span>`;
    }
    renderInput(shouldRenderHelperText) {
      const minOrUndef = this.minLength === -1 ? void 0 : this.minLength;
      const maxOrUndef = this.maxLength === -1 ? void 0 : this.maxLength;
      const autocapitalizeOrUndef = this.autocapitalize ? this.autocapitalize : void 0;
      const showValidationMessage = this.validationMessage && !this.isUiValid;
      const ariaControlsOrUndef = shouldRenderHelperText ? "helper-text" : void 0;
      const ariaDescribedbyOrUndef = this.focused || this.helperPersistent || showValidationMessage ? "helper-text" : void 0;
      const ariaErrortextOrUndef = showValidationMessage ? "helper-text" : void 0;
      return html`
      <input
          aria-labelledby="label"
          aria-controls="${ifDefined(ariaControlsOrUndef)}"
          aria-describedby="${ifDefined(ariaDescribedbyOrUndef)}"
          aria-errortext="${ifDefined(ariaErrortextOrUndef)}"
          class="mdc-text-field__input"
          type="${this.type}"
          .value="${live(this.value)}"
          ?disabled="${this.disabled}"
          placeholder="${this.placeholder}"
          ?required="${this.required}"
          ?readonly="${this.readOnly}"
          minlength="${ifDefined(minOrUndef)}"
          maxlength="${ifDefined(maxOrUndef)}"
          pattern="${ifDefined(this.pattern ? this.pattern : void 0)}"
          min="${ifDefined(this.min === "" ? void 0 : this.min)}"
          max="${ifDefined(this.max === "" ? void 0 : this.max)}"
          step="${ifDefined(this.step === null ? void 0 : this.step)}"
          size="${ifDefined(this.size === null ? void 0 : this.size)}"
          name="${ifDefined(this.name === "" ? void 0 : this.name)}"
          inputmode="${ifDefined(this.inputMode)}"
          autocapitalize="${ifDefined(autocapitalizeOrUndef)}"
          @input="${this.handleInputChange}"
          @focus="${this.onInputFocus}"
          @blur="${this.onInputBlur}">`;
    }
    renderLineRipple() {
      return this.outlined ? "" : html`
      <span .lineRippleFoundation=${lineRipple()}></span>
    `;
    }
    renderHelperText(shouldRenderHelperText, shouldRenderCharCounter) {
      const showValidationMessage = this.validationMessage && !this.isUiValid;
      const classes = {
        "mdc-text-field-helper-text--persistent": this.helperPersistent,
        "mdc-text-field-helper-text--validation-msg": showValidationMessage
      };
      const ariaHiddenOrUndef = this.focused || this.helperPersistent || showValidationMessage ? void 0 : "true";
      const helperText = showValidationMessage ? this.validationMessage : this.helper;
      return !shouldRenderHelperText ? "" : html`
      <div class="mdc-text-field-helper-line">
        <div id="helper-text"
             aria-hidden="${ifDefined(ariaHiddenOrUndef)}"
             class="mdc-text-field-helper-text ${classMap(classes)}"
             >${helperText}</div>
        ${this.renderCharCounter(shouldRenderCharCounter)}
      </div>`;
    }
    renderCharCounter(shouldRenderCharCounter) {
      const length = Math.min(this.value.length, this.maxLength);
      return !shouldRenderCharCounter ? "" : html`
      <span class="mdc-text-field-character-counter"
            >${length} / ${this.maxLength}</span>`;
    }
    onInputFocus() {
      this.focused = true;
    }
    onInputBlur() {
      this.focused = false;
      this.reportValidity();
    }
    checkValidity() {
      const isValid = this._checkValidity(this.value);
      if (!isValid) {
        const invalidEvent = new Event("invalid", {bubbles: false, cancelable: true});
        this.dispatchEvent(invalidEvent);
      }
      return isValid;
    }
    reportValidity() {
      const isValid = this.checkValidity();
      this.mdcFoundation.setValid(isValid);
      this.isUiValid = isValid;
      return isValid;
    }
    _checkValidity(value) {
      const nativeValidity = this.formElement.validity;
      let validity = createValidityObj2(nativeValidity);
      if (this.validityTransform) {
        const customValidity = this.validityTransform(value, validity);
        validity = Object.assign(Object.assign({}, validity), customValidity);
        this.mdcFoundation.setUseNativeValidation(false);
      } else {
        this.mdcFoundation.setUseNativeValidation(true);
      }
      this._validity = validity;
      return this._validity.valid;
    }
    setCustomValidity(message) {
      this.validationMessage = message;
      this.formElement.setCustomValidity(message);
    }
    handleInputChange() {
      this.value = this.formElement.value;
    }
    createFoundation() {
      if (this.mdcFoundation !== void 0) {
        this.mdcFoundation.destroy();
      }
      this.mdcFoundation = new this.mdcFoundationClass(this.createAdapter());
      this.mdcFoundation.init();
    }
    createAdapter() {
      return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, this.getRootAdapterMethods()), this.getInputAdapterMethods()), this.getLabelAdapterMethods()), this.getLineRippleAdapterMethods()), this.getOutlineAdapterMethods());
    }
    getRootAdapterMethods() {
      return Object.assign({registerTextFieldInteractionHandler: (evtType, handler) => this.addEventListener(evtType, handler), deregisterTextFieldInteractionHandler: (evtType, handler) => this.removeEventListener(evtType, handler), registerValidationAttributeChangeHandler: (handler) => {
        const getAttributesList = (mutationsList) => {
          return mutationsList.map((mutation) => mutation.attributeName).filter((attributeName) => attributeName);
        };
        const observer2 = new MutationObserver((mutationsList) => {
          handler(getAttributesList(mutationsList));
        });
        const config = {attributes: true};
        observer2.observe(this.formElement, config);
        return observer2;
      }, deregisterValidationAttributeChangeHandler: (observer2) => observer2.disconnect()}, addHasRemoveClass(this.mdcRoot));
    }
    getInputAdapterMethods() {
      return {
        getNativeInput: () => this.formElement,
        setInputAttr: () => void 0,
        removeInputAttr: () => void 0,
        isFocused: () => this.shadowRoot ? this.shadowRoot.activeElement === this.formElement : false,
        registerInputInteractionHandler: (evtType, handler) => this.formElement.addEventListener(evtType, handler, {passive: evtType in passiveEvents}),
        deregisterInputInteractionHandler: (evtType, handler) => this.formElement.removeEventListener(evtType, handler)
      };
    }
    getLabelAdapterMethods() {
      return {
        floatLabel: (shouldFloat) => this.labelElement && this.labelElement.floatingLabelFoundation.float(shouldFloat),
        getLabelWidth: () => {
          return this.labelElement ? this.labelElement.floatingLabelFoundation.getWidth() : 0;
        },
        hasLabel: () => Boolean(this.labelElement),
        shakeLabel: (shouldShake) => this.labelElement && this.labelElement.floatingLabelFoundation.shake(shouldShake),
        setLabelRequired: (isRequired) => {
          if (this.labelElement) {
            this.labelElement.floatingLabelFoundation.setRequired(isRequired);
          }
        }
      };
    }
    getLineRippleAdapterMethods() {
      return {
        activateLineRipple: () => {
          if (this.lineRippleElement) {
            this.lineRippleElement.lineRippleFoundation.activate();
          }
        },
        deactivateLineRipple: () => {
          if (this.lineRippleElement) {
            this.lineRippleElement.lineRippleFoundation.deactivate();
          }
        },
        setLineRippleTransformOrigin: (normalizedX) => {
          if (this.lineRippleElement) {
            this.lineRippleElement.lineRippleFoundation.setRippleCenter(normalizedX);
          }
        }
      };
    }
    async _getUpdateComplete() {
      await super._getUpdateComplete();
      await this._outlineUpdateComplete;
    }
    async firstUpdated() {
      const outlineElement = this.outlineElement;
      if (outlineElement) {
        this._outlineUpdateComplete = outlineElement.updateComplete;
        await this._outlineUpdateComplete;
      }
      super.firstUpdated();
      this.mdcFoundation.setValidateOnValueChange(this.autoValidate);
      if (this.validateOnInitialRender) {
        this.reportValidity();
      }
    }
    getOutlineAdapterMethods() {
      return {
        closeOutline: () => this.outlineElement && (this.outlineOpen = false),
        hasOutline: () => Boolean(this.outlineElement),
        notchOutline: (labelWidth) => {
          const outlineElement = this.outlineElement;
          if (outlineElement && !this.outlineOpen) {
            this.outlineWidth = labelWidth;
            this.outlineOpen = true;
          }
        }
      };
    }
    async layout() {
      await this.updateComplete;
      const labelElement = this.labelElement;
      if (!labelElement) {
        this.outlineOpen = false;
        return;
      }
      const shouldFloat = !!this.label && !!this.value;
      labelElement.floatingLabelFoundation.float(shouldFloat);
      if (!this.outlined) {
        return;
      }
      this.outlineOpen = shouldFloat;
      await this.updateComplete;
      const labelWidth = labelElement.floatingLabelFoundation.getWidth();
      if (this.outlineOpen) {
        this.outlineWidth = labelWidth;
      }
    }
  };
  __decorate([
    query(".mdc-text-field")
  ], TextFieldBase.prototype, "mdcRoot", void 0);
  __decorate([
    query("input")
  ], TextFieldBase.prototype, "formElement", void 0);
  __decorate([
    query(".mdc-floating-label")
  ], TextFieldBase.prototype, "labelElement", void 0);
  __decorate([
    query(".mdc-line-ripple")
  ], TextFieldBase.prototype, "lineRippleElement", void 0);
  __decorate([
    query("mwc-notched-outline")
  ], TextFieldBase.prototype, "outlineElement", void 0);
  __decorate([
    query(".mdc-notched-outline__notch")
  ], TextFieldBase.prototype, "notchElement", void 0);
  __decorate([
    property({type: String})
  ], TextFieldBase.prototype, "value", void 0);
  __decorate([
    property({type: String})
  ], TextFieldBase.prototype, "type", void 0);
  __decorate([
    property({type: String})
  ], TextFieldBase.prototype, "placeholder", void 0);
  __decorate([
    property({type: String}),
    observer(function(_newVal, oldVal) {
      if (oldVal !== void 0 && this.label !== oldVal) {
        this.layout();
      }
    })
  ], TextFieldBase.prototype, "label", void 0);
  __decorate([
    property({type: String})
  ], TextFieldBase.prototype, "icon", void 0);
  __decorate([
    property({type: String})
  ], TextFieldBase.prototype, "iconTrailing", void 0);
  __decorate([
    property({type: Boolean, reflect: true})
  ], TextFieldBase.prototype, "disabled", void 0);
  __decorate([
    property({type: Boolean})
  ], TextFieldBase.prototype, "required", void 0);
  __decorate([
    property({type: Number})
  ], TextFieldBase.prototype, "minLength", void 0);
  __decorate([
    property({type: Number})
  ], TextFieldBase.prototype, "maxLength", void 0);
  __decorate([
    property({type: Boolean, reflect: true}),
    observer(function(_newVal, oldVal) {
      if (oldVal !== void 0 && this.outlined !== oldVal) {
        this.layout();
      }
    })
  ], TextFieldBase.prototype, "outlined", void 0);
  __decorate([
    property({type: String})
  ], TextFieldBase.prototype, "helper", void 0);
  __decorate([
    property({type: Boolean})
  ], TextFieldBase.prototype, "validateOnInitialRender", void 0);
  __decorate([
    property({type: String})
  ], TextFieldBase.prototype, "validationMessage", void 0);
  __decorate([
    property({type: Boolean})
  ], TextFieldBase.prototype, "autoValidate", void 0);
  __decorate([
    property({type: String})
  ], TextFieldBase.prototype, "pattern", void 0);
  __decorate([
    property({type: String})
  ], TextFieldBase.prototype, "min", void 0);
  __decorate([
    property({type: String})
  ], TextFieldBase.prototype, "max", void 0);
  __decorate([
    property({type: Number})
  ], TextFieldBase.prototype, "step", void 0);
  __decorate([
    property({type: Number})
  ], TextFieldBase.prototype, "size", void 0);
  __decorate([
    property({type: Boolean})
  ], TextFieldBase.prototype, "helperPersistent", void 0);
  __decorate([
    property({type: Boolean})
  ], TextFieldBase.prototype, "charCounter", void 0);
  __decorate([
    property({type: Boolean})
  ], TextFieldBase.prototype, "endAligned", void 0);
  __decorate([
    property({type: String})
  ], TextFieldBase.prototype, "prefix", void 0);
  __decorate([
    property({type: String})
  ], TextFieldBase.prototype, "suffix", void 0);
  __decorate([
    property({type: String})
  ], TextFieldBase.prototype, "name", void 0);
  __decorate([
    property({type: String})
  ], TextFieldBase.prototype, "inputMode", void 0);
  __decorate([
    property({type: Boolean})
  ], TextFieldBase.prototype, "readOnly", void 0);
  __decorate([
    property({type: String})
  ], TextFieldBase.prototype, "autocapitalize", void 0);
  __decorate([
    property({type: Boolean})
  ], TextFieldBase.prototype, "outlineOpen", void 0);
  __decorate([
    property({type: Number})
  ], TextFieldBase.prototype, "outlineWidth", void 0);
  __decorate([
    property({type: Boolean})
  ], TextFieldBase.prototype, "isUiValid", void 0);
  __decorate([
    internalProperty()
  ], TextFieldBase.prototype, "focused", void 0);
  __decorate([
    eventOptions({passive: true})
  ], TextFieldBase.prototype, "handleInputChange", null);

  // node_modules/@material/mwc-textfield/mwc-textfield-css.js
  /**
  @license
  Copyright 2018 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var style14 = css`.mdc-floating-label{-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;font-family:Roboto, sans-serif;font-family:var(--mdc-typography-subtitle1-font-family, var(--mdc-typography-font-family, Roboto, sans-serif));font-size:1rem;font-size:var(--mdc-typography-subtitle1-font-size, 1rem);font-weight:400;font-weight:var(--mdc-typography-subtitle1-font-weight, 400);letter-spacing:0.009375em;letter-spacing:var(--mdc-typography-subtitle1-letter-spacing, 0.009375em);text-decoration:inherit;text-decoration:var(--mdc-typography-subtitle1-text-decoration, inherit);text-transform:inherit;text-transform:var(--mdc-typography-subtitle1-text-transform, inherit);position:absolute;left:0;transform-origin:left top;line-height:1.15rem;text-align:left;text-overflow:ellipsis;white-space:nowrap;cursor:text;overflow:hidden;will-change:transform;transition:transform 150ms cubic-bezier(0.4, 0, 0.2, 1),color 150ms cubic-bezier(0.4, 0, 0.2, 1)}[dir=rtl] .mdc-floating-label,.mdc-floating-label[dir=rtl]{right:0;left:auto;transform-origin:right top;text-align:right}.mdc-floating-label--float-above{cursor:auto}.mdc-floating-label--required::after{margin-left:1px;margin-right:0px;content:"*"}[dir=rtl] .mdc-floating-label--required::after,.mdc-floating-label--required[dir=rtl]::after{margin-left:0;margin-right:1px}.mdc-floating-label--float-above{transform:translateY(-106%) scale(0.75)}.mdc-floating-label--shake{animation:mdc-floating-label-shake-float-above-standard 250ms 1}@keyframes mdc-floating-label-shake-float-above-standard{0%{transform:translateX(calc(0 - 0%)) translateY(-106%) scale(0.75)}33%{animation-timing-function:cubic-bezier(0.5, 0, 0.701732, 0.495819);transform:translateX(calc(4% - 0%)) translateY(-106%) scale(0.75)}66%{animation-timing-function:cubic-bezier(0.302435, 0.381352, 0.55, 0.956352);transform:translateX(calc(-4% - 0%)) translateY(-106%) scale(0.75)}100%{transform:translateX(calc(0 - 0%)) translateY(-106%) scale(0.75)}}.mdc-line-ripple::before,.mdc-line-ripple::after{position:absolute;bottom:0;left:0;width:100%;border-bottom-style:solid;content:""}.mdc-line-ripple::before{border-bottom-width:1px;z-index:1}.mdc-line-ripple::after{transform:scaleX(0);border-bottom-width:2px;opacity:0;z-index:2}.mdc-line-ripple::after{transition:transform 180ms cubic-bezier(0.4, 0, 0.2, 1),opacity 180ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-line-ripple--active::after{transform:scaleX(1);opacity:1}.mdc-line-ripple--deactivating::after{opacity:0}.mdc-notched-outline{display:flex;position:absolute;top:0;right:0;left:0;box-sizing:border-box;width:100%;max-width:100%;height:100%;text-align:left;pointer-events:none}[dir=rtl] .mdc-notched-outline,.mdc-notched-outline[dir=rtl]{text-align:right}.mdc-notched-outline__leading,.mdc-notched-outline__notch,.mdc-notched-outline__trailing{box-sizing:border-box;height:100%;border-top:1px solid;border-bottom:1px solid;pointer-events:none}.mdc-notched-outline__leading{border-left:1px solid;border-right:none;width:12px}[dir=rtl] .mdc-notched-outline__leading,.mdc-notched-outline__leading[dir=rtl]{border-left:none;border-right:1px solid}.mdc-notched-outline__trailing{border-left:none;border-right:1px solid;flex-grow:1}[dir=rtl] .mdc-notched-outline__trailing,.mdc-notched-outline__trailing[dir=rtl]{border-left:1px solid;border-right:none}.mdc-notched-outline__notch{flex:0 0 auto;width:auto;max-width:calc(100% - 12px * 2)}.mdc-notched-outline .mdc-floating-label{display:inline-block;position:relative;max-width:100%}.mdc-notched-outline .mdc-floating-label--float-above{text-overflow:clip}.mdc-notched-outline--upgraded .mdc-floating-label--float-above{max-width:calc(100% / 0.75)}.mdc-notched-outline--notched .mdc-notched-outline__notch{padding-left:0;padding-right:8px;border-top:none}[dir=rtl] .mdc-notched-outline--notched .mdc-notched-outline__notch,.mdc-notched-outline--notched .mdc-notched-outline__notch[dir=rtl]{padding-left:8px;padding-right:0}.mdc-notched-outline--no-label .mdc-notched-outline__notch{display:none}@keyframes mdc-ripple-fg-radius-in{from{animation-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transform:translate(var(--mdc-ripple-fg-translate-start, 0)) scale(1)}to{transform:translate(var(--mdc-ripple-fg-translate-end, 0)) scale(var(--mdc-ripple-fg-scale, 1))}}@keyframes mdc-ripple-fg-opacity-in{from{animation-timing-function:linear;opacity:0}to{opacity:var(--mdc-ripple-fg-opacity, 0)}}@keyframes mdc-ripple-fg-opacity-out{from{animation-timing-function:linear;opacity:var(--mdc-ripple-fg-opacity, 0)}to{opacity:0}}.mdc-text-field--filled{--mdc-ripple-fg-size: 0;--mdc-ripple-left: 0;--mdc-ripple-top: 0;--mdc-ripple-fg-scale: 1;--mdc-ripple-fg-translate-end: 0;--mdc-ripple-fg-translate-start: 0;-webkit-tap-highlight-color:rgba(0,0,0,0);will-change:transform,opacity}.mdc-text-field--filled .mdc-text-field__ripple::before,.mdc-text-field--filled .mdc-text-field__ripple::after{position:absolute;border-radius:50%;opacity:0;pointer-events:none;content:""}.mdc-text-field--filled .mdc-text-field__ripple::before{transition:opacity 15ms linear,background-color 15ms linear;z-index:1;z-index:var(--mdc-ripple-z-index, 1)}.mdc-text-field--filled .mdc-text-field__ripple::after{z-index:0;z-index:var(--mdc-ripple-z-index, 0)}.mdc-text-field--filled.mdc-ripple-upgraded .mdc-text-field__ripple::before{transform:scale(var(--mdc-ripple-fg-scale, 1))}.mdc-text-field--filled.mdc-ripple-upgraded .mdc-text-field__ripple::after{top:0;left:0;transform:scale(0);transform-origin:center center}.mdc-text-field--filled.mdc-ripple-upgraded--unbounded .mdc-text-field__ripple::after{top:var(--mdc-ripple-top, 0);left:var(--mdc-ripple-left, 0)}.mdc-text-field--filled.mdc-ripple-upgraded--foreground-activation .mdc-text-field__ripple::after{animation:mdc-ripple-fg-radius-in 225ms forwards,mdc-ripple-fg-opacity-in 75ms forwards}.mdc-text-field--filled.mdc-ripple-upgraded--foreground-deactivation .mdc-text-field__ripple::after{animation:mdc-ripple-fg-opacity-out 150ms;transform:translate(var(--mdc-ripple-fg-translate-end, 0)) scale(var(--mdc-ripple-fg-scale, 1))}.mdc-text-field--filled .mdc-text-field__ripple::before,.mdc-text-field--filled .mdc-text-field__ripple::after{top:calc(50% - 100%);left:calc(50% - 100%);width:200%;height:200%}.mdc-text-field--filled.mdc-ripple-upgraded .mdc-text-field__ripple::after{width:var(--mdc-ripple-fg-size, 100%);height:var(--mdc-ripple-fg-size, 100%)}.mdc-text-field__ripple{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none}.mdc-text-field{border-top-left-radius:4px;border-top-left-radius:var(--mdc-shape-small, 4px);border-top-right-radius:4px;border-top-right-radius:var(--mdc-shape-small, 4px);border-bottom-right-radius:0;border-bottom-left-radius:0;display:inline-flex;align-items:baseline;padding:0 16px;position:relative;box-sizing:border-box;overflow:hidden;will-change:opacity,transform,color}.mdc-text-field:not(.mdc-text-field--disabled) .mdc-floating-label{color:rgba(0, 0, 0, 0.6)}.mdc-text-field:not(.mdc-text-field--disabled) .mdc-text-field__input{color:rgba(0, 0, 0, 0.87)}@media all{.mdc-text-field:not(.mdc-text-field--disabled) .mdc-text-field__input::placeholder{color:rgba(0, 0, 0, 0.54)}}@media all{.mdc-text-field:not(.mdc-text-field--disabled) .mdc-text-field__input:-ms-input-placeholder{color:rgba(0, 0, 0, 0.54)}}.mdc-text-field .mdc-text-field__input{caret-color:#6200ee;caret-color:var(--mdc-theme-primary, #6200ee)}.mdc-text-field:not(.mdc-text-field--disabled)+.mdc-text-field-helper-line .mdc-text-field-helper-text{color:rgba(0, 0, 0, 0.6)}.mdc-text-field:not(.mdc-text-field--disabled) .mdc-text-field-character-counter,.mdc-text-field:not(.mdc-text-field--disabled)+.mdc-text-field-helper-line .mdc-text-field-character-counter{color:rgba(0, 0, 0, 0.6)}.mdc-text-field:not(.mdc-text-field--disabled) .mdc-text-field__icon--leading{color:rgba(0, 0, 0, 0.54)}.mdc-text-field:not(.mdc-text-field--disabled) .mdc-text-field__icon--trailing{color:rgba(0, 0, 0, 0.54)}.mdc-text-field:not(.mdc-text-field--disabled) .mdc-text-field__affix--prefix{color:rgba(0, 0, 0, 0.6)}.mdc-text-field:not(.mdc-text-field--disabled) .mdc-text-field__affix--suffix{color:rgba(0, 0, 0, 0.6)}.mdc-text-field .mdc-floating-label{top:50%;transform:translateY(-50%);pointer-events:none}.mdc-text-field__input{-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;font-family:Roboto, sans-serif;font-family:var(--mdc-typography-subtitle1-font-family, var(--mdc-typography-font-family, Roboto, sans-serif));font-size:1rem;font-size:var(--mdc-typography-subtitle1-font-size, 1rem);font-weight:400;font-weight:var(--mdc-typography-subtitle1-font-weight, 400);letter-spacing:0.009375em;letter-spacing:var(--mdc-typography-subtitle1-letter-spacing, 0.009375em);text-decoration:inherit;text-decoration:var(--mdc-typography-subtitle1-text-decoration, inherit);text-transform:inherit;text-transform:var(--mdc-typography-subtitle1-text-transform, inherit);height:28px;transition:opacity 150ms cubic-bezier(0.4, 0, 0.2, 1);width:100%;min-width:0;border:none;border-radius:0;background:none;appearance:none;padding:0}.mdc-text-field__input::-ms-clear{display:none}.mdc-text-field__input::-webkit-calendar-picker-indicator{display:none}.mdc-text-field__input:focus{outline:none}.mdc-text-field__input:invalid{box-shadow:none}@media all{.mdc-text-field__input::placeholder{transition:opacity 67ms cubic-bezier(0.4, 0, 0.2, 1);opacity:0}}@media all{.mdc-text-field__input:-ms-input-placeholder{transition:opacity 67ms cubic-bezier(0.4, 0, 0.2, 1);opacity:0}}@media all{.mdc-text-field--no-label .mdc-text-field__input::placeholder,.mdc-text-field--focused .mdc-text-field__input::placeholder{transition-delay:40ms;transition-duration:110ms;opacity:1}}@media all{.mdc-text-field--no-label .mdc-text-field__input:-ms-input-placeholder,.mdc-text-field--focused .mdc-text-field__input:-ms-input-placeholder{transition-delay:40ms;transition-duration:110ms;opacity:1}}.mdc-text-field__affix{-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;font-family:Roboto, sans-serif;font-family:var(--mdc-typography-subtitle1-font-family, var(--mdc-typography-font-family, Roboto, sans-serif));font-size:1rem;font-size:var(--mdc-typography-subtitle1-font-size, 1rem);font-weight:400;font-weight:var(--mdc-typography-subtitle1-font-weight, 400);letter-spacing:0.009375em;letter-spacing:var(--mdc-typography-subtitle1-letter-spacing, 0.009375em);text-decoration:inherit;text-decoration:var(--mdc-typography-subtitle1-text-decoration, inherit);text-transform:inherit;text-transform:var(--mdc-typography-subtitle1-text-transform, inherit);height:28px;transition:opacity 150ms cubic-bezier(0.4, 0, 0.2, 1);opacity:0;white-space:nowrap}.mdc-text-field--label-floating .mdc-text-field__affix,.mdc-text-field--no-label .mdc-text-field__affix{opacity:1}@supports(-webkit-hyphens: none){.mdc-text-field--outlined .mdc-text-field__affix{align-items:center;align-self:center;display:inline-flex;height:100%}}.mdc-text-field__affix--prefix{padding-left:0;padding-right:2px}[dir=rtl] .mdc-text-field__affix--prefix,.mdc-text-field__affix--prefix[dir=rtl]{padding-left:2px;padding-right:0}.mdc-text-field--end-aligned .mdc-text-field__affix--prefix{padding-left:0;padding-right:12px}[dir=rtl] .mdc-text-field--end-aligned .mdc-text-field__affix--prefix,.mdc-text-field--end-aligned .mdc-text-field__affix--prefix[dir=rtl]{padding-left:12px;padding-right:0}.mdc-text-field__affix--suffix{padding-left:12px;padding-right:0}[dir=rtl] .mdc-text-field__affix--suffix,.mdc-text-field__affix--suffix[dir=rtl]{padding-left:0;padding-right:12px}.mdc-text-field--end-aligned .mdc-text-field__affix--suffix{padding-left:2px;padding-right:0}[dir=rtl] .mdc-text-field--end-aligned .mdc-text-field__affix--suffix,.mdc-text-field--end-aligned .mdc-text-field__affix--suffix[dir=rtl]{padding-left:0;padding-right:2px}.mdc-text-field--filled{height:56px}.mdc-text-field--filled .mdc-text-field__ripple::before,.mdc-text-field--filled .mdc-text-field__ripple::after{background-color:rgba(0, 0, 0, 0.87);background-color:var(--mdc-ripple-color, rgba(0, 0, 0, 0.87))}.mdc-text-field--filled:hover .mdc-text-field__ripple::before,.mdc-text-field--filled.mdc-ripple-surface--hover .mdc-text-field__ripple::before{opacity:0.04;opacity:var(--mdc-ripple-hover-opacity, 0.04)}.mdc-text-field--filled.mdc-ripple-upgraded--background-focused .mdc-text-field__ripple::before,.mdc-text-field--filled:not(.mdc-ripple-upgraded):focus .mdc-text-field__ripple::before{transition-duration:75ms;opacity:0.12;opacity:var(--mdc-ripple-focus-opacity, 0.12)}.mdc-text-field--filled::before{display:inline-block;width:0;height:40px;content:"";vertical-align:0}.mdc-text-field--filled:not(.mdc-text-field--disabled){background-color:whitesmoke}.mdc-text-field--filled:not(.mdc-text-field--disabled) .mdc-line-ripple::before{border-bottom-color:rgba(0, 0, 0, 0.42)}.mdc-text-field--filled:not(.mdc-text-field--disabled):hover .mdc-line-ripple::before{border-bottom-color:rgba(0, 0, 0, 0.87)}.mdc-text-field--filled .mdc-line-ripple::after{border-bottom-color:#6200ee;border-bottom-color:var(--mdc-theme-primary, #6200ee)}.mdc-text-field--filled .mdc-floating-label{left:16px;right:initial}[dir=rtl] .mdc-text-field--filled .mdc-floating-label,.mdc-text-field--filled .mdc-floating-label[dir=rtl]{left:initial;right:16px}.mdc-text-field--filled .mdc-floating-label--float-above{transform:translateY(-106%) scale(0.75)}.mdc-text-field--filled.mdc-text-field--no-label .mdc-text-field__input{height:100%}.mdc-text-field--filled.mdc-text-field--no-label .mdc-floating-label{display:none}.mdc-text-field--filled.mdc-text-field--no-label::before{display:none}@supports(-webkit-hyphens: none){.mdc-text-field--filled.mdc-text-field--no-label .mdc-text-field__affix{align-items:center;align-self:center;display:inline-flex;height:100%}}.mdc-text-field--outlined{height:56px;overflow:visible}.mdc-text-field--outlined .mdc-floating-label--float-above{transform:translateY(-37.25px) scale(1)}.mdc-text-field--outlined .mdc-floating-label--float-above{font-size:.75rem}.mdc-text-field--outlined.mdc-notched-outline--upgraded .mdc-floating-label--float-above,.mdc-text-field--outlined .mdc-notched-outline--upgraded .mdc-floating-label--float-above{transform:translateY(-34.75px) scale(0.75)}.mdc-text-field--outlined.mdc-notched-outline--upgraded .mdc-floating-label--float-above,.mdc-text-field--outlined .mdc-notched-outline--upgraded .mdc-floating-label--float-above{font-size:1rem}.mdc-text-field--outlined .mdc-floating-label--shake{animation:mdc-floating-label-shake-float-above-text-field-outlined 250ms 1}@keyframes mdc-floating-label-shake-float-above-text-field-outlined{0%{transform:translateX(calc(0 - 0%)) translateY(-34.75px) scale(0.75)}33%{animation-timing-function:cubic-bezier(0.5, 0, 0.701732, 0.495819);transform:translateX(calc(4% - 0%)) translateY(-34.75px) scale(0.75)}66%{animation-timing-function:cubic-bezier(0.302435, 0.381352, 0.55, 0.956352);transform:translateX(calc(-4% - 0%)) translateY(-34.75px) scale(0.75)}100%{transform:translateX(calc(0 - 0%)) translateY(-34.75px) scale(0.75)}}.mdc-text-field--outlined .mdc-text-field__input{height:100%}.mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__leading,.mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__notch,.mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__trailing{border-color:rgba(0, 0, 0, 0.38)}.mdc-text-field--outlined:not(.mdc-text-field--disabled):not(.mdc-text-field--focused):hover .mdc-notched-outline .mdc-notched-outline__leading,.mdc-text-field--outlined:not(.mdc-text-field--disabled):not(.mdc-text-field--focused):hover .mdc-notched-outline .mdc-notched-outline__notch,.mdc-text-field--outlined:not(.mdc-text-field--disabled):not(.mdc-text-field--focused):hover .mdc-notched-outline .mdc-notched-outline__trailing{border-color:rgba(0, 0, 0, 0.87)}.mdc-text-field--outlined:not(.mdc-text-field--disabled).mdc-text-field--focused .mdc-notched-outline__leading,.mdc-text-field--outlined:not(.mdc-text-field--disabled).mdc-text-field--focused .mdc-notched-outline__notch,.mdc-text-field--outlined:not(.mdc-text-field--disabled).mdc-text-field--focused .mdc-notched-outline__trailing{border-color:#6200ee;border-color:var(--mdc-theme-primary, #6200ee)}.mdc-text-field--outlined .mdc-notched-outline .mdc-notched-outline__leading{border-top-left-radius:4px;border-top-left-radius:var(--mdc-shape-small, 4px);border-top-right-radius:0;border-bottom-right-radius:0;border-bottom-left-radius:4px;border-bottom-left-radius:var(--mdc-shape-small, 4px)}[dir=rtl] .mdc-text-field--outlined .mdc-notched-outline .mdc-notched-outline__leading,.mdc-text-field--outlined .mdc-notched-outline .mdc-notched-outline__leading[dir=rtl]{border-top-left-radius:0;border-top-right-radius:4px;border-top-right-radius:var(--mdc-shape-small, 4px);border-bottom-right-radius:4px;border-bottom-right-radius:var(--mdc-shape-small, 4px);border-bottom-left-radius:0}@supports(top: max(0%)){.mdc-text-field--outlined .mdc-notched-outline .mdc-notched-outline__leading{width:max(12px, var(--mdc-shape-small, 4px))}}@supports(top: max(0%)){.mdc-text-field--outlined .mdc-notched-outline .mdc-notched-outline__notch{max-width:calc(100% - max(12px, var(--mdc-shape-small, 4px)) * 2)}}.mdc-text-field--outlined .mdc-notched-outline .mdc-notched-outline__trailing{border-top-left-radius:0;border-top-right-radius:4px;border-top-right-radius:var(--mdc-shape-small, 4px);border-bottom-right-radius:4px;border-bottom-right-radius:var(--mdc-shape-small, 4px);border-bottom-left-radius:0}[dir=rtl] .mdc-text-field--outlined .mdc-notched-outline .mdc-notched-outline__trailing,.mdc-text-field--outlined .mdc-notched-outline .mdc-notched-outline__trailing[dir=rtl]{border-top-left-radius:4px;border-top-left-radius:var(--mdc-shape-small, 4px);border-top-right-radius:0;border-bottom-right-radius:0;border-bottom-left-radius:4px;border-bottom-left-radius:var(--mdc-shape-small, 4px)}@supports(top: max(0%)){.mdc-text-field--outlined{padding-left:max(16px, calc(var(--mdc-shape-small, 4px) + 4px))}}@supports(top: max(0%)){.mdc-text-field--outlined{padding-right:max(16px, var(--mdc-shape-small, 4px))}}@supports(top: max(0%)){.mdc-text-field--outlined+.mdc-text-field-helper-line{padding-left:max(16px, calc(var(--mdc-shape-small, 4px) + 4px))}}@supports(top: max(0%)){.mdc-text-field--outlined+.mdc-text-field-helper-line{padding-right:max(16px, var(--mdc-shape-small, 4px))}}.mdc-text-field--outlined.mdc-text-field--with-leading-icon{padding-left:0}@supports(top: max(0%)){.mdc-text-field--outlined.mdc-text-field--with-leading-icon{padding-right:max(16px, var(--mdc-shape-small, 4px))}}[dir=rtl] .mdc-text-field--outlined.mdc-text-field--with-leading-icon,.mdc-text-field--outlined.mdc-text-field--with-leading-icon[dir=rtl]{padding-right:0}@supports(top: max(0%)){[dir=rtl] .mdc-text-field--outlined.mdc-text-field--with-leading-icon,.mdc-text-field--outlined.mdc-text-field--with-leading-icon[dir=rtl]{padding-left:max(16px, var(--mdc-shape-small, 4px))}}.mdc-text-field--outlined.mdc-text-field--with-trailing-icon{padding-right:0}@supports(top: max(0%)){.mdc-text-field--outlined.mdc-text-field--with-trailing-icon{padding-left:max(16px, calc(var(--mdc-shape-small, 4px) + 4px))}}[dir=rtl] .mdc-text-field--outlined.mdc-text-field--with-trailing-icon,.mdc-text-field--outlined.mdc-text-field--with-trailing-icon[dir=rtl]{padding-left:0}@supports(top: max(0%)){[dir=rtl] .mdc-text-field--outlined.mdc-text-field--with-trailing-icon,.mdc-text-field--outlined.mdc-text-field--with-trailing-icon[dir=rtl]{padding-right:max(16px, calc(var(--mdc-shape-small, 4px) + 4px))}}.mdc-text-field--outlined.mdc-text-field--with-leading-icon.mdc-text-field--with-trailing-icon{padding-left:0;padding-right:0}.mdc-text-field--outlined .mdc-notched-outline--notched .mdc-notched-outline__notch{padding-top:1px}.mdc-text-field--outlined .mdc-text-field__ripple::before,.mdc-text-field--outlined .mdc-text-field__ripple::after{content:none}.mdc-text-field--outlined .mdc-floating-label{left:4px;right:initial}[dir=rtl] .mdc-text-field--outlined .mdc-floating-label,.mdc-text-field--outlined .mdc-floating-label[dir=rtl]{left:initial;right:4px}.mdc-text-field--outlined .mdc-text-field__input{display:flex;border:none !important;background-color:transparent}.mdc-text-field--outlined .mdc-notched-outline{z-index:1}.mdc-text-field--textarea{flex-direction:column;align-items:center;width:auto;height:auto;padding:0;transition:none}.mdc-text-field--textarea .mdc-floating-label{top:19px}.mdc-text-field--textarea .mdc-floating-label:not(.mdc-floating-label--float-above){transform:none}.mdc-text-field--textarea .mdc-text-field__input{flex-grow:1;height:auto;min-height:1.5rem;overflow-x:hidden;overflow-y:auto;box-sizing:border-box;resize:none;padding:0 16px;line-height:1.5rem}.mdc-text-field--textarea.mdc-text-field--filled::before{display:none}.mdc-text-field--textarea.mdc-text-field--filled .mdc-floating-label--float-above{transform:translateY(-10.25px) scale(0.75)}.mdc-text-field--textarea.mdc-text-field--filled .mdc-floating-label--shake{animation:mdc-floating-label-shake-float-above-textarea-filled 250ms 1}@keyframes mdc-floating-label-shake-float-above-textarea-filled{0%{transform:translateX(calc(0 - 0%)) translateY(-10.25px) scale(0.75)}33%{animation-timing-function:cubic-bezier(0.5, 0, 0.701732, 0.495819);transform:translateX(calc(4% - 0%)) translateY(-10.25px) scale(0.75)}66%{animation-timing-function:cubic-bezier(0.302435, 0.381352, 0.55, 0.956352);transform:translateX(calc(-4% - 0%)) translateY(-10.25px) scale(0.75)}100%{transform:translateX(calc(0 - 0%)) translateY(-10.25px) scale(0.75)}}.mdc-text-field--textarea.mdc-text-field--filled .mdc-text-field__input{margin-top:23px;margin-bottom:9px}.mdc-text-field--textarea.mdc-text-field--filled.mdc-text-field--no-label .mdc-text-field__input{margin-top:16px;margin-bottom:16px}.mdc-text-field--textarea.mdc-text-field--outlined .mdc-notched-outline--notched .mdc-notched-outline__notch{padding-top:0}.mdc-text-field--textarea.mdc-text-field--outlined .mdc-floating-label--float-above{transform:translateY(-27.25px) scale(1)}.mdc-text-field--textarea.mdc-text-field--outlined .mdc-floating-label--float-above{font-size:.75rem}.mdc-text-field--textarea.mdc-text-field--outlined.mdc-notched-outline--upgraded .mdc-floating-label--float-above,.mdc-text-field--textarea.mdc-text-field--outlined .mdc-notched-outline--upgraded .mdc-floating-label--float-above{transform:translateY(-24.75px) scale(0.75)}.mdc-text-field--textarea.mdc-text-field--outlined.mdc-notched-outline--upgraded .mdc-floating-label--float-above,.mdc-text-field--textarea.mdc-text-field--outlined .mdc-notched-outline--upgraded .mdc-floating-label--float-above{font-size:1rem}.mdc-text-field--textarea.mdc-text-field--outlined .mdc-floating-label--shake{animation:mdc-floating-label-shake-float-above-textarea-outlined 250ms 1}@keyframes mdc-floating-label-shake-float-above-textarea-outlined{0%{transform:translateX(calc(0 - 0%)) translateY(-24.75px) scale(0.75)}33%{animation-timing-function:cubic-bezier(0.5, 0, 0.701732, 0.495819);transform:translateX(calc(4% - 0%)) translateY(-24.75px) scale(0.75)}66%{animation-timing-function:cubic-bezier(0.302435, 0.381352, 0.55, 0.956352);transform:translateX(calc(-4% - 0%)) translateY(-24.75px) scale(0.75)}100%{transform:translateX(calc(0 - 0%)) translateY(-24.75px) scale(0.75)}}.mdc-text-field--textarea.mdc-text-field--outlined .mdc-text-field__input{margin-top:16px;margin-bottom:16px}.mdc-text-field--textarea.mdc-text-field--outlined .mdc-floating-label{top:18px}.mdc-text-field--textarea.mdc-text-field--with-internal-counter .mdc-text-field__input{margin-bottom:2px}.mdc-text-field--textarea.mdc-text-field--with-internal-counter .mdc-text-field-character-counter{align-self:flex-end;padding:0 16px}.mdc-text-field--textarea.mdc-text-field--with-internal-counter .mdc-text-field-character-counter::after{display:inline-block;width:0;height:16px;content:"";vertical-align:-16px}.mdc-text-field--textarea.mdc-text-field--with-internal-counter .mdc-text-field-character-counter::before{display:none}.mdc-text-field__resizer{align-self:stretch;display:inline-flex;flex-direction:column;flex-grow:1;max-height:100%;max-width:100%;min-height:56px;min-width:fit-content;min-width:-moz-available;min-width:-webkit-fill-available;overflow:hidden;resize:both}.mdc-text-field--filled .mdc-text-field__resizer{transform:translateY(-1px)}.mdc-text-field--filled .mdc-text-field__resizer .mdc-text-field__input,.mdc-text-field--filled .mdc-text-field__resizer .mdc-text-field-character-counter{transform:translateY(1px)}.mdc-text-field--outlined .mdc-text-field__resizer{transform:translateX(-1px) translateY(-1px)}[dir=rtl] .mdc-text-field--outlined .mdc-text-field__resizer,.mdc-text-field--outlined .mdc-text-field__resizer[dir=rtl]{transform:translateX(1px) translateY(-1px)}.mdc-text-field--outlined .mdc-text-field__resizer .mdc-text-field__input,.mdc-text-field--outlined .mdc-text-field__resizer .mdc-text-field-character-counter{transform:translateX(1px) translateY(1px)}[dir=rtl] .mdc-text-field--outlined .mdc-text-field__resizer .mdc-text-field__input,.mdc-text-field--outlined .mdc-text-field__resizer .mdc-text-field__input[dir=rtl],[dir=rtl] .mdc-text-field--outlined .mdc-text-field__resizer .mdc-text-field-character-counter,.mdc-text-field--outlined .mdc-text-field__resizer .mdc-text-field-character-counter[dir=rtl]{transform:translateX(-1px) translateY(1px)}.mdc-text-field--with-leading-icon{padding-left:0;padding-right:16px}[dir=rtl] .mdc-text-field--with-leading-icon,.mdc-text-field--with-leading-icon[dir=rtl]{padding-left:16px;padding-right:0}.mdc-text-field--with-leading-icon.mdc-text-field--filled .mdc-floating-label{max-width:calc(100% - 48px);left:48px;right:initial}[dir=rtl] .mdc-text-field--with-leading-icon.mdc-text-field--filled .mdc-floating-label,.mdc-text-field--with-leading-icon.mdc-text-field--filled .mdc-floating-label[dir=rtl]{left:initial;right:48px}.mdc-text-field--with-leading-icon.mdc-text-field--filled .mdc-floating-label--float-above{max-width:calc(100% / 0.75 - 64px / 0.75)}.mdc-text-field--with-leading-icon.mdc-text-field--outlined .mdc-floating-label{left:36px;right:initial}[dir=rtl] .mdc-text-field--with-leading-icon.mdc-text-field--outlined .mdc-floating-label,.mdc-text-field--with-leading-icon.mdc-text-field--outlined .mdc-floating-label[dir=rtl]{left:initial;right:36px}.mdc-text-field--with-leading-icon.mdc-text-field--outlined :not(.mdc-notched-outline--notched) .mdc-notched-outline__notch{max-width:calc(100% - 60px)}.mdc-text-field--with-leading-icon.mdc-text-field--outlined .mdc-floating-label--float-above{transform:translateY(-37.25px) translateX(-32px) scale(1)}[dir=rtl] .mdc-text-field--with-leading-icon.mdc-text-field--outlined .mdc-floating-label--float-above,.mdc-text-field--with-leading-icon.mdc-text-field--outlined .mdc-floating-label--float-above[dir=rtl]{transform:translateY(-37.25px) translateX(32px) scale(1)}.mdc-text-field--with-leading-icon.mdc-text-field--outlined .mdc-floating-label--float-above{font-size:.75rem}.mdc-text-field--with-leading-icon.mdc-text-field--outlined.mdc-notched-outline--upgraded .mdc-floating-label--float-above,.mdc-text-field--with-leading-icon.mdc-text-field--outlined .mdc-notched-outline--upgraded .mdc-floating-label--float-above{transform:translateY(-34.75px) translateX(-32px) scale(0.75)}[dir=rtl] .mdc-text-field--with-leading-icon.mdc-text-field--outlined.mdc-notched-outline--upgraded .mdc-floating-label--float-above,.mdc-text-field--with-leading-icon.mdc-text-field--outlined.mdc-notched-outline--upgraded .mdc-floating-label--float-above[dir=rtl],[dir=rtl] .mdc-text-field--with-leading-icon.mdc-text-field--outlined .mdc-notched-outline--upgraded .mdc-floating-label--float-above,.mdc-text-field--with-leading-icon.mdc-text-field--outlined .mdc-notched-outline--upgraded .mdc-floating-label--float-above[dir=rtl]{transform:translateY(-34.75px) translateX(32px) scale(0.75)}.mdc-text-field--with-leading-icon.mdc-text-field--outlined.mdc-notched-outline--upgraded .mdc-floating-label--float-above,.mdc-text-field--with-leading-icon.mdc-text-field--outlined .mdc-notched-outline--upgraded .mdc-floating-label--float-above{font-size:1rem}.mdc-text-field--with-leading-icon.mdc-text-field--outlined .mdc-floating-label--shake{animation:mdc-floating-label-shake-float-above-text-field-outlined-leading-icon 250ms 1}@keyframes mdc-floating-label-shake-float-above-text-field-outlined-leading-icon{0%{transform:translateX(calc(0 - 32px)) translateY(-34.75px) scale(0.75)}33%{animation-timing-function:cubic-bezier(0.5, 0, 0.701732, 0.495819);transform:translateX(calc(4% - 32px)) translateY(-34.75px) scale(0.75)}66%{animation-timing-function:cubic-bezier(0.302435, 0.381352, 0.55, 0.956352);transform:translateX(calc(-4% - 32px)) translateY(-34.75px) scale(0.75)}100%{transform:translateX(calc(0 - 32px)) translateY(-34.75px) scale(0.75)}}[dir=rtl] .mdc-text-field--with-leading-icon.mdc-text-field--outlined .mdc-floating-label--shake,.mdc-text-field--with-leading-icon.mdc-text-field--outlined[dir=rtl] .mdc-floating-label--shake{animation:mdc-floating-label-shake-float-above-text-field-outlined-leading-icon 250ms 1}@keyframes mdc-floating-label-shake-float-above-text-field-outlined-leading-icon-rtl{0%{transform:translateX(calc(0 - -32px)) translateY(-34.75px) scale(0.75)}33%{animation-timing-function:cubic-bezier(0.5, 0, 0.701732, 0.495819);transform:translateX(calc(4% - -32px)) translateY(-34.75px) scale(0.75)}66%{animation-timing-function:cubic-bezier(0.302435, 0.381352, 0.55, 0.956352);transform:translateX(calc(-4% - -32px)) translateY(-34.75px) scale(0.75)}100%{transform:translateX(calc(0 - -32px)) translateY(-34.75px) scale(0.75)}}.mdc-text-field--with-trailing-icon{padding-left:16px;padding-right:0}[dir=rtl] .mdc-text-field--with-trailing-icon,.mdc-text-field--with-trailing-icon[dir=rtl]{padding-left:0;padding-right:16px}.mdc-text-field--with-trailing-icon.mdc-text-field--filled .mdc-floating-label{max-width:calc(100% - 64px)}.mdc-text-field--with-trailing-icon.mdc-text-field--filled .mdc-floating-label--float-above{max-width:calc(100% / 0.75 - 64px / 0.75)}.mdc-text-field--with-trailing-icon.mdc-text-field--outlined :not(.mdc-notched-outline--notched) .mdc-notched-outline__notch{max-width:calc(100% - 60px)}.mdc-text-field--with-leading-icon.mdc-text-field--with-trailing-icon{padding-left:0;padding-right:0}.mdc-text-field--with-leading-icon.mdc-text-field--with-trailing-icon.mdc-text-field--filled .mdc-floating-label{max-width:calc(100% - 96px)}.mdc-text-field--with-leading-icon.mdc-text-field--with-trailing-icon.mdc-text-field--filled .mdc-floating-label--float-above{max-width:calc(100% / 0.75 - 96px / 0.75)}.mdc-text-field-helper-line{display:flex;justify-content:space-between;box-sizing:border-box}.mdc-text-field+.mdc-text-field-helper-line{padding-right:16px;padding-left:16px}.mdc-form-field>.mdc-text-field+label{align-self:flex-start}.mdc-text-field--focused:not(.mdc-text-field--disabled) .mdc-floating-label{color:rgba(98, 0, 238, 0.87)}.mdc-text-field--focused .mdc-notched-outline__leading,.mdc-text-field--focused .mdc-notched-outline__notch,.mdc-text-field--focused .mdc-notched-outline__trailing{border-width:2px}.mdc-text-field--focused+.mdc-text-field-helper-line .mdc-text-field-helper-text:not(.mdc-text-field-helper-text--validation-msg){opacity:1}.mdc-text-field--focused.mdc-text-field--outlined .mdc-notched-outline--notched .mdc-notched-outline__notch{padding-top:2px}.mdc-text-field--focused.mdc-text-field--outlined.mdc-text-field--textarea .mdc-notched-outline--notched .mdc-notched-outline__notch{padding-top:0}.mdc-text-field--invalid:not(.mdc-text-field--disabled):hover .mdc-line-ripple::before{border-bottom-color:#b00020;border-bottom-color:var(--mdc-theme-error, #b00020)}.mdc-text-field--invalid:not(.mdc-text-field--disabled) .mdc-line-ripple::after{border-bottom-color:#b00020;border-bottom-color:var(--mdc-theme-error, #b00020)}.mdc-text-field--invalid:not(.mdc-text-field--disabled) .mdc-floating-label{color:#b00020;color:var(--mdc-theme-error, #b00020)}.mdc-text-field--invalid:not(.mdc-text-field--disabled).mdc-text-field--invalid+.mdc-text-field-helper-line .mdc-text-field-helper-text--validation-msg{color:#b00020;color:var(--mdc-theme-error, #b00020)}.mdc-text-field--invalid .mdc-text-field__input{caret-color:#b00020;caret-color:var(--mdc-theme-error, #b00020)}.mdc-text-field--invalid:not(.mdc-text-field--disabled) .mdc-text-field__icon--trailing{color:#b00020;color:var(--mdc-theme-error, #b00020)}.mdc-text-field--invalid:not(.mdc-text-field--disabled) .mdc-line-ripple::before{border-bottom-color:#b00020;border-bottom-color:var(--mdc-theme-error, #b00020)}.mdc-text-field--invalid:not(.mdc-text-field--disabled) .mdc-notched-outline__leading,.mdc-text-field--invalid:not(.mdc-text-field--disabled) .mdc-notched-outline__notch,.mdc-text-field--invalid:not(.mdc-text-field--disabled) .mdc-notched-outline__trailing{border-color:#b00020;border-color:var(--mdc-theme-error, #b00020)}.mdc-text-field--invalid:not(.mdc-text-field--disabled):not(.mdc-text-field--focused):hover .mdc-notched-outline .mdc-notched-outline__leading,.mdc-text-field--invalid:not(.mdc-text-field--disabled):not(.mdc-text-field--focused):hover .mdc-notched-outline .mdc-notched-outline__notch,.mdc-text-field--invalid:not(.mdc-text-field--disabled):not(.mdc-text-field--focused):hover .mdc-notched-outline .mdc-notched-outline__trailing{border-color:#b00020;border-color:var(--mdc-theme-error, #b00020)}.mdc-text-field--invalid:not(.mdc-text-field--disabled).mdc-text-field--focused .mdc-notched-outline__leading,.mdc-text-field--invalid:not(.mdc-text-field--disabled).mdc-text-field--focused .mdc-notched-outline__notch,.mdc-text-field--invalid:not(.mdc-text-field--disabled).mdc-text-field--focused .mdc-notched-outline__trailing{border-color:#b00020;border-color:var(--mdc-theme-error, #b00020)}.mdc-text-field--invalid+.mdc-text-field-helper-line .mdc-text-field-helper-text--validation-msg{opacity:1}.mdc-text-field--disabled{pointer-events:none}.mdc-text-field--disabled .mdc-text-field__input{color:rgba(0, 0, 0, 0.38)}@media all{.mdc-text-field--disabled .mdc-text-field__input::placeholder{color:rgba(0, 0, 0, 0.38)}}@media all{.mdc-text-field--disabled .mdc-text-field__input:-ms-input-placeholder{color:rgba(0, 0, 0, 0.38)}}.mdc-text-field--disabled .mdc-floating-label{color:rgba(0, 0, 0, 0.38)}.mdc-text-field--disabled+.mdc-text-field-helper-line .mdc-text-field-helper-text{color:rgba(0, 0, 0, 0.38)}.mdc-text-field--disabled .mdc-text-field-character-counter,.mdc-text-field--disabled+.mdc-text-field-helper-line .mdc-text-field-character-counter{color:rgba(0, 0, 0, 0.38)}.mdc-text-field--disabled .mdc-text-field__icon--leading{color:rgba(0, 0, 0, 0.3)}.mdc-text-field--disabled .mdc-text-field__icon--trailing{color:rgba(0, 0, 0, 0.3)}.mdc-text-field--disabled .mdc-text-field__affix--prefix{color:rgba(0, 0, 0, 0.38)}.mdc-text-field--disabled .mdc-text-field__affix--suffix{color:rgba(0, 0, 0, 0.38)}.mdc-text-field--disabled .mdc-line-ripple::before{border-bottom-color:rgba(0, 0, 0, 0.06)}.mdc-text-field--disabled .mdc-notched-outline__leading,.mdc-text-field--disabled .mdc-notched-outline__notch,.mdc-text-field--disabled .mdc-notched-outline__trailing{border-color:rgba(0, 0, 0, 0.06)}@media screen and (-ms-high-contrast: active){.mdc-text-field--disabled .mdc-text-field__input::placeholder{color:GrayText}}@media screen and (-ms-high-contrast: active){.mdc-text-field--disabled .mdc-text-field__input:-ms-input-placeholder{color:GrayText}}@media screen and (-ms-high-contrast: active){.mdc-text-field--disabled .mdc-floating-label{color:GrayText}}@media screen and (-ms-high-contrast: active){.mdc-text-field--disabled+.mdc-text-field-helper-line .mdc-text-field-helper-text{color:GrayText}}@media screen and (-ms-high-contrast: active){.mdc-text-field--disabled .mdc-text-field-character-counter,.mdc-text-field--disabled+.mdc-text-field-helper-line .mdc-text-field-character-counter{color:GrayText}}@media screen and (-ms-high-contrast: active){.mdc-text-field--disabled .mdc-text-field__icon--leading{color:GrayText}}@media screen and (-ms-high-contrast: active){.mdc-text-field--disabled .mdc-text-field__icon--trailing{color:GrayText}}@media screen and (-ms-high-contrast: active){.mdc-text-field--disabled .mdc-text-field__affix--prefix{color:GrayText}}@media screen and (-ms-high-contrast: active){.mdc-text-field--disabled .mdc-text-field__affix--suffix{color:GrayText}}@media screen and (-ms-high-contrast: active){.mdc-text-field--disabled .mdc-line-ripple::before{border-bottom-color:GrayText}}@media screen and (-ms-high-contrast: active){.mdc-text-field--disabled .mdc-notched-outline__leading,.mdc-text-field--disabled .mdc-notched-outline__notch,.mdc-text-field--disabled .mdc-notched-outline__trailing{border-color:GrayText}}.mdc-text-field--disabled .mdc-floating-label{cursor:default}.mdc-text-field--disabled.mdc-text-field--filled{background-color:#fafafa}.mdc-text-field--disabled.mdc-text-field--filled .mdc-text-field__ripple{display:none}.mdc-text-field--disabled .mdc-text-field__input{pointer-events:auto}.mdc-text-field--end-aligned .mdc-text-field__input{text-align:right}[dir=rtl] .mdc-text-field--end-aligned .mdc-text-field__input,.mdc-text-field--end-aligned .mdc-text-field__input[dir=rtl]{text-align:left}[dir=rtl] .mdc-text-field--ltr-text .mdc-text-field__input,[dir=rtl] .mdc-text-field--ltr-text .mdc-text-field__affix,.mdc-text-field--ltr-text[dir=rtl] .mdc-text-field__input,.mdc-text-field--ltr-text[dir=rtl] .mdc-text-field__affix{direction:ltr}[dir=rtl] .mdc-text-field--ltr-text .mdc-text-field__affix--prefix,.mdc-text-field--ltr-text[dir=rtl] .mdc-text-field__affix--prefix{padding-left:0;padding-right:2px}[dir=rtl] .mdc-text-field--ltr-text .mdc-text-field__affix--suffix,.mdc-text-field--ltr-text[dir=rtl] .mdc-text-field__affix--suffix{padding-left:12px;padding-right:0}[dir=rtl] .mdc-text-field--ltr-text .mdc-text-field__icon--leading,.mdc-text-field--ltr-text[dir=rtl] .mdc-text-field__icon--leading{order:1}[dir=rtl] .mdc-text-field--ltr-text .mdc-text-field__affix--suffix,.mdc-text-field--ltr-text[dir=rtl] .mdc-text-field__affix--suffix{order:2}[dir=rtl] .mdc-text-field--ltr-text .mdc-text-field__input,.mdc-text-field--ltr-text[dir=rtl] .mdc-text-field__input{order:3}[dir=rtl] .mdc-text-field--ltr-text .mdc-text-field__affix--prefix,.mdc-text-field--ltr-text[dir=rtl] .mdc-text-field__affix--prefix{order:4}[dir=rtl] .mdc-text-field--ltr-text .mdc-text-field__icon--trailing,.mdc-text-field--ltr-text[dir=rtl] .mdc-text-field__icon--trailing{order:5}[dir=rtl] .mdc-text-field--ltr-text.mdc-text-field--end-aligned .mdc-text-field__input,.mdc-text-field--ltr-text.mdc-text-field--end-aligned[dir=rtl] .mdc-text-field__input{text-align:right}[dir=rtl] .mdc-text-field--ltr-text.mdc-text-field--end-aligned .mdc-text-field__affix--prefix,.mdc-text-field--ltr-text.mdc-text-field--end-aligned[dir=rtl] .mdc-text-field__affix--prefix{padding-right:12px}[dir=rtl] .mdc-text-field--ltr-text.mdc-text-field--end-aligned .mdc-text-field__affix--suffix,.mdc-text-field--ltr-text.mdc-text-field--end-aligned[dir=rtl] .mdc-text-field__affix--suffix{padding-left:2px}.mdc-text-field-helper-text{-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;font-family:Roboto, sans-serif;font-family:var(--mdc-typography-caption-font-family, var(--mdc-typography-font-family, Roboto, sans-serif));font-size:0.75rem;font-size:var(--mdc-typography-caption-font-size, 0.75rem);line-height:1.25rem;line-height:var(--mdc-typography-caption-line-height, 1.25rem);font-weight:400;font-weight:var(--mdc-typography-caption-font-weight, 400);letter-spacing:0.0333333333em;letter-spacing:var(--mdc-typography-caption-letter-spacing, 0.0333333333em);text-decoration:inherit;text-decoration:var(--mdc-typography-caption-text-decoration, inherit);text-transform:inherit;text-transform:var(--mdc-typography-caption-text-transform, inherit);display:block;margin-top:0;line-height:normal;margin:0;opacity:0;will-change:opacity;transition:opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)}.mdc-text-field-helper-text::before{display:inline-block;width:0;height:16px;content:"";vertical-align:0}.mdc-text-field-helper-text--persistent{transition:none;opacity:1;will-change:initial}.mdc-text-field-character-counter{-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;font-family:Roboto, sans-serif;font-family:var(--mdc-typography-caption-font-family, var(--mdc-typography-font-family, Roboto, sans-serif));font-size:0.75rem;font-size:var(--mdc-typography-caption-font-size, 0.75rem);line-height:1.25rem;line-height:var(--mdc-typography-caption-line-height, 1.25rem);font-weight:400;font-weight:var(--mdc-typography-caption-font-weight, 400);letter-spacing:0.0333333333em;letter-spacing:var(--mdc-typography-caption-letter-spacing, 0.0333333333em);text-decoration:inherit;text-decoration:var(--mdc-typography-caption-text-decoration, inherit);text-transform:inherit;text-transform:var(--mdc-typography-caption-text-transform, inherit);display:block;margin-top:0;line-height:normal;margin-left:auto;margin-right:0;padding-left:16px;padding-right:0;white-space:nowrap}.mdc-text-field-character-counter::before{display:inline-block;width:0;height:16px;content:"";vertical-align:0}[dir=rtl] .mdc-text-field-character-counter,.mdc-text-field-character-counter[dir=rtl]{margin-left:0;margin-right:auto}[dir=rtl] .mdc-text-field-character-counter,.mdc-text-field-character-counter[dir=rtl]{padding-left:0;padding-right:16px}.mdc-text-field__icon{align-self:center;cursor:pointer}.mdc-text-field__icon:not([tabindex]),.mdc-text-field__icon[tabindex="-1"]{cursor:default;pointer-events:none}.mdc-text-field__icon svg{display:block}.mdc-text-field__icon--leading{margin-left:16px;margin-right:8px}[dir=rtl] .mdc-text-field__icon--leading,.mdc-text-field__icon--leading[dir=rtl]{margin-left:8px;margin-right:16px}.mdc-text-field__icon--trailing{padding:12px;margin-left:0px;margin-right:0px}[dir=rtl] .mdc-text-field__icon--trailing,.mdc-text-field__icon--trailing[dir=rtl]{margin-left:0px;margin-right:0px}.material-icons{font-family:var(--mdc-icon-font, "Material Icons");font-weight:normal;font-style:normal;font-size:var(--mdc-icon-size, 24px);line-height:1;letter-spacing:normal;text-transform:none;display:inline-block;white-space:nowrap;word-wrap:normal;direction:ltr;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;-moz-osx-font-smoothing:grayscale;font-feature-settings:"liga"}:host{display:inline-flex;flex-direction:column;outline:none}.mdc-text-field{width:100%}.mdc-text-field:not(.mdc-text-field--disabled) .mdc-line-ripple::before{border-bottom-color:rgba(0, 0, 0, 0.42);border-bottom-color:var(--mdc-text-field-idle-line-color, rgba(0, 0, 0, 0.42))}.mdc-text-field:not(.mdc-text-field--disabled):hover .mdc-line-ripple::before{border-bottom-color:rgba(0, 0, 0, 0.87);border-bottom-color:var(--mdc-text-field-hover-line-color, rgba(0, 0, 0, 0.87))}.mdc-text-field.mdc-text-field--disabled .mdc-line-ripple::before{border-bottom-color:rgba(0, 0, 0, 0.06);border-bottom-color:var(--mdc-text-field-disabled-line-color, rgba(0, 0, 0, 0.06))}.mdc-text-field.mdc-text-field--invalid:not(.mdc-text-field--disabled) .mdc-line-ripple::before{border-bottom-color:#b00020;border-bottom-color:var(--mdc-theme-error, #b00020)}mwc-notched-outline{--mdc-notched-outline-border-color: var(--mdc-text-field-outlined-idle-border-color, rgba(0, 0, 0, 0.38))}:host(:not([disabled]):hover) :not(.mdc-text-field--invalid):not(.mdc-text-field--focused) mwc-notched-outline{--mdc-notched-outline-border-color: var(--mdc-text-field-outlined-hover-border-color, rgba(0, 0, 0, 0.87))}:host(:not([disabled])) .mdc-text-field:not(.mdc-text-field--outlined){background-color:var(--mdc-text-field-fill-color, whitesmoke)}:host(:not([disabled])) .mdc-text-field.mdc-text-field--invalid mwc-notched-outline{--mdc-notched-outline-border-color: var(--mdc-text-field-error-color, var(--mdc-theme-error, #b00020))}:host(:not([disabled])) .mdc-text-field.mdc-text-field--invalid+.mdc-text-field-helper-line .mdc-text-field-character-counter,:host(:not([disabled])) .mdc-text-field.mdc-text-field--invalid .mdc-text-field__icon{color:var(--mdc-text-field-error-color, var(--mdc-theme-error, #b00020))}:host(:not([disabled])) .mdc-text-field:not(.mdc-text-field--invalid):not(.mdc-text-field--focused) .mdc-floating-label,:host(:not([disabled])) .mdc-text-field:not(.mdc-text-field--invalid):not(.mdc-text-field--focused) .mdc-floating-label::after{color:var(--mdc-text-field-label-ink-color, rgba(0, 0, 0, 0.6))}:host(:not([disabled])) .mdc-text-field.mdc-text-field--focused mwc-notched-outline{--mdc-notched-outline-stroke-width: 2px}:host(:not([disabled])) .mdc-text-field.mdc-text-field--focused:not(.mdc-text-field--invalid) mwc-notched-outline{--mdc-notched-outline-border-color: var(--mdc-text-field-focused-label-color, var(--mdc-theme-primary, rgba(98, 0, 238, 0.87)))}:host(:not([disabled])) .mdc-text-field.mdc-text-field--focused:not(.mdc-text-field--invalid) .mdc-floating-label{color:#6200ee;color:var(--mdc-theme-primary, #6200ee)}:host(:not([disabled])) .mdc-text-field .mdc-text-field__input{color:var(--mdc-text-field-ink-color, rgba(0, 0, 0, 0.87))}:host(:not([disabled])) .mdc-text-field .mdc-text-field__input::placeholder{color:var(--mdc-text-field-label-ink-color, rgba(0, 0, 0, 0.6))}:host(:not([disabled])) .mdc-text-field-helper-line .mdc-text-field-helper-text:not(.mdc-text-field-helper-text--validation-msg),:host(:not([disabled])) .mdc-text-field-helper-line:not(.mdc-text-field--invalid) .mdc-text-field-character-counter{color:var(--mdc-text-field-label-ink-color, rgba(0, 0, 0, 0.6))}:host([disabled]) .mdc-text-field:not(.mdc-text-field--outlined){background-color:var(--mdc-text-field-disabled-fill-color, #fafafa)}:host([disabled]) .mdc-text-field.mdc-text-field--outlined mwc-notched-outline{--mdc-notched-outline-border-color: var(--mdc-text-field-outlined-disabled-border-color, rgba(0, 0, 0, 0.06))}:host([disabled]) .mdc-text-field:not(.mdc-text-field--invalid):not(.mdc-text-field--focused) .mdc-floating-label,:host([disabled]) .mdc-text-field:not(.mdc-text-field--invalid):not(.mdc-text-field--focused) .mdc-floating-label::after{color:var(--mdc-text-field-disabled-ink-color, rgba(0, 0, 0, 0.38))}:host([disabled]) .mdc-text-field .mdc-text-field__input,:host([disabled]) .mdc-text-field .mdc-text-field__input::placeholder{color:var(--mdc-text-field-disabled-ink-color, rgba(0, 0, 0, 0.38))}:host([disabled]) .mdc-text-field-helper-line .mdc-text-field-helper-text,:host([disabled]) .mdc-text-field-helper-line .mdc-text-field-character-counter{color:var(--mdc-text-field-disabled-ink-color, rgba(0, 0, 0, 0.38))}`;

  // node_modules/@material/mwc-textfield/mwc-textfield.js
  /**
  @license
  Copyright 2019 Google Inc. All Rights Reserved.
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
      http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  */
  var TextField = class TextField2 extends TextFieldBase {
  };
  TextField.styles = style14;
  TextField = __decorate([
    customElement("mwc-textfield")
  ], TextField);

  // ui/generic-input.js
  var KIND_DESCRIPTIONS = {
    constant: "Constant value",
    "last-result": "Result of last operation"
  };
  var GenericInput = class extends LitElement {
    static get properties() {
      return {
        kind: {type: String},
        value: {type: Number},
        type: {type: String},
        annotation: {type: String},
        allowedKinds: {type: Array}
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
      this.kind = this.allowedKinds[0];
    }
    _dispatchChangeEvent() {
      this.dispatchEvent(new CustomEvent("inputChange", {
        detail: {
          kind: this.kind,
          constantValue: this.kind === "constant" ? this.value : void 0
        }
      }));
    }
    _valueChanged(evt) {
      this.value = evt.target.value || Number(evt.target.checked);
      this._dispatchChangeEvent();
    }
    _kindChanged(evt) {
      this.kind = evt.target.value;
      this._dispatchChangeEvent();
    }
    render() {
      let options = this.allowedKinds.map((kind, index) => html`
      <mwc-list-item selected="${index === 0}" @change=${this._kindChanged} value="${kind}">
        ${KIND_DESCRIPTIONS[kind]}
      </mwc-list-item>
    `);
      let valueField;
      if (this.kind === "constant") {
        switch (this.type) {
          case "int":
            valueField = html`<mwc-textfield outlined label="Value" @change=${this._valueChanged} value="${this.value}">
            </mwc-textfield>`;
            break;
          case "bool":
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
  };
  customElements.define("generic-input", GenericInput);

  // ui/code-block.js
  var SUPPORTED_TYPES = ["int", "bool"];
  var CodeBlock = class extends LitElement {
    static get properties() {
      return {
        node: {type: Object},
        index: {type: Number}
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
}

.content {
  padding: 0 8px 16px 8px;
}

.description {
  font-size: 1.1rem;
  font-weight: 500;
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

.input {
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: center;
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
    }
    connectedCallback() {
      super.connectedCallback();
    }
    disconnectedCallback() {
      super.disconnectedCallback();
    }
    _inputChange(evt, input) {
      input.value = evt.detail;
      this.codeModel.notifyNodeUpdated(this.node);
    }
    _dragStart(ev) {
      if (this._isMeta) {
        ev.preventDefault();
        return;
      }
      ev.dataTransfer.setData("node", this.node);
      ev.dataTransfer.setData("index", this.index);
    }
    _remove() {
      this.codeModel.removeNode(this.node);
    }
    get _isMeta() {
      return this.node.type === "meta";
    }
    _renderInput(input) {
      return html`
<div class="input">
  <p class="input-name">${input.name}</p>
  <generic-input .value=${input.value.constantValue} .type=${input.type} .annotation=${input.annotation}
    @inputChange="${(evt) => this._inputChange(evt, input)}">
  </generic-input>
</div>
    `;
    }
    _renderOutput(output) {
      return html`
<div class="output">
  <span class="output-name">${output.name}</span>
  <span class="output-type">(${output.type})</span>
</div>
    `;
    }
    render() {
      let inputs, outputs;
      if (this.node.data.inputs && this.node.data.inputs.length) {
        inputs = this.node.data.inputs.filter((input) => SUPPORTED_TYPES.includes(input.type)).map((input) => this._renderInput(input));
      }
      if (this.node.data.outputs && this.node.data.outputs.length) {
        outputs = this.node.data.outputs.map((output) => this._renderOutput(output));
      }
      return html`
<div class="head" draggable="true" @dragstart="${this._dragStart}">
  <h3>${this.node.name}</h3>
  ${!this._isMeta ? html`<mwc-icon-button icon="delete" @click="${this._remove}"></mwc-icon-button>` : ""}
</div>
<div class="content">
  <p class="description">${this.node.data.description}</p>
  <h3>Inputs</h3>
  <div class="inputs">${inputs}</div>
  ${outputs ? html`<h3>Outputs</h3><div class="outputs">${outputs}</div>` : ""}
</div>
`;
    }
  };
  customElements.define("code-block", CodeBlock);

  // ui/block-editor.js
  var BlockEditor = class extends LitElement {
    static get properties() {
      return {
        nodes: {type: Array},
        dragOverNodeIndex: {type: Number}
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
      this.dragOverNodeIndex = void 0;
    }
    async connectedCallback() {
      super.connectedCallback();
      this.codeModel.onNodeAdded.addListener(this._nodeAdded.bind(this));
      this.codeModel.onNodeRemoved.addListener(this._nodeRemoved.bind(this));
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
      this.shadowRoot.querySelector("block-menu").show();
    }
    _dragOver(ev) {
      ev.preventDefault();
      this.dragOverNodeIndex = ev.target.index;
    }
    _dragLeave(ev) {
      this.dragOverNodeIndex = void 0;
    }
    _drop(ev) {
      ev.preventDefault();
      let sourceNodeIndex = parseInt(ev.dataTransfer.getData("index"));
      let sourceNode = this.nodes[sourceNodeIndex];
      let targetNode = this.nodes[this.dragOverNodeIndex];
      if (!targetNode) {
        return;
      }
      this.dragOverNodeIndex = void 0;
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
    ${this.dragOverNodeIndex === index ? html`<div class="drop-indicator">Drop to move here</div>` : html`<div class="line"></div>`}
  </div>
`)}
</div>
<div class="button-with-menu">
  <mwc-button outlined icon="add" @click="${this._showMenu}"></mwc-button>
  <block-menu></block-menu>
</div>
`;
    }
  };
  customElements.define("block-editor", BlockEditor);

  // ui/app-root.js
  var AppRoot = class extends LitElement {
    static get properties() {
      return {loading: {type: Boolean}};
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
        this.codeEditor = CodeMirror.fromTextArea(this.querySelector("#code"), {
          lineNumbers: true,
          mode: {
            name: "gas",
            architecture: "ARM"
          }
        });
        this.codeEditor.setValue(this.codeModel.generateCode());
      });
      this.codeModel.onChanged.addListener(this._generateCode.bind(this));
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this.codeModel.onChanged.removeListener(this._generateCode);
    }
    createRenderRoot() {
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
      let file = new Blob([this.codeEditor.getValue()], {type: "text/plain"});
      let url = URL.createObjectURL(file);
      a.href = url;
      a.download = "code.asm";
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
<block-editor></block-editor>
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
</div>
`;
    }
  };
  customElements.define("app-root", AppRoot);
  function getCodeModel() {
    return document.getElementById("app-root").codeModel;
  }
})();
