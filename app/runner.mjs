import ejs from 'ejs'
import memFs from 'mem-fs'
import * as editor from 'mem-fs-editor'
import path from 'path'
import util from 'util'

import Storage from './storage.mjs'
import FsReader from './reader.mjs'

export default class Runner {
  constructor (GeneratorClass, props) {
    this._GeneratorClass = GeneratorClass
    this._templatesRoot = props.templatesRoot
    this._destinationRoot = props.destinationRoot
    this._localStoragePath = props.localStoragePath
    this._globalStoragePath = props.globalStoragePath
  }

  async run () {
    await this.init()

    await this.generator.run()

    await this.writeTemplates()
    await this.writePlaceholders()
    await this.saveStorage()
    await this.commitFsChanges()
  }

  async init () {
    this.fs = editor.create(memFs.create())

    const localStorageData = await this.fs.readJSON(path.join(this._destinationRoot, this._localStoragePath), {})
    this.localStorage = new Storage(localStorageData)

    const globalStorage = await this.fs.readJSON(this._globalStoragePath, {})
    this.globalStorage = new Storage(globalStorage)

    this.generator = new this._GeneratorClass({
      localStorage: this.localStorage,
      globalStorage: this.globalStorage,
      fsReader: new FsReader(this.fs, {
        'template': this._templatesRoot,
        'destination': this._destinationRoot
      })
    })
  }

  async writeTemplates () {
    const globalProps = this.generator._getGlobalProps()

    await Promise.all(this.generator._getScaffolds()
      .map(template => {
        const dest = path.join(this._destinationRoot, template.dest)

        if (template.src) {
          const src = path.join(this._templatesRoot, template.src)
          return this.fs.copyTplAsync(src, dest, { ...globalProps, ...template.props })
        } else {
          const content = ejs.render(template.content, { ...globalProps, ...template.props })
          this.fs.write(dest, content)
          return Promise.resolve()
        }
      })
    )
  }

  async writePlaceholders () {
    const globalProps = this.generator._getGlobalProps()

    await Promise.all(this.generator._getPlaceholders()
      .map(template => {
        const srcFullPath = path.join(this._templatesRoot, template.src)
        const destFullPath = path.join(this._destinationRoot, template.dest)

        if (!this.localStorage.getPath(['placeholders', template.src])) {
          this.localStorage.setPath(['placeholders', template.src], true)
          return this.fs.copyTplAsync(srcFullPath, destFullPath, { ...globalProps, ...template.props })
        } else {
          return Promise.resolve()
        }
      })
    )
  }

  async saveStorage () {
    const localStorageFullPath = path.join(this._destinationRoot, this._localStoragePath)
    this.fs.writeJSON(localStorageFullPath, this.localStorage.getAll())

    this.fs.writeJSON(this._globalStoragePath, this.globalStorage.getAll())
  }

  async commitFsChanges () {
    await this.fs.commit()
  }
}
