
import crypto from 'crypto'

import Generator from './generator.mjs'

const EMPTY_LINE = ''

export default class ModularFileGenerator extends Generator {
  constructor (storage, {
    dest,
    modulesDir,
    modules,
    projectHeader
  }) {
    super(storage)

    this._dest = dest
    this._modulesDir = modulesDir
    this._modules = modules
    this._projectHeader = projectHeader
  }

  async run () {
    const baseSections = this.extractBaseSections()
    const { currentOpening, currentSections } = this.extractCurrent()

    const newSections = [
      this.createNewProjectSectionIfNeeded(),
      this.updateCurrentSections(currentSections, baseSections),
      this.createNewModulesSections(baseSections)
    ]

    const fileParts = [
      this.createOpening(currentOpening),
      this.createSectionParts(newSections)
    ]

    const fileContent = fileParts.join('\n')

    this.addScaffolds({ content: fileContent, dest: this._dest })

    this.updateStorage(baseSections)
  }

  updateStorage (baseSections) {
    const updatedObject = Object.fromEntries(
      Object.values(baseSections)
        .map(({
          name,
          hash
        }) => [name, hash])
    )

    this.getStorage().set('sections', updatedObject)
  }

  createSectionParts (newSections) {
    return newSections
      .flat()
      .flatMap(section => {
        return [
          section.header,
          section.content
        ]
      })
  }

  createOpening (currentOpening) {
    if (this.getStorage().get('exists') === undefined) {
      return this.readTemplateFile(`${this._modulesDir}/_opening.tex`, { defaults: '' })
    } else {
      return currentOpening
    }
  }

  createNewModulesSections (baseSections) {
    return Object.values(baseSections)
      .filter(({ name }) => this.getStorage().getPath(['sections', name]) === undefined)
  }

  updateCurrentSections (currentSections, baseSections) {
    return currentSections
      .map(section => {
        const storedHash = this.getStorage().getPath(['sections', section.name])

        if (section.hash === storedHash) {
          return baseSections[section.name] || section
        } else {
          return section
        }
      })
  }

  createNewProjectSectionIfNeeded (newSections) {
    if (this.getStorage().get('exists') === undefined) {
      return {
        header: `%% ${this._projectHeader}`,
        content: [
          EMPTY_LINE,
          this.readTemplateFile(`${this._modulesDir}/_project.tex`, { defaults: '' }).trim(),
          EMPTY_LINE,
          EMPTY_LINE
        ].join('\n')
      }
    } else {
      return []
    }
  }

  extractCurrent () {
    const [currentOpening, ...currentRawSections] = this.readDestinationFile(this._dest, { defaults: '' })
      .split(/\r?\n(?=%%)/)

    const currentSections = currentRawSections
      .map(raw => {
        const endOfFirstLine = raw.indexOf('\n')
        const header = (endOfFirstLine === -1) ? raw : raw.substring(0, endOfFirstLine)
        const content = (endOfFirstLine === -1) ? '' : raw.substring(endOfFirstLine + 1)

        const name = header.substring(2)
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '_')

        const hash = crypto.createHash('sha256').update(content, 'utf8').digest('hex')

        return {
          name,
          header,
          hash,
          content
        }
      })
    return {
      currentOpening,
      currentSections
    }
  }

  extractBaseSections () {
    return Object.fromEntries(
      this._modules.map(prettyName => {
        const name = prettyName.toLowerCase().replace(/\s+/g, '_')
        const header = `%% ${prettyName}`
        const content = [
          EMPTY_LINE,
          this.readTemplateFile(`${this._modulesDir}/${name}.tex`).trim(),
          EMPTY_LINE,
          EMPTY_LINE
        ].join('\n')

        const hash = crypto.createHash('sha256').update(content, 'utf8').digest('hex')

        return {
          name,
          hash,
          header,
          content
        }
      })
        .map(section => [section.name, section])
    )
  }
}
