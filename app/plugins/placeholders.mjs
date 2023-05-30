import TemplatesPlugin from './templates.mjs'
import LocalStoragePlugin from './local-storage.mjs'

export default class PlaceholdersPlugin {
  dependencies = [TemplatesPlugin, LocalStoragePlugin]

  async init ({
    copyTemplate,
    normalizeTemplate,
    localStorage
  }) {
    this._placeholders = []
    this._copyTemplate = copyTemplate
    this._normalizeTemplate = normalizeTemplate
    this._localStorage = localStorage
  }

  instance () {
    return {
      addPlaceholder: template => {
        template = this._normalizeTemplate(template)

        if (template.content) {
          throw new Error('Placeholder templates cannot have content')
        }

        this._placeholders.push(template)
      }
    }
  }

  async end () {
    const newPlaceholders = this._placeholders.filter(template => !this._localStorage[template.src])

    await Promise.all(newPlaceholders.map(this._copyTemplate))

    for (const placeholder of newPlaceholders) {
      this._localStorage[placeholder.src] = true
    }
  }
}
