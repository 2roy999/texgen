const crypto = require('crypto')
const Generator = require('yeoman-generator')

const EMPTY_LINE = ''
const DEFAULT_HISTORY_FILE_NAME = '.texgen_history'

function normalize (templates) {
  return templates.map(template =>
    (typeof template === 'string')
      ? { src: template, dest: template }
      : template
  )
}

module.exports = class extends Generator {
  constructor (args, opts) {
    super(args, opts)

    this.argument('directory', { type: String, default: '.', required: false })
    this.option('history-file', { type: String, default: DEFAULT_HISTORY_FILE_NAME })
  }

  async _prompt (questions) {
    const promptedAnswers = await this.prompt(
      questions.map(question => {
        if (this.history.prompt?.[question.name] !== undefined) {
          return false
        } else {
          return question
        }
      })
        .filter(q => Boolean(q))
    )

    const answers = Object.fromEntries(
      questions.map(({ name }) => {
        if (this.history.prompt?.[name] !== undefined) {
          return [name, this.history.prompt?.[name]]
        } else {
          return [name, promptedAnswers[name]]
        }
      })
    )

    this.record.prompt = this.record.prompt || {}
    Object.entries(answers).forEach(([name, answer]) => {
      this.record.prompt[name] = answer
    })

    return answers
  }

  async initRun () {
    this.props = {}
    this.templates = []
    this.dummyFiles = []
    this.record = {}

    this.destinationRoot(this.options.directory)
    this.history = this.readDestinationJSON(this.options['history-file'], {})
  }

  async promptInitProperties () {
    const newProps = await this._prompt([
      {
        type: 'list',
        name: 'type',
        choices: ['article', 'notes'],
        message: 'Choose a type of project:'
      },
      {
        type: 'input',
        name: 'author',
        message: 'Type author\'s full name:',
        store: true
      },
      {
        type: 'input',
        name: 'email',
        message: 'Type author\'s email:',
        store: true
      },
      {
        type: 'input',
        name: 'address',
        message: 'Type author\'s institute address:',
        store: true
      }
    ])
    Object.assign(this.props, newProps)
  }

  async main () {
    const props = this.props

    if (props.type === 'article') {
      await this._configureArticle()
    } else if (props.type === 'notes') {
      await this._configureNotes()
    }
  }

  async _configureArticle () {
    this.templates.push(
      { src: 'root.tex', dest: 'root.tex' }
    )
    this.props.root_file = 'root.tex'

    this.dummyFiles.push(
      'abstract.tex',
      'acknowledgments.tex',
      'introduction.tex',
      'preliminaries.tex',
      'main.tex'
    )

    const { hasAppendix } = await this._prompt([
      {
        type: 'confirm',
        name: 'hasAppendix',
        message: 'Does the article has appendix?',
        default: false
      }
    ])

    this.props.hasAppendix = hasAppendix
    this.props.hasBibliography = true
  }

  async _configureNotes () {
    this.templates.push({ src: 'root.tex', dest: 'main.tex' })
    this.props.root_file = 'main.tex'

    const { hasBibliography } = await this._prompt([
      {
        type: 'confirm',
        name: 'hasBibliography',
        message: 'Does the notes has biblography?',
        default: true
      }
    ])

    this.props.hasBibliography = hasBibliography
  }

  _buildModularFile ({
    dest,
    modulesDir,
    modules,
    projectHeader
  }) {
    const baseSections = Object.fromEntries(
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

        return { name, hash, header, content }
      })
        .map(section => [section.name, section])
    )

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

        return { name, header, hash, content }
      })

    const newSections = []

    if (this.history.configs === undefined) {
      newSections.push({
        header: `%% ${projectHeader}`,
        content: [
          EMPTY_LINE,
          this.readTemplate(`${modulesDir}/_project.tex`, { defaults: '' }).trim(),
          EMPTY_LINE,
          EMPTY_LINE
        ].join('\n')
      })
    }

    newSections.push(...currentSections
      .map(section => {
        const storedHash = this.history.configs?.[section.name]

        if (section.hash === storedHash) {
          return baseSections[section.name] || section
        } else {
          return section
        }
      })
    )

    newSections.push(...Object.values(baseSections)
      .filter(({ name }) => this.history.modular?.[modulesDir]?.[name] === undefined)
    )

    const configFileParts = []

    if (this.history.modular?.[modulesDir] === undefined) {
      configFileParts.push(this.readTemplate(`${modulesDir}/_opening.tex`, { defaults: '' }))
    } else {
      configFileParts.push(currentOpening)
    }

    configFileParts.push(...newSections
      .map(section => {
        return [
          section.header,
          section.content
        ]
      })
    )

    const src = `tmp/${crypto.randomUUID()}.tex`
    const configFileContent = configFileParts.flat().join('\n')

    this.fs.write(this.templatePath(src), configFileContent)
    this.templates.push({ src, dest })

    this.record.modular = this.record.modular || {}
    this.record.modular[modulesDir] = Object.fromEntries(
      Object.values(baseSections)
        .map(({ name, hash }) => [name, hash])
    )
  }

  async configureConfigFile () {
    this._buildModularFile({
      dest: 'config.tex',
      modulesDir: 'configs',
      projectHeader: 'Project Config',
      modules: [
        'Modulo Spaces',
        'Theorem definitions'
      ]
    })
  }

  async configureShortcutsFile () {
    this._buildModularFile({
      dest: 'shortcuts.tex',
      modulesDir: 'shortcuts',
      projectHeader: 'Project Shortcuts',
      modules: [
        'Whiteboard Letters',
        'Delimiters',
        'Operators',
        'Others',
        'Calligraphic Letters'
      ]
    })
  }

  configureAppendix () {
    if (this.props.hasAppendix) {
      this.dummyFiles.push('appendix.tex')
    }
  }

  configureBibliography () {
    if (this.props.hasBibliography) {
      this.dummyFiles.push('main.bib')
    }
  }

  copyTemplates () {
    normalize(this.templates).map(template => {
      return this.renderTemplate(
        template.src,
        template.dest,
        { ...this.props, ...template.props }
      )
    })
  }

  copyDummyFiles () {
    this.record.dummy = {}

    normalize(this.dummyFiles).forEach(({ src, dest }) => {
      this.record.dummy[src] = true

      if (!this.history.dummy?.[src]) {
        this.renderTemplate(src, dest, this.props)
      }
    })
  }

  createHistoryRecord () {
    this.writeDestinationJSON(this.options['history-file'], this.record, null, '')
  }

  deleteTmp () {
    this.fs.delete(this.templatePath('tmp'))
  }

  check () {
    this.fs.commit()
  }
}
