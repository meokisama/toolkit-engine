using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Windows.Forms;

using Ionic.Zip;

namespace RLC
{
    public partial class Backup : Form
    {
        RLC1 XForm;
        string filePath;
        bool conflict;
        public string zipPath;
        public Backup()
        {
            InitializeComponent();
        }
        public void Initialize(RLC1 Form)
        {
            this.XForm = Form;
        }
        private void Backup_Load(object sender, EventArgs e)
        {
            conflict = label_annouce.Visible;
        }

        private void btn_Ok_Click(object sender, EventArgs e)
        {
            if (btn_Ok.Text == "OK")
            {
                SaveFileDialog save = new SaveFileDialog();
                save.Filter = "Backup File|*.RLC";
                save.FileName = "Backup";
                save.Title = "Backup Project";


                if (save.ShowDialog() == DialogResult.OK)
                {
                    ZipFile zip = new ZipFile();
                    for (int i = 0; i < gr_project.Rows.Count; i++)
                    {
                        if (gr_project[0, i].Value.ToString() == "True")
                        {

                            zip.AddDirectory(XForm.directoryDatabase + "\\" + gr_project[1, i].Value.ToString(), gr_project[1, i].Value.ToString());
                        }

                    }
                    zip.Save(save.FileName);
                }
                Close();
            }
            else if (btn_Ok.Text == "Next")
            {
                btn_Back.Visible = true;
                label_annouce.Text = "Resolve conflict project names";
                panel1.Visible = false;
                panel3.Visible = true;
                btn_Ok.Text = "Finish";

                for (int i = 0; i < gr_project.Rows.Count; i++)
                {
                    if (Convert.ToBoolean(gr_project[0, i].EditedFormattedValue.ToString()) == true)
                    {
                        filePath = XForm.directoryDatabase + "\\" + gr_project[1, i].Value.ToString();
                        if (System.IO.Directory.Exists(filePath)) 
                            grid_RenameProject.Rows.Add(gr_project[1,i].Value.ToString(),"",false);

                    }
                }

            }
            else if (btn_Ok.Text=="Finish")
            {
                ZipFile zip = new ZipFile(zipPath);
                if (rbtn_replace.Checked == false)
                {
                    string s,s_rep;
                    for (int i = 0; i < grid_RenameProject.Rows.Count; i++)
                    {
                        if (Convert.ToBoolean(grid_RenameProject[2, i].Value.ToString()) == false)
                        {
                            s = grid_RenameProject[1, i].Value.ToString();
                            if ((s.Trim() == "") || (s.IndexOf('/') >= 0))
                            {
                                MessageBox.Show("Unable to rename conflict projects. Some new project names are invalid. Please check and modify again!!!","Error Rename");
                                return;
                            }
                            else
                            {
                                for (int j = i + 1; j < grid_RenameProject.Rows.Count; j++)
                                {
                                    if (Convert.ToBoolean(grid_RenameProject[2, j].Value.ToString()) == false)
                                    {
                                        if (grid_RenameProject[1, i].Value.ToString() == grid_RenameProject[1, j].Value.ToString())
                                        {
                                            MessageBox.Show("Unable to rename conflict projects. Some new project names are invalid. Please check and modify again!!!", "Error Rename");
                                            return;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    for (int index = 0; index < grid_RenameProject.Rows.Count; index++)
                    {
                        if (Convert.ToBoolean(grid_RenameProject[2, index].Value.ToString()) == false)
                        {
                            s = grid_RenameProject[0, index].Value.ToString();
                            s_rep = grid_RenameProject[1, index].Value.ToString();
                            for (int i = 0; i < zip.Count; i++)
                                if (zip[i].FileName.IndexOf(s+"/") >= 0)
                                {
                                    zip[i].FileName = s_rep + zip[i].FileName.Substring(s.Length);
                                }
                        }
                    }
                    
                }

                zip.ExtractAll(XForm.directoryDatabase, ExtractExistingFileAction.OverwriteSilently);

                XForm.treeView1.Nodes.Clear();
                ImageList il = new ImageList();
                il.Images.Add(RLC.Properties.Resources.bag); //Hình ảnh bạn add vô réource cho dễ lấy nhé
                il.Images.Add(RLC.Properties.Resources.pj);
                il.Images.Add(RLC.Properties.Resources.group);
                il.Images.Add(RLC.Properties.Resources.unit);
                XForm.treeView1.ImageList = il;

                XForm.treeView1.Nodes.Add("Project");

                XForm.treeView1.Nodes[0].ImageIndex = 0;
                XForm.treeView1.Nodes[0].SelectedImageIndex = 0;                


                string[] folders = System.IO.Directory.GetDirectories(XForm.directoryDatabase);// lay cac folder
                foreach (string folder in folders)
                {
                    XForm.AddProject(folder.Substring(8));
                }


                MessageBox.Show("Restore projects successfully!!", "Restore Project");
                Close();
            }
        }

        private void btn_Cancel_Click(object sender, EventArgs e)
        {
            Close();
        }

        private void Backup_FormClosing(object sender, FormClosingEventArgs e)
        {
            XForm.Enabled = true;
        }
        private void select(bool check)
        {
            for (int i = 0; i < gr_project.Rows.Count; i++)
            {
                gr_project[0, i].Value = check;
            }
        }
        private void btn_selectALL_Click(object sender, EventArgs e)
        {
            select(true);
            btn_Ok.Enabled = true;
            if (this.Text == "Restore Project")
            {
                if (conflict == true)
                {
                    btn_Ok.Text = "Next";
                    label_annouce.Visible = true;
                }
            }
        }

        private void btn_selectNone_Click(object sender, EventArgs e)
        {
            select(false);
            btn_Ok.Enabled = false;
            if (this.Text == "Restore Project")
            {
                btn_Ok.Text = "Finish";
                label_annouce.Visible = false;
            }
            
        }



        private void gr_project_CellContentClick(object sender, DataGridViewCellEventArgs e)
        {

            bool check = false;
            bool exits = false;

            for (int i = 0; i < gr_project.Rows.Count; i++)
            {
                if (Convert.ToBoolean(gr_project[0, i].EditedFormattedValue.ToString()) == true)
                {
                    check = true;

                    filePath = XForm.directoryDatabase + "\\" + gr_project[1, i].Value.ToString();
                    if (System.IO.Directory.Exists(filePath)) exits = true;
                }
            }
            btn_Ok.Enabled = check;
            if (this.Text == "Restore Project")
            {
                if (exits == false)
                {
                    btn_Ok.Text = "Finish";
                    label_annouce.Visible = false;
                }
                else
                {
                    btn_Ok.Text = "Next";
                    label_annouce.Visible = true;
                }
            }
        }

        private void gr_project_CellContentDoubleClick(object sender, DataGridViewCellEventArgs e)
        {
            bool check = false;
            bool exits=false;
            
            for (int i = 0; i < gr_project.Rows.Count; i++)
            {
                if (Convert.ToBoolean(gr_project[0, i].EditedFormattedValue.ToString()) == true)
                {
                    check = true;

                    filePath=XForm.directoryDatabase+"\\"+gr_project[1,i].Value.ToString();
                    if (System.IO.Directory.Exists(filePath)) exits = true;
                }
            }
            btn_Ok.Enabled = check;
            if (this.Text == "Restore Project")
            {
                if (exits == false)
                {
                    btn_Ok.Text = "Finish";
                    label_annouce.Visible = false;
                }
                else
                {
                    btn_Ok.Text = "Next";
                    label_annouce.Visible = true;
                }
            }

        }

        private void btn_Back_Click(object sender, EventArgs e)
        {
            btn_Back.Visible = false;
            grid_RenameProject.Rows.Clear();
            label_annouce.Text = "Please choose projects that you want to backup";
            panel1.Visible = true;
            panel3.Visible = false;
            btn_Ok.Text = "Next";
            rbtn_replace.Checked = true;
        }

        private void rbtn_Rename_CheckedChanged(object sender, EventArgs e)
        {
            if (rbtn_Rename.Checked == true)
            {
                grid_RenameProject.Enabled = true;
                label_newname.Visible = true;
            }
            else
            {
                grid_RenameProject.Enabled = false;
                label_newname.Visible = false;
            }
        }

        private void grid_RenameProject_RowPostPaint(object sender, DataGridViewRowPostPaintEventArgs e)
        {
            if (grid_RenameProject.Rows[e.RowIndex].Selected)
            {
                using (Pen pen = new Pen(Color.Blue))
                {
                    int penWidth = 1;

                    pen.Width = penWidth;

                    int x = e.RowBounds.Left + (penWidth / 2);
                    int y = e.RowBounds.Top + (penWidth / 2);
                    int width = e.RowBounds.Width - penWidth;
                    int height = e.RowBounds.Height - penWidth;

                    e.Graphics.DrawRectangle(pen, x, y, width, height);
                }
            }
        }

        private void gr_project_RowPostPaint(object sender, DataGridViewRowPostPaintEventArgs e)
        {
            if (gr_project.Rows[e.RowIndex].Selected)
            {
                using (Pen pen = new Pen(Color.Blue))
                {
                    int penWidth = 1;

                    pen.Width = penWidth;

                    int x = e.RowBounds.Left + (penWidth / 2);
                    int y = e.RowBounds.Top + (penWidth / 2);
                    int width = e.RowBounds.Width - penWidth;
                    int height = e.RowBounds.Height - penWidth;

                    e.Graphics.DrawRectangle(pen, x, y, width, height);
                }
            }
        }

    }
}
