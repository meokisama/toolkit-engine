import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ComparisonDifferencesDialog } from '@/components/projects/unit/comparison-differences-dialog';
import { runConfigComparisonTests } from '@/test-config-comparison';

/**
 * Test component for config comparison functionality
 */
export function ConfigComparisonTest() {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Mock comparison summary for testing dialog
  const mockComparisonSummary = {
    totalMatches: 3,
    identicalCount: 1,
    differentCount: 1,
    errorCount: 1,
    allDifferences: [
      {
        unitInfo: "RCU-16A (192.168.1.100)",
        differences: [
          "RS485 CH1 Slave 1 Indoor Group[3]: DB=4, Network=5",
          "Input 1 RLC Ramp: DB=10, Network=15",
          "Input 2 Function Value: DB=2, Network=3",
          "Output 1 AC Occupy Mode: DB=1, Network=2",
          "Output 1 AC Occupy Fan Speed: DB=2, Network=3",
          "Output 1 AC Occupy Cool Set Point: DB=24, Network=23"
        ]
      }
    ],
    identicalUnits: [
      {
        databaseUnit: { type: 'RCU-8A', ip_address: '192.168.1.101' },
        networkUnit: { type: 'RCU-8A', ip_address: '192.168.1.101' },
        isEqual: true,
        differences: []
      }
    ],
    differentUnits: [
      {
        databaseUnit: { type: 'RCU-16A', ip_address: '192.168.1.100' },
        networkUnit: { type: 'RCU-16A', ip_address: '192.168.1.100' },
        isEqual: false,
        differences: [
          "RS485 CH1 Slave 1 Indoor Group[3]: DB=4, Network=5",
          "Input 1 RLC Ramp: DB=10, Network=15",
          "Input 2 Function Value: DB=2, Network=3",
          "Output 1 AC Occupy Mode: DB=1, Network=2",
          "Output 1 AC Occupy Fan Speed: DB=2, Network=3",
          "Output 1 AC Occupy Cool Set Point: DB=24, Network=23"
        ]
      }
    ],
    errorUnits: [
      {
        databaseUnit: { type: 'RCU-4A', ip_address: '192.168.1.102' },
        networkUnit: { type: 'RCU-4A', ip_address: '192.168.1.102' },
        isEqual: false,
        error: true,
        differences: ["Failed to read configurations: Network timeout"]
      }
    ]
  };

  const handleRunTests = () => {
    try {
      runConfigComparisonTests();
      console.log('✅ All tests completed successfully!');
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  };

  const handleShowDialog = () => {
    setDialogOpen(true);
  };

  return (
    <>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Config Comparison Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Test the config comparison functionality and dialog.
            </p>

            <div className="space-y-2">
              <Button onClick={handleRunTests} className="w-full">
                Run Config Comparison Tests
              </Button>

              <Button onClick={handleShowDialog} className="w-full" variant="secondary">
                Show Differences Dialog (Demo)
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              <p><strong>Tests include:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>RS485 configuration comparison</li>
                <li>Input configuration comparison</li>
                <li>Aircon output configuration comparison</li>
                <li>Unit matching logic</li>
                <li>Differences dialog display</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <ComparisonDifferencesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        comparisonSummary={mockComparisonSummary}
      />
    </>
  );
}
