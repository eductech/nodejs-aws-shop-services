import { handler } from "../src/lambdas/importFileParser";
import { S3Event } from "aws-lambda";
import { PassThrough } from "stream";
import * as utils from "../src/lambdas/utils";

const mockStream = new PassThrough();
jest.mock("../src/lambdas/utils");
jest.mock("../src/utils");
jest.mock("csv-parser", () => {
  return {
    default: jest.fn(() => new PassThrough()),
  };
});

const mockEvent: S3Event = {
  Records: [
    {
      eventVersion: "",
      eventSource: "",
      awsRegion: "",
      eventTime: "",
      eventName: "",
      userIdentity: { principalId: "" },
      requestParameters: { sourceIPAddress: "" },
      responseElements: {} as any,
      s3: {
        s3SchemaVersion: "",
        configurationId: "",
        bucket: {
          name: "",
          ownerIdentity: { principalId: "" },
          arn: "",
        },
        object: {
          key: "",
          size: NaN,
          eTag: "",
          sequencer: "",
        },
      },
    },
  ],
};

describe("Given lambda handler", () => {
  let s3ClientSendMock: jest.SpyInstance;

  beforeEach(() => {
    s3ClientSendMock = jest.spyOn(utils.s3Client, "send");
    s3ClientSendMock.mockResolvedValue({ Body: mockStream });
  });

  describe("when it is called", () => {
    it("should send commands through s3 client", async () => {
      setTimeout(() => mockStream.emit("end"), 0);
      await handler(mockEvent);
      expect(s3ClientSendMock).toHaveBeenCalledTimes(3);
    });
  });
});
