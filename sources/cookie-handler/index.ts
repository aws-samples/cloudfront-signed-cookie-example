import type { APIGatewayProxyHandler } from "aws-lambda";
import * as AWS from "aws-sdk";
// @ts-ignore
import { getSignedCookies } from "aws-cloudfront-sign";

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
  const signedCookies = getSignedCookies(`https://asset.${DOMAIN_NAME}/*`, {
    keypairId: KEY_PAIR_ID,
    privateKeyString,
  }) as any;
  const cookies: string[] = [];
  for (var cookieId in signedCookies) {
    cookies.push(
      `${cookieId}=${signedCookies[cookieId]};Domain=${DOMAIN_NAME};HttpOnly;Secure;SameSite=None`
    );
  }

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
