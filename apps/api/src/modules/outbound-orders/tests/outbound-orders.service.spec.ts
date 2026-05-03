import { OutboundOrdersService } from '../outbound-orders.service';

describe('OutboundOrdersService', () => {
  it('is defined', () => {
    const repository = {
      findById: jest.fn(),
    };
    const service = new OutboundOrdersService(repository as any);
    expect(service).toBeDefined();
  });
});
