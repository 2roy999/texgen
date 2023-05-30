import path from 'path'
import { runner, KEYS } from 'clet'

describe('Creating new projects', function () {
  beforeEach(async function () {
    const title = this.currentTest.fullTitle().trim().toLowerCase().replace(/\s+/g, '-')
    this.tmpDir = path.resolve('./tmp', title)
    this.texgen = path.resolve('.', 'index.mjs')
  })

  it('should create a new article project', async function () {
    await runner()
      .cwd(this.tmpDir, { init: true, clean: true })
      .spawn(this.texgen)
      .stdin(/type/, KEYS.ENTER)
      .stdin(/name:/, 'John Doe')
      .stdin(/email:/, 'johndoe@mail.com')
      .stdin(/address:/, 'Institute of Science')
      .stdin(/appendix/, 'n')
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
      .end()
  })

  it('should create a new article project with appendix', async function () {
    await runner()
      .cwd(this.tmpDir, { init: true, clean: true })
      .spawn(this.texgen)
      .stdin(/type/, KEYS.ENTER)
      .stdin(/name:/, 'John Doe')
      .stdin(/email:/, 'johndoe@mail.com')
      .stdin(/address:/, 'Institute of Science')
      .stdin(/appendix/, 'y')
      .code(0)
      .file('.texgen.json', {})
      .file('abstract.tex', /^% !TEX root = .\/root.tex\r?\n/)
      .file('acknowledgements.tex', /^% !TEX root = .\/root.tex\r?\n/)
      .file('appendix.tex', /^% !TEX root = .\/root.tex\r?\n/)
      .file('config.tex', /^% !TEX root = .\/root.tex\r?\n/)
      .file('introduction.tex', /^% !TEX root = .\/root.tex\r?\n/)
      .file('main.tex', /^% !TEX root = .\/root.tex\r?\n/)
      .file('main.bib', /@article/)
      .file('preliminaries.tex', /^% !TEX root = .\/root.tex\r?\n/)
      .file('root.tex', /^\\documentclass/)
      .file('shortcuts.tex', /^% !TEX root = .\/root.tex\r?\n/)
      .end()
  })
})
