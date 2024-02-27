const sinon = require('sinon')
const chai = require('chai')
const sinonChai = require('sinon-chai')
const core = require('@actions/core')
const cloudformation = require('../src/cloudformation')
const listExportsCommand = require('../src/listExportsCommand')
const { ListExportsCommand } = require('@aws-sdk/client-cloudformation')
const {
  processInput,
  fetchExports,
  getMissingExports,
  injectExportValueMapToEnvironment
} = require('../src/utils')

chai.use(sinonChai)
const { expect } = chai

describe('Utils', () => {
  const sandbox = sinon.createSandbox()

  afterEach(() => sandbox.verifyAndRestore())

  describe('#processInput', () => {
    it('processes a valid input', () => {
      const input = [
        'foo => FOO_ENV',
        'bar => BAR_ENV'
      ]

      expect(processInput(input)).to.deep.equal({ foo: 'FOO_ENV', bar: 'BAR_ENV' })
    })

    it('throws an error with an invalid input', () => {
      const input = [
        'foo => FOO_ENV',
        'bar'
      ]

      expect(() => processInput(input))
        .to.throw(`Invalid exports input. Stopped with ${JSON.stringify({ foo: 'FOO_ENV' })}`)
    })

    it('throws an error with duplicate mappings', () => {
      const input = [
        'foo => FOO_ENV',
        'bar => FOO_ENV'
      ]

      expect(() => processInput(input))
        .to.throw('Invalid exports input. Export "bar" uses duplicate env var "FOO_ENV".')
    })
  })

  describe('#getMissingExports', () => {
    let inputExports = ['foo', 'bar', 'boo']

    context('with missing exports', () => {
      it('returns missing exports', () => {
        expect(getMissingExports({ foo: 'foo' }, inputExports)).to.deep.equal(['bar', 'boo'])
      })
    })

    context('without missing exports', () => {
      it('returns an empty array', () => {
        expect(getMissingExports({ foo: 'foo', bar: 'bar', boo: 'boo' }, inputExports)).to.deep.equal([])
      })
    })
  })

  describe('#fetchExports', () => {
    let cfSendCommandStub, inputExports, getListExportsCommandStub

    beforeEach(() => {
      cfSendCommandStub = sandbox.stub(cloudformation, 'send')
      getListExportsCommandStub = sandbox.stub(listExportsCommand, 'getListExportsCommand')

      inputExports = ['foo', 'bar']
    })

    it('returns export map for found requested exports', async () => {
      getListExportsCommandStub.returns(sandbox.createStubInstance(ListExportsCommand))
      cfSendCommandStub.resolves({ Exports: [{ Name: 'foo', Value: 'fooVal' }, { Name: 'boo', Value: 'booVal' }] })

      expect(await fetchExports(inputExports)).to.deep.equal({ foo: 'fooVal' })
    })

    context('when there are more pages', () => {
      beforeEach(() => {
        const listExportsCommandWithNextTokenUndefined = new ListExportsCommand({ NextToken: undefined })
        getListExportsCommandStub.withArgs(undefined).returns(listExportsCommandWithNextTokenUndefined)
        cfSendCommandStub
          .withArgs(listExportsCommandWithNextTokenUndefined)
          .resolves({ Exports: [{ Name: 'foo', Value: 'fooVal' }], NextToken: 'next' })

          const listExportsCommandWithNextTokenNext = new ListExportsCommand({ NextToken: 'next' })
        getListExportsCommandStub.withArgs('next').returns(listExportsCommandWithNextTokenNext)
        cfSendCommandStub
          .withArgs(listExportsCommandWithNextTokenNext)
          .resolves({ Exports: [{ Name: 'bar', Value: 'barVal' }] })
      })

      it('fetches next page', async () => {
        await fetchExports(inputExports)
        return expect(cfSendCommandStub).to.have.been.calledTwice
      })

      it('returns mapped exports from both pages', async () => {
        expect(await fetchExports(inputExports)).to.deep.equal({ foo: 'fooVal', bar: 'barVal' })
      })
    })
  })

  describe('#injectExportValueMapToEnvironment', () => {
    let setSecretStub, exportVariableStub

    beforeEach(() => {
      sandbox.stub(core, 'debug')
      setSecretStub = sandbox.stub(core, 'setSecret')
      exportVariableStub = sandbox.stub(core, 'exportVariable')

      injectExportValueMapToEnvironment({ foo: 'fooVal', bar: 'barVal' }, { foo: 'FOO_ENV', bar: 'BAR_ENV'})
    })

    it('sets exported values secret', () => {
      expect(setSecretStub).to.have.been.calledWithExactly('fooVal')
      expect(setSecretStub).to.have.been.calledWithExactly('barVal')
    })

    it('exports variables', () => {
      expect(exportVariableStub).to.have.been.calledWithExactly('FOO_ENV', 'fooVal')
      expect(exportVariableStub).to.have.been.calledWithExactly('BAR_ENV', 'barVal')
    })
  })
})