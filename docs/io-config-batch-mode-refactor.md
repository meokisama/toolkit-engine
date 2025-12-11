# Refactor: Database Unit I/O Config - Batch Mode

## Tóm tắt

Refactor phần ghi cấu hình I/O từ database unit xuống network unit để sử dụng **batch mode**, tương tự như cách network unit xử lý.

## Vấn đề trước khi refactor

### Logic cũ (send-all-config-dialog.jsx)

```javascript
// ❌ GHI TỪNG INPUT MỘT với delay 100ms
for (let inputIndex = 0; inputIndex < ioConfig.inputs.length; inputIndex++) {
  await window.electronAPI.ioController.setupInputConfig({...});
  await new Promise((resolve) => setTimeout(resolve, 100)); // CHẬM!
}

// ❌ GHI TỪNG OUTPUT MỘT với delay 100ms
for (let outputIndex = 0; outputIndex < ioConfig.outputs.length; outputIndex++) {
  await window.electronAPI.ioController.setOutputDelayOff(...);
  await new Promise((resolve) => setTimeout(resolve, 100));

  await window.electronAPI.ioController.setOutputDelayOn(...);
  await new Promise((resolve) => setTimeout(resolve, 100));

  await window.electronAPI.ioController.setOutputConfig(...);
  await new Promise((resolve) => setTimeout(resolve, 100));
}

// ❌ GỬI OUTPUT ASSIGNMENTS RIÊNG
await window.electronAPI.ioController.setAllOutputAssignments(...);
```

### Hiệu suất cũ

| Số lượng I/O | Thời gian ước tính    |
| ------------ | --------------------- |
| 16 inputs    | 16 × 100ms = **1.6s** |
| 16 outputs   | 48 × 100ms = **4.8s** |
| **Tổng**     | **~6.4s**             |

## Giải pháp: Batch Mode

### Logic mới

```javascript
// Ghi TẤT CẢ input configs cùng lúc
const result = await window.electronAPI.ioController.setupBatchInputConfigs({
  unitIp: unitIp,
  canId: canId,
  inputConfigs: inputConfigsData,
  maxBytes: 900, // Auto-split into batches if needed
});

// Ghi TẤT CẢ lighting output configs cùng lúc
const result = await window.electronAPI.ioController.setupBatchLightingOutputs({
  unitIp: unitIp,
  canId: canId,
  lightingOutputs: lightingOutputs,
  maxBytes: 900, // Auto-split into batches if needed
});

// Ghi AC configs (đã có sẵn)
await window.electronAPI.ioController.setLocalACConfig(unitIp, canId, ioConfig.acConfigs);
```

### Hiệu suất mới

| Số lượng I/O | Số batch    | Thời gian ước tính |
| ------------ | ----------- | ------------------ |
| 16 inputs    | 1-2 batches | **~0.2-0.4s**      |
| 16 outputs   | 1-2 batches | **~0.2-0.4s**      |
| **Tổng**     |             | **~0.4-0.8s**      |

### Cải thiện hiệu suất

- **Tốc độ**: Nhanh hơn **8-16 lần** (từ 6.4s xuống 0.4-0.8s)
- **Số requests**: Giảm từ **~64 requests** xuống **2-4 batches**
- **Network overhead**: Giảm đáng kể

## Thay đổi chi tiết

### 1. Input Configs - Batch Mode

**Trước:**

```javascript
for (let inputIndex = 0; inputIndex < ioConfig.inputs.length; inputIndex++) {
  await window.electronAPI.ioController.setupInputConfig({...});
  await new Promise((resolve) => setTimeout(resolve, 100));
}
```

**Sau:**

```javascript
const inputConfigsData = ioConfig.inputs
  .filter((input) => input && input.functionValue !== undefined)
  .map((input, index) => ({
    inputNumber: index,
    inputType: parseInt(input.functionValue) || 0,
    ramp: parseInt(input.ramp) ?? 0,
    preset: parseInt(input.preset) ?? 255,
    ledStatus: parseInt(input.ledStatus) || 0,
    autoMode: input.autoMode || false,
    delayOff: parseInt(input.delayOff) ?? 0,
    groups: input.groups || [],
  }));

const result = await window.electronAPI.ioController.setupBatchInputConfigs({
  unitIp: unitIp,
  canId: canId,
  inputConfigs: inputConfigsData,
  maxBytes: 900,
});
```

### 2. Output Configs - Batch Mode

**Trước:**

```javascript
// Gửi assignments riêng
await window.electronAPI.ioController.setAllOutputAssignments(...);

// Gửi từng output config
for (let outputIndex = 0; outputIndex < ioConfig.outputs.length; outputIndex++) {
  await window.electronAPI.ioController.setOutputDelayOff(...);
  await window.electronAPI.ioController.setOutputDelayOn(...);
  await window.electronAPI.ioController.setOutputConfig(...);
}
```

**Sau:**

```javascript
// Batch mode xử lý TẤT CẢ: assignments, delays, configs
const lightingOutputs = ioConfig.outputs.filter((output) => output && output.deviceType !== "aircon");

const result = await window.electronAPI.ioController.setupBatchLightingOutputs({
  unitIp: unitIp,
  canId: canId,
  lightingOutputs: lightingOutputs,
  maxBytes: 900,
});
```

### 3. Xóa duplicate output assignments

**Trước:** Gửi output assignments 2 lần:

1. Riêng với `setAllOutputAssignments`
2. Trong `setupBatchLightingOutputs`

**Sau:** Chỉ gửi 1 lần thông qua `setupBatchLightingOutputs`

## Lợi ích

1. **Hiệu suất cao hơn**: Giảm thời gian ghi từ ~6.4s xuống ~0.4-0.8s
2. **Nhất quán**: Logic giống với network unit I/O config
3. **Giảm network overhead**: Ít requests hơn, ít delay hơn
4. **Tự động batch**: Backend tự động chia thành nhiều batches nếu vượt quá 900 bytes
5. **Error handling tốt hơn**: Batch mode trả về kết quả chi tiết cho từng operation

## Testing

### Test cases cần kiểm tra:

- [ ] Ghi cấu hình database unit có ít I/O (4-8 I/O)
- [ ] Ghi cấu hình database unit có nhiều I/O (16+ I/O)
- [ ] Ghi cấu hình với AC outputs
- [ ] Ghi cấu hình với lighting outputs (relay, dimmer, analog)
- [ ] Ghi cấu hình với cả AC và lighting outputs
- [ ] Kiểm tra input configs với multi-group và RLC configs
- [ ] Kiểm tra output configs với delays, min/max dim, auto trigger, schedule
- [ ] Kiểm tra error handling khi một phần batch fails

## Rollback

Nếu cần rollback, có thể revert commit này và quay lại logic cũ (gửi từng config một với delay).

## Notes

- Batch mode tự động chia thành nhiều batches nếu payload > 900 bytes
- Backend (`setupBatchInputConfigs` và `setupBatchLightingOutputs`) đã implement sẵn batch logic
- Không cần thay đổi backend, chỉ cần sử dụng các API batch mode đã có

## Files thay đổi

- `src/components/projects/unit/network-units/controls/base/send-all-config-dialog.jsx`
  - Hàm `writeIOConfiguration` (dòng 226-309)
  - Xóa phần gửi output assignments riêng (dòng 644-674)
