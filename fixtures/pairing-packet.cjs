// Synthetic DNS response with PTR, SRV and A records; no captured user data.
module.exports = function pairingPacket() {
  const encodeName = name => Buffer.concat([...name.split('.').map(label => Buffer.concat([Buffer.from([label.length]), Buffer.from(label)])), Buffer.from([0])]);
  const record = (name, type, data) => {
    const header = Buffer.alloc(10);
    header.writeUInt16BE(type, 0);
    header.writeUInt16BE(1, 2);
    header.writeUInt32BE(120, 4);
    header.writeUInt16BE(data.length, 8);
    return Buffer.concat([encodeName(name), header, data]);
  };
  const instance = 'ADB_WIFI_expected._adb-tls-pairing._tcp.local';
  const header = Buffer.alloc(12);
  header.writeUInt16BE(0x8400, 2);
  header.writeUInt16BE(1, 6);
  header.writeUInt16BE(2, 10);
  const srv = Buffer.alloc(6);
  srv.writeUInt16BE(40123, 4);
  return Buffer.concat([header,
    record('_adb-tls-pairing._tcp.local', 12, encodeName(instance)),
    record(instance, 33, Buffer.concat([srv, encodeName('android-test.local')])),
    record('android-test.local', 1, Buffer.from([192, 168, 1, 8])),
  ]);
};
