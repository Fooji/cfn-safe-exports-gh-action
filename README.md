# cfn-safe-exports-gh-action

## Building

Just `npm run build`, commit and tag

## Example usage

```
- name: Fetch imports from CFN into environment variables
  uses: Fooji/cfn-safe-exports-gh-action@v2
  with:
    exports: |
      foojiStage => FOOJI_STAGE
      foojiEnv => FOOJI_ENV
      otherExport => MY_CUSTOM_EXPORT
  env:
    AWS_PROFILE: stage-profile
    AWS_REGION: us-west-1
```

The AWS env variables are only required if we need to actually set them. Depends on how the credentials are setup.
