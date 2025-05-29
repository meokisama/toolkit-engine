

using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Runtime.Serialization.Formatters.Binary;
using System.Text;
using System.Windows.Forms;

namespace RLC
{
    public partial class RS485_Config : Form
    {
        enum RS485_Type
        {
            RS485_NONE,
            RS485_MASTER_TC300,
            RS485_MASTER_TC303,
            RS485_MASTER_TC903,
            RS485_MASTER_TC907,
            RS485_MASTER_SE8300,
            RS485_MASTER_P_22RTM,
            RS485_MASTER_ABB,
            RS485_MASTER_DAIKIN = 10,
            RS485_MASTER_MITSU,
            RS485_MASTER_LG,
            RS485_MASTER_SAMSUNG_F1F2,
            RS485_MASTER_SAMSUNG_F3F4,
            RS485_MASTER_HITACHI,
            RS485_MASTER_SANYO,
            RS485_MASTER_RISHUN = 17,
            RS485_MASTER_LAFFEY,
            RS485_MASTER_HAFELE,
            RS485_SLAVE_RLG = 20,
            RS485_MASTER_RLG,
            RS485_SLAVE_RTU,
            RS485_MASTER_RTU,
            RS485_SLAVE_ASCII,
            RS485_MASTER_ASCII,
            RS485_SLAVE_TC300,
            RS485_SLAVE_TC303,
            RS485_SLAVE_LINK,
            RS485_MASTER_LINK,
            RS485_SLAVE_DMX,
            RS485_MASTER_DMX,
            RS485_BACNET,
            RS485_RESI_DALI,
            SAMSUNG_OUTDOOR_F1F2 = 40,
            SAMSUNG_INDOOR_F3F4,
            D3_NET = 42,
            P1P2,
            RS485_OTHER = 255,
        }
        public const Byte RS485_MAX_CONFIG  = 2;
        public const Byte SLAVE_MAX_DEVS    = 10;
        const Byte SLAVE_MAX_INDOORS = 16;

        Add_Unit Parent_Form;
        RLC1 Host_Form;
        Array slave_cfg_tab_Layout;
        Array RS485_cfg_tab_Layout;

        ComboBox[] ind_array;

        [Serializable()]        
        public class slave_cfg_t
        {
            public Byte     slave_id = 1;
            public Byte     slave_group;
            public Byte     num_indoors;
            public Byte[]   indoor_group = new Byte[SLAVE_MAX_INDOORS];
        };

        [Serializable()]        
        public class RS485_cfg_t
        {
            public UInt32           baudrate = 9600;
            public Byte             parity;
            public Byte             stop_bit;
            public Byte             board_id = 1;
            public Byte             config_type;
            public Byte             num_slave_devs;
            public Byte[]           reserved  = new Byte[5];
            public slave_cfg_t[]    slave_cfg = new slave_cfg_t[SLAVE_MAX_DEVS];
        };

        RS485_cfg_t[] RS485_cfg;        
        Byte RS485_num_module = RS485_MAX_CONFIG;
        Board_Attribute board_att = new Board_Attribute();

        public RS485_Config()
        {
            InitializeComponent();
        }
        public void Initialize(Add_Unit Form, RS485_cfg_t[] cfg)
        {            
            this.Parent_Form = Form;
            this.Host_Form = Form.XForm;
                                                                                                                                                                
            RS485_cfg = new RS485_cfg_t[cfg.Length];
            for (int i = 0; i < RS485_cfg.Length; i++)
            {
                RS485_cfg[i] = new RS485_cfg_t();
                for (int j = 0; j < SLAVE_MAX_DEVS; j++)
                {
                    RS485_cfg[i].slave_cfg[j] = new slave_cfg_t();
                }
                // Save the old value   
                 
                RS485_cfg[i] = board_att.DeepCopy<RS485_cfg_t>(cfg[i]);
            }                        

            RS485_num_module = Convert.ToByte(RS485_cfg.Length);
        }

        private void RS485_Config_Load(object sender, EventArgs e)
        {
            Board_Attribute board_att = new Board_Attribute();
            ind_array = new ComboBox[SLAVE_MAX_INDOORS] { Ind1_grp, Ind2_grp, Ind3_grp, Ind4_grp, Ind5_grp, Ind6_grp, Ind7_grp, Ind8_grp, Ind9_grp, Ind10_grp, Ind11_grp, Ind12_grp, Ind13_grp, Ind14_grp, Ind15_grp, Ind16_grp };

            // Add combox box RS485 type
            RS485_type_cbx.DataSource = Enum.GetValues(typeof(RS485_Type));
            RS485_type_cbx.SelectedIndexChanged += new System.EventHandler(this.RS485_type_cbx_SelectedIndexChanged);

            if (RS485_num_module > 0)
            {
                // Store the RS485 config config layout
                RS485_cfg_tab_Layout = new Control[RS485_cfg_tab_ctrl.TabPages[0].Controls.Count];
                RS485_cfg_tab_ctrl.TabPages[0].Controls.CopyTo(RS485_cfg_tab_Layout, 0);

                // Store the slave config layout
                slave_cfg_tab_Layout = new Control[tab_slave_cfg.TabPages[0].Controls.Count];
                tab_slave_cfg.TabPages[0].Controls.CopyTo(slave_cfg_tab_Layout, 0);

            
                for (int i = 1; i < RS485_num_module; i++)
                {
                    TabPage tpNew = new TabPage();

                    tpNew.Text = "RS485-" + (i + 1).ToString();
                    tpNew.UseVisualStyleBackColor = true;
                    RS485_cfg_tab_ctrl.TabPages.Add(tpNew);
                }

                // Add group for Slave                       
                board_att.Add_Group_To_ComboBox(Host_Form, Board_Attribute.config_func.AC_RS485_CFG.ToString(), slave_grp_cbx);
                slave_grp_cbx.SelectedIndexChanged += new EventHandler(slave_grp_cbx_SelectedIndexChanged);

                // Add group for slave indoors
                for (int i = 0; i < SLAVE_MAX_INDOORS; i++)
                {                    
                    board_att.Add_Group_To_ComboBox(Host_Form, Board_Attribute.config_func.AC_RS485_CFG.ToString(), ind_array[i]);
                    ind_array[i].SelectedIndexChanged += new EventHandler(indoor_group_change);
                }
                

                Load_RS585_Config_layout(0);
            }
            else
            {
                this.Close();
            }


        }        
               
        private void num_slave_SelectedIndexChanged(object sender, EventArgs e)
        {                        
            int num_slave_devs = num_slave_cbx.SelectedIndex;

            int index = RS485_cfg_tab_ctrl.SelectedIndex;

            RS485_cfg[index].num_slave_devs = Convert.ToByte(num_slave_devs);

            if (num_slave_devs == 0)
            {
                tab_slave_cfg.Enabled = false;
                while (tab_slave_cfg.TabPages.Count > 1)
                {
                    tab_slave_cfg.TabPages.Remove(tab_slave_cfg.TabPages[tab_slave_cfg.TabPages.Count - 1]);
                }
            }
            else
            {
                //tab_slave_cfg.Enabled = RS485_type_cbx.SelectedItem.ToString().Contains("MASTER");
                
                while (tab_slave_cfg.TabPages.Count > 1)
                {
                    tab_slave_cfg.TabPages.Remove(tab_slave_cfg.TabPages[tab_slave_cfg.TabPages.Count - 1]);
                }

                for (int i = 1; i < num_slave_devs; i++)
                {
                    TabPage tpNew = new TabPage();

                    tpNew.Text = "Slave" + (i + 1).ToString();
                    tpNew.UseVisualStyleBackColor = true;
                    tab_slave_cfg.TabPages.Add(tpNew);
                }
            }

            
        }           

        private void tab_slave_cfg_SelectedIndexChanged(object sender, EventArgs e)
        {
            // AddRange each time you change a tab.            
            tab_slave_cfg.TabPages[tab_slave_cfg.SelectedIndex].Controls.AddRange((Control[])slave_cfg_tab_Layout);
            Load_Slave_Config_layout(RS485_cfg_tab_ctrl.SelectedIndex, tab_slave_cfg.SelectedIndex);
        }

        private void RS485_cfg_tab_ctrl_SelectedIndexChanged(object sender, EventArgs e)
        {
            // AddRange each time you change a tab.            
            RS485_cfg_tab_ctrl.TabPages[RS485_cfg_tab_ctrl.SelectedIndex].Controls.AddRange((Control[])RS485_cfg_tab_Layout);
            Load_RS585_Config_layout(RS485_cfg_tab_ctrl.SelectedIndex);
        }

        private void num_indoor_cbx_SelectedIndexChanged(object sender, EventArgs e)
        {
            int RS485_index = RS485_cfg_tab_ctrl.SelectedIndex;
            int slave_index = tab_slave_cfg.SelectedIndex;

            RS485_cfg[RS485_index].slave_cfg[slave_index].num_indoors = Convert.ToByte(num_indoor_cbx.SelectedIndex);

            for (int i = 0 ; i < SLAVE_MAX_INDOORS; i++)
            {
                if (i < (num_indoor_cbx.SelectedIndex))
                {
                    ind_array[i].Enabled = true;
                }
                else
                {
                    ind_array[i].Enabled = false;
                }
            }
        }        

        private void RS485_type_cbx_SelectedIndexChanged(object sender, EventArgs e)
        {
            int index = RS485_cfg_tab_ctrl.SelectedIndex;

            RS485_cfg[index].config_type = Convert.ToByte(RS485_type_cbx.SelectedValue);

            // If RS485 config type is SLAVE , we will disable the SLAVE config
            if (RS485_type_cbx.SelectedItem.ToString() == "RS485_NONE")
            {
                tab_slave_cfg.Enabled = false;
                num_slave_cbx.Enabled = false;
                board_id_txt.Enabled  = false;
            }
            else if (RS485_type_cbx.SelectedItem.ToString().Contains("SLAVE") == true)
            {
                tab_slave_cfg.Enabled = false;
                num_slave_cbx.Enabled = false;
                board_id_txt.Enabled = true;
            }
            else
            {
                if (RS485_cfg[index].num_slave_devs > 0)
                {
                    tab_slave_cfg.Enabled = true;
                }
                num_slave_cbx.Enabled = true;
                board_id_txt.Enabled = true;
            }
        }

        private void cancel_btn_Click(object sender, EventArgs e)
        {            
            this.Close();
        }

        private void ok_btn_Click(object sender, EventArgs e)
        {
            for (int i = 0; i < RS485_cfg.Length; i++ )
                Host_Form.RS485_Cfg[i] = board_att.DeepCopy<RS485_cfg_t>(RS485_cfg[i]);
            this.Close();
        }

        private void indoor_group_change(object sender, EventArgs e)
        {
            ComboBox cbx = (ComboBox)sender;
            int RS485_index = RS485_cfg_tab_ctrl.SelectedIndex;
            int slave_index = tab_slave_cfg.SelectedIndex;


            if (cbx.SelectedIndex >= 0)
            {
                for (int i = 0; i < ind_array.Length; i++)
                {
                    if (cbx == ind_array[i])
                    {
                        RS485_cfg[RS485_index].slave_cfg[slave_index].indoor_group[i] = Host_Form.air_cond_group.ElementAt(cbx.SelectedIndex).value;
                    }
                }
            } 
        }

        private void baudrate_cbx_SelectedIndexChanged(object sender, EventArgs e)
        {
            int index = RS485_cfg_tab_ctrl.SelectedIndex;

            RS485_cfg[index].baudrate = Convert.ToUInt32(baudrate_cbx.SelectedItem.ToString());
        }

        private void parity_cbx_SelectedIndexChanged(object sender, EventArgs e)
        {
            int index = RS485_cfg_tab_ctrl.SelectedIndex;

            RS485_cfg[index].parity = Convert.ToByte(parity_cbx.SelectedIndex);
        }

        private void stop_bit_cbx_SelectedIndexChanged(object sender, EventArgs e)
        {
            int index = RS485_cfg_tab_ctrl.SelectedIndex;

            RS485_cfg[index].stop_bit = Convert.ToByte(stop_bit_cbx.SelectedIndex);
        }

        private void board_id_txt_TextChanged(object sender, EventArgs e)
        {
            int index = RS485_cfg_tab_ctrl.SelectedIndex;
            Byte val = 0;

            if (Byte.TryParse(board_id_txt.Text, out val) == false)
            {
                board_id_txt.Text = RS485_cfg[index].board_id.ToString();
            }
            else
            {
                RS485_cfg[index].board_id = val;
            }
        }

        private void slave_id_txt_TextChanged(object sender, EventArgs e)
        {
            int RS485_index = RS485_cfg_tab_ctrl.SelectedIndex;
            int slave_index = tab_slave_cfg.SelectedIndex;
            Byte val = 0;

            if (Byte.TryParse(slave_id_txt.Text, out val) == false)
            {
                slave_id_txt.Text = RS485_cfg[RS485_index].slave_cfg[slave_index].slave_id.ToString();
            }
            else
            {
                RS485_cfg[RS485_index].slave_cfg[slave_index].slave_id = val;
            }
        }

        private void slave_grp_cbx_SelectedIndexChanged(object sender, EventArgs e)
        {
            int RS485_index = RS485_cfg_tab_ctrl.SelectedIndex;
            int slave_index = tab_slave_cfg.SelectedIndex;

            if (slave_grp_cbx.SelectedIndex >= 0)
            {
                RS485_cfg[RS485_index].slave_cfg[slave_index].slave_group = Host_Form.air_cond_group.ElementAt(slave_grp_cbx.SelectedIndex).value;
            }
        }

        /***************************************** HELPER FUNCTION ***********************************************/
        private void Load_RS585_Config_layout(int index)
        {
            // baudrate
            for (int i = 0; i < baudrate_cbx.Items.Count; i++)
            {
                if (Convert.ToUInt32(baudrate_cbx.Items[i].ToString()) == RS485_cfg[index].baudrate)
                {
                    baudrate_cbx.SelectedIndex = i;
                }
            }

            // parity
            parity_cbx.SelectedIndex = RS485_cfg[index].parity;

            // Stop bit
            stop_bit_cbx.SelectedIndex = RS485_cfg[index].stop_bit;

            // Board Id
            board_id_txt.Text = RS485_cfg[index].board_id.ToString();

            // Type    
            for (int i = 0; i < RS485_type_cbx.Items.Count; i++ )
            {
                if (Convert.ToByte(RS485_type_cbx.Items[i]) == RS485_cfg[index].config_type)
                {
                    RS485_type_cbx.SelectedIndex = i;
                    break;
                }
            }
            RS485_type_cbx_SelectedIndexChanged(null, null);

            // Num of slave
            num_slave_cbx.SelectedIndex = RS485_cfg[index].num_slave_devs;

            // Load slave config
            tab_slave_cfg.SelectedIndex = 0;
            Load_Slave_Config_layout(index, 0);
        }

        private void Load_Slave_Config_layout(int RS485_index, int slave_index)
        {            
            // Slave id
            slave_id_txt.Text = RS485_cfg[RS485_index].slave_cfg[slave_index].slave_id.ToString();

            // Slave group
            bool need_recover_group = true;
            for (int i = 0; i < Host_Form.air_cond_group.Count; i++)
            {                
                if (Host_Form.air_cond_group.ElementAt(i).value == RS485_cfg[RS485_index].slave_cfg[slave_index].slave_group)
                {
                    slave_grp_cbx.SelectedIndex = i;
                    need_recover_group = false;
                    break;
                }
            }
            if (need_recover_group)
            {
                string group_name = "";
                int index = board_att.Recover_Group_To_Database(Host_Form, RS485_cfg[RS485_index].slave_cfg[slave_index].slave_group, Board_Attribute.config_func.AC_RS485_CFG.ToString(), ref group_name);
                slave_grp_cbx.SelectedIndex = index;
            }

            // Num indoor            
            num_indoor_cbx.SelectedIndex = RS485_cfg[RS485_index].slave_cfg[slave_index].num_indoors;

            // Indoor groups
            for (int i = 0; i < SLAVE_MAX_INDOORS; i++)
            {
                need_recover_group = true;
                for (int grp_idx = 0; grp_idx < Host_Form.air_cond_group.Count; grp_idx++)
                    if (Host_Form.air_cond_group.ElementAt(grp_idx).value == RS485_cfg[RS485_index].slave_cfg[slave_index].indoor_group[i])
                    {
                        ind_array[i].SelectedIndex = grp_idx;
                        need_recover_group = false;
                        break;
                    }

                if (need_recover_group)
                {
                    string group_name = "";
                    int index = board_att.Recover_Group_To_Database(Host_Form, RS485_cfg[RS485_index].slave_cfg[slave_index].indoor_group[i], Board_Attribute.config_func.AC_RS485_CFG.ToString(), ref group_name);
                    ind_array[i].SelectedIndex = index;
                }
            }
        }

        private void RS485_Config_FormClosed(object sender, FormClosedEventArgs e)
        {
            Parent_Form.Enabled = true;
            Parent_Form.Focus();
        }

        private void Ind_grp_MouseHover(object sender, EventArgs e)
        {
            Control senderObject = sender as Control;
            ComboBox cbx = sender as ComboBox;
            tt_group_inf.SetToolTip(senderObject, cbx.Text);
        }

        private void RS485_type_cbx_SelectedIndexChanged_1(object sender, EventArgs e)
        {

        }

#if false
        private void slave_grp_cbx_DrawItem(object sender, DrawItemEventArgs e)
        {
            if (e.Index < 0) { return; }
            string text = slave_grp_cbx.GetItemText(slave_grp_cbx.Items[e.Index]);
            e.DrawBackground();
            using (SolidBrush br = new SolidBrush(e.ForeColor))
            { e.Graphics.DrawString(text, e.Font, br, e.Bounds); }
            if ((e.State & DrawItemState.Selected) == DrawItemState.Selected)
            { tt_group_inf.Show(text, slave_grp_cbx, e.Bounds.Right, e.Bounds.Bottom, 1000); }
            e.DrawFocusRectangle();
        }
#endif

    }
}
