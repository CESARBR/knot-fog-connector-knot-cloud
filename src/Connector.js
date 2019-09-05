import Client from '@cesarbr/knot-cloud-websocket';
import _ from 'lodash';

function promisify(client, event, method, ...args) {
  return new Promise((resolve, reject) => {
    method(...args);
    client.once(event, ret => resolve(ret));
    client.once('error', (err) => {
      reject(new Error(err));
    });
  });
}

function mapCloudDeviceToConnectorDevice(device) {
  return {
    id: device.knot.id,
    name: device.metadata.name,
    schema: device.schema,
  };
}

class Connector {
  constructor(settings) {
    this.settings = settings;
    this.client = null;
    this.clientThings = {};
  }

  async start() {
    this.onDataRequestedCb = _.noop();
    this.onDataUpdatedCb = _.noop();
    this.onDisconnectedCb = _.noop();
    this.onReconnectedCb = _.noop();

    await this.connectGateway();
    await this.connectThings();
  }

  async connectGateway() {
    const { uuid, token } = this.settings;
    this.client = await this.createConnection(uuid, token);
    this.listenToConnectionStatus();
  }

  listenToConnectionStatus() {
    this.client.on('reconnect', () => this.onDisconnectedCb());
    this.client.on('ready', () => this.onReconnectedCb());
  }

  async connectThings() {
    const things = await this.listDevices();
    const connections = await Promise.all(things.map(thing => this.setupThingConnection(thing.id)));
    this.clientThings = _.chain(connections)
      .filter(value => value.client)
      .keyBy('id')
      .mapValues(value => value.client)
      .value();
  }

  async setupThingConnection(id) {
    const gatewayClient = await this.createConnection(this.settings.uuid, this.settings.token);
    try {
      const thingClient = await this.resetTokenAndConnect(gatewayClient, id);
      await this.listenToCommands(id, thingClient);
      return { id, client: thingClient };
    } catch (err) {
      return { id };
    } finally {
      gatewayClient.close();
    }
  }

  async resetTokenAndConnect(client, id) {
    const token = await promisify(client, 'created', client.createSessionToken.bind(client), id);
    return this.createConnection(id, token);
  }

  async createConnection(id, token) {
    const client = new Client({
      hostname: this.settings.hostname,
      port: this.settings.port,
      id,
      token,
    });
    await promisify(client, 'ready', client.connect.bind(client));
    return client;
  }

  async listenToCommands(id, client) {
    client.on('command', (cmd) => {
      const { name, args } = cmd.payload;
      switch (name) {
        case 'getData':
          this.onDataRequestedCb(id, args);
          break;
        case 'setData':
          this.onDataUpdatedCb(id, args);
          break;
        default:
          throw Error(`Unrecognized command ${name}`);
      }
    });
  }

  async addDevice(device) {
    const properties = device;
    properties.type = 'knot:thing';
    const newDevice = await promisify(this.client, 'registered', this.client.register.bind(this.client), properties);
    const client = await this.createConnection(
      newDevice.knot.id,
      newDevice.token,
    );
    this.clientThings[newDevice.knot.id] = client;
    this.listenToCommands(newDevice.knot.id, client);
  }

  async authDevice(id, token) {
    try {
      await this.createConnection(id, token);
      return true;
    } catch (err) {
      return false;
    }
  }

  async removeDevice(id) {
    const thingClient = this.clientThings[id];
    thingClient.close();
    delete this.clientThings[id];
    await promisify(this.client, 'unregistered', this.client.unregister.bind(this.client), id);
  }

  async listDevices() {
    const devices = await promisify(this.client, 'devices', this.client.getDevices.bind(this.client), { type: 'knot:thing' });
    return devices.map(mapCloudDeviceToConnectorDevice);
  }

  // Device (fog) to cloud

  async publishData(id, dataList) {
    const client = this.clientThings[id];
    return Promise.all(dataList.map(data => (
      promisify(client, 'published', client.publishData.bind(client), data.sensorId, data.value)
    )));
  }

  async updateSchema(id, schemaList) {
    const thingClient = this.clientThings[id];
    return promisify(thingClient, 'updated', thingClient.updateSchema.bind(thingClient), schemaList);
  }

  // Cloud to device (fog)

  // cb(event) where event is { id, sensorIds }
  async onDataRequested(cb) {
    this.onDataRequestedCb = cb;
  }

  // cb(event) where event is { id, data }
  async onDataUpdated(cb) {
    this.onDataUpdatedCb = cb;
  }

  // Connection callbacks

  async onDisconnected(cb) {
    this.onDisconnectedCb = cb;
  }

  async onReconnected(cb) {
    this.onReconnectedCb = cb;
  }
}

export { Connector }; // eslint-disable-line import/prefer-default-export
