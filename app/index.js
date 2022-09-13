const Generator = require('yeoman-generator')

module.exports = class extends Generator {
  async run () {
    const { author, email, address } = await this.prompt([
      {
        type: 'list',
        name: 'type',
        choices: ['article'],
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

    const { hasAppendix } = await this.prompt([
      {
        type: 'confirm',
        name: 'hasAppendix',
        message: 'Does the article has appendix?',
        default: false
      }
    ])

    const templates = [
      { src: 'github/workflows/main.yml', dest: '.github/workflows/main.yml' },
      'abstract.tex',
      'main.tex',
      'acknowledgments.tex',
      { src: 'gitignore', dest: '.gitignore' },
      'introduction.tex',
      'main.bib',
      'main.tex',
      'preliminaries.tex',
      'root.tex',
      'shortcuts.tex'
    ]

    if (hasAppendix) {
      templates.push('appendix.tex')
    }

    const props = { author, email, address, hasAppendix }

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
