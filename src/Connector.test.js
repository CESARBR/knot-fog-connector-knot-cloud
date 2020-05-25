import Client, * as clientMocks from '@cesarbr/knot-cloud-sdk-js-amqp';
import Connector from './Connector';

jest.mock('@cesarbr/knot-cloud-sdk-js-amqp');

const errors = {
  connectClient: 'fail to connect to AMQP channel',
};

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

  test('connectClient: should connect to client when there is no error', async () => {
    const client = new Client();
    const connector = new Connector(client);
    await connector.connectClient();
    expect(clientMocks.mockConnect).toHaveBeenCalled();
  });

  test('connectClient: should fail to connect when something goes wrong', async () => {
    const client = new Client({ connectErr: errors.connectClient });
    const connector = new Connector(client);
    let error;
    try {
      await connector.connectClient();
    } catch (err) {
      error = err.message;
    }
    expect(clientMocks.mockConnect).toHaveBeenCalled();
    expect(error).toBe(errors.connectClient);
  });
});
