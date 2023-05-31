import crypto from 'crypto'

function serviceType (service) {
  if (typeof service === 'function') {
    return 'generator'
  } else if (service.instance !== undefined) {
    return 'plugin'
  } else {
    throw new Error(`Unknown service type: ${service}`)
  }
}

function dfs (graph) {
  const order = []
  const marks = new Array(graph.length).fill('unmarked')

  function visit (n) {
    if (marks[n] === 'temp') {
      throw new Error('Circular dependency')
    }

    if (marks[n] === 'unmarked') {
      marks[n] = 'temp'

      graph[n].forEach(visit)

      marks[n] = 'marked'
      order.push(n)
    }
  }

  graph.forEach((_, i) => visit(i))

  return order
}

export default class PluginsInjector {
  constructor (options) {
    this._plugins = {}
    this._options = options
    this._status = 'uninitialized'
  }

  register (Plugin) {
    if (this._status !== 'uninitialized') {
      throw new Error('Cannot register plugins after initialization')
    }

    if (this._plugins[Plugin.name]) {
      return
    }

    const plugin = new Plugin(this._options)

    if (serviceType(plugin) !== 'plugin') {
      throw new Error('Registered service is not a plugin')
    }

    this._plugins[Plugin.name] = plugin
    plugin.dependencies.forEach(d => this.register(d))
  }

  registerDependencies (service) {
    if (service.dependencies) {
      service.dependencies.forEach(d => this.register(d))
    }

    if (service.subs) {
      Object.values(service.subs).forEach(s => this.registerDependencies(s))
    }
  }

  _determineInvocationOrder () {
    const plugins = Object.entries(this._plugins)
    const indexMap = Object.fromEntries(plugins.map(([name], index) => [name, index]))
    const graph = plugins.map(([, plugin]) => {
      return plugin.dependencies.map(d => indexMap[d.name])
    })

    this._invocationOrder = dfs(graph).map(i => plugins[i][1])
  }

  async init () {
    if (this._status !== 'uninitialized') {
      throw new Error('Cannot initialize injector, already initialized')
    }
    this._status = 'initialized'
    this._determineInvocationOrder()

    for (const plugin of this._invocationOrder) {
      if (plugin.init) {
        // eslint-disable-next-line no-await-in-loop -- we need to wait for each plugin to initialize
        await plugin.init(this.getInjection(plugin))
      }
    }
  }

  getInjection (service) {
    if (this._status === 'uninitialized') {
      throw new Error('Cannot get injection before initialization')
    }
    if (this._status === 'finalized') {
      throw new Error('Cannot get injection after finalization')
    }

    return Object.assign({}, ...service.dependencies
      .map(d => this._plugins[d.name].instance(this._getInjectionRequest(service))))
  }

  _getInjectionRequest (service) {
    const type = serviceType(service)
    const name = service.name ?? service.constructor.name

    return {
      id: crypto.createHash('sha256').update(`${type}:${name}`).digest('hex'),
      type,
      name
    }
  }

  async finalize () {
    if (this._status === 'uninitialized') {
      throw new Error('Cannot finalize injector before initialization')
    }
    if (this._status === 'finalized') {
      throw new Error('Cannot finalize injector, already finalized')
    }
    this._status = 'finalized'

    for (const plugin of this._invocationOrder.reverse()) {
      if (plugin.end) {
        // eslint-disable-next-line no-await-in-loop -- we need to wait for each plugin to finalize
        await plugin.end()
      }
    }
  }
}
