import crypto from 'crypto'
import inquirer from 'inquirer'

export default class Generator {
  constructor (services) {
    this._globalProps = {}
    this._scaffolds = []
    this._placeholders = []
    this._services = services
  }

  getGlobalProp (key) {
    return this._globalProps[key]
  }

  _getGlobalProps () {
    return this._globalProps
  }

  addGlobalProp (key, value) {
    const mergedObject = (() => {
      if (typeof key === 'string') {
        return { [key]: value }
      } else if (value !== undefined) {
        throw new Error('Value is not allowed when key is not a string')
      } else {
        return key
      }
    })()

    Object.assign(this._globalProps, mergedObject)
  }

  normalizeTemplate (template, noContent = false) {
    if (typeof template === 'string') {
      return { src: template, dest: template }
    }

    if (typeof template !== 'object') {
      throw new Error('Template must be a string or an object')
    }


    if (noContent && template.content !== undefined) {
      throw new Error('Template content is not allowed')
    }

    if (template.src && template.content) {
      throw new Error('Template content and src are not allowed together')
    }

    if (!template.dest) {
      throw new Error('Template dest is required')
    }

    if (!(template.src || template.content)) {
      return { src: template.dest, ...template }
    } else {
      return template
    }
  }

  _getScaffolds () {
    return this._scaffolds
  }

  addScaffolds (templates) {
    if (!Array.isArray(templates)) {
      templates = [templates]
    }

    templates = templates.map(this.normalizeTemplate)

    this._scaffolds.push(...templates)
  }

  _getPlaceholders () {
    return this._placeholders
  }

  addPlaceholders (templates) {
    if (!Array.isArray(templates)) {
      templates = [templates]
    }

    templates = templates.map(t => this.normalizeTemplate(t, false))

    this._placeholders.push(...templates)
  }

  async prompt (questions) {
    const transformedQuestions = questions.map(question => {
      if (this._services.localStorage.getPath(['prompt', question.name]) !== undefined) {
        answers[question.name] = this._services.localStorage.getPath(['prompt', question.name])
        return null
      }

      if (question.store === true) {
        return {
          ...question,
          default: this._services.globalStorage.getPath(['prompt', question.name])
        }
      }

      return question
    })
      .filter(q => q !== null)

    const answers = await inquirer.prompt(transformedQuestions)

    for (const question of questions) {
      if (question.store === true) {
        this._services.globalStorage.setPath(['prompt', question.name], answers[question.name])
      }

      this._services.localStorage.setPath(['prompt', question.name], answers[question.name])
    }

    return answers
  }

  getStorage () {
    return this._services.localStorage.sub(['protected'])
  }

  readDestinationFile (path, opts) {
    return this._services.fsReader.read('destination', path, opts)
  }

  readTemplateFile (path, opts) {
    return this._services.fsReader.read('template', path, opts)
  }

  runSubGenerator (GeneratorClass, args) {
    const hash = crypto.createHash('sha256')
      .update(GeneratorClass.name)
      .update(JSON.stringify(args))
      .digest('hex')

    const storageId = `sub-${GeneratorClass.name}-${hash}`
    const subGenerator = new GeneratorClass({
      ...this._services,
      localStorage: this._services.localStorage.sub([storageId]),
      globalStorage: this._services.globalStorage.sub([storageId])
    }, args)
    subGenerator.run()

    this.addScaffolds(subGenerator._getScaffolds())
    this.addPlaceholders(subGenerator._getPlaceholders())
    this.addGlobalProp(subGenerator._getGlobalProps())
  }
}
