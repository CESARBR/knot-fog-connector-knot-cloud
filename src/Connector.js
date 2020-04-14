import Client from '@cesarbr/knot-cloud-sdk-js-amqp';
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
    id: device.id,
    name: device.name,
    schema: device.schema,
  };
}

class Connector {
  constructor(settings) {
    this.settings = settings;
    this.client = null;
    this.clientThings = {};

    this.onDataRequestedCb = _.noop();
    this.onDataUpdatedCb = _.noop();
    this.onDeviceUnregisteredCb = _.noop();
    this.onDisconnectedCb = _.noop();
    this.onReconnectedCb = _.noop();
  }

  async start() {
    await this.connectClient();
    await this.listenToCommands();
  }

  async connectClient() {
    this.client = await this.createConnection();
    this.listenToConnectionStatus();
  }

  async createConnection() {
    const client = new Client(this.settings);
    await client.connect();
    return client;
  }

  listenToConnectionStatus() {
    this.client.on('close', () => this.onDisconnectedCb());
    this.client.on('connect', () => this.onReconnectedCb());
  }

  async listenToCommands() {
    await this.client.on('getData', async (cmd) => {
      const { id, sensorIds } = cmd;
      this.onDataRequestedCb(id, sensorIds);
    });

    await this.client.on('setData', async (cmd) => {
      const { id, data } = cmd;
      this.onDataUpdatedCb(id, data);
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
    this.listenToCommands();
    return { id: newDevice.knot.id, token: newDevice.token };
  }

  // eslint-disable-next-line no-unused-vars
  async authDevice(id, token) {
    const devices = await this.listDevices();
    return !!devices.find((device) => device.id === id);
  }

  async removeDevice(id) {
    await this.client.unregister(id);
  }

  async listDevices() {
    const { devices } = await this.client.getDevices();
    return devices.map(mapCloudDeviceToConnectorDevice) || [];
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

  // cb(event) where event is { id }
  async onDeviceUnregistered(cb) {
    this.onDeviceUnregisteredCb = cb;
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
