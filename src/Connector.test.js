import Client, * as clientMocks from '@cesarbr/knot-cloud-sdk-js-amqp';
import Connector from './Connector';

jest.mock('@cesarbr/knot-cloud-sdk-js-amqp');

describe('Connector', () => {
  beforeEach(() => {
    clientMocks.mockConnect.mockClear();
    clientMocks.mockRegister.mockClear();
    clientMocks.mockUnregister.mockClear();
    clientMocks.mockUpdateSchema.mockClear();
    clientMocks.mockGetDevices.mockClear();
    clientMocks.mockPublishData.mockClear();
    clientMocks.mockOn.mockClear();
    clientMocks.mockUnsubscribe.mockClear();
  });

  test('start: should start connector when connection is stablished without errors', async () => {
    const client = new Client();
    const connector = new Connector(client);
    await connector.start();
    expect(clientMocks.mockConnect).toHaveBeenCalled();
    expect(clientMocks.mockGetDevices).toHaveBeenCalled();
  });
});
