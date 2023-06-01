import PluginsInjector from '../../app/injector.mjs'

const { same, typeOf } = sinon.match

describe('plugins injector', function () {
  function createDummyPlugin (name) {
    const func = createDummyConstructor(name)

    func.$ = {
      dependencies: [],
      init: sinon.spy(),
      instance: sinon.stub(),
      end: sinon.spy()
    }

    return func
  }

  function createDummyPluginTree () {
    const plugins = new Array(5).fill(null).map((_, i) => createDummyPlugin(`plugin${i}`))

    plugins[0].$.dependencies = [plugins[1], plugins[2], plugins[4]]
    plugins[1].$.dependencies = [plugins[3]]
    plugins[2].$.dependencies = [plugins[3], plugins[4]]
    plugins[3].$.dependencies = [plugins[4]]

    return plugins
  }

  beforeEach(function () {
    this.options = {}
    this.injector = new PluginsInjector(this.options)
  })

  it('should create new plugins from constructor', async function () {
    const FooPlugin = createDummyPlugin('FooPlugin')
    const BarPlugin = createDummyPlugin('BarPlugin')

    this.injector.register(FooPlugin)
    this.injector.register(BarPlugin)

    expect(FooPlugin).to.have.been.calledWithNew
    expect(BarPlugin).to.have.been.calledWithNew
  })

  it('should create new plugins from dependencies', async function () {
    const FooPlugin = createDummyPlugin('FooPlugin')
    const BarPlugin = createDummyPlugin('BarPlugin')
    BarPlugin.$.dependencies = [FooPlugin]

    this.injector.register(BarPlugin)

    expect(FooPlugin).to.have.been.calledWithNew
  })

  it('should initialize the dependencies before creating an instance', async function () {
    const plugins = createDummyPluginTree()

    plugins.forEach(p => this.injector.register(p))

    await this.injector.init()

    this.injector.getInjection(Object.assign(() => {}, {
      dependencies: [plugins[0]]
    }))

    for (const plugin of plugins) {
      expect(plugin.$.init).to.have.been.calledBefore(plugin.$.instance)
    }
  })

  it('should wait for the dependencies to be initialized to end before asking an instance', async function () {
    const plugins = createDummyPluginTree()

    for (const plugin of plugins) {
      const spy = sinon.spy()
      plugin.$.init = () => new Promise(resolve => setTimeout(resolve, 10)).then(spy)

      plugin.$spy = spy
    }

    plugins.forEach(p => this.injector.register(p))

    await this.injector.init()

    for (const plugin of plugins) {
      expect(plugin.$spy).to.have.been.calledBefore(plugin.$.instance)
    }
  })

  it('should initialize the dependencies of dependencies', async function () {
    const fooPlugin = createDummyPlugin('foo')
    const barPlugin = createDummyPlugin('bar')
    barPlugin.$.dependencies = [fooPlugin]

    this.injector.register(barPlugin)

    await this.injector.init()

    expect(fooPlugin.$.init).to.have.been.calledBefore(barPlugin.$.init)
  })

  it('should initialize dependencies of dependencies with services object', async function () {
    const fooPlugin = createDummyPlugin('foo')
    fooPlugin.$.instance.returns({ foo: 'bar' })

    const barPlugin = createDummyPlugin('bar')
    barPlugin.$.dependencies = [fooPlugin]

    this.injector.register(barPlugin)

    await this.injector.init()

    expect(barPlugin.$.init).to.have.been.calledWith({ foo: 'bar' })
  })

  it('should initialize dependencies only once', async function () {
    const fooPlugin = createDummyPlugin('foo')

    const barPlugin = createDummyPlugin('bar')
    barPlugin.$.dependencies = [fooPlugin]

    const bazPlugin = createDummyPlugin('baz')
    bazPlugin.$.dependencies = [fooPlugin]

    this.injector.register(barPlugin)
    this.injector.register(bazPlugin)

    await this.injector.init()

    expect(fooPlugin.$.init).to.have.been.calledOnce
  })

  it('should initialize complex dependencies tree in the right order', async function () {
    const plugins = createDummyPluginTree()
    plugins.forEach(p => this.injector.register(p))

    await this.injector.init()

    expect(plugins[4].$.init).to.have.been.calledBefore(plugins[3].$.init)
    expect(plugins[3].$.init).to.have.been.calledBefore(plugins[2].$.init)
    expect(plugins[3].$.init).to.have.been.calledBefore(plugins[1].$.init)
    expect(plugins[2].$.init).to.have.been.calledBefore(plugins[0].$.init)
    expect(plugins[1].$.init).to.have.been.calledBefore(plugins[0].$.init)
  })

  it('should finalize the dependencies of dependencies', async function () {
    const fooPlugin = createDummyPlugin('foo')

    const barPlugin = createDummyPlugin('bar')
    barPlugin.$.dependencies = [fooPlugin]

    this.injector.register(barPlugin)

    await this.injector.init()
    await this.injector.finalize()

    expect(fooPlugin.$.end).to.have.been.calledAfter(barPlugin.$.end)
  })

  it('should finalize the dependencies of dependencies in the right order', async function () {
    const plugins = createDummyPluginTree()
    plugins.forEach(p => this.injector.register(p))

    await this.injector.init()
    await this.injector.finalize()

    expect(plugins[4].$.end).to.have.been.calledAfter(plugins[3].$.end)
    expect(plugins[3].$.end).to.have.been.calledAfter(plugins[2].$.end)
    expect(plugins[3].$.end).to.have.been.calledAfter(plugins[1].$.end)
    expect(plugins[2].$.end).to.have.been.calledAfter(plugins[0].$.end)
    expect(plugins[1].$.end).to.have.been.calledAfter(plugins[0].$.end)
  })

  it('should finalize the dependencies only once', async function () {
    const plugins = createDummyPluginTree()
    plugins.forEach(p => this.injector.register(p))

    await this.injector.init()
    await this.injector.finalize()

    for (const plugin of plugins) {
      expect(plugin.$.end).to.have.been.calledOnce
    }
  })

  it('should throw error when circular dependency is present', async function () {
    const fooPlugin = createDummyPlugin('foo')
    const barPlugin = createDummyPlugin('bar')

    fooPlugin.$.dependencies = [barPlugin]
    barPlugin.$.dependencies = [fooPlugin]

    this.injector.register(fooPlugin)

    await expect(this.injector.init()).to.be.rejectedWith('Circular dependency')
  })

  it('should throw error when registering a non-plugin service', async function () {
    const generator = function () {
      return Object.assign(() => {}, {
        dependencies: []
      })
    }

    expect(() => this.injector.register(generator)).to.throw('not a plugin')
  })

  it('should pass injection request when creating instance', async function () {
    const fooPlugin = createDummyPlugin('foo')
    const barPlugin = createDummyPlugin('bar')

    this.injector.register(fooPlugin)
    this.injector.register(barPlugin)

    await this.injector.init()

    // eslint-disable-next-line mocha/prefer-arrow-callback -- this is needed in this case for the name of the function
    this.injector.getInjection(Object.assign(function DummyGenerator () {}, {
      dependencies: [fooPlugin, barPlugin]
    }))

    expect(fooPlugin.$.instance).to.have.been.calledWith({
      type: 'generator',
      name: 'DummyGenerator',
      id: typeOf('string')
    })
    expect(barPlugin.$.instance).to.have.been.calledWith({
      type: 'generator',
      name: 'DummyGenerator',
      id: typeOf('string')
    })
  })

  it('should pass injection request when creating instance for plugins', async function () {
    const fooPlugin = createDummyPlugin('foo')
    const barPlugin = function bar () {
      Object.assign(this, {
        dependencies: [fooPlugin],
        init: () => {},
        instance: () => ({}),
        end: () => {}
      })
    }

    this.injector.register(barPlugin)
    await this.injector.init()

    expect(fooPlugin.$.instance).to.have.been.calledWith({
      type: 'plugin',
      name: 'bar',
      id: typeOf('string')
    })
  })

  it('should create all plugins with the options passed to the injector', async function () {
    const fooPlugin = createDummyPlugin('foo')
    const barPlugin = createDummyPlugin('bar')

    this.injector.register(fooPlugin)
    this.injector.register(barPlugin)

    expect(fooPlugin).to.have.been.calledWith(same(this.options))
    expect(barPlugin).to.have.been.calledWith(same(this.options))
  })

  it('should do nothing when plugin missing an init method', async function () {
    const fooPlugin = createDummyPlugin('foo')
    delete fooPlugin.$.init

    this.injector.register(fooPlugin)

    await this.injector.init()
  })

  it('should do nothing when plugin missing an end method', async function () {
    const fooPlugin = createDummyPlugin('foo')
    delete fooPlugin.$.end

    this.injector.register(fooPlugin)

    await this.injector.init()
    await this.injector.finalize()
  })

  it('should do return empty object when plugin missing dependencies property', async function () {
    const fooPlugin = createDummyPlugin('foo')
    delete fooPlugin.dependencies

    this.injector.register(fooPlugin)

    await this.injector.init()

    const injection = await this.injector.getInjection(function DummyGenerator () {})

    expect(fooPlugin.$.init).to.have.been.calledWith({})
    expect(injection).to.deep.equal({})
  })

  it('should register dependencies of existing service', async function () {
    const fooPlugin = createDummyPlugin('foo')
    const barPlugin = createDummyPlugin('bar')

    this.injector.registerDependencies({
      dependencies: [fooPlugin, barPlugin]
    })

    expect(fooPlugin).to.have.been.calledWithNew
    expect(barPlugin).to.have.been.calledWithNew
  })

  it('should register dependencies of sub-services', async function () {
    const fooPlugin = createDummyPlugin('foo')
    const barPlugin = createDummyPlugin('bar')

    this.injector.registerDependencies({
      dependencies: [fooPlugin],
      subs: {
        baz: {
          dependencies: [barPlugin]
        }
      }
    })

    expect(fooPlugin).to.have.been.calledWithNew
    expect(barPlugin).to.have.been.calledWithNew
  })

  it('should throw error if asked for injection before initialized', async function () {
    expect(() => this.injector.getInjection({})).to.throw('before initialization')
  })

  it('should throw error if finalized before initialized', async function () {
    await expect(this.injector.finalize()).to.be.rejectedWith('before initialization')
  })

  it('should throw error if initialized twice', async function () {
    await this.injector.init()

    await expect(this.injector.init()).to.be.rejectedWith('already initialized')
  })

  it('should throw error if registering plugins after initialized', async function () {
    await this.injector.init()

    expect(() => this.injector.register(createDummyPlugin('foo'))).to.throw('after initialization')
  })

  it('should throw error if finalized twice', async function () {
    await this.injector.init()
    await this.injector.finalize()

    await expect(this.injector.finalize()).to.be.rejectedWith('already finalized')
  })

  it('should throw error if register plugin after finalized', async function () {
    await this.injector.init()
    await this.injector.finalize()

    expect(() => this.injector.register(createDummyPlugin('foo'))).to.throw()
  })

  it('should throw error if asked for injection after finalized', async function () {
    await this.injector.init()
    await this.injector.finalize()

    expect(() => this.injector.getInjection({})).to.throw('after finalization')
  })
})
