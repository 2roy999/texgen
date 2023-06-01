import { DestinationReaderPlugin, DestinationWriterPlugin } from './fs-helpers.mjs'
import FsPlugin from './fs.mjs'

class AbstractStoragePlugin {
  constructor (storagePath, storageName) {
    this._storagePath = storagePath
    this._stroageName = storageName
  }

  async init (services) {
    const { read, write } = this._normalizeServices(services)
    this._storage = await read(this._storagePath, {})
    this._write = write
  }

  instance (request) {
    const bucket = `${request.type}-${request.name}-${request.id}`
    this._storage[bucket] = this._storage[bucket] ?? {}

    return {
      [this._stroageName]: this._storage[bucket]
    }
  }

  async end () {
    await this._write(this._storagePath, this._storage)
  }
}

export class LocalStoragePlugin extends AbstractStoragePlugin {
  dependencies = [DestinationReaderPlugin, DestinationWriterPlugin]

  constructor (options) {
    super(options.localStoragePath, 'localStorage')
  }

  _normalizeServices (services) {
    return {
      read: services.readDestinationJson,
      write: services.writeDestinationJson
    }
  }
}

export class GlobalStoragePlugin extends AbstractStoragePlugin {
  dependencies = [FsPlugin]

  constructor (options) {
    super(options.globalStoragePath, 'globalStorage')
  }

  _normalizeServices (services) {
    return {
      read: services.fs.readJSON.bind(services.fs),
      write: services.fs.writeJSON.bind(services.fs)
    }
  }
}
