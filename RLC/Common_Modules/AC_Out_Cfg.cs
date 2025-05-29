using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Windows.Forms;

namespace RLC
{
    public partial class AC_Out_Cfg : Form
    {
        public const UInt16 MIN_TEMP_SET_POINT = 150;
        public const UInt16 MAX_TEMP_SET_POINT = 350;

        public struct ac_out_cfg_t
        {
            public Byte     group;
            public Byte     enable;
            public Byte     windows_mode;
            public Byte     fan_type;
            public Byte     temp_type;
            public Byte     temp_unit;
            public Byte     valve_contact;
            public Byte     valve_type;
            public Byte     dead_band;
            public Byte     group_low_fan;
            public Byte     group_med_fan;
            public Byte     group_high_fan;
            public Byte     group_analog_fan;
            public Byte     group_analog_cool;
            public Byte     group_analog_heat;
            public Byte     group_cool_open;
            public Byte     group_cool_close;
            public Byte     group_heat_open;
            public Byte     group_heat_close;
            public Byte     windows;
            public Byte reserved0;
            public Byte reserved1;
            public Byte reserved2;
            public Byte reserved3;
            public Byte reserved4;
            public Byte reserved5;
            public Byte reserved6;
            public Byte reserved7;
            public Byte reserved8;
            public Byte reserved9;
            public Byte reserved10;
	        public Byte unoccupyPower;
	        public Byte occupyPower;
	        public Byte standbyPower;
	        public Byte unoccupyMode;
	        public Byte occupyMode;
	        public Byte standbyMode;
	        public Byte unoccupyFanSpeed;
	        public Byte occupyFanSpeed;
	        public Byte standbyFanSpeed;
	        public Int16 unoccupied_cool_point;
	        public Int16 occupied_cool_point;
	        public Int16 standby_cool_point;
	        public Int16 unoccupied_heat_point;
	        public Int16 occupied_heat_point;
	        public Int16 standby_heat_point;
            public UInt16 reserved11;
            public UInt16 reserved12;
            public UInt16 reserved13;
            public UInt16 reserved14;
            public UInt16 reserved15;
            public UInt16 reserved16;
        };
        
        public ac_out_cfg_t local_ac_cfg, prev_ac_cfg;
        public bool ac_change = false;
        private RLC1 host_ctrl;
        Board_Attribute board_attr = new Board_Attribute();

        public AC_Out_Cfg(RLC1 host, ac_out_cfg_t config)
        {
            InitializeComponent();
            local_ac_cfg = config;
            prev_ac_cfg = config;
            host_ctrl = host;
        }

        private void AC_Out_Cfg_Load(object sender, EventArgs e)
        {
            // Add control group 
            board_attr.Add_Group_To_ComboBox(host_ctrl, Board_Attribute.LIGHTING_GROUP_NAME, cbx_low_fan);
            board_attr.Add_Group_To_ComboBox(host_ctrl, Board_Attribute.LIGHTING_GROUP_NAME, cbx_med_fan);
            board_attr.Add_Group_To_ComboBox(host_ctrl, Board_Attribute.LIGHTING_GROUP_NAME, cbx_high_fan);
            board_attr.Add_Group_To_ComboBox(host_ctrl, Board_Attribute.LIGHTING_GROUP_NAME, cbx_analog_fan);
            board_attr.Add_Group_To_ComboBox(host_ctrl, Board_Attribute.LIGHTING_GROUP_NAME, cbx_analog_cool);
            board_attr.Add_Group_To_ComboBox(host_ctrl, Board_Attribute.LIGHTING_GROUP_NAME, cbx_analog_heat);
            board_attr.Add_Group_To_ComboBox(host_ctrl, Board_Attribute.LIGHTING_GROUP_NAME, cbx_cool_open);
            board_attr.Add_Group_To_ComboBox(host_ctrl, Board_Attribute.LIGHTING_GROUP_NAME, cbx_cool_close);
            board_attr.Add_Group_To_ComboBox(host_ctrl, Board_Attribute.LIGHTING_GROUP_NAME, cbx_heat_open);
            board_attr.Add_Group_To_ComboBox(host_ctrl, Board_Attribute.LIGHTING_GROUP_NAME, cbx_heat_close);

            // Assign value
            chk_enable.Checked = Convert.ToBoolean(local_ac_cfg.enable);
            chk_enable_CheckedChanged(null, null);
            cbx_windows_mode.SelectedIndex = local_ac_cfg.windows_mode;
            cbx_fan_type.SelectedIndex = local_ac_cfg.fan_type;
            cbx_temp_type.SelectedIndex = local_ac_cfg.temp_type;
            cbx_temp_unit.SelectedIndex = local_ac_cfg.temp_unit;
            cbx_valve_contact.SelectedIndex = local_ac_cfg.valve_contact;
            cbx_valve_type.SelectedIndex = local_ac_cfg.valve_type;
            try
            {
                //cbx_dead_band.SelectedIndex = Convert.ToByte(Convert.ToDouble(local_ac_cfg.dead_band) - (Convert.ToDouble(cbx_dead_band.Items[0].ToString()) * 10));
                Byte val = Convert.ToByte(Convert.ToDouble(local_ac_cfg.dead_band));;
                int i;
                for ( i = 0; i < cbx_dead_band.Items.Count; i++)
                {
                    if (val <= Convert.ToByte(Convert.ToDouble(cbx_dead_band.Items[i].ToString()) * 10))
                    {
                        cbx_dead_band.SelectedIndex = i;
                        break;
                    }
                }
                if (i == cbx_dead_band.Items.Count)
                    cbx_dead_band.SelectedIndex = i-1;
            }
            catch
            {
                /*
                if (local_ac_cfg.dead_band < (Convert.ToDouble(cbx_dead_band.Items[0].ToString()) * 10))
                {
                    cbx_dead_band.SelectedIndex = 0;
                }
                else
                {
                    cbx_dead_band.SelectedIndex = cbx_dead_band.Items.Count - 1;                    
                }
                */
            }
            cbx_windows.SelectedIndex = local_ac_cfg.windows;
            cbx_low_fan.SelectedIndex = board_attr.Get_group_index(host_ctrl, local_ac_cfg.group_low_fan, Board_Attribute.LIGHTING_GROUP_NAME);
            cbx_med_fan.SelectedIndex = board_attr.Get_group_index(host_ctrl, local_ac_cfg.group_med_fan, Board_Attribute.LIGHTING_GROUP_NAME);
            cbx_high_fan.SelectedIndex = board_attr.Get_group_index(host_ctrl, local_ac_cfg.group_high_fan, Board_Attribute.LIGHTING_GROUP_NAME);
            cbx_analog_fan.SelectedIndex = board_attr.Get_group_index(host_ctrl, local_ac_cfg.group_analog_fan, Board_Attribute.LIGHTING_GROUP_NAME);
            cbx_analog_cool.SelectedIndex = board_attr.Get_group_index(host_ctrl, local_ac_cfg.group_analog_cool, Board_Attribute.LIGHTING_GROUP_NAME);
            cbx_analog_heat.SelectedIndex = board_attr.Get_group_index(host_ctrl, local_ac_cfg.group_analog_heat, Board_Attribute.LIGHTING_GROUP_NAME);
            cbx_cool_open.SelectedIndex = board_attr.Get_group_index(host_ctrl, local_ac_cfg.group_cool_open, Board_Attribute.LIGHTING_GROUP_NAME);
            cbx_cool_close.SelectedIndex = board_attr.Get_group_index(host_ctrl, local_ac_cfg.group_cool_close, Board_Attribute.LIGHTING_GROUP_NAME);
            cbx_heat_open.SelectedIndex = board_attr.Get_group_index(host_ctrl, local_ac_cfg.group_heat_open, Board_Attribute.LIGHTING_GROUP_NAME);
            cbx_heat_close.SelectedIndex = board_attr.Get_group_index(host_ctrl, local_ac_cfg.group_heat_close, Board_Attribute.LIGHTING_GROUP_NAME);

            //txt_occupied_cool.Text = (Convert.ToDouble(local_ac_cfg.occupied_cool_point) / 10).ToString();
            //txt_unoccupied_cool.Text = (Convert.ToDouble(local_ac_cfg.unoccupied_cool_point) / 10).ToString();
            //txt_occupied_heat.Text = (Convert.ToDouble(local_ac_cfg.occupied_heat_point) / 10).ToString();
            //txt_unoccupied_heat.Text = (Convert.ToDouble(local_ac_cfg.unoccupied_heat_point) / 10).ToString();
        }

        private void chk_enable_CheckedChanged(object sender, EventArgs e)
        {
            foreach (Control ctrl in panel_ac_cfg.Controls)
            {
                ctrl.Enabled = chk_enable.Checked;
            }            
        }

        private void btn_cancel_Click(object sender, EventArgs e)
        {
            this.Close();
        }

        private void btn_OK_Click(object sender, EventArgs e)
        {
            local_ac_cfg.enable         = Convert.ToByte(chk_enable.Checked);
            local_ac_cfg.windows_mode   = Convert.ToByte(cbx_windows_mode.SelectedIndex);
            local_ac_cfg.fan_type       = Convert.ToByte(cbx_fan_type.SelectedIndex);
            local_ac_cfg.temp_type      = Convert.ToByte(cbx_temp_type.SelectedIndex);
            local_ac_cfg.temp_unit      = Convert.ToByte(cbx_temp_unit.SelectedIndex);
            local_ac_cfg.valve_contact  = Convert.ToByte(cbx_valve_contact.SelectedIndex);
            local_ac_cfg.valve_type     = Convert.ToByte(cbx_valve_type.SelectedIndex);
            local_ac_cfg.dead_band      = Convert.ToByte(Convert.ToDouble(cbx_dead_band.SelectedItem.ToString()) * 10);
            local_ac_cfg.windows        = Convert.ToByte(cbx_windows.SelectedIndex);

            local_ac_cfg.group_low_fan      = board_attr.Get_group_value_from_name(host_ctrl, Board_Attribute.LIGHTING_GROUP_NAME, cbx_low_fan.Text.ToString());
            local_ac_cfg.group_med_fan      = board_attr.Get_group_value_from_name(host_ctrl, Board_Attribute.LIGHTING_GROUP_NAME, cbx_med_fan.Text.ToString());
            local_ac_cfg.group_high_fan     = board_attr.Get_group_value_from_name(host_ctrl, Board_Attribute.LIGHTING_GROUP_NAME, cbx_high_fan.Text.ToString());
            local_ac_cfg.group_analog_fan   = board_attr.Get_group_value_from_name(host_ctrl, Board_Attribute.LIGHTING_GROUP_NAME, cbx_analog_fan.Text.ToString());
            local_ac_cfg.group_analog_cool  = board_attr.Get_group_value_from_name(host_ctrl, Board_Attribute.LIGHTING_GROUP_NAME, cbx_analog_cool.Text.ToString());
            local_ac_cfg.group_analog_heat  = board_attr.Get_group_value_from_name(host_ctrl, Board_Attribute.LIGHTING_GROUP_NAME, cbx_analog_heat.Text.ToString());
            local_ac_cfg.group_cool_open    = board_attr.Get_group_value_from_name(host_ctrl, Board_Attribute.LIGHTING_GROUP_NAME, cbx_cool_open.Text.ToString());
            local_ac_cfg.group_cool_close   = board_attr.Get_group_value_from_name(host_ctrl, Board_Attribute.LIGHTING_GROUP_NAME, cbx_cool_close.Text.ToString());
            local_ac_cfg.group_heat_open    = board_attr.Get_group_value_from_name(host_ctrl, Board_Attribute.LIGHTING_GROUP_NAME, cbx_heat_open.Text.ToString());
            local_ac_cfg.group_heat_close   = board_attr.Get_group_value_from_name(host_ctrl, Board_Attribute.LIGHTING_GROUP_NAME, cbx_heat_close.Text.ToString());
            ac_change = true;
            this.Close();
            /*
            try
            {
                local_ac_cfg.occupied_cool_point    = Math.Min(Convert.ToUInt16(Convert.ToDouble(txt_occupied_cool.Text) * 10), MAX_TEMP_SET_POINT);
                local_ac_cfg.occupied_cool_point    = Math.Max(local_ac_cfg.occupied_cool_point, MIN_TEMP_SET_POINT);
                
                local_ac_cfg.unoccupied_cool_point  = Math.Min(Convert.ToUInt16(Convert.ToDouble(txt_unoccupied_cool.Text) * 10), MAX_TEMP_SET_POINT);
                local_ac_cfg.unoccupied_cool_point  = Math.Max(local_ac_cfg.unoccupied_cool_point, MIN_TEMP_SET_POINT);

                local_ac_cfg.occupied_heat_point    = Math.Min(Convert.ToUInt16(Convert.ToDouble(txt_occupied_heat.Text) * 10), MAX_TEMP_SET_POINT);
                local_ac_cfg.occupied_heat_point    = Math.Max(local_ac_cfg.occupied_heat_point, MIN_TEMP_SET_POINT);

                local_ac_cfg.unoccupied_heat_point  = Math.Min(Convert.ToUInt16(Convert.ToDouble(txt_unoccupied_heat.Text) * 10), MAX_TEMP_SET_POINT);
                local_ac_cfg.unoccupied_heat_point  = Math.Max(local_ac_cfg.unoccupied_heat_point, MIN_TEMP_SET_POINT);

                ac_change = true;

                this.Close();
            }
            catch
            {
                MessageBox.Show("The occupied or unoccupied temperature is incorrect");
                local_ac_cfg = prev_ac_cfg;
            }
            */
        }

        private void Tooltip_description(object sender, EventArgs e)
        {
            Control senderObject = sender as Control;
            ComboBox cbx = sender as ComboBox;
            tt_group_inf.SetToolTip(senderObject, cbx.Text);
        }

        private void cbx_dead_band_SelectedIndexChanged(object sender, EventArgs e)
        {

        }
    }                    
}
