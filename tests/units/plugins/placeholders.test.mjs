function dummmyService () {
  return {
    copyTemplate: sinon.stub(),
    normalizeTemplate: sinon.stub().callsFake(t => ({ src: t })),
    localStorage: {}
  }
}

describe('placeholders plugin', function () {
  beforeEach(async function () {
    await mockImport('../../../app/plugins/templates.mjs', {
      default: 'templates plugin'
    })

    await mockImport('../../../app/plugins/storage.mjs', {
      LocalStoragePlugin: 'local storage plugin'
    })

    const { default: PlaceholdersPlugin } = await import('../../../app/plugins/placeholders.mjs')
    this.plugin = new PlaceholdersPlugin()
  })

  it('should have templates and local storage plugins as dependencies', async function () {
    expect(this.plugin.dependencies).to.be.deep.equal(['templates plugin', 'local storage plugin'])
  })

  it('should copy the placeholder files at the end', async function () {
    const services = dummmyService()
    await this.plugin.init(services)

    this.plugin.instance().addPlaceholder('placeholder1')
    this.plugin.instance().addPlaceholder('placeholder2')

    await this.plugin.end()

    expect(services.copyTemplate).to.have.been.calledTwice
  })

  it('should normalize template when adding a placeholder', async function () {
    const services = dummmyService()
    await this.plugin.init(services)

    this.plugin.instance().addPlaceholder('placeholder')

    expect(services.normalizeTemplate).to.have.been.calledWith('placeholder')
  })

  it('should use the normalized templates at the end', async function () {
    const services = dummmyService()
    await this.plugin.init(services)

    services.normalizeTemplate.returns({ src: 'normalized placeholder' })

    this.plugin.instance().addPlaceholder('placeholder')

    await this.plugin.end()

    expect(services.copyTemplate).to.have.been.calledWith({ src: 'normalized placeholder' })
  })

  it('should throw an error when adding a placeholder with content', async function () {
    const services = dummmyService()
    services.normalizeTemplate.callsFake(t => t)
    await this.plugin.init(services)

    expect(() => this.plugin.instance().addPlaceholder({ src: 'placeholder', content: 'content' }))
      .to.throw('Placeholder templates cannot have content')
  })

  it('should skip placeholders that already marked in localStorage', async function () {
    const services = dummmyService()
    await this.plugin.init(services)

    services.localStorage.placeholder = true

    this.plugin.instance().addPlaceholder('placeholder')

    await this.plugin.end()

    expect(services.copyTemplate).to.not.have.been.called
  })

  it('should mark placeholders in localStorage after the end', async function () {
    const services = dummmyService()
    await this.plugin.init(services)

    this.plugin.instance().addPlaceholder('placeholder')

    expect(services.localStorage.placeholder).to.be.undefined

    await this.plugin.end()

    expect(services.localStorage.placeholder).to.be.true
  })

  it('should add multiple placeholders at once', async function () {
    const services = dummmyService()
    await this.plugin.init(services)

    this.plugin.instance().addPlaceholders(['placeholder1', 'placeholder2'])

    await this.plugin.end()

    expect(services.copyTemplate).to.have.been.calledTwice
  })
})
