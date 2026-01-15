import { useState, useEffect } from "react";
import { toast } from "sonner";
import { DALI_DEVICE_COUNT } from "../utils/constants";
import log from "electron-log/renderer";

/**
 * Custom hook to load and manage DALI devices for a project
 * @param {object} selectedProject - The selected project
 * @param {boolean} isActive - Whether the tab is active
 * @returns {object} { devices, setDevices, loading }
 */
export function useDaliDevices(selectedProject, isActive) {
  const [devices, setDevices] = useState(() =>
    Array.from({ length: DALI_DEVICE_COUNT }, (_, i) => ({
      id: i,
      address: i,
      name: null,
      type: null,
      colorFeature: null,
      index: null,
    }))
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedProject || !isActive) return;

    const loadDevices = async () => {
      try {
        setLoading(true);
        const dbDevices = await window.electronAPI.dali.getAllDaliDevices(selectedProject.id);

        setDevices((prev) =>
          prev.map((device) => {
            const dbDevice = dbDevices.find((d) => d.address === device.address);
            if (dbDevice && dbDevice.mapped_device_name) {
              return {
                ...device,
                name: dbDevice.mapped_device_name,
                type: dbDevice.mapped_device_type,
                colorFeature: dbDevice.color_feature,
                index: dbDevice.mapped_device_index,
              };
            }
            return device;
          })
        );
      } catch (error) {
        log.error("Failed to load DALI devices:", error);
        toast.error("Failed to load DALI devices");
      } finally {
        setLoading(false);
      }
    };

    loadDevices();
  }, [selectedProject, isActive]);

  return { devices, setDevices, loading };
}
