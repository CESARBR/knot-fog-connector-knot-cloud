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

    this.devices = [];
  }

  async start() {
    await this.connectClient();
    await this.listenToCommands();
  }

  async connectClient() {
    this.client = await this.createConnection();
  }

  async createConnection() {
    const client = new Client(this.settings);
    await client.connect();
    return client;
  }

  async listenToCommands() {
    const { devices = [] } = await this.client.getDevices();
    this.devices = devices
      .filter((device) => !!device.schema)
      .map((device) => device.id);

    await Promise.all(this.devices.map((device) => this.registerListeners(device)));
  }

  async registerListeners(thingId) {
    await this.client.on(`device.${thingId}.data.request`, async (msg) => {
      const { id, sensorIds } = msg;
      this.onDataRequestedCb(id, sensorIds);
    });

    await this.client.on(`device.${thingId}.data.update`, async (msg) => {
      const { id, data } = msg;
      this.onDataUpdatedCb(id, data);
    });
  }

  async clearListeners(thingId) {
    await this.client.unsubscribe(`device.${thingId}.data.request`);
    await this.client.unsubscribe(`device.${thingId}.data.update`);
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
    if (this.devices.includes(id)) {
      await this.clearListeners(id);
      this.devices.splice(this.devices.findIndex((device) => device === id));
    }
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
    if (!this.devices.includes(id)) {
      await this.registerListeners(id);
      this.devices.push(id);
    }
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
