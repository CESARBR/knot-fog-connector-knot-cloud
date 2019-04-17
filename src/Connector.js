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

  listenToConnectionStatus(client) {
    client.on('reconnect', () => this.onDisconnectedCb());
    client.on('ready', () => this.onReconnectedCb());
  }

  async resetTokenAndConnect(id) {
    const client = await this.createConnection(this.settings.uuid, this.settings.token);
    let token;
    try {
      token = await promisify(client, 'created', client.createSessionToken.bind(client), id);
    } finally {
      client.close();
    }

    const thingClient = await this.createConnection(id, token);
    await this.listenToCommands(id, thingClient);

    return { id, client: thingClient };
  }

  async start() {
    const { uuid, token } = this.settings;
    this.onDataRequestedCb = _.noop();
    this.onDataUpdatedCb = _.noop();
    this.onDisconnectedCb = _.noop();
    this.onReconnectedCb = _.noop();
    this.client = await this.createConnection(uuid, token);
    this.listenToConnectionStatus(this.client);
    const devices = await this.listDevices();
    const clients = await Promise.all(devices.map(device => (
      this.resetTokenAndConnect(device.id)
    )));

    this.clientThings = _.chain(clients)
      .keyBy('id')
      .mapValues(value => value.client)
      .value();
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
