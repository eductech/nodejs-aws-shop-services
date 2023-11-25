import { APIGatewayEvent } from 'aws-lambda';
import { handler } from '../src/lambdas/getProductsList';
import '../src/lambdas/mocks';

jest.mock('../src/lambdas/mocks', () => ({
  products: [{
    id: 'mock_id',
    title: 'mock title',
    description: 'mock description',
    price: 100,
  }],
}));

describe('Given getProductsList handler', () => {
  describe('when it is called', () => {
    describe('and products exist in db', () => {
      it('should return products data', async () => {
        const result = await handler({} as unknown as APIGatewayEvent);
        expect(JSON.parse(result.body).data.length).toBe(1);
      });
    });
  });
});
