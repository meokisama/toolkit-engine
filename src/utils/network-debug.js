/**
 * Network Debug Utilities
 * Helper functions to debug network scanning issues
 */

/**
 * Test UDP broadcast functionality
 */
export async function testUDPBroadcast() {
    console.log('[Network Debug] Testing UDP broadcast functionality...');
    
    if (typeof window !== 'undefined' && window.electronAPI) {
        try {
            // Test with different broadcast addresses
            const testConfigs = [
                {
                    name: 'Standard Broadcast',
                    broadcastIP: '255.255.255.255',
                    udpPort: 1234,
                    localPort: 5678,
                    timeout: 3000
                },
                {
                    name: 'Local Subnet Broadcast (192.168.1.x)',
                    broadcastIP: '192.168.1.255',
                    udpPort: 1234,
                    localPort: 5679,
                    timeout: 3000
                },
                {
                    name: 'Local Subnet Broadcast (192.168.0.x)',
                    broadcastIP: '192.168.0.255',
                    udpPort: 1234,
                    localPort: 5680,
                    timeout: 3000
                },
                {
                    name: 'Local Subnet Broadcast (10.0.0.x)',
                    broadcastIP: '10.0.0.255',
                    udpPort: 1234,
                    localPort: 5681,
                    timeout: 3000
                }
            ];

            for (const config of testConfigs) {
                console.log(`[Network Debug] Testing ${config.name}...`);
                try {
                    const results = await window.electronAPI.scanUDPNetwork(config);
                    console.log(`[Network Debug] ${config.name} - Found ${results.length} responses`);
                } catch (error) {
                    console.error(`[Network Debug] ${config.name} - Error:`, error.message);
                }
            }
        } catch (error) {
            console.error('[Network Debug] Test failed:', error);
        }
    } else {
        console.log('[Network Debug] Electron API not available');
    }
}

/**
 * Get system network information
 */
export function getNetworkInfo() {
    console.log('[Network Debug] Getting network information...');
    
    const info = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        onLine: navigator.onLine,
        connection: navigator.connection ? {
            effectiveType: navigator.connection.effectiveType,
            type: navigator.connection.type,
            downlink: navigator.connection.downlink
        } : 'Not available'
    };
    
    console.log('[Network Debug] Browser info:', info);
    return info;
}

/**
 * Test port availability
 */
export async function testPortAvailability() {
    console.log('[Network Debug] Testing port availability...');
    
    if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.testPort) {
        const ports = [1234, 5678, 5679, 5680, 5681];
        
        for (const port of ports) {
            try {
                const available = await window.electronAPI.testPort(port);
                console.log(`[Network Debug] Port ${port}: ${available ? 'Available' : 'In use'}`);
            } catch (error) {
                console.error(`[Network Debug] Port ${port} test failed:`, error.message);
            }
        }
    } else {
        console.log('[Network Debug] Port testing not available');
    }
}

/**
 * Run comprehensive network diagnostics
 */
export async function runNetworkDiagnostics() {
    console.log('[Network Debug] === STARTING NETWORK DIAGNOSTICS ===');
    
    // Get basic network info
    getNetworkInfo();
    
    // Test UDP broadcast
    await testUDPBroadcast();
    
    // Test port availability
    await testPortAvailability();
    
    console.log('[Network Debug] === NETWORK DIAGNOSTICS COMPLETED ===');
}

/**
 * Export debug functions to window for console access
 */
if (typeof window !== 'undefined') {
    window.networkDebug = {
        testUDPBroadcast,
        getNetworkInfo,
        testPortAvailability,
        runNetworkDiagnostics
    };
    
    console.log('[Network Debug] Debug functions available at window.networkDebug');
    console.log('[Network Debug] Available functions:');
    console.log('[Network Debug] - window.networkDebug.testUDPBroadcast()');
    console.log('[Network Debug] - window.networkDebug.getNetworkInfo()');
    console.log('[Network Debug] - window.networkDebug.testPortAvailability()');
    console.log('[Network Debug] - window.networkDebug.runNetworkDiagnostics()');
}
