import {
  APIGatewayRequestAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from "aws-lambda";

const createPolicy = (
  principalId: string,
  effect: "Allow" | "Deny",
  resource: string
): APIGatewayAuthorizerResult => {
  return {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: [resource],
        },
      ],
    },
  };
};

export const handler = async (event: APIGatewayRequestAuthorizerEvent) => {
  console.log("basicAuthorizer", JSON.stringify(event));

  let token: string = "";
  let effect: "Deny" | "Allow" = "Deny";
  let resource: string = "";

  try {
    token = event.headers?.authorization || "";
    resource = event.methodArn;
    if (!token) return createPolicy(token, effect, resource);

    const [authType, encodedToken] = token.split(" ");
    if (authType !== "Basic" || !encodedToken)
      return createPolicy(token, effect, resource);

    const [username, password] = Buffer.from(encodedToken, "base64")
      .toString("utf8")
      .split(":");
    effect = !password || process.env[username] !== password ? "Deny" : "Allow";

    return createPolicy(token, effect, event.resource);
  } catch (error: any) {
    console.log("basicAuthorizer error", error);
    return createPolicy(token, effect, resource);
  }
};
