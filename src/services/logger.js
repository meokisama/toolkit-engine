import path from "node:path";
import fs from "node:fs";
import { app } from "electron";

class LoggerService {
  constructor() {
    this.logsPath = null;
    this.init();
  }

  init() {
    try {
      // Tạo đường dẫn logs trong cùng thư mục với database
      const documentsPath = app.getPath("documents");
      const toolkitPath = path.join(documentsPath, "Toolkit Engine");
      this.logsPath = path.join(toolkitPath, "Logs");

      // Tạo thư mục Logs nếu chưa tồn tại
      if (!fs.existsSync(this.logsPath)) {
        fs.mkdirSync(this.logsPath, { recursive: true });
      }
    } catch (error) {
      console.error("Failed to initialize logger:", error);
      throw error;
    }
  }

  /**
   * Lấy tên file log theo ngày hiện tại
   * @returns {string} Đường dẫn file log
   */
  getLogFilePath() {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    const fileName = `${dateString}.txt`;
    return path.join(this.logsPath, fileName);
  }

  /**
   * Ghi log vào file
   * @param {string} level - Log level (INFO, ERROR, WARNING)
   * @param {string} category - Category (KNX, LIGHTING, etc.)
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   */
  writeLog(level, category, message, data = null) {
    try {
      const timestamp = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).replace("T", " ");
      const logFilePath = this.getLogFilePath();

      let logEntry = `[${timestamp}] [${level}] [${category}] ${message}`;

      if (data) {
        logEntry += ` | Data: ${JSON.stringify(data)}`;
      }

      logEntry += '\n';

      // Append to file
      fs.appendFileSync(logFilePath, logEntry, 'utf8');
    } catch (error) {
      console.error("Failed to write log:", error);
    }
  }

  /**
   * Log KNX configuration send operation
   * @param {string} operation - Operation type (SEND_SINGLE, SEND_BULK, SEND_ALL_CONFIG)
   * @param {Object} knxData - KNX configuration data
   * @param {Object} unitInfo - Unit information
   * @param {boolean} success - Operation success status
   * @param {string} error - Error message if failed
   */
  logKnxSend(operation, knxData, unitInfo, success, error = null) {
    const level = success ? 'INFO' : 'ERROR';
    const message = `KNX ${operation} ${success ? 'SUCCESS' : 'FAILED'}`;

    const logData = {
      operation,
      knx: {
        address: knxData.address,
        type: knxData.type,
        factor: knxData.factor,
        feedback: knxData.feedback,
        rcuGroup: knxData.rcuGroup,
        knxSwitchGroup: knxData.knxSwitchGroup,
        knxDimmingGroup: knxData.knxDimmingGroup,
        knxValueGroup: knxData.knxValueGroup
      },
      unit: {
        ip: unitInfo.ip_address,
        canId: unitInfo.id_can,
        type: unitInfo.type
      },
      success,
      error
    };

    this.writeLog(level, 'KNX', message, logData);
  }

  /**
   * Log info message
   * @param {string} category - Category
   * @param {string} message - Message
   * @param {Object} data - Additional data
   */
  info(category, message, data = null) {
    this.writeLog('INFO', category, message, data);
  }

  /**
   * Log error message
   * @param {string} category - Category
   * @param {string} message - Message
   * @param {Object} data - Additional data
   */
  error(category, message, data = null) {
    this.writeLog('ERROR', category, message, data);
  }

  /**
   * Log warning message
   * @param {string} category - Category
   * @param {string} message - Message
   * @param {Object} data - Additional data
   */
  warning(category, message, data = null) {
    this.writeLog('WARNING', category, message, data);
  }
}

export default LoggerService;
