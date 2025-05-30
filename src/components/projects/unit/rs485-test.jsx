import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RS485ConfigDialog } from "./rs485-config-dialog";
import { CONSTANTS } from "@/constants";

const { RS485 } = CONSTANTS;

// Create default RS485 configuration for testing
const createDefaultRS485Config = () => ({
  baudrate: 9600,
  parity: 0,
  stop_bit: 0,
  board_id: 1,
  config_type: 0,
  num_slave_devs: 0,
  reserved: [0, 0, 0, 0, 0],
  slave_cfg: Array.from({ length: RS485.SLAVE_MAX_DEVS }, () => ({
    slave_id: 1,
    slave_group: 0,
    num_indoors: 0,
    indoor_group: Array.from({ length: RS485.SLAVE_MAX_INDOORS }, () => 0)
  }))
});

export function RS485Test() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [config, setConfig] = useState([
    createDefaultRS485Config(),
    createDefaultRS485Config()
  ]);

  const handleConfigSave = (newConfig) => {
    setConfig(newConfig);
    console.log("RS485 Config saved:", newConfig);
  };

  const getConfigSummary = (cfg) => {
    const type = RS485.TYPES.find(t => t.value === cfg.config_type);
    const baudrate = cfg.baudrate;
    const parity = RS485.PARITY.find(p => p.value === cfg.parity);
    const stopBit = RS485.STOP_BITS.find(s => s.value === cfg.stop_bit);
    
    return {
      type: type?.label || "Unknown",
      baudrate,
      parity: parity?.label || "Unknown",
      stopBit: stopBit?.label || "Unknown",
      boardId: cfg.board_id,
      numSlaves: cfg.num_slave_devs
    };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">RS485 Configuration Test</h1>
        <Button onClick={() => setDialogOpen(true)}>
          Open RS485 Config
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {config.map((cfg, index) => {
          const summary = getConfigSummary(cfg);
          return (
            <Card key={index}>
              <CardHeader>
                <CardTitle>RS485-{index + 1} Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Type:</strong> {summary.type}</div>
                  <div><strong>Baudrate:</strong> {summary.baudrate}</div>
                  <div><strong>Parity:</strong> {summary.parity}</div>
                  <div><strong>Stop Bit:</strong> {summary.stopBit}</div>
                  <div><strong>Board ID:</strong> {summary.boardId}</div>
                  <div><strong>Num Slaves:</strong> {summary.numSlaves}</div>
                </div>
                
                {cfg.num_slave_devs > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Slave Devices:</h4>
                    <div className="space-y-1">
                      {cfg.slave_cfg.slice(0, cfg.num_slave_devs).map((slave, slaveIndex) => (
                        <div key={slaveIndex} className="text-xs bg-gray-50 p-2 rounded">
                          <div>Slave {slaveIndex + 1}: ID={slave.slave_id}, Group={slave.slave_group}, Indoors={slave.num_indoors}</div>
                          {slave.num_indoors > 0 && (
                            <div className="mt-1">
                              Indoor Groups: [{slave.indoor_group.slice(0, slave.num_indoors).join(', ')}]
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Raw Configuration Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(config, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <RS485ConfigDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        config={config}
        onSave={handleConfigSave}
      />
    </div>
  );
}
