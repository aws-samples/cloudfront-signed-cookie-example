#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CertificateStack } from "../lib/certificate-stack";
import { MainStack } from "../lib/main-stack";

const app = new cdk.App();

const {
  domainName,
  hostedZoneId,
  publicKeyId,
  keyGroupId,
  privateKeySecretCompleteArn,
} = app.node.tryGetContext("config");

const certificateStack = new CertificateStack(app, "CertificateStack", {
  env: {
    region: "us-east-1",
  },
  domainName,
  hostedZoneId,
});
const mainStack = new MainStack(app, "MainStack", {
  domainName,
  hostedZoneId,
  certificateStack,
  publicKeyId,
  privateKeySecretCompleteArn,
  keyGroupId,
});

mainStack.addDependency(certificateStack);
