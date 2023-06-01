import crypto from 'crypto'

import ScaffoldsPlugin from '../plugins/scaffolds.mjs'
import { LocalStoragePlugin } from '../plugins/storage.mjs'
import { DestinationReaderPlugin, TemplatesReaderPlugin } from '../plugins/fs-helpers.mjs'

const EMPTY_LINE = ''

async function modularFileGenerator ({
  dest,
  modulesDir,
  modules,
  projectHeader
}) {
  const argsId = crypto.createHash('sha256')
    .update(`${dest}:${modulesDir}:${modules.join('')}:${projectHeader}`, 'utf8').digest('hex')
  const localStorage = this.localStorage[argsId] ??= {}

  const main = () => {
    const baseSections = extractBaseSections()
    const {
      currentOpening,
      currentSections
    } = extractCurrent()

    const newSections = [
      createNewProjectSectionIfNeeded(),
      updateCurrentSections(currentSections, baseSections),
      createNewModulesSections(baseSections)
    ]

    const fileParts = [
      createOpening(currentOpening),
      createSectionParts(newSections)
    ]

    const fileContent = fileParts.flat().join('\n')

    this.addScaffold({
      content: fileContent,
      dest
    })

    updateStorage(baseSections)
  }

  const extractBaseSections = () => {
    return Object.fromEntries(
      modules.map(prettyName => {
        const name = prettyName.toLowerCase().replace(/\s+/g, '_')
        const header = `%% ${prettyName}`
        const content = [
          EMPTY_LINE,
          this.readTemplate(`${modulesDir}/${name}.tex`).trim(),
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

  const extractCurrent = () => {
    const [currentOpening, ...currentRawSections] = this.readDestination(dest, { defaults: '' })
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

  const createNewProjectSectionIfNeeded = () => {
    if (localStorage.exists === undefined) {
      return {
        header: `%% ${projectHeader}`,
        content: [
          EMPTY_LINE,
          this.readTemplate(`${modulesDir}/_project.tex`, { defaults: '' }).trim(),
          EMPTY_LINE,
          EMPTY_LINE
        ].join('\n')
      }
    } else {
      return []
    }
  }

  const updateCurrentSections = (currentSections, baseSections) => {
    return currentSections
      .map(section => {
        const storedHash = localStorage.sections[section.name]

        if (section.hash === storedHash) {
          return baseSections[section.name] || section
        } else {
          return section
        }
      })
  }

  const createNewModulesSections = baseSections => {
    return Object.values(baseSections)
      .filter(({ name }) => localStorage.sections?.[name] === undefined)
  }

  const createOpening = currentOpening => {
    if (localStorage.exists === undefined) {
      return this.readTemplate(`${modulesDir}/_opening.tex`, { defaults: '' })
    } else {
      return currentOpening
    }
  }

  const createSectionParts = newSections => {
    return newSections
      .flat()
      .flatMap(section => {
        return [
          section.header,
          section.content
        ]
      })
  }

  const updateStorage = baseSections => {
    localStorage.sections = Object.fromEntries(
      Object.values(baseSections)
        .map(({
          name,
          hash
        }) => [name, hash])
    )
    localStorage.exists = true
  }

  return main()
}
modularFileGenerator.dependencies = [
  DestinationReaderPlugin,
  LocalStoragePlugin,
  TemplatesReaderPlugin,
  ScaffoldsPlugin
]

export default modularFileGenerator
