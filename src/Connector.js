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

  async resetTokenAndConnect(device) {
    const client = await this.createConnection(this.settings.uuid, this.settings.token);
    let token;
    try {
      token = await promisify(client, 'created', client.createSessionToken.bind(client), device.knot.id);
    } finally {
      client.close();
    }

    const thingClient = await this.createConnection(device.knot.id, token);
    await this.listenToCommands(device.knot.id, thingClient);

    return { id: device.knot.id, client: thingClient };
  }

  async start() {
    const { uuid, token } = this.settings;
    this.onDataRequestedCb = _.noop();
    this.onDataUpdatedCb = _.noop();
    this.client = await this.createConnection(uuid, token);
    const devices = await this.listDevices();
    const clients = await Promise.all(devices.map(device => (
      this.resetTokenAndConnect(device)
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
    this.clientThings[newDevice.knot.id] = await this.createConnection(
      newDevice.knot.id,
      newDevice.token,
    );
    return newDevice;
  }

  async removeDevice(id) {
    const thingClient = this.clientThings[id];
    thingClient.close();
    delete this.clientThings[id];
    await promisify(this.client, 'unregistered', this.client.unregister.bind(this.client), id);
  }

  async listDevices() {
    return promisify(this.client, 'devices', this.client.getDevices.bind(this.client), { type: 'knot:thing' });
  }

  // Device (fog) to cloud

  async publishData(id, dataList) {
    const client = this.clientThings[id];
    return Promise.all(dataList.map(data => (
      promisify(client, 'data', client.publishData.bind(client), data.sensorId, data.value)
    )));
  }

  async updateSchema(id, schemaList) {
    const thingClient = this.clientThings[id];
    return promisify(thingClient, 'schema', thingClient.updateSchema.bind(thingClient), schemaList);
  }

  async updateProperties(id, properties) { // eslint-disable-line no-empty-function, no-unused-vars
  }

  // Cloud to device (fog)

  // cb(event) where event is { id, config: [{}] }
  async onConfigUpdated(cb) { // eslint-disable-line no-empty-function, no-unused-vars
  }

  // cb(event) where event is { id, properties: {} }
  async onPropertiesUpdated(cb) { // eslint-disable-line no-empty-function, no-unused-vars
  }

  // cb(event) where event is { id, sensorId }
  async onDataRequested(cb) {
    this.onDataRequestedCb = cb;
  }

  // cb(event) where event is { id, sensorId, data }
  async onDataUpdated(cb) {
    this.onDataUpdatedCb = cb;
  }
}

export { Connector }; // eslint-disable-line import/prefer-default-export
