
import os from 'os'
import path from 'path'
import { runner } from 'clet'

describe('Creating new projects', () => {

  beforeEach(async function () {
    const title = this.currentTest.fullTitle().trim().toLowerCase().replace(/\s+/g, '-')
    this.tmpDir = path.resolve('./tmp', title)
    this.texgen = path.resolve('.', 'index.js')
  })

  it('should create a new article project', async function () {
    await runner()
      .cwd(this.tmpDir, { init: true })
      .spawn(this.texgen)
      .stdin(/❯ article/, '\n')
      .stdin(/name:/, 'John Doe\n')
      .stdin(/email:/, 'johndoe@mail.com\n')
      .stdin(/address:/, 'Institute of Science\n')
      .stdin(/appendix/, 'n\n')
      .code(0)
      .file('.texgen.json', {})
      .file('abstract.tex', /^% !TEX root = .\/root.tex\r?\n/)
      .file('acknowledgements.tex', /^% !TEX root = .\/root.tex\r?\n/)
      .file('config.tex', /^% !TEX root = .\/root.tex\r?\n/)
      .file('introduction.tex', /^% !TEX root = .\/root.tex\r?\n/)
      .file('main.tex', /^% !TEX root = .\/root.tex\r?\n/)
      .file('main.bib', /@article/)
      .file('preliminaries.tex', /^% !TEX root = .\/root.tex\r?\n/)
      .file('root.tex', /^\\documentclass/)
      .file('shortcuts.tex', /^% !TEX root = .\/root.tex\r?\n/)
  })

})
