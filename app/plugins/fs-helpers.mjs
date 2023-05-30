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
      readDestination: async (path, ...args) => {
        return await this._fs.read(join(this._destinationRoot, path), ...args)
      },
      readDestinationJson: async (path, ...args) => {
        return await this._fs.readJSON(join(this._destinationRoot, path), ...args)
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
      writeDestination: async (path, ...args) => {
        return this._fs.write(join(this._destinationRoot, path), ...args)
      },
      writeDestinationJson: async (path, ...args) => {
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
      readTemplate: async (path, ...args) => {
        return await this._fs.read(join(this._templatesRoot, path), ...args)
      },
      readTemplateJson: async (path, ...args) => {
        return await this._fs.readJSON(join(this._templatesRoot, path), ...args)
      }
    }
  }
}
