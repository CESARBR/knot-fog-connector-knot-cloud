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

async function loadDevices(client) {
  const devices = await promisify(client, 'devices', client.getDevices.bind(client), { type: 'thing' });
  return Promise.all(devices.map(async device => ({
    id: device.id,
    token: await promisify(client, 'created', client.createSessionToken.bind(client), device.uuid),
  })));
}

class Connector {
  constructor(settings) {
    this.settings = settings;
    this.client = new Client({
      hostname: settings.hostname,
      port: settings.port,
      id: settings.uuid,
      token: settings.token,
    });

    this.things = [];
  }

  async start() {
    await promisify(this.client, 'ready', this.client.connect.bind(this.client));
    this.things = await loadDevices(this.client);
  }

  async addDevice(device) {
    const properties = device;
    properties.type = 'thing';
    const newDevice = await promisify(this.client, 'registered', this.client.register.bind(this.client), properties);
    this.things.push({
      id: newDevice.id,
      token: await promisify(this.client, 'created', this.client.createSessionToken.bind(this.client), newDevice.uuid),
    });
    return newDevice;
  }

  async removeDevice(id) {
    const index = this.things.indexOf(this.things.find(device => device.id === id));
    if (index > -1) {
      this.things.splice(index, 1);
    }
    return promisify(this.client, 'unregistered', this.client.unregister.bind(this.client), id);
  }

  async listDevices() {
    return promisify(this.client, 'devices', this.client.getDevices.bind(this.client), { type: 'thing' });
  }

  // Device (fog) to cloud

  async publishData(id, dataList) { // eslint-disable-line no-empty-function, no-unused-vars
  }

  async updateSchema(id, schemaList) {
    const thing = this.things.find(device => device.id === id);
    const thingClient = new Client({
      hostname: this.settings.hostname,
      port: this.settings.port,
      id: thing.id,
      token: thing.token,
    });

    await promisify(thingClient, 'ready', thingClient.connect.bind(thingClient));
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
  async onDataRequested(cb) { // eslint-disable-line no-empty-function, no-unused-vars
  }

  // cb(event) where event is { id, sensorId, data }
  async onDataUpdated(cb) { // eslint-disable-line no-empty-function, no-unused-vars
  }
}

export { Connector }; // eslint-disable-line import/prefer-default-export
