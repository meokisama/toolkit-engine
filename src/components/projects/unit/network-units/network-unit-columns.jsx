import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { DataTableColumnHeader } from "@/components/projects/data-table/data-table-column-header";
import { compareIpAddresses } from "@/utils/ip-utils";

export const createNetworkUnitColumns = () => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" className="mx-1.5" />
    ),
    enableSorting: false,
    enableHiding: false,
    meta: {
      className: "w-[3%]",
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => {
      const type = row.getValue("type");
      return <Input value={type || ""} readOnly className="font-medium min-w-40" placeholder="-" />;
    },
    enableSorting: true,
    enableHiding: true,
    meta: {
      className: "w-[18%]",
    },
  },
  {
    accessorKey: "serial_no",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Serial No." className="flex items-center justify-center" />,
    cell: ({ row }) => {
      const serialNo = row.getValue("serial_no");
      return <Input value={serialNo || ""} readOnly className="text-sm text-center min-w-36" placeholder="-" />;
    },
    enableSorting: true,
    enableHiding: true,
    meta: {
      className: "w-[18%]",
    },
  },
  {
    accessorKey: "ip_address",
    header: ({ column }) => <DataTableColumnHeader column={column} title="IP Address" className="justify-center" />,
    cell: ({ row }) => {
      const ipAddress = row.getValue("ip_address");
      return <Input value={ipAddress || ""} readOnly className="text-sm text-center min-w-30" placeholder="-" />;
    },
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const ipA = rowA.getValue("ip_address");
      const ipB = rowB.getValue("ip_address");
      return compareIpAddresses(ipA, ipB);
    },
    enableHiding: true,
    meta: {
      className: "w-[15%]",
    },
  },
  {
    accessorKey: "id_can",
    header: ({ column }) => <DataTableColumnHeader column={column} title="ID CAN" className="text-center" />,
    cell: ({ row }) => {
      const idCan = row.getValue("id_can");
      return <Input value={idCan || ""} readOnly className="text-sm text-center min-w-20" placeholder="-" />;
    },
    enableSorting: false,
    enableHiding: true,
    meta: {
      className: "w-[15%]",
    },
  },
  {
    accessorKey: "mode",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Mode" className="flex items-center justify-center" />,
    cell: ({ row }) => {
      const mode = row.getValue("mode");
      const getTextColor = (mode) => {
        switch (mode) {
          case "Master":
            return "text-blue-800";
          case "Slave":
            return "text-gray-800";
          case "Stand-Alone":
            return "text-green-800";
          default:
            return "text-gray-800";
        }
      };

      return <Input value={mode || ""} readOnly className={`text-center min-w-30 text-xs font-medium ${getTextColor(mode)}`} placeholder="-" />;
    },
    enableSorting: true,
    enableHiding: true,
    meta: {
      className: "w-[11%]",
    },
  },
  {
    accessorKey: "firmware_version",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Firmware" className="text-center" />,
    cell: ({ row }) => {
      const firmwareVersion = row.getValue("firmware_version");
      return <Input value={firmwareVersion || ""} readOnly className="text-sm text-center" placeholder="-" />;
    },
    enableSorting: false,
    enableHiding: true,
    meta: {
      className: "w-[12%]",
    },
  },
  {
    accessorKey: "hardware_version",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Hardware" className="text-center" />,
    cell: ({ row }) => {
      const hardwareVersion = row.getValue("hardware_version");
      return <Input value={hardwareVersion || ""} readOnly className="text-sm text-center" placeholder="-" />;
    },
    enableSorting: false,
    enableHiding: true,
    meta: {
      className: "w-[12%]",
    },
  },
  {
    accessorKey: "can_load",
    header: ({ column }) => <DataTableColumnHeader column={column} title="CAN Load" />,
    cell: ({ row }) => {
      const canLoad = row.getValue("can_load");
      return (
        <div className="flex items-center justify-center">
          <Checkbox checked={canLoad} readOnly />
        </div>
      );
    },
    enableSorting: false,
    enableHiding: true,
    meta: {
      className: "w-[10%]",
    },
  },
  {
    accessorKey: "recovery_mode",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Recovery" />,
    cell: ({ row }) => {
      const recoveryMode = row.getValue("recovery_mode");
      return (
        <div className="flex items-center justify-center">
          <Checkbox checked={recoveryMode} readOnly />
        </div>
      );
    },
    enableSorting: false,
    enableHiding: true,
    meta: {
      className: "w-[8%]",
    },
  },
];
