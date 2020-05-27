import Client, * as clientMocks from '@cesarbr/knot-cloud-sdk-js-amqp';
import Connector from './Connector';

jest.mock('@cesarbr/knot-cloud-sdk-js-amqp');

const mockThing = {
  id: 'abcdef1234568790',
  name: 'my-device',
  schema: [
    {
      sensorId: 0,
      typeId: 65521,
      valueType: 3,
      unit: 0,
      name: 'bool-sensor',
    },
  ],
};
const mockToken = 'authentication-token';
const events = {
  request: `device.${mockThing.id}.data.request`,
  update: `device.${mockThing.id}.data.update`,
};

const errors = {
  connectClient: 'fail to connect to AMQP channel',
  listenToCommands: 'fail to list registered things from cloud',
  registerListeners: 'fail to subscribe on AMQP channel',
  addDevice: 'fail to create thing on cloud',
  removeDevice: 'fail to remove thing from cloud',
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

  test('listenToCommands: should start listeners on registered devices when there is no error', async () => {
    const registeredDevices = [mockThing];
    const client = new Client({ registeredDevices });
    const connector = new Connector(client);
    await connector.listenToCommands();
    expect(connector.devices).toEqual([mockThing.id]);
    expect(clientMocks.mockGetDevices).toHaveBeenCalled();
    expect(clientMocks.mockOn).toHaveBeenCalledTimes(
      registeredDevices.length * 2
    );
  });

  test('listenToCommands: should fail to subscribe on commands when unable to get things from cloud', async () => {
    const client = new Client({ getDevicesErr: errors.listenToCommands });
    const connector = new Connector(client);
    let error;
    try {
      await connector.listenToCommands();
    } catch (err) {
      error = err.message;
    }
    expect(error).toBe(errors.listenToCommands);
  });

  test('registerListeners: should register listeners when there is no error while subscribing consumers', async () => {
    const client = new Client();
    const connector = new Connector(client);
    await connector.registerListeners(mockThing.id);
    expect(clientMocks.mockOn).toHaveBeenCalledWith(
      events.request,
      client.getHandler(events.request)
    );
    expect(clientMocks.mockOn).toHaveBeenCalledWith(
      events.update,
      client.getHandler(events.update)
    );
  });

  test('registerListeners: should fail to subscribe handler when something goes wrong', async () => {
    const client = new Client({ onErr: errors.registerListeners });
    const connector = new Connector(client);
    let error;
    try {
      await connector.registerListeners(mockThing.id);
    } catch (err) {
      error = err.message;
    }
    expect(error).toBe(errors.registerListeners);
  });

  test('addDevice: should register a new device when connection is ok', async () => {
    const client = new Client();
    const connector = new Connector(client, mockToken);
    const response = await connector.addDevice({
      id: mockThing.id,
      name: mockThing.name,
    });
    expect(clientMocks.mockRegister).toHaveBeenCalled();
    expect(response).toMatchObject({ id: mockThing.id, token: mockToken });
  });

  test('addDevice: should fail to add a new thing when something goes wrong', async () => {
    const client = new Client({ registerErr: errors.addDevice });
    const connector = new Connector(client);
    let error;
    try {
      await connector.addDevice({ id: mockThing.id, name: mockThing.name });
    } catch (err) {
      error = err.message;
    }
    expect(error).toBe(errors.addDevice);
  });

  test('removeDevice: should unregister a device when connection is ok', async () => {
    const client = new Client();
    const connector = new Connector(client);
    await connector.removeDevice(mockThing.id);
    expect(clientMocks.mockUnregister).toHaveBeenCalled();
  });

  test('removeDevice: should unsubscribe listeners when the device was registered', async () => {
    const client = new Client();
    const connector = new Connector(client);
    connector.devices.push(mockThing.id);
    await connector.removeDevice(mockThing.id);
    expect(connector.devices).toEqual([]);
    expect(clientMocks.mockUnsubscribe).toHaveBeenCalledTimes(2);
  });

  test('removeDevice: should fail to remove a thing when something goes wrong', async () => {
    const client = new Client({ unregisterErr: errors.removeDevice });
    const connector = new Connector(client);
    let error;
    try {
      await connector.removeDevice(mockThing.id);
    } catch (err) {
      error = err.message;
    }
    expect(error).toBe(errors.removeDevice);
  });
});
