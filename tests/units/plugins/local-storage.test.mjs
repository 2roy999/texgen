describe('local-storage plugin', function () {

  beforeEach(async function () {
    await mockImport('../../../app/plugins/fs-helpers.mjs', {
      DestinationReaderPlugin: 'destination reader plugin',
      DestinationWriterPlugin: 'destination writer plugin'
    })

    const { default: LocalStoragePlugin } = await import('../../../app/plugins/local-storage.mjs')
    this.localStoragePlugin = new LocalStoragePlugin({ localStoragePath: 'localStoragePath' })
  })

  it('should have destination reader and writer plugins as dependencies', async function () {
    expect(this.localStoragePlugin.dependencies).to.be.deep.equal([
      'destination reader plugin',
      'destination writer plugin'
    ])
  })

  it('should read the right file at the beginning', async function () {
    const services = {
      readDestinationJson: sinon.stub().returns({})
    }

    await this.localStoragePlugin.init(services)

    expect(services.readDestinationJson).to.have.been.calledWith('localStoragePath', {})
  })

  it('should read the local storage object from file at the beginning', async function () {
    const services = {
      readDestinationJson: sinon.stub().returns({
        'type-name-id': {
          foo: 'bar'
        }
      })
    }
    await this.localStoragePlugin.init(services)

    expect(this.localStoragePlugin.instance({
      type: 'type',
      name: 'name',
      id: 'id'
    }).localStorage).to.be.deep.equal({ foo: 'bar' })

    expect(this.localStoragePlugin.instance({
      type: 'type2',
      name: 'name2',
      id: 'id2'
    }).localStorage).to.be.deep.equal({})
  })

  it('should write the local storage object into file at the end', async function () {
    const services = {
      readDestinationJson: sinon.stub().returns({}),
      writeDestinationJson: sinon.spy()
    }
    await this.localStoragePlugin.init(services)

    this.localStoragePlugin.instance({
      type: 'type1',
      name: 'name1',
      id: 'id1'
    }).localStorage.foo = 'bar'

    this.localStoragePlugin.instance({
      type: 'type2',
      name: 'name2',
      id: 'id2'
    }).localStorage.foo2 = 'bar2'

    await this.localStoragePlugin.end()

    expect(services.writeDestinationJson).to.have.been.calledWith('localStoragePath', {
      'type1-name1-id1': {
        foo: 'bar'
      },
      'type2-name2-id2': {
        foo2: 'bar2'
      }
    })
  })

  it('should return different instances for different requests', async function () {
    const services = {
      readDestinationJson: sinon.stub().returns({})
    }
    await this.localStoragePlugin.init(services)

    const instance1 = this.localStoragePlugin.instance({
      type: 'type1',
      name: 'name1',
      id: 'id1'
    })

    const instance2 = this.localStoragePlugin.instance({
      type: 'type2',
      name: 'name2',
      id: 'id2'
    })

    expect(instance1.localStorage).to.not.be.equal(instance2.localStorage)
  })
})
