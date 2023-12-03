import { S3Client } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: 'eu-north-1'});

export { s3Client };
