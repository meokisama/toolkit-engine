import { CONSTANTS } from '../constants.js';

const { UDP_PORT } = CONSTANTS.UNIT.UDP_CONFIG;

function convertCanIdToInt(canId) {
    if (!canId || typeof canId !== 'string') {
        return 0x00000101;
    }

    const parts = canId.split('.');
    if (parts.length !== 4) {
        return 0x00000101;
    }

    try {
        const byte0 = parseInt(parts[0]) & 0xFF;
        const byte1 = parseInt(parts[1]) & 0xFF;
        const byte2 = parseInt(parts[2]) & 0xFF;
        const byte3 = parseInt(parts[3]) & 0xFF;

        return (byte0 << 24) | (byte1 << 16) | (byte2 << 8) | byte3;
    } catch (error) {
        return 0x00000101;
    }
}

function processResponse(msg) {
    if (msg.length < 10) return;

    const cmd1 = msg[6];

    if (cmd1 & 0x80) {
        throw new Error(`RCU Error: ${msg[8]}`);
    }
}

function calculateCRC(data) {
    let crc = 0;
    for (let i = 0; i < data.length; i++) {
        crc += data[i];
    }
    return crc & 0xFFFF;
}

async function sendCommand(unitIp, port, idAddress, cmd1, cmd2, data = []) {
    return new Promise((resolve, reject) => {
        const dgram = require('dgram');
        const client = dgram.createSocket('udp4');

        const timeout = setTimeout(() => {
            client.close();
            reject(new Error('Command timeout'));
        }, 5000);

        client.on('message', (msg, rinfo) => {
            clearTimeout(timeout);
            processResponse(msg);
            client.close();
            resolve({ msg, rinfo });
        });

        client.on('error', (err) => {
            clearTimeout(timeout);
            client.close();
            reject(err);
        });

        try {
            const idBuffer = Buffer.alloc(4);
            idBuffer.writeUInt32LE(idAddress, 0);

            const len = 2 + 2 + data.length;
            const packetArray = [];

            packetArray.push(len & 0xFF);
            packetArray.push((len >> 8) & 0xFF);
            packetArray.push(cmd1);
            packetArray.push(cmd2);

            for (let i = 0; i < data.length; i++) {
                packetArray.push(data[i]);
            }

            const crc = calculateCRC(packetArray);
            packetArray.push(crc & 0xFF);
            packetArray.push((crc >> 8) & 0xFF);

            const packetBuffer = Buffer.from(packetArray);
            const buffer = Buffer.concat([idBuffer, packetBuffer]);

            client.send(buffer, 0, buffer.length, port, unitIp, (err) => {
                if (err) {
                    clearTimeout(timeout);
                    client.close();
                    reject(err);
                }
            });
        } catch (error) {
            clearTimeout(timeout);
            client.close();
            reject(error);
        }
    });
}

async function setGroupState(unitIp, canId, group, value) {
    if (group < 1 || group > 255) {
        throw new Error('Group number must be between 1 and 255');
    }

    if (value < 0 || value > 255) {
        throw new Error('Value must be between 0 and 255');
    }

    const idAddress = convertCanIdToInt(canId);
    return await sendCommand(unitIp, UDP_PORT, idAddress, 10, 62, [group, value]);
}

async function setMultipleGroupStates(unitIp, canId, groupSettings) {
    if (!Array.isArray(groupSettings) || groupSettings.length === 0) {
        throw new Error('Invalid input. Provide an array of [group, value] pairs');
    }

    const data = [];
    for (let i = 0; i < groupSettings.length; i++) {
        const pair = groupSettings[i];
        if (Array.isArray(pair) && pair.length === 2) {
            const group = pair[0];
            const value = pair[1];

            if (group >= 1 && group <= 255 && value >= 0 && value <= 255) {
                data.push(group);
                data.push(value);
            }
        }
    }

    if (data.length === 0) {
        throw new Error('No valid groups to set');
    }

    const idAddress = convertCanIdToInt(canId);
    return await sendCommand(unitIp, UDP_PORT, idAddress, 10, 62, data);
}

async function getAllGroupStates(unitIp, canId) {
    const idAddress = convertCanIdToInt(canId);
    return await sendCommand(unitIp, UDP_PORT, idAddress, 10, 65, []);
}

async function getAllOutputStates(unitIp, canId) {
    const idAddress = convertCanIdToInt(canId);
    return await sendCommand(unitIp, UDP_PORT, idAddress, 10, 64, []);
}

export { setGroupState, setMultipleGroupStates, getAllGroupStates, getAllOutputStates };
