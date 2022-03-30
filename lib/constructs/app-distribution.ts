import { CloudFrontToS3 } from "@aws-solutions-constructs/aws-cloudfront-s3";
import {
  aws_certificatemanager,
  aws_route53,
  aws_route53_targets,
  aws_s3_deployment,
} from "aws-cdk-lib";
import { Construct } from "constructs";

interface Props {
  hostedZone: aws_route53.IPublicHostedZone;
  certificate: aws_certificatemanager.ICertificate;
}

export class AppDistributionConstruct extends Construct {
  readonly hostedZone: aws_route53.IPublicHostedZone;
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { hostedZone, certificate } = props;

    const appDistributionDomainName = `app.${hostedZone.zoneName}`;

    const { s3Bucket: appBucket, cloudFrontWebDistribution: appDistribution } =
      new CloudFrontToS3(this, "AppDistribution", {
        insertHttpSecurityHeaders: false,
        cloudFrontDistributionProps: {
          certificate,
          domainNames: [appDistributionDomainName],
        },
      });

    new aws_s3_deployment.BucketDeployment(this, "AppDeployment", {
      destinationBucket: appBucket!,
      distribution: appDistribution!,
      sources: [aws_s3_deployment.Source.asset("sources/app/build")],
    });

    new aws_route53.ARecord(this, "AppRecord", {
      zone: hostedZone,
      recordName: `app.${hostedZone.zoneName}`,
      target: aws_route53.RecordTarget.fromAlias(
        new aws_route53_targets.CloudFrontTarget(appDistribution)
      ),
    });
  }
}
