
import templatesPlugin from './templates.mjs'

export default class ScaffoldsPlugin {
  dependencies = [
    templatesPlugin
  ]

  async init ({ copyTemplate, normalizeTemplate }) {
    this._scaffolds = []
    this._copyTemplate = copyTemplate
    this._normalizeTemplate = normalizeTemplate
  }

  instance () {
    return {
      addScaffold: template => {
        template = this._normalizeTemplate(template)
        this._scaffolds.push(template)
      }
    }
  }

  async end () {
    await Promise.all(this._scaffolds.map(this._copyTemplate))
  }
}
