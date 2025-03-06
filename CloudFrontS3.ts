import * as pulumi from "@pulumi/pulumi";
import * as ccapi from "@pulumi/aws-native";
import * as pulumicdk from '@pulumi/cdk';
import { CloudFrontToS3 } from "@aws-solutions-constructs/aws-cloudfront-s3";
import { aws_cloudfront } from 'aws-cdk-lib';


// Define class that acts as a set of CDK and other Pulumi resources
class CloudFrontS3 extends pulumicdk.Stack {

  cloudFrontDomain: pulumi.Output<string>;
  websiteBucketName: pulumi.Output<string>;

  constructor(app: pulumicdk.App, id: string, options?: pulumicdk.StackOptions) {
    super(app, id, options);

    // Create Cloudfront distro and website and logging buckts, etc using the L3 CDK construct
    const cloudfrontBucketInfra = new CloudFrontToS3(this, id, {
      cloudFrontDistributionProps: {
        priceClass: 'PriceClass_100', // Limit to US, Mexico, Canada, Europe, etc (see https://aws.amazon.com/cloudfront/pricing/)
        // geoRestriction: aws_cloudfront.GeoRestriction.allowlist('US', 'CA')
      },
    })
    // Get the domain name for the CloudFront distribution
    this.cloudFrontDomain = this.asOutput(cloudfrontBucketInfra.cloudFrontWebDistribution.distributionDomainName);

    // Get the name for the bucket that is set up to hold the website content.
    this.websiteBucketName = this.asOutput(cloudfrontBucketInfra.s3Bucket!.bucketName);

  }
}

// Define App class that uses the above Stack classes.
class CloudFrontS3Deployment extends pulumicdk.App {
  constructor(prefix: string) {
    super('cloudfronts3deployment', (scope: pulumicdk.App) => {
        const stack = new CloudFrontS3(scope, `${prefix}-cf-s3`, {});
        return { 
          cloudFrontDomain: stack.cloudFrontDomain,
          websiteBucketName: stack.websiteBucketName
        };
    }, 
  );
  }
}


export interface CloudFrontS3CompArgs {
  
}

// This resources helps you create a self signed certificate.
export class CloudFrontS3Comp extends pulumi.ComponentResource {
  public readonly cloudFrontDomain: pulumi.Output<any>;
  public readonly websiteBucketName: pulumi.Output<any>;
  private cloudFrontS3Deployment: CloudFrontS3Deployment;

  constructor(name: string, args?: CloudFrontS3Comp, opts?: pulumi.ComponentResourceOptions) {
      super("cdk-component:index:CloudFrontS3Comp", name, args, opts);

      this.cloudFrontS3Deployment= new CloudFrontS3Deployment(name);

      this.cloudFrontDomain = this.cloudFrontS3Deployment.outputs['cloudFrontDomain'];
      this.websiteBucketName = this.cloudFrontS3Deployment.outputs['websiteBucketName'];
  }
}