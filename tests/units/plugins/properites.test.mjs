import PropertiesPlugin from '../../../app/plugins/properties.mjs'

describe('properties plugin', function () {
  beforeEach(async function () {
    this.plugin = new PropertiesPlugin()
  })

  it('should have no dependencies', async function () {
    expect(this.plugin.dependencies).to.be.deep.equal([])
  })

  it('should add the global property to instance', async function () {
    const instance = this.plugin.instance()

    instance.addGlobalProperty('foo', 'bar')
    instance.addGlobalProperty('bar', 'baz')

    expect(instance.getAllGlobalProperties()).to.be.deep.equal({
      foo: 'bar',
      bar: 'baz'
    })
  })

  it('should return specific global property from instance', async function () {
    const instance = this.plugin.instance()

    instance.addGlobalProperty('foo', 'bar')
    instance.addGlobalProperty('bar', 'baz')

    expect(instance.getGlobalProperty('foo')).to.be.equal('bar')
  })

  it('should throw error when adding a global property that already exists', async function () {
    const instance = this.plugin.instance()

    instance.addGlobalProperty('foo', 'bar')

    expect(() => instance.addGlobalProperty('foo', 'baz')).to.throw('Global property foo already exists')
  })

  it('should save all values as strings', async function () {
    const instance = this.plugin.instance()

    instance.addGlobalProperty('foo', 1)
    instance.addGlobalProperty('bar', true)
    instance.addGlobalProperty('baz', { foo: 'bar' })
    instance.addGlobalProperty('qux', [1, 2, 3])

    expect(instance.getAllGlobalProperties()).to.be.deep.equal({
      foo: '1',
      bar: 'true',
      baz: '[object Object]',
      qux: '1,2,3'
    })
  })

  it('should update the global properties on all instances', async function () {
    const instance1 = this.plugin.instance()
    const instance2 = this.plugin.instance()

    instance1.addGlobalProperty('foo', 'bar')
    instance2.addGlobalProperty('bar', 'baz')

    expect(instance1.getAllGlobalProperties()).to.be.deep.equal({
      foo: 'bar',
      bar: 'baz'
    })
    expect(instance2.getAllGlobalProperties()).to.be.deep.equal({
      foo: 'bar',
      bar: 'baz'
    })
  })

  it('should not update the global properties when getter object changed', async function () {
    const instance = this.plugin.instance()

    instance.addGlobalProperty('foo', 'bar')

    const properties = instance.getAllGlobalProperties()
    properties.foo = 'baz'

    expect(instance.getAllGlobalProperties()).to.be.deep.equal({
      foo: 'bar'
    })
  })
})
