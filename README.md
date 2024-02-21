# THIS SCRIPT IS DEPRECATED BY [https://aws.amazon.com/blogs/security/introducing-new-central-configuration-capabilities-in-aws-security-hub/](https://aws.amazon.com/blogs/security/introducing-new-central-configuration-capabilities-in-aws-security-hub/)

# aws-securityhub-multiaccount-security-standards-script

This script will help you to enable and disable Security Hub standards across multiple accounts.

## Prerequisites
- NodeJS
- AWS SSO

## Usage
Login to your AWS SSO account and run the following command to get the credentials for your AWS CLI.

```
aws sso login --profile <your-profile-name>
```

Then change the global setting in the index.js file to your needs.

Then run

```
npm install
```

```
node index.js
```
