const Generator = require('yeoman-generator')

module.exports = class extends Generator {
  async run () {
    const props = await this.prompt([
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

    const templates = [
      { src: 'github/workflows/main.yml', dest: '.github/workflows/main.yml' },
      { src: 'gitignore', dest: '.gitignore' },
      'config.tex',
      'shortcuts.tex'
    ]

    if (props.type === 'article') {
      templates.push(
        { src: 'root.tex', dest: 'root.tex' },
        'abstract.tex',
        'acknowledgments.tex',
        'introduction.tex',
        'main.tex',
        'preliminaries.tex',
        'main.bib'
      )

      props.root_file = 'root.tex'

      const { hasAppendix } = await this.prompt([
        {
          type: 'confirm',
          name: 'hasAppendix',
          message: 'Does the article has appendix?',
          default: false
        }
      ])

      props.hasAppendix = hasAppendix
      props.hasBiblography = true

      if (hasAppendix) {
        templates.push('appendix.tex')
      }
    } else if (props.type === 'notes') {
      templates.push({ src: 'root.tex', dest: 'main.tex' })
      props.root_file = 'main.tex'

      const { hasBiblography } = await this.prompt([
        {
          type: 'confirm',
          name: 'hasBiblography',
          message: 'Does the notes has biblography?',
          default: true
        }
      ])

      props.hasBiblography = hasBiblography

      if (hasBiblography) {
        templates.push('main.bib')
      }
    }

    templates.map(template => {
      const { src, dest } = (typeof template === 'string')
        ? { src: template, dest: template }
        : template

      return this.fs.copyTpl(
        this.templatePath(src),
        this.destinationPath(dest),
        props
      )
    })
  }
}
