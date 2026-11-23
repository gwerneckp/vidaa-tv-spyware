// TLS relay for HamService's MQTT: terminate TLS with our cert, forward to the real broker,
// log every MQTT packet (both directions) to /tmp/mitm/. Credentials are logged only as lengths.
const tls = require('tls'), fs = require('fs');
const D = '/tmp/mitm';
const log = (m) => fs.appendFileSync(D + '/relay.log', new Date().toISOString() + ' ' + m + '\n');
const TYPES = ['?', 'CONNECT', 'CONNACK', 'PUBLISH', 'PUBACK', 'PUBREC', 'PUBREL', 'PUBCOMP', 'SUBSCRIBE', 'SUBACK', 'UNSUBSCRIBE', 'UNSUBACK', 'PINGREQ', 'PINGRESP', 'DISCONNECT', 'AUTH'];
let n = 0;
function parser(dir, conn) {
  let buf = Buffer.alloc(0);
  return (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    for (;;) {
      if (buf.length < 2) return;
      let mult = 1, len = 0, i = 1, b;
      do { if (i >= buf.length) return; b = buf[i++]; len += (b & 127) * mult; mult *= 128; } while (b & 128);
      if (buf.length < i + len) return;
      const type = buf[0] >> 4, flags = buf[0] & 15, body = buf.slice(i, i + len);
      buf = buf.slice(i + len);
      const id = String(++n).padStart(5, '0');
      if (type === 3) {
        const tl = body.readUInt16BE(0), topic = body.slice(2, 2 + tl).toString();
        const qos = (flags >> 1) & 3, start = 2 + tl + (qos ? 2 : 0);
        const payload = body.slice(start);
        fs.writeFileSync(`${D}/${id}-${dir}-publish.bin`, payload);
        log(`${conn} ${dir} PUBLISH qos=${qos} topic=${topic} payload=${payload.length}B file=${id}-${dir}-publish.bin`);
      } else if (type === 1) {
        // CONNECT: record structure but not secret values
        let p = 0; const pl = body.readUInt16BE(p); p += 2 + pl; const ver = body[p++]; const cf = body[p++]; p += 2;
        if (ver === 5) { let m = 1, l = 0, x; do { x = body[p++]; l += (x & 127) * m; m *= 128; } while (x & 128); p += l; }
        const cl = body.readUInt16BE(p); const cid = body.slice(p + 2, p + 2 + cl).toString(); p += 2 + cl;
        let rest = `clientIdLen=${cl}`;
        if (cf & 0x80) { const ul = body.readUInt16BE(p + (cf & 4 ? 0 : 0)); rest += ` username=yes(len ${ul})`; }
        if (cf & 0x40) rest += ' password=yes';
        fs.writeFileSync(`${D}/${id}-${dir}-connect-clientid.txt`, cid);
        log(`${conn} ${dir} CONNECT mqtt-v${ver} flags=0x${cf.toString(16)} ${rest}`);
      } else {
        fs.writeFileSync(`${D}/${id}-${dir}-${TYPES[type].toLowerCase()}.bin`, body);
        log(`${conn} ${dir} ${TYPES[type]} len=${body.length}`);
      }
    }
  };
}
let c = 0;
const ca = fs.readFileSync('/APPS/pkgs/tv.vidaa.phony.keystore/current/common/cacerts.pem');
tls.createServer({ key: fs.readFileSync(D + '/leaf.key'), cert: fs.readFileSync(D + '/leaf.pem') }, (cli) => {
  const conn = 'c' + (++c), host = cli.servername;
  log(`${conn} accepted, SNI=${host}`);
  const up = tls.connect({ host, port: 8883, servername: host, ca }, () => log(`${conn} upstream connected to ${host} (${up.remoteAddress}), verified=${up.authorized}`));
  const fromTv = parser('tv2nx', conn), fromNx = parser('nx2tv', conn);
  cli.on('data', (d) => { fromTv(d); up.write(d); });
  up.on('data', (d) => { fromNx(d); cli.write(d); });
  const end = (w) => (e) => { log(`${conn} ${w} closed ${e ? e.message : ''}`); cli.destroy(); up.destroy(); };
  cli.on('error', end('tv')); up.on('error', end('nexxen')); cli.on('close', end('tv')); up.on('close', end('nexxen'));
}).on('tlsClientError', (e) => log('tls client error: ' + e.message)).listen(18883, '127.0.0.1', () => log('relay listening'));
setTimeout(() => { log('relay timeout exit'); process.exit(0); }, 240000);
