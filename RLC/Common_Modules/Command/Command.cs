using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Windows.Forms;
using System.Runtime.InteropServices;
using System.Runtime.Serialization.Formatters.Binary;
using System.IO;
using System.Reflection;


public class Command
{
    private Board_Attribute board_att = new Board_Attribute();    
    public enum command_status
    {
        SUCCESS,
        ERR_CRC,
        NO_SUPPORT,
        LIMIT_FRAME_LEN,
        LIMIT_INPUT_NUMBER,
        LIMIT_OUTPUT_NUMBER,
        LIMIT_GROUP_PER_INPUT,
        ABSENT_UNIT,
        SLAVE_UNIT,
        LOWER_FIRMWARE,
        LICENSE_FAIL,
        HEX_FILE_CRC,
        TRANSFERED_FAILED = 254,
        OTHER
    };

    enum header_index //<ID Address><length><CMD><Data><CRC>             
    {
        ID_ADDR_IDX     = 0, // Uint32
        CMD_LENGTH_IDX  = 4, // Uint16
        CMD_TYPE_IDX    = 6, // Byte
        CMD_IDX         = 7, // Byte
        CMD_DATA_IDX    = 8,
    };
    enum header_length
    {
        ID_ADDR_LEN = 4,
        CMD_LENGTH_LEN = 2,
        CMD_TYPE_LEN = 1,
        CMD_LEN = 1,
        CRC_LEN = 2,
    };

    enum command_list
    {
        // General system
        GET_RS485_CH1_CONFIG = 13,
        GET_RS485_CH2_CONFIG,
        SET_RS485_CH1_CONFIG,
        SET_RS485_CH2_CONFIG,

        // Lighting command list
        GET_OUTPUT_INFOR2 = 34,
        SET_OUTPUT_INFOR2,

        // Air conditioner cmd list
        GET_LOCAL_AC_CONFIG = 0,
        SET_LOCAL_AC_CONFIG,
    };

    enum command_type
    {
        GENERAL_SYSTEM  = 1,
        LIGHTING_SYSTEM = 10,
        AIR_CONDITIONER = 30,
    };

    public command_status set_output_info2(string IP, string ID, RLC.Light_Out_Cfg.output_info2_t[] info2)
    {
        // Sanity check
        if (info2.Length == 0) return command_status.TRANSFERED_FAILED;
        
        command_status ret  = command_status.SUCCESS;
        
        Byte[] array = new Byte[1024];
        UInt16 data_len = 0;

        foreach (RLC.Light_Out_Cfg.output_info2_t str in info2)
        {
            data_len += convert_light_out_cfg_to_array(ref array, str, Convert.ToUInt16(data_len));            
        }

        ret = send_cmd(IP, ID, command_type.LIGHTING_SYSTEM, command_list.SET_OUTPUT_INFOR2, ref array, ref data_len);

        return ret;
    }

    public command_status get_output_info2(string IP, string ID, ref RLC.Light_Out_Cfg.output_info2_t[] info2)
    {
        // Sanity check
        if (info2.Length == 0) return command_status.TRANSFERED_FAILED;

        command_status ret = command_status.SUCCESS;

        Byte[] array = new Byte[1024];
        UInt16 data_len = 0;
        UInt16 pos = 0;

        ret = send_cmd(IP, ID, command_type.LIGHTING_SYSTEM, command_list.GET_OUTPUT_INFOR2, ref array, ref data_len);

        if (ret == command_status.SUCCESS)
        {            
            // Cast byte array to info struct array.
            UInt16 size = Convert.ToUInt16(Marshal.SizeOf(info2[0]));
            for (int i = 0; i < data_len / size; i++)
            {
               info2[i] = convert_byte_arr_to_light_out_cfg(array, pos);
               pos += size;
            }
        }       

        return ret;
    }

    public command_status set_output_local_ac(string IP, string ID, RLC.AC_Out_Cfg.ac_out_cfg_t[] ac_cfg)
    {
        // Sanity check
        if (ac_cfg.Length == 0) return command_status.TRANSFERED_FAILED;

        command_status ret = command_status.SUCCESS;

        Byte[] array = new Byte[1024];
        UInt16 data_len = 0;

        foreach (RLC.AC_Out_Cfg.ac_out_cfg_t str in ac_cfg)
        {
            data_len += convert_local_ac_cfg_to_array(ref array, str, Convert.ToUInt16(data_len));
        }

        ret = send_cmd(IP, ID, command_type.AIR_CONDITIONER, command_list.SET_LOCAL_AC_CONFIG, ref array, ref data_len);

        return ret;
    }

    public command_status get_output_local_ac(string IP, string ID, ref RLC.AC_Out_Cfg.ac_out_cfg_t[] ac_cfg)
    {
        // Sanity check
        if (ac_cfg.Length == 0) return command_status.TRANSFERED_FAILED;

        command_status ret = command_status.SUCCESS;

        Byte[] array = new Byte[1024];
        UInt16 data_len = 0;
        UInt16 pos = 0;

        ret = send_cmd(IP, ID, command_type.AIR_CONDITIONER, command_list.GET_LOCAL_AC_CONFIG, ref array, ref data_len);

        if (ret == command_status.SUCCESS)
        {
            // Cast byte array to info struct array.
            UInt16 size = Convert.ToUInt16(Marshal.SizeOf(ac_cfg[0]));
            for (int i = 0; i < data_len / size; i++)
            {
                ac_cfg[i] = convert_byte_arr_to_local_ac_cfg(array, pos);
                pos += size;
            }
        }

        return ret;
    }

    public command_status set_rs485_config(string IP, string ID, RLC.RS485_Config.RS485_cfg_t[] rs485_cfg)
    {
        // Sanity check
        if (rs485_cfg == null || rs485_cfg.Length == 0) return command_status.SUCCESS;

        command_status ret = command_status.SUCCESS;        

        Byte[] array = new Byte[1024];
        UInt16 data_len = 0;

        int idx = 0;
        command_list cmd = command_list.SET_RS485_CH1_CONFIG;

        foreach (RLC.RS485_Config.RS485_cfg_t str in rs485_cfg)
        {
            data_len = convert_rs485_cfg_to_array(ref array, str, 0);

            if (idx == 0)
            {
                cmd = command_list.SET_RS485_CH1_CONFIG;
                idx++;
            }
            else if (idx == 1)
            {
                cmd = command_list.SET_RS485_CH2_CONFIG;
            }

            ret = send_cmd(IP, ID, command_type.GENERAL_SYSTEM, cmd, ref array, ref data_len);
        }

        

        return ret;
    }

    public command_status get_rs485_config(string IP, string ID, ref RLC.RS485_Config.RS485_cfg_t[] rs485_cfg)
    {
        // Sanity check        
        command_status ret = command_status.SUCCESS;
        
        Byte[] array = new Byte[1024];
        UInt16 data_len = 0;        
        command_list cmd = command_list.GET_RS485_CH1_CONFIG;
        RLC.RS485_Config.RS485_cfg_t[] temp_rs485_cfg = new RLC.RS485_Config.RS485_cfg_t[RLC.RS485_Config.RS485_MAX_CONFIG];
        int num_rs485_cfg = 0;

        for (int cfg = 0; cfg < temp_rs485_cfg.Length; cfg++)
        {
            if (cfg == 0)
            {
                cmd = command_list.GET_RS485_CH1_CONFIG;
            }
            else if (cfg == 1)
            {
                cmd = command_list.GET_RS485_CH2_CONFIG;
            }

            ret |= send_cmd(IP, ID, command_type.GENERAL_SYSTEM, cmd, ref array, ref data_len);

            if (ret == command_status.SUCCESS)
            {
                // Cast byte array to info struct array.                
                convert_byte_arr_to_rs485_cfg(ref temp_rs485_cfg[cfg], array, 0);
                num_rs485_cfg++;
            }
        }

        rs485_cfg = new RLC.RS485_Config.RS485_cfg_t[num_rs485_cfg];

        for (int i = 0; i < rs485_cfg.Length; i++ )
        {
            rs485_cfg[i] = new RLC.RS485_Config.RS485_cfg_t();
            for (int j = 0; j < RLC.RS485_Config.SLAVE_MAX_DEVS; j++)
            {
                rs485_cfg[i].slave_cfg[j] = new RLC.RS485_Config.slave_cfg_t();
            }
            rs485_cfg[i] = board_att.DeepCopy <RLC.RS485_Config.RS485_cfg_t>(temp_rs485_cfg[i]);
        }

        return ret;
    }

    public UInt16 convert_light_out_cfg_to_array(ref Byte[] data, RLC.Light_Out_Cfg.output_info2_t str, UInt16 index)
    {
        UInt16 size = Convert.ToUInt16(Marshal.SizeOf(str));
        IntPtr ptr = Marshal.AllocHGlobal(size);
        Marshal.StructureToPtr(str, ptr, true);
        Marshal.Copy(ptr, data, index, size);
        Marshal.FreeHGlobal(ptr);

        return size;
    }

    public RLC.Light_Out_Cfg.output_info2_t convert_byte_arr_to_light_out_cfg(byte[] arr, int index)
    {
        RLC.Light_Out_Cfg.output_info2_t str = new RLC.Light_Out_Cfg.output_info2_t();

        int size = Marshal.SizeOf(str);
        IntPtr ptr = Marshal.AllocHGlobal(size);

        Marshal.Copy(arr, index, ptr, size);

        str = (RLC.Light_Out_Cfg.output_info2_t)Marshal.PtrToStructure(ptr, str.GetType());
        Marshal.FreeHGlobal(ptr);

        return str;
    }

    public UInt16 convert_local_ac_cfg_to_array(ref Byte[] data, RLC.AC_Out_Cfg.ac_out_cfg_t str, UInt16 index)
    {
        UInt16 size = Convert.ToUInt16(Marshal.SizeOf(str));
        IntPtr ptr = Marshal.AllocHGlobal(size);
        Marshal.StructureToPtr(str, ptr, true);
        Marshal.Copy(ptr, data, index, size);
        Marshal.FreeHGlobal(ptr);

        return size;
    }

    public RLC.AC_Out_Cfg.ac_out_cfg_t convert_byte_arr_to_local_ac_cfg(byte[] arr, int index)
    {
        RLC.AC_Out_Cfg.ac_out_cfg_t str = new RLC.AC_Out_Cfg.ac_out_cfg_t();

        int size = Marshal.SizeOf(str);
        IntPtr ptr = Marshal.AllocHGlobal(size);

        Marshal.Copy(arr, index, ptr, size);

        str = (RLC.AC_Out_Cfg.ac_out_cfg_t)Marshal.PtrToStructure(ptr, str.GetType());
        Marshal.FreeHGlobal(ptr);

        return str;
    }

    public UInt16 convert_rs485_cfg_to_array(ref Byte[] data, RLC.RS485_Config.RS485_cfg_t str, UInt16 index)
    {
        UInt16 start_index = index;
        FieldInfo[] fields = str.GetType().GetFields();

        foreach (var xInfo in fields)
        {
            string item_val = xInfo.GetValue(str).ToString();

            if (xInfo.FieldType.Name == "Byte[]")
            {
                Array arr = (Array)xInfo.GetValue(str);

                for (int idx = 0; idx < arr.Length; idx++)
                {
                    data[index++] = Convert.ToByte(arr.GetValue(idx));
                }
            }
            else if (xInfo.FieldType.Name == "slave_cfg_t[]")
            {
                Array arr = (Array)xInfo.GetValue(str);
                FieldInfo[] slave_cfgs = typeof(RLC.RS485_Config.slave_cfg_t).GetFields();

                for (int idx = 0; idx < arr.Length; idx++)
                {
                    foreach (var cfg in slave_cfgs)
                    {
                        string cfg_val = cfg.GetValue(arr.GetValue(idx)).ToString();
                        if (cfg.FieldType.Name == "Byte[]")
                        {
                            Array group_arr = (Array)cfg.GetValue(arr.GetValue(idx));
                            for (int j = 0; j < group_arr.Length; j++)
                            {
                                data[index++] = Convert.ToByte(group_arr.GetValue(j));
                            }
                        }
                        else if (cfg.FieldType.Name == "Byte")
                        {
                            data[index++] = Convert.ToByte(cfg_val);
                        }
                        else if (cfg.FieldType.Name == "UInt16")
                        {
                            UInt16 val = Convert.ToUInt16(cfg_val);

                            data[index++] = Convert.ToByte(val & 0xFF);
                            data[index++] = Convert.ToByte((val >> 8) & 0xFF);
                        }
                        else if (cfg.FieldType.Name == "UInt32")
                        {
                            UInt32 val = Convert.ToUInt32(cfg_val);

                            data[index++] = Convert.ToByte(val & 0xFF);
                            data[index++] = Convert.ToByte((val >> 8) & 0xFF);
                            data[index++] = Convert.ToByte((val >> 16) & 0xFF);
                            data[index++] = Convert.ToByte((val >> 24) & 0xFF);
                        }
                    }
                }
            }
            else if (xInfo.FieldType.Name == "Byte")
            {
                data[index++] = Convert.ToByte(item_val);
            }
            else if (xInfo.FieldType.Name == "UInt16")
            {
                UInt16 val = Convert.ToUInt16(item_val);

                data[index++] = Convert.ToByte(val & 0xFF);
                data[index++] = Convert.ToByte((val >> 8) & 0xFF);
            }
            else if (xInfo.FieldType.Name == "UInt32")
            {
                UInt32 val = Convert.ToUInt32(item_val);

                data[index++] = Convert.ToByte(val & 0xFF);
                data[index++] = Convert.ToByte((val >> 8) & 0xFF);
                data[index++] = Convert.ToByte((val >> 16) & 0xFF);
                data[index++] = Convert.ToByte((val >> 24) & 0xFF);
            }
        }

        return Convert.ToUInt16(index - start_index);
    }    

    public void convert_byte_arr_to_rs485_cfg(ref RLC.RS485_Config.RS485_cfg_t RS485_cfg, byte[] data, int index)
    {
        // Initialize the config first.
        RS485_cfg = new RLC.RS485_Config.RS485_cfg_t();
        for (int i = 0; i < RLC.RS485_Config.SLAVE_MAX_DEVS; i++)
        {
            RS485_cfg.slave_cfg[i] = new RLC.RS485_Config.slave_cfg_t();
        }


        // Assign value to config.
        FieldInfo[] fields = RS485_cfg.GetType().GetFields();

        foreach (var xInfo in fields)
        {
            string item_val = xInfo.GetValue(RS485_cfg).ToString();

            if (xInfo.FieldType.Name == "Byte[]")
            {
                Array arr = (Array)xInfo.GetValue(RS485_cfg);
                Byte[] byte_arr = new Byte[arr.Length];

                for (int idx = 0; idx < arr.Length; idx++)
                {
                    byte_arr[idx] = data[index++];
                }

                xInfo.SetValueDirect(__makeref(RS485_cfg), byte_arr);             
            }
            else if (xInfo.FieldType.Name == "slave_cfg_t[]")
            {
                Array arr = (Array)xInfo.GetValue(RS485_cfg);
                FieldInfo[] slave_cfgs = typeof(RLC.RS485_Config.slave_cfg_t).GetFields();

                for (int idx = 0; idx < arr.Length; idx++)
                {
                    foreach (var cfg in slave_cfgs)
                    {                        
                        if (cfg.FieldType.Name == "Byte[]")
                        {
                            Array group_arr = (Array)cfg.GetValue(arr.GetValue(idx));
                            Byte[] byte_arr = new Byte[group_arr.Length];
                            for (int j = 0; j < group_arr.Length; j++)
                            {
                                byte_arr[j] = data[index++];
                            }

                            cfg.SetValueDirect(__makeref(RS485_cfg.slave_cfg[idx]), byte_arr);
                        }
                        else if (cfg.FieldType.Name == "Byte")
                        {
                            cfg.SetValueDirect(__makeref(RS485_cfg.slave_cfg[idx]), data[index++]);                             
                        }
                        else if (cfg.FieldType.Name == "UInt16")
                        {
                            UInt16 val = data[index++];
                            val = Convert.ToUInt16((data[index++] << 8) + val);

                            cfg.SetValueDirect(__makeref(RS485_cfg.slave_cfg[idx]), val);                             
                        }
                        else if (cfg.FieldType.Name == "UInt32")
                        {
                            UInt32 val = data[index++];                            
                            val = Convert.ToUInt32((data[index++] << 8)  + val);
                            val = Convert.ToUInt32((data[index++] << 16) + val);
                            val = Convert.ToUInt32((data[index++] << 24) + val);

                            cfg.SetValueDirect(__makeref(RS485_cfg.slave_cfg[idx]), val);
                        }
                    }
                }
            }
            else if (xInfo.FieldType.Name == "Byte")
            {
                xInfo.SetValueDirect(__makeref(RS485_cfg), data[index++]);
            }
            else if (xInfo.FieldType.Name == "UInt16")
            {
                UInt16 val = data[index++];
                val = Convert.ToUInt16((data[index++] << 8) + val);

                xInfo.SetValueDirect(__makeref(RS485_cfg), val);
            }
            else if (xInfo.FieldType.Name == "UInt32")
            {
                UInt32 val = data[index++];
                val = Convert.ToUInt32((data[index++] << 8) + val);
                val = Convert.ToUInt32((data[index++] << 16) + val);
                val = Convert.ToUInt32((data[index++] << 24) + val);

                xInfo.SetValueDirect(__makeref(RS485_cfg), val);
            }
        }                  
    }    


    /************************************** PRIVATE ZONE *******************************************/
    private void set_id_for_cmd(ref Byte[] data, string id)
    {        
        UInt16 index    = Convert.ToUInt16(header_index.ID_ADDR_IDX);

        data[index]     = Convert.ToByte(Substring('.', 3, id));
        data[index + 1] = Convert.ToByte(Substring('.', 2, id));
        data[index + 2] = Convert.ToByte(Substring('.', 1, id));
        data[index + 3] = Convert.ToByte(Substring('.', 0, id));
    }

    private string Substring(char c, int repeat, string s)
    {
        string result_string = "";
        for (int i = 0; i < s.Length; i++)
        {
            if ((repeat == 0) && (s[i] != c))
            {
                result_string = result_string + s[i];
            }
            if (s[i] == c) repeat = repeat - 1;
            if (repeat == -1) break;
        }
        return result_string;
    }
    
    private void set_cmd_def_for_cmd(ref Byte[] data, command_type type, command_list cmd)
    {
        data[Convert.ToUInt16(header_index.CMD_TYPE_IDX)]   = Convert.ToByte(type);
        data[Convert.ToUInt16(header_index.CMD_IDX)]        = Convert.ToByte(cmd);
    }

    private void set_len_for_cmd(ref Byte[] data, UInt16 total_cmd_len)
    {
        data[Convert.ToUInt16(header_index.CMD_LENGTH_IDX)]     = Convert.ToByte(total_cmd_len & 0xFF);
        data[Convert.ToUInt16(header_index.CMD_LENGTH_IDX + 1)] = Convert.ToByte(total_cmd_len >> 8);
    }

    private void set_crc_for_cmd(ref Byte[] data, UInt16 data_len)
    {
        UInt16 crc_index    = Convert.ToUInt16(Convert.ToUInt16(header_index.CMD_DATA_IDX) + data_len);
        UInt16 crc_start_id = Convert.ToUInt16(Convert.ToUInt16(header_index.CMD_LENGTH_IDX));

        UInt16 sumCRC       = 0;

        for (int i = crc_start_id; i < crc_index; i++)
            sumCRC = Convert.ToUInt16(sumCRC + data[i]);

        data[crc_index]     = Convert.ToByte(sumCRC & 0xFF);
        data[crc_index + 1] = Convert.ToByte(sumCRC >> 8);
    }


    private command_status send_cmd(string IP, string ID, command_type cmd_type, command_list cmd, ref Byte[] data, ref UInt16 data_len)
    {        
        command_status ret = command_status.SUCCESS;

        IPEndPoint ep = new IPEndPoint(IPAddress.Parse(IP), RLC.RLC1.UDPPort);
        Socket s = new Socket(AddressFamily.InterNetwork, SocketType.Dgram, ProtocolType.Udp);
        IPEndPoint AnyIP = new IPEndPoint(IPAddress.Any, 0);
        EndPoint rm = new IPEndPoint(IPAddress.Any, 0);

        byte[] DuLieuTuBo = new byte[1024];

        s.ReceiveTimeout = 1000;

        try
        {
            Byte[] Data = new Byte[1024];  //<ID Address><length><CMD><Data><CRC>    
            UInt16 cmd_hdr_len = 0;            
            UInt16 header_len = 0;

            foreach (header_length item in (header_length[])Enum.GetValues(typeof(header_length)))
            {
                header_len += Convert.ToUInt16(item);
            }

            cmd_hdr_len = Convert.ToUInt16(header_len - Convert.ToUInt16(header_length.ID_ADDR_LEN) - Convert.ToUInt16(header_length.CMD_LENGTH_LEN));
            

            set_id_for_cmd(ref Data, ID);
            set_cmd_def_for_cmd(ref Data, cmd_type, cmd);
            Array.Copy(data, 0, Data, Convert.ToUInt16(header_index.CMD_DATA_IDX), data_len);            
            set_len_for_cmd(ref Data, Convert.ToUInt16(cmd_hdr_len + data_len));
            set_crc_for_cmd(ref Data, data_len);

            s.SendTo(Data, header_len + data_len, SocketFlags.None, ep);
            // Receive the data
            int cnt = s.ReceiveFrom(DuLieuTuBo, ref rm);

            // Get the error code.
            data_len = Convert.ToUInt16(DuLieuTuBo[Convert.ToUInt16(header_index.CMD_LENGTH_IDX)] + (DuLieuTuBo[Convert.ToUInt16(header_index.CMD_LENGTH_IDX) + 1] << 8) - cmd_hdr_len);

            if (data_len == 1) // ACK only with status
            {
                ret = (command_status)DuLieuTuBo[Convert.ToUInt16(header_index.CMD_DATA_IDX)];
            }
            else if (data_len > 1) // data response.
            {
                ret = command_status.SUCCESS;
                Array.Copy(DuLieuTuBo, Convert.ToUInt16(header_index.CMD_DATA_IDX), data, 0, data_len);          
            }
        }
        catch
        {
            s.Close();
            MessageBox.Show("Can't connect to unit IP : " + IP + "   ID : " + ID, "Network Error");
            ret = command_status.TRANSFERED_FAILED;
        }

        return ret;
    }
}
