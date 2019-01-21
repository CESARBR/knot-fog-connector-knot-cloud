import Client from '@cesarbr/knot-cloud-websocket';

class Connector {
  constructor(settings) {
    const {
      hostname, port, uuid, token,
    } = settings;
    this.client = new Client({
      hostname, port, uuid, token,
    });
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.client.connect();
      this.client.once('ready', () => resolve());
      this.client.once('error', () => {
        reject(new Error('Connection not established.'));
      });
    });
  }

  async addDevice(device) { // eslint-disable-line no-empty-function, no-unused-vars
  }

  async removeDevice(id) { // eslint-disable-line no-empty-function, no-unused-vars
  }

  async listDevices() { // eslint-disable-line no-empty-function
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
