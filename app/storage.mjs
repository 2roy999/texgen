function deepClone (obj) {
  if (Array.isArray(obj)) {
    return obj.map(e => deepClone(e))
  } else if (typeof obj === 'object' && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, deepClone(v)])
    )
  } else if (['string', 'number', 'boolean'].includes(typeof obj)) {
    return obj
  } else if ([undefined, null].includes(obj)) {
    return undefined
  } else {
    throw Error('Can\'t store this value')
  }
}

const SECRET = Object()

export default class Storage {
  constructor (data, prefix, secret) {
    if (secret === SECRET) {
      this._data = data
      this._prefix = prefix
    } else {
      this._data = deepClone(data)
      this._prefix = []
    }
  }

  proxy () {
    throw new Error('Not Implemented')
  }

  sub (path) {
    if (!Array.isArray(path)) {
      path = [path]
    }
    if (this.getPath(path) === undefined) {
      this.setPath(path, {})
    }

    return new Storage(this._data, this._prefix.concat(path), SECRET)
  }

  delete () {
    throw new Error('Not Implemented')
  }

  get (key) {
    return this.getPath([key])
  }

  getPath (path) {
    return deepClone(this._prefix.concat(path)
      .reduce((obj, key) => obj?.[key], this._data))
  }

  getAll () {
    return this.getPath([])
  }

  set (key, value) {
    this.setPath([key], value)
  }

  setPath (path, value) {
    const pathHead = this._prefix.concat(path.slice(0, -1))
    const lastKey = path.at(-1)

    const object = pathHead.reduce((obj, key) => {
      obj[key] = obj[key] || {}
      if (typeof obj[key] !== 'object') {
        throw Error('cannot set path on non-object')
      }
      return obj[key]
    }, this._data)

    object[lastKey] = deepClone(value)
  }

  merge (obj) {
    throw new Error('Not Implemented')
  }
}
