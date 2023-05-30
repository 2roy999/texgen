
import Generator from './generator.mjs'
import ModularFileGenerator from './modularFile.mjs'

export default class BaseGenerator extends Generator {
  async run () {
    const props = await this.promptInitProperties()

    if (props.type === 'article') {
      await this.configureArticle()
    } else if (props.type === 'notes') {
      await this.configureNotes()
    }

    this.runSubGenerator(ModularFileGenerator, {
      dest: 'config.tex',
      modulesDir: 'configs',
      projectHeader: 'Project Config',
      modules: [
        'Modulo Spaces',
        'Theorem definitions'
      ]
    })

    this.runSubGenerator(ModularFileGenerator, {
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

    if (this.getGlobalProp('hasAppendix')) {
      this.addPlaceholders('appendix.tex')
    }

    if (this.getGlobalProp('hasBibliography')) {
      this.addPlaceholders('main.bib')
    }
  }

  async promptInitProperties () {
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

    this.addGlobalProp(newProps)
    return newProps
  }

  async configureArticle () {
    this.addScaffolds(
      { src: 'root.tex', dest: 'root.tex' }
    )
    this.addGlobalProp('root_file', 'root.tex')

    this.addPlaceholders([
      'abstract.tex',
      'acknowledgements.tex',
      'introduction.tex',
      'preliminaries.tex',
      'main.tex'
    ])

    const { hasAppendix } = await this.prompt([
      {
        type: 'confirm',
        name: 'hasAppendix',
        message: 'Does the article has appendix?',
        default: false
      }
    ])

    this.addGlobalProp('hasAppendix', hasAppendix)
    this.addGlobalProp('hasBibliography', true)
  }

  async configureNotes () {
    this.addScaffolds({ src: 'root.tex', dest: 'main.tex' })
    this.addGlobalProp('root_file', 'main.tex')

    const { hasBibliography } = await this._prompt([
      {
        type: 'confirm',
        name: 'hasBibliography',
        message: 'Does the notes has biblography?',
        default: true
      }
    ])

    this.addGlobalProp('hasBibliography', hasBibliography)
  }
}
