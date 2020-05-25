import _ from 'lodash';

class Connector {
  constructor(client, token) {
    this.client = client;
    this.token = token;

    this.onDataRequestedCb = _.noop();
    this.onDataUpdatedCb = _.noop();
    this.onDisconnectedCb = _.noop();
    this.onReconnectedCb = _.noop();

    this.devices = [];
  }

  async start() {
    await this.connectClient();
    await this.listenToCommands();
  }

  async connectClient() {
    await this.client.connect();
  }

  async listenToCommands() {
    const { devices = [] } = await this.client.getDevices();
    this.devices = devices
      .filter((device) => !!device.schema)
      .map((device) => device.id);

    await Promise.all(
      this.devices.map((device) => this.registerListeners(device))
    );
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

  // Device (fog) to cloud

  async addDevice({ id, name }) {
    await this.client.register(id, name);
    return { id, token: this.token };
  }

  async removeDevice(id) {
    if (this.devices.includes(id)) {
      await this.clearListeners(id);
      this.devices.splice(this.devices.findIndex((device) => device === id));
    }
    await this.client.unregister(id);
  }

  async updateSchema(id, schemaList) {
    if (!this.devices.includes(id)) {
      await this.registerListeners(id);
      this.devices.push(id);
    }
    return this.client.updateSchema(id, schemaList);
  }

  async publishData(id, dataList) {
    return this.client.publishData(id, dataList);
  }

  // Cloud to device (fog)

  // cb(id, sensorIds)
  async onDataRequested(cb) {
    this.onDataRequestedCb = cb;
  }

  // cb(id, data)
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

export default Connector;
