import { APIGatewayEvent } from 'aws-lambda';
import { handler } from '../src/lambdas/getProductsById';
import '../src/lambdas/mocks';

jest.mock('../src/lambdas/mocks', () => ({
  products: [{
    id: 'mock_id',
    title: 'mock title',
    description: 'mock description',
    price: 100,
  }],
}));

describe('Given getProductsById handler', () => {
  describe('when it is called', () => {
    describe('and products exists in db', () => {
      it('should return product data', async () => {
        const result = await handler({ pathParameters: { productId: 'mock_id' } } as unknown as APIGatewayEvent);
        expect(JSON.parse(result.body).data.price).toBe(100);
      });
    });

    describe('and product does NOT exist in db', () => {
      it('should return 404', async () => {
        const result = await handler({ pathParameters: { productId: 'another_mock_id' } } as unknown as APIGatewayEvent);
        expect(result.statusCode).toBe(404);
      });
    });

    describe('and product id is NOT passed', () => {
      it('should return 404', async () => {
        const result = await handler({} as unknown as APIGatewayEvent);
        expect(result.statusCode).toBe(404);
      });
    });
  });
});
