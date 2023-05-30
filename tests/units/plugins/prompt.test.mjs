import inquirer from 'inquirer'

function dummyServices (name) {
  return {
    localStorage: {},
    globalStorage: {}
  }
}

describe('prompt plugin', function () {
  beforeEach(async function () {
    await mockImport('../../../app/plugins/storage.mjs', {
      LocalStoragePlugin: 'local storage plugin',
      GlobalStoragePlugin: 'global storage plugin'
    })

    this.inquirerMock = await mockImport('inquirer')
    this.inquirerMock.prompt = sinon.stub().resolves({})

    const { default: PromptPlugin } = await import('../../../app/plugins/prompt.mjs')
    this.plugin = new PromptPlugin()
  })

  it('should have local storage and global storage plugins as dependencies', async function () {
    expect(this.plugin.dependencies).to.be.deep.equal(['local storage plugin', 'global storage plugin'])
  })

  it('should prompt the question to the user', async function () {
    const services = dummyServices()
    await this.plugin.init(services)

    const questions = [{ name: 'q1' }, { name: 'q2' }]
    await this.plugin.instance().prompt(questions)

    expect(this.inquirerMock.prompt).to.have.been.calledWith(questions)
  })

  it('should return the answers of the prompt questions', async function () {
    const services = dummyServices()
    this.inquirerMock.prompt.resolves({ q1: 'a1', q2: 'a2' })
    await this.plugin.init(services)

    const answers = await this.plugin.instance().prompt([{ name: 'q1' }, { name: 'q2' }])

    expect(answers).to.be.deep.equal({ q1: 'a1', q2: 'a2' })
  })

  it('should not prompt a question to the user if the answer is already in the local storage', async function () {
    const services = dummyServices()
    services.localStorage = {
      q1: 'a1'
    }

    await this.plugin.init(services)

    await this.plugin.instance().prompt([{ name: 'q1' }, { name: 'q2' }])

    expect(this.inquirerMock.prompt).to.have.been.calledWith([{ name: 'q2' }])
  })

  it('should return the answers of the skipped questions', async function () {
    const services = dummyServices()
    services.localStorage = {
      q1: 'a1'
    }

    this.inquirerMock.prompt.resolves({ q2: 'a2' })
    await this.plugin.init(services)

    const answers = await this.plugin.instance().prompt([{ name: 'q1' }, { name: 'q2' }])

    expect(answers).to.be.deep.equal({ q1: 'a1', q2: 'a2' })
  })

  it('should save the new answers in the local storage', async function () {
    const services = dummyServices()
    await this.plugin.init(services)

    this.inquirerMock.prompt.resolves({ q1: 'a1', q2: 'a2' })
    await this.plugin.instance().prompt([{ name: 'q1' }, { name: 'q2' }])

    expect(services.localStorage).to.be.deep.equal({ q1: 'a1', q2: 'a2' })
  })

  it('should use default values from the global storage when question has store', async function () {
    const services = dummyServices()
    services.globalStorage = { q1: 'a1' }
    await this.plugin.init(services)

    await this.plugin.instance().prompt([{ name: 'q1', store: true }, { name: 'q2' }])

    expect(this.inquirerMock.prompt).to.have.been.calledWith([{ name: 'q1', default: 'a1' }, { name: 'q2' }])
  })

  it('should save the last values in the global storage when question has store', async function () {
    const services = dummyServices()
    await this.plugin.init(services)
    this.inquirerMock.prompt.resolves({ q1: 'a1', q2: 'a2' })

    await this.plugin.instance().prompt([{ name: 'q1', store: true }, { name: 'q2' }])

    expect(services.globalStorage).to.be.deep.equal({ q1: 'a1' })
  })
})
