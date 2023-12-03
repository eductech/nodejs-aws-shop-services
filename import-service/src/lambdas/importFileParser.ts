import { S3Event } from "aws-lambda";
import {
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { s3Client } from "./utils";
// @ts-ignore
import csv from "csv-parser";
import { Readable } from "stream";

const move = async ({
  bucket,
  from,
  to,
}: {
  bucket: string;
  from: string;
  to: string;
}) => {
  await s3Client.send(
    new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${from}`,
      Key: to,
    })
  );
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: from,
    })
  );
};

export const handler = async (event: S3Event) => {
  try {
    console.log("importFileParser", JSON.stringify(event));

    const bucket = event.Records[0].s3.bucket.name;
    const fileName = decodeURIComponent(
      event.Records[0].s3.object.key.replace(/\+/g, " ")
    );
    const { Body: stream } = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: decodeURIComponent(fileName),
      })
    );
    if (!stream) return;

    await new Promise<void>((resolve, reject) => {
      (stream as Readable)
        .pipe(csv())
        .on('data', (data: any) => console.log(data))
        .on("end", async () => {
          await move({
            from: fileName,
            to: fileName.replace("uploaded/", "parsed/"),
            bucket,
          });
          console.log("file moved");
          resolve();
        })
        .on("error", (error: any) => {
          reject(error);
        });
    });
    console.log("parsing succeed");
  } catch (err: any) {
    console.log("parsing error", err);
  }
};
