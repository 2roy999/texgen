import ejs from 'ejs'

import { DestinationWriterPlugin, TemplatesReaderPlugin } from './fs-helpers.mjs'

export default class TemplatesPlugin {
  dependencies = [DestinationWriterPlugin, TemplatesReaderPlugin]

  async init ({ readTemplate, writeDestination, getAllGlobalProperties }) {
    this._readTemplate = readTemplate
    this._writeDestination = writeDestination
    this._getGlobalProps = getAllGlobalProperties
  }

  instance () {
    return {
      copyTemplate: async template => {
        template = this._normalizeTemplate(template)

        const templateContent = template.content ?? await this._readTemplate(template.src)
        const renderedContent = ejs.render(templateContent, { ...this._getGlobalProps(), ...template.props })
        await this._writeDestination(template.dest, renderedContent)
      }
    }
  }

  _normalizeTemplate (template) {
    if (typeof template === 'string') {
      return { src: template, dest: template }
    }

    if (template.content && template.src) {
      throw new Error('Template cannot have both content and src')
    }

    if (!template.src) {
      return { ...template, src: template.dest }
    }

    return template
  }
}
