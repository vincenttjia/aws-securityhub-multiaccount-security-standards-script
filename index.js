var AWS = require("aws-sdk");
const fs = require('fs');
const homedir = require('os').homedir();

// AWS SSO Settings
let startUrl = "https://d-12345abcde.awsapps.com/start"; // Change this to your configured start url
let sso_region = "ap-southeast-1"; // Change this to your SSO region
let role_name = "AdministratorAccess"; // Change this to your role name

// Security Hub Settings
let region = "ap-southeast-1"; // Change this to your SecurityHub region
let aws_account_ids = [ // You can fill it out manually or use an api to get the list of accounts
    "123456789012",
    "234567890123",
    "345678901234",
    "456789012345",
    "567890123456",
    "678901234567",
    "789012345678",
];

// Get it using aws securityhub get-enabled-standards, on the StandardsArn field
// Example values
// arn:aws:securityhub:ap-southeast-1::standards/aws-foundational-security-best-practices/v/1.0.0
// arn:aws:securityhub:ap-southeast-1::standards/cis-aws-foundations-benchmark/v/1.2.0
// arn:aws:securityhub:ap-southeast-1::standards/cis-aws-foundations-benchmark/v/1.4.0
// arn:aws:securityhub:ap-southeast-1::standards/pci-dss/v/3.2.1

let disable_arns = [
    `arn:aws:securityhub:${region}::standards/cis-aws-foundations-benchmark/v/1.2.0`,
]

// Get it using aws securityhub describe-standards, on the StandardsArn field
// Example values
// arn:aws:securityhub:ap-southeast-1::standards/aws-foundational-security-best-practices/v/1.0.0
// arn:aws:securityhub:ap-southeast-1::standards/cis-aws-foundations-benchmark/v/1.2.0
// arn:aws:securityhub:ap-southeast-1::standards/cis-aws-foundations-benchmark/v/1.4.0
// arn:aws:securityhub:ap-southeast-1::standards/pci-dss/v/3.2.1

let enable_arns = [
    `arn:aws:securityhub:${region}::standards/aws-foundational-security-best-practices/v/1.0.0`,
    `arn:aws:securityhub:${region}::standards/cis-aws-foundations-benchmark/v/1.4.0`,
    `arn:aws:securityhub:${region}::standards/pci-dss/v/3.2.1`
]


let get_access_token = () => {
    let path  = `${homedir}/.aws/sso/cache`
    let accessToken = undefined;

    fs.readdirSync(path).forEach(file => {
        try {
            var obj = JSON.parse(fs.readFileSync(`${path}/${file}`, 'utf8'));
            if(obj.startUrl == startUrl){
                accessToken = obj.accessToken;
            }
        }catch{

        }
    });

    return accessToken;
}

let get_role_credentials = async (aws_account_id, accessToken) => {
    var sso = new AWS.SSO({region: sso_region});
    var params = {
        accessToken: accessToken,
        accountId: aws_account_id,
        roleName: role_name
    };

    let credentials = await sso.getRoleCredentials(params).promise();

    return credentials.roleCredentials;
}

let enable_disable_standards = async (aws_account_id, credentials) => {
    var securityhub = new AWS.SecurityHub({region: region, credentials: credentials});

    
    if(disable_arns.length > 0){

        let enabled_standards = await securityhub.getEnabledStandards().promise();
        let map = {};
        enabled_standards.StandardsSubscriptions.forEach((standard) => {
            map[standard.StandardsArn] = standard.StandardsSubscriptionArn;
        });

        let temp_disable_arns = disable_arns.map(arn => {
            return map[arn];
        });

        temp_disable_arns = temp_disable_arns.filter(arn => {
            return arn !== undefined;
        })
        
        var params = {
            StandardsSubscriptionArns: temp_disable_arns
        };

        if(temp_disable_arns.length > 0){
            var response = await securityhub.batchDisableStandards(params).promise();
            console.log(response);
        }

    }

    if(enable_arns.length > 0){
        let temp_enable_arns = enable_arns.map(arn => {
            return {StandardsArn: arn};
        });

        var params = {
            StandardsSubscriptionRequests: temp_enable_arns
        };

        var response = await securityhub.batchEnableStandards(params).promise();

        console.log(response);
    }
}


let main = async () => {
    let accessToken = get_access_token();
    aws_account_ids.forEach(async (aws_account_id) => {
        let credentials = await get_role_credentials(aws_account_id ,accessToken);
        enable_disable_standards(aws_account_id, credentials);
    });
}

main()