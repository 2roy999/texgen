
import templatesPlugin from './templates.mjs'

export default class ScaffoldsPlugin {
  dependencies = [
    templatesPlugin
  ]

  async init ({ copyTemplate }) {
    this._scaffolds = []
    this._copyTemplate = copyTemplate
  }

  instance () {
    return {
      addScaffold: template => {
        this._scaffolds.push(template)
      }
    }
  }

  async end () {
    return Promise.all(this._scaffolds.map(this._copyTemplate))
  }
}
