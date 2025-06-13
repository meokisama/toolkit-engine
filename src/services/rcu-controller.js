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
            reject(new Error(`Command timeout after 5s for ${unitIp}:${port} cmd1=${cmd1} cmd2=${cmd2}`));
        }, 5000);

        client.on('message', (msg, rinfo) => {
            clearTimeout(timeout);
            console.log(`Received response from ${rinfo.address}:${rinfo.port}, length: ${msg.length}`);
            console.log('Response hex:', Array.from(msg).map(b => b.toString(16).padStart(2, '0')).join(' '));

            try {
                processResponse(msg);
                client.close();
                resolve({ msg, rinfo });
            } catch (error) {
                client.close();
                reject(error);
            }
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

            console.log(`Sending command to ${unitIp}:${port}`);
            console.log(`ID: 0x${idAddress.toString(16)}, CMD1: ${cmd1}, CMD2: ${cmd2}, Data: [${data.join(', ')}]`);
            console.log('Full packet hex:', Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join(' '));

            client.send(buffer, 0, buffer.length, port, unitIp, (err) => {
                if (err) {
                    console.error('Send error:', err);
                    clearTimeout(timeout);
                    client.close();
                    reject(err);
                }
            });
        } catch (error) {
            console.error('Command preparation error:', error);
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

// Air Conditioner Commands (cmd1 = 30)
const AC_CMD1 = 30;

// Air Conditioner Command Types
const AC_COMMANDS = {
    GET_AC_STATUS: 13,
    GET_ROOM_TEMP: 21,
    SET_SETTING_ROOM_TEMP: 22,
    GET_SETTING_ROOM_TEMP: 23,
    SET_FAN_MODE: 24,
    GET_FAN_MODE: 25,
    SET_POWER_MODE: 28,
    GET_POWER_MODE: 29,
    SET_OPERATE_MODE: 30,
    GET_OPERATE_MODE: 31,
    SET_ECO_MODE: 32,
    GET_ECO_MODE: 33
};

// Air Conditioner Functions
async function getACStatus(unitIp, canId, group = 1) {
    const idAddress = convertCanIdToInt(canId);

    console.log(`Getting AC status for IP: ${unitIp}, CAN ID: ${canId}, Group: ${group}`);
    console.log(`Converted ID Address: 0x${idAddress.toString(16)}`);

    const response = await sendCommand(unitIp, UDP_PORT, idAddress, AC_CMD1, AC_COMMANDS.GET_AC_STATUS, [group]);

    console.log('AC Status Response:', {
        hasResponse: !!response,
        hasMsg: !!(response && response.msg),
        msgLength: response && response.msg ? response.msg.length : 0,
        msgHex: response && response.msg ? Array.from(response.msg).map(b => b.toString(16).padStart(2, '0')).join(' ') : 'N/A'
    });

    if (response && response.msg) {
        const msgLength = response.msg.length;

        // Check minimum length for basic response
        if (msgLength < 8) {
            throw new Error(`Response too short: ${msgLength} bytes (minimum 8 required)`);
        }

        // Check if we have enough data for AC status (need at least 26 bytes total)
        if (msgLength < 26) {
            console.warn(`AC Status response shorter than expected: ${msgLength} bytes (expected 26+)`);
            // Try to parse what we have
            const data = response.msg.slice(8);
            console.log('Available data bytes:', data.length);
            console.log('Data hex:', Array.from(data).map(b => b.toString(16).padStart(2, '0')).join(' '));

            throw new Error(`Insufficient data in AC status response: ${msgLength} bytes (expected 26+)`);
        }

        const data = response.msg.slice(8); // Skip header
        console.log('Parsed AC data:', Array.from(data).map(b => b.toString(16).padStart(2, '0')).join(' '));

        return {
            group: data[0],
            thermostatStatus: data[1],
            roomTemp: (data[3] * 256 + data[2]) / 10, // Convert to celsius
            occupancyStatus: data[5] * 256 + data[4],
            powerMode: data[7] * 256 + data[6],
            operateMode: data[9] * 256 + data[8],
            occupiedFanSpeed: data[11] * 256 + data[10],
            unoccupiedFanSpeed: data[13] * 256 + data[12],
            settingTemp: (data[15] * 256 + data[14]) / 10, // Convert to celsius
            unoccupiedCoolTemp: (data[17] * 256 + data[16]) / 10,
            unoccupiedHeatTemp: (data[19] * 256 + data[18]) / 10,
            ecoMode: data[21] * 256 + data[20]
        };
    }

    throw new Error('No response received from AC status command');
}

async function getRoomTemp(unitIp, canId, group = 1) {
    const idAddress = convertCanIdToInt(canId);
    const response = await sendCommand(unitIp, UDP_PORT, idAddress, AC_CMD1, AC_COMMANDS.GET_ROOM_TEMP, [group]);

    if (response && response.msg && response.msg.length >= 11) {
        const data = response.msg.slice(8); // Skip header
        const temp = (data[2] * 256 + data[1]) / 10; // Convert to celsius
        return { group: data[0], temperature: temp };
    }

    throw new Error('Invalid response from room temperature command');
}

async function setSettingRoomTemp(unitIp, canId, group = 1, temperature = 25.0) {
    const idAddress = convertCanIdToInt(canId);
    const tempValue = Math.round(temperature * 10); // Convert to protocol format
    const lowByte = tempValue & 0xFF;
    const highByte = (tempValue >> 8) & 0xFF;

    const response = await sendCommand(unitIp, UDP_PORT, idAddress, AC_CMD1, AC_COMMANDS.SET_SETTING_ROOM_TEMP, [group, lowByte, highByte]);

    if (response && response.msg && response.msg.length >= 9) {
        const data = response.msg.slice(8); // Skip header
        return data[0] === 0; // 0 means success
    }

    throw new Error('Failed to set room temperature');
}

async function getSettingRoomTemp(unitIp, canId, group = 1) {
    const idAddress = convertCanIdToInt(canId);
    const response = await sendCommand(unitIp, UDP_PORT, idAddress, AC_CMD1, AC_COMMANDS.GET_SETTING_ROOM_TEMP, [group]);

    if (response && response.msg && response.msg.length >= 11) {
        const data = response.msg.slice(8); // Skip header
        const temp = (data[2] * 256 + data[1]) / 10; // Convert to celsius
        return { group: data[0], temperature: temp };
    }

    throw new Error('Invalid response from setting temperature command');
}

async function setFanMode(unitIp, canId, group = 1, fanSpeed = 0) {
    const idAddress = convertCanIdToInt(canId);
    // fanSpeed: 0=low, 1=medium, 2=high, 3=auto
    const response = await sendCommand(unitIp, UDP_PORT, idAddress, AC_CMD1, AC_COMMANDS.SET_FAN_MODE, [group, fanSpeed, 0]);

    if (response && response.msg && response.msg.length >= 9) {
        const data = response.msg.slice(8); // Skip header
        return data[0] === 0; // 0 means success
    }

    throw new Error('Failed to set fan mode');
}

async function getFanMode(unitIp, canId, group = 1) {
    const idAddress = convertCanIdToInt(canId);
    const response = await sendCommand(unitIp, UDP_PORT, idAddress, AC_CMD1, AC_COMMANDS.GET_FAN_MODE, [group]);

    if (response && response.msg && response.msg.length >= 11) {
        const data = response.msg.slice(8); // Skip header
        return { group: data[0], fanSpeed: data[1] };
    }

    throw new Error('Invalid response from fan mode command');
}

async function setPowerMode(unitIp, canId, group = 1, power = true) {
    const idAddress = convertCanIdToInt(canId);
    const powerValue = power ? 1 : 0;
    const response = await sendCommand(unitIp, UDP_PORT, idAddress, AC_CMD1, AC_COMMANDS.SET_POWER_MODE, [group, powerValue, 0]);

    if (response && response.msg && response.msg.length >= 9) {
        const data = response.msg.slice(8); // Skip header
        return data[0] === 0; // 0 means success
    }

    throw new Error('Failed to set power mode');
}

async function getPowerMode(unitIp, canId, group = 1) {
    const idAddress = convertCanIdToInt(canId);
    const response = await sendCommand(unitIp, UDP_PORT, idAddress, AC_CMD1, AC_COMMANDS.GET_POWER_MODE, [group]);

    if (response && response.msg && response.msg.length >= 11) {
        const data = response.msg.slice(8); // Skip header
        return { group: data[0], power: data[1] === 1 };
    }

    throw new Error('Invalid response from power mode command');
}

async function setOperateMode(unitIp, canId, group = 1, mode = 1) {
    const idAddress = convertCanIdToInt(canId);
    // mode: 1=cool, 2=heat, 3=ventilation/fan
    const response = await sendCommand(unitIp, UDP_PORT, idAddress, AC_CMD1, AC_COMMANDS.SET_OPERATE_MODE, [group, mode, 0]);

    if (response && response.msg && response.msg.length >= 9) {
        const data = response.msg.slice(8); // Skip header
        return data[0] === 0; // 0 means success
    }

    throw new Error('Failed to set operate mode');
}

async function getOperateMode(unitIp, canId, group = 1) {
    const idAddress = convertCanIdToInt(canId);
    const response = await sendCommand(unitIp, UDP_PORT, idAddress, AC_CMD1, AC_COMMANDS.GET_OPERATE_MODE, [group]);

    if (response && response.msg && response.msg.length >= 11) {
        const data = response.msg.slice(8); // Skip header
        return { group: data[0], mode: data[1] };
    }

    throw new Error('Invalid response from operate mode command');
}

async function setEcoMode(unitIp, canId, group = 1, eco = false) {
    const idAddress = convertCanIdToInt(canId);
    const ecoValue = eco ? 1 : 0;
    const response = await sendCommand(unitIp, UDP_PORT, idAddress, AC_CMD1, AC_COMMANDS.SET_ECO_MODE, [group, ecoValue, 0]);

    if (response && response.msg && response.msg.length >= 9) {
        const data = response.msg.slice(8); // Skip header
        return data[0] === 0; // 0 means success
    }

    throw new Error('Failed to set eco mode');
}

async function getEcoMode(unitIp, canId, group = 1) {
    const idAddress = convertCanIdToInt(canId);
    const response = await sendCommand(unitIp, UDP_PORT, idAddress, AC_CMD1, AC_COMMANDS.GET_ECO_MODE, [group]);

    if (response && response.msg && response.msg.length >= 11) {
        const data = response.msg.slice(8); // Skip header
        return { group: data[0], eco: data[1] === 1 };
    }

    throw new Error('Invalid response from eco mode command');
}

export {
    setGroupState,
    setMultipleGroupStates,
    getAllGroupStates,
    getAllOutputStates,
    // Air Conditioner functions
    getACStatus,
    getRoomTemp,
    setSettingRoomTemp,
    getSettingRoomTemp,
    setFanMode,
    getFanMode,
    setPowerMode,
    getPowerMode,
    setOperateMode,
    getOperateMode,
    setEcoMode,
    getEcoMode
};
