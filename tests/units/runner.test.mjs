
const { same } = sinon.match

describe('generator runner', function () {
  beforeEach(async function () {
    this.injectorMock = createDummyConstructor('Injector')
    await mockImport('../../app/injector.mjs', {
      default: this.injectorMock
    })
    this.injectorMock.$ = {
      registerDependencies: sinon.spy(),
      init: sinon.spy(),
      getInjection: sinon.stub().callsFake(() => ({})),
      finalize: sinon.spy()
    }

    this.generator = sinon.stub()

    this.args = []
    this.options = {}

    const { default: GeneratorRunner } = await import('../../app/runner.mjs')
    this.runner = new GeneratorRunner(this.generator, this.options)
  })

  it('should run the generator', async function () {
    await this.runner.run()

    expect(this.generator).to.have.been.called
  })

  it('should register the dependencies of the injector', async function () {
    await this.runner.run()

    expect(this.injectorMock.$.registerDependencies).to.have.been.calledWith(this.generator)
  })

  it('should run the generator with injected dependencies', async function () {
    const injection = {
      foo: 'bar',
      bar: 'baz'
    }
    this.injectorMock.$.getInjection.returns(injection)

    this.generator.callsFake(function () {
      expect(this.foo).to.be.equal('bar')
      expect(this.bar).to.be.equal('baz')
    })
    await this.runner.run()

    expect(this.generator).to.have.been.called
  })

  it('should initialize the injector before creating injection', async function () {
    await this.runner.run()

    expect(this.injectorMock.$.init).to.have.been.calledBefore(this.injectorMock.$.getInjection)
  })

  it('should finalize the injector after running the generator', async function () {
    await this.runner.run()

    expect(this.injectorMock.$.finalize).to.have.been.calledAfter(this.generator)
  })

  it('should not run the generator with generator instance', async function () {
    await this.runner.run()

    expect(this.generator).to.not.have.been.calledOn(this.generator.$)
  })

  it('should add to injection the the sub-generators runs function', async function () {
    this.generator.subs = {
      foo: sinon.spy(),
      bar: sinon.spy()
    }

    this.generator.callsFake(function () {
      this.run.foo('foo1', 'foo2')
      this.run.bar('bar1', 'bar2')
    })

    await this.runner.run()

    expect(this.generator.subs.foo).to.have.been.calledWith('foo1', 'foo2')
    expect(this.generator.subs.bar).to.have.been.calledWith('bar1', 'bar2')
  })

  it('should run the sub-generators with injected dependencies', async function () {
    const injection = {}
    this.generator.subs = {
      foo: sinon.spy()
    }

    this.generator.callsFake(function () {
      this.run.foo()
    })

    this.injectorMock.$.getInjection.onFirstCall().returns({})
    this.injectorMock.$.getInjection.onSecondCall().returns(injection)

    await this.runner.run()

    expect(this.generator.subs.foo).to.have.been.calledOn(same(injection))
  })

  it('should add to injection of a sub-generator the the sub-generators runs function', async function () {
    const foo = sinon.fake(function () {
      this.run.bar('bar1', 'bar2')
    })
    foo.subs = {
      bar: sinon.spy()
    }

    this.generator.subs = { foo }
    this.generator.callsFake(function () {
      this.run.foo()
    })

    await this.runner.run()

    expect(foo.subs.bar).to.have.been.calledWith('bar1', 'bar2')
  })
})
