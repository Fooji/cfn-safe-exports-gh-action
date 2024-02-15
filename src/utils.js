const core = require('@actions/core')
const difference = require('lodash/difference')
const cloudformation = require('./cloudformation')
const listExportsCommand = require('./listExportsCommand')

const processInput = (inputExports) => {
  return inputExports
    .map((exportString) => exportString.split(' => '))
    .reduce((acc, [name, envVar]) => {
      if (!name || !envVar) {
        throw new Error(`Invalid exports input. Stopped with ${JSON.stringify(acc)}`)
      }

      if (Object.values(acc).includes(envVar)) {
        throw new Error(`Invalid exports input. Export "${name}" uses duplicate env var "${envVar}".`)
      }

      acc[name] = envVar
      return acc
    }, {})
}

const injectExportValueMapToEnvironment = (exportMap, processedExportNames) => {
  for (const exportName in exportMap) {
    const exportValue = exportMap[exportName]
    core.setSecret(exportValue) // Masks from logs
    const finalExportName = processedExportNames[exportName]

    core.debug(`Injecting environment variable '${finalExportName}'.`)
    core.exportVariable(finalExportName, exportValue)
  }
}

const getMissingExports = (exportMap, inputExports) => {
  const exported = Object.keys(exportMap)
  return difference(inputExports, exported)
}

const fetchExports = async (inputExports, previousResult = {}, nextToken) => {
  const command = listExportsCommand.getListExportsCommand(nextToken)
  const { Exports, NextToken } = await cloudformation.send(command)
  const result = Exports.reduce((acc, { Name, Value }) => {
    if (inputExports.includes(Name)) {
      acc[Name] = Value
    }

    return acc
  }, previousResult)

  return NextToken ? fetchExports(inputExports, result, NextToken) : result
}

module.exports = {
  processInput,
  fetchExports,
  getMissingExports,
  injectExportValueMapToEnvironment
}
