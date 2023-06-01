describe('fs plugin', function () {
  beforeEach(async function () {
    this.memFsMock = await mockImport('mem-fs')
    this.memFsMock.create = sinon.stub()

    this.memFsEditorMock = await mockImport('mem-fs-editor', {
      create: sinon.stub()
    })

    const { default: FsPlugin } = await import('../../../app/plugins/fs.mjs')
    this.fsPlugin = new FsPlugin()
  })

  it('should have no dependencies', async function () {
    expect(this.fsPlugin.dependencies).to.be.deep.equal([])
  })

  it('init should create mem-fs-editor instance with mem-fs instance', async function () {
    this.memFsMock.create.returns('mem-fs instance')

    await this.fsPlugin.init()

    expect(this.memFsEditorMock.create).to.have.been.calledWith('mem-fs instance')
  })

  it('init should pass the fs to the plugin instance', async function () {
    this.memFsEditorMock.create.returns('mem-fs-editor instance')

    await this.fsPlugin.init()

    expect(this.fsPlugin.instance().fs).to.be.equal('mem-fs-editor instance')
  })

  it('should bring the same instance on multiple calls', async function () {
    this.memFsEditorMock.create.returns({})

    await this.fsPlugin.init()

    const fs1 = this.fsPlugin.instance().fs
    const fs2 = this.fsPlugin.instance().fs

    expect(fs1).to.be.equal(fs2)
  })

  it('should commit the fs on end', async function () {
    const commit = sinon.spy()
    this.memFsEditorMock.create.returns({ commit })

    await this.fsPlugin.init()
    await this.fsPlugin.end()

    expect(commit).to.have.been.called
  })
})
