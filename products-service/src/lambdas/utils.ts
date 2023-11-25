const createResponse = ({
  statusCode,
  body,
  headers,
}: {
  statusCode: number;
  body: object;
  headers?: object;
}) => {
  return {
    statusCode,
    body: JSON.stringify(body),
    headers: {
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Origin": "*",
      ...headers,
    },
  };
};

export { createResponse };
