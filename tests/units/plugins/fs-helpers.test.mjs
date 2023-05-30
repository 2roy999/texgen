import { replaceEsm } from 'testdouble'

describe('fs helpers', function () {

  describe('destination reader plugin', function () {

    beforeEach(async function () {
      await mockImport('../../../app/plugins/fs.mjs', {
        default: 'fs plugin'
      })
      const { default: check } = await import('../../../app/plugins/fs.mjs')
      expect(check).to.be.equal('fs plugin')
      const { DestinationReaderPlugin } = await import('../../../app/plugins/fs-helpers.mjs')
      this.plugin = new DestinationReaderPlugin({ destinationRoot: 'destinationRoot' })
    })

    it('should have fs plugin as dependency', async function () {
      expect(this.plugin.dependencies).to.be.deep.equal(['fs plugin'])
    })

    it('should add the destination root to any file reading', async function () {
      const fs = {
        read: sinon.stub().returns('bar')
      }
      const args = new Array(10).fill().map((_, i) => `arg${i}`)

      await this.plugin.init({ fs })

      const result = await this.plugin.instance().readDestination('foo', ...args)

      expect(fs.read).to.have.been.calledWith('destinationRoot/foo', ...args)
      expect(result).to.be.equal('bar')
    })

    it('should add the destination root to any json file reading', async function () {
      const fs = {
        readJSON: sinon.stub().returns({ bar: 'baz' })
      }
      const args = new Array(10).fill().map((_, i) => `arg${i}`)

      await this.plugin.init({ fs })

      const result = await this.plugin.instance().readDestinationJson('foo.json', ...args)

      expect(fs.readJSON).to.have.been.calledWith('destinationRoot/foo.json', ...args)
      expect(result).to.be.deep.equal({ bar: 'baz' })
    })
  })

  describe('destination writer plugin', function () {

    beforeEach(async function () {
      await mockImport('../../../app/plugins/fs.mjs', {
        default: 'fs plugin'
      })
      const { DestinationWriterPlugin } = await import('../../../app/plugins/fs-helpers.mjs')
      this.plugin = new DestinationWriterPlugin({ destinationRoot: 'destinationRoot' })
    })

    it('should have fs plugin as dependency', async function () {
      expect(this.plugin.dependencies).to.be.deep.equal(['fs plugin'])
    })

    it('should add the destination root to any file writing', async function () {
      const fs = {
        write: sinon.spy()
      }
      const args = new Array(10).fill().map((_, i) => `arg${i}`)

      await this.plugin.init({ fs })

      await this.plugin.instance().writeDestination('foo', ...args)

      expect(fs.write).to.have.been.calledWith('destinationRoot/foo', ...args)
    })

    it('should add the destination root to any json file writing', async function () {
      const fs = {
        writeJSON: sinon.spy()
      }
      const args = new Array(10).fill().map((_, i) => `arg${i}`)

      await this.plugin.init({ fs })

      await this.plugin.instance().writeDestinationJson('foo.json', ...args)

      expect(fs.writeJSON).to.have.been.calledWith('destinationRoot/foo.json', ...args)
    })
  })

  describe('templates reader plugin', function () {
    beforeEach(async function () {
      await mockImport('../../../app/plugins/fs.mjs', {
        default: 'fs plugin'
      })
      const { TemplatesReaderPlugin } = await import('../../../app/plugins/fs-helpers.mjs')
      this.plugin = new TemplatesReaderPlugin({ templatesRoot: 'templatesRoot' })
    })

    it('should have fs plugin as dependency', async function () {
      expect(this.plugin.dependencies).to.be.deep.equal(['fs plugin'])
    })

    it('should add the templates root to any file reading', async function () {
      const fs = {
        read: sinon.stub().returns('bar')
      }
      const args = new Array(10).fill().map((_, i) => `arg${i}`)

      await this.plugin.init({ fs })

      const result = await this.plugin.instance().readTemplate('foo', ...args)

      expect(fs.read).to.have.been.calledWith('templatesRoot/foo', ...args)
      expect(result).to.be.equal('bar')
    })

    it('should add the templates root to any json file reading', async function () {
      const fs = {
        readJSON: sinon.stub().returns({ bar: 'baz' })
      }
      const args = new Array(10).fill().map((_, i) => `arg${i}`)

      await this.plugin.init({ fs })

      const result = await this.plugin.instance().readTemplateJson('foo.json', ...args)

      expect(fs.readJSON).to.have.been.calledWith('templatesRoot/foo.json', ...args)
      expect(result).to.be.deep.equal({ bar: 'baz' })
    })
  })
})
