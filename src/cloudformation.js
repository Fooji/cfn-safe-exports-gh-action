const { CloudFormationClient } = require("@aws-sdk/client-cloudformation")

const cloudformation = new CloudFormationClient()

module.exports = cloudformation