const Generator = require('yeoman-generator')

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

  async init_run () {
    this.props = {}
    this.templates = []
    this.dummy_files = []
    this.record = {}

    this.destinationRoot(this.options.directory)
    this.history = this.readDestinationJSON(this.options['history-file'], {})
  }

  async prompt_init_properties () {
    const newProps = await this.prompt([
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
      await this._configure_article()
    } else if (props.type === 'notes') {
      await this._configure_notes()
    }
  }

  async _configure_article () {
    this.templates.push(
      { src: 'root.tex', dest: 'root.tex' }
    )
    this.props.root_file = 'root.tex'

    this.dummy_files.push(
      'abstract.tex',
      'acknowledgments.tex',
      'introduction.tex',
      'preliminaries.tex',
      'main.tex'
    )

    const { hasAppendix } = await this.prompt([
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

  async _configure_notes () {
    this.templates.push({ src: 'root.tex', dest: 'main.tex' })
    this.props.root_file = 'main.tex'

    const { hasBibliography } = await this.prompt([
      {
        type: 'confirm',
        name: 'hasBibliography',
        message: 'Does the notes has biblography?',
        default: true
      }
    ])

    this.props.hasBibliography = hasBibliography
  }

  configure_appendix () {
    if (this.props.hasAppendix) {
      this.dummy_files.push('appendix.tex')
    }
  }

  configure_bibliography () {
    if (this.props.hasBibliography) {
      this.dummy_files.push('main.bib')
    }
  }

  copy_templates () {
    this.templates.map(template => {
      const { src, dest } = (typeof template === 'string')
        ? { src: template, dest: template }
        : template

      return this.fs.copyTpl(
        this.templatePath(src),
        this.destinationPath(dest),
        this.props
      )
    })
  }

  copy_dummy_files () {
    this.record.dummy = {}

    normalize(this.dummy_files).forEach(({ src, dest }) => {
      this.record.dummy[src] = true

      if (!this.history.dummy?.[src]) {
        this.fs.copyTpl(
          this.templatePath(src),
          this.destinationPath(dest),
          this.props
        )
      }
    })
  }

  create_history_record () {
    this.writeDestinationJSON(this.options['history-file'], this.record, null, '')
  }
}
