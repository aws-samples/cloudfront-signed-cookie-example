import {
  Stack,
  StackProps,
  aws_certificatemanager,
  CfnOutput,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { RemoteOutputs } from "cdk-remote-stack";
import { HostedZoneConstruct } from "./constructs/hosted-zone";

interface Props extends StackProps {
  domainName: string;
  hostedZoneId: string;
}

const OUTPUT_CERTIFICATE_ARN = "CertificateARN";

export class CertificateStack extends Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const { domainName, hostedZoneId } = props;

    const { hostedZone } = new HostedZoneConstruct(this, "HostedZone", {
      domainName,
      hostedZoneId,
    });

    const certificate = new aws_certificatemanager.Certificate(
      this,
      "Certificate",
      {
        domainName: `*.${domainName}`,
        validation:
          aws_certificatemanager.CertificateValidation.fromDns(hostedZone),
      }
    );

    new CfnOutput(this, OUTPUT_CERTIFICATE_ARN, {
      value: certificate.certificateArn,
    });
  }

  getCertificateArn(scope: Stack, id: string): string {
    const outputs = new RemoteOutputs(scope, `${id}Outputs`, { stack: this });
    const arn = outputs.get(OUTPUT_CERTIFICATE_ARN);
    return arn;
  }
}
