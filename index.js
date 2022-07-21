const core = require('@actions/core')
const { runAction } = require('./src/action')

// Get list of exports as array
const inputExportNames = [...new Set(core.getMultilineInput('exports'))]

runAction(inputExportNames)
