import { ApiGatewayToLambda } from "@aws-solutions-constructs/aws-apigateway-lambda";
import {
  aws_apigateway,
  aws_certificatemanager,
  aws_lambda_nodejs,
  aws_route53,
  aws_route53_targets,
  aws_secretsmanager,
} from "aws-cdk-lib";
import { Construct } from "constructs";

interface Props {
  hostedZone: aws_route53.IPublicHostedZone;
  privateKeySecretCompleteArn: string;
  publicKeyId: string;
  certificate: aws_certificatemanager.ICertificate;
}

export class ApiConstruct extends Construct {
  readonly hostedZone: aws_route53.IPublicHostedZone;
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const {
      hostedZone,
      privateKeySecretCompleteArn,
      publicKeyId,
      certificate,
    } = props;

    const secret = aws_secretsmanager.Secret.fromSecretCompleteArn(
      this,
      "SecretKey",
      privateKeySecretCompleteArn
    );

    const cookieHandler = new aws_lambda_nodejs.NodejsFunction(
      this,
      "sources.cookie-handler",
      {
        entry: "sources/cookie-handler/index.ts",
        environment: {
          PRIVATE_KEY_SECRET_COMPLETE_ARN: privateKeySecretCompleteArn,
          DOMAIN_NAME: hostedZone.zoneName,
          KEY_PAIR_ID: publicKeyId,
        },
      }
    );

    secret.grantRead(cookieHandler);

    const { apiGateway } = new ApiGatewayToLambda(
      this,
      "ApiGatewayToLambdaPattern",
      {
        existingLambdaObj: cookieHandler,
        apiGatewayProps: {
          defaultMethodOptions: {
            authorizationType: aws_apigateway.AuthorizationType.NONE,
          },
        },
      }
    );

    const apiGatewayDomainName = `api.${hostedZone.zoneName}`;

    const apiDomainName = new aws_apigateway.DomainName(this, "ApiDomainName", {
      domainName: apiGatewayDomainName,
      certificate,
      mapping: apiGateway,
      endpointType: aws_apigateway.EndpointType.EDGE,
    });

    new aws_route53.ARecord(this, "ApiRecord", {
      zone: hostedZone,
      recordName: `api.${hostedZone.zoneName}`,
      target: aws_route53.RecordTarget.fromAlias(
        new aws_route53_targets.ApiGatewayDomain(apiDomainName)
      ),
    });
  }
}
