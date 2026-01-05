import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { findMatchingUnits } from "./comparators/unit-matcher";
import { compareUnitConfigurations } from "./comparators/orchestrator";
import { readNetworkUnitConfigurations } from "./services/network-config-service";
import { getDatabaseConfigurations } from "./services/database-config-service";
import { getNetworkUnitCacheKey } from "./utils/unit-key-utils";

/**
 * Hook for managing configuration comparison between database and network units
 */
export function useConfigComparison() {
  const [comparisonResults, setComparisonResults] = useState(new Map());
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonProgress, setComparisonProgress] = useState(0);
  const [hasComparisonResults, setHasComparisonResults] = useState(false);
  const [comparisonSummary, setComparisonSummary] = useState(null);

  // Cache for network unit configurations to avoid repeated reads
  const networkConfigCache = useRef(new Map());

  /**
   * Compare configurations between database units and network units
   * @param {Array} databaseUnits - Array of database units
   * @param {Array} networkUnits - Array of network units
   * @param {Object} projectItems - Project items for device_id to address lookup
   */
  const compareConfigurations = useCallback(async (databaseUnits, networkUnits, projectItems = null) => {
    if (!databaseUnits?.length || !networkUnits?.length) {
      toast.warning("No units available for comparison");
      return;
    }

    setIsComparing(true);
    setComparisonProgress(0);

    const loadingToast = toast.loading("Comparing configurations between database and network units...");

    try {
      // Find matching units
      const matchingUnits = findMatchingUnits(databaseUnits, networkUnits);

      if (matchingUnits.length === 0) {
        toast.warning("No matching units found between database and network", { id: loadingToast });
        return;
      }

      console.log(`Found ${matchingUnits.length} matching units for comparison`);

      const results = new Map();

      // Process each matching pair
      for (let i = 0; i < matchingUnits.length; i++) {
        const { databaseUnit, networkUnit } = matchingUnits[i];

        setComparisonProgress(((i + 1) / matchingUnits.length) * 100);

        toast.loading(`Comparing unit ${i + 1}/${matchingUnits.length}: ${networkUnit.type} (${networkUnit.ip_address})...`, { id: loadingToast });

        try {
          // Read network unit configurations
          const networkUnitWithConfigs = await readNetworkUnitConfigurations(networkUnit, networkConfigCache.current);

          // Get database configurations for this unit's project
          const databaseConfigs = await getDatabaseConfigurations(databaseUnit, databaseUnit.project_id);

          // Compare configurations
          const comparisonResult = await compareUnitConfigurations(databaseUnit, networkUnitWithConfigs, projectItems, databaseConfigs);

          // Store results for both database and network units
          const resultData = {
            ...comparisonResult,
            databaseUnit,
            networkUnit: networkUnitWithConfigs,
            comparedAt: new Date().toISOString(),
          };

          results.set(`db_${databaseUnit.id}`, resultData);
          results.set(`net_${getNetworkUnitCacheKey(networkUnit)}`, resultData);
        } catch (error) {
          console.error(`Failed to compare unit ${networkUnit.ip_address}:`, error);

          // Store error result
          const errorResult = {
            isEqual: false,
            differences: [`Failed to read configurations: ${error.message}`],
            error: true,
            databaseUnit,
            networkUnit,
            comparedAt: new Date().toISOString(),
          };

          results.set(`db_${databaseUnit.id}`, errorResult);
          results.set(`net_${getNetworkUnitCacheKey(networkUnit)}`, errorResult);
        }
      }

      setComparisonResults(results);

      // Create detailed summary
      const totalMatches = matchingUnits.length;
      const resultArray = Array.from(results.values());
      const uniqueResults = resultArray.filter((_, index) => index % 2 === 0); // Remove duplicates

      const identicalUnits = uniqueResults.filter((result) => result.isEqual && !result.error);
      const differentUnits = uniqueResults.filter((result) => !result.isEqual && !result.error);
      const errorUnits = uniqueResults.filter((result) => result.error);

      const summary = {
        totalMatches,
        identicalCount: identicalUnits.length,
        differentCount: differentUnits.length,
        errorCount: errorUnits.length,
        identicalUnits,
        differentUnits,
        errorUnits,
        allDifferences: differentUnits.reduce((acc, unit) => {
          acc.push({
            unitInfo: `${unit.databaseUnit.type} (${unit.databaseUnit.ip_address})`,
            differences: unit.differences || [],
          });
          return acc;
        }, []),
      };

      setComparisonSummary(summary);
      setHasComparisonResults(true);

      toast.success(`Comparison complete: ${identicalUnits.length} identical, ${differentUnits.length} different, ${errorUnits.length} errors`, {
        id: loadingToast,
      });
    } catch (error) {
      console.error("Failed to compare configurations:", error);
      toast.error(`Failed to compare configurations: ${error.message}`, {
        id: loadingToast,
      });
    } finally {
      setIsComparing(false);
      setComparisonProgress(0);
    }
  }, []);

  /**
   * Get comparison result for a specific unit
   * @param {string} unitKey - Unit key (db_id or net_ip_can)
   * @returns {Object|null} Comparison result
   */
  const getComparisonResult = useCallback(
    (unitKey) => {
      return comparisonResults.get(unitKey) || null;
    },
    [comparisonResults]
  );

  /**
   * Clear all comparison results and cache
   */
  const clearComparisons = useCallback(() => {
    setComparisonResults(new Map());
    setHasComparisonResults(false);
    setComparisonSummary(null);
    networkConfigCache.current.clear();
  }, []);

  /**
   * Get the background color class for a unit based on comparison result
   * @param {string} unitKey - Unit key
   * @returns {string} CSS class name
   */
  const getUnitRowClass = useCallback(
    (unitKey) => {
      const result = comparisonResults.get(unitKey);

      if (!result) {
        return ""; // Default background
      }

      if (result.error) {
        return "bg-yellow-50 hover:bg-yellow-100"; // Yellow for errors
      }

      if (result.isEqual) {
        return "bg-green-50 hover:bg-green-100"; // Green for identical
      } else {
        return "bg-red-50 hover:bg-red-100"; // Red for different
      }
    },
    [comparisonResults]
  );

  return {
    comparisonResults,
    isComparing,
    comparisonProgress,
    hasComparisonResults,
    comparisonSummary,
    compareConfigurations,
    getComparisonResult,
    clearComparisons,
    getUnitRowClass,
  };
}
