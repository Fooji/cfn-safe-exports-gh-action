const core = require('@actions/core')
const Utils = require('./utils')

const runAction = async (inputExports) => {
  try {
    const processedExportNames = Utils.processInput(inputExports)
    const exportNames = Object.keys(processedExportNames)

    const exportMap = await Utils.fetchExports(exportNames)
    const missingExports = Utils.getMissingExports(exportMap, exportNames)

    if (missingExports.length > 0) {
      core.setFailed(`Action failed due to missing exports: ${missingExports.join(', ')}`)
    } else {
      Utils.injectExportValueMapToEnvironment(exportMap, processedExportNames)
    }
  } catch (err) {
    core.setFailed(`Action failed with error: ${err}`)
  }
}

module.exports = { runAction }
