using System;
using System.Windows.Forms;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using System.ComponentModel;
using System.Reflection;
using System.Runtime.Serialization.Formatters.Binary;

public class Board_Attribute
{
    [FlagsAttribute]
    public enum Input_Func_List
    {
        IP_UNUSED,
        BELL,
        DO_NOT_DISTURB,
        MAKE_UP_ROOM,
        KEY_CARD,
        IP_ON,
        IP_OFF,
        IP_ON_OFF,
        IP_SWITCH,
        IP_SWITCH_INVERT,
        IP_DIM_TOGGLE,
        IP_DIM_MEM,
        IP_ON_UP,
        IP_OFF_DOWN,
        IP_TIMER_TOGGLE,
        IP_TIMER_RETRIGGER,
        IP_DIM_UP,
        IP_DIM_DOWN,
        IP_SOFT_UP,
        IP_SOFT_DOWN,
        SCENE,
        CURTAIN,
        RETURN,
        IP_TOGGLE,
        SCENE_SEQUENCE,
        SCENE_OFF,
        SCENE_ON,
        SCENE_WELCOME,
        SCENE_UNOCCUPIED,
        SCENE_TOGGLE,
        KEYLESS,
        DOOR_SWITCH,
        MOTION_SENSOR,
        BLIND,
        FAN_LMH,
        FAN_LMHO,
        IP_CIRCLE_UP,
        IP_CIRCLE_DOWN,
        IP_CIRCLE_UP_OFF,
        IP_CIRCLE_DOWN_OFF,
        IP_VOL_UP,
        IP_VOL_DOWN,
        SCENE_WELCOME_NIGHT,
        SCENE_GROUP_TRIGGER,
        SCENE_GROUP_TOGGLE,
        SCENE_GROUP_SEQUENCE,
        CURTAIN_OBJ = 49,
        AC_FAN_LMH = 50,
        AC_FAN_OLMH,
        AC_FAN_LOW,
        AC_FAN_MED,
        AC_FAN_HIGH,
        AC_TEMP_DOWN,
        AC_TEMP_UP,
        AC_TEMP_TYPE,
        AC_POWER,
        AC_MODE,
        AC_FAN_SPEED,
        SW_INV_AC_OFF = 70,
        SW_INV_AC_ECO,
        TIME_HOUR = 80,
        TIME_MINUTE,
        TIME_ALARM,
        TIME_ZONE,
        TIME_SETT,
        MOTION_SET_SCENE = 90,
        SW_SCENE,
        SW_SCENE_OFF,
        SW_SCENE_ON,
        SW_SCENE_SEQUENCE,
        SW_SCENE_GROUP,
        SW_DND,
        SW_MUR,
        ENTRANCE = 254,
        CUSTOM = 255,    
    };

    public enum output_func
    {
        OUTPUT_DIMMER,
        OUTPUT_RELAY,
        OUTPUT_AO,
        OUTPUT_AC,
    }
    public enum config_func
    {
        AC_RS485_CFG,
    }        

    public const string LIGHTING_GROUP_NAME = "Lighting Group";
    public const string AIR_COND_GROUP_NAME = "Air Conditioner Group";
    public const int    MAX_LOCAL_AC        = 10;

    public int Get_Function_Value(string str)
    {
        int value = 0;
        for (int i = 0; i <= (int)Input_Func_List.CUSTOM; i++)
        {            
            // Compare string to get the right value.
            if (str == ((Input_Func_List)i).ToString())
            {
                value = i;
                break;
            }            
        }

        return value;
    }

    public int Get_Function_Index(String[] function_display_list, int function_value)
    {
        int idx = 0;

        foreach (string str in function_display_list)
        {
            if (str == ((Input_Func_List)function_value).ToString())
            {
                break;
            }
            idx++;
        }        


        return idx;
    }

    public Boolean Check_Multi_Group_Func(string func)
    {        
        string[] group_list = Enum.GetNames(typeof(Multiple_Group_Func));

        return Check_In_Group(func, group_list);
    }

    public Boolean Check_Key_Card_Group_Func(string func)
    {        
        string[] group_list = Enum.GetNames(typeof(Key_Card_Group_Func));

        return Check_In_Group(func, group_list);
    }

    public Boolean Check_Ramp_Preset_Group_Func(string func)
    {        
        string[] group_list = Enum.GetNames(typeof(Ramp_Preset_Group_Func));

        return Check_In_Group(func, group_list);
    }

    public Boolean Check_DelayOff_Group_Func(string func)
    {
        string[] group_list = Enum.GetNames(typeof(DelayOff_Group_Func));

        return Check_In_Group(func, group_list);
    }

    public Boolean Check_Ramp_Group_Func(string func)
    {
        string[] group_list = Enum.GetNames(typeof(Ramp_Group_Func));

        return Check_In_Group(func, group_list);
    }

    public Boolean Check_AC_Group_Func(string func)
    {
        string[] group_list = Enum.GetNames(typeof(AC_Group_Func));

        return Check_In_Group(func, group_list);
    }

    public bool Check_value_in_group(RLC.RLC1 host, Byte value, string group_type)
    {
        bool val_in_group = false;

        BindingList<RLC.RLC1.group_def> grp_type = null;

        if (group_type == AIR_COND_GROUP_NAME)
        {
            grp_type = host.air_cond_group;
        }
        else if (group_type == LIGHTING_GROUP_NAME)
        {
            grp_type = host.lighting_group;
        }


        if (grp_type != null)
        {
            for (int i = 0; i < grp_type.Count; i++)
            {
                if (grp_type.ElementAt(i).value == value)
                {
                    val_in_group = true;
                    break;
                }
            }
        }

        return val_in_group;
    }

    public void Add_Group_To_ComboBox(RLC.RLC1 host, string func, ComboBox cbx)
    {
        BindingList<RLC.RLC1.group_def> group = new BindingList<RLC.RLC1.group_def>();

        if (Check_AC_Group_Func(func) == true)
        {
            group = host.air_cond_group;
        }
        else
        {
            group = host.lighting_group;
        }

        if (cbx.DataSource != group)
        {
            cbx.BindingContext = new BindingContext();
            cbx.DataSource = null;
            cbx.DataSource = group;
            cbx.DisplayMember = "name";
            cbx.ValueMember = "value";
        }        
        cbx.Tag = func;
    }

    public Byte Recover_Group_To_Database(RLC.RLC1 host, Byte group, string func, ref string grp_name)
    {
        Byte index = 0;
        string filePath;
        string grp_val_str;
        FileStream fs;
        string data;

        filePath = Get_group_path(host, get_group_type_from_func(func));

        grp_name = "Group" + group.ToString();

        if (group < 10) grp_val_str = "00" + group.ToString();
        else if (group < 100) grp_val_str = "0" + group.ToString();
        else grp_val_str = group.ToString();

        data = grp_name + "," + grp_val_str + ",User Deleted. Program has recovered. Please modify input before deleting group";


        // Append data to file
        fs = new FileStream(filePath, FileMode.Append);

        StreamWriter sWriter = new StreamWriter(fs, System.Text.Encoding.UTF8);
        sWriter.WriteLine(data);
        sWriter.Flush();
        fs.Close();

        
        if (filePath.Contains(LIGHTING_GROUP_NAME) == true)
        {
            host.lighting_group.Add(new RLC.RLC1.group_def(grp_name, group));
            index = Convert.ToByte(host.lighting_group.Count - 1);
        }
        else if (filePath.Contains(AIR_COND_GROUP_NAME) == true)
        {
            host.air_cond_group.Add(new RLC.RLC1.group_def(grp_name, group));
            index = Convert.ToByte(host.air_cond_group.Count - 1);
        }

        return index;
    }

    public void Add_Group_To_Database(RLC.RLC1 host, string group_type, string group_name, Byte group_value, string group_dec, Byte old_group_value)
    {        

        string grp_val_str= "000".Substring(group_value.ToString().Length) + group_value.ToString();               
        string group_info = group_name + "," + grp_val_str + "," + group_dec;

        BindingList<RLC.RLC1.group_def> grp_type = Get_group_list_from_type(host, group_type);
        Byte index = (Byte)grp_type.Count;

        if (group_type != null)
        {            
            for (int i = 1; i < grp_type.Count; i++)
            {
                if (grp_type.ElementAt(i).value == old_group_value)
                {                                       
                    // Combobox doesn't update automatically when data is replaced therefore we must have a hack here to remove then add again.         
                    grp_type.Insert(i + 1, new RLC.RLC1.group_def(group_name, group_value));
                    grp_type.RemoveAt(i);
                    index = (Byte)i;
                    break;
                }
            }
        }

        string fileName = Get_group_path(host, group_type);
        string[] readLine = File.ReadAllLines(fileName);

        if (index == grp_type.Count)
        {
            grp_type.Add(new RLC.RLC1.group_def(group_name, group_value));
        }

        string[] writeLine = new string[grp_type.Count - 1];

        for (int i = 0; i < readLine.Length; i++ )
        {
            writeLine[i] = readLine[i];
        }
        
        writeLine[index - 1] = group_info;

        File.WriteAllLines(fileName, writeLine);                       
    }    

    public Byte Get_group_index(RLC.RLC1 host, Byte group, string func)
    {
        Byte index = 0;
        bool need_recover_group = true;

        BindingList<RLC.RLC1.group_def> grp_type;

        if (Check_AC_Group_Func(func) == true)
        {
            grp_type = host.air_cond_group;
        }
        else
        {
            grp_type = host.lighting_group;
        }

        
        for (int i = 0; i < grp_type.Count; i++)
        {
            if (grp_type.ElementAt(i).value == group)
            {
                index = (Byte)i;
                need_recover_group = false;
                break;
            }
        }


        if (need_recover_group)
        {
            string group_name = "";
            index = Recover_Group_To_Database(host, group, func, ref group_name);
        }

        return index;
    }

    public string Get_group_desc(RLC.RLC1 host, string group_type, Byte group)
    {
        string grp_desc = "";
        string group_path = Get_group_path(host, group_type);

        StreamReader rd = File.OpenText(group_path);
        string input = "";
        string name = "";
        Byte value = 0;
        while ((input = rd.ReadLine()) != null)
        {
            int count = 0;
            string s = "";
            for (int i = 0; i < input.Length; i++)
            {
                if (input[i] != ',') s = s + input[i];
                else
                {
                    if (count == 0)
                    {
                        name = s;
                        s = "";
                        count = 1;
                    }
                    else
                    {
                        value = Convert.ToByte(s);
                        s = "";
                    }
                }
            }

            if (value == group)
            {
                grp_desc = s;
                break;
            }
        }

        rd.Close();           

        return grp_desc;
    }

    public Byte Get_group_value_from_name(RLC.RLC1 host, string group_type, string group_name)
    {
        BindingList<RLC.RLC1.group_def> grp_type = Get_group_list_from_type(host, group_type);
        Byte group_value = 0;

        for (int i = 0; i < grp_type.Count; i++ )
        {
            if (grp_type.ElementAt(i).name == group_name)
            {
                group_value = grp_type.ElementAt(i).value;
                break;
            }
        }

        return group_value;
    }        

    public BindingList<RLC.RLC1.group_def> Get_group_list_from_type(RLC.RLC1 host, string group_type)
    {
        BindingList<RLC.RLC1.group_def> group = null;
        if (group_type == LIGHTING_GROUP_NAME)
        {
            group = host.lighting_group;
        }
        else if (group_type == AIR_COND_GROUP_NAME)
        {
            group = host.air_cond_group;
        }

        return group;
    }

    public string get_group_type_from_func(string func)
    {
        string group_type = "";

        if (Check_AC_Group_Func(func) == true)
        {
            group_type = AIR_COND_GROUP_NAME;
        }
        else
        {
            group_type = LIGHTING_GROUP_NAME;
        }

        return group_type;
    }
    
    public string Get_group_path(RLC.RLC1 host, string group_type)
    {
        return host.treeView1.SelectedNode.Parent.FullPath + "\\" + group_type + ".csv";
    }

    public string Get_Input_Func_Name(int func_val)
    {
        return ((Input_Func_List)func_val).ToString();
    }

    public string Get_Output_Func_Name(string label)
    {
        string func_name = "";

        if (label.Contains("Relay") == true)
        {
            func_name = output_func.OUTPUT_RELAY.ToString();
        }
        else if (label.Contains("AO") == true)
        {
            func_name = output_func.OUTPUT_AO.ToString();
        }
        else if (label.Contains("Dimmer") == true)
        {
            func_name = output_func.OUTPUT_DIMMER.ToString();
        }
        else if (label.Contains("AC") == true)
        {
            func_name = output_func.OUTPUT_AC.ToString();
        }

        return func_name;
    }

    public int get_num_local_ac(string board_type)
    {
        string[] group_list = Enum.GetNames(typeof(AC_Local_BoardType));

        if (Check_In_Group(board_type, group_list) ==  true)
        {
            return MAX_LOCAL_AC;
        }
        else
        {
            return 0;
        }

    }

    public string[] build_rs485_cfg(RLC.RLC1 XForm)
    {
        int length = 0;

        if (XForm.RS485_Cfg != null)
        {
            length = XForm.RS485_Cfg.Length;
        }

        string[] rs485_cfg_str = new string[length + 1];

        //Write number of RS485 config           
        rs485_cfg_str[0] = "RS485," + length.ToString();

        // Write RS485 config
        for (int i = 0; i < length; i++)
        {
            string Data = "RS485-" + (i + 1).ToString();

            FieldInfo[] fields = XForm.RS485_Cfg[0].GetType().GetFields();
            foreach (var xInfo in fields)
            {
                string data = xInfo.GetValue(XForm.RS485_Cfg[i]).ToString();

                if (data == "System.Byte[]")
                {
                    Array arr = (Array)xInfo.GetValue(XForm.RS485_Cfg[i]);
                    for (int idx = 0; idx < arr.Length; idx++)
                    {
                        Data += "," + arr.GetValue(idx).ToString();
                    }
                }
                else if (data == "RLC.RS485_Config+slave_cfg_t[]")
                {                    
                    Array arr = (Array)xInfo.GetValue(XForm.RS485_Cfg[i]);
                    FieldInfo[] slave_cfgs = typeof(RLC.RS485_Config.slave_cfg_t).GetFields();

                    for (int idx = 0; idx < arr.Length; idx++)
                    {
                        foreach (var cfg in slave_cfgs)
                        {
                            string config = cfg.GetValue(arr.GetValue(idx)).ToString();
                            if (config == "System.Byte[]")
                            {
                                Array group_arr = (Array)cfg.GetValue(arr.GetValue(idx));
                                for (int j = 0; j < group_arr.Length; j++)
                                {
                                    Data += "," + group_arr.GetValue(j).ToString();
                                }
                            }
                            else
                            {
                                Data += "," + config;
                            }
                        }
                    }
                }
                else
                {
                    Data += "," + data;
                }
            }

            rs485_cfg_str[i + 1] = Data;
        }

        return rs485_cfg_str;
    }

    public T DeepCopy<T>(T obj)
    {
        if (!typeof(T).IsSerializable)
        {
            throw new Exception("The source object must be serializable");
        }

        if (Object.ReferenceEquals(obj, null))
        {
            throw new Exception("The source object must not be null");
        }

        T result = default(T);

        using (var memoryStream = new MemoryStream())
        {

            var formatter = new BinaryFormatter();

            formatter.Serialize(memoryStream, obj);

            memoryStream.Seek(0, SeekOrigin.Begin);

            result = (T)formatter.Deserialize(memoryStream);

            memoryStream.Close();
        }

        return result;
    }

    public UInt16 convert_rs485_cfg_to_array(ref Byte[] data, RLC.RS485_Config.RS485_cfg_t str, UInt16 index)
    {
        UInt16 start_index = index;
        FieldInfo[] fields = str.GetType().GetFields();

        foreach (var xInfo in fields)
        {
            string item_val = xInfo.GetValue(str).ToString();

            if (item_val == "System.Byte[]")
            {
                Array arr = (Array)xInfo.GetValue(str);

                for (int idx = 0; idx < arr.Length; idx++)
                {
                    data[index++] = Convert.ToByte(arr.GetValue(idx));                    
                }
            }
            else if (item_val == "RLC.RS485_Config+slave_cfg_t[]")
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
                                data[index++] = Convert.ToByte(arr.GetValue(idx));                                
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

    /************************************** PRIVATE ZONE *******************************************/
    private enum Multiple_Group_Func
    {
        KEY_CARD,
        IP_ON,
        IP_OFF,
        IP_ON_OFF,
        IP_SWITCH,
        IP_SWITCH_INVERT,
        IP_DIM_TOGGLE,
        IP_DIM_MEM,
        IP_DIM_UP,
        IP_DIM_DOWN,
        SCENE,
        CURTAIN,
        CURTAIN_OBJ,
        RETURN,
        IP_TOGGLE,
        SCENE_SEQUENCE,
        SCENE_OFF,
        SCENE_ON,
        SCENE_WELCOME,
        SCENE_UNOCCUPIED,
        SCENE_TOGGLE,
        SCENE_GROUP_TRIGGER,
        SCENE_GROUP_TOGGLE,
        SCENE_GROUP_SEQUENCE,
        KEYLESS,
        DOOR_SWITCH,
        MOTION_SENSOR,
        BLIND,
        FAN_LMH,
        FAN_LMHO,
        IP_CIRCLE_UP,
        IP_CIRCLE_DOWN,
        IP_CIRCLE_UP_OFF,
        IP_CIRCLE_DOWN_OFF,
        IP_VOL_UP,
        IP_VOL_DOWN,
        AC_FAN_LMH,
        AC_FAN_SPEED,
        AC_FAN_LOW,
        AC_FAN_MED,
        AC_FAN_HIGH,
        AC_TEMP_DOWN,
        AC_TEMP_UP,
        AC_TEMP_TYPE,
        AC_POWER,
        AC_MODE,
        SW_INV_AC_OFF,
        SW_INV_AC_ECO,
        TIME_HOUR,
        TIME_MINUTE,
        TIME_ALARM,
        TIME_ZONE,
        TIME_SETT,
        SCENE_WELCOME_NIGHT,
        CUSTOM
    };

    private enum Key_Card_Group_Func
    {
        KEY_CARD,
        SCENE_GROUP,
        SCENE_GROUP_TOGGLE,
    };

    private enum Ramp_Preset_Group_Func
    {
        BELL,
        IP_SOFT_UP,
    };

    private enum DelayOff_Group_Func
    {
        KEY_CARD,
        KEYLESS,
        IP_TIMER_TOGGLE,
        IP_TIMER_RETRIGGER,
        CURTAIN,
        ENTRANCE,
        IP_SWITCH,
        IP_SWITCH_INVERT,
    };

    private enum Ramp_Group_Func
    {
        IP_SOFT_DOWN,       
    };

    private enum AC_Group_Func
    {
        // RS485 config
        AC_RS485_CFG,

        // Output
        OUTPUT_AC,
        // Input function
        AC_FAN_LMH,
        AC_FAN_SPEED,
        AC_FAN_LOW,
        AC_FAN_MED,
        AC_FAN_HIGH,
        AC_TEMP_DOWN,
        AC_TEMP_UP,
        AC_TEMP_TYPE,
        AC_POWER,
        AC_MODE,
        SW_INV_AC_OFF,
        SW_INV_AC_ECO,
    };
    
    private enum AC_Local_BoardType
    {
        Input_RCU_16RL_16AO,
        Input_RCU_24RL_8AO,
        Input_RCU_32AO,
        Input_RCU_8RL_24AO,
        Input_RLC_new,
        Input_RLC_new_20_ports,
        Input_RLC,
        Input_RCU_11IN_4RL,
        Input_RCU_21IN_8RL,
        Input_RCU_21IN_8RL_4AO,
        Input_RCU_21IN_8RL_4AI,
        Input_RCU_21IN_8RL_K,
        Input_RCU_21IN_10RL,
        Input_RCU_21IN_10RL_T,
        Input_RCU_30IN_10RL,
        Input_RCU_48IN_16RL,
        Input_RCU_48IN_16RL_4AO,
        Input_RCU_48IN_16RL_4AI,
        Input_RCU_48IN_16RL_K,
        Input_RCU_48IN_16RL_DL,
        Input_GNT_ETH_2KDL,
    }

    private Boolean Check_In_Group(string func, string[] group_list)
    {
        Boolean is_in_group = false;

        foreach (string group_str in group_list)
        {
            if (func == group_str)
            {
                is_in_group = true;
                break;
            }
        }

        return is_in_group;
    }    
}
