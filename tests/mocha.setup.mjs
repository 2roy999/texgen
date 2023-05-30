import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import * as td from 'testdouble'
import { fileURLToPath } from 'url'

chai.use(chaiAsPromised)
chai.use(sinonChai)

global.expect = chai.expect
global.sinon = sinon

function getCaller () {
  const origPrepareStackTrace = Error.prepareStackTrace
  Error.prepareStackTrace = (_, stack) => stack

  const stack = new Error().stack

  Error.prepareStackTrace = origPrepareStackTrace

  return stack[2]
}

global.mockImport = async (path, mock) => {
  const returnValue = mock ?? {}
  mock = mock ?? { default: returnValue }

  if (path.startsWith('.')) {
    const caller = getCaller()
    path = fileURLToPath(new URL(path, caller.getFileName()))
  }

  await td.replaceEsm(path, mock)
  return returnValue
}

function dynamicNamedFunction (name, fn) {
  // eslint-disable-next-line no-new-func
  return new Function('fn', `return function ${name} () { return fn.apply(this, arguments) }`)(fn)
}

global.createDummyConstructor = name => {
  const func = sinon.fake(dynamicNamedFunction(name, function () {
    func.$ = Object.assign(this, func.$)
  }))

  return func
}

export const mochaHooks = {
  afterEach () {
    td.reset()
  }
}
