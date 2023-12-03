import { handler } from "../src/lambdas/importProductsFile";
import { APIGatewayProxyEvent } from "aws-lambda";

const mockSignedUrl = "mockSignedUrl";
jest.mock("../src/lambdas/utils");
jest.mock("@aws-sdk/s3-request-presigner", () => {
  return {
    getSignedUrl: () => Promise.resolve(mockSignedUrl),
  };
});

const mockEvent: APIGatewayProxyEvent = {
  path: "",
  pathParameters: null,
  body: null,
  headers: {},
  multiValueHeaders: {},
  httpMethod: "GET",
  queryStringParameters: { name: "mock.csv" },
  multiValueQueryStringParameters: null,
  requestContext: {} as any,
  stageVariables: null,
  isBase64Encoded: false,
  resource: "",
};

describe("Given importProductsFile handler", () => {
  describe("when it is invoked", () => {
    it("should return presigned URL when valid CSV file name provided", async () => {
      const res = await handler(mockEvent);
      
      expect(res.statusCode).toEqual(200);
      expect(JSON.parse(res.body).url).toBe(mockSignedUrl);
    });
  });
});
