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
    public partial class Add_Group : Form
    {
        RLC1 XForm;
        Input_Bedside Form_Bedside;
        Input_RLC Form_InputRLC;
        string group_type;
        string group_name;
        Byte group_val;
        string group_desc;
        
        
        public Add_Group(string gr_type, string gr_name, Byte gr_val, string gr_desc)
        {
            InitializeComponent();
            group_type = gr_type;
            group_name = gr_name;
            group_val = gr_val;
            group_desc = gr_desc;            
        }

        public void Initialize(RLC1 Form)
        {
            this.XForm = Form;                        
        }

        private void Add_Group_Load(object sender, EventArgs e)
        {
            Board_Attribute board_att = new Board_Attribute();
            bool added_group = false;

            XForm.OK = false;
            lbl_group_type.Text = group_type;       
                                   
            for (int i = 0; i < RLC1.MAX_GROUP; i++)
            {
                if (((added_group == false) && (group_val > 0)) || (board_att.Check_value_in_group(XForm, (Byte)i, group_type) == false))
                {
                    string s;
                    int val = i;
                    if (added_group == false)
                    {                        
                        val = group_val;                        
                    }

                    if (val < 10) s = "00" + val.ToString();
                    else if (val < 100) s = "0" + val.ToString();
                    else s = val.ToString();
                    cbx_GroupAddress.Items.Add(s);                                     
                }   
                added_group = true;
            }

            if (cbx_GroupAddress.Items.Count > 0)
            {
                cbx_GroupAddress.SelectedIndex = 0;
            }


            txt_GroupName.Text = group_name;
            txt_Des.Text = group_desc;
        }

        private void Add_Group_FormClosed(object sender, FormClosedEventArgs e)
        {
            if (XForm.form == 0)
                XForm.Enabled = true;
            else 
                XForm.enableGetState = true;
            XForm.form = 0;            
            Board_Attribute board_att = new Board_Attribute();
            XForm.LoadGroup(board_att.Get_group_path(XForm, group_type));
        }

        private void button2_Click(object sender, EventArgs e)
        {
            this.Close();            
        }

        private void LuuGroup(string filePath,string Data)
        {
            FileStream fs;
            fs = new FileStream(filePath, FileMode.Append);

            StreamWriter sWriter = new StreamWriter(fs, Encoding.UTF8);
            sWriter.WriteLine(Data);
            sWriter.Flush();
            fs.Close();
        }

        private void btn_OK_Click(object sender, EventArgs e)
        {                        
            if (txt_GroupName.Text.Trim()=="") 
            {
                MessageBox.Show("Please Input Group Name!");
                return;
            }
            
            Board_Attribute board_att = new Board_Attribute();            
            XForm.OK = true;
            if (txt_Des.Text.Trim() == null) txt_Des.Text = "No Description";

            board_att.Add_Group_To_Database(XForm, group_type, txt_GroupName.Text, Convert.ToByte(cbx_GroupAddress.SelectedItem), txt_Des.Text, group_val);
           
            
            this.Close();            
        }
    }
}
