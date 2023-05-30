import { DestinationReaderPlugin, DestinationWriterPlugin } from './fs-helpers.mjs'

export default class LocalStoragePlugin {
  dependencies = [
    DestinationReaderPlugin,
    DestinationWriterPlugin
  ]

  constructor (options) {
    this._localStoragePath = options.localStoragePath
  }

  async init ({ readDestinationJson, writeDestinationJson }) {
    this._localStorage = readDestinationJson(this._localStoragePath, {})
    this._writeJson = writeDestinationJson
  }

  instance (request) {
    const bucket = `${request.type}-${request.name}-${request.id}`
    this._localStorage[bucket] = this._localStorage[bucket] ?? {}

    return {
      localStorage: this._localStorage[bucket]
    }
  }

  async end () {
    await this._writeJson(this._localStoragePath, this._localStorage)
  }
}
