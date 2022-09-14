#! /usr/bin/env node

const yeoman = require('yeoman-environment')

const env = yeoman.createEnv()

env.register(require.resolve('./app'), 'texgen')

env.run('texgen')
