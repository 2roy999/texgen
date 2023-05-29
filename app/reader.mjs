
import path from 'path'

export default class FsReader {
  constructor (fs, typePaths) {
    this._fs = fs
    this._typePaths = typePaths
  }

  read(type, relativePath, opts) {
    return this._fs.read(path.join(this._typePaths[type], relativePath), opts)
  }

}
