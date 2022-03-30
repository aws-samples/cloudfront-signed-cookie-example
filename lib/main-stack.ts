import { Stack, StackProps, aws_certificatemanager } from "aws-cdk-lib";
import { Construct } from "constructs";

import { CertificateStack } from "./certificate-stack";
import { HostedZoneConstruct } from "./constructs/hosted-zone";
import { ApiConstruct } from "./constructs/api";
import { AssetDistributionConstruct } from "./constructs/asset-distribution";
import { AppDistributionConstruct } from "./constructs/app-distribution";

interface Props extends StackProps {
  domainName: string;
  hostedZoneId: string;
  certificateStack: CertificateStack;
  privateKeySecretCompleteArn: string;
  publicKeyId: string;
  keyGroupId: string;
}

export class MainStack extends Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const {
      domainName,
      hostedZoneId,
      certificateStack,
      keyGroupId,
      publicKeyId,
      privateKeySecretCompleteArn,
    } = props;

    const certificate = aws_certificatemanager.Certificate.fromCertificateArn(
      this,
      "Certificate",
      certificateStack.getCertificateArn(this, "Certificate")
    );

    const { hostedZone } = new HostedZoneConstruct(this, "HostedZone", {
      domainName,
      hostedZoneId,
    });

    new ApiConstruct(this, "Api", {
      hostedZone,
      privateKeySecretCompleteArn,
      publicKeyId,
      certificate,
    });

    new AssetDistributionConstruct(this, "Asset", {
      hostedZone,
      keyGroupId,
      certificate,
    });

    new AppDistributionConstruct(this, "App", {
      hostedZone,
      certificate,
    });
  }
}
