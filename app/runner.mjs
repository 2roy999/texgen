import PluginsInjector from './injector.mjs'

export default class GeneratorRunner {
  constructor (generator, options) {
    this._generator = generator

    this._injector = new PluginsInjector(options)
  }

  async run (...args) {
    this._injector.registerDependencies(this._generator)

    await this._injector.init()

    await this._invokeGenerator(this._generator, ...args)

    await this._injector.finalize()
  }

  _getRunSubsObject (generator) {
    return Object.fromEntries(
      Object.entries(generator.subs ?? [])
        .map(([name, sub]) => [name, this._invokeGenerator.bind(this, sub)])
    )
  }

  _invokeGenerator (generator, ...args) {
    const injection = this._injector.getInjection(generator)
    injection.run = this._getRunSubsObject(generator)

    return generator.apply(injection, args)
  }
}
