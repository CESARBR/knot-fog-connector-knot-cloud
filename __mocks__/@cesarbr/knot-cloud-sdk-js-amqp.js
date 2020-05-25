export const mockConnect = jest.fn();
export const mockRegister = jest.fn();
export const mockUnregister = jest.fn();
export const mockUpdateSchema = jest.fn();
export const mockGetDevices = jest.fn();
export const mockPublishData = jest.fn();
export const mockOn = jest.fn();
export const mockUnsubscribe = jest.fn();

export default jest.fn().mockImplementation((options = {}) => {
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

  if (options.onErr) {
    mockOn.mockRejectedValue(Error(options.onErr));
  } else {
    mockOn.mockResolvedValue();
  }

  if (options.unsubscribeErr) {
    mockUnsubscribe.mockRejectedValue(Error(options.unsubscribeErr));
  } else {
    mockUnsubscribe.mockResolvedValue();
  }

  return {
    connect: mockConnect,
    register: mockRegister,
    unregister: mockUnregister,
    updateSchema: mockUpdateSchema,
    getDevices: mockGetDevices,
    publishData: mockPublishData,
    on: mockOn,
    unsubscribe: mockUnsubscribe,
  };
});
