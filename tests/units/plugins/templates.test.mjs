
const { any } = sinon.match

function dummyServices () {
  return {
    writeDestination: sinon.spy(),
    readTemplate: sinon.stub(),
    getAllGlobalProperties: sinon.stub()
  }
}

describe('templates plugin', function () {
  beforeEach(async function () {
    await mockImport('../../../app/plugins/fs-helpers.mjs', {
      DestinationWriterPlugin: 'destination writer plugin',
      TemplatesReaderPlugin: 'templates reader plugin'
    })

    await mockImport('../../../app/plugins/properties.mjs', {
      PropertiesPlugin: 'properties plugin'
    })

    this.ejsMock = await mockImport('ejs')
    this.ejsMock.render = sinon.stub()

    const { default: TemplatesPlugin } = await import('../../../app/plugins/templates.mjs')
    this.plugin = new TemplatesPlugin({ templatesPath: 'templatesPath' })
  })

  it('should have destination writer and template reader plugins as dependencies', async function () {
    expect(this.plugin.dependencies).to.be.deep.equal([
      'destination writer plugin',
      'templates reader plugin'
    ])
  })

  it('should copy the template files into the destination', async function () {
    const services = dummyServices()
    await this.plugin.init(services)

    await this.plugin.instance().copyTemplate('file')

    expect(services.readTemplate).to.have.been.calledWith('file')
    expect(services.writeDestination).to.have.been.calledWith('file')
  })

  it('should write the rendered content in the destination', async function () {
    this.ejsMock.render.returns('rendered content')
    const services = dummyServices()
    await this.plugin.init(services)

    await this.plugin.instance().copyTemplate('file')

    expect(services.writeDestination).to.have.been.calledWith('file', 'rendered content')
  })

  it('should render the template with the properties', async function () {
    const services = dummyServices()
    services.readTemplate.returns('template content')
    services.getAllGlobalProperties.returns({ foo: 'bar' })
    await this.plugin.init(services)

    await this.plugin.instance().copyTemplate('file')

    expect(this.ejsMock.render).to.have.been.calledWith('template content', { foo: 'bar' })
  })

  it('should allow a source and destination file to be specified', async function () {
    const services = dummyServices()
    await this.plugin.init(services)

    await this.plugin.instance().copyTemplate({ src: 'src', dest: 'dest' })

    expect(services.readTemplate).to.have.been.calledWith('src')
    expect(services.writeDestination).to.have.been.calledWith('dest', any)
  })

  it('should allow to specify additional properties', async function () {
    const services = dummyServices()
    services.getAllGlobalProperties.returns({ foo: 'bar' })
    await this.plugin.init(services)

    await this.plugin.instance().copyTemplate({ src: 'src', dest: 'dest', props: { baz: 'qux' } })

    expect(this.ejsMock.render).to.have.been.calledWith(any, { foo: 'bar', baz: 'qux' })
  })

  it('should prefer the specified properties over the global ones', async function () {
    const services = dummyServices()
    services.getAllGlobalProperties.returns({ foo: 'bar' })
    await this.plugin.init(services)

    await this.plugin.instance().copyTemplate({ src: 'src', dest: 'dest', props: { foo: 'baz' } })

    expect(this.ejsMock.render).to.have.been.calledWith(any, { foo: 'baz' })
  })

  it('should use the dest file as src when the src is missing', async function () {
    const services = dummyServices()
    await this.plugin.init(services)

    await this.plugin.instance().copyTemplate({ dest: 'dest' })

    expect(services.readTemplate).to.have.been.calledWith('dest')
  })

  it('should allow to specify template content instead of src file', async function () {
    const services = dummyServices()
    await this.plugin.init(services)

    await this.plugin.instance().copyTemplate({ content: 'content', dest: 'dest' })

    expect(services.readTemplate).to.not.have.been.called
    expect(this.ejsMock.render).to.have.been.calledWith('content', any)
  })

  it('should throw error when template content and src file are present simultaneously', async function () {
    const services = dummyServices()
    await this.plugin.init(services)

    await expect(this.plugin.instance().copyTemplate({ content: 'content', src: 'src', dest: 'dest' }))
      .to.be.rejectedWith('Template cannot have both content and src')
  })
})
