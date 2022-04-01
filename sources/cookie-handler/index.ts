import type { APIGatewayProxyHandler } from "aws-lambda";
import * as AWS from "aws-sdk";

const secretManager = new AWS.SecretsManager();

const { PRIVATE_KEY_SECRET_COMPLETE_ARN, DOMAIN_NAME, KEY_PAIR_ID } =
  process.env;

const allowedOrigins = [
  `https://app.${DOMAIN_NAME}`,
  `http://localhost:[0-9]*`, // for local development
];

export const handler: APIGatewayProxyHandler = async (event) => {
  const origin = event.headers.Origin || event.headers.origin;
  if (!allowedOrigins.some((allowedOrigin) => origin?.match(allowedOrigin))) {
    return {
      statusCode: 403,
      headers: {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Origin": allowedOrigins[0],
      },
      body: "bad origin",
    };
  }

  // Generate Signed Cookie
  const { SecretBinary } = await secretManager
    .getSecretValue({
      SecretId: PRIVATE_KEY_SECRET_COMPLETE_ARN!,
    })
    .promise();
  const privateKeyString = Buffer.from(SecretBinary!.toString()).toString(
    "ascii"
  );

  // expires in 1 hour
  const expires = Math.floor(new Date().getTime() / 1000) + 60 * 60;
  const signer = new AWS.CloudFront.Signer(KEY_PAIR_ID!, privateKeyString);
  const signedCookies = signer.getSignedCookie({
    url: `https://asset.${DOMAIN_NAME}/*`,
    expires,
  });

  const cookies: string[] = [];
  cookies.push(
    `CloudFront-Expires=${signedCookies["CloudFront-Expires"]};Domain=${DOMAIN_NAME};HttpOnly;Secure;SameSite=None`
  );
  cookies.push(
    `CloudFront-Key-Pair-Id=${signedCookies["CloudFront-Key-Pair-Id"]};Domain=${DOMAIN_NAME};HttpOnly;Secure;SameSite=None`
  );
  cookies.push(
    `CloudFront-Signature=${signedCookies["CloudFront-Signature"]};Domain=${DOMAIN_NAME};HttpOnly;Secure;SameSite=None`
  );

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": origin!,
      "Access-Control-Allow-Credentials": "true",
    },
    multiValueHeaders: {
      "Set-Cookie": cookies,
    },
    body: "ok",
  };
};
