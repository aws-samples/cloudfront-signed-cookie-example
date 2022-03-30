import { CloudFrontToS3 } from "@aws-solutions-constructs/aws-cloudfront-s3";
import {
  aws_certificatemanager,
  aws_cloudfront,
  aws_route53,
  aws_route53_targets,
  aws_s3,
  aws_s3_deployment,
} from "aws-cdk-lib";
import { Construct } from "constructs";

interface Props {
  hostedZone: aws_route53.IPublicHostedZone;
  keyGroupId: string;
  certificate: aws_certificatemanager.ICertificate;
}

export class AssetDistributionConstruct extends Construct {
  readonly hostedZone: aws_route53.IPublicHostedZone;
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { hostedZone, keyGroupId, certificate } = props;

    const assetDistributionDomainName = `asset.${hostedZone.zoneName}`;

    const {
      s3Bucket: assetBucket,
      cloudFrontWebDistribution: assetDistribution,
    } = new CloudFrontToS3(this, "AssetDistribution", {
      insertHttpSecurityHeaders: false,
      bucketProps: {
        encryption: aws_s3.BucketEncryption.S3_MANAGED,
        cors: [
          {
            allowedHeaders: ["*"],
            allowedMethods: [aws_s3.HttpMethods.GET],
            allowedOrigins: ["*"],
          },
        ],
      },
      cloudFrontDistributionProps: {
        certificate,
        domainNames: [assetDistributionDomainName],
        defaultBehavior: {
          allowedMethods: aws_cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          originRequestPolicy:
            aws_cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
          responseHeadersPolicy:
            aws_cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS,
          trustedKeyGroups: [
            aws_cloudfront.KeyGroup.fromKeyGroupId(
              this,
              "AssetTrustedKeyGroup",
              keyGroupId
            ),
          ],
        },
      },
    });

    new aws_s3_deployment.BucketDeployment(this, "AssetDeployment", {
      destinationBucket: assetBucket!,
      distribution: assetDistribution!,
      sources: [aws_s3_deployment.Source.asset("sources/assets")],
    });

    new aws_route53.ARecord(this, "AssetRecord", {
      zone: hostedZone,
      recordName: `asset.${hostedZone.zoneName}`,
      target: aws_route53.RecordTarget.fromAlias(
        new aws_route53_targets.CloudFrontTarget(assetDistribution)
      ),
    });
  }
}
