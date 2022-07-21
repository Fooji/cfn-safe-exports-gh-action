# cfn-safe-exports-gh-action

## What is this

Exports loading from CFN does not cause an error when the export does not exist.
This action pulls the exports, sets up the environment variables, but crashes if some variable is missing, instead of letting the workflow proceed.

## Building

Just `npm run build`, commit and tag

## Example usage

```
- name: Fetch imports from CFN into environment variables
  uses: Fooji/cfn-safe-exports-gh-action@v2
  with:
    exports: |
      cfnStage => CFN_STAGE
      cfnEnv => CFN_ENV
      otherExport => MY_CUSTOM_EXPORT
  env:
    AWS_PROFILE: stage-profile
    AWS_REGION: us-west-1
```

The AWS env variables are only required if we need to actually set them. Depends on how the AWS credentials are setup on the wrokflow. If you use aws-actions/configure-aws-credentials, then you probably won't need to set any, you can just remove the `env` from that step.
