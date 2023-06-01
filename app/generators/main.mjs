import modularFileGenerator from './modularFile.mjs'

import PromptPlugin from '../plugins/prompt.mjs'
import PlaceholdersPlugin from '../plugins/placeholders.mjs'
import PropertiesPlugin from '../plugins/properties.mjs'
import ScaffoldsPlugin from '../plugins/scaffolds.mjs'

async function mainGenerator () {
  const initProps = async () => {
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

    Object.entries(newProps).forEach(([key, value]) => {
      this.addGlobalProperty(key, value)
    })
    return newProps
  }

  const generateArticle = async () => {
    this.addScaffold(
      { src: 'root.tex', dest: 'root.tex' }
    )
    this.addGlobalProperty('root_file', 'root.tex')

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

    this.addGlobalProperty('hasAppendix', hasAppendix)
    this.addGlobalProperty('hasBibliography', true)
  }

  const generateNotes = async () => {
    this.addScaffold({ src: 'root.tex', dest: 'main.tex' })
    this.addGlobalProperty('root_file', 'main.tex')

    const { hasBibliography } = await this.prompt([
      {
        type: 'confirm',
        name: 'hasBibliography',
        message: 'Does the notes has bibliography?',
        default: true
      }
    ])

    this.addGlobalProperty('hasBibliography', hasBibliography)
  }

  const props = await initProps()

  if (props.type === 'article') {
    await generateArticle()
  } else if (props.type === 'notes') {
    await generateNotes()
  }

  await this.run.modularFileGenerator({
    dest: 'config.tex',
    modulesDir: 'configs',
    projectHeader: 'Project Config',
    modules: [
      'Modulo Spaces',
      'Theorem definitions'
    ]
  })

  await this.run.modularFileGenerator({
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

  if (this.getGlobalProperty('hasAppendix')) {
    this.addPlaceholder('appendix.tex')
  }

  if (this.getGlobalProperty('hasBibliography')) {
    this.addPlaceholder('main.bib')
  }
}
mainGenerator.dependencies = [
  PlaceholdersPlugin,
  PromptPlugin,
  PropertiesPlugin,
  ScaffoldsPlugin
]
mainGenerator.subs = { modularFileGenerator }
export default mainGenerator
