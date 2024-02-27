const { ListExportsCommand } = require("@aws-sdk/client-cloudformation")

module.exports = {  
    getListExportsCommand: (nextToken) => new ListExportsCommand({ NextToken: nextToken })
}
