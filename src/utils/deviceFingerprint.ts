// Device fingerprinting & anti-fraud utility for QR code clocking
export function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem('processflow_device_id');
  if (!deviceId) {
    deviceId = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('processflow_device_id', deviceId);
  }
  return deviceId;
}

export function checkForAntiFraudViolation(
  currentEmployeeId: string,
  presences: any[],
  todayStr: string,
  deviceId: string
): { isFraud: boolean; previousEmpName?: string } {
  // Find if another employee used this exact device ID today
  const existingRecordForOtherEmp = presences.find(
    (p) =>
      p.date === todayStr &&
      p.employeeId !== currentEmployeeId &&
      (p.deviceId === deviceId ||
        p.clockingMethod === 'qr_code_mobile' ||
        (p.clockLocations &&
          Object.values(p.clockLocations).some(
            (loc: any) => loc?.deviceId === deviceId
          )))
  );

  if (existingRecordForOtherEmp) {
    return {
      isFraud: true,
      previousEmpName: existingRecordForOtherEmp.employeeId
    };
  }

  return { isFraud: false };
}
