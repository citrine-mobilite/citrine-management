// Device fingerprinting & anti-fraud utility for QR code clocking (Zero LocalStorage)
let memoryDeviceId = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export function getOrCreateDeviceId(): string {
  return memoryDeviceId;
}

export function checkForAntiFraudViolation(
  currentEmployeeId: string,
  presences: any[],
  todayStr: string,
  deviceId: string
): { isFraud: boolean; previousEmpName?: string } {
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
