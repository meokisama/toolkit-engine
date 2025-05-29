using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using System.IO;
using System.Reflection;

namespace RLC
{
    public partial class Add_Unit : Form
    {
        public RLC1 XForm;
        public bool edit;
        string Act_Mode;
        int start = 0;
        public Add_Unit()
        {
            InitializeComponent();
        }

        public void Initialize(RLC1 Form)
        {
            this.XForm = Form;
        }

        private void maskedTextBox1_TextChanged(object sender, EventArgs e)
        {
            if (masktxt_Can.Text != "")
            {
                masktxt_Can.Text.Trim();

                if (masktxt_Can.Text.Length > 1)
                {
                    if (masktxt_Can.Text[1].ToString() == " ") masktxt_Can.Text = masktxt_Can.Text[0].ToString() + masktxt_Can.Text[2].ToString();

                    if (Convert.ToInt16(masktxt_Can.Text) >= 256)
                        masktxt_Can.Text = Convert.ToInt16((Convert.ToInt16(masktxt_Can.Text) / 10)).ToString();
                }
            }
            else masktxt_Can.Text = "1";
            masktxt_Can.Text = (Convert.ToInt16(masktxt_Can.Text)).ToString();
        }

        private void masktxt_IP_high_TextChanged(object sender, EventArgs e)
        {
            if (masktxt_IP_high.Text != "")
            {
                masktxt_IP_high.Text.Trim();

                if (masktxt_IP_high.Text.Length > 1)
                {
                    if (masktxt_IP_high.Text[1].ToString() == " ") masktxt_IP_high.Text = masktxt_IP_high.Text[0].ToString() + masktxt_IP_high.Text[2].ToString();

                    if (Convert.ToInt16(masktxt_IP_high.Text) >= 255)
                        masktxt_IP_high.Text = Convert.ToInt16((Convert.ToInt16(masktxt_IP_high.Text) / 10)).ToString();
                }
            }
            else masktxt_IP_high.Text = "0";
            masktxt_IP_high.Text = (Convert.ToInt16(masktxt_IP_high.Text)).ToString();
        }

        private void masktxt_IP_low_TextChanged(object sender, EventArgs e)
        {
            if (masktxt_IP_low.Text != "")
            {
                masktxt_IP_low.Text.Trim();

                if (masktxt_IP_low.Text.Length > 1)
                {
                    if (masktxt_IP_low.Text[1].ToString() == " ") masktxt_IP_low.Text = masktxt_IP_low.Text[0].ToString() + masktxt_IP_low.Text[2].ToString();

                    if (Convert.ToInt16(masktxt_IP_low.Text) >= 255)
                        masktxt_IP_low.Text = Convert.ToInt16((Convert.ToInt16(masktxt_IP_low.Text) / 10)).ToString();
                }
            }
            else masktxt_IP_low.Text = "1";
            masktxt_IP_low.Text = (Convert.ToInt16(masktxt_IP_low.Text)).ToString();
        }

        private void Add_Unit_Load(object sender, EventArgs e)
        {
            string s;
            cbx_Unit.SelectedIndex = XForm.ConfigUnit.unit;
            txt_Des.Text = XForm.ConfigUnit.Descript;
            s = XForm.ConfigUnit.IP;
            txtIpMaskLayerHigh.Text = XForm.ConfigUnit.Ip_Layer_Mask_High;
            txtIpMaskLayerLow.Text  = XForm.ConfigUnit.Ip_Layer_Mask_Low;
            masktxt_IP_high.Text = s.Substring(0, s.IndexOf('.'));
            masktxt_IP_low.Text = s.Substring(s.IndexOf('.') + 1);
            t1.Text = XForm.Substring('.', 0, XForm.ConfigUnit.IDCan);
            t2.Text = XForm.Substring('.', 1, XForm.ConfigUnit.IDCan);
            t3.Text = XForm.Substring('.', 2, XForm.ConfigUnit.IDCan);

            txt_FwVersion.Text = XForm.ConfigUnit.Fw_ver;            
            if (sender.ToString().Contains("Edit_Unit_Network"))
            {
                txt_FwVersion.Enabled = false;
            }
            masktxt_Can.Text = XForm.Substring('.', 3, XForm.ConfigUnit.IDCan);
            
            chk_Recovery.Checked = XForm.ConfigUnit.Recovery;
            if (XForm.ConfigUnit.kind == 2) rbtn_Master.Checked = true;
            else if (XForm.ConfigUnit.kind == 1) rbtn_Slave.Checked = true;
            else rbtn_Stand.Checked = true;
            cbx_Unit.Enabled = !edit;

            chk_LoadCan.Checked = XForm.ConfigUnit.LoadCan;
            if (XForm.ConfigUnit.kind == 1) //slave
                chk_LoadCan.Enabled = true;
            else
                chk_LoadCan.Enabled = false;
            RS485_cfg_btn.Enabled = XForm.RS485_support;
            if (XForm.RS485_support == false)
            {
                XForm.RS485_Cfg = new RS485_Config.RS485_cfg_t[0];
            }
        }

        private void cbx_Unit_SelectedIndexChanged(object sender, EventArgs e)
        {
            if ((cbx_Unit.Text == "Bedside-17T") || (cbx_Unit.Text == "Bedside-12T") || (cbx_Unit.Text == "BSP_R14_OL") || (cbx_Unit.Text == "GNT-EXT-6RL") || (cbx_Unit.Text == "GNT-EXT-8RL") ||
                (cbx_Unit.Text == "GNT-EXT-12RL") || (cbx_Unit.Text == "GNT-EXT-20RL") || (cbx_Unit.Text == "GNT-EXT-10AO") || (cbx_Unit.Text == "GNT-EXT-28AO") || (cbx_Unit.Text == "GNT-EXT-12RL-12AO") ||
                (cbx_Unit.Text == "GNT-EXT-24IN") || (cbx_Unit.Text == "GNT-EXT-48IN"))
            {
                rbtn_Slave.Checked = true;
                rbtn_Master.Enabled = false;
                rbtn_Stand.Enabled = false;
                chk_Recovery.Enabled = false;
                chk_LoadCan.Enabled = false;
                chk_LoadCan.Checked = false;
                chk_Recovery.Checked = false;

            }
            else
            {
                rbtn_Stand.Checked = true;
                rbtn_Master.Enabled = true;
                rbtn_Stand.Enabled = true;
                chk_Recovery.Enabled = true;
                chk_LoadCan.Enabled = true;
            }


        }

        private void button2_Click(object sender, EventArgs e)
        {
            this.Close();
        }

        private void Add_Unit_FormClosed(object sender, FormClosedEventArgs e)
        {
            XForm.Enabled = true;
        }
        private string Barcode(string s)
        {
            if (s == "Room Logic Controller") return "8930000000019";
            else if (s == "Bedside-17T") return "8930000000200";
            else if (s == "Bedside-12T") return "8930000100214";
            else if (s == "BSP_R14_OL") return "8930000100221";
            else if (s == "RLC-I16") return "8930000000026";
            else if (s == "RLC-I20") return "8930000000033";
            else if (s == "RCU-32AO") return "8930000200013";
            else if (s == "RCU-8RL-24AO") return "8930000200020";
            else if (s == "RCU-16RL-16AO") return "8930000200037";
            else if (s == "RCU-24RL-8AO") return "8930000200044";
            else if (s == "RCU-11IN-4RL") return "8930000210005";
            else if (s == "RCU-21IN-10RL") return "8930000210012";
            else if (s == "RCU-30IN-10RL") return "8930000210036";
            else if (s == "RCU-48IN-16RL") return "8930000210043";
            else if (s == "RCU-48IN-16RL-4AO") return "8930000210050";
            else if (s == "RCU-48IN-16RL-4AI") return "8930000210067";
            else if (s == "RCU-48IN-16RL-K") return "8930000210074";
            else if (s == "RCU-48IN-16RL-DL") return "8930000210081";
            else if (s == "RCU-21IN-8RL") return "8930000210111";
            else if (s == "RCU-21IN-8RL-4AO") return "8930000210128";
            else if (s == "RCU-21IN-8RL-4AI") return "8930000210135";
            else if (s == "RCU-21IN-8RL-K") return "8930000210142";
            else if (s == "RCU-21IN-8RL-DL") return "8930000210159";
            else if (s == "GNT-EXT-6RL") return "8930000200051";
            else if (s == "GNT-EXT-8RL") return "8930000200068";
            else if (s == "GNT-EXT-10AO") return "8930000200075";
            else if (s == "GNT-EXT-28AO") return "8930000200082";
            else if (s == "GNT-EXT-12RL") return "8930000200105";
            else if (s == "GNT-EXT-20RL") return "8930000200112";
            else if (s == "GNT-EXT-12RL-12AO") return "8930000200099";
            else if (s == "GNT-EXT-24IN") return "8930000220011";
            else if (s == "GNT-EXT-48IN") return "8930000220028";
            else if (s == "GNT-ETH2KDL") return "8930000230003";
            return "No Info";
        }
        private bool TaoFile(string filePath)
        {
            string ID = t1.Text + "." + t2.Text + "." + t3.Text + "." + masktxt_Can.Text;
            filePath = filePath + "\\" + txtIpMaskLayerHigh.Text + "." + txtIpMaskLayerLow.Text + "." + masktxt_IP_high.Text + "." + masktxt_IP_low.Text + "&" + ID;
            FileStream fs;
            if (File.Exists(filePath))
            {
                MessageBox.Show("IP Address is duplicated. Please choose another one!");
                return false;
            }
            else
                fs = new FileStream(filePath, FileMode.Create);

            StreamWriter sWriter = new StreamWriter(fs, Encoding.UTF8);
            string Data = cbx_Unit.SelectedItem.ToString() + "," + Barcode(cbx_Unit.SelectedItem.ToString()) + "," + txtIpMaskLayerHigh.Text + "." + txtIpMaskLayerLow.Text + "." + masktxt_IP_high.Text + "." + masktxt_IP_low.Text + "," + t1.Text + "." + t2.Text + "." + t3.Text + "." + masktxt_Can.Text + "," + Act_Mode + "," + (chk_LoadCan.Checked).ToString() + "," + txt_FwVersion.Text + "," + XForm.ConfigUnit.Hw_ver + "," + txt_Des.Text + "," + (chk_Recovery.Checked).ToString();
            sWriter.WriteLine(Data);
            Board_Attribute board_att = new Board_Attribute();
            string[] rs485_cfg_arr = board_att.build_rs485_cfg(XForm);

            foreach (string cfg_str in rs485_cfg_arr)
            {
                sWriter.WriteLine(cfg_str);
            }
                                  
            sWriter.Flush();
            
            fs.Close();
            return true;
        }
        private bool SuaFile(string filePath)
        {
            string oldfilePath=filePath + "\\"+ XForm.ConfigUnit.Ip_Layer_Mask_High+"."+ XForm.ConfigUnit.Ip_Layer_Mask_Low +"." + XForm.ConfigUnit.IP+"&"+XForm.ConfigUnit.IDCan;
            string ID=t1.Text+"."+t2.Text+"."+t3.Text+"."+masktxt_Can.Text;
            filePath = filePath + "\\" + txtIpMaskLayerHigh.Text + "." + txtIpMaskLayerLow.Text + "." + masktxt_IP_high.Text + "." + masktxt_IP_low.Text + "&" + ID;
            
            FileStream fs;
            if ((File.Exists(filePath)) && (oldfilePath!=filePath))
            {
                MessageBox.Show("IP Address is duplicated. Please choose another one!");
                return false;
            }
            else
            {
                string[] Data = System.IO.File.ReadAllLines(oldfilePath);
                List<string> myList = Data.ToList();
                File.Delete(oldfilePath);
                fs = new FileStream(filePath, FileMode.Create);
                fs.Close();
                myList[0] = cbx_Unit.SelectedItem.ToString() + "," + Barcode(cbx_Unit.SelectedItem.ToString()) + "," + txtIpMaskLayerHigh.Text + "." + txtIpMaskLayerLow.Text + "." + masktxt_IP_high.Text + "." + masktxt_IP_low.Text + "," + t1.Text + "." + t2.Text + "." + t3.Text + "." + masktxt_Can.Text + "," + Act_Mode + "," + (chk_LoadCan.Checked).ToString() + "," + txt_FwVersion.Text + "," + XForm.ConfigUnit.Hw_ver + "," + txt_Des.Text + "," + (chk_Recovery.Checked).ToString();               
                
                while (myList.Count >= 2 && myList[1].Contains("RS485") == true)
                {
                   myList.RemoveAt(1);
                }

                Board_Attribute board_att = new Board_Attribute();
                string[] rs485_cfg = board_att.build_rs485_cfg(XForm);                

                for (int i = 0; i < rs485_cfg.Length; i++ )
                {
                    myList.Insert(i + 1, rs485_cfg[i]);
                }

                System.IO.File.WriteAllLines(filePath, myList.ToArray(), Encoding.UTF8);
             
                return true;
            }
        }

        private void btn_ok_Click(object sender, EventArgs e)
        {
            if (rbtn_Master.Checked == true) Act_Mode = "Master";
            else if (rbtn_Slave.Checked == true) Act_Mode = "Slave";
            else Act_Mode = "Stand-Alone";
            string[] row = { };
            bool check = false;

            if (Add_Unit.ActiveForm.Text == "Add_Unit")
            {             
                check = TaoFile(XForm.Group_Path);
                if (check == true) XForm.gr_Unit.Rows.Add(cbx_Unit.SelectedItem.ToString(), Barcode(cbx_Unit.SelectedItem.ToString()), txtIpMaskLayerHigh.Text + "." + txtIpMaskLayerLow.Text + "." + masktxt_IP_high.Text + "." + masktxt_IP_low.Text, t1.Text + "." + t2.Text + "." + t3.Text + "." + masktxt_Can.Text, Act_Mode, chk_LoadCan.Checked, txt_FwVersion.Text, "No Info", txt_Des.Text, chk_Recovery.Checked);
                XForm.btn_EditUnit.Enabled = true;
                XForm.btn_ConfigUnit.Enabled = true;
                XForm.btn_DeleteUnit.Enabled = true;
            }
            else if (Add_Unit.ActiveForm.Text == "Edit_Unit_Database")
            {                
                check=SuaFile(XForm.Group_Path);                
                if (check == true) XForm.gr_Unit.Rows[XForm.rowindex].SetValues(cbx_Unit.SelectedItem.ToString(), Barcode(cbx_Unit.SelectedItem.ToString()), txtIpMaskLayerHigh.Text + "." + txtIpMaskLayerLow.Text + "." + masktxt_IP_high.Text + "." + masktxt_IP_low.Text, t1.Text + "." + t2.Text + "." + t3.Text + "." + masktxt_Can.Text, Act_Mode, chk_LoadCan.Checked, txt_FwVersion.Text, XForm.ConfigUnit.Hw_ver, txt_Des.Text, chk_Recovery.Checked);
            }
            else if (Add_Unit.ActiveForm.Text == "Edit_Unit_Network")
            {
                string oldIP = XForm.ConfigUnit.Ip_Layer_Mask_High + "." + XForm.ConfigUnit.Ip_Layer_Mask_Low + "." + XForm.ConfigUnit.IP, oldID = XForm.ConfigUnit.IDCan;
                XForm.ConfigUnit.IP = masktxt_IP_high.Text + "." + masktxt_IP_low.Text;
                XForm.ConfigUnit.Ip_Layer_Mask_High = txtIpMaskLayerHigh.Text;
                XForm.ConfigUnit.Ip_Layer_Mask_Low = txtIpMaskLayerLow.Text;

                XForm.ConfigUnit.IDCan = t1.Text + "." + t2.Text + "." + t3.Text + "." + masktxt_Can.Text;
                XForm.oldActMode = XForm.ConfigUnit.kind;
                if (Act_Mode=="Master") XForm.ConfigUnit.kind=2;
                else if (Act_Mode=="Slave") XForm.ConfigUnit.kind=1;
                else XForm.ConfigUnit.kind=0;
                
                // Check for hw config change
                if ((XForm.ConfigUnit.LoadCan != chk_LoadCan.Checked) || (XForm.ConfigUnit.Recovery != chk_Recovery.Checked))
                {
                    XForm.ConfigUnit.hw_change = true;
                }
                else
                {
                    XForm.ConfigUnit.hw_change = false;
                }
                XForm.ConfigUnit.LoadCan = chk_LoadCan.Checked;
                XForm.ConfigUnit.Recovery = chk_Recovery.Checked;
                check = true;
                XForm.EditNetwork(oldIP, oldID);
                
            }

            if (check==true) this.Close();

        }

        private void rbtn_Master_CheckedChanged(object sender, EventArgs e)
        {
            if (start > 1)
            {
                chk_LoadCan.Checked = true;
                chk_LoadCan.Enabled = false;
            }
            start++;
        }

        private void rbtn_Slave_CheckedChanged(object sender, EventArgs e)
        {
            if (start>1)
            {
                chk_LoadCan.Checked = false;
                chk_LoadCan.Enabled = true;
            }
            start++;
        }

        private void rbtn_Stand_CheckedChanged(object sender, EventArgs e)
        {
            if (start > 1)
            {
                chk_LoadCan.Checked = false;
                chk_LoadCan.Enabled = true;
            }
            start++;
        }

        private void txtIpMaskLayerHigh_TextChanged(object sender, EventArgs e)
        {
            if (txtIpMaskLayerHigh.Text != "")
            {
                txtIpMaskLayerHigh.Text.Trim();

                if (txtIpMaskLayerHigh.Text.Length > 1)
                {
                    if (txtIpMaskLayerHigh.Text[1].ToString() == " ") txtIpMaskLayerHigh.Text = txtIpMaskLayerHigh.Text[0].ToString() + txtIpMaskLayerHigh.Text[2].ToString();

                    if (Convert.ToInt16(txtIpMaskLayerHigh.Text) >= 255)
                        txtIpMaskLayerHigh.Text = Convert.ToInt16((Convert.ToInt16(txtIpMaskLayerHigh.Text) / 10)).ToString();
                }
            }
            else txtIpMaskLayerHigh.Text = "1";
            txtIpMaskLayerHigh.Text = (Convert.ToInt16(txtIpMaskLayerHigh.Text)).ToString();
        }

        private void txtIpMaskLayerLow_TextChanged(object sender, EventArgs e)
        {
            if (txtIpMaskLayerLow.Text != "")
            {
                txtIpMaskLayerLow.Text.Trim();

                if (txtIpMaskLayerLow.Text.Length > 1)
                {
                    if (txtIpMaskLayerLow.Text[1].ToString() == " ") txtIpMaskLayerLow.Text = txtIpMaskLayerLow.Text[0].ToString() + txtIpMaskLayerLow.Text[2].ToString();

                    if (Convert.ToInt16(txtIpMaskLayerLow.Text) >= 255)
                        txtIpMaskLayerLow.Text = Convert.ToInt16((Convert.ToInt16(txtIpMaskLayerLow.Text) / 10)).ToString();
                }
            }
            else txtIpMaskLayerLow.Text = "0";
            txtIpMaskLayerLow.Text = (Convert.ToInt16(txtIpMaskLayerLow.Text)).ToString();
        }

        private void RS485_cfg_btn_Click(object sender, EventArgs e)
        {
            RS485_Config RS485_cfg_form = new RS485_Config();           
            this.Enabled = false;            
            RS485_cfg_form.Initialize(this, XForm.RS485_Cfg);
            RS485_cfg_form.ShowDialog();            
        }                

    }
}
