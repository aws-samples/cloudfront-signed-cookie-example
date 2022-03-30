import { aws_route53 } from "aws-cdk-lib";
import { Construct } from "constructs";

interface Props {
  domainName: string;
  hostedZoneId: string;
}

export class HostedZoneConstruct extends Construct {
  readonly hostedZone: aws_route53.IPublicHostedZone;
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { domainName, hostedZoneId } = props;

    this.hostedZone = aws_route53.PublicHostedZone.fromHostedZoneAttributes(
      this,
      "HostedZone",
      {
        zoneName: domainName,
        hostedZoneId,
      }
    );
  }
}
