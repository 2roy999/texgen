import crypto from 'crypto'

function serviceType (service) {
  if (service.run !== undefined) {
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
  }

  register (Plugin) {
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
    service.dependencies.forEach(d => this.register(d))
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
    this._determineInvocationOrder()

    for (const plugin of this._invocationOrder) {
      if (plugin.init) {
        const injection = this.getInjection(plugin)
        await plugin.init(injection)
      }
    }
  }

  getInjection (service) {
    return Object.assign({}, ...service.dependencies
      .map(d => this._plugins[d.name].instance(this._getInjectionRequest(service))))
  }

  _getInjectionRequest (service) {
    const type = serviceType(service)
    const name = service.constructor.name

    return {
      id: crypto.createHash('sha256').update(`${type}:${name}`).digest('hex'),
      type,
      name
    }
  }

  async finalize () {
    for (const plugin of this._invocationOrder.reverse()) {
      if (plugin.end) {
        await plugin.end()
      }
    }
  }
}
