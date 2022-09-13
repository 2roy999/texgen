const Generator = require('yeoman-generator')

module.exports = class extends Generator {
  async type () {
    const answers = await this.prompt([
      {
        type: 'list',
        name: 'type',
        choices: ['article', 'notes', 'beamer']
      }
    ])
    
    
  }
}
