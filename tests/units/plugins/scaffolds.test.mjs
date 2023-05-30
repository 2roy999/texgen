
function dummmyService () {
  return {
    copyTemplate: sinon.stub()
  }
}

describe('scaffolds plugin', function () {
  beforeEach(async function () {
    await mockImport('../../../app/plugins/templates.mjs', {
      default: 'templates plugin'
    })

    const { default: ScaffoldsPlugin } = await import('../../../app/plugins/scaffolds.mjs')
    this.plugin = new ScaffoldsPlugin()
  })

  it('should have templates plugin as dependency', async function () {
    expect(this.plugin.dependencies).to.be.deep.equal(['templates plugin'])
  })

  it('should copy the scaffold files at the end', async function () {
    const services = dummmyService()
    await this.plugin.init(services)

    this.plugin.instance().addScaffold('scaffold1')
    this.plugin.instance().addScaffold('scaffold2')

    await this.plugin.end()

    expect(services.copyTemplate).to.have.been.calledWith('scaffold1')
    expect(services.copyTemplate).to.have.been.calledWith('scaffold2')
  })
})
