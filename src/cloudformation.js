const { CloudFormation } = require('aws-sdk')

const cloudformation = new CloudFormation({ apiVersion: '2010-05-15' })

module.exports = cloudformation