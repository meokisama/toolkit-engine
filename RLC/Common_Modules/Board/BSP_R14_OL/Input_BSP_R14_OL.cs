using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using System.IO;

using System.Net;
using System.Net.Sockets;
using System.Net.NetworkInformation;
using System.Collections;
using System.Threading;
using System.Runtime.InteropServices;
using System.Reflection;

namespace RLC
{
    public partial class Input_BSP_R14_OL : Form
    {
        int act;
        public string Group_path;
        public RLC1 XForm;
        const int SLInput_RLC = 14;
        const int SL_Lighting_Out = 0;
        int SL_local_AC;

        bool KTSave = true;
        ComboBox[] cbx_Function = new ComboBox[SLInput_RLC];
        ComboBox[] cbx_Group = new ComboBox[SLInput_RLC];
        Button[] Add_Group = new Button[SLInput_RLC];
        Button[] Config_IO = new Button[SLInput_RLC];
        Button[] Edit_Group = new Button[SLInput_RLC];
        Button[] Input_On = new Button[SLInput_RLC];
        Button[] Input_Off = new Button[SLInput_RLC];
        public bool IOcheck = false;
        string BasicInfo = "";
        public int input_Index;
        private Board_Attribute board_att = new Board_Attribute();

        public RLC1.IOProperty[] IO;
        List<string> rs485_cfg_list = new List<string>(); 

        public Input_BSP_R14_OL()
        {
            InitializeComponent();

            SL_local_AC = board_att.get_num_local_ac(this.Name);
        }

        public void Initialize(RLC1 Form)
        {
            this.XForm = Form;
            XForm.Light_Out_Info2 = new Light_Out_Cfg.output_info2_t[SL_Lighting_Out];
            XForm.AC_Out_Configs = new AC_Out_Cfg.ac_out_cfg_t[SL_local_AC];
            XForm.InputNetwork = new RLC1.IOProperty[SLInput_RLC];
        }

        private void AddComponent()
        {
            string[] Func = Enum.GetNames(typeof(Board_Attribute.Input_Func_List));

            int loc_x, loc_y;
            int inputh, inputl;
            inputh = 1;
            int dem = 0;
            for (int i = 0; i < 1; i++)
            {
                loc_x = 22 + 450 * i;
                inputl = 0;
                loc_y = 16;
                for (int j = 0; j < SLInput_RLC; j++)
                {

                    if (j != 0)
                    {
                        loc_y = loc_y + 50;
                    }
                    inputl++;

                    if ((XForm.confignetwork == true))
                    {
                        //btn Input on
                        Input_On[dem] = new Button();
                        Input_On[dem].Size = new Size(21, 21);
                        //Input_On[dem].Location = new Point(70, loc_y - 5);    //edited by Hoai An
                        Input_On[dem].Location = new Point(92, loc_y - 5);
                        Input_On[dem].Visible = true;
                        Input_On[dem].Image = RLC.Properties.Resources.lon22;
                        Input_On[dem].Click += new System.EventHandler(Input_On_Click);
                        Input_On[dem].Name = dem.ToString();
                        panel1.Controls.Add(Input_On[dem]);

                        //btn Input off
                        Input_Off[dem] = new Button();
                        Input_Off[dem].Size = new Size(21, 21);
                        Input_Off[dem].Location = new Point(92, loc_y - 5);
                        Input_Off[dem].Visible = true;
                        Input_Off[dem].Image = RLC.Properties.Resources.loff21;
                        Input_Off[dem].Click += new System.EventHandler(Input_Off_Click);
                        Input_Off[dem].Name = dem.ToString();
                        panel1.Controls.Add(Input_Off[dem]);
                    }

                    //label Input

                    Label lb = new Label();
                    Label lbf = new Label();
                    //lb.Text = "Input " + ((inputh - 1) * 3 + inputl).ToString();
                    lb.Text = "Input " + inputl;
                    lb.Size = new Size(lb.Size.Width, 13);
                    lb.Top = loc_y;
                    lb.Left = loc_x;
                    panel1.Controls.Add(lb);


                    //label function
                    lbf.Text = "Function";
                    lbf.Top = loc_y;
                    lbf.Left = loc_x + 196;
                    lbf.Size = new Size(lbf.Size.Width, 13);
                    panel1.Controls.Add(lbf);





                    //combobox Group
                    cbx_Group[dem] = new ComboBox();
                    cbx_Group[dem].Size = new Size(150, 21);
                    cbx_Group[dem].Location = new Point(loc_x + 3, loc_y + 18);
                    cbx_Group[dem].DropDownStyle = ComboBoxStyle.DropDownList;
                    board_att.Add_Group_To_ComboBox(XForm, Board_Attribute.Input_Func_List.IP_UNUSED.ToString(), cbx_Group[dem]);
                    cbx_Group[dem].SelectedIndexChanged += new System.EventHandler(GroupChange);
                    cbx_Group[dem].MouseWheel += new MouseEventHandler(comboBox_MouseWheel);

                    panel1.Controls.Add(cbx_Group[dem]);
                    cbx_Group[dem].SelectedIndex = 0;

                    //combobox Function
                    cbx_Function[dem] = new ComboBox();
                    cbx_Function[dem].Size = new Size(150, 21);
                    cbx_Function[dem].Location = new Point(loc_x + 196, loc_y + 18);
                    cbx_Function[dem].DropDownStyle = ComboBoxStyle.DropDownList;
                    cbx_Function[dem].Name = dem.ToString();
                    cbx_Function[dem].Items.AddRange(Func);
                    cbx_Function[dem].SelectedIndex = 0;
                    cbx_Function[dem].SelectedIndexChanged += new System.EventHandler(FunctionChange);
                    cbx_Function[dem].MouseWheel += new MouseEventHandler(comboBox_MouseWheel);
                    panel1.Controls.Add(cbx_Function[dem]);


                    //Button Add
                    Add_Group[dem] = new Button();
                    Add_Group[dem].Size = new Size(21, 21);
                    Add_Group[dem].Location = new Point(loc_x + 154, loc_y + 18);
                    Add_Group[dem].Image = RLC.Properties.Resources.add1;
                    Add_Group[dem].Click += new System.EventHandler(Add_Group_Click);
                    Add_Group[dem].Name = dem.ToString();
                    panel1.Controls.Add(Add_Group[dem]);


                    //Button Edit
                    Edit_Group[dem] = new Button();
                    Edit_Group[dem].Size = new Size(21, 21);
                    Edit_Group[dem].Location = new Point(loc_x + 175, loc_y + 18);
                    Edit_Group[dem].Image = RLC.Properties.Resources.edit_16;
                    Edit_Group[dem].Click += new System.EventHandler(Edit_Group_Click);
                    Edit_Group[dem].Name = dem.ToString();
                    panel1.Controls.Add(Edit_Group[dem]);


                    //Button Config
                    Config_IO[dem] = new Button();
                    Config_IO[dem].Size = new Size(23, 23);
                    Config_IO[dem].Location = new Point(loc_x + 346, loc_y + 17);
                    Config_IO[dem].Image = RLC.Properties.Resources.config;
                    Config_IO[dem].Name = dem.ToString();
                    Config_IO[dem].Click += new System.EventHandler(Config_Click);
                    panel1.Controls.Add(Config_IO[dem]);

                    dem = dem + 1;

                    if (inputl == SLInput_RLC)
                    {
                        inputl = 0;
                        inputh++;
                    }
                }
            }
        }

        private void LoadConfig(string filePath)
        {
            StreamReader rd = File.OpenText(filePath);
            string input = null;
            BasicInfo = rd.ReadLine();
            int dem = -1;
            while ((input = rd.ReadLine()) != null)
            {
                if (input.Contains("RS485") == true)
                {
                    rs485_cfg_list.Add(input);
                }
                else
                {
                    int count = 0;
                    dem++;
                    string s = "";
                    for (int i = 0; i < input.Length; i++)
                    {
                        if (input[i] != ',') s = s + input[i];
                        else
                        {
                            if (count == 0)
                            {
                                IO[dem].Input = Convert.ToInt16(s);
                                s = "";
                                count++;
                            }
                            else if (count == 1)
                            {
                                IO[dem].Function = Convert.ToInt16(s);
                                s = "";
                                count++;
                            }
                            else if (count == 2)
                            {
                                IO[dem].Ramp = Convert.ToInt16(s);
                                s = "";
                                count++;
                            }
                            else if (count == 3)
                            {
                                IO[dem].Preset = Convert.ToInt16(s);
                                s = "";
                                count++;
                            }
                            else if (count == 4)
                            {
                                IO[dem].Led_Status = Convert.ToInt16(s);
                                s = "";
                                count++;
                            }
                            else if (count == 5)
                            {
                                IO[dem].Auto_Mode = Convert.ToInt16(s);
                                s = "";
                                count++;
                            }
                            else if (count == 6)
                            {
                                IO[dem].Auto_Time = Convert.ToInt16(s);
                                s = "";
                                count++;
                            }
                            else if (count == 7)
                            {
                                IO[dem].DelayOff = Convert.ToInt16(s);
                                s = "";
                                count++;
                            }
                            else if (count == 8)
                            {
                                IO[dem].DelayOn = Convert.ToInt16(s);
                                s = "";
                                count++;
                            }
                            else if (count == 9)
                            {
                                IO[dem].NumGroup = Convert.ToInt16(s);
                                s = "";
                                count++;
                                IO[dem].Group = new int[IO[dem].NumGroup];
                                IO[dem].Preset_Group = new byte[IO[dem].NumGroup];
                                int cnt = 0, dem1 = 0;

                                for (int j = i + 1; j < input.Length; j++)
                                {
                                    if (input[j] != ',') s = s + input[j];
                                    else
                                    {
                                        if (cnt == 0)
                                        {
                                            IO[dem].Group[dem1] = Convert.ToInt16(s);
                                            s = "";
                                            cnt++;
                                        }
                                        else
                                        {
                                            IO[dem].Preset_Group[dem1] = Convert.ToByte(s);
                                            s = "";
                                            cnt = 0;
                                            dem1++;
                                        }
                                    }
                                }
                                break;
                            }

                        }
                    }
                    if (IO[dem].NumGroup == 0) cbx_Group[dem].SelectedIndex = 0;
                    else
                    {
                        Byte index = board_att.Get_group_index(XForm, Convert.ToByte(IO[dem].Group[0]), board_att.Get_Input_Func_Name(IO[dem].Function));

                        if (index == 0 && IO[dem].Group[0] != 0)
                        {
                            string new_grp_name = "";

                            index = board_att.Recover_Group_To_Database(XForm, Convert.ToByte(IO[dem].Group[0]), board_att.Get_Input_Func_Name(IO[dem].Function), ref new_grp_name);
                        }

                        cbx_Group[dem].SelectedIndex = index;
                    }
                    // Assign the function index
                    string[] function_list = cbx_Function[dem].Items.Cast<Object>().Select(item => item.ToString()).ToArray();

                    cbx_Function[dem].SelectedIndex = board_att.Get_Function_Index(function_list, IO[dem].Function);
                }
            }
            rd.Close();
        }
        private void SaveUnit(string filePath)
        {
            FileStream fs;
            fs = new FileStream(filePath, FileMode.Create);
            StreamWriter sWriter = new StreamWriter(fs, Encoding.UTF8);
            string Data;
            sWriter.WriteLine(BasicInfo);
            foreach (string cfg in rs485_cfg_list)
            {
                sWriter.WriteLine(cfg);
            }
            sWriter.Flush();
            for (int i = 0; i < SLInput_RLC; i++)
            {
                Data = IO[i].Input.ToString() + "," + IO[i].Function.ToString() + "," + IO[i].Ramp.ToString() + "," + IO[i].Preset.ToString() + ",";
                Data = Data + IO[i].Led_Status.ToString() + "," + IO[i].Auto_Mode.ToString() + "," + IO[i].Auto_Time.ToString() + "," + IO[i].DelayOff.ToString() + ",";
                Data = Data + IO[i].DelayOn.ToString() + "," + IO[i].NumGroup.ToString() + ",";
                for (int j = 0; j < IO[i].NumGroup; j++)
                    Data = Data + IO[i].Group[j].ToString() + "," + IO[i].Preset_Group[j].ToString() + ",";
                sWriter.WriteLine(Data);
                sWriter.Flush();
            }
            fs.Close();
        }

        private void Input_Bedside_Load(object sender, EventArgs e)
        {
            IO = new RLC1.IOProperty[SLInput_RLC];
            for (int i = 0; i < SLInput_RLC; i++)
                IO[i].Led_Status = 18;

            AddComponent();

            if (XForm.confignetwork == false) LoadConfig(XForm.Unit_Path);
            else
            {
                IO = XForm.InputNetwork;

                for (int dem = 0; dem < SLInput_RLC; dem++)
                {
                    if (IO[dem].NumGroup == 0) cbx_Group[dem].SelectedIndex = 0;
                    else
                    {
                        Byte index = board_att.Get_group_index(XForm, Convert.ToByte(IO[dem].Group[0]), board_att.Get_Input_Func_Name(IO[dem].Function));

                        if (index == 0 && IO[dem].Group[0] != 0)
                        {
                            string new_grp_name = "";

                            index = board_att.Recover_Group_To_Database(XForm, Convert.ToByte(IO[dem].Group[0]), board_att.Get_Input_Func_Name(IO[dem].Function), ref new_grp_name);
                        }

                        cbx_Group[dem].SelectedIndex = index;
                    }
                    // Assign the function index
                    string[] function_list = cbx_Function[dem].Items.Cast<Object>().Select(item => item.ToString()).ToArray();

                    cbx_Function[dem].SelectedIndex = board_att.Get_Function_Index(function_list, IO[dem].Function);
                }
            }
            timer3.Enabled = true;
            timer3.Start();
            btn_apply.Enabled = false;
            KTSave = true;
        }

        public void Add_Group_Click(object sender, EventArgs e)
        {
            act = 0;
            this.Enabled = false;
            XForm.form = 1;
            XForm.enableGetState = false;
            timer2.Start();

            int index = Array.IndexOf(Add_Group, (sender as Button));
            string func = cbx_Group[index].Tag.ToString();

            XForm.add_group(board_att.get_group_type_from_func(func));

        }
        public void Edit_Group_Click(object sender, EventArgs e)
        {
            act = 1;
            Button bt = (Button)sender;
            try
            {
                if (cbx_Group[Convert.ToInt16(bt.Name)].SelectedIndex == 0) return;
                XForm.gr_Group.CurrentCell = XForm.gr_Group.Rows[cbx_Group[Convert.ToInt16(bt.Name)].SelectedIndex - 1].Cells[0];
            }
            catch
            {

            }
            this.Enabled = false;
            XForm.form = 1;
            XForm.enableGetState = false;
            timer2.Start();

            int index = Array.IndexOf(Edit_Group, (sender as Button));
            string group_type = board_att.get_group_type_from_func(cbx_Function[index].SelectedItem.ToString());
            BindingList<RLC1.group_def> group = board_att.Get_group_list_from_type(XForm, group_type);
            int group_idx = cbx_Group[index].SelectedIndex;
            XForm.edit_group(group_type, group.ElementAt(group_idx).name, group.ElementAt(group_idx).value, board_att.Get_group_desc(XForm, group_type, group.ElementAt(group_idx).value));
        }

        private void Config_Click(object sender, EventArgs e)
        {
            KTSave = false;
            btn_apply.Enabled = true;
            ConfigIO_BSP_R14_OL Config = new ConfigIO_BSP_R14_OL();            

            Button bt = (Button)sender;
            string s = cbx_Function[Convert.ToInt16(bt.Name)].SelectedItem.ToString();

            input_Index = Convert.ToInt16(bt.Name);

            if (cbx_Function[Convert.ToInt16(bt.Name)].SelectedIndex == 0) return;
            else
            {
                this.Enabled = false;

                if (board_att.Check_Multi_Group_Func(s) == true)// in group list
                {
                    Config.MulGroup_Check = true;
                    if (board_att.Check_Key_Card_Group_Func(s) == true) Config.Keycard_Check = true;
                }
                if (board_att.Check_Ramp_Preset_Group_Func(s) == true)
                {
                    Config.Ramp_Check = true;
                    Config.Preset_Check = true;
                }
                if (board_att.Check_DelayOff_Group_Func(s) == true)
                {
                    Config.DelayOff_Check = true;
                }
                if (board_att.Check_Ramp_Group_Func(s) == true)
                {
                    Config.Ramp_Check = true;
                }
                Config.input_func = s;
            }
            XForm.enableGetState = false;
            IOcheck = true;
            Config.Initialize(this);
            Config.Show();
            Config.Focus();
        }

        private void btn_apply_Click(object sender, EventArgs e)
        {
            string announce = "Are you sure to save config to database?";
            if (XForm.confignetwork == true) announce = "Are you sure to save config to unit in network?";
            DialogResult lkResult = MessageBox.Show(announce, "Save Unit", MessageBoxButtons.YesNo);
            string s;
            if (lkResult == DialogResult.Yes)
            {
                for (int i = 0; i < SLInput_RLC; i++)
                {
                    IO[i].Input = i;
                    IO[i].Function = board_att.Get_Function_Value(cbx_Function[i].Text);

                    s = cbx_Function[i].SelectedItem.ToString();

                    if (board_att.Check_Multi_Group_Func(s) == false) // not in group list
                    {
                        if (cbx_Group[i].Text != "<Unused>")
                        {
                            string group_type = board_att.get_group_type_from_func(cbx_Group[i].Tag.ToString());
                            IO[i].NumGroup = 1;
                            IO[i].Group = new int[1];
                            IO[i].Preset_Group = new byte[1];
                            IO[i].Group[0] = board_att.Get_group_value_from_name(XForm, group_type, cbx_Group[i].Text);
                            IO[i].Preset_Group[0] = 0;
                        }
                        else
                        {
                            IO[i].NumGroup = 0;
                        }
                    }
                }

                btn_apply.Enabled = false;
                KTSave = true;
                if (XForm.confignetwork == false) SaveUnit(XForm.Unit_Path);
                else XForm.InputNetwork = IO;
            }
        }

        private void btn_ok_Click(object sender, EventArgs e)
        {
            if (KTSave == false) btn_apply_Click(sender, e);
            if (XForm.confignetwork == true)
            {
                int index = XForm.grBoardNetwork.CurrentCell.RowIndex;
                string IP = XForm.grBoardNetwork[2, index].Value.ToString();
                string ID = XForm.grBoardNetwork[3, index].Value.ToString();
                XForm.SaveConfigNetwork(IP, ID, SLInput_RLC, SL_local_AC, SL_Lighting_Out);
            }
            Close();
        }

        private void btn_cancel_Click(object sender, EventArgs e)
        {

            this.Close();
        }

        private void Input_Bedside_FormClosing(object sender, FormClosingEventArgs e)
        {
            XForm.Enabled = true;
            XForm.confignetwork = false;
            timer3.Stop();
            timer3.Enabled = false;
            XForm.Focus();
        }

        private void timer1_Tick(object sender, EventArgs e)
        {
            if (XForm.form == 0)
            {
                timer2.Stop();

                if (IOcheck == false)
                {
                    this.Enabled = true;
                    this.Focus();
                }
            }
        }
        private void GroupChange(object sender, EventArgs e)
        {
            KTSave = false;
            btn_apply.Enabled = true;
        }
        private void FunctionChange(object sender, EventArgs e)
        {
            KTSave = false;
            btn_apply.Enabled = true;
            ComboBox cbx = (ComboBox)sender;
            string s = cbx.SelectedItem.ToString();

            board_att.Add_Group_To_ComboBox(XForm, s, cbx_Group[Convert.ToInt16(cbx.Name)]);

            if (board_att.Check_Multi_Group_Func(s) == true) // in group list
            {
                cbx_Group[Convert.ToInt16(cbx.Name)].SelectedIndex = 0;
                cbx_Group[Convert.ToInt16(cbx.Name)].Enabled = false;
            }
            else cbx_Group[Convert.ToInt16(cbx.Name)].Enabled = true;

        }

        void comboBox_MouseWheel(object sender, MouseEventArgs e)
        {
            ((HandledMouseEventArgs)e).Handled = true;
        }

        private void panel1_MouseEnter(object sender, EventArgs e)
        {
            panel1.Focus();
        }

        private void Input_Off_Click(object sender, EventArgs e)
        {
            Button bt = (Button)sender;
            int index = XForm.grBoardNetwork.CurrentCell.RowIndex;
            string IP = XForm.grBoardNetwork[2, index].Value.ToString();
            string ID = XForm.grBoardNetwork[3, index].Value.ToString();
            //Set_Input_State(IP, ID, 0, Convert.ToByte(bt.Name));
            Set_Input_State(IP, ID, 255, Convert.ToByte(bt.Name));  //edited by Hoai An
            bt.Visible = false;
            Input_On[Convert.ToByte(bt.Name.ToString())].Visible = true;
        }

        private void Input_On_Click(object sender, EventArgs e)
        {
            Button bt = (Button)sender;
            int index = XForm.grBoardNetwork.CurrentCell.RowIndex;
            string IP = XForm.grBoardNetwork[2, index].Value.ToString();
            string ID = XForm.grBoardNetwork[3, index].Value.ToString();
            //Set_Input_State(IP, ID, 255, Convert.ToByte(bt.Name));
            Set_Input_State(IP, ID, 0, Convert.ToByte(bt.Name));    //edited by Hoai An
            bt.Visible = false;
            Input_Off[Convert.ToByte(bt.Name.ToString())].Visible = true;
        }

        private void Set_Input_State(string IP, string ID, byte state, byte input)
        {
            IPEndPoint ep = new IPEndPoint(IPAddress.Parse(IP), RLC.RLC1.UDPPort);
            Socket s = new Socket(AddressFamily.InterNetwork, SocketType.Dgram, ProtocolType.Udp);
            IPEndPoint AnyIP = new IPEndPoint(IPAddress.Any, 0);
            EndPoint rm = new IPEndPoint(IPAddress.Any, 0);
            s.ReceiveTimeout = 1000;

            int cnt;
            byte[] DuLieuTuBo;
            DuLieuTuBo = new byte[1024];

            try
            {
                Byte[] Data;    //<Address><length><CMD><Data><CRC> 
                Data = new Byte[1024];
                int SumCRC = 0;

                Data[0] = Convert.ToByte(XForm.Substring('.', 3, ID));
                Data[1] = Convert.ToByte(XForm.Substring('.', 2, ID));
                Data[2] = Convert.ToByte(XForm.Substring('.', 1, ID));
                Data[3] = Convert.ToByte(XForm.Substring('.', 0, ID));

                Data[4] = 6;
                Data[5] = 0;

                Data[6] = 10;
                Data[7] = 60;

                Data[8] = input;
                Data[9] = state;

                for (int i = 4; i < Data[4] + 4; i++)
                    SumCRC = SumCRC + Data[i];

                Data[11] = (byte)(SumCRC / 256);
                Data[10] = (byte)(SumCRC - Data[11] * 256);

                s.SendTo(Data, Data[4] + 6, SocketFlags.None, ep);
                cnt = s.ReceiveFrom(DuLieuTuBo, ref rm);
            }
            catch
            {
                s.Close();
                MessageBox.Show("Can't connect to unit IP : " + IP + "   ID : " + ID, "Network Error");
            }
        }

        private bool Get_Input_State(string IP, string ID)
        {
            bool sentFlag = false;

            IPEndPoint ep = new IPEndPoint(IPAddress.Parse(IP), RLC.RLC1.UDPPort);
            Socket s = new Socket(AddressFamily.InterNetwork, SocketType.Dgram, ProtocolType.Udp);
            IPEndPoint AnyIP = new IPEndPoint(IPAddress.Any, 0);
            EndPoint rm = new IPEndPoint(IPAddress.Any, 0);
            s.ReceiveTimeout = 1000;

            int cnt, len;
            byte[] DuLieuTuBo;
            DuLieuTuBo = new byte[1024];

            try
            {
                Byte[] Data;    //<Address><length><CMD><Data><CRC> 
                Data = new Byte[1024];
                int SumCRC = 0;

                Data[0] = Convert.ToByte(XForm.Substring('.', 3, ID));
                Data[1] = Convert.ToByte(XForm.Substring('.', 2, ID));
                Data[2] = Convert.ToByte(XForm.Substring('.', 1, ID));
                Data[3] = Convert.ToByte(XForm.Substring('.', 0, ID));

                Data[4] = 4;
                Data[5] = 0;

                Data[6] = 10;
                Data[7] = 63;

                for (int i = 4; i < Data[4] + 4; i++)
                    SumCRC = SumCRC + Data[i];

                Data[Data[4] + 4] = (byte)(SumCRC % 256);
                Data[Data[4] + 5] = (byte)(SumCRC / 256);

                s.SendTo(Data, Data[4] + 6, SocketFlags.None, ep);
                cnt = s.ReceiveFrom(DuLieuTuBo, ref rm);
                len = DuLieuTuBo[5] * 256 + DuLieuTuBo[4];
                if (len >= SLInput_RLC + 4)
                {
                    for (int i = 0; i < SLInput_RLC; i++)
                    {
                        if (DuLieuTuBo[8 + i] > 0)
                        {
                            if (Input_On[i].Visible == false)
                                Input_On[i].Visible = true;
                            if (Input_Off[i].Visible == true)
                                Input_Off[i].Visible = false;
                        }
                        else
                        {
                            if (Input_On[i].Visible == true)
                                Input_On[i].Visible = false;
                            if (Input_Off[i].Visible == false)
                                Input_Off[i].Visible = true;
                        }
                    }
                }
                sentFlag = true;
            }
            catch
            {
                for (int i = 0; i < SLInput_RLC; i++)
                {
                    if (Input_On[i].Visible == true)
                        Input_On[i].Visible = false;
                    if (Input_Off[i].Visible == true)
                        Input_Off[i].Visible = false;
                }
                s.Close();

            }
            return sentFlag;
        }

        private void timer3_Tick(object sender, EventArgs e)
        {
            if (XForm.confignetwork == true)
            {
                if (XForm.enableGetState == true)
                {
                    int index = XForm.grBoardNetwork.CurrentCell.RowIndex;
                    string IP = XForm.grBoardNetwork[2, index].Value.ToString();
                    string ID = XForm.grBoardNetwork[3, index].Value.ToString();
                    Get_Input_State(IP, ID);
                }
            }
        }
    }
}

