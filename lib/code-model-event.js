export class CodeModelEvent {
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

  emit(value = undefined) {
    for (const listener of this._listeners) {
      if (listener) {
        listener(value);
      }
    }
  }
}
