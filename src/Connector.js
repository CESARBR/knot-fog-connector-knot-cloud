import Client from '@cesarbr/knot-cloud-sdk-js-amqp';
import _ from 'lodash';

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

  async addDevice({ id, name }) {
    await this.client.register(id, name);
    return { id, token: this.settings.token };
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
    return this.client.publishData(id, dataList);
  }

  async updateSchema(id, schemaList) {
    return this.client.updateSchema(id, schemaList);
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
