using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using System.IO;

namespace RLC
{
    public partial class Tool_Setup : Form
    {
        RLC1 XForm;
        string Can_Id_File_Path = "CAN_ID";
        string[] Can_Id_Data;
        public bool edit;
        string Act_Mode;
        int start = 0;
        public Tool_Setup()
        {
            InitializeComponent();
        }

        public void Initialize(RLC1 Form)
        {
            this.XForm = Form;
        }

        private void maskedTextBox1_TextChanged(object sender, EventArgs e)
        {
            if (masktxt_Can3.Text != "")
            {
                masktxt_Can3.Text.Trim();

                if (masktxt_Can3.Text.Length > 1)
                {
                    if (masktxt_Can3.Text[1].ToString() == " ") masktxt_Can3.Text = masktxt_Can3.Text[0].ToString() + masktxt_Can3.Text[2].ToString();

                    if (Convert.ToInt16(masktxt_Can3.Text) >= 256)
                        masktxt_Can3.Text = Convert.ToInt16((Convert.ToInt16(masktxt_Can3.Text) / 10)).ToString();
                }
            }
            else masktxt_Can3.Text = "1";
            masktxt_Can3.Text = (Convert.ToInt16(masktxt_Can3.Text)).ToString();
        }

        private void button2_Click(object sender, EventArgs e)
        {
            this.Close();
        }

        private void Tool_Setup_FormClosed(object sender, FormClosedEventArgs e)
        {
            XForm.Enabled = true;
        }

        private void btn_ok_Click(object sender, EventArgs e)
        {
            string man_date="",newID,Barcode;
            string Country_code = "893";
            string Company_code = "0000";
            int C;
 
            if (Manufacture_Date_picker.Checked)
            {
                man_date = Manufacture_Date_picker.Text;
                while (man_date.IndexOf('/')>0)
                {
                    man_date = man_date.Remove(man_date.IndexOf('/'),1);
                }
            }

            int cnt = 33 + Convert.ToByte(cbx_Can0.Text) * 256 + Convert.ToByte(cbx_Can1.Text);
            string s = "";
            bool ID_used = true;
            int pos = 0;
            int pos_start = cbx_Can0.Text.Length + cbx_Can1.Text.Length + 2;
            for (int i = pos_start; i < Can_Id_Data[cnt].Length; i++)
            {
                if (Can_Id_Data[cnt][i] != ' ') s = s + Can_Id_Data[cnt][i];
                else
                {
                    if (s == cbx_Can2.Text)
                    {
                        pos = pos - s.Length;
                        ID_used = false;
                        break;
                    }
                    s = "";
                }
            }
            if (ID_used)
            {
                DialogResult lkResult = MessageBox.Show("Can ID has been used . Do you want to use it?", "Alert", MessageBoxButtons.YesNo);
                if (lkResult == DialogResult.No) return;
            }
            
            newID = cbx_Can0.Text + "." + cbx_Can1.Text + "." + cbx_Can2.Text + "." + masktxt_Can3.Text; 


            C = (10 - ((Convert.ToByte(Country_code[1].ToString()) + Convert.ToByte(Company_code[0].ToString()) + Convert.ToByte(Company_code[2].ToString()) + Convert.ToByte(maskedTextBoxSerial.Text[0].ToString()) + Convert.ToByte(maskedTextBoxSerial.Text[2].ToString()) + Convert.ToByte(maskedTextBoxSerial.Text[4].ToString()))*3 
                  + Convert.ToByte(Country_code[0].ToString()) + Convert.ToByte(Country_code[2].ToString()) + Convert.ToByte(Company_code[1].ToString()) + Convert.ToByte(Company_code[3].ToString())+ Convert.ToByte(maskedTextBoxSerial.Text[1].ToString()) + Convert.ToByte(maskedTextBoxSerial.Text[3].ToString()))%10) % 10;  

            Barcode = Country_code + Company_code + maskedTextBoxSerial.Text + C.ToString();
            string oldIP = XForm.ConfigUnit.Ip_Layer_Mask_High + "." + XForm.ConfigUnit.Ip_Layer_Mask_Low + "." + XForm.ConfigUnit.IP;
            bool Updated = XForm.SetupBoard(oldIP, XForm.ConfigUnit.IDCan, man_date, Barcode, newID, chk_Reset.Checked);

            bool check = true;
            s = "";
            if (Updated && !ID_used)
            {
                //check if ID CAN of second layer is used all
                for (int i = pos_start; i < Can_Id_Data[cnt].Length; i++)
                {
                    if (Can_Id_Data[cnt][i] != ' ') s = s + Can_Id_Data[cnt][i];
                    else
                    {
                        if (s[0] != 'X')
                        {
                            if (s == cbx_Can2.Text)
                            {
                                StringBuilder sb = new StringBuilder(Can_Id_Data[cnt]);
                                for (int j = i - 1; j > 0; j--)
                                {
                                    if (sb[j] != ' ') sb[j] = 'X';
                                    else
                                    {
                                        Can_Id_Data[cnt] = sb.ToString();
                                        break;
                                    }
                                }
                            }
                            else
                            {
                                check = false;
                            }

                        }
                        s = "";
                    }
                }

                s = "";
                if (check == true)
                {
                    pos_start = cbx_Can0.SelectedItem.ToString().Length + 1;
                    cnt = Convert.ToByte(cbx_Can0.SelectedItem.ToString()) + 1;

                    //check if ID CAN of first layer is used all
                    for (int i = pos_start; i < Can_Id_Data[cnt].Length; i++)
                    {
                        if (Can_Id_Data[cnt][i] != ' ') s = s + Can_Id_Data[cnt][i];
                        else
                        {
                            if (s[0] != 'X')
                            {
                                if (s == cbx_Can1.Text)
                                {
                                    StringBuilder sb = new StringBuilder(Can_Id_Data[cnt]);
                                    for (int j = i - 1; j > 0; j--)
                                    {
                                        if (sb[j] != ' ') sb[j] = 'X';
                                        else
                                        {
                                            Can_Id_Data[cnt] = sb.ToString();
                                            break;
                                        }
                                    }
                                }
                                else
                                {
                                    check = false;
                                }
                                
                            }
                            s = "";
                        }
                    }

                    s = "";
                    if (check == true)
                    {
                        for (int i = 0; i < Can_Id_Data[0].Length; i++)
                        {
                            if (Can_Id_Data[0][i] != ' ') s = s + Can_Id_Data[0][i];
                            else
                            {
                                if (s == cbx_Can0.Text)
                                {
                                    StringBuilder sb = new StringBuilder(Can_Id_Data[0]);
                                    for (int j = i - 1; j > 0; j--)
                                    {
                                        if (sb[j] != ' ') sb[j] = 'X';
                                        else
                                        {
                                            Can_Id_Data[0] = sb.ToString();
                                            break;
                                        }
                                    }
                                    break;
                                }
                                s = "";
                            }
                        }
                    }
                }

                System.IO.File.WriteAllLines(Can_Id_File_Path, Can_Id_Data, Encoding.UTF8);
            }
            this.Close();
        }

        private void Tool_Setup_Load(object sender, EventArgs e)
        {
            Can_Id_Data = System.IO.File.ReadAllLines(Can_Id_File_Path);

            cbx_Can0.Text = XForm.Substring('.', 0, XForm.ConfigUnit.IDCan);
            cbx_Can1.Text = XForm.Substring('.', 1, XForm.ConfigUnit.IDCan);
            cbx_Can2.Text = XForm.Substring('.', 2, XForm.ConfigUnit.IDCan);
            masktxt_Can3.Text = XForm.Substring('.', 3, XForm.ConfigUnit.IDCan);
            Manufacture_Date_picker.Value = new DateTime(Convert.ToInt32(XForm.ConfigUnit.Manu_Date.Substring(4, 4)), Convert.ToInt32(XForm.ConfigUnit.Manu_Date.Substring(2, 2)), Convert.ToInt32(XForm.ConfigUnit.Manu_Date.Substring(0, 2)));
            Manufacture_Date_picker.Checked = false;
            string s = "";
            for (int i = 0; i < Can_Id_Data[0].Length; i++)
            {
                if (Can_Id_Data[0][i] != ' ') s = s + Can_Id_Data[0][i];
                else
                {
                    if (s[0] != 'X')
                    {
                        cbx_Can0.Items.Add(s);
                    }
                    s = "";
                }
            }
            
            maskedTextBoxSerial.Text = XForm.ConfigUnit.Barcode.Substring(7,5);

            cbx_Can0.TextChanged += new System.EventHandler(cbx_Can0_TextChanged_Handler);
            cbx_Can1.TextChanged += new System.EventHandler(cbx_Can1_TextChanged_Handler);
            cbx_Can2.TextChanged += new System.EventHandler(cbx_Can2_TextChanged_Handler);
        }

        private void cbx_Can0_SelectedIndexChanged(object sender, EventArgs e)
        {
            int cnt = 0;
            string s="";

            cnt = Convert.ToByte(cbx_Can0.SelectedItem.ToString()) + 1;
            s = "";
            int pos_start = cbx_Can0.SelectedItem.ToString().Length + 1;
            cbx_Can1.Items.Clear();
            for (int i = pos_start; i < Can_Id_Data[cnt].Length; i++)
            {
                if (Can_Id_Data[cnt][i] != ' ') s = s + Can_Id_Data[cnt][i];
                else
                {
                    if (s[0] != 'X')
                    {
                        cbx_Can1.Items.Add(s);
                    }
                    s = "";
                }
            }
        }

        private void cbx_Can1_SelectedIndexChanged(object sender, EventArgs e)
        {
            int cnt = 0;
            string s = "";

            cnt = 33 + Convert.ToByte(cbx_Can0.SelectedItem.ToString()) * 256 + Convert.ToByte(cbx_Can1.SelectedItem.ToString());
            s = "";
            int pos_start = cbx_Can0.SelectedItem.ToString().Length + cbx_Can1.SelectedItem.ToString().Length + 2;
            cbx_Can2.Items.Clear();
            for (int i = pos_start; i < Can_Id_Data[cnt].Length; i++)
            {
                if (Can_Id_Data[cnt][i] != ' ') s = s + Can_Id_Data[cnt][i];
                else
                {
                    if (s[0] != 'X')
                    {
                        cbx_Can2.Items.Add(s);
                    }
                    s = "";
                }
            }
        }

        private void cbx_Can0_TextChanged_Handler(object sender, EventArgs e)
        {
            if (!System.Text.RegularExpressions.Regex.IsMatch(cbx_Can0.Text, "^[0-9]+$"))
            {
                cbx_Can0.Text = XForm.Substring('.', 0, XForm.ConfigUnit.IDCan);
            }
            else
            {
                if (Convert.ToInt32(cbx_Can0.Text) > 31) cbx_Can0.Text = XForm.Substring('.', 0, XForm.ConfigUnit.IDCan);
            }
        }

        private void cbx_Can1_TextChanged_Handler(object sender, EventArgs e)
        {
            if (!System.Text.RegularExpressions.Regex.IsMatch(cbx_Can1.Text, "^[0-9]+$"))
            {
                cbx_Can1.Text = XForm.Substring('.', 1, XForm.ConfigUnit.IDCan);
            }
            else
            {
                if (Convert.ToInt32(cbx_Can1.Text) > 255) cbx_Can1.Text = XForm.Substring('.', 1, XForm.ConfigUnit.IDCan);
            }
        }

        private void cbx_Can2_TextChanged_Handler(object sender, EventArgs e)
        {
            if (!System.Text.RegularExpressions.Regex.IsMatch(cbx_Can2.Text, "^[0-9]+$"))
            {
                cbx_Can2.Text = XForm.Substring('.', 2, XForm.ConfigUnit.IDCan);
            }
            else
            {
                if (Convert.ToInt32(cbx_Can2.Text) > 255) cbx_Can2.Text = XForm.Substring('.', 2, XForm.ConfigUnit.IDCan);
            }
        }



    }
}
