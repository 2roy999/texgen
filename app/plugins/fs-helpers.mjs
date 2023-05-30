import { join } from 'path'

import FsPlugin from './fs.mjs'

export class DestinationReaderPlugin {
  dependencies = [FsPlugin]

  constructor (options) {
    this._destinationRoot = options.destinationRoot
  }

  async init ({ fs }) {
    this._fs = fs
  }

  instance () {
    return {
      readDestination: (path, ...args) => {
        return this._fs.read(join(this._destinationRoot, path), ...args)
      },
      readDestinationJson: (path, ...args) => {
        return this._fs.readJSON(join(this._destinationRoot, path), ...args)
      }
    }
  }
}

export class DestinationWriterPlugin {
  dependencies = [FsPlugin]

  constructor (options) {
    this._destinationRoot = options.destinationRoot
  }

  async init ({ fs }) {
    this._fs = fs
  }

  instance () {
    return {
      writeDestination: (path, ...args) => {
        return this._fs.write(join(this._destinationRoot, path), ...args)
      },
      writeDestinationJson: (path, ...args) => {
        return this._fs.writeJSON(join(this._destinationRoot, path), ...args)
      }
    }
  }
}

export class TemplatesReaderPlugin {
  dependencies = [FsPlugin]

  constructor (options) {
    this._templatesRoot = options.templatesRoot
  }

  async init ({ fs }) {
    this._fs = fs
  }

  instance () {
    return {
      readTemplate: (path, ...args) => {
        return this._fs.read(join(this._templatesRoot, path), ...args)
      },
      readTemplateJson: (path, ...args) => {
        return this._fs.readJSON(join(this._templatesRoot, path), ...args)
      }
    }
  }
}
