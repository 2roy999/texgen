
import * as editor from 'mem-fs-editor'
import memFs from 'mem-fs'

export default class FsPlugin {
  dependencies = []

  async init () {
    this._fs = editor.create(memFs.create())
  }

  instance () {
    return {
      fs: this._fs
    }
  }

  async end () {
    await this._fs.commit()
  }
}
