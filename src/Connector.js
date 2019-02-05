import Client from '@cesarbr/knot-cloud-websocket';

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

  async createConnection(uuid, token) {
    const client = new Client({
      hostname: this.settings.hostname,
      port:  this.settings.port,
      uuid:  uuid,
      token: token,
    });
    await promisify(client, 'ready', client.connect.bind(client));
    return client;
  }

  async start() {
    this.client = await this.createConnection(this.settings.uuid, this.settings.token);
    const devices = await this.listDevices();

    for (const device of devices) {
      const tmpClient = await this.createConnection(this.settings.uuid, this.settings.token);
      const token = await promisify(tmpClient, 'created', tmpClient.createSessionToken.bind(tmpClient), device.uuid);
      this.clientThings[device.id] = await this.createConnection(device.uuid, token);
      tmpClient.close();
    }
  }

  async addDevice(device) {
    const properties = device;
    properties.type = 'thing';
    const newDevice = await promisify(this.client, 'registered', this.client.register.bind(this.client), properties);
    this.clientThings[newDevice.id] = await this.createConnection(newDevice.uuid, newDevice.token);
    return newDevice;
  }

  async removeDevice(id) { // eslint-disable-line no-empty-function, no-unused-vars
  }

  async listDevices() {
    return promisify(this.client, 'devices', this.client.getDevices.bind(this.client), { type: 'thing' });
  }

  // Device (fog) to cloud

  async publishData(id, dataList) { // eslint-disable-line no-empty-function, no-unused-vars
  }

  async updateSchema(id, schemaList) { // eslint-disable-line no-empty-function, no-unused-vars
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
  async onDataRequested(cb) { // eslint-disable-line no-empty-function, no-unused-vars
  }

  // cb(event) where event is { id, sensorId, data }
  async onDataUpdated(cb) { // eslint-disable-line no-empty-function, no-unused-vars
  }
}

export { Connector }; // eslint-disable-line import/prefer-default-export
