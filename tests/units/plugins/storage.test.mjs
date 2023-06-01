function dummyRequest (s) {
  s = s ?? ''
  return {
    type: `type${s}`,
    name: `name${s}`,
    id: `id${s}`
  }
}

describe('storage plugins', function () {
  describe('local-storage plugin', function () {
    function dummyServices () {
      return {
        readDestinationJson: sinon.stub().returns({}),
        writeDestinationJson: sinon.spy()
      }
    }

    beforeEach(async function () {
      await mockImport('../../../app/plugins/fs-helpers.mjs', {
        DestinationReaderPlugin: 'destination reader plugin',
        DestinationWriterPlugin: 'destination writer plugin'
      })

      const { LocalStoragePlugin } = await import('../../../app/plugins/storage.mjs')
      this.plugin = new LocalStoragePlugin({ localStoragePath: 'localStoragePath' })
    })

    it('should have destination reader and writer plugins as dependencies', async function () {
      expect(this.plugin.dependencies).to.be.deep.equal([
        'destination reader plugin',
        'destination writer plugin'
      ])
    })

    it('should read the right file at the beginning', async function () {
      const services = dummyServices()

      await this.plugin.init(services)

      expect(services.readDestinationJson).to.have.been.calledWith('localStoragePath', {})
    })

    it('should read the local storage object from file at the beginning', async function () {
      const services = dummyServices()
      services.readDestinationJson.returns({
        'type1-name1-id1': {
          foo: 'bar'
        }
      })
      await this.plugin.init(services)

      expect(this.plugin.instance(dummyRequest(1)).localStorage).to.be.deep.equal({ foo: 'bar' })

      expect(this.plugin.instance(dummyRequest(2)).localStorage).to.be.deep.equal({})
    })

    it('should write the local storage object into file at the end', async function () {
      const services = dummyServices()
      await this.plugin.init(services)

      this.plugin.instance(dummyRequest(1)).localStorage.foo = 'bar'
      this.plugin.instance(dummyRequest(2)).localStorage.foo2 = 'bar2'

      await this.plugin.end()

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
      const services = dummyServices()
      await this.plugin.init(services)

      const instance1 = this.plugin.instance(dummyRequest(1))

      const instance2 = this.plugin.instance(dummyRequest(2))

      expect(instance1.localStorage).to.not.be.equal(instance2.localStorage)
    })
  })

  describe('global-storage plugin', function () {
    function dummyServices () {
      return {
        fs: {
          readJSON: sinon.stub().returns({}),
          writeJSON: sinon.spy()
        }
      }
    }

    beforeEach(async function () {
      await mockImport('../../../app/plugins/fs.mjs', {
        default: 'fs plugin'
      })

      const { GlobalStoragePlugin } = await import('../../../app/plugins/storage.mjs')
      this.plugin = new GlobalStoragePlugin({ globalStoragePath: 'globalStoragePath' })
    })

    it('should have fs plugin as dependency', async function () {
      expect(this.plugin.dependencies).to.be.deep.equal(['fs plugin'])
    })

    it('should read the right file at the beginning', async function () {
      const services = dummyServices()

      await this.plugin.init(services)

      expect(services.fs.readJSON).to.have.been.calledWith('globalStoragePath', {})
    })

    it('should read the global storage object from file at the beginning', async function () {
      const services = dummyServices()
      services.fs.readJSON.returns({
        'type1-name1-id1': {
          foo: 'bar'
        }
      })
      await this.plugin.init(services)

      expect(this.plugin.instance(dummyRequest(1)).globalStorage).to.be.deep.equal({ foo: 'bar' })

      expect(this.plugin.instance(dummyRequest(2)).globalStorage).to.be.deep.equal({})
    })

    it('should write the global storage object into file at the end', async function () {
      const services = dummyServices()
      await this.plugin.init(services)

      this.plugin.instance(dummyRequest(1)).globalStorage.foo = 'bar'
      this.plugin.instance(dummyRequest(2)).globalStorage.foo2 = 'bar2'

      await this.plugin.end()

      expect(services.fs.writeJSON).to.have.been.calledWith('globalStoragePath', {
        'type1-name1-id1': {
          foo: 'bar'
        },
        'type2-name2-id2': {
          foo2: 'bar2'
        }
      })
    })

    it('should return different instances for different requests', async function () {
      const services = dummyServices()
      await this.plugin.init(services)

      const instance1 = this.plugin.instance(dummyRequest(1))
      const instance2 = this.plugin.instance(dummyRequest(2))

      expect(instance1.globalStorage).to.not.be.equal(instance2.globalStorage)
    })

    it('should call to fs methods with the right context', async function () {
      const services = dummyServices()
      await this.plugin.init(services)

      await this.plugin.end()

      expect(services.fs.readJSON).to.have.been.calledOn(services.fs)
      expect(services.fs.writeJSON).to.have.been.calledOn(services.fs)
    })
  })
})
