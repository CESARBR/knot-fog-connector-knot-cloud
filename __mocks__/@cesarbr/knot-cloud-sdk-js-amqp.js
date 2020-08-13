export const mockConnect = jest.fn();
export const mockRegister = jest.fn();
export const mockUnregister = jest.fn();
export const mockUpdateSchema = jest.fn();
export const mockUpdateConfig = jest.fn();
export const mockGetDevices = jest.fn();
export const mockPublishData = jest.fn();
export const mockOn = jest.fn();
export const mockUnsubscribe = jest.fn();

export default jest.fn().mockImplementation((options = {}) => {
  const handlers = {};

  if (options.connectErr) {
    mockConnect.mockRejectedValue(Error(options.connectErr));
  } else {
    mockConnect.mockResolvedValue();
  }

  if (options.registerErr) {
    mockRegister.mockRejectedValue(Error(options.registerErr));
  } else {
    mockRegister.mockResolvedValue();
  }

  if (options.unregisterErr) {
    mockUnregister.mockRejectedValue(Error(options.unregisterErr));
  } else {
    mockUnregister.mockResolvedValue();
  }

  if (options.updateSchemaErr) {
    mockUpdateSchema.mockRejectedValue(Error(options.updateSchemaErr));
  } else {
    mockUpdateSchema.mockResolvedValue();
  }

  if (options.updateConfigErr) {
    mockUpdateConfig.mockRejectedValue(Error(options.updateConfigErr));
  } else {
    mockUpdateConfig.mockResolvedValue();
  }

  if (options.getDevicesErr) {
    mockGetDevices.mockRejectedValue(Error(options.getDevicesErr));
  } else {
    mockGetDevices.mockResolvedValue({ devices: options.registeredDevices });
  }

  if (options.publishDataErr) {
    mockPublishData.mockRejectedValue(Error(options.publishDataErr));
  } else {
    mockPublishData.mockResolvedValue();
  }

  mockOn.mockImplementation(async (event, callback) => {
    if (options.onErr) {
      throw Error(options.onErr);
    }
    handlers[event] = callback;
  });

  mockUnsubscribe.mockImplementation(async (event) => {
    if (options.unsubscribeErr) {
      throw Error(options.unsubscribeErr);
    }
    delete handlers[event];
  });

  const getHandler = (event) => {
    return handlers[event] || (() => {});
  };

  const executeHandler = (event) => {
    getHandler(event)({});
  };

  return {
    connect: mockConnect,
    register: mockRegister,
    unregister: mockUnregister,
    updateSchema: mockUpdateSchema,
    updateConfig: mockUpdateConfig,
    getDevices: mockGetDevices,
    publishData: mockPublishData,
    on: mockOn,
    unsubscribe: mockUnsubscribe,
    getHandler,
    executeHandler,
  };
});
