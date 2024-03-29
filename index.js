#! /usr/bin/env node

const util = require('util')
const yeoman = require('yeoman-environment')

const { values: options, positionals: args } = util.parseArgs({ strict: false })

const env = yeoman.createEnv()
env.register(require.resolve('./app'), 'texgen')

env.run(['texgen'].concat(args), options)
