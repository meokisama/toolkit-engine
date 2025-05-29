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
    public partial class Light_Out_Cfg : Form
    {
        public const Byte OUPUT_INFO_INVALID_VALUE = 255;
        public struct output_info2_t
        {
            public Byte index;
            public Byte min_dim;
            public Byte max_dim;
            public Byte auto_trigger;
            public Byte schedule_on_hour;
            public Byte schedule_on_min;
            public Byte schedule_off_hour;
            public Byte schedule_off_min;
        };

        public int Delay_On,Delay_Off;
        bool info2_support = true;
        public output_info2_t output_info2;

        public Light_Out_Cfg(output_info2_t info, bool inf2_sup)
        {
            InitializeComponent();
            output_info2 = info;
            info2_support = inf2_sup;
        }                
        

        private void Output_Config_Load(object sender, EventArgs e)
        {   
            for (int i = 0; i < 60; i++)
            {
                cbx_min.Items.Add(i.ToString());
                if ((cbx_hour.SelectedIndex == 18) && (i == 11)) break;
            }
            cbx_hour.SelectedIndex = (int) Delay_Off/3600;
            cbx_min.SelectedIndex = (int) ((Delay_Off-cbx_hour.SelectedIndex*3600)/60);
            cbx_sec.SelectedIndex = (int) (Delay_Off-cbx_hour.SelectedIndex*3600-cbx_min.SelectedIndex*60);
            
            for (int i = 0; i < 60; i++)
            {
                cbx_min_on.Items.Add(i.ToString());
                if ((cbx_hour_on.SelectedIndex == 18) && (i == 11)) break;
            }
            cbx_hour_on.SelectedIndex = (int)Delay_On / 3600;
            cbx_min_on.SelectedIndex = (int)((Delay_On - cbx_hour_on.SelectedIndex * 3600) / 60);
            cbx_sec_on.SelectedIndex = (int)(Delay_On - cbx_hour_on.SelectedIndex * 3600 - cbx_min_on.SelectedIndex * 60);

            // Output info 2

            // Min Dim
            byte val;
            val = Convert.ToByte(Convert.ToDouble(output_info2.min_dim)*100/255);

            if ((val <= Convert.ToByte(cbx_min_dim.Items[cbx_min_dim.Items.Count - 1].ToString()))
               && (val >= Convert.ToByte(cbx_min_dim.Items[0].ToString())))
            {
                cbx_min_dim.SelectedIndex = val - Convert.ToByte(cbx_min_dim.Items[0].ToString());
            }
            else
            {
                cbx_min_dim.Enabled = info2_support;
                cbx_min_dim.SelectedIndex = 0;
            }

            // Max Dim
            val = Convert.ToByte(Convert.ToDouble(output_info2.max_dim) * 100 / 255);

            if ((val <= Convert.ToByte(cbx_max_dim.Items[cbx_max_dim.Items.Count - 1].ToString()))
               && (val >= Convert.ToByte(cbx_max_dim.Items[0].ToString())))
            {
                cbx_max_dim.SelectedIndex = val - Convert.ToByte(cbx_max_dim.Items[0].ToString());
            }
            else
            {
                cbx_max_dim.Enabled = info2_support;
                cbx_max_dim.SelectedIndex = cbx_max_dim.Items.Count - 1;
            }            

            // Auto trigger mode
            if (output_info2.auto_trigger <= 1)
            {
                auto_trigger_chk_box.Checked = Convert.ToBoolean(output_info2.auto_trigger);
            }
            else
            {
                auto_trigger_chk_box.Enabled = info2_support;                
            }
            auto_trigger_chk_box_CheckedChanged(null, null);

            // Schedule On Hour
            if (    (output_info2.schedule_on_hour <= Convert.ToByte(cbx_sched_on_hour.Items[cbx_sched_on_hour.Items.Count - 1].ToString()))
               &&   (output_info2.schedule_on_hour >= Convert.ToByte(cbx_sched_on_hour.Items[0].ToString())))
            {
                cbx_sched_on_hour.SelectedIndex = output_info2.schedule_on_hour - Convert.ToByte(cbx_sched_on_hour.Items[0].ToString());
            }
            else
            {
                cbx_sched_on_hour.Enabled = info2_support;
                cbx_sched_on_hour.SelectedIndex = 0;
            }

            // Schedule On Min
            if (    (output_info2.schedule_on_min <= Convert.ToByte(cbx_sched_on_min.Items[cbx_sched_on_min.Items.Count - 1].ToString()))
               &&   (output_info2.schedule_on_min >= Convert.ToByte(cbx_sched_on_min.Items[0].ToString())))
            {
                cbx_sched_on_min.SelectedIndex = output_info2.schedule_on_min - Convert.ToByte(cbx_sched_on_min.Items[0].ToString());
            }
            else
            {
                cbx_sched_on_min.Enabled = info2_support;
                cbx_sched_on_min.SelectedIndex = 0;
            }

            // Schedule Off Hour
            if (    (output_info2.schedule_off_hour <= Convert.ToByte(cbx_sched_off_hour.Items[cbx_sched_off_hour.Items.Count - 1].ToString()))
               &&   (output_info2.schedule_off_hour >= Convert.ToByte(cbx_sched_off_hour.Items[0].ToString())))
            {
                cbx_sched_off_hour.SelectedIndex = output_info2.schedule_off_hour - Convert.ToByte(cbx_sched_off_hour.Items[0].ToString());
            }
            else
            {
                cbx_sched_off_hour.Enabled = info2_support;
                cbx_sched_off_hour.SelectedIndex = 0;
            }

            // Schedule Off Min
            if (    (output_info2.schedule_off_min <= Convert.ToByte(cbx_sched_off_min.Items[cbx_sched_off_min.Items.Count - 1].ToString()))
               &&   (output_info2.schedule_off_min >= Convert.ToByte(cbx_sched_off_min.Items[0].ToString())))
            {
                cbx_sched_off_min.SelectedIndex = output_info2.schedule_off_min - Convert.ToByte(cbx_sched_off_min.Items[0].ToString());
            }
            else
            {
                cbx_sched_off_min.Enabled = info2_support;
                cbx_sched_off_min.SelectedIndex = 0;
            }

        }

        private void cbx_hour_SelectedIndexChanged(object sender, EventArgs e)
        {
            int SL, vtri;
            vtri = cbx_min.SelectedIndex;

            cbx_min.Items.Clear();
            

            if (cbx_hour.SelectedIndex == 18) SL = 12;
            else SL = 60;

            for (int i = 0; i < SL; i++)
                cbx_min.Items.Add(i.ToString());

            if (vtri < SL) cbx_min.SelectedIndex = vtri;
            else cbx_min.SelectedIndex = 0;
           
        }

        private void cbx_hour_on_SelectedIndexChanged(object sender, EventArgs e)
        {
            int SL, vtri;

            vtri = cbx_min_on.SelectedIndex;

            cbx_min_on.Items.Clear();
            
            if (cbx_hour_on.SelectedIndex == 18) SL = 12;
            else SL = 60;

            for (int i = 0; i < SL; i++)
                cbx_min_on.Items.Add(i.ToString());

            if (vtri < SL) cbx_min_on.SelectedIndex = vtri;
            else cbx_min_on.SelectedIndex = 0;
        }

        private void button2_Click(object sender, EventArgs e)
        {
            Close();
        }

        private void btn_OK_Click(object sender, EventArgs e)
        {
            Delay_On = Convert.ToInt32(cbx_hour_on.SelectedItem.ToString()) * 3600 + Convert.ToInt16(cbx_min_on.SelectedItem.ToString()) * 60 + Convert.ToInt16(cbx_sec_on.SelectedItem.ToString());
            Delay_Off = Convert.ToInt32(cbx_hour.SelectedItem.ToString()) * 3600 + Convert.ToInt16(cbx_min.SelectedItem.ToString()) * 60 + Convert.ToInt16(cbx_sec.SelectedItem.ToString());
            
            // Output info 2
            output_info2.min_dim            = (Byte)(Convert.ToByte(cbx_min_dim.Items[0].ToString()) + Convert.ToByte(cbx_min_dim.SelectedIndex));
            output_info2.min_dim = Convert.ToByte(Convert.ToDouble(output_info2.min_dim) * 255 / 100);
            output_info2.max_dim            = (Byte)(Convert.ToByte(cbx_max_dim.Items[0].ToString()) + Convert.ToByte(cbx_max_dim.SelectedIndex));
            output_info2.max_dim = Convert.ToByte(Convert.ToDouble(output_info2.max_dim) * 255 / 100);
            output_info2.auto_trigger       = Convert.ToByte(auto_trigger_chk_box.Checked);
            output_info2.schedule_on_hour   = Convert.ToByte(cbx_sched_on_hour.SelectedIndex);
            output_info2.schedule_on_min    = Convert.ToByte(cbx_sched_on_min.SelectedIndex);
            output_info2.schedule_off_hour  = Convert.ToByte(cbx_sched_off_hour.SelectedIndex);
            output_info2.schedule_off_min   = Convert.ToByte(cbx_sched_off_min.SelectedIndex);

            Close();
        }

        private void auto_trigger_chk_box_CheckedChanged(object sender, EventArgs e)
        {
            if (info2_support == true && auto_trigger_chk_box.Checked == true)
            {
                cbx_sched_on_hour.Enabled = true;
                cbx_sched_on_min.Enabled = true;
                cbx_sched_off_hour.Enabled = true;
                cbx_sched_off_min.Enabled = true;
            }
            else
            {
                cbx_sched_on_hour.Enabled = false;
                cbx_sched_on_min.Enabled = false;
                cbx_sched_off_hour.Enabled = false;
                cbx_sched_off_min.Enabled = false;
            }
        }
    }
}
