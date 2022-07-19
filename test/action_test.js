const sinon = require('sinon')
const chai = require('chai')
const sinonChai = require('sinon-chai')
const core = require('@actions/core')
const Utils = require('../src/utils')
const { runAction } = require('../src/action')

chai.use(sinonChai)
const { expect } = chai

describe('Action', () => {
  const sandbox = sinon.createSandbox()

  afterEach(() => sandbox.verifyAndRestore())

  describe('#runAction', () => {
    let fetchExportsStub, injectExportValueMapToEnvironmentStub

    beforeEach(() => {
      fetchExportsStub = sandbox.stub(Utils, 'fetchExports')
      injectExportValueMapToEnvironmentStub = sandbox.stub(Utils, 'injectExportValueMapToEnvironment')
    })

    context('when there are no missing exports', () => {
      beforeEach(async () => {
        fetchExportsStub.resolves({ foo: 'fooVal' })
        await runAction([ 'foo => FOO_ENV' ])
      })

      it('injects export value map to environment', () => {
        expect(injectExportValueMapToEnvironmentStub)
          .to.have.been.calledWithExactly({ foo: 'fooVal' }, { foo: 'FOO_ENV' })
      })
    })

    context('when there are missing exports', () => {
      let coreSetFailedStub

      beforeEach(async () => {
        coreSetFailedStub = sandbox.stub(core, 'setFailed')
        fetchExportsStub.resolves({ foo: 'fooVal' })
        await runAction([ 'foo => FOO_ENV', 'bar => BAR_ENV', 'boo => BOO_ENV' ])
      })

      it('sets the action failed, listing missing exports', () => {
        expect(coreSetFailedStub).to.have.been
          .calledWithExactly('Action failed due to missing exports: bar, boo')
      })

      it('does not inject env variables', () => {
        return expect(injectExportValueMapToEnvironmentStub).to.not.have.been.called
      })
    })

    context('when some error happens', () => {
      let error, coreSetFailedStub

      beforeEach(async () => {
        error = new Error('💩 broke')
        fetchExportsStub.rejects(error)
        coreSetFailedStub = sandbox.stub(core, 'setFailed')
        await runAction([ 'foo => FOO_ENV' ])
      })

      it('sets the action failed', async () => {
        expect(coreSetFailedStub).to.have.been.calledWithExactly(`Action failed with error: ${error}`)
      })

      it('does not inject env variables', () => {
        return expect(injectExportValueMapToEnvironmentStub).to.not.have.been.called
      })
    })
  })
})