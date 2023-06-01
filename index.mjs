#!/usr/bin/env node

import path from 'path'
import url from 'url'
import util from 'util'

import GeneratorRunner from './app/runner.mjs'
import mainGenerator from './app/generators/main.mjs'

const __dirname = url.fileURLToPath(new URL('./app', import.meta.url))

const { values: options, positionals: args } = util.parseArgs({ strict: false })

new GeneratorRunner(mainGenerator, {
  ...options,
  templatesRoot: path.join(__dirname, 'templates'),
  destinationRoot: path.join(process.cwd(), args[0] || '.'),
  localStoragePath: '.texgen.json',
  globalStoragePath: path.resolve(process.env.HOME, '.texgen-global.json')
})
  .run()
  .catch(err => {
    console.error(err.stack || err.message || err)
    process.exit(1)
  })
