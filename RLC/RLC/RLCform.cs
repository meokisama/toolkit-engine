//#define TEST

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

using Ionic.Zip;
using System.Runtime.InteropServices;
using System.Reflection;


namespace RLC
{
    public partial class RLC1 : Form
    {
        bool transNet = false;
        public const int UDPPort = 1234;                        //1234
        public int LocalUDPPort = 5678;
        IPEndPoint AnyIP;
        EndPoint rm;
        int SoLanRetryMax = 4;
        int SoLanRetryMaxFirmware = 6;
        const int SL_NO_INPUT = 0;
        const int SL_INPUT_RLC = 48;
        const int SL_INPUT_RLC_I20 = 60;
        const int SL_INPUT_RLC_I16 = 60;
        const int SL_INPUT_BEDSIDE = 20;
        const int SL_INPUT_BEDSIDE_12T = 12;
        const int SL_INPUT_BSP_R14_OL = 14;

        const int SL_OUTPUT_RLC = 38;
        const int SL_OUTPUT_RCU_6RL = 6;
        const int SL_OUTPUT_RCU_8RL = 8;
        const int SL_OUTPUT_RCU_10AO = 10;
        const int SL_OUTPUT_BEDSIDE = 0;

        const int SL_RELAY = 32;
        public const int MAX_GROUP = 256;

        TreeNode CopyNode;
        string CopyNode_Parent;
        public string Group_Path = "";
        public string Unit_Path = "";
        public int SLGroup = MAX_GROUP;
        public string directoryDatabase = "Project";
        int act = 0;    //act=1:add; act=2:copy;   act=3:rename                
        public int rowindex = 0;
        public int form = 0;
        public bool enableGetState = true;
        public bool OK = false;
        public int[] MSGroup;
        public bool confignetwork = false;
        public int oldActMode;
        public int dev_cfg_fw_version;
        public class group_def
        {
            public string name { get; set; }
            public Byte value { get; set; }

            public group_def(string str, Byte val)
            {
                name = str;
                value = val;
            }
        };

        public BindingList<group_def> lighting_group = new BindingList<group_def> { };
        public BindingList<group_def> air_cond_group = new BindingList<group_def> { };

        public Command transfer_cmd = new Command();

        public struct Unit
        {
            public int unit, kind;
            public string Descript, IP, IDCan, Barcode, Fw_ver, Hw_ver, Manu_Date, Ip_Layer_Mask_High, Ip_Layer_Mask_Low;
            public bool LoadCan, Recovery, hw_change;
        }

        public struct IOProperty
        {
            public int Input, Function, Ramp, Preset, Led_Status, Auto_Mode, Auto_Time, DelayOff, DelayOn, NumGroup;
            public int[] Group;
            public byte[] Preset_Group;
        }
        public IOProperty[] InputNetwork;

        public byte[] OutputNetwork;
        public int[] RLCFormRelay_DelayOn, RLCFormRelay_DelayOff;
        public Light_Out_Cfg.output_info2_t[] Light_Out_Info2;
        public AC_Out_Cfg.ac_out_cfg_t[] AC_Out_Configs;
        public RS485_Config.RS485_cfg_t[] RS485_Cfg;
        public bool info2_support = true;
        public bool local_ac_support = true;
        public bool RS485_support = true;

        public Unit ConfigUnit;

        public RLC1()
        {
            InitializeComponent();
        }


        /**************************** Event Mouse Over/Leave ************************/

        private void btn_Scan_MouseHover(object sender, EventArgs e)
        {
            btn_Scan.FlatStyle = FlatStyle.Standard;
        }

        private void btn_Scan_MouseLeave(object sender, EventArgs e)
        {
            btn_Scan.FlatStyle = FlatStyle.Flat;
        }

        private void btn_EditUnitNetwork_MouseHover(object sender, EventArgs e)
        {
            btn_EditUnitNetwork.FlatStyle = FlatStyle.Standard;
        }

        private void btn_EditUnitNetwork_MouseLeave(object sender, EventArgs e)
        {
            btn_EditUnitNetwork.FlatStyle = FlatStyle.Flat;
        }

        private void btn_ConfigUnitNetwork_MouseHover(object sender, EventArgs e)
        {
            btn_ConfigUnitNetwork.FlatStyle = FlatStyle.Standard;
        }

        private void btn_ConfigUnitNetwork_MouseLeave(object sender, EventArgs e)
        {
            btn_ConfigUnitNetwork.FlatStyle = FlatStyle.Flat;
        }

        private void btn_AddtoData_MouseHover(object sender, EventArgs e)
        {
            btn_AddtoData.FlatStyle = FlatStyle.Standard;
        }

        private void btn_AddtoData_MouseLeave(object sender, EventArgs e)
        {
            btn_AddtoData.FlatStyle = FlatStyle.Flat;
        }

        private void btn_ReplaceDatabase_MouseHover(object sender, EventArgs e)
        {
            btn_ReplaceDatabase.FlatStyle = FlatStyle.Standard;
        }

        private void btn_ReplaceDatabase_MouseLeave(object sender, EventArgs e)
        {
            btn_ReplaceDatabase.FlatStyle = FlatStyle.Flat;
        }

        private void btn_TranfertoData_MouseHover(object sender, EventArgs e)
        {
            btn_TranfertoData.FlatStyle = FlatStyle.Standard;
        }

        private void btn_TranfertoData_MouseLeave(object sender, EventArgs e)
        {
            btn_TranfertoData.FlatStyle = FlatStyle.Flat;
        }

        private void btn_UpdateFirmware_MouseHover(object sender, EventArgs e)
        {
            btn_UpdateFirmware.FlatStyle = FlatStyle.Standard;
        }

        private void btn_UpdateFirmware_MouseLeave(object sender, EventArgs e)
        {
            btn_UpdateFirmware.FlatStyle = FlatStyle.Flat;
        }

        private void btn_RenameProject_MouseHover(object sender, EventArgs e)
        {
            btn_RenameProject.FlatStyle = FlatStyle.Standard;
        }

        private void btn_RenameProject_MouseLeave(object sender, EventArgs e)
        {
            btn_RenameProject.FlatStyle = FlatStyle.Flat;
        }

        private void btn_DeleteProject_MouseHover(object sender, EventArgs e)
        {
            btn_DeleteProject.FlatStyle = FlatStyle.Standard;
        }

        private void btn_DeleteProject_MouseLeave(object sender, EventArgs e)
        {
            btn_DeleteProject.FlatStyle = FlatStyle.Flat;
        }

        private void btn_AddProject_MouseHover(object sender, EventArgs e)
        {
            btn_AddProject.FlatStyle = FlatStyle.Standard;
        }

        private void btn_AddProject_MouseLeave(object sender, EventArgs e)
        {
            btn_AddProject.FlatStyle = FlatStyle.Flat;
        }

        private void btn_CopyProject_MouseHover(object sender, EventArgs e)
        {
            btn_CopyProject.FlatStyle = FlatStyle.Standard;
        }

        private void btn_CopyProject_MouseLeave(object sender, EventArgs e)
        {
            btn_CopyProject.FlatStyle = FlatStyle.Flat;
        }

        private void btn_AddGroup_MouseHover(object sender, EventArgs e)
        {
            btn_AddGroup.FlatStyle = FlatStyle.Standard;
        }

        private void btn_AddGroup_MouseLeave(object sender, EventArgs e)
        {
            btn_AddGroup.FlatStyle = FlatStyle.Flat;
        }

        private void btn_EditGroup_MouseHover(object sender, EventArgs e)
        {
            btn_EditGroup.FlatStyle = FlatStyle.Standard;
        }

        private void btn_EditGroup_MouseLeave(object sender, EventArgs e)
        {
            btn_EditGroup.FlatStyle = FlatStyle.Flat;
        }

        private void btn_DeleteGroup_MouseHover(object sender, EventArgs e)
        {
            btn_DeleteGroup.FlatStyle = FlatStyle.Standard;
        }

        private void btn_DeleteGroup_MouseLeave(object sender, EventArgs e)
        {
            btn_DeleteGroup.FlatStyle = FlatStyle.Flat;
        }

        private void btn_Paste_MouseHover(object sender, EventArgs e)
        {
            btn_Paste.FlatStyle = FlatStyle.Standard;
        }

        private void btn_Paste_MouseLeave(object sender, EventArgs e)
        {
            btn_Paste.FlatStyle = FlatStyle.Flat;
        }

        private void btn_transferToNet_MouseHover(object sender, EventArgs e)
        {
            btn_transferToNet.FlatStyle = FlatStyle.Standard;
        }

        private void btn_transferToNet_MouseLeave(object sender, EventArgs e)
        {
            btn_transferToNet.FlatStyle = FlatStyle.Flat;
        }

        private void btn_DeleteUnit_MouseHover(object sender, EventArgs e)
        {
            btn_DeleteUnit.FlatStyle = FlatStyle.Standard;
        }

        private void btn_DeleteUnit_MouseLeave(object sender, EventArgs e)
        {
            btn_DeleteUnit.FlatStyle = FlatStyle.Flat;
        }

        private void btn_ConfigUnit_MouseHover(object sender, EventArgs e)
        {
            btn_ConfigUnit.FlatStyle = FlatStyle.Standard;
        }

        private void btn_ConfigUnit_MouseLeave(object sender, EventArgs e)
        {
            btn_ConfigUnit.FlatStyle = FlatStyle.Flat;
        }

        private void btn_EditUnit_MouseHover(object sender, EventArgs e)
        {
            btn_EditUnit.FlatStyle = FlatStyle.Standard;
        }

        private void btn_EditUnit_MouseLeave(object sender, EventArgs e)
        {
            btn_EditUnit.FlatStyle = FlatStyle.Flat;
        }

        private void btn_AddUnit_MouseHover(object sender, EventArgs e)
        {
            btn_AddUnit.FlatStyle = FlatStyle.Standard;
        }

        private void btn_AddUnit_MouseLeave(object sender, EventArgs e)
        {
            btn_AddUnit.FlatStyle = FlatStyle.Flat;
        }


        /***********************************End Event Mouse Over/Leave ***************************/



        public void AddProject(string name)
        {
            TreeNode node0 = new TreeNode(Board_Attribute.LIGHTING_GROUP_NAME);
            node0.ImageIndex = 2;
            node0.SelectedImageIndex = 2;
            TreeNode node1 = new TreeNode(Board_Attribute.AIR_COND_GROUP_NAME);
            node1.ImageIndex = 2;
            node1.SelectedImageIndex = 2;
            TreeNode node2 = new TreeNode("Unit");
            node2.ImageIndex = 3;
            node2.SelectedImageIndex = 3;
            TreeNode[] array = new TreeNode[] { node0, node1, node2 };
            TreeNode NewProject = new TreeNode(name, array);
            NewProject.ImageIndex = 1;
            NewProject.SelectedImageIndex = 1;
            treeView1.Nodes[0].Nodes.Add(NewProject);
            treeView1.Nodes[0].Expand();
            treeView1.SelectedNode = NewProject;
        }

        private void btn_AddProject_Click(object sender, EventArgs e)
        {
            AddProject("New Project");
            act = 1;
            btn_RenameProject_Click(null, null);

        }

        private void exitToolStripMenuItem1_Click(object sender, EventArgs e)
        {
            Close();
        }

        private void Tat_Mo_Nut(bool check)
        {
            btn_DeleteProject.Enabled = check;
            btn_RenameProject.Enabled = check;
            renameProjectAltRToolStripMenuItem.Enabled = check;
            deleteProjectToolStripMenuItem.Enabled = check;
        }

        private void treeView1_NodeMouseClick(object sender, TreeNodeMouseClickEventArgs e)
        {
            TreeViewHitTestInfo hti = treeView1.HitTest(e.Location);
            if (e.Button == MouseButtons.Right)
            {
                if (e.Node.Parent == null)
                    contextMenuStrip_Root.Show(treeView1, new Point(hti.Node.Bounds.Left, hti.Node.Bounds.Bottom));
                else if (e.Node.Parent.ToString() == "TreeNode: Project")
                    contextMenuStrip_Project.Show(treeView1, new Point(hti.Node.Bounds.Left, hti.Node.Bounds.Bottom));
                else contextMenuStrip1.Show(treeView1, new Point(hti.Node.Bounds.Left, hti.Node.Bounds.Bottom));

                treeView1.SelectedNode = e.Node;
            }
        }

        private void RLC1_Load(object sender, EventArgs e)
        {
            if (!System.IO.Directory.Exists(directoryDatabase))
                System.IO.Directory.CreateDirectory(directoryDatabase);

            this.Location = new Point(0, 0);
            //this.Size = Screen.PrimaryScreen.WorkingArea.Size;
            this.MaximizedBounds = Screen.FromHandle(this.Handle).WorkingArea;


            AnyIP = new IPEndPoint(IPAddress.Any, 0);
            rm = new IPEndPoint(IPAddress.Any, 0);



            treeView1.Nodes[0].Expand();
            ImageList il = new ImageList();
            il.Images.Add(RLC.Properties.Resources.bag); //Hình ảnh bạn add vô réource cho dễ lấy nhé
            il.Images.Add(RLC.Properties.Resources.pj);
            il.Images.Add(RLC.Properties.Resources.group);
            il.Images.Add(RLC.Properties.Resources.unit);
            treeView1.ImageList = il;

            string[] folders = Directory.GetDirectories(directoryDatabase);// lay cac folder
            foreach (string folder in folders)
            {
                AddProject(folder.Substring(8));
            }


        }

        private void btn_DeleteProject_Click(object sender, EventArgs e)
        {
            DialogResult lkResult = MessageBox.Show("Are you sure to delete Project: \"" + treeView1.SelectedNode.Text + "\"", "Deleted Project", MessageBoxButtons.YesNo);

            if (lkResult == DialogResult.Yes)
            {
                string Name = treeView1.SelectedNode.Text;
                string filePath = directoryDatabase + @"\" + Name;
                DeleteFolder(filePath);
                treeView1.SelectedNode.Remove();
                return;

            }


        }

        private void Tat_Mo_Paste(bool check)
        {
            pasteProjectToolStripMenuItem.Enabled = check;
            tstripChild_Paste.Enabled = check;
            toolStripMenuItem6.Enabled = check;
            btn_Paste.Enabled = check;
        }
        private void btn_CopyProject_Click(object sender, EventArgs e)
        {
            CopyNode = (TreeNode)treeView1.SelectedNode.Clone();
            CopyNode_Parent = treeView1.SelectedNode.Parent.Text;
            treeView1.Select();
            Tat_Mo_Paste(true);
        }

        private void pasteProjectToolStripMenuItem_Click(object sender, EventArgs e)
        {
            int IndexOfNode;
            if (treeView1.SelectedNode.Parent == null)
            {
                if (CopyNode.SelectedImageIndex == 1)
                {
                    treeView1.Nodes[0].Nodes.Add(CopyNode);
                    act = 2;
                    treeView1.SelectedNode = CopyNode;
                    btn_RenameProject_Click(null, null);
                }
                return;
            }

            if (treeView1.SelectedNode.Parent.ToString() == "TreeNode: Project") IndexOfNode = treeView1.SelectedNode.Index;
            else IndexOfNode = treeView1.SelectedNode.Parent.Index;

            if ((CopyNode.Text.Contains("Group") == false) && (CopyNode.Text != "Unit"))
            {
                treeView1.Nodes[0].Nodes.Add(CopyNode);
                act = 2;
                treeView1.SelectedNode = CopyNode;
                btn_RenameProject_Click(null, null);
            }
            else
            {

                if (CopyNode.Text.Contains("Group") == true)
                {
                    string desName = directoryDatabase + @"\" + treeView1.Nodes[0].Nodes[IndexOfNode].Text + @"\" + CopyNode.Text + ".csv";
                    string sName = directoryDatabase + @"\" + CopyNode_Parent + @"\" + CopyNode.Text + ".csv";
                    DialogResult lkResult = MessageBox.Show("Are you sure to copy \"" + CopyNode.Text + "\" from Project: \"" + CopyNode_Parent + "\" to Project: \"" + treeView1.Nodes[0].Nodes[IndexOfNode].Text + "\". It will be Overwrited?", "Copy Group", MessageBoxButtons.YesNo);

                    if ((lkResult == DialogResult.Yes) && (sName != desName)) File.Copy(sName, desName, true);
                    treeView1.SelectedNode = treeView1.Nodes[0].Nodes[IndexOfNode];
                    if (CopyNode.Text == Board_Attribute.LIGHTING_GROUP_NAME)
                    {
                        treeView1.SelectedNode = treeView1.Nodes[0].Nodes[IndexOfNode].Nodes[0];
                    }
                    else if (CopyNode.Text == Board_Attribute.AIR_COND_GROUP_NAME)
                    {
                        treeView1.SelectedNode = treeView1.Nodes[0].Nodes[IndexOfNode].Nodes[1];
                    }
                }
                else
                {
                    string desName = directoryDatabase + @"\" + treeView1.Nodes[0].Nodes[IndexOfNode].Text + @"\" + "Unit";
                    string sName = directoryDatabase + @"\" + CopyNode_Parent + @"\" + "Unit";
                    DialogResult lkResult = MessageBox.Show("Are you sure to copy \"Unit\" from Project: \"" + CopyNode_Parent + "\" to Project: \"" + treeView1.Nodes[0].Nodes[IndexOfNode].Text + "\". It will be Overwrited ?", "Copy Unit", MessageBoxButtons.YesNo);

                    if ((lkResult == DialogResult.Yes) && (sName != desName))
                    {
                        DeleteFolder(desName);
                        CopyFolder(sName, desName);
                    }
                    treeView1.SelectedNode = treeView1.Nodes[0].Nodes[IndexOfNode];
                    treeView1.SelectedNode = treeView1.Nodes[0].Nodes[IndexOfNode].Nodes[2];

                }
            }
            Tat_Mo_Paste(false);
        }

        private void btn_RenameProject_Click(object sender, EventArgs e)
        {
            Tat_Mo_Nut(false);
            btn_AddProject.Enabled = false;
            btn_CopyProject.Enabled = false;
            menuStrip1.Enabled = false;
            treeView1.LabelEdit = true;
            if (act == 0) act = 3;
            if (!treeView1.SelectedNode.IsEditing)
            {
                treeView1.SelectedNode.BeginEdit();
            }
        }

        private void LoadUnit(string filePath)
        {
            gr_Unit.Rows.Clear();
            string input;
            DirectoryInfo drInfo = new DirectoryInfo(filePath);
            DirectoryInfo[] folders = drInfo.GetDirectories(); // lay cac folder
            FileInfo[] files = drInfo.GetFiles(); //lay cac files
            foreach (FileInfo f in files)
            {
                StreamReader rd = File.OpenText(f.FullName);
                input = rd.ReadLine();
                int count = 0;
                string[] s;
                s = new string[10];
                for (int i = 0; i < input.Length; i++)
                {
                    if (input[i] != ',') s[count] = s[count] + input[i];
                    else
                    {
                        count++;
                    }
                }
                if (count == 6)  // old database
                {
                    s[8] = s[6];
                    s[6] = s[7] = "No Info";
                }

                if (s[9] == "") s[9] = "0";

                if (s[0] == "RCU-6RL")
                    s[0] = "GNT-EXT-6RL";
                if (s[0] == "RCU-8RL")
                    s[0] = "GNT-EXT-8RL";
                if (s[0] == "RCU-10AO")
                    s[0] = "GNT-EXT-10AO";
                gr_Unit.Rows.Add(s[0], s[1], s[2], s[3], s[4], Convert.ToBoolean(s[5]), s[6], s[7], s[8], Convert.ToBoolean(s[9]));

                rd.Close();
            }
        }

        private void treeView1_AfterSelect(object sender, TreeViewEventArgs e)
        {
            treeView1.LabelEdit = false;

            string dirPath = treeView1.SelectedNode.FullPath;
            int count = 0;


            /* Load the Ip address from the first unit file name */
            if (dirPath != "Project")
            {
                for (int i = 0; i < dirPath.Length; i++)
                {
                    if (dirPath[i] == '\\')
                    {
                        count++;
                    }

                    if (count == 2)
                    {
                        dirPath = dirPath.Substring(0, i);
                        break;
                    }
                }
                dirPath = dirPath + @"\Unit"; // Get the dir path to files with store the IP address


            }

            if ((e.Node.Parent != null) && (e.Node.Parent.ToString() == "TreeNode: Project")) Tat_Mo_Nut(true);
            else Tat_Mo_Nut(false);

            if (e.Node.Parent == null)
            {
                label1.Text = "Room Controller";
                btn_CopyProject.Enabled = false;
                copyProjectToolStripMenuItem.Enabled = false;
            }
            else if (e.Node.Parent.ToString() == "TreeNode: Project")
            {
                label1.Text = "Project - " + e.Node.Text;
            }

            if (e.Node.Parent == null)
            {
                btn_CopyProject.Enabled = false;
                copyProjectToolStripMenuItem.Enabled = false;
            }
            else
            {
                btn_CopyProject.Enabled = true;
                copyProjectToolStripMenuItem.Enabled = true;
            }
            string s;
            s = treeView1.SelectedNode.ToString();



            if (s.Substring(s.Length - 5) == "Group")
            {
                label1.Text = treeView1.SelectedNode.Text + " in Database - " + treeView1.SelectedNode.Parent.ToString().Substring(10);
                btn_AddGroup.Enabled = true;

                // Correct the old database   
                string group_filePath = treeView1.SelectedNode.Parent.FullPath + "\\" + Board_Attribute.LIGHTING_GROUP_NAME + ".csv";

                string file_old_path = group_filePath.Replace(Board_Attribute.LIGHTING_GROUP_NAME, "Group");
                if (File.Exists(file_old_path) == true)
                {
                    File.Move(file_old_path, group_filePath);
                }

                if (File.Exists(group_filePath) == false)
                {
                    FileStream fs = File.Create(group_filePath);
                    fs.Close();
                }
                // End of correcting old database

                /* Load all group */

                // Air conditioner group
                string filePath = treeView1.SelectedNode.Parent.FullPath + "\\" + Board_Attribute.AIR_COND_GROUP_NAME + ".csv";
                LoadGroup(filePath);

                air_cond_group.Clear();
                air_cond_group.Add(new group_def("<Unused>", 0));

                for (int i = 0; i < gr_Group.Rows.Count; i++)
                {
                    air_cond_group.Add(new group_def(gr_Group.Rows[i].Cells[0].Value.ToString(), Convert.ToByte(gr_Group.Rows[i].Cells[1].Value.ToString())));
                }

                // Lighting group
                filePath = treeView1.SelectedNode.Parent.FullPath + "\\" + Board_Attribute.LIGHTING_GROUP_NAME + ".csv";
                LoadGroup(filePath);

                lighting_group.Clear();
                lighting_group.Add(new group_def("<Unused>", 0));
                for (int i = 0; i < gr_Group.Rows.Count; i++)
                {
                    lighting_group.Add(new group_def(gr_Group.Rows[i].Cells[0].Value.ToString(), Convert.ToByte(gr_Group.Rows[i].Cells[1].Value.ToString())));
                }


                /* End of loading group */
                filePath = treeView1.SelectedNode.FullPath + ".csv";
                LoadGroup(filePath);

            }
            else
            {
                btn_AddGroup.Enabled = false;
                btn_EditGroup.Enabled = false;
                btn_DeleteGroup.Enabled = false;
                gr_Group.Rows.Clear();
            }

            if (s.Substring(s.Length - 4) == "Unit")
            {
                // Correct the old database   
                string group_filePath = treeView1.SelectedNode.Parent.FullPath + "\\" + Board_Attribute.LIGHTING_GROUP_NAME + ".csv";

                string file_old_path = group_filePath.Replace(Board_Attribute.LIGHTING_GROUP_NAME, "Group");
                if (File.Exists(file_old_path) == true)
                {
                    File.Move(file_old_path, group_filePath);
                }

                if (File.Exists(group_filePath) == false)
                {
                    FileStream fs = File.Create(group_filePath);
                    fs.Close();
                }
                // End of correcting old database

                /* Load all group */

                // Air conditioner group
                string filePath = treeView1.SelectedNode.Parent.FullPath + "\\" + Board_Attribute.AIR_COND_GROUP_NAME + ".csv";
                LoadGroup(filePath);

                air_cond_group.Clear();
                air_cond_group.Add(new group_def("<Unused>", 0));

                for (int i = 0; i < gr_Group.Rows.Count; i++)
                {
                    air_cond_group.Add(new group_def(gr_Group.Rows[i].Cells[0].Value.ToString(), Convert.ToByte(gr_Group.Rows[i].Cells[1].Value.ToString())));
                }

                // Lighting group
                filePath = treeView1.SelectedNode.Parent.FullPath + "\\" + Board_Attribute.LIGHTING_GROUP_NAME + ".csv";
                LoadGroup(filePath);

                lighting_group.Clear();
                lighting_group.Add(new group_def("<Unused>", 0));
                for (int i = 0; i < gr_Group.Rows.Count; i++)
                {
                    lighting_group.Add(new group_def(gr_Group.Rows[i].Cells[0].Value.ToString(), Convert.ToByte(gr_Group.Rows[i].Cells[1].Value.ToString())));
                }


                /* End of loading group */

                label1.Text = "Units in Database - " + treeView1.SelectedNode.Parent.ToString().Substring(10);
                btn_AddUnit.Enabled = true;

                btn_DeleteGroup.Enabled = false;    //added by Hoai An
                btn_EditGroup.Enabled = false;

                gr_Group.Visible = false;
                gr_Unit.Visible = true;
                panel2.Visible = true;
                grBoardNetwork.Visible = true;
                if (grBoardNetwork.Rows.Count > 0)
                {
                    updateFirmwareToolStripMenuItem.Enabled = true;
                }
                panel4.Visible = true;

                filePath = treeView1.SelectedNode.FullPath;
                LoadUnit(filePath);
                if (gr_Unit.Rows.Count > 0)
                {
                    btn_EditUnit.Enabled = true;
                    btn_ConfigUnit.Enabled = true;
                    btn_DeleteUnit.Enabled = true;
                    if (grBoardNetwork.Rows.Count > 0)
                    {
                        btn_transferToNet.Enabled = true;
                        btn_ReplaceDatabase.Enabled = true;
                    }
                    else
                    {
                        btn_transferToNet.Enabled = false;
                        btn_ReplaceDatabase.Enabled = false;
                    }
                }
                else
                {
                    btn_EditUnit.Enabled = false;
                    btn_ConfigUnit.Enabled = false;
                    btn_DeleteUnit.Enabled = false;
                    btn_transferToNet.Enabled = false;
                    btn_ReplaceDatabase.Enabled = false;
                }
            }
            else
            {
                updateFirmwareToolStripMenuItem.Enabled = false;
                btn_AddUnit.Enabled = false;
                gr_Group.Visible = true;
                gr_Unit.Visible = false;
                panel2.Visible = false;
                grBoardNetwork.Visible = false;
                panel4.Visible = false;

                gr_Unit.Rows.Clear();
                btn_EditUnit.Enabled = false;
                btn_ConfigUnit.Enabled = false;
                btn_DeleteUnit.Enabled = false;
            }



        }
        public void LoadGroup(string filepath)
        {
            if (File.Exists(filepath) == false)
            {
                FileStream fs = File.Create(filepath);
                fs.Close();
            }

            gr_Group.Rows.Clear();
            MSGroup = new int[SLGroup];
            for (int i = 0; i < SLGroup; i++)
                MSGroup[i] = -2;

            MSGroup[0] = -1;
            StreamReader rd = File.OpenText(filepath);
            string input = null;
            string name = "", address = "", descript = "";
            int dem = 0;
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
                            address = s;
                            s = "";
                        }
                    }
                }
                descript = s;
                gr_Group.Rows.Add(name, address, descript);
                MSGroup[Convert.ToInt16(address)] = dem;
                dem++;

            }
            rd.Close();

            if (gr_Group.Rows.Count > 0)
            {
                btn_EditGroup.Enabled = true;
                btn_DeleteGroup.Enabled = true;
            }
            else
            {
                btn_EditGroup.Enabled = false;
                btn_DeleteGroup.Enabled = false;
            }
        }

        public void btn_AddGroup_Click(object sender, EventArgs e)
        {
            string group_type = "";
            if (treeView1.SelectedNode.FullPath.Contains(Board_Attribute.LIGHTING_GROUP_NAME))
            {
                group_type = Board_Attribute.LIGHTING_GROUP_NAME;
            }
            else if (treeView1.SelectedNode.FullPath.Contains(Board_Attribute.AIR_COND_GROUP_NAME))
            {
                group_type = Board_Attribute.AIR_COND_GROUP_NAME;
            }
            add_group(group_type);
        }

        public void add_group(string group_type)
        {
            Add_Group AddGroup = new Add_Group(group_type, "New Group", 0, "No Description");

            AddGroup.Text = "Add_Group";
            AddGroup.Initialize(this);
            this.Enabled = false;
            AddGroup.Show();
            AddGroup.Focus();
        }

        private void treeView1_AfterLabelEdit(object sender, NodeLabelEditEventArgs e)
        {
            string filePath = directoryDatabase + @"\" + e.Label;

            if ((e.Label == null) && (act == 1)) filePath = filePath + "New Project";

            if ((e.Label != null) && (e.Label.IndexOf('/') >= 0))
            {
                MessageBox.Show("The project name has / character.Please modify again!!!", "Notification");
                e.CancelEdit = true;
                treeView1.SelectedNode.BeginEdit();
            }
            else if ((System.IO.Directory.Exists(filePath)) && ((act != 3) || (e.Label != null)))
            {
                MessageBox.Show("Project name already exists. Please choose another name!");
                e.CancelEdit = true;
                treeView1.SelectedNode.BeginEdit();
            }

            else
            {
                string old_Name = treeView1.SelectedNode.Text;
                if (act == 2) old_Name = CopyNode.Text;
                if (e.Label != null) treeView1.SelectedNode.Text = e.Label;
                if ((act == 3) && (e.Label == null))
                {
                    Tat_Mo_Nut(true);
                    btn_AddProject.Enabled = true;
                    btn_CopyProject.Enabled = true;
                    menuStrip1.Enabled = true;
                    act = 0;
                    treeView1.LabelEdit = false;
                    return;
                }
                XuLyFile(act, treeView1.SelectedNode.Text, old_Name);
            }
        }


        private void XuLyFile(int act1, string Name, string old_name)
        {
            if (!System.IO.Directory.Exists(directoryDatabase))
                System.IO.Directory.CreateDirectory(directoryDatabase);
            string filePath = directoryDatabase + @"\" + Name;
            string oldfilePath = directoryDatabase + @"\" + old_name;

            if (act1 == 1)
            {
                if (!System.IO.Directory.Exists(filePath))
                {
                    System.IO.Directory.CreateDirectory(filePath);
                    string filePath1 = filePath + @"\" + Board_Attribute.LIGHTING_GROUP_NAME + ".csv";
                    FileStream fs;
                    fs = new FileStream(filePath1, FileMode.Create);
                    fs.Close();

                    filePath1 = filePath + @"\" + Board_Attribute.AIR_COND_GROUP_NAME + ".csv";
                    fs = new FileStream(filePath1, FileMode.Create);
                    fs.Close();

                    filePath = filePath + @"\" + "Unit";

                    if (!System.IO.Directory.Exists(filePath))
                        System.IO.Directory.CreateDirectory(filePath);

                    Tat_Mo_Nut(true);
                    btn_AddProject.Enabled = true;
                    btn_CopyProject.Enabled = true;
                    menuStrip1.Enabled = true;
                    act = 0;
                    treeView1.LabelEdit = false;
                }
                else
                {
                    MessageBox.Show("Project name already exists. Please choose another name!");
                    btn_RenameProject_Click(null, null);
                }
            }
            else if (act == 2)
            {
                if (!System.IO.Directory.Exists(filePath))
                {
                    CopyFolder(oldfilePath, filePath);
                    Tat_Mo_Nut(true);
                    btn_AddProject.Enabled = true;
                    btn_CopyProject.Enabled = true;
                    menuStrip1.Enabled = true;
                    act = 0;
                    treeView1.LabelEdit = false;
                }
                else
                {
                    MessageBox.Show("Project name already exists. Please choose another name!");
                    btn_RenameProject_Click(null, null);
                }
            }
            else
            {

                if ((!System.IO.Directory.Exists(filePath)) && (oldfilePath != filePath))
                {
                    System.IO.Directory.Move(oldfilePath, filePath);
                    Tat_Mo_Nut(true);
                    btn_AddProject.Enabled = true;
                    btn_CopyProject.Enabled = true;
                    menuStrip1.Enabled = true;
                    act = 0;
                    treeView1.LabelEdit = false;
                }
                else
                {
                    MessageBox.Show("Project name already exists. Please choose another name!");
                    btn_RenameProject_Click(null, null);
                }
            }



        }
        public void DeleteFolder(string path)
        {
            DirectoryInfo drInfo = new DirectoryInfo(path);
            DirectoryInfo[] folders = drInfo.GetDirectories(); // lay cac folder
            FileInfo[] files = drInfo.GetFiles(); //lay cac files

            // neu van con thu muc con thi phai xoa het cac thu muc con
            if (folders != null)
            {
                foreach (DirectoryInfo fol in folders)
                {
                    DeleteFolder(fol.FullName);  //xoa thu muc con va cac file trong thu muc con do
                }

            }

            //Neu van con file thi phai xoa het cac file
            if (files != null)
            {
                foreach (FileInfo f in files)
                {
                    File.Delete(f.FullName);
                }
            }
            //Cuoi cung xoa thu muc goc
            Directory.Delete(path);
        }

        public void CopyFolder(string SourceFolder, string DestFolder)
        {
            if (!Directory.Exists(DestFolder)) // folder ton tai thi moi thuc hien copy
            {
                Directory.CreateDirectory(DestFolder); //Tao folder moi
            }
            string[] files = Directory.GetFiles(SourceFolder);
            //Neu co file thy phai copy file
            foreach (string file in files)
            {
                string name = Path.GetFileName(file);
                string dest = Path.Combine(DestFolder, name);
                File.Copy(file, dest, true);
            }

            string[] folders = Directory.GetDirectories(SourceFolder);
            foreach (string folder in folders)
            {
                string name = Path.GetFileName(folder);
                string dest = Path.Combine(DestFolder, name);
                CopyFolder(folder, dest);
            }

        }

        public void btn_EditGroup_Click(object sender, EventArgs e)
        {
            string group_type = "";
            int index = gr_Group.CurrentCell.RowIndex;

            if (treeView1.SelectedNode.FullPath.Contains(Board_Attribute.LIGHTING_GROUP_NAME))
            {
                group_type = Board_Attribute.LIGHTING_GROUP_NAME;
            }
            else if (treeView1.SelectedNode.FullPath.Contains(Board_Attribute.AIR_COND_GROUP_NAME))
            {
                group_type = Board_Attribute.AIR_COND_GROUP_NAME;
            }

            string group_name = gr_Group.Rows[index].Cells[0].Value.ToString();
            Byte group_value = Convert.ToByte(gr_Group.Rows[index].Cells[1].Value.ToString());
            string group_desc = gr_Group.Rows[index].Cells[2].Value.ToString();

            edit_group(group_type, group_name, group_value, group_desc);
        }

        public void edit_group(string group_type, string gr_name, Byte gr_value, string gr_desc)
        {
            Add_Group AddGroup = new Add_Group(group_type, gr_name, gr_value, gr_desc);
            AddGroup.Initialize(this);
            AddGroup.Text = "Edit_Group";
            this.Enabled = false;
            AddGroup.Show();
            AddGroup.Focus();
        }

        public void LuuGroup(string filePath)
        {
            Board_Attribute board_attr = new Board_Attribute();

            FileStream fs;
            fs = new FileStream(filePath, FileMode.Create);
            StreamWriter sWriter = new StreamWriter(fs, Encoding.UTF8);
            int i = 0;
            string Data;


            while (i < gr_Group.Rows.Count)
            {
                if ((board_attr.Check_value_in_group(this, Convert.ToByte(gr_Group.Rows[i].Cells[1].Value.ToString()), treeView1.SelectedNode.Text)) == true)
                {
                    Data = gr_Group.Rows[i].Cells[0].Value.ToString() + "," + gr_Group.Rows[i].Cells[1].Value.ToString() + "," + gr_Group.Rows[i].Cells[2].Value.ToString();
                    sWriter.WriteLine(Data);
                    sWriter.Flush();
                }
                i = i + 1;
            }
            fs.Close();

        }

        private void gr_Group_RowsRemoved(object sender, DataGridViewRowsRemovedEventArgs e)
        {
            if (gr_Group.Rows.Count == 0)
            {
                btn_EditGroup.Enabled = false;
                btn_DeleteGroup.Enabled = false;
            }
        }

        private bool gr_Group_Delete(int index)
        {
            DialogResult lkResult = MessageBox.Show("Are you sure to delete Group: \"" + gr_Group.Rows[index].Cells[0].Value.ToString() + "\" , Address: " + gr_Group.Rows[index].Cells[1].Value.ToString(), "Delete Group", MessageBoxButtons.YesNo);

            if (lkResult == DialogResult.Yes)
            {
                Board_Attribute board_att = new Board_Attribute();
                BindingList<group_def> group_type = board_att.Get_group_list_from_type(this, treeView1.SelectedNode.Text);

                //group_def group = new group_def(gr_Group.Rows[index].Cells[0].Value.ToString(), Convert.ToByte(gr_Group.Rows[index].Cells[1].Value.ToString()));
                group_type.Remove(group_type.Where(x => x.value == Convert.ToByte(gr_Group.Rows[index].Cells[1].Value.ToString())).First());

                LuuGroup(treeView1.SelectedNode.FullPath + ".csv");
            }

            return (lkResult == DialogResult.Yes);
        }

        private void gr_Group_UserDeletingRow(object sender, DataGridViewRowCancelEventArgs e)
        {
            if (gr_Group_Delete(e.Row.Index) == false)
            {
                e.Cancel = true;
            }
        }

        private void btn_DeleteGroup_Click(object sender, EventArgs e)
        {
            int index = gr_Group.CurrentCell.RowIndex;
            if (gr_Group_Delete(index) == true)
            {
                gr_Group.Rows.RemoveAt(index);
            }
        }

        public void btn_AddUnit_Click(object sender, EventArgs e)
        {
            //int index = gr_Unit.CurrentCell.RowIndex;
            ConfigUnit.unit = 2;
            ConfigUnit.Descript = "No Description";
            ConfigUnit.IP = "1.2";
            ConfigUnit.IDCan = "0.0.0.1";
            ConfigUnit.kind = 0;
            ConfigUnit.Fw_ver = "2.0.0";
            ConfigUnit.Hw_ver = "No Info";
            ConfigUnit.LoadCan = false;
            ConfigUnit.Recovery = false;
            ConfigUnit.Ip_Layer_Mask_High = "192";
            ConfigUnit.Ip_Layer_Mask_Low = "168";

            // Always support max RS485 when adding new unit.
            RS485_Cfg = new RS485_Config.RS485_cfg_t[RS485_Config.RS485_MAX_CONFIG];
            RS485_support = true;

            for (int i = 0; i < RS485_Cfg.Length; i++)
            {
                RS485_Cfg[i] = new RS485_Config.RS485_cfg_t();
                for (int j = 0; j < RS485_Config.SLAVE_MAX_DEVS; j++)
                {
                    RS485_Cfg[i].slave_cfg[j] = new RS485_Config.slave_cfg_t();
                }
            }

            Add_Unit AddUnit = new Add_Unit();
            AddUnit.Initialize(this);
            AddUnit.edit = false;
            Group_Path = treeView1.SelectedNode.FullPath;
            this.Enabled = false;
            AddUnit.Show();
            AddUnit.Focus();
        }

        private void Load_RS485_from_file(string path)
        {
            StreamReader rd = File.OpenText(path);
            rd.ReadLine(); // skip the first basic info. Next will be the RS485 config

            List<string> RS485_cfg_list = new List<string>();
            string rs485_cfg_str = rd.ReadLine();

            while (rs485_cfg_str != null && rs485_cfg_str.Contains("RS485") == true)
            {
                RS485_cfg_list.Add(rs485_cfg_str);
                rs485_cfg_str = rd.ReadLine();
            }

            rd.Close();

            if (RS485_cfg_list.Count == 0) // Haven't had the database for RS485, we will set default MAX RS485 configs.
            {
                RS485_Cfg = new RS485_Config.RS485_cfg_t[RS485_Config.RS485_MAX_CONFIG];
                RS485_support = true;
                for (int i = 0; i < RS485_Cfg.Length; i++)
                {
                    RS485_Cfg[i] = new RS485_Config.RS485_cfg_t();
                    for (int j = 0; j < RS485_Config.SLAVE_MAX_DEVS; j++)
                    {
                        RS485_Cfg[i].slave_cfg[j] = new RS485_Config.slave_cfg_t();
                    }
                }
            }
            else
            {
                int num_RS485_cfg = Math.Min(Convert.ToByte(Substring(',', 1, RS485_cfg_list[0])), RS485_cfg_list.Count - 1);

                RS485_support = (num_RS485_cfg > 0);

                if (RS485_support)
                {
                    RS485_Cfg = new RS485_Config.RS485_cfg_t[num_RS485_cfg];
                    for (int i = 0; i < RS485_Cfg.Length; i++)
                    {
                        RS485_Cfg[i] = new RS485_Config.RS485_cfg_t();
                        for (int j = 0; j < RS485_Config.SLAVE_MAX_DEVS; j++)
                        {
                            RS485_Cfg[i].slave_cfg[j] = new RS485_Config.slave_cfg_t();
                        }
                    }

                    for (int i = 0; i < num_RS485_cfg; i++)
                    {
                        FieldInfo[] fields = RS485_Cfg[0].GetType().GetFields();

                        string input = RS485_cfg_list[i + 1]; // skip the first number of RS485
                        int idx = 1; //Skip header RS485

                        foreach (var xInfo in fields)
                        {
                            UInt32 val = Convert.ToUInt32(Substring(',', idx++, input));

                            if (xInfo.FieldType.Name == "Byte")
                            {
                                xInfo.SetValueDirect(__makeref(RS485_Cfg[i]), Convert.ToByte(val));
                            }
                            else if (xInfo.FieldType.Name == "UInt16")
                            {
                                xInfo.SetValueDirect(__makeref(RS485_Cfg[i]), Convert.ToUInt16(val));
                            }
                            else if (xInfo.FieldType.Name == "UInt32")
                            {
                                xInfo.SetValueDirect(__makeref(RS485_Cfg[i]), (val));
                            }
                            else if (xInfo.FieldType.Name == "Byte[]")
                            {
                                idx--;

                                Array arr = (Array)xInfo.GetValue(RS485_Cfg[i]);
                                Byte[] byte_arr = new Byte[arr.Length];

                                for (int index = 0; index < arr.Length; index++)
                                {
                                    byte_arr[index] = Convert.ToByte(Substring(',', idx++, input));
                                }
                                xInfo.SetValueDirect(__makeref(RS485_Cfg[i]), byte_arr);
                            }
                            else if (xInfo.FieldType.Name == "slave_cfg_t[]")
                            {
                                idx--;

                                FieldInfo[] slave_cfgs = typeof(RS485_Config.slave_cfg_t).GetFields();

                                for (int index = 0; index < RS485_Cfg[i].slave_cfg.Length; index++)
                                {
                                    foreach (var cfg in slave_cfgs)
                                    {
                                        val = Convert.ToUInt32(Substring(',', idx++, input));

                                        if (cfg.FieldType.Name == "Byte")
                                        {
                                            cfg.SetValueDirect(__makeref(RS485_Cfg[i].slave_cfg[index]), Convert.ToByte(val));
                                        }
                                        else if (cfg.FieldType.Name == "UInt16")
                                        {
                                            cfg.SetValueDirect(__makeref(RS485_Cfg[i].slave_cfg[index]), Convert.ToUInt16(val));
                                        }
                                        else if (cfg.FieldType.Name == "UInt32")
                                        {
                                            cfg.SetValueDirect(__makeref(RS485_Cfg[i].slave_cfg[index]), (val));
                                        }
                                        else if (cfg.FieldType.Name == "Byte[]")
                                        {
                                            idx--;

                                            Array arr = (Array)cfg.GetValue(RS485_Cfg[i].slave_cfg[index]);
                                            Byte[] byte_arr = new Byte[arr.Length];

                                            for (int j = 0; j < arr.Length; j++)
                                            {
                                                byte_arr[j] = Convert.ToByte(Substring(',', idx++, input));
                                            }
                                            cfg.SetValueDirect(__makeref(RS485_Cfg[i].slave_cfg[index]), byte_arr);
                                        }

                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        private void btn_EditUnit_Click(object sender, EventArgs e)
        {
            int index = gr_Unit.CurrentCell.RowIndex;
            rowindex = index;
            ConfigUnit.Ip_Layer_Mask_High = Substring('.', 0, gr_Unit[2, index].Value.ToString());
            ConfigUnit.Ip_Layer_Mask_Low = Substring('.', 1, gr_Unit[2, index].Value.ToString());
            ConfigUnit.IP = "";
            ConfigUnit.IDCan = gr_Unit[3, index].Value.ToString();

            ConfigUnit.unit = 0;
            if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RLC-I16") ConfigUnit.unit = 1;
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RLC-I20") ConfigUnit.unit = 2;
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "Bedside-17T") ConfigUnit.unit = 3;
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "Bedside-12T") ConfigUnit.unit = 4;
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "BSP_R14_OL") ConfigUnit.unit = 5;
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RCU-32AO") ConfigUnit.unit = 6;
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RCU-8RL-24AO") ConfigUnit.unit = 7;
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RCU-16RL-16AO") ConfigUnit.unit = 8;
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RCU-24RL-8AO") ConfigUnit.unit = 9;
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RCU-11IN-4RL") ConfigUnit.unit = 10;
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RCU-21IN-8RL") ConfigUnit.unit = 11;
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RCU-21IN-8RL-4AO") ConfigUnit.unit = 12;
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RCU-21IN-8RL-4AI") ConfigUnit.unit = 13;
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RCU-21IN-8RL-K") ConfigUnit.unit = 14;
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RCU-21IN-8RL-DL") ConfigUnit.unit = 15;
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RCU-21IN-10RL") ConfigUnit.unit = 16;
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RCU-30IN-10RL") ConfigUnit.unit = 17;
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RCU-48IN-16RL") ConfigUnit.unit = 18;
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RCU-48IN-16RL-4AO") ConfigUnit.unit = 19;
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RCU-48IN-16RL-4AI") ConfigUnit.unit = 20;
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RCU-48IN-16RL-K") ConfigUnit.unit = 21;
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RCU-48IN-16RL-DL") ConfigUnit.unit = 22;
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "GNT-EXT-6RL") ConfigUnit.unit = 23;   //old name: RCU-6RL
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "GNT-EXT-8RL") ConfigUnit.unit = 24;  //old name: RCU-8RL
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "GNT-EXT-12RL") ConfigUnit.unit = 25;
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "GNT-EXT-20RL") ConfigUnit.unit = 26;
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "GNT-EXT-10AO") ConfigUnit.unit = 27;  //old name: RCU-10AO
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "GNT-EXT-28AO") ConfigUnit.unit = 28;
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "GNT-EXT-12RL-12AO") ConfigUnit.unit = 29;
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "GNT-EXT-24IN") ConfigUnit.unit = 30;
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "GNT-EXT-48IN") ConfigUnit.unit = 31;
            ConfigUnit.Descript = gr_Unit.Rows[index].Cells[8].Value.ToString();

            int dem = 0;
            for (int i = 0; i < gr_Unit.Rows[index].Cells[2].Value.ToString().Length; i++)
            {
                if (dem >= 2) ConfigUnit.IP = ConfigUnit.IP + gr_Unit.Rows[index].Cells[2].Value.ToString()[i];
                if (gr_Unit.Rows[index].Cells[2].Value.ToString()[i] == '.') dem++;
            }
            dem = 0;

            if (gr_Unit.Rows[index].Cells[4].Value.ToString() == "Master") ConfigUnit.kind = 2;
            else if (gr_Unit.Rows[index].Cells[4].Value.ToString() == "Slave") ConfigUnit.kind = 1;
            else ConfigUnit.kind = 0;

            ConfigUnit.LoadCan = Convert.ToBoolean(gr_Unit.Rows[index].Cells[5].Value.ToString());
            ConfigUnit.Fw_ver = gr_Unit.Rows[index].Cells[6].Value.ToString();
            ConfigUnit.Hw_ver = gr_Unit.Rows[index].Cells[7].Value.ToString();
            ConfigUnit.Recovery = Convert.ToBoolean(gr_Unit.Rows[index].Cells[9].Value.ToString());

            Group_Path = treeView1.SelectedNode.FullPath;
            string unit_path = treeView1.SelectedNode.FullPath + "\\" + gr_Unit.Rows[index].Cells[2].Value.ToString() + "&" + gr_Unit.Rows[index].Cells[3].Value.ToString();
            Load_RS485_from_file(unit_path);

            Add_Unit AddUnit = new Add_Unit();
            AddUnit.Initialize(this);
            AddUnit.edit = true;
            AddUnit.Text = "Edit_Unit_Database";

            this.Enabled = false;
            AddUnit.Show();
            AddUnit.Focus();
        }

        private void gr_Unit_UserDeletingRow(object sender, DataGridViewRowCancelEventArgs e)
        {
            DialogResult lkResult = MessageBox.Show("Are you sure to delete Unit: \"" + e.Row.Cells[0].Value.ToString() + "\" , IP Address: " + e.Row.Cells[2].Value.ToString(), "Delete Unit", MessageBoxButtons.YesNo);

            if (lkResult == DialogResult.Yes)
            {
                string filePath = treeView1.SelectedNode.FullPath + "\\" + e.Row.Cells[2].Value.ToString() + "&" + e.Row.Cells[3].Value.ToString();
                File.Delete(filePath);
            }
            else
            {
                e.Cancel = true;
            }
        }

        private void btn_DeleteUnit_Click(object sender, EventArgs e)
        {
            int index = gr_Unit.CurrentCell.RowIndex;
            DialogResult lkResult = MessageBox.Show("Are you sure to delete Unit: \"" + gr_Unit.Rows[index].Cells[0].Value.ToString() + "\" , IP Address: " + gr_Unit.Rows[index].Cells[2].Value.ToString(), "Delete Unit", MessageBoxButtons.YesNo);

            if (lkResult == DialogResult.Yes)
            {
                string filePath = treeView1.SelectedNode.FullPath + "\\" + gr_Unit.Rows[index].Cells[2].Value.ToString() + "&" + gr_Unit.Rows[index].Cells[3].Value.ToString();
                File.Delete(filePath);
                gr_Unit.Rows.RemoveAt(index);
            }
        }

        private void gr_Unit_RowsRemoved(object sender, DataGridViewRowsRemovedEventArgs e)
        {
            if (gr_Unit.Rows.Count == 0)
            {
                btn_EditUnit.Enabled = false;
                btn_ConfigUnit.Enabled = false;
                btn_DeleteUnit.Enabled = false;
                btn_ReplaceDatabase.Enabled = false;
                btn_transferToNet.Enabled = false;
            }
        }

        private void btn_ConfigUnit_Click(object sender, EventArgs e)
        {
            info2_support = true; //always support to change info 2
            local_ac_support = true; //always support local ac config if board is supported.
            confignetwork = false;
            enableGetState = true;
            int index = gr_Unit.CurrentCell.RowIndex;
            Group_Path = treeView1.SelectedNode.FullPath;

            Unit_Path = treeView1.SelectedNode.FullPath + "\\" + gr_Unit.Rows[index].Cells[2].Value.ToString() + "&" + gr_Unit.Rows[index].Cells[3].Value.ToString();
            try
            {
                string fw_ver = gr_Unit.Rows[index].Cells[6].Value.ToString();
                dev_cfg_fw_version = Convert.ToByte(fw_ver.Substring(0, fw_ver.IndexOf(".")));
            }
            catch
            {
                MessageBox.Show("Firmware version is invalid");
                return;
            }
            if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "Room Logic Controller")
            {
                Input_RLC CfgUnit = new Input_RLC();
                CfgUnit.Text = "Config I/O RLC in Database";
                CfgUnit.Initialize(this);
                this.Enabled = false;
                CfgUnit.Show();
                CfgUnit.Focus();
            }
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "Bedside-17T")
            {
                Input_Bedside CfgUnit = new Input_Bedside();
                CfgUnit.Text = "Config I/O Bedside in Database";
                CfgUnit.Initialize(this);
                this.Enabled = false;
                CfgUnit.Show();
                CfgUnit.Focus();
            }
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "Bedside-12T")
            {
                Input_Bedside_12T CfgUnit = new Input_Bedside_12T();
                CfgUnit.Text = "Config I/O Bedside-12T in Database";
                CfgUnit.Initialize(this);
                this.Enabled = false;
                CfgUnit.Show();
                CfgUnit.Focus();
            }
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RLC-I20")
            {
                Input_RLC_new_20_ports CfgUnit = new Input_RLC_new_20_ports();
                CfgUnit.Text = "Config I/O RLC New (20 ports) in Database";
                CfgUnit.Initialize(this);
                this.Enabled = false;
                CfgUnit.Show();
                CfgUnit.Focus();
            }
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RLC-I16")
            {
                Input_RLC_new CfgUnit = new Input_RLC_new();
                CfgUnit.Text = "Config I/O RLC New (16 ports) in Database";
                CfgUnit.Initialize(this);
                this.Enabled = false;
                CfgUnit.Show();
                CfgUnit.Focus();
            }
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RCU-32AO")
            {
                Input_RCU_32AO CfgUnit = new Input_RCU_32AO();
                CfgUnit.Text = "Config I/O RCU-32AO in Database";
                CfgUnit.Initialize(this);
                this.Enabled = false;
                CfgUnit.Show();
                CfgUnit.Focus();
            }
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RCU-8RL-24AO")
            {
                Input_RCU_8RL_24AO CfgUnit = new Input_RCU_8RL_24AO();
                CfgUnit.Text = "Config I/O RCU-8RL-24AO in Database";
                CfgUnit.Initialize(this);
                this.Enabled = false;
                CfgUnit.Show();
                CfgUnit.Focus();
            }
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RCU-16RL-16AO")
            {
                Input_RCU_16RL_16AO CfgUnit = new Input_RCU_16RL_16AO();
                CfgUnit.Text = "Config I/O RCU-16RL-16AO in Database";
                CfgUnit.Initialize(this);
                this.Enabled = false;
                CfgUnit.Show();
                CfgUnit.Focus();
            }
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RCU-24RL-8AO")
            {
                Input_RCU_24RL_8AO CfgUnit = new Input_RCU_24RL_8AO();
                CfgUnit.Text = "Config I/O RCU-24RL-8AO in Database";
                CfgUnit.Initialize(this);
                this.Enabled = false;
                CfgUnit.Show();
                CfgUnit.Focus();
            }
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RCU-11IN-4RL")
            {
                Input_RCU_11IN_4RL CfgUnit = new Input_RCU_11IN_4RL();
                CfgUnit.Text = "Config I/O RCU-11IN-4RL in Database";
                CfgUnit.Initialize(this);
                this.Enabled = false;
                CfgUnit.Show();
                CfgUnit.Focus();
            }
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RCU-21IN-8RL")
            {
                Input_RCU_21IN_8RL CfgUnit = new Input_RCU_21IN_8RL();
                CfgUnit.Text = "Config I/O RCU-21IN-8RL in Database";
                CfgUnit.Initialize(this);
                this.Enabled = false;
                CfgUnit.Show();
                CfgUnit.Focus();
            }
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RCU-21IN-8RL-K")
            {
                Input_RCU_21IN_8RL_K CfgUnit = new Input_RCU_21IN_8RL_K();
                CfgUnit.Text = "Config I/O RCU-21IN-8RL-K in Database";
                CfgUnit.Initialize(this);
                this.Enabled = false;
                CfgUnit.Show();
                CfgUnit.Focus();
            }
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RCU-21IN-10RL")
            {
                Input_RCU_21IN_10RL CfgUnit = new Input_RCU_21IN_10RL();
                CfgUnit.Text = "Config I/O RCU-21IN-10RL in Database";
                CfgUnit.Initialize(this);
                this.Enabled = false;
                CfgUnit.Show();
                CfgUnit.Focus();
            }
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RCU-21IN-10RL-T")
            {
                Input_RCU_21IN_10RL_T CfgUnit = new Input_RCU_21IN_10RL_T();
                CfgUnit.Text = "Config I/O RCU-21IN-10RL-T in Database";
                CfgUnit.Initialize(this);
                this.Enabled = false;
                CfgUnit.Show();
                CfgUnit.Focus();
            }
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RCU-30IN-10RL")
            {
                Input_RCU_30IN_10RL CfgUnit = new Input_RCU_30IN_10RL();
                CfgUnit.Text = "Config I/O RCU-30IN-10RL in Database";
                CfgUnit.Initialize(this);
                this.Enabled = false;
                CfgUnit.Show();
                CfgUnit.Focus();
            }
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RCU-48IN-16RL")
            {
                Input_RCU_48IN_16RL CfgUnit = new Input_RCU_48IN_16RL();
                CfgUnit.Text = "Config I/O RCU-48IN-16RL in Database";
                CfgUnit.Initialize(this);
                this.Enabled = false;
                CfgUnit.Show();
                CfgUnit.Focus();
            }
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RCU-48IN-16RL-4AO")
            {
                Input_RCU_48IN_16RL_4AO CfgUnit = new Input_RCU_48IN_16RL_4AO();
                CfgUnit.Text = "Config I/O RCU-48IN-16RL-4AO in Database";
                CfgUnit.Initialize(this);
                this.Enabled = false;
                CfgUnit.Show();
                CfgUnit.Focus();
            }
            else if ((gr_Unit.Rows[index].Cells[0].Value.ToString() == "GNT-EXT-6RL") || (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RCU-6RL"))   //old name: RCU-6RL
            {
                Input_GNT_EXT_6RL CfgUnit = new Input_GNT_EXT_6RL();
                CfgUnit.Text = "Config I/O GNT-EXT-6RL in Database";   //old name: RCU-6RL
                CfgUnit.Initialize(this);
                this.Enabled = false;
                CfgUnit.Show();
                CfgUnit.Focus();
            }
            else if ((gr_Unit.Rows[index].Cells[0].Value.ToString() == "GNT-EXT-8RL") || (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RCU-8RL"))   //old name: RCU-6RL    //old name: RCU-8RL
            {
                Input_GNT_EXT_8RL CfgUnit = new Input_GNT_EXT_8RL();
                CfgUnit.Text = "Config I/O GNT-EXT-8RL in Database";    //old name: RCU-8RL
                CfgUnit.Initialize(this);
                this.Enabled = false;
                CfgUnit.Show();
                CfgUnit.Focus();
            }
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "GNT-EXT-12RL")
            {
                Input_GNT_EXT_12RL CfgUnit = new Input_GNT_EXT_12RL();
                CfgUnit.Text = "Config I/O GNT-EXT-12RL in Database";
                CfgUnit.Initialize(this);
                this.Enabled = false;
                CfgUnit.Show();
                CfgUnit.Focus();
            }
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "GNT-EXT-20RL")
            {
                Input_GNT_EXT_20RL CfgUnit = new Input_GNT_EXT_20RL();
                CfgUnit.Text = "Config I/O GNT-EXT-20RL in Database";
                CfgUnit.Initialize(this);
                this.Enabled = false;
                CfgUnit.Show();
                CfgUnit.Focus();
            }
            else if ((gr_Unit.Rows[index].Cells[0].Value.ToString() == "GNT-EXT-10AO") || (gr_Unit.Rows[index].Cells[0].Value.ToString() == "RCU-10AO"))   //old name: RCU-6RL  //old name: RCU-10AO
            {
                Input_GNT_EXT_10AO CfgUnit = new Input_GNT_EXT_10AO();
                CfgUnit.Text = "Config I/O GNT-EXT-10AO in Database";  //old name: RCU-10AO
                CfgUnit.Initialize(this);
                this.Enabled = false;
                CfgUnit.Show();
                CfgUnit.Focus();
            }
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "GNT-EXT-28AO")
            {
                Input_GNT_EXT_28AO CfgUnit = new Input_GNT_EXT_28AO();
                CfgUnit.Text = "Config I/O GNT-EXT-28AO in Database";
                CfgUnit.Initialize(this);
                this.Enabled = false;
                CfgUnit.Show();
                CfgUnit.Focus();
            }
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "GNT-EXT-12RL-12AO")
            {
                Input_GNT_EXT_12RL_12AO CfgUnit = new Input_GNT_EXT_12RL_12AO();
                CfgUnit.Text = "Config I/O GNT-EXT-12RL-12AO in Database";
                CfgUnit.Initialize(this);
                this.Enabled = false;
                CfgUnit.Show();
                CfgUnit.Focus();
            }
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "BSP_R14_OL")
            {
                Input_BSP_R14_OL CfgUnit = new Input_BSP_R14_OL();
                CfgUnit.Text = "Config I/O BSP_R14_OL in Database";
                CfgUnit.Initialize(this);
                this.Enabled = false;
                CfgUnit.Show();
                CfgUnit.Focus();
            }
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "GNT-EXT-24IN")
            {
                Input_GNT_EXT_24IN CfgUnit = new Input_GNT_EXT_24IN();
                CfgUnit.Text = "Config input GNT-EXT-24IN in Database";
                CfgUnit.Initialize(this);
                this.Enabled = false;
                CfgUnit.Show();
                CfgUnit.Focus();
            }
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "GNT-EXT-48IN")
            {
                Input_GNT_EXT_48IN_T CfgUnit = new Input_GNT_EXT_48IN_T();
                CfgUnit.Text = "Config I/O GNT-EXT-48IN in Database";
                CfgUnit.Initialize(this);
                this.Enabled = false;
                CfgUnit.Show();
                CfgUnit.Focus();
            }
            else if (gr_Unit.Rows[index].Cells[0].Value.ToString() == "GNT-ETH2SKDL")
            {
                Input_GNT_ETH_2KDL CfgUnit = new Input_GNT_ETH_2KDL();
                CfgUnit.Text = "Config I/O GNT-ETH2SKDL in Database";
                CfgUnit.Initialize(this);
                this.Enabled = false;
                CfgUnit.Show();
                CfgUnit.Focus();
            }
        }

        private void btn_TranfertoData_Click(object sender, EventArgs e)
        {
            DialogResult lkResult = MessageBox.Show("Are you sure to transfer all units on network to database? The database will be deleted all!!!", "Transer to database", MessageBoxButtons.YesNo);

            if (lkResult == DialogResult.Yes)
            {
                string filePath;
                while (gr_Unit.Rows.Count > 0)
                {
                    filePath = treeView1.SelectedNode.FullPath + "\\" + gr_Unit.Rows[0].Cells[2].Value.ToString() + "&" + gr_Unit.Rows[0].Cells[3].Value.ToString();
                    File.Delete(filePath);
                    gr_Unit.Rows.RemoveAt(0);
                }
                for (int i = 0; i < grBoardNetwork.Rows.Count; i++)
                {
                    grBoardNetwork.CurrentCell = grBoardNetwork.Rows[i].Cells[1];
                    btn_AddtoData_Click(null, null);
                }

            }
        }

        private string InfoBarcode(string barcode)
        {
            if (barcode == "8930000000019") return "Room Logic Controller";
            else if (barcode == "8930000000200") return "Bedside-17T";
            else if (barcode == "8930000100214") return "Bedside-12T";
            else if (barcode == "8930000100221") return "BSP_R14_OL";
            else if (barcode == "8930000000026") return "RLC-I16";
            else if (barcode == "8930000000033") return "RLC-I20";
            else if (barcode == "8930000200013") return "RCU-32AO";
            else if (barcode == "8930000200020") return "RCU-8RL-24AO";
            else if (barcode == "8930000200037") return "RCU-16RL-16AO";
            else if (barcode == "8930000200044") return "RCU-24RL-8AO";
            else if (barcode == "8930000210005") return "RCU-11IN-4RL";
            else if (barcode == "8930000210012") return "RCU-21IN-10RL";
            else if (barcode == "8930000210036") return "RCU-30IN-10RL";
            else if (barcode == "8930000210043") return "RCU-48IN-16RL";
            else if (barcode == "8930000210050") return "RCU-48IN-16RL-4AO";
            else if (barcode == "8930000210067") return "RCU-48IN-16RL-4AI";
            else if (barcode == "8930000210074") return "RCU-48IN-16RL-K";
            else if (barcode == "8930000210081") return "RCU-48IN-16RL-DL";
            else if (barcode == "8930000210111") return "RCU-21IN-8RL";
            else if (barcode == "8930000210128") return "RCU-21IN-8RL-4AO";
            else if (barcode == "8930000210135") return "RCU-21IN-8RL-4AI";
            else if (barcode == "8930000210142") return "RCU-21IN-8RL-K";
            else if (barcode == "8930000210159") return "RCU-21IN-8RL-DL";
            else if (barcode == "8930000200051") return "GNT-EXT-6RL";  //old name: RCU-6RL
            else if (barcode == "8930000200068") return "GNT-EXT-8RL";  //old name: RCU-8RL
            else if (barcode == "8930000200075") return "GNT-EXT-10AO";  //old name: RCU-10AO
            else if (barcode == "8930000200082") return "GNT-EXT-28AO";
            else if (barcode == "8930000200105") return "GNT-EXT-12RL";
            else if (barcode == "8930000200112") return "GNT-EXT-20RL";
            else if (barcode == "8930000200099") return "GNT-EXT-12RL-12AO";
            else if (barcode == "8930000220011") return "GNT-EXT-24IN";
            else if (barcode == "8930000220028") return "GNT-EXT-48IN";
            else if (barcode == "8930000230003") return "GNT-ETH2KDL";
            return "Unindentified";
        }

        private bool SoSanhConfig(string filePath, int SLinput, int SL_Light_Out, int SL_AC_Out)
        {
            StreamReader rd = File.OpenText(filePath);
            string input = null;
            int i = 0, k = 0, index = 0;
            string Data;
            Board_Attribute board_att = new Board_Attribute();
            string[] rs485_cfg_str = board_att.build_rs485_cfg(this);
            int num_rs485_cfg = rs485_cfg_str.Length;
            int light_out_info2_len = Light_Out_Info2.Length;
            int rs485_cfg_idx = 0;

            input = rd.ReadLine(); // Skip basic info                        

            while ((input = rd.ReadLine()) != null)
            {
                // RS485 config comparision
                if (input.Contains("RS485") == true)
                {
                    if (num_rs485_cfg > 0)
                    {
                        if (rs485_cfg_idx == 0 || rs485_cfg_str[rs485_cfg_idx] == input)
                        {
                            num_rs485_cfg--;
                        }
                        else
                        {
                            rd.Close();
                            return false;
                        }
                        rs485_cfg_idx++;
                    }
                }
                // Input comparision
                else if (i < SLinput)
                {
                    if (num_rs485_cfg > 0)
                    {
                        rd.Close();
                        return false;
                    }

                    Data = InputNetwork[i].Input.ToString() + "," + InputNetwork[i].Function.ToString() + "," + InputNetwork[i].Ramp.ToString() + "," + InputNetwork[i].Preset.ToString() + ",";
                    Data = Data + InputNetwork[i].Led_Status.ToString() + "," + InputNetwork[i].Auto_Mode.ToString() + "," + InputNetwork[i].Auto_Time.ToString() + "," + InputNetwork[i].DelayOff.ToString() + ",";
                    Data = Data + InputNetwork[i].DelayOn.ToString() + "," + InputNetwork[i].NumGroup.ToString() + ",";
                    for (int j = 0; j < InputNetwork[i].NumGroup; j++)
                        Data = Data + InputNetwork[i].Group[j].ToString() + "," + InputNetwork[i].Preset_Group[j].ToString() + ",";


                    if (Data != input)
                    {
                        input = input.Substring(0, input.Length - 2);
                        input = input + "1,0,0,";
                        if (Data != input)
                        {
                            rd.Close();
                            return false;
                        }
                    }
                    i++;
                }
                else // Output Comparision
                {
                    if ((num_rs485_cfg > 0) || (k >= OutputNetwork.Length))
                    {
                        rd.Close();
                        return false;
                    }

                    // Compare output group first
                    if (Substring(',', 0, input) != OutputNetwork[k].ToString())
                    {
                        rd.Close();
                        return false;
                    }

                    // Compare light info
                    if (SL_Light_Out > 0)
                    {
                        SL_Light_Out--;
                        int input_params_len = input.Split(',').Length;
                        // Delay info of light output
                        if ((input_params_len < 3) ||
                             (RLCFormRelay_DelayOn[k].ToString() != Substring(',', 1, input)) ||
                             (RLCFormRelay_DelayOff[k].ToString() != Substring(',', 2, input)))
                        {
                            rd.Close();
                            return false;
                        }

                        // Compare info2 of light output
                        if (light_out_info2_len > 0) // Skip compare if board doesn't support get info2.
                        {
                            UInt16 light_out_info2_size = Convert.ToUInt16(Marshal.SizeOf(Light_Out_Info2[0]));

                            light_out_info2_len--;

                            if (light_out_info2_size <= input_params_len - 3) // Length is correct
                            {
                                Byte[] info = new Byte[light_out_info2_size];
                                transfer_cmd.convert_light_out_cfg_to_array(ref info, Light_Out_Info2[k], 0);

                                for (int light_info = 0; light_info < light_out_info2_size; light_info++) // Compare data of info2
                                {
                                    if (Substring(',', 3 + light_info, input) != info[light_info].ToString())
                                    {
                                        rd.Close();
                                        return false;
                                    }
                                }
                            }
                            else
                            {
                                rd.Close();
                                return false;
                            }
                        }
                    }
                    // Compare AC info
                    else if (SL_AC_Out > 0)
                    {
                        SL_AC_Out--;
                        if (index < AC_Out_Configs.Length)
                        {
                            FieldInfo[] fields = AC_Out_Configs[index].GetType().GetFields();

                            int input_params_len = input.Split(',').Length;

                            if (fields.Length <= input_params_len) // Length is correct
                            {
                                int ac_info_index = 0;
                                foreach (var xInfo in fields)
                                {
                                    if (Substring(',', ac_info_index, input) != xInfo.GetValue(AC_Out_Configs[index]).ToString())
                                    {
                                        rd.Close();
                                        return false;
                                    }
                                    ac_info_index++;
                                }
                            }
                        }
                        index++;
                    }
                    k++;
                }
            }
            rd.Close();

            if ((i != SLinput) || (SL_Light_Out != 0) || (SL_AC_Out != 0)) return false;

            return true;
        }

        private bool GetIO_Unit(int index, int SLinput, int SL_Out_Light, int SL_Out_Ac)
        {
            bool ret = true;
            string IP = grBoardNetwork[3, index].Value.ToString();
            string ID = grBoardNetwork[4, index].Value.ToString();

            IPEndPoint ep = new IPEndPoint(IPAddress.Parse(IP), UDPPort);
            Socket s = new Socket(AddressFamily.InterNetwork, SocketType.Dgram, ProtocolType.Udp);
            s.ReceiveTimeout = 5000;

            int cnt;
            byte[] DuLieuTuBo;
            DuLieuTuBo = new byte[1024];

            InputNetwork = new IOProperty[SLinput];
            OutputNetwork = new byte[SL_Out_Light + SL_Out_Ac];
            RLCFormRelay_DelayOn = new int[SL_Out_Light];
            RLCFormRelay_DelayOff = new int[SL_Out_Light];
            Light_Out_Info2 = new Light_Out_Cfg.output_info2_t[SL_Out_Light];

            int SoLanRetry = 0;



            try
            {

                Byte[] Data;    //<Address><length><CMD><Data><CRC> 
                Data = new Byte[1024];
                int SumCRC = 0;
                int length = DuLieuTuBo[5] * 256 + DuLieuTuBo[4];
                bool check = false;

                Data[0] = Convert.ToByte(Substring('.', 3, ID));
                Data[1] = Convert.ToByte(Substring('.', 2, ID));
                Data[2] = Convert.ToByte(Substring('.', 1, ID));
                Data[3] = Convert.ToByte(Substring('.', 0, ID));

                Data[4] = 4;   // Address:4 ;Length=2 byte; CMD:2, Data:0, CRC:2
                Data[5] = 0;

                Data[6] = 10;
                Data[7] = 9;

                for (int i = 4; i < Data[4] + 4; i++)
                    SumCRC = SumCRC + Data[i];

                Data[9] = (byte)(SumCRC / 256);
                Data[8] = (byte)(SumCRC - Data[9] * 256);

                s.SendTo(Data, Data[4] + 6, SocketFlags.None, ep);


                while (((length != 5) || (DuLieuTuBo[8] != 0) || (!check)) && (SoLanRetry < SoLanRetryMax))
                {
                    try
                    {
                        cnt = s.ReceiveFrom(DuLieuTuBo, ref rm);
                        length = DuLieuTuBo[5] * 256 + DuLieuTuBo[4];
                        check = true;
                        for (uint i = 0; i < 4; i++)
                        {
                            if (Data[i] != DuLieuTuBo[i])
                            {
                                check = false;
                                break;
                            }
                        }
                    }
                    catch
                    {
                        SoLanRetry++;
                        s.SendTo(Data, Data[4] + 6, SocketFlags.None, ep);
                    }

                    if (length < 30)
                    {
                        if (length != 5)
                        {
                            SoLanRetry++;
                            //s.SendTo(Data, Data[4] + 6, SocketFlags.None, ep);
                        }
                    }
                    else
                    {
                        SoLanRetry = 0;
                        int pos = 8;
                        int inp;
                        while (pos < length + 3)
                        {
                            inp = DuLieuTuBo[pos];
                            InputNetwork[inp].Input = DuLieuTuBo[pos];
                            InputNetwork[inp].Function = DuLieuTuBo[pos + 1];
                            InputNetwork[inp].Ramp = DuLieuTuBo[pos + 2];
                            InputNetwork[inp].Preset = DuLieuTuBo[pos + 3];
                            InputNetwork[inp].Led_Status = DuLieuTuBo[pos + 4];
                            InputNetwork[inp].Auto_Mode = DuLieuTuBo[pos + 5];
                            InputNetwork[inp].Auto_Time = 0;       //pos+6->pos+33
                            InputNetwork[inp].DelayOff = DuLieuTuBo[pos + 35] * 256 + DuLieuTuBo[pos + 34];
                            InputNetwork[inp].DelayOn = DuLieuTuBo[pos + 37] * 256 + DuLieuTuBo[pos + 36];
                            InputNetwork[inp].NumGroup = DuLieuTuBo[pos + 38];
                            pos = pos + 39;
                            InputNetwork[inp].Group = new int[InputNetwork[inp].NumGroup];
                            InputNetwork[inp].Preset_Group = new byte[InputNetwork[inp].NumGroup];
                            for (int i = 0; i < InputNetwork[inp].NumGroup; i++)
                            {
                                InputNetwork[inp].Group[i] = DuLieuTuBo[pos];
                                InputNetwork[inp].Preset_Group[i] = DuLieuTuBo[pos + 1];
                                pos = pos + 2;
                            }
                        }



                    }
                }
                if (SoLanRetry >= SoLanRetryMax)
                {
                    s.Close();
                    MessageBox.Show("Can't get IO of unit IP: " + IP, "Network Error");
                    return false;
                }

                if (SL_Out_Light > 0)
                {
                    SumCRC = 0;
                    Data[6] = 10;
                    Data[7] = 31;

                    for (int i = 4; i < Data[4] + 4; i++)
                        SumCRC = SumCRC + Data[i];

                    Data[9] = (byte)(SumCRC / 256);
                    Data[8] = (byte)(SumCRC - Data[9] * 256);


                    s.SendTo(Data, Data[4] + 6, SocketFlags.None, ep);
                    DuLieuTuBo = new byte[1024];

                    while ((DuLieuTuBo[7] != 31) && (SoLanRetry < SoLanRetryMax))
                    {
                        cnt = s.ReceiveFrom(DuLieuTuBo, ref rm);
                        length = DuLieuTuBo[5] * 256 + DuLieuTuBo[4];
                        if (length < 6)
                        {
                            if (DuLieuTuBo[7] != 31)
                            {
                                SoLanRetry++;
                                s.SendTo(Data, Data[4] + 6, SocketFlags.None, ep);
                            }

                        }
                        else
                        {
                            SoLanRetry = 0;
                            int pos = 8;

                            while (pos < length + 3)
                            {
                                OutputNetwork[DuLieuTuBo[pos]] = DuLieuTuBo[pos + 1];
                                RLCFormRelay_DelayOff[DuLieuTuBo[pos]] = DuLieuTuBo[pos + 3] * 256 + DuLieuTuBo[pos + 2];
                                RLCFormRelay_DelayOn[DuLieuTuBo[pos]] = DuLieuTuBo[pos + 5] * 256 + DuLieuTuBo[pos + 4];
                                pos = pos + 6;
                            }
                        }
                    }
                    s.Close();


                    Command.command_status status = transfer_cmd.get_output_info2(IP, ID, ref Light_Out_Info2);

                    if (status == Command.command_status.NO_SUPPORT)
                    {
                        info2_support = false;
                    }
                    else if (status == Command.command_status.SUCCESS)
                    {
                        info2_support = true;
                    }
                    else
                    {

                        MessageBox.Show("Device responded error for getting light output info2: " + status.ToString());
                        return false;
                    }
                }

                if (SL_Out_Ac > 0)
                {
                    Command.command_status status = transfer_cmd.get_output_local_ac(IP, ID, ref AC_Out_Configs);

                    if (status == Command.command_status.NO_SUPPORT)
                    {
                        local_ac_support = false;
                    }
                    else if (status == Command.command_status.SUCCESS)
                    {
                        local_ac_support = true;
                    }
                    else
                    {
                        MessageBox.Show("Device responded error for getting local AC config: " + status.ToString());
                        return false;
                    }

                    for (int i = 0; i < SL_Out_Ac; i++)
                    {
                        OutputNetwork[i + SL_Out_Light] = AC_Out_Configs[i].group;
                    }
                }
            }
            catch
            {
                s.Close();
                MessageBox.Show("Can't get IO of unit IP: " + IP, "Network Error");
                return false;
            }

            return true;
        }


        private void SoSanhBoard()
        {
            int check = 0;
            int cnt = 0;

            for (int j = 0; j < gr_Unit.Rows.Count; j++)
            {
                gr_Unit.Rows[j].DefaultCellStyle.ForeColor = Color.Red;
                gr_Unit.Rows[j].DefaultCellStyle.SelectionForeColor = Color.Red;
            }

            for (int i = 0; i < grBoardNetwork.Rows.Count; i++)
            {
                check = 0;
                cnt = 0;
                int j;
                string ip = "";

                for (j = 0; j < gr_Unit.Rows.Count; j++)
                {
                    if ((grBoardNetwork.Rows[i].Cells[2].Value.ToString() == gr_Unit.Rows[j].Cells[1].Value.ToString()) && (grBoardNetwork.Rows[i].Cells[5].Value.ToString() == gr_Unit.Rows[j].Cells[4].Value.ToString()))
                    {
                        if (grBoardNetwork.Rows[i].Cells[5].Value.ToString() != "Slave")
                        {
                            cnt++;
                        }
                        else
                        {
                            if (cnt == 0)
                            {
                                cnt++;
                                ip = gr_Unit.Rows[j].Cells[2].Value.ToString();
                            }
                            else
                            {
                                if (gr_Unit.Rows[j].Cells[2].Value.ToString() != ip)
                                {
                                    cnt++;
                                }
                            }
                        }
                    }
                }
                // Compare basic info
                for (j = 0; j < gr_Unit.Rows.Count; j++)
                {
                    string s = gr_Unit.Rows[j].Cells[3].Value.ToString();
                    string s1 = grBoardNetwork.Rows[i].Cells[4].Value.ToString();

                    if (Substring('.', 3, s1) == Substring('.', 3, s))
                        //if (grBoardNetwork.Rows[i].Cells[1].Value.ToString() == gr_Unit.Rows[j].Cells[0].Value.ToString())    //modified by Hoai An
                        if (grBoardNetwork.Rows[i].Cells[2].Value.ToString() == gr_Unit.Rows[j].Cells[1].Value.ToString())
                            if (grBoardNetwork.Rows[i].Cells[5].Value.ToString() == gr_Unit.Rows[j].Cells[4].Value.ToString())
                                if (grBoardNetwork.Rows[i].Cells[6].Value.ToString() == gr_Unit.Rows[j].Cells[5].Value.ToString())
                                    if (grBoardNetwork.Rows[i].Cells[11].Value.ToString() == gr_Unit.Rows[j].Cells[9].Value.ToString()) // Recovery
                                    {
                                        if (cnt > 1)
                                        {
                                            if (grBoardNetwork.Rows[i].Cells[3].Value.ToString() == gr_Unit.Rows[j].Cells[2].Value.ToString())
                                            {
                                                check = 1;
                                                break;
                                            }
                                        }
                                        else if (cnt == 1)
                                        {
                                            check = 1;
                                            break;
                                        }
                                    }

                }

                if (check == 1)
                {
                    string IP = grBoardNetwork[3, i].Value.ToString();
                    string ID = grBoardNetwork[4, i].Value.ToString();
                    transfer_cmd.get_rs485_config(IP, ID, ref RS485_Cfg);

                    Form CfgUnit = new Input_RLC();
                    int SLin = 0, Sl_Light_Out = 0, SL_AC_Out = 0;

                    string board_name = grBoardNetwork.Rows[i].Cells[1].Value.ToString();
                    GetSLIO(board_name, ref SLin, ref Sl_Light_Out, ref SL_AC_Out, ref CfgUnit);

                    if (GetIO_Unit(i, SLin, Sl_Light_Out, SL_AC_Out))
                    {
                        Unit_Path = treeView1.SelectedNode.FullPath + "\\" + gr_Unit.Rows[j].Cells[2].Value.ToString() + "&" + gr_Unit.Rows[j].Cells[3].Value.ToString();
                        if (SoSanhConfig(Unit_Path, SLin, Sl_Light_Out, SL_AC_Out))
                        {
                            grBoardNetwork.Rows[i].DefaultCellStyle.ForeColor = Color.Green;
                            grBoardNetwork.Rows[i].DefaultCellStyle.SelectionForeColor = Color.Green;
                            gr_Unit.Rows[j].DefaultCellStyle.ForeColor = Color.Green;
                            gr_Unit.Rows[j].DefaultCellStyle.SelectionForeColor = Color.Green;
                        }
                        else
                        {
                            grBoardNetwork.Rows[i].DefaultCellStyle.ForeColor = Color.Red;
                            grBoardNetwork.Rows[i].DefaultCellStyle.SelectionForeColor = Color.Red;
                        }
                    }
                    else
                    {
                        grBoardNetwork.Rows[i].DefaultCellStyle.ForeColor = Color.Red;
                        grBoardNetwork.Rows[i].DefaultCellStyle.SelectionForeColor = Color.Red;
                    }

                }

                else
                {
                    grBoardNetwork.Rows[i].DefaultCellStyle.ForeColor = Color.Red;
                    grBoardNetwork.Rows[i].DefaultCellStyle.SelectionForeColor = Color.Red;
                }
            }

        }
        private void Get_Infor_Unit(string IP, string ID)
        {
            UdpClient client = new UdpClient(LocalUDPPort, AddressFamily.InterNetwork);
            IPEndPoint groupEp = new IPEndPoint(IPAddress.Parse(IP), UDPPort);
            client.Connect(groupEp);

            byte[] DuLieuTuBo;

            DuLieuTuBo = new byte[1024];

            byte[][] BoardData = new byte[2048][];
            string[] BoardIP = new string[2048];
            
            Cursor.Current = Cursors.WaitCursor;
            grBoardNetwork.Rows.Clear();
            int count = 0;

            try
            {
                Byte[] Data;    //<Address><length><CMD><Data><CRC> 
                Data = new Byte[1024];
                int SumCRC = 0;
                int posData = 7;

                /******************* Request hardware *****************/

                Data[0] = Convert.ToByte(Substring('.', 3, ID));
                Data[1] = Convert.ToByte(Substring('.', 2, ID));
                Data[2] = Convert.ToByte(Substring('.', 1, ID));
                Data[3] = Convert.ToByte(Substring('.', 0, ID));

                Data[4] = 4;   // Address:4 ;Length=2 byte; CMD:2, Data:0, CRC:2
                Data[5] = 0;

                Data[6] = 1;
                Data[7] = 4;

                for (int i = 4; i < Data[4] + 4; i++)
                    SumCRC = SumCRC + Data[i];

                Data[9] = (byte)(SumCRC / 256);
                Data[8] = (byte)(SumCRC - Data[9] * 256);

                client.Send(Data, Data[4] + 6);
                client.Close();


                IPEndPoint rm = new IPEndPoint(IPAddress.Any, 0);
                UdpClient udpResponse = new UdpClient(LocalUDPPort);
                udpResponse.Client.ReceiveTimeout = 3000;
                udpResponse.Client.ReceiveTimeout = 3000;
                udpResponse.Client.SetSocketOption(SocketOptionLevel.Socket, SocketOptionName.ReceiveBuffer, 0x40000);
                try
                {
                    while (true)
                    {
                        DuLieuTuBo = udpResponse.Receive(ref rm);
                        if ((DuLieuTuBo[5] * 256 + DuLieuTuBo[4]) > 90)
                        {
                            BoardData[count] = DuLieuTuBo;
                            BoardIP[count] = rm.ToString().Substring(0, rm.ToString().IndexOf(':'));
                            count++;
                        }
                    }
                }
                catch
                {
                    Cursor.Current = Cursors.Default;
                    udpResponse.Close();                                    
                }

                int total_board = count;                                

                while (count-- != 0)
                {
                    DuLieuTuBo = BoardData[count];                                                     

                    if ((DuLieuTuBo[5] * 256 + DuLieuTuBo[4]) > 90)
                    {

                        string Unit_IPType, Unit_Barcode = "", Unit_IP, Unit_ID, Unit_ActMode, Hw_ver, Fw_ver;
                        byte Unit_CanLoad;
                        Unit_IP = BoardIP[count];

                        int ip4;

                        ip4 = Convert.ToByte(Substring('.', 3, Unit_IP));
                        //if (ip4 >= 130)
                        //    continue;
                        //Unit_IP=DuLieuTuBo[posData+1].ToString()+"."+DuLieuTuBo[posData+2].ToString()+"."+DuLieuTuBo[posData+3].ToString()+"."+DuLieuTuBo[posData+4].ToString();
                        Unit_ID = DuLieuTuBo[3].ToString() + "." + DuLieuTuBo[2].ToString() + "." + DuLieuTuBo[1].ToString() + "." + DuLieuTuBo[0].ToString();

                        for (int i = posData + 70; i < posData + 83; i++)         //barcode 13byte
                            Unit_Barcode = Unit_Barcode + (DuLieuTuBo[i] - 48).ToString();
                        Unit_IPType = InfoBarcode(Unit_Barcode);

                        int Hardware_Enable = DuLieuTuBo[posData + 84];
                        bool recovery = false;
                        if ((Hardware_Enable & 0x40) == 0x40) recovery = true;
                        int factor = 128;
                        for (int i = 1; i <= 5; i++)
                        {
                            if (Hardware_Enable >= factor) Hardware_Enable = Hardware_Enable - factor;
                            factor = factor / 2;
                        }
                        if (Hardware_Enable >= 4)
                        {
                            Unit_CanLoad = 1;
                            Hardware_Enable = Hardware_Enable - 4;
                        }
                        else Unit_CanLoad = 0;

                        if (Hardware_Enable == 0) Unit_ActMode = "Stand-Alone";
                        else if (Hardware_Enable == 1) Unit_ActMode = "Slave";
                        else Unit_ActMode = "Master";

                        Hw_ver = DuLieuTuBo[posData + 86].ToString() + "." + (DuLieuTuBo[posData + 85] >> 4).ToString() + "." + (DuLieuTuBo[posData + 85] & 0x0F).ToString();
                        Fw_ver = DuLieuTuBo[posData + 88].ToString() + "." + DuLieuTuBo[posData + 87].ToString() + "." + "0";
                        string man_date = "";
                        for (int i = 19; i < 27; i++)
                        {
                            man_date = man_date + (DuLieuTuBo[i] - 48).ToString();
                        }
                        //if (IP == "192.168.218.130") grBoardNetwork.Rows.Add(false, Unit_IPType, Unit_Barcode, Unit_IP, Unit_ID, Unit_ActMode, Convert.ToBoolean(Unit_CanLoad), Fw_ver, Hw_ver, "", man_date, recovery);
                        if (IP == "255.255.255.255") grBoardNetwork.Rows.Add(false, Unit_IPType, Unit_Barcode, Unit_IP, Unit_ID, Unit_ActMode, Convert.ToBoolean(Unit_CanLoad), Fw_ver, Hw_ver, "", man_date, recovery);

                    }
                }
                //MessageBox.Show(total_board.ToString());
            }
            catch
            {
                MessageBox.Show("Error2");
                Cursor.Current = Cursors.Default;
                client.Close();
            }
            
        }

        private void btn_Scan_Click(object sender, EventArgs e)
        {

#if !TEST
            Get_Infor_Unit("255.255.255.255", "0.0.0.0");
#else
            grBoardNetwork.Rows.Clear();
            grBoardNetwork.Rows.Add(false, "Room Logic Controller", "8930000000019", "10" + "." + "1" + ".1.23", "12.43.3.3", "Stand-Alone", Convert.ToBoolean((byte)1), "1.0.4", "3.2.5","","06072015");
            grBoardNetwork.Rows.Add(false, "Bedside-17T", "8930000000200", "10" + "." + "1" + ".1.24", "12.43.3.5", "Slave", Convert.ToBoolean((byte)1),"1.0.4","3.2.5","","09032015");
#endif
            if (grBoardNetwork.Rows.Count > 0)
            {
                label2.Text = "Units on Network (" + grBoardNetwork.Rows.Count.ToString() + ")";
                SoSanhBoard();
                btn_AddtoData.Enabled = true;
                btn_EditUnitNetwork.Enabled = true;
                btn_ConfigUnitNetwork.Enabled = true;
                btn_TranfertoData.Enabled = true;
                if (gr_Unit.Rows.Count > 0)
                {
                    btn_transferToNet.Enabled = true;
                    btn_ReplaceDatabase.Enabled = true;
                }
                else
                {
                    btn_transferToNet.Enabled = false;
                    btn_ReplaceDatabase.Enabled = false;
                }
                btn_UpdateFirmware.Enabled = true;
                updateFirmwareToolStripMenuItem.Enabled = true;
                MessageBox.Show("Scan Finished!!!", "Announce");

            }
            else
            {
                label2.Text = "Units on Network";
                btn_AddtoData.Enabled = false;
                btn_EditUnitNetwork.Enabled = false;
                btn_ConfigUnitNetwork.Enabled = false;
                btn_TranfertoData.Enabled = false;
                btn_transferToNet.Enabled = false;
                btn_ReplaceDatabase.Enabled = false;
                btn_UpdateFirmware.Enabled = false;
                updateFirmwareToolStripMenuItem.Enabled = false;
                MessageBox.Show("No Unit Found", "Error");
            }

        }
        public string Substring(char c, int repeat, string s)
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




        private bool SoSanh()
        {
            int i = grBoardNetwork.CurrentCell.RowIndex;

            for (int j = 0; j < gr_Unit.Rows.Count; j++)
            {
                if (grBoardNetwork.Rows[i].Cells[3].Value.ToString() == gr_Unit.Rows[j].Cells[2].Value.ToString())
                    if (grBoardNetwork.Rows[i].Cells[4].Value.ToString() == gr_Unit.Rows[j].Cells[3].Value.ToString())
                        if (grBoardNetwork.Rows[i].Cells[5].Value.ToString() == gr_Unit.Rows[j].Cells[4].Value.ToString()) return true;
            }
            return false;
        }

        private bool AddFileDatabase(int SLin, int SL_Light_Out, int SL_AC_Out)
        {
            int index = grBoardNetwork.CurrentCell.RowIndex;
            string filePath = treeView1.SelectedNode.FullPath + "\\" + grBoardNetwork[3, grBoardNetwork.CurrentCell.RowIndex].Value.ToString() + "&" + grBoardNetwork[4, grBoardNetwork.CurrentCell.RowIndex].Value.ToString();
            FileStream fs;
            if (File.Exists(filePath))
            {
                MessageBox.Show("IP Address is duplicated. Please choose another one!");
                return false;
            }
            else
                fs = new FileStream(filePath, FileMode.Create);

            StreamWriter sWriter = new StreamWriter(fs, Encoding.UTF8);
            string Data = grBoardNetwork[1, index].Value.ToString() + "," + grBoardNetwork[2, index].Value.ToString() + "," + grBoardNetwork[3, index].Value.ToString() + "," + grBoardNetwork[4, index].Value.ToString() + "," + grBoardNetwork[5, index].Value.ToString() + "," + Convert.ToBoolean(grBoardNetwork[6, index].Value).ToString() + "," + grBoardNetwork[7, index].Value.ToString() + "," + grBoardNetwork[8, index].Value.ToString() + ",No Description" + "," + grBoardNetwork[11, index].Value.ToString();
            sWriter.WriteLine(Data);

            Board_Attribute board_att = new Board_Attribute();
            string[] rs485_cfg_arr = board_att.build_rs485_cfg(this);

            foreach (string cfg_str in rs485_cfg_arr)
            {
                sWriter.WriteLine(cfg_str);
            }

            sWriter.Flush();

            for (int i = 0; i < SLin; i++)
            {
                Data = InputNetwork[i].Input.ToString() + "," + InputNetwork[i].Function.ToString() + "," + InputNetwork[i].Ramp.ToString() + "," + InputNetwork[i].Preset.ToString() + ",";
                Data = Data + InputNetwork[i].Led_Status.ToString() + "," + InputNetwork[i].Auto_Mode.ToString() + "," + InputNetwork[i].Auto_Time.ToString() + "," + InputNetwork[i].DelayOff.ToString() + ",";
                Data = Data + InputNetwork[i].DelayOn.ToString() + "," + InputNetwork[i].NumGroup.ToString() + ",";
                for (int j = 0; j < InputNetwork[i].NumGroup; j++)
                    Data = Data + InputNetwork[i].Group[j].ToString() + "," + InputNetwork[i].Preset_Group[j].ToString() + ",";
                sWriter.WriteLine(Data);
                sWriter.Flush();
            }
            for (int i = 0; i < SL_Light_Out; i++)
            {
                Data = OutputNetwork[i].ToString() + "," + RLCFormRelay_DelayOn[i].ToString() + "," + RLCFormRelay_DelayOff[i].ToString();

                UInt16 size = Convert.ToUInt16(Marshal.SizeOf(Light_Out_Info2[i]));
                Byte[] info = new Byte[size];
                transfer_cmd.convert_light_out_cfg_to_array(ref info, Light_Out_Info2[i], 0);

                // Add lighting output info 2.
                for (int light_info = 0; light_info < info.Length; light_info++)
                {
                    Data += "," + info[light_info].ToString();
                }

                sWriter.WriteLine(Data);
                sWriter.Flush();
            }

            for (int i = 0; i < SL_AC_Out; i++) // Air conditioner output config
            {
                FieldInfo[] fields = AC_Out_Configs[i].GetType().GetFields();
                Data = "";
                foreach (var xInfo in fields)
                {
                    Data += "," + xInfo.GetValue(AC_Out_Configs[i]).ToString();
                }
                Data = Data.Remove(0, 1);

                sWriter.WriteLine(Data);
                sWriter.Flush();
            }
            fs.Close();



            return true;

        }

        private void btn_AddtoData_Click(object sender, EventArgs e)
        {
            int i = grBoardNetwork.CurrentCell.RowIndex;
            if (!SoSanh())
            {
                Form CfgUnit = new Input_RLC();
                int SLin = 0, Sl_Light_Out = 0, SL_AC_Out = 0;
                string board_name = grBoardNetwork.Rows[i].Cells[1].Value.ToString();
                GetSLIO(board_name, ref SLin, ref Sl_Light_Out, ref SL_AC_Out, ref CfgUnit);

                if (!GetIO_Unit(i, SLin, Sl_Light_Out, SL_AC_Out)) return;


                // Get RS485 config
                string IP = grBoardNetwork[3, i].Value.ToString();
                string ID = grBoardNetwork[4, i].Value.ToString();

                transfer_cmd.get_rs485_config(IP, ID, ref RS485_Cfg);

                if (AddFileDatabase(SLin, Sl_Light_Out, SL_AC_Out))
                {
                    gr_Unit.Rows.Add(grBoardNetwork.Rows[i].Cells[1].Value.ToString(), grBoardNetwork.Rows[i].Cells[2].Value.ToString(),
                    grBoardNetwork.Rows[i].Cells[3].Value.ToString(), grBoardNetwork.Rows[i].Cells[4].Value.ToString(), grBoardNetwork.Rows[i].Cells[5].Value.ToString(),
                    grBoardNetwork.Rows[i].Cells[6].Value, grBoardNetwork.Rows[i].Cells[7].Value.ToString(), grBoardNetwork.Rows[i].Cells[8].Value.ToString(), "No Description", grBoardNetwork.Rows[i].Cells[11].Value.ToString());
                    grBoardNetwork.Rows[i].DefaultCellStyle.ForeColor = Color.Green;
                    grBoardNetwork.Rows[i].DefaultCellStyle.SelectionForeColor = Color.Green;

                    gr_Unit.Rows[gr_Unit.Rows.Count - 1].DefaultCellStyle.ForeColor = Color.Green;
                    gr_Unit.Rows[gr_Unit.Rows.Count - 1].DefaultCellStyle.SelectionForeColor = Color.Green;

                }


            }

        }

        public bool SetupBoard(string oldIP, string oldID, string Man_date, string Barcode, string newID, bool Reset)
        {
            IPEndPoint ep = new IPEndPoint(IPAddress.Parse(oldIP), UDPPort);
            Socket s = new Socket(AddressFamily.InterNetwork, SocketType.Dgram, ProtocolType.Udp);

            s.ReceiveTimeout = 5000;
            int cnt;
            byte[] DuLieuTuBo;
            DuLieuTuBo = new byte[1024];


            try
            {
                Byte[] Data;    //<Address><length><CMD><Data><CRC> 
                Data = new Byte[1024];

                int SumCRC = 0;

                Data[0] = Convert.ToByte(Substring('.', 3, oldID));
                Data[1] = Convert.ToByte(Substring('.', 2, oldID));
                Data[2] = Convert.ToByte(Substring('.', 1, oldID));
                Data[3] = Convert.ToByte(Substring('.', 0, oldID));


                //Reset Firmware version
                if (Reset)
                {
                    Data[4] = 4;   // Address:4 ;Length=2 byte; CMD:2, Data:8, CRC:2
                    Data[5] = 0;

                    SumCRC = 0;

                    Data[6] = 2;
                    Data[7] = 0;

                    for (int i = 4; i < Data[4] + 4; i++)
                        SumCRC = SumCRC + Data[i];

                    Data[9] = (byte)(SumCRC / 256);
                    Data[8] = (byte)(SumCRC - Data[9] * 256);

                    s.SendTo(Data, Data[4] + 6, SocketFlags.None, ep);
                    cnt = s.ReceiveFrom(DuLieuTuBo, ref rm);
                }


                //Change Manufacture date
                if (Man_date.Length != 0)
                {
                    Data[4] = Convert.ToByte(Man_date.Length + 4);   // Address:4 ;Length=2 byte; CMD:2, Data:8, CRC:2
                    Data[5] = 0;

                    SumCRC = 0;

                    Data[6] = 2;
                    Data[7] = 6;

                    for (int i = 0; i < Man_date.Length; i++)
                        Data[i + 8] = (byte)(Man_date[i]);


                    for (int i = 4; i < Data[4] + 4; i++)
                        SumCRC = SumCRC + Data[i];

                    Data[9 + Man_date.Length] = (byte)(SumCRC / 256);
                    Data[8 + Man_date.Length] = (byte)(SumCRC - Data[9 + Man_date.Length] * 256);

                    s.SendTo(Data, Data[4] + 6, SocketFlags.None, ep);
                    cnt = s.ReceiveFrom(DuLieuTuBo, ref rm);
                }

                //Change Barcode
                if (Barcode != ConfigUnit.Barcode)
                {
                    Data[4] = Convert.ToByte(Barcode.Length + 4);   // Address:4 ;Length=2 byte; CMD:2, Data:13, CRC:2
                    Data[5] = 0;

                    SumCRC = 0;

                    Data[6] = 2;
                    Data[7] = 7;

                    for (int i = 0; i < Barcode.Length; i++)
                        Data[i + 8] = (byte)(Barcode[i]);


                    for (int i = 4; i < Data[4] + 4; i++)
                        SumCRC = SumCRC + Data[i];

                    Data[9 + Barcode.Length] = (byte)(SumCRC / 256);
                    Data[8 + Barcode.Length] = (byte)(SumCRC - Data[9 + Barcode.Length] * 256);

                    s.SendTo(Data, Data[4] + 6, SocketFlags.None, ep);
                    cnt = s.ReceiveFrom(DuLieuTuBo, ref rm);
                }

                //Change ID
                if (oldID != newID)
                {
                    Data[4] = 7;   // Address:4 ;Length=2 byte; CMD:2, Data:13, CRC:2
                    Data[5] = 0;

                    SumCRC = 0;
                    Data[6] = 2;
                    Data[7] = 1;

                    Data[8] = Convert.ToByte(Substring('.', 2, newID));
                    Data[9] = Convert.ToByte(Substring('.', 1, newID));
                    Data[10] = Convert.ToByte(Substring('.', 0, newID));

                    for (int i = 4; i < Data[4] + 4; i++)
                        SumCRC = SumCRC + Data[i];

                    Data[12] = (byte)(SumCRC / 256);
                    Data[11] = (byte)(SumCRC - Data[12] * 256);

                    s.SendTo(Data, Data[4] + 6, SocketFlags.None, ep);
                    cnt = s.ReceiveFrom(DuLieuTuBo, ref rm);
                }

                grBoardNetwork.Rows.Clear();
                if (transNet == false) btn_Scan_Click(null, null);
                transNet = false;
                return true;
            }

            catch
            {
                s.Close();
                MessageBox.Show("Can't connect to unit IP : " + oldIP, "Network Error");
                return false;
            }

        }
        public bool EditNetwork(string oldIP, string oldID)
        {

            // Send the RS485 config first
            transfer_cmd.set_rs485_config(oldIP, oldID, RS485_Cfg);

            IPEndPoint ep = new IPEndPoint(IPAddress.Parse(oldIP), UDPPort);
            Socket s = new Socket(AddressFamily.InterNetwork, SocketType.Dgram, ProtocolType.Udp);
            s.ReceiveTimeout = 5000;
            int cnt;
            byte[] DuLieuTuBo;
            DuLieuTuBo = new byte[1024];


            try
            {

                Byte[] Data;    //<Address><length><CMD><Data><CRC> 
                Data = new Byte[1024];
                int SumCRC = 0;

                Data[0] = Convert.ToByte(Substring('.', 3, oldID));
                Data[1] = Convert.ToByte(Substring('.', 2, oldID));
                Data[2] = Convert.ToByte(Substring('.', 1, oldID));
                Data[3] = Convert.ToByte(Substring('.', 0, oldID));

                Data[4] = 5;   // Address:4 ;Length=2 byte; CMD:2, Data:0, CRC:2
                Data[5] = 0;



                if (ConfigUnit.kind != oldActMode)
                {

                    //Change Actmode
                    SumCRC = 0;
                    Data[6] = 1;
                    Data[7] = 11;

                    Data[8] = Convert.ToByte(ConfigUnit.kind);

                    for (int i = 4; i < Data[4] + 4; i++)
                        SumCRC = SumCRC + Data[i];

                    Data[10] = (byte)(SumCRC / 256);
                    Data[9] = (byte)(SumCRC - Data[10] * 256);

                    s.SendTo(Data, Data[4] + 6, SocketFlags.None, ep);
                    cnt = s.ReceiveFrom(DuLieuTuBo, ref rm);
                }

                //Change Hardware Enable
                SumCRC = 0;

                Data[6] = 1;
                Data[7] = 12;
                int Hardware_enable = ConfigUnit.kind | (Convert.ToByte(ConfigUnit.LoadCan) << 2) | (Convert.ToByte(ConfigUnit.Recovery) << 6);
                Data[8] = Convert.ToByte(Hardware_enable);

                for (int i = 4; i < Data[4] + 4; i++)
                    SumCRC = SumCRC + Data[i];

                Data[10] = (byte)(SumCRC / 256);
                Data[9] = (byte)(SumCRC - Data[10] * 256);

                if (ConfigUnit.hw_change)
                {
                    s.SendTo(Data, Data[4] + 6, SocketFlags.None, ep);
                    cnt = s.ReceiveFrom(DuLieuTuBo, ref rm);
                }


                //Change ID
                if (oldID != ConfigUnit.IDCan)
                {
                    SumCRC = 0;
                    Data[6] = 1;
                    Data[7] = 8;

                    Data[8] = Convert.ToByte(Substring('.', 3, ConfigUnit.IDCan));

                    for (int i = 4; i < Data[4] + 4; i++)
                        SumCRC = SumCRC + Data[i];

                    Data[10] = (byte)(SumCRC / 256);
                    Data[9] = (byte)(SumCRC - Data[10] * 256);

                    s.SendTo(Data, Data[4] + 6, SocketFlags.None, ep);
                    cnt = s.ReceiveFrom(DuLieuTuBo, ref rm);
                }


                //Chang IP
                if (oldIP != (ConfigUnit.Ip_Layer_Mask_High + "." + ConfigUnit.Ip_Layer_Mask_Low + "." + ConfigUnit.IP))
                {
                    Thread.Sleep(1000);
                    SumCRC = 0;

                    if (string.Compare(ConfigUnit.Fw_ver, "2.0.0") <= 0)
                    {
                        Data[0] = Convert.ToByte(Substring('.', 3, ConfigUnit.IDCan));
                        Data[1] = Convert.ToByte(Substring('.', 2, ConfigUnit.IDCan));
                        Data[2] = Convert.ToByte(Substring('.', 1, ConfigUnit.IDCan));
                        Data[3] = Convert.ToByte(Substring('.', 0, ConfigUnit.IDCan));

                        Data[4] = 8;   // Address:4 ;Length=2 byte; CMD:2, Data:0, CRC:2
                        Data[5] = 0;

                        Data[6] = 1;
                        Data[7] = 7;

                        Data[8] = Convert.ToByte(ConfigUnit.Ip_Layer_Mask_High);
                        Data[9] = Convert.ToByte(ConfigUnit.Ip_Layer_Mask_Low);
                        Data[10] = Convert.ToByte(Substring('.', 0, ConfigUnit.IP));
                        Data[11] = Convert.ToByte(Substring('.', 1, ConfigUnit.IP));

                        for (int i = 4; i < Data[4] + 4; i++)
                            SumCRC = SumCRC + Data[i];

                        Data[13] = (byte)(SumCRC / 256);
                        Data[12] = (byte)(SumCRC - Data[13] * 256);

                        s.SendTo(Data, Data[4] + 6, SocketFlags.None, ep);
                        cnt = s.ReceiveFrom(DuLieuTuBo, ref rm);

                        s.Close();
                        //Request Unit

                        ep = new IPEndPoint(IPAddress.Parse(ConfigUnit.Ip_Layer_Mask_High + "." + ConfigUnit.Ip_Layer_Mask_Low + "." + ConfigUnit.IP), UDPPort);
                        s = new Socket(AddressFamily.InterNetwork, SocketType.Dgram, ProtocolType.Udp);
                        s.ReceiveTimeout = 10000;

                        Data[4] = 4;
                        Data[5] = 0;

                        Data[6] = 1;
                        Data[7] = 1;

                        SumCRC = 0;

                        for (int i = 4; i < Data[4] + 4; i++)
                            SumCRC = SumCRC + Data[i];

                        Data[9] = (byte)(SumCRC / 256);
                        Data[8] = (byte)(SumCRC - Data[9] * 256);

                        DuLieuTuBo[4] = 0;

                        int reconnect_retry = 0;
                        while (DuLieuTuBo[4] < 10)
                        {
                            s.SendTo(Data, Data[4] + 6, SocketFlags.None, ep);
                            try
                            {
                                cnt = s.ReceiveFrom(DuLieuTuBo, ref rm);
                            }
                            catch
                            {
                                reconnect_retry++;
                                if (reconnect_retry > 3)
                                {
                                    s.Close();
                                    MessageBox.Show("Can't connect to unit IP :" + ConfigUnit.Ip_Layer_Mask_High + "." + ConfigUnit.Ip_Layer_Mask_Low + "." + ConfigUnit.IP, "Network Error");
                                    return false;
                                }
                            };

                        }
                        s.Close();
                    }
                    else
                    {
                        s.Close();

                        Data[0] = Convert.ToByte(Substring('.', 3, ConfigUnit.IDCan));
                        Data[1] = Convert.ToByte(Substring('.', 2, ConfigUnit.IDCan));
                        Data[2] = Convert.ToByte(Substring('.', 1, ConfigUnit.IDCan));
                        Data[3] = Convert.ToByte(Substring('.', 0, ConfigUnit.IDCan));

                        Data[4] = 12;   // Address:4 ;Length=2 byte; CMD:2, Data:0, CRC:2
                        Data[5] = 0;

                        Data[6] = 1;
                        Data[7] = 7;

                        // New IP
                        Data[8] = Convert.ToByte(ConfigUnit.Ip_Layer_Mask_High);
                        Data[9] = Convert.ToByte(ConfigUnit.Ip_Layer_Mask_Low);
                        Data[10] = Convert.ToByte(Substring('.', 0, ConfigUnit.IP));
                        Data[11] = Convert.ToByte(Substring('.', 1, ConfigUnit.IP));

                        // Old IP
                        Data[12] = Convert.ToByte(Substring('.', 0, oldIP));
                        Data[13] = Convert.ToByte(Substring('.', 1, oldIP));
                        Data[14] = Convert.ToByte(Substring('.', 2, oldIP));
                        Data[15] = Convert.ToByte(Substring('.', 3, oldIP));

                        for (int i = 4; i < Data[4] + 4; i++)
                            SumCRC = SumCRC + Data[i];

                        Data[17] = (byte)(SumCRC / 256);
                        Data[16] = (byte)(SumCRC - Data[13] * 256);


                        // Send
                        UdpClient client = new UdpClient(LocalUDPPort, AddressFamily.InterNetwork);
                        IPEndPoint groupEp = new IPEndPoint(IPAddress.Broadcast, UDPPort);
                        client.Connect(groupEp);

                        client.Send(Data, Data[4] + 6);
                        client.Close();


                        // Received
                        IPEndPoint rm = new IPEndPoint(IPAddress.Any, 0);
                        UdpClient udpResponse = new UdpClient(LocalUDPPort);
                        udpResponse.Client.ReceiveTimeout = 1000;

                        try
                        {
                            DuLieuTuBo = udpResponse.Receive(ref rm);
                        }
                        catch { }

                        udpResponse.Close();



                        //Request Unit                       

                        Data[4] = 4;
                        Data[5] = 0;

                        Data[6] = 1;
                        Data[7] = 1;

                        SumCRC = 0;

                        for (int i = 4; i < Data[4] + 4; i++)
                            SumCRC = SumCRC + Data[i];

                        Data[9] = (byte)(SumCRC / 256);
                        Data[8] = (byte)(SumCRC - Data[9] * 256);

                        DuLieuTuBo[4] = 0;

                        int reconnect_retry = 0;
                        while (DuLieuTuBo[4] < 10)
                        {
                            client = new UdpClient(LocalUDPPort, AddressFamily.InterNetwork);
                            client.Connect(groupEp);

                            client.Send(Data, Data[4] + 6);
                            client.Close();

                            try
                            {
                                rm = new IPEndPoint(IPAddress.Any, 0);
                                udpResponse = new UdpClient(LocalUDPPort);
                                udpResponse.Client.ReceiveTimeout = 10000;

                                DuLieuTuBo = udpResponse.Receive(ref rm);

                                udpResponse.Close();
                            }
                            catch
                            {
                                reconnect_retry++;
                                udpResponse.Close();
                                if (reconnect_retry > 3)
                                {
                                    MessageBox.Show("Can't connect to unit IP :" + ConfigUnit.Ip_Layer_Mask_High + "." + ConfigUnit.Ip_Layer_Mask_Low + "." + ConfigUnit.IP, "Network Error");
                                    return false;
                                }
                            };

                        }
                    }
                }

                s.Close();
                grBoardNetwork.Rows.Clear();
                if (transNet == false) btn_Scan_Click(null, null);
                transNet = false;
                return true;
            }

            catch
            {
                s.Close();
                MessageBox.Show("Can't connect to unit IP :" + oldIP, "Network Error");
                return false;
            }
        }

        private void btn_EditUnitNetwork_Click(object sender, EventArgs e)
        {
            int index = grBoardNetwork.CurrentCell.RowIndex;
            rowindex = index;

            string IP = grBoardNetwork[3, index].Value.ToString();
            string ID = grBoardNetwork[4, index].Value.ToString();

            ConfigUnit.IP = "";
            ConfigUnit.IDCan = grBoardNetwork[4, index].Value.ToString();

            ConfigUnit.unit = 0;

            if (grBoardNetwork.Rows[index].Cells[1].Value.ToString() == "RLC-I16") ConfigUnit.unit = 1;
            else if (grBoardNetwork.Rows[index].Cells[1].Value.ToString() == "RLC-I20") ConfigUnit.unit = 2;
            else if (grBoardNetwork.Rows[index].Cells[1].Value.ToString() == "Bedside-17T") ConfigUnit.unit = 3;
            else if (grBoardNetwork.Rows[index].Cells[1].Value.ToString() == "Bedside-12T") ConfigUnit.unit = 4;
            else if (grBoardNetwork.Rows[index].Cells[1].Value.ToString() == "BSP_R14_OL") ConfigUnit.unit = 5;
            else if (grBoardNetwork.Rows[index].Cells[1].Value.ToString() == "RCU-32AO") ConfigUnit.unit = 6;
            else if (grBoardNetwork.Rows[index].Cells[1].Value.ToString() == "RCU-8RL-24AO") ConfigUnit.unit = 7;
            else if (grBoardNetwork.Rows[index].Cells[1].Value.ToString() == "RCU-16RL-16AO") ConfigUnit.unit = 8;
            else if (grBoardNetwork.Rows[index].Cells[1].Value.ToString() == "RCU-24RL-8AO") ConfigUnit.unit = 9;
            else if (grBoardNetwork.Rows[index].Cells[1].Value.ToString() == "RCU-11IN-4RL") ConfigUnit.unit = 10;
            else if (grBoardNetwork.Rows[index].Cells[1].Value.ToString() == "RCU-21IN-8RL") ConfigUnit.unit = 11;
            else if (grBoardNetwork.Rows[index].Cells[1].Value.ToString() == "RCU-21IN-8RL-4AO") ConfigUnit.unit = 12;
            else if (grBoardNetwork.Rows[index].Cells[1].Value.ToString() == "RCU-21IN-8RL-4AI") ConfigUnit.unit = 13;
            else if (grBoardNetwork.Rows[index].Cells[1].Value.ToString() == "RCU-21IN-8RL-K") ConfigUnit.unit = 14;
            else if (grBoardNetwork.Rows[index].Cells[1].Value.ToString() == "RCU-21IN-8RL-DL") ConfigUnit.unit = 15;
            else if (grBoardNetwork.Rows[index].Cells[1].Value.ToString() == "RCU-21IN-10RL") ConfigUnit.unit = 16;
            else if (grBoardNetwork.Rows[index].Cells[1].Value.ToString() == "RCU-30IN-10RL") ConfigUnit.unit = 17;
            else if (grBoardNetwork.Rows[index].Cells[1].Value.ToString() == "RCU-48IN-16RL") ConfigUnit.unit = 18;
            else if (grBoardNetwork.Rows[index].Cells[1].Value.ToString() == "RCU-48IN-16RL-4AO") ConfigUnit.unit = 19;
            else if (grBoardNetwork.Rows[index].Cells[1].Value.ToString() == "RCU-48IN-16RL-4AI") ConfigUnit.unit = 20;
            else if (grBoardNetwork.Rows[index].Cells[1].Value.ToString() == "RCU-48IN-16RL-K") ConfigUnit.unit = 21;
            else if (grBoardNetwork.Rows[index].Cells[1].Value.ToString() == "RCU-48IN-16RL-DL") ConfigUnit.unit = 22;
            else if (grBoardNetwork.Rows[index].Cells[1].Value.ToString() == "GNT-EXT-6RL") ConfigUnit.unit = 23;   //old name: RCU-6RL
            else if (grBoardNetwork.Rows[index].Cells[1].Value.ToString() == "GNT-EXT-8RL") ConfigUnit.unit = 24;  //old name: RCU-8RL
            else if (grBoardNetwork.Rows[index].Cells[1].Value.ToString() == "GNT-EXT-12RL") ConfigUnit.unit = 25;
            else if (grBoardNetwork.Rows[index].Cells[1].Value.ToString() == "GNT-EXT-20RL") ConfigUnit.unit = 26;
            else if (grBoardNetwork.Rows[index].Cells[1].Value.ToString() == "GNT-EXT-10AO") ConfigUnit.unit = 27;  //old name: RCU-10AO
            else if (grBoardNetwork.Rows[index].Cells[1].Value.ToString() == "GNT-EXT-28AO") ConfigUnit.unit = 28;
            else if (grBoardNetwork.Rows[index].Cells[1].Value.ToString() == "GNT-EXT-12RL-12AO") ConfigUnit.unit = 29;
            else if (grBoardNetwork.Rows[index].Cells[1].Value.ToString() == "GNT-EXT-24IN") ConfigUnit.unit = 30;
            else if (grBoardNetwork.Rows[index].Cells[1].Value.ToString() == "GNT-EXT-48IN") ConfigUnit.unit = 31;
            
            ConfigUnit.Ip_Layer_Mask_High = Substring('.', 0, grBoardNetwork[3, index].Value.ToString());
            ConfigUnit.Ip_Layer_Mask_Low = Substring('.', 1, grBoardNetwork[3, index].Value.ToString());
            ConfigUnit.Descript = "";

            int dem = 0;
            for (int i = 0; i < grBoardNetwork.Rows[index].Cells[3].Value.ToString().Length; i++)
            {
                if (dem >= 2) ConfigUnit.IP = ConfigUnit.IP + grBoardNetwork.Rows[index].Cells[3].Value.ToString()[i];
                if (grBoardNetwork.Rows[index].Cells[3].Value.ToString()[i] == '.') dem++;
            }
            dem = 0;

            if (grBoardNetwork.Rows[index].Cells[5].Value.ToString() == "Master") ConfigUnit.kind = 2;
            else if (grBoardNetwork.Rows[index].Cells[5].Value.ToString() == "Slave") ConfigUnit.kind = 1;
            else ConfigUnit.kind = 0;

            ConfigUnit.LoadCan = Convert.ToBoolean(grBoardNetwork.Rows[index].Cells[6].Value);
            ConfigUnit.Recovery = Convert.ToBoolean(grBoardNetwork.Rows[index].Cells[11].Value);
            ConfigUnit.Fw_ver = grBoardNetwork.Rows[index].Cells[7].Value.ToString();

            RS485_Cfg = null;

            transfer_cmd.get_rs485_config(IP, ID, ref RS485_Cfg);

            Add_Unit AddUnit = new Add_Unit();
            AddUnit.edit = true;
            AddUnit.Text = "Edit_Unit_Network";
            AddUnit.Initialize(this);

            Group_Path = treeView1.SelectedNode.FullPath;

            this.Enabled = false;
            AddUnit.Show();
            AddUnit.Focus();


        }

        private void gr_Unit_RowsAdded(object sender, DataGridViewRowsAddedEventArgs e)
        {
            if (treeView1.SelectedNode.Text == "Unit")
            {
                btn_EditUnit.Enabled = true;
                btn_ConfigUnit.Enabled = true;
                btn_DeleteUnit.Enabled = true;
                if (grBoardNetwork.Rows.Count > 0)
                {
                    btn_transferToNet.Enabled = true;
                    btn_ReplaceDatabase.Enabled = true;
                }
                else
                {
                    btn_transferToNet.Enabled = false;
                    btn_ReplaceDatabase.Enabled = false;
                }
            }
        }

        private void btn_ReplaceDatabase_Click(object sender, EventArgs e)
        {
            int indexDatabase = gr_Unit.CurrentCell.RowIndex;
            int i = grBoardNetwork.CurrentCell.RowIndex;

            if (grBoardNetwork[2, i].Value.ToString() != gr_Unit[1, indexDatabase].Value.ToString())
            {
                MessageBox.Show("Different board type. Please choose another one!!!", "Error");
                return;
            }

            for (int j = 0; j < gr_Unit.Rows.Count; j++)
            {
                if (j != indexDatabase)
                {
                    if ((grBoardNetwork.Rows[i].Cells[3].Value.ToString() == gr_Unit.Rows[j].Cells[2].Value.ToString()) && (grBoardNetwork.Rows[i].Cells[4].Value.ToString() == gr_Unit.Rows[j].Cells[3].Value.ToString()))
                    {
                        MessageBox.Show("Unit IP: " + grBoardNetwork[3, i].Value.ToString() + " already exists in database. Can't replace another unit!!!", "Error");
                        return;
                    }
                }
            }

            Form CfgUnit = new Input_RLC();
            int SLin = 0, Sl_Light_Out = 0, SL_AC_Out = 0;
            string board_name = grBoardNetwork.Rows[i].Cells[1].Value.ToString();
            GetSLIO(board_name, ref SLin, ref Sl_Light_Out, ref SL_AC_Out, ref CfgUnit);

            if (GetIO_Unit(i, SLin, Sl_Light_Out, SL_AC_Out))
            {
                // Get RS485 config
                string IP = grBoardNetwork[3, i].Value.ToString();
                string ID = grBoardNetwork[4, i].Value.ToString();

                transfer_cmd.get_rs485_config(IP, ID, ref RS485_Cfg);

                DialogResult lkResult = MessageBox.Show("Are you sure to replace unit on network to database? The database will be replaced!!!", "Replace unit", MessageBoxButtons.YesNo);

                if (lkResult == DialogResult.Yes)
                {
                    string filePath = treeView1.SelectedNode.FullPath + "\\" + gr_Unit.Rows[indexDatabase].Cells[2].Value.ToString() + "&" + gr_Unit.Rows[indexDatabase].Cells[3].Value.ToString();
                    File.Delete(filePath);
                    gr_Unit.Rows.RemoveAt(indexDatabase);

                    if (AddFileDatabase(SLin, Sl_Light_Out, SL_AC_Out))
                    {
                        gr_Unit.Rows.Add(grBoardNetwork.Rows[i].Cells[1].Value.ToString(), grBoardNetwork.Rows[i].Cells[2].Value.ToString(),
                            grBoardNetwork.Rows[i].Cells[3].Value.ToString(), grBoardNetwork.Rows[i].Cells[4].Value.ToString(), grBoardNetwork.Rows[i].Cells[5].Value.ToString(),
                            grBoardNetwork.Rows[i].Cells[6].Value, grBoardNetwork.Rows[i].Cells[7].Value.ToString(), grBoardNetwork.Rows[i].Cells[8].Value.ToString(), "No Description", grBoardNetwork.Rows[i].Cells[11].Value.ToString());

                        grBoardNetwork.Rows[i].DefaultCellStyle.ForeColor = Color.Green;
                        grBoardNetwork.Rows[i].DefaultCellStyle.SelectionForeColor = Color.Green;
                        gr_Unit.Rows[gr_Unit.RowCount - 1].DefaultCellStyle.ForeColor = Color.Green;
                        gr_Unit.Rows[gr_Unit.RowCount - 1].DefaultCellStyle.SelectionForeColor = Color.Green;
                    }
                }
            }

        }

        private byte ConvertToHex(char c1, char c2)
        {
            byte hi, lo, result;


            if (Char.ToUpper(c1) == 'A') hi = 10;
            else if (Char.ToUpper(c1) == 'B') hi = 11;
            else if (Char.ToUpper(c1) == 'C') hi = 12;
            else if (Char.ToUpper(c1) == 'D') hi = 13;
            else if (Char.ToUpper(c1) == 'E') hi = 14;
            else if (Char.ToUpper(c1) == 'F') hi = 15;
            else hi = Convert.ToByte(c1.ToString());

            if (Char.ToUpper(c2) == 'A') lo = 10;
            else if (Char.ToUpper(c2) == 'B') lo = 11;
            else if (Char.ToUpper(c2) == 'C') lo = 12;
            else if (Char.ToUpper(c2) == 'D') lo = 13;
            else if (Char.ToUpper(c2) == 'E') lo = 14;
            else if (Char.ToUpper(c2) == 'F') lo = 15;
            else lo = Convert.ToByte(c2.ToString());
            result = (byte)(hi * 16 + lo);
            return result;
        }

        private void Khoanut(bool check)
        {
            grBoardNetwork.Enabled = check;
            panel_firmware.Visible = !check;
            panel2.Enabled = check;
            btn_transferToNet.Enabled = check;
        }

        private void btn_UpdateFirmware_Click(object sender, EventArgs e)
        {
            label4.Text = "Loading firmware. Please wait a few seconds...";
            prBar_Update.Value = 0;
            lb_percent.Text = "0%";
            OpenFileDialog op = new OpenFileDialog();
            op.Filter = "hex file|*.hex";
            op.ShowDialog();
            string tenfile = "";
            List<string> listReport = new List<string>();

            for (int i = op.FileName.Length - 1; i >= 0; i--)
            {
                if (op.FileName[i] != '\\') tenfile = op.FileName[i] + tenfile;
                else break;
            }

            if (op.FileName != "")
            {
                int unitCnt;
                int cntSelectUnit = 0;
                int checkUnit = 0;
                int index = grBoardNetwork.CurrentCell.RowIndex;
                string txtString;

                for (unitCnt = 0; unitCnt < grBoardNetwork.RowCount; unitCnt++)
                {
                    if (grBoardNetwork.Rows[unitCnt].Cells[0].FormattedValue.ToString() == "True")
                    {
                        cntSelectUnit++;
                        checkUnit = unitCnt;
                    }
                }
                if (cntSelectUnit == 0)
                    txtString = "Are you sure to update firware: " + tenfile + " to unit IP: " + grBoardNetwork.Rows[grBoardNetwork.CurrentCell.RowIndex].Cells[3].Value.ToString() + "/" + grBoardNetwork.Rows[grBoardNetwork.CurrentCell.RowIndex].Cells[4].Value.ToString() + "?";
                else if (cntSelectUnit == 1)
                    txtString = "Are you sure to update firware: " + tenfile + " to unit IP: " + grBoardNetwork.Rows[checkUnit].Cells[3].Value.ToString() + "/" + grBoardNetwork.Rows[checkUnit].Cells[4].Value.ToString() + "?";
                else
                    txtString = "Are you sure to update firware: " + tenfile + " to all selected Units?";
                if (MessageBox.Show(txtString, "Update Firmware", MessageBoxButtons.YesNo) == DialogResult.Yes)
                {
                    StreamReader rd = File.OpenText(op.FileName);
                    string input = null;
                    int SoDong = -1;
                    while ((input = rd.ReadLine()) != null) SoDong++;
                    rd.Close();

                    if (SoDong > 0)
                    {
                        int cnt;
                        byte[] DuLieuTuBo;
                        DuLieuTuBo = new byte[1024];
                        byte[] Data;    //<Address><length><CMD><Data><CRC> 
                        Data = new byte[1024];
                        int SumCRC = 0, fwCRC = 0;
                        int dem = 0;
                        string stFile;
                        int vitri;
                        double percent;
                        string str;
                        int length, posdata;
                        int count = 0;

                        string header;
                        string[] strArray;

                        for (unitCnt = 0; unitCnt < grBoardNetwork.RowCount; unitCnt++)
                        {
                            //index = grBoardNetwork.CurrentCell.RowIndex;
                            string IP, ID;
                            int SoLanRetry = 0;
                            IP = grBoardNetwork[3, unitCnt].Value.ToString();
                            ID = grBoardNetwork[4, unitCnt].Value.ToString();
                            if ((grBoardNetwork.Rows[unitCnt].Cells[0].FormattedValue.ToString() == "True") || (unitCnt == index) && (cntSelectUnit == 0))
                            {
                                count++;
                                rd = File.OpenText(op.FileName);
                                header = rd.ReadLine();
                                strArray = header.Split(',');
                                if (strArray.Length > 1)    //added by Hoai An
                                {
                                    if (strArray[1] != grBoardNetwork.Rows[unitCnt].Cells[2].Value.ToString())
                                    {
                                        listReport.Add("Error: " + IP + "/" + ID + " Firmware is not correct");
                                        rd.Close();
                                        if (count >= cntSelectUnit)
                                        {
                                            Khoanut(true);
                                            Report report = new Report(listReport);
                                            report.ShowDialog();
                                            btn_Scan_Click(null, null);
                                            return;
                                        }
                                        else
                                            continue;
                                    }
                                }

                                IPEndPoint ep = new IPEndPoint(IPAddress.Parse(IP), UDPPort);
                                Socket s = new Socket(AddressFamily.InterNetwork,
                                                   SocketType.Dgram, ProtocolType.Udp);
                                lbip.ForeColor = System.Drawing.Color.Green;
                                lbip.Text = "IP: " + IP + "/" + ID;
                                s.ReceiveTimeout = 2000;
                                SumCRC = 0;
                                input = null;
                                label4.Text = "";

                                str = grBoardNetwork.Rows[unitCnt].Cells[4].Value.ToString();

                                Data[3] = Convert.ToByte(str.Substring(0, str.IndexOf(".")));
                                str = str.Substring(str.IndexOf(".") + 1);

                                Data[2] = Convert.ToByte(str.Substring(0, str.IndexOf(".")));
                                str = str.Substring(str.IndexOf(".") + 1);

                                Data[1] = Convert.ToByte(str.Substring(0, str.IndexOf(".")));
                                str = str.Substring(str.IndexOf(".") + 1);

                                Data[0] = Convert.ToByte(str);

                                Data[6] = 1;
                                Data[7] = 6;

                                length = 4;
                                posdata = 8;

                                if (strArray.Length > 0)
                                    input = strArray[0].Substring(1);
                                while (input != "")
                                {
                                    Data[posdata] = ConvertToHex(input[0], input[1]);
                                    input = input.Substring(2);
                                    length = length + 1;
                                    posdata = posdata + 1;
                                }

                                Data[5] = (byte)(length / 256);
                                Data[4] = (byte)(length - Data[5] * 256);

                                for (int i = 4; i < length + 4; i++)
                                    SumCRC = SumCRC + Data[i];

                                Data[posdata + 1] = (byte)(SumCRC / 256);
                                Data[posdata] = (byte)(SumCRC - Data[posdata + 1] * 256);
                                SoLanRetry = 0;

                                s.SendTo(Data, length + 6, SocketFlags.None, ep);
                                Thread.Sleep(300);
                                while ((DuLieuTuBo[7] != 6) && (SoLanRetry < SoLanRetryMaxFirmware))
                                {
                                    try
                                    {
                                        cnt = s.ReceiveFrom(DuLieuTuBo, ref rm);
                                    }
                                    catch
                                    {
                                        s.SendTo(Data, length + 6, SocketFlags.None, ep);
                                        Thread.Sleep(300);
                                    }
                                    if (DuLieuTuBo[8] == 255)
                                    {
                                        s.SendTo(Data, length + 6, SocketFlags.None, ep);
                                        Thread.Sleep(300);

                                    }
                                    SoLanRetry++;
                                }
                                if ((DuLieuTuBo[7] != 6))
                                {
                                    if (DuLieuTuBo[8] == 9) listReport.Add("Error: " + IP + "/" + ID + " Lower Firmware");// MessageBox.Show("Lower Firmware");
                                    else if (DuLieuTuBo[6] == 1) listReport.Add("Error: " + IP + "/" + ID + " Data transfer error");//MessageBox.Show("Data transfer error");
                                    if (DuLieuTuBo[6] != 1) listReport.Add("Error: Can't connect to IP: " + IP + "/" + ID);//MessageBox.Show("Can't connect to IP: " + grBoardNetwork.Rows[grBoardNetwork.CurrentCell.RowIndex].Cells[3].Value.ToString(), "Error");
                                    s.Close();
                                    rd.Close();
                                    if (count >= cntSelectUnit)
                                    {
                                        Khoanut(true);
                                        Report report = new Report(listReport);
                                        report.ShowDialog();
                                        btn_Scan_Click(null, null);
                                        return;
                                    }
                                    else
                                        continue;
                                }

                                Khoanut(false);
                                percent = 0;
                                prBar_Update.Value = 0;
                                lb_percent.Text = "0%";
                                fwCRC = 0;
                                while (input != null)
                                {
                                    dem = 0;
                                    if (input.Length > 0) stFile = input.Substring(1);
                                    else stFile = "";
                                    while (((input = rd.ReadLine()) != null) && (dem < 40))
                                    {
                                        dem++;
                                        input = input.Substring(1);
                                        stFile = stFile + input;

                                    }

                                    posdata = 8;
                                    length = 4;
                                    SumCRC = 0;
                                    vitri = 0;
                                    while (vitri < stFile.Length - 1)
                                    {
                                        Data[posdata] = ConvertToHex(stFile[vitri], stFile[vitri + 1]);
                                        vitri = vitri + 2;
                                        length = length + 1;
                                        SumCRC = SumCRC + Data[posdata];
                                        fwCRC = fwCRC + Data[posdata];
                                        posdata = posdata + 1;
                                    }

                                    Data[5] = (byte)(length / 256);
                                    Data[4] = (byte)(length - Data[5] * 256);

                                    for (int i = 4; i < 8; i++)
                                        SumCRC = SumCRC + Data[i];

                                    Data[posdata + 1] = (byte)(SumCRC / 256);
                                    Data[posdata] = (byte)(SumCRC - Data[posdata + 1] * 256);
                                    SoLanRetry = 0;
                                    DuLieuTuBo[7] = 0;
                                    DuLieuTuBo[6] = 0;
                                    DuLieuTuBo[8] = 0;
                                    s.SendTo(Data, length + 6, SocketFlags.None, ep);
                                    while ((DuLieuTuBo[7] != 6) && (SoLanRetry < SoLanRetryMaxFirmware))
                                    {
                                        try
                                        {
                                            cnt = s.ReceiveFrom(DuLieuTuBo, ref rm);
                                            if (DuLieuTuBo[6] == 4)
                                            {
                                                DuLieuTuBo[6] = 1;
                                            }
                                        }
                                        catch
                                        {
                                            s.SendTo(Data, length + 6, SocketFlags.None, ep);


                                        }
                                        if (DuLieuTuBo[8] == 255)
                                        {
                                            s.SendTo(Data, length + 6, SocketFlags.None, ep);

                                        }

                                        SoLanRetry++;
                                    }

                                    if ((DuLieuTuBo[7] != 6))
                                    {
                                        if (DuLieuTuBo[8] == 9) 
                                            listReport.Add("Error: " + IP + "/" + ID + " Lower Firmware"); //MessageBox.Show("Lower Firmware");
                                        else
                                        {
                                            if ((DuLieuTuBo[6] == 1) && (DuLieuTuBo[8] == 255)) listReport.Add("Error: " + IP + "/" + ID + " Data transfer is corrupted");   //MessageBox.Show("Data transfer is corrupted");
                                            else if ((DuLieuTuBo[6] == 1) && (DuLieuTuBo[8] != 7)) listReport.Add("Error: " + IP + "/" + ID + " Data transfer error code:" + DuLieuTuBo[8].ToString());  //MessageBox.Show("Data transfer error code:" + DuLieuTuBo[8].ToString());
                                            else if ((DuLieuTuBo[6] == 1) && (DuLieuTuBo[8] == 7)) listReport.Add("Error: " + IP + "/" + ID + " Absent Unit");   //MessageBox.Show("Absent Unit");
                                        }
                                        if (DuLieuTuBo[6] != 1)
                                        {
                                            listReport.Add("Error: Can't connect to IP: " + IP + "/" + ID); //MessageBox.Show("Can't connect to unit IP: " + grBoardNetwork.Rows[grBoardNetwork.CurrentCell.RowIndex].Cells[3].Value.ToString(), "Error");
                                        }
                                        rd.Close();
                                        s.Close();
                                        if (count >= cntSelectUnit)
                                        {
                                            Khoanut(true);
                                            Report report = new Report(listReport);
                                            report.ShowDialog();
                                            btn_Scan_Click(null, null);
                                            return;
                                        }
                                        break;
                                    }
                                    else
                                    {
                                        percent = percent + (Convert.ToDouble(dem) + 1) * 100 / SoDong;
                                        if (percent < 100) prBar_Update.Value = Convert.ToInt16(percent);
                                        else prBar_Update.Value = 100;
                                        lb_percent.Text = prBar_Update.Value.ToString() + "%";
                                        Application.DoEvents();
                                    }
                                }
                                rd.Close();
                                if (input != null)
                                    continue;
                                prBar_Update.Value = 100;
                                lb_percent.Text = "100%";
                                //send firwmare's CRC
                                posdata = 8;
                                length = 4;
                                SumCRC = 0;
                                Data[posdata] = (byte)(fwCRC);
                                SumCRC = SumCRC + Data[posdata];
                                posdata++;
                                Data[posdata] = (byte)(fwCRC / 256);
                                SumCRC = SumCRC + Data[posdata];
                                posdata++;
                                length = length + 2;
                                Data[5] = (byte)(length / 256);
                                Data[4] = (byte)(length - Data[5] * 256);
                                for (int i = 4; i < 8; i++)
                                    SumCRC = SumCRC + Data[i];
                                Data[posdata] = (byte)(SumCRC);
                                Data[posdata + 1] = (byte)(SumCRC / 256);
                                
                                SoLanRetry = 0;
                                DuLieuTuBo[7] = 0;
                                DuLieuTuBo[6] = 0;
                                DuLieuTuBo[8] = 0;
                                s.SendTo(Data, length + 6, SocketFlags.None, ep);
                                while ((DuLieuTuBo[7] != 6) && (DuLieuTuBo[7] != 134) && (SoLanRetry < 2)) 
                                {
                                    try
                                    {
                                        cnt = s.ReceiveFrom(DuLieuTuBo, ref rm);
                                        if (DuLieuTuBo[6] == 4)
                                        {
                                            DuLieuTuBo[6] = 1;
                                        }
                                    }
                                    catch
                                    {
                                        s.SendTo(Data, length + 6, SocketFlags.None, ep);

                                    }
                                    if (DuLieuTuBo[8] == 255)
                                    {
                                        s.SendTo(Data, length + 6, SocketFlags.None, ep);
                                    }

                                    SoLanRetry++;
                                }
                                
                                if ((DuLieuTuBo[7] == 134))   //update firmware failed
                                {
                                    if (DuLieuTuBo[8] == Convert.ToByte(Command.command_status.HEX_FILE_CRC))
                                    {
                                        listReport.Add("Error: " + IP + "/" + ID + " Hex File is corrupted");
                                        s.Close();
                                        if (count >= cntSelectUnit)
                                        {
                                            Khoanut(true);
                                            Report report = new Report(listReport);
                                            report.ShowDialog();
                                            btn_Scan_Click(null, null);
                                            return;
                                        }
                                        continue;
                                    }
                                }
                                
                                label4.Text = "Updating firmware. Please wait a few more seconds...";
                                Application.DoEvents();

                                //Request Unit

                                Data[4] = 4;
                                Data[5] = 0;

                                Data[6] = 1;
                                Data[7] = 1;

                                SumCRC = 0;

                                for (int i = 4; i < Data[4] + 4; i++)
                                    SumCRC = SumCRC + Data[i];

                                Data[9] = (byte)(SumCRC / 256);
                                Data[8] = (byte)(SumCRC - Data[9] * 256);

                                DuLieuTuBo[4] = 0;
                                int SoLanRequest = 0;
                                while ((DuLieuTuBo[4] < 10) && (SoLanRequest < 10))
                                {
                                    s.SendTo(Data, Data[4] + 6, SocketFlags.None, ep);

                                    try
                                    {
                                        cnt = s.ReceiveFrom(DuLieuTuBo, ref rm);

                                    }
                                    catch { SoLanRequest++; };

                                }
                                s.Close();
                                if (SoLanRequest < 10)
                                {
                                    if (SoLanRequest < 3)    //slave
                                    {
                                        Thread.Sleep(8000);
                                    }
                                    if (cntSelectUnit <= 1)
                                        MessageBox.Show("Update Firmware Successfully!!!", "Success");
                                    else
                                        listReport.Add(IP + "/" + ID + " Update Firmware successfully");
                                    if (count >= cntSelectUnit)
                                    {
                                        Khoanut(true);
                                        if (cntSelectUnit > 1)
                                        {
                                            Report report = new Report(listReport);
                                            report.ShowDialog();
                                        }
                                        btn_Scan_Click(null, null);
                                        return;
                                    }
                                }
                                else
                                {
                                    if (count >= cntSelectUnit)
                                    {
                                        Khoanut(true);
                                        listReport.Add("Error: Can't connect to Unit IP:" + IP + "/" + ID);
                                        Report report = new Report(listReport);
                                        report.ShowDialog();
                                        btn_Scan_Click(null, null);
                                        return;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        private void GetSLIO(string board_name, ref int SLin, ref int SL_Out_Light, ref int SL_Out_AC, ref Form CfgUnit)
        {
            if (board_name == "Room Logic Controller")
            {
                CfgUnit = new Input_RLC();
                ((Input_RLC)CfgUnit).Initialize(this);
                ((Input_RLC)CfgUnit).Text = "Config I/O RLC on Network";
            }
            else if (board_name == "Bedside-17T")
            {
                CfgUnit = new Input_Bedside();
                ((Input_Bedside)CfgUnit).Initialize(this);
                ((Input_Bedside)CfgUnit).Text = "Config Input Bedside-17T on Network";
            }
            else if (board_name == "Bedside-12T")
            {
                CfgUnit = new Input_Bedside_12T();
                ((Input_Bedside_12T)CfgUnit).Initialize(this);
                ((Input_Bedside_12T)CfgUnit).Text = "Config Input Bedside-12T on Network";
            }
            else if (board_name == "BSP_R14_OL")
            {
                CfgUnit = new Input_BSP_R14_OL();
                ((Input_BSP_R14_OL)CfgUnit).Text = "Config Input BSP_R14_OL on Network";
                ((Input_BSP_R14_OL)CfgUnit).Initialize(this);
            }
            else if (board_name == "RLC-I20")
            {
                CfgUnit = new Input_RLC_new_20_ports();
                ((Input_RLC_new_20_ports)CfgUnit).Text = "Config I/O RLC-I20 on Network";
                ((Input_RLC_new_20_ports)CfgUnit).Initialize(this);
            }
            else if (board_name == "RLC-I16")
            {
                CfgUnit = new Input_RLC_new();
                ((Input_RLC_new)CfgUnit).Text = "Config I/O RLC-I16 on Network";
                ((Input_RLC_new)CfgUnit).Initialize(this);
            }
            else if (board_name == "RCU-32AO")
            {
                CfgUnit = new Input_RCU_32AO();
                ((Input_RCU_32AO)CfgUnit).Text = "Config I/O RCU-32AO on Network";
                ((Input_RCU_32AO)CfgUnit).Initialize(this);
            }
            else if (board_name == "RCU-8RL-24AO")
            {
                CfgUnit = new Input_RCU_8RL_24AO();
                ((Input_RCU_8RL_24AO)CfgUnit).Text = "Config I/O RCU-8RL-24AO on Network";
                ((Input_RCU_8RL_24AO)CfgUnit).Initialize(this);
            }
            else if (board_name == "RCU-16RL-16AO")
            {
                CfgUnit = new Input_RCU_16RL_16AO();
                ((Input_RCU_16RL_16AO)CfgUnit).Text = "Config I/O RCU-16RL-16AO on Network";
                ((Input_RCU_16RL_16AO)CfgUnit).Initialize(this);
            }
            else if (board_name == "RCU-24RL-8AO")
            {
                CfgUnit = new Input_RCU_24RL_8AO();
                ((Input_RCU_24RL_8AO)CfgUnit).Text = "Config I/O RCU-24RL-8AO on Network";
                ((Input_RCU_24RL_8AO)CfgUnit).Initialize(this);
            }
            else if (board_name == "RCU-11IN-4RL")
            {
                CfgUnit = new Input_RCU_11IN_4RL();
                ((Input_RCU_11IN_4RL)CfgUnit).Text = "Config I/O RCU-11IN-4RL on Network";
                ((Input_RCU_11IN_4RL)CfgUnit).Initialize(this);
            }
            else if (board_name == "RCU-21IN-8RL")
            {
                CfgUnit = new Input_RCU_21IN_8RL();
                ((Input_RCU_21IN_8RL)CfgUnit).Text = "Config I/O RCU-21IN-8RL on Network";
                ((Input_RCU_21IN_8RL)CfgUnit).Initialize(this);
            }
            else if (board_name == "RCU-21IN-8RL-K")
            {
                CfgUnit = new Input_RCU_21IN_8RL_K();
                ((Input_RCU_21IN_8RL_K)CfgUnit).Text = "Config I/O RCU-21IN-8RL-K on Network";
                ((Input_RCU_21IN_8RL_K)CfgUnit).Initialize(this);
            }
            else if (board_name == "RCU-21IN-10RL")
            {
                CfgUnit = new Input_RCU_21IN_10RL();
                ((Input_RCU_21IN_10RL)CfgUnit).Text = "Config I/O RCU-21IN-10RL on Network";
                ((Input_RCU_21IN_10RL)CfgUnit).Initialize(this);
            }
            else if (board_name == "RCU-21IN-10RL-T")
            {
                CfgUnit = new Input_RCU_21IN_10RL_T();
                ((Input_RCU_21IN_10RL_T)CfgUnit).Text = "Config I/O RCU-21IN-10RL on Network";
                ((Input_RCU_21IN_10RL_T)CfgUnit).Initialize(this);
            }
            else if (board_name == "RCU-30IN-10RL")
            {
                CfgUnit = new Input_RCU_30IN_10RL();
                ((Input_RCU_30IN_10RL)CfgUnit).Text = "Config I/O RCU-30IN-10RL on Network";
                ((Input_RCU_30IN_10RL)CfgUnit).Initialize(this);
            }
            else if (board_name == "RCU-48IN-16RL")
            {
                CfgUnit = new Input_RCU_48IN_16RL();
                ((Input_RCU_48IN_16RL)CfgUnit).Text = "Config I/O RCU-48IN-16RL on Network";
                ((Input_RCU_48IN_16RL)CfgUnit).Initialize(this);
            }
            else if (board_name == "RCU-48IN-16RL_4AO")
            {
                CfgUnit = new Input_RCU_48IN_16RL_4AO();
                ((Input_RCU_48IN_16RL_4AO)CfgUnit).Text = "Config I/O RCU-48IN-16RL-4AO on Network";
                ((Input_RCU_48IN_16RL_4AO)CfgUnit).Initialize(this);
            }
            else if (board_name == "GNT-EXT-6RL")   //old name: RCU-6RL
            {
                CfgUnit = new Input_GNT_EXT_6RL();
                ((Input_GNT_EXT_6RL)CfgUnit).Text = "Config Output GNT-EXT-6RL on Network";   //old name: RCU-6RL
                ((Input_GNT_EXT_6RL)CfgUnit).Initialize(this);
            }
            else if (board_name == "GNT-EXT-8RL")   //old name: RCU-8RL
            {
                CfgUnit = new Input_GNT_EXT_8RL();
                ((Input_GNT_EXT_8RL)CfgUnit).Text = "Config Output GNT-EXT-8RL on Network";    //old name: RCU-8RL
                ((Input_GNT_EXT_8RL)CfgUnit).Initialize(this);
            }
            else if (board_name == "GNT-EXT-12RL")
            {
                CfgUnit = new Input_GNT_EXT_12RL();
                ((Input_GNT_EXT_12RL)CfgUnit).Text = "Config Output GNT-EXT-12RL on Network";
                ((Input_GNT_EXT_12RL)CfgUnit).Initialize(this);
            }
            else if (board_name == "GNT-EXT-20RL")
            {
                CfgUnit = new Input_GNT_EXT_20RL();
                ((Input_GNT_EXT_20RL)CfgUnit).Text = "Config Output GNT-EXT-20RL on Network";
                ((Input_GNT_EXT_20RL)CfgUnit).Initialize(this);
            }
            else if (board_name == "GNT-EXT-10AO")  //old name: RCU-10AO
            {
                CfgUnit = new Input_GNT_EXT_10AO();
                ((Input_GNT_EXT_10AO)CfgUnit).Text = "Config Output GNT-EXT-10AO on Network";  //old name: RCU-10AO
                ((Input_GNT_EXT_10AO)CfgUnit).Initialize(this);
            }
            else if (board_name == "GNT-EXT-28AO")
            {
                CfgUnit = new Input_GNT_EXT_28AO();
                ((Input_GNT_EXT_28AO)CfgUnit).Text = "Config Output GNT-EXT-28AO on Network";
                ((Input_GNT_EXT_28AO)CfgUnit).Initialize(this);
            }
            else if (board_name == "GNT-EXT-12RL-12AO")
            {
                CfgUnit = new Input_GNT_EXT_12RL_12AO();
                ((Input_GNT_EXT_12RL_12AO)CfgUnit).Text = "Config GNT-EXT-12RL-12AO on Network";
                ((Input_GNT_EXT_12RL_12AO)CfgUnit).Initialize(this);
            }
            else if (board_name == "GNT-EXT-24IN")
            {
                CfgUnit = new Input_GNT_EXT_24IN();
                ((Input_GNT_EXT_24IN)CfgUnit).Text = "Config Output GNT-EXT-24IN on Network";
                ((Input_GNT_EXT_24IN)CfgUnit).Initialize(this);
            }
            else if (board_name == "GNT-EXT-48IN")
            {
                CfgUnit = new Input_GNT_EXT_48IN_T();
                ((Input_GNT_EXT_48IN_T)CfgUnit).Text = "Config Output GNT-EXT-48IN on Network";
                ((Input_GNT_EXT_48IN_T)CfgUnit).Initialize(this);
            }
            else if (board_name == "GNT-ETH2SKDL")
            {
                CfgUnit = new Input_GNT_ETH_2KDL();
                ((Input_GNT_ETH_2KDL)CfgUnit).Text = "Config Output GNT-ETH2SKDL on Network";
                ((Input_GNT_ETH_2KDL)CfgUnit).Initialize(this);
            }
            SL_Out_Light = Light_Out_Info2.Length;
            SL_Out_AC = AC_Out_Configs.Length;
            SLin = InputNetwork.Length;
        }

        private void LoadConfig(string filePath, int SLin, int SL_Light_Out, int SL_AC_Out)
        {
            StreamReader rd = File.OpenText(filePath);
            string input = null;
            string BasicInfo = rd.ReadLine();

            int dem = -1;
            int op = -1;
            RLCFormRelay_DelayOn = new int[SL_Light_Out];
            RLCFormRelay_DelayOff = new int[SL_Light_Out];
            Light_Out_Info2 = new Light_Out_Cfg.output_info2_t[SL_Light_Out];
            while ((input = rd.ReadLine()) != null)
            {
                if (input.Contains("RS485") == true)
                {
                    //Do nothing as we loaded the RS485 config before.                    
                }
                else
                {
                    dem++;
                    if (dem < SLin)
                    {
                        InputNetwork[dem].Input = Convert.ToInt16(Substring(',', 0, input));
                        InputNetwork[dem].Function = Convert.ToInt16(Substring(',', 1, input));
                        InputNetwork[dem].Ramp = Convert.ToInt16(Substring(',', 2, input));
                        InputNetwork[dem].Preset = Convert.ToInt16(Substring(',', 3, input));
                        InputNetwork[dem].Led_Status = Convert.ToInt16(Substring(',', 4, input));
                        InputNetwork[dem].Auto_Mode = Convert.ToInt16(Substring(',', 5, input));
                        InputNetwork[dem].Auto_Time = Convert.ToInt16(Substring(',', 6, input));
                        InputNetwork[dem].DelayOff = Convert.ToInt16(Substring(',', 7, input));
                        InputNetwork[dem].DelayOn = Convert.ToInt16(Substring(',', 8, input));
                        InputNetwork[dem].NumGroup = Convert.ToInt16(Substring(',', 9, input));
                        InputNetwork[dem].Group = new int[InputNetwork[dem].NumGroup];
                        InputNetwork[dem].Preset_Group = new byte[InputNetwork[dem].NumGroup];
                        int cnt = 0;
                        for (int dem1 = 0; dem1 < InputNetwork[dem].NumGroup; dem1++)
                        {
                            InputNetwork[dem].Group[dem1] = Convert.ToInt16(Substring(',', 10 + cnt, input));
                            InputNetwork[dem].Preset_Group[dem1] = Convert.ToByte(Substring(',', 11 + cnt, input));
                            cnt = cnt + 2;
                        }
                    }
                    else
                    {

                        op++;

                        int data_size = input.Split(',').Length;

                        if (data_size > 0)
                        {
                            OutputNetwork[op] = Convert.ToByte(Substring(',', 0, input));

                            if (op < SL_Light_Out) // Lighting output config
                            {
                                data_size--;
                                // Delay on and off
                                if (data_size >= 2)
                                {
                                    RLCFormRelay_DelayOn[op] = Convert.ToInt32(Substring(',', 1, input));
                                    RLCFormRelay_DelayOff[op] = Convert.ToInt32(Substring(',', 2, input));
                                    data_size -= 2;
                                }
                                else
                                {
                                    RLCFormRelay_DelayOn[op] = 0;
                                    RLCFormRelay_DelayOff[op] = 0;
                                    data_size = 0;
                                }

                                // Output info 2
                                UInt16 size = Convert.ToUInt16(Marshal.SizeOf(Light_Out_Info2[op]));
                                Byte[] array = new Byte[size];

                                // Load data from file
                                if (data_size >= size)
                                {
                                    for (int i = 3; i < 3 + size; i++)
                                    {
                                        array[i - 3] = Convert.ToByte(Substring(',', i, input));
                                    }
                                }

                                Light_Out_Info2[op] = transfer_cmd.convert_byte_arr_to_light_out_cfg(array, 0);
                            }
                            else // Air Conditioner ouput config
                            {
                                FieldInfo[] fields = AC_Out_Configs[0].GetType().GetFields();
                                int idx = 0;
                                foreach (var xInfo in fields)
                                {
                                    UInt32 val;
                                    try
                                    {
                                        val = Convert.ToUInt32(Substring(',', idx++, input));
                                    }
                                    catch
                                    {
                                        break;
                                    }
                                    if (xInfo.FieldType.Name == "Byte")
                                    {
                                        try
                                        {
                                            xInfo.SetValueDirect(__makeref(AC_Out_Configs[op - SL_Light_Out]), Convert.ToByte(val));
                                        }
                                        catch
                                        {

                                        }
                                    }
                                    else if (xInfo.FieldType.Name == "Int16")
                                    {
                                        try
                                        {
                                            xInfo.SetValueDirect(__makeref(AC_Out_Configs[op - SL_Light_Out]), Convert.ToInt16(val));

                                        }
                                        catch
                                        {

                                        }
                                    }
                                    else
                                    {
                                        try
                                        {
                                            xInfo.SetValueDirect(__makeref(AC_Out_Configs[op - SL_Light_Out]), (val));

                                        }
                                        catch
                                        {

                                        }
                                    }
                                }
                            }
                        }
                    }

                }
            }
            rd.Close();
        }

        public void SaveConfigNetwork(string IP, string ID, int SLin, int SL_Out_AC, int SL_Out_Light)
        {
            IPEndPoint ep = new IPEndPoint(IPAddress.Parse(IP), UDPPort);
            Socket s = new Socket(AddressFamily.InterNetwork, SocketType.Dgram, ProtocolType.Udp);
            s.ReceiveTimeout = 5000;
            int cnt;
            byte[] DuLieuTuBo;
            DuLieuTuBo = new byte[1024];
            int length = 4;

            try
            {
                Byte[] Data;    //<Address><length><CMD><Data><CRC> 
                Data = new Byte[1024];
                int SumCRC = 0;

                Data[0] = Convert.ToByte(Substring('.', 3, ID));
                Data[1] = Convert.ToByte(Substring('.', 2, ID));
                Data[2] = Convert.ToByte(Substring('.', 1, ID));
                Data[3] = Convert.ToByte(Substring('.', 0, ID));

                Data[6] = 10;
                Data[7] = 0;

                int pos;
                int SL = 1;
                int inp = 0;

                while (inp < SLin)
                {
                    pos = 8;
                    length = 4;
                    SumCRC = 0;
                    if (SLin - inp < SL) SL = SLin - inp;
                    for (int j = 0; j < SL; j++)
                    {
                        inp++;
                        Data[pos] = Convert.ToByte(InputNetwork[inp - 1].Input);
                        Data[pos + 1] = Convert.ToByte(InputNetwork[inp - 1].Function);
                        Data[pos + 2] = (byte)InputNetwork[inp - 1].Ramp;
                        Data[pos + 3] = (byte)InputNetwork[inp - 1].Preset;
                        Data[pos + 4] = (byte)InputNetwork[inp - 1].Led_Status;
                        Data[pos + 5] = (byte)InputNetwork[inp - 1].Auto_Mode;
                        for (int i = pos + 6; i <= pos + 33; i++)
                            Data[i] = (byte)InputNetwork[inp - 1].Auto_Time;       //pos+6->pos+33

                        Data[pos + 35] = (byte)(InputNetwork[inp - 1].DelayOff / 256);
                        Data[pos + 34] = (byte)(InputNetwork[inp - 1].DelayOff - Data[pos + 35] * 256);

                        Data[pos + 37] = (byte)(InputNetwork[inp - 1].DelayOn / 256);
                        Data[pos + 36] = (byte)(InputNetwork[inp - 1].DelayOn - Data[pos + 37] * 256);

                        Data[pos + 38] = (byte)InputNetwork[inp - 1].NumGroup;
                        pos = pos + 39;

                        for (int i = 0; i < InputNetwork[inp - 1].NumGroup; i++)
                        {
                            Data[pos] = (byte)InputNetwork[inp - 1].Group[i];
                            Data[pos + 1] = InputNetwork[inp - 1].Preset_Group[i];
                            pos = pos + 2;
                        }
                    }
                    length = length + pos - 8;
                    Data[5] = (byte)(length / 256);
                    Data[4] = (byte)(length - Data[5] * 256);   // Address:4 ;Length=2 byte; CMD:2, Data:0, CRC:2

                    for (int i = 4; i < length + 4; i++)
                        SumCRC = SumCRC + Data[i];

                    Data[pos + 1] = (byte)(SumCRC / 256);
                    Data[pos] = (byte)(SumCRC - Data[pos + 1] * 256);

                    s.SendTo(Data, length + 6, SocketFlags.None, ep);
                    cnt = s.ReceiveFrom(DuLieuTuBo, ref rm);
                }

                if (SL_Out_Light > 0)
                {
                    Data[6] = 10;
                    Data[7] = 20;           //assisgn out to group

                    pos = 8;
                    SumCRC = 0;
                    length = 4;
                    for (byte i = 0; i < SL_Out_Light; i++)
                    {
                        Data[pos] = i;
                        Data[pos + 1] = OutputNetwork[i];
                        pos = pos + 2;
                    }

                    length = length + pos - 8;

                    Data[5] = (byte)(length / 256);
                    Data[4] = (byte)(length - Data[5] * 256);   // Address:4 ;Length=2 byte; CMD:2, Data:0, CRC:2

                    for (int i = 4; i < length + 4; i++)
                        SumCRC = SumCRC + Data[i];

                    Data[pos + 1] = (byte)(SumCRC / 256);
                    Data[pos] = (byte)(SumCRC - Data[pos + 1] * 256);

                    s.SendTo(Data, length + 6, SocketFlags.None, ep);
                    cnt = s.ReceiveFrom(DuLieuTuBo, ref rm);


                    //Relay_Delay_off

                    Data[6] = 10;
                    Data[7] = 32;           //Relay delay off

                    pos = 8;
                    SumCRC = 0;
                    length = 4;
                    for (byte i = 0; i < SL_Out_Light; i++)
                    {
                        Data[pos] = i;
                        Data[pos + 2] = (byte)(RLCFormRelay_DelayOff[i] / 256);
                        Data[pos + 1] = (byte)(RLCFormRelay_DelayOff[i] - Data[pos + 2] * 256);
                        pos = pos + 3;
                    }

                    length = length + pos - 8;

                    Data[5] = (byte)(length / 256);
                    Data[4] = (byte)(length - Data[5] * 256);   // Address:4 ;Length=2 byte; CMD:2, Data:0, CRC:2

                    for (int i = 4; i < length + 4; i++)
                        SumCRC = SumCRC + Data[i];

                    Data[pos + 1] = (byte)(SumCRC / 256);
                    Data[pos] = (byte)(SumCRC - Data[pos + 1] * 256);

                    s.SendTo(Data, length + 6, SocketFlags.None, ep);
                    cnt = s.ReceiveFrom(DuLieuTuBo, ref rm);


                    //Relay_Delay_on


                    Data[6] = 10;
                    Data[7] = 33;           //Relay delay on

                    pos = 8;
                    SumCRC = 0;
                    length = 4;
                    for (byte i = 0; i < SL_Out_Light; i++)
                    {
                        Data[pos] = i;
                        Data[pos + 2] = (byte)(RLCFormRelay_DelayOn[i] / 256);
                        Data[pos + 1] = (byte)(RLCFormRelay_DelayOn[i] - Data[pos + 2] * 256);
                        pos = pos + 3;
                    }

                    length = length + pos - 8;

                    Data[5] = (byte)(length / 256);
                    Data[4] = (byte)(length - Data[5] * 256);   // Address:4 ;Length=2 byte; CMD:2, Data:0, CRC:2

                    for (int i = 4; i < length + 4; i++)
                        SumCRC = SumCRC + Data[i];

                    Data[pos + 1] = (byte)(SumCRC / 256);
                    Data[pos] = (byte)(SumCRC - Data[pos + 1] * 256);

                    s.SendTo(Data, length + 6, SocketFlags.None, ep);
                    cnt = s.ReceiveFrom(DuLieuTuBo, ref rm);

                    s.Close();

                    // Send lighting output config 2                        
                    transfer_cmd.set_output_info2(IP, ID, Light_Out_Info2);
                }

                if (SL_Out_AC > 0)
                {
                    transfer_cmd.set_output_local_ac(IP, ID, AC_Out_Configs);
                }

                s.Close();
                grBoardNetwork.Rows.Clear();
                btn_Scan_Click(null, null);
            }
            catch
            {
                s.Close();
                MessageBox.Show("Can't connect to unit IP : " + IP, "Network Error");
            }

        }

        private void btn_transferToNet_Click(object sender, EventArgs e)
        {
            string IP, ID;
            bool failFlag = false;
            int i, unitCnt;
            int cntSelectUnit = 0;
            int checkUnit = 0;
            List<string> listReport = new List<string>();
            int index = grBoardNetwork.CurrentCell.RowIndex;
            int indexDatabase = gr_Unit.CurrentCell.RowIndex;

            string filePath = treeView1.SelectedNode.FullPath + "\\" + gr_Unit.Rows[indexDatabase].Cells[2].Value.ToString() + "&" + gr_Unit.Rows[indexDatabase].Cells[3].Value.ToString();
            for (unitCnt = 0; unitCnt < grBoardNetwork.RowCount; unitCnt++)
            {
                if (grBoardNetwork.Rows[unitCnt].Cells[0].FormattedValue.ToString() == "True")
                {
                    cntSelectUnit++;
                    checkUnit++;
                }
            }
            for (unitCnt = 0; unitCnt < grBoardNetwork.RowCount; unitCnt++)
            {
                if ((grBoardNetwork.Rows[unitCnt].Cells[0].FormattedValue.ToString() == "True") || (unitCnt == index) && (checkUnit == 0))
                {
                    IP = grBoardNetwork[3, unitCnt].Value.ToString();
                    ID = grBoardNetwork[4, unitCnt].Value.ToString();
                    if (grBoardNetwork[2, unitCnt].Value.ToString() != gr_Unit[1, indexDatabase].Value.ToString()) //modified by Hoai An
                    {
                        listReport.Add("Error: " + IP + "/" + ID + " Different board type");// MessageBox.Show("Different board type. Please choose another one!!!", "Error");
                        if (unitCnt >= grBoardNetwork.RowCount - 1)
                        {
                            Report report = new Report(listReport);
                            report.ShowDialog();
                            listReport.Clear();
                            //return;
                        }
                        //else
                        continue;
                    }
                    for (i = 0; i < grBoardNetwork.Rows.Count; i++)
                    {
                        if (i == unitCnt) continue;
                        string newID;
                        newID = grBoardNetwork[4, unitCnt].Value.ToString();
                        newID = Substring('.', 0, newID) + '.' + Substring('.', 1, newID) + '.' + Substring('.', 2, newID) + '.' + Substring('.', 3, gr_Unit[3, indexDatabase].Value.ToString());
                        //if ((grBoardNetwork[3, i].Value.ToString() == gr_Unit[2, indexDatabase].Value.ToString()) && (grBoardNetwork[4, i].Value.ToString() == gr_Unit[3, indexDatabase].Value.ToString()))
                        if ((grBoardNetwork[3, i].Value.ToString() == grBoardNetwork[3, unitCnt].Value.ToString()) && (grBoardNetwork[4, i].Value.ToString() == newID)) //IP will not be able to sync with unit in ntework
                        {
                            listReport.Add("Error: " + IP + "/" + ID + " The IP and ID of device has been in network. Please try another one!!!"); //duplicate;
                            if (unitCnt >= grBoardNetwork.RowCount - 1)
                            {
                                Report report = new Report(listReport);
                                report.ShowDialog();
                                listReport.Clear();
                                //return;
                            }
                            //else
                            break;
                        }
                    }
                    if (i < grBoardNetwork.Rows.Count)
                        continue;
                    for (i = 0; i < grBoardNetwork.RowCount; i++)
                    {
                        if (i == unitCnt) continue;
                        if ((grBoardNetwork.Rows[i].Cells[0].FormattedValue.ToString() == "True") || (i == index))
                        {
                            if (grBoardNetwork[3, i].Value.ToString() == grBoardNetwork[3, unitCnt].Value.ToString())
                            {
                                listReport.Add("Error: Unit " + IP + "/" + ID + " Unit " + grBoardNetwork[3, i].Value.ToString() + "/" + grBoardNetwork[4, i].Value.ToString() + " update same database");
                                if (unitCnt >= grBoardNetwork.RowCount - 1)
                                {
                                    Report report = new Report(listReport);
                                    report.ShowDialog();
                                    listReport.Clear();
                                    //return;
                                }
                                //else
                                break;  //atleast 2 units in 1 network need to be updated.
                            }
                        }
                    }
                    if (i < grBoardNetwork.Rows.Count)
                        continue;
                    if (gr_Unit[4, indexDatabase].Value.ToString() == "Master")
                    {
                        for (i = 0; i < grBoardNetwork.RowCount; i++)
                        {
                            if (i == unitCnt) continue;
                            if ((grBoardNetwork[3, i].Value.ToString() == grBoardNetwork[3, unitCnt].Value.ToString()) && (grBoardNetwork[5, i].Value.ToString() == "Master"))
                            {
                                listReport.Add("Error: " + IP + "/" + ID + " Exist 1 master in CAN network");
                                if (unitCnt >= grBoardNetwork.RowCount - 1)
                                {
                                    Report report = new Report(listReport);
                                    report.ShowDialog();
                                    listReport.Clear();
                                    //return;
                                }
                                //else
                                break;  //atleast 2 units in 1 network need to be updated.
                            }
                        }
                        if (i < grBoardNetwork.Rows.Count)
                            continue;
                    }
                    Form CfgUnit = new Input_RLC();
                    int SLin = 0, Sl_Light_Out = 0, SL_AC_Out = 0;
                    string board_name = gr_Unit[0, indexDatabase].Value.ToString();
                    GetSLIO(board_name, ref SLin, ref Sl_Light_Out, ref SL_AC_Out, ref CfgUnit);

                    InputNetwork = new IOProperty[SLin];
                    OutputNetwork = new byte[Sl_Light_Out + SL_AC_Out];
                    Load_RS485_from_file(filePath);
                    LoadConfig(filePath, SLin, Sl_Light_Out, SL_AC_Out);
                    string oldIP = grBoardNetwork[3, unitCnt].Value.ToString(); ;
                    string oldID = grBoardNetwork[4, unitCnt].Value.ToString();

                    //string IP = gr_Unit[2, indexDatabase].Value.ToString();
                    // Discard the IP of database, still use the IP of the board.

                    string Act_Mode = gr_Unit[4, indexDatabase].Value.ToString();
                    string oldAct_Mode = grBoardNetwork[5, unitCnt].Value.ToString();

                    ConfigUnit.Ip_Layer_Mask_High = Substring('.', 0, IP);
                    ConfigUnit.Ip_Layer_Mask_Low = Substring('.', 1, IP);

                    ConfigUnit.IP = Substring('.', 2, IP) + "." + Substring('.', 3, IP);

                    int dem = 0;
                    ConfigUnit.IDCan = "";
                    for (i = 0; i < oldID.Length; i++)
                    {
                        if (oldID[i] == '.') dem++;
                        ConfigUnit.IDCan = ConfigUnit.IDCan + oldID[i];
                        if (dem == 3) break;
                    }

                    ConfigUnit.IDCan = ConfigUnit.IDCan + Substring('.', 3, gr_Unit[3, indexDatabase].Value.ToString());

                    if (Act_Mode == "Master") ConfigUnit.kind = 2;
                    else if (Act_Mode == "Slave") ConfigUnit.kind = 1;
                    else ConfigUnit.kind = 0;

                    if (oldAct_Mode == "Master") oldActMode = 2;
                    else if (oldAct_Mode == "Slave") oldActMode = 1;
                    else oldActMode = 0;

                    ConfigUnit.LoadCan = Convert.ToBoolean(gr_Unit[5, indexDatabase].Value.ToString());
                    ConfigUnit.Recovery = Convert.ToBoolean(gr_Unit[9, indexDatabase].Value.ToString());
                    transNet = true;
                    ConfigUnit.hw_change = true;

                    //if (EditNetwork(oldIP, oldID)) //modified by Hoai An
                    // Send the RS485 config first
                    transfer_cmd.set_rs485_config(oldIP, oldID, RS485_Cfg);

                    IPEndPoint ep = new IPEndPoint(IPAddress.Parse(oldIP), UDPPort);
                    Socket s = new Socket(AddressFamily.InterNetwork, SocketType.Dgram, ProtocolType.Udp);
                    s.ReceiveTimeout = 5000;
                    int cnt;
                    byte[] DuLieuTuBo;
                    DuLieuTuBo = new byte[1024];
                    try
                    {
                        Byte[] Data;    //<Address><length><CMD><Data><CRC> 
                        Data = new Byte[1024];
                        int SumCRC = 0;

                        Data[0] = Convert.ToByte(Substring('.', 3, oldID));
                        Data[1] = Convert.ToByte(Substring('.', 2, oldID));
                        Data[2] = Convert.ToByte(Substring('.', 1, oldID));
                        Data[3] = Convert.ToByte(Substring('.', 0, oldID));

                        Data[4] = 5;   // Address:4 ;Length=2 byte; CMD:2, Data:0, CRC:2
                        Data[5] = 0;
                        if (ConfigUnit.kind != oldActMode)
                        {

                            //Change Actmode
                            SumCRC = 0;
                            Data[6] = 1;
                            Data[7] = 11;

                            Data[8] = Convert.ToByte(ConfigUnit.kind);

                            for (i = 4; i < Data[4] + 4; i++)
                                SumCRC = SumCRC + Data[i];

                            Data[10] = (byte)(SumCRC / 256);
                            Data[9] = (byte)(SumCRC - Data[10] * 256);

                            s.SendTo(Data, Data[4] + 6, SocketFlags.None, ep);
                            cnt = s.ReceiveFrom(DuLieuTuBo, ref rm);
                        }
                        //Change Hardware Enable
                        SumCRC = 0;

                        Data[6] = 1;
                        Data[7] = 12;
                        int Hardware_enable = ConfigUnit.kind | (Convert.ToByte(ConfigUnit.LoadCan) << 2) | (Convert.ToByte(ConfigUnit.Recovery) << 6);
                        Data[8] = Convert.ToByte(Hardware_enable);

                        for (i = 4; i < Data[4] + 4; i++)
                            SumCRC = SumCRC + Data[i];

                        Data[10] = (byte)(SumCRC / 256);
                        Data[9] = (byte)(SumCRC - Data[10] * 256);

                        if (ConfigUnit.hw_change)
                        {
                            s.SendTo(Data, Data[4] + 6, SocketFlags.None, ep);
                            cnt = s.ReceiveFrom(DuLieuTuBo, ref rm);
                        }
                        //Change ID
                        if (oldID != ConfigUnit.IDCan)
                        {
                            SumCRC = 0;
                            Data[6] = 1;
                            Data[7] = 8;

                            Data[8] = Convert.ToByte(Substring('.', 3, ConfigUnit.IDCan));

                            for (i = 4; i < Data[4] + 4; i++)
                                SumCRC = SumCRC + Data[i];

                            Data[10] = (byte)(SumCRC / 256);
                            Data[9] = (byte)(SumCRC - Data[10] * 256);

                            s.SendTo(Data, Data[4] + 6, SocketFlags.None, ep);
                            cnt = s.ReceiveFrom(DuLieuTuBo, ref rm);
                        }
                        //Chang IP
                        if (oldIP != (ConfigUnit.Ip_Layer_Mask_High + "." + ConfigUnit.Ip_Layer_Mask_Low + "." + ConfigUnit.IP))
                        {
                            Thread.Sleep(1000);
                            SumCRC = 0;

                            if (string.Compare(ConfigUnit.Fw_ver, "2.0.0") <= 0)
                            {
                                Data[0] = Convert.ToByte(Substring('.', 3, ConfigUnit.IDCan));
                                Data[1] = Convert.ToByte(Substring('.', 2, ConfigUnit.IDCan));
                                Data[2] = Convert.ToByte(Substring('.', 1, ConfigUnit.IDCan));
                                Data[3] = Convert.ToByte(Substring('.', 0, ConfigUnit.IDCan));

                                Data[4] = 8;   // Address:4 ;Length=2 byte; CMD:2, Data:0, CRC:2
                                Data[5] = 0;

                                Data[6] = 1;
                                Data[7] = 7;

                                Data[8] = Convert.ToByte(ConfigUnit.Ip_Layer_Mask_High);
                                Data[9] = Convert.ToByte(ConfigUnit.Ip_Layer_Mask_Low);
                                Data[10] = Convert.ToByte(Substring('.', 0, ConfigUnit.IP));
                                Data[11] = Convert.ToByte(Substring('.', 1, ConfigUnit.IP));

                                for (i = 4; i < Data[4] + 4; i++)
                                    SumCRC = SumCRC + Data[i];

                                Data[13] = (byte)(SumCRC / 256);
                                Data[12] = (byte)(SumCRC - Data[13] * 256);

                                s.SendTo(Data, Data[4] + 6, SocketFlags.None, ep);
                                cnt = s.ReceiveFrom(DuLieuTuBo, ref rm);

                                s.Close();
                                //Request Unit

                                ep = new IPEndPoint(IPAddress.Parse(ConfigUnit.Ip_Layer_Mask_High + "." + ConfigUnit.Ip_Layer_Mask_Low + "." + ConfigUnit.IP), UDPPort);
                                s = new Socket(AddressFamily.InterNetwork, SocketType.Dgram, ProtocolType.Udp);
                                s.ReceiveTimeout = 10000;

                                Data[4] = 4;
                                Data[5] = 0;

                                Data[6] = 1;
                                Data[7] = 1;

                                SumCRC = 0;

                                for (i = 4; i < Data[4] + 4; i++)
                                    SumCRC = SumCRC + Data[i];

                                Data[9] = (byte)(SumCRC / 256);
                                Data[8] = (byte)(SumCRC - Data[9] * 256);

                                DuLieuTuBo[4] = 0;

                                int reconnect_retry = 0;
                                while (DuLieuTuBo[4] < 10)
                                {
                                    s.SendTo(Data, Data[4] + 6, SocketFlags.None, ep);
                                    try
                                    {
                                        cnt = s.ReceiveFrom(DuLieuTuBo, ref rm);
                                    }
                                    catch
                                    {
                                        reconnect_retry++;
                                        if (reconnect_retry > 3)
                                        {
                                            s.Close();
                                            listReport.Add("Can't connect to unit IP :" + ConfigUnit.Ip_Layer_Mask_High + "." + ConfigUnit.Ip_Layer_Mask_Low + "." + ConfigUnit.IP);
                                            if (unitCnt >= grBoardNetwork.RowCount - 1)
                                            {
                                                Report report = new Report(listReport);
                                                report.ShowDialog();
                                                listReport.Clear();
                                                //return;
                                            }
                                            //else
                                            //{
                                            failFlag = true;
                                            break;
                                            //}
                                        }
                                    }
                                }
                                s.Close();
                                if (failFlag)
                                {
                                    failFlag = false;
                                    continue;
                                }
                            }
                            else
                            {
                                s.Close();

                                Data[0] = Convert.ToByte(Substring('.', 3, ConfigUnit.IDCan));
                                Data[1] = Convert.ToByte(Substring('.', 2, ConfigUnit.IDCan));
                                Data[2] = Convert.ToByte(Substring('.', 1, ConfigUnit.IDCan));
                                Data[3] = Convert.ToByte(Substring('.', 0, ConfigUnit.IDCan));

                                Data[4] = 12;   // Address:4 ;Length=2 byte; CMD:2, Data:0, CRC:2
                                Data[5] = 0;

                                Data[6] = 1;
                                Data[7] = 7;

                                // New IP
                                Data[8] = Convert.ToByte(ConfigUnit.Ip_Layer_Mask_High);
                                Data[9] = Convert.ToByte(ConfigUnit.Ip_Layer_Mask_Low);
                                Data[10] = Convert.ToByte(Substring('.', 0, ConfigUnit.IP));
                                Data[11] = Convert.ToByte(Substring('.', 1, ConfigUnit.IP));

                                // Old IP
                                Data[12] = Convert.ToByte(Substring('.', 0, oldIP));
                                Data[13] = Convert.ToByte(Substring('.', 1, oldIP));
                                Data[14] = Convert.ToByte(Substring('.', 2, oldIP));
                                Data[15] = Convert.ToByte(Substring('.', 3, oldIP));

                                for (i = 4; i < Data[4] + 4; i++)
                                    SumCRC = SumCRC + Data[i];

                                Data[17] = (byte)(SumCRC / 256);
                                Data[16] = (byte)(SumCRC - Data[13] * 256);


                                // Send
                                UdpClient client = new UdpClient(LocalUDPPort, AddressFamily.InterNetwork);
                                IPEndPoint groupEp = new IPEndPoint(IPAddress.Broadcast, UDPPort);
                                client.Connect(groupEp);

                                client.Send(Data, Data[4] + 6);
                                client.Close();


                                // Received
                                IPEndPoint rm = new IPEndPoint(IPAddress.Any, 0);
                                UdpClient udpResponse = new UdpClient(LocalUDPPort);
                                udpResponse.Client.ReceiveTimeout = 1000;

                                try
                                {
                                    DuLieuTuBo = udpResponse.Receive(ref rm);
                                }
                                catch { }

                                udpResponse.Close();



                                //Request Unit                       

                                Data[4] = 4;
                                Data[5] = 0;

                                Data[6] = 1;
                                Data[7] = 1;

                                SumCRC = 0;

                                for (i = 4; i < Data[4] + 4; i++)
                                    SumCRC = SumCRC + Data[i];

                                Data[9] = (byte)(SumCRC / 256);
                                Data[8] = (byte)(SumCRC - Data[9] * 256);

                                DuLieuTuBo[4] = 0;

                                int reconnect_retry = 0;
                                while (DuLieuTuBo[4] < 10)
                                {
                                    client = new UdpClient(LocalUDPPort, AddressFamily.InterNetwork);
                                    client.Connect(groupEp);

                                    client.Send(Data, Data[4] + 6);
                                    client.Close();

                                    try
                                    {
                                        rm = new IPEndPoint(IPAddress.Any, 0);
                                        udpResponse = new UdpClient(LocalUDPPort);
                                        udpResponse.Client.ReceiveTimeout = 10000;

                                        DuLieuTuBo = udpResponse.Receive(ref rm);

                                        udpResponse.Close();
                                    }
                                    catch
                                    {
                                        reconnect_retry++;
                                        udpResponse.Close();
                                        if (reconnect_retry > 3)
                                        {
                                            //MessageBox.Show("Can't connect to unit IP :" + ConfigUnit.Ip_Layer_Mask_High + "." + ConfigUnit.Ip_Layer_Mask_Low + "." + ConfigUnit.IP, "Network Error");
                                            listReport.Add("Can't connect to unit IP :" + ConfigUnit.Ip_Layer_Mask_High + "." + ConfigUnit.Ip_Layer_Mask_Low + "." + ConfigUnit.IP);
                                            if (unitCnt >= grBoardNetwork.RowCount - 1)
                                            {
                                                Report report = new Report(listReport);
                                                report.ShowDialog();
                                                listReport.Clear();
                                                //return;
                                            }
                                            //else
                                            //{
                                            failFlag = true;
                                            break;
                                            //}
                                        }
                                    }
                                }
                                if (failFlag)
                                {
                                    failFlag = false;
                                    continue;
                                }
                            }
                        }

                        s.Close();
                        //grBoardNetwork.Rows.Clear();
                        //if (transNet == false) btn_Scan_Click(null, null);
                        //transNet = false;
                        //return true;
                    }

                    catch
                    {
                        s.Close();
                        //MessageBox.Show("Can't connect to unit IP :" + oldIP, "Network Error");
                        listReport.Add("Can't connect to unit IP :" + oldIP);
                        if (unitCnt >= grBoardNetwork.RowCount - 1)
                        {
                            Report report = new Report(listReport);
                            report.ShowDialog();
                            listReport.Clear();
                            //return;
                        }
                        //else
                        {
                            continue;
                        }
                    }
                    {
                        //SaveConfigNetwork(IP, ConfigUnit.IDCan, SLin, SL_AC_Out, Sl_Light_Out);
                        ep = new IPEndPoint(IPAddress.Parse(IP), UDPPort);
                        s = new Socket(AddressFamily.InterNetwork, SocketType.Dgram, ProtocolType.Udp);
                        s.ReceiveTimeout = 5000;
                        //int cnt;
                        //byte[] DuLieuTuBo;
                        //DuLieuTuBo = new byte[1024];
                        int length = 4;

                        try
                        {
                            Byte[] Data;    //<Address><length><CMD><Data><CRC> 
                            Data = new Byte[1024];
                            int SumCRC = 0;

                            Data[0] = Convert.ToByte(Substring('.', 3, ID));
                            Data[1] = Convert.ToByte(Substring('.', 2, ID));
                            Data[2] = Convert.ToByte(Substring('.', 1, ID));
                            Data[3] = Convert.ToByte(Substring('.', 0, ID));

                            Data[6] = 10;
                            Data[7] = 0;

                            int pos;
                            int SL = 1;
                            int inp = 0;

                            while (inp < SLin)
                            {
                                pos = 8;
                                length = 4;
                                SumCRC = 0;
                                if (SLin - inp < SL) SL = SLin - inp;
                                for (int j = 0; j < SL; j++)
                                {
                                    inp++;
                                    Data[pos] = Convert.ToByte(InputNetwork[inp - 1].Input);
                                    Data[pos + 1] = Convert.ToByte(InputNetwork[inp - 1].Function);
                                    Data[pos + 2] = (byte)InputNetwork[inp - 1].Ramp;
                                    Data[pos + 3] = (byte)InputNetwork[inp - 1].Preset;
                                    Data[pos + 4] = (byte)InputNetwork[inp - 1].Led_Status;
                                    Data[pos + 5] = (byte)InputNetwork[inp - 1].Auto_Mode;
                                    for (i = pos + 6; i <= pos + 33; i++)
                                        Data[i] = (byte)InputNetwork[inp - 1].Auto_Time;       //pos+6->pos+33

                                    Data[pos + 35] = (byte)(InputNetwork[inp - 1].DelayOff / 256);
                                    Data[pos + 34] = (byte)(InputNetwork[inp - 1].DelayOff - Data[pos + 35] * 256);

                                    Data[pos + 37] = (byte)(InputNetwork[inp - 1].DelayOn / 256);
                                    Data[pos + 36] = (byte)(InputNetwork[inp - 1].DelayOn - Data[pos + 37] * 256);

                                    Data[pos + 38] = (byte)InputNetwork[inp - 1].NumGroup;
                                    pos = pos + 39;

                                    for (i = 0; i < InputNetwork[inp - 1].NumGroup; i++)
                                    {
                                        Data[pos] = (byte)InputNetwork[inp - 1].Group[i];
                                        Data[pos + 1] = InputNetwork[inp - 1].Preset_Group[i];
                                        pos = pos + 2;
                                    }
                                }
                                length = length + pos - 8;
                                Data[5] = (byte)(length / 256);
                                Data[4] = (byte)(length - Data[5] * 256);   // Address:4 ;Length=2 byte; CMD:2, Data:0, CRC:2

                                for (i = 4; i < length + 4; i++)
                                    SumCRC = SumCRC + Data[i];

                                Data[pos + 1] = (byte)(SumCRC / 256);
                                Data[pos] = (byte)(SumCRC - Data[pos + 1] * 256);

                                s.SendTo(Data, length + 6, SocketFlags.None, ep);
                                cnt = s.ReceiveFrom(DuLieuTuBo, ref rm);
                            }

                            if (Sl_Light_Out > 0)
                            {
                                Data[6] = 10;
                                Data[7] = 20;           //assisgn out to group

                                pos = 8;
                                SumCRC = 0;
                                length = 4;
                                for (i = 0; i < Sl_Light_Out; i++)
                                {
                                    Data[pos] = Convert.ToByte(i);
                                    Data[pos + 1] = OutputNetwork[i];
                                    pos = pos + 2;
                                }

                                length = length + pos - 8;

                                Data[5] = (byte)(length / 256);
                                Data[4] = (byte)(length - Data[5] * 256);   // Address:4 ;Length=2 byte; CMD:2, Data:0, CRC:2

                                for (i = 4; i < length + 4; i++)
                                    SumCRC = SumCRC + Data[i];

                                Data[pos + 1] = (byte)(SumCRC / 256);
                                Data[pos] = (byte)(SumCRC - Data[pos + 1] * 256);

                                s.SendTo(Data, length + 6, SocketFlags.None, ep);
                                cnt = s.ReceiveFrom(DuLieuTuBo, ref rm);


                                //Relay_Delay_off

                                Data[6] = 10;
                                Data[7] = 32;           //Relay delay off

                                pos = 8;
                                SumCRC = 0;
                                length = 4;
                                for (i = 0; i < Sl_Light_Out; i++)
                                {
                                    Data[pos] = Convert.ToByte(i);
                                    Data[pos + 2] = (byte)(RLCFormRelay_DelayOff[i] / 256);
                                    Data[pos + 1] = (byte)(RLCFormRelay_DelayOff[i] - Data[pos + 2] * 256);
                                    pos = pos + 3;
                                }

                                length = length + pos - 8;

                                Data[5] = (byte)(length / 256);
                                Data[4] = (byte)(length - Data[5] * 256);   // Address:4 ;Length=2 byte; CMD:2, Data:0, CRC:2

                                for (i = 4; i < length + 4; i++)
                                    SumCRC = SumCRC + Data[i];

                                Data[pos + 1] = (byte)(SumCRC / 256);
                                Data[pos] = (byte)(SumCRC - Data[pos + 1] * 256);

                                s.SendTo(Data, length + 6, SocketFlags.None, ep);
                                cnt = s.ReceiveFrom(DuLieuTuBo, ref rm);


                                //Relay_Delay_on


                                Data[6] = 10;
                                Data[7] = 33;           //Relay delay on

                                pos = 8;
                                SumCRC = 0;
                                length = 4;
                                for (i = 0; i < Sl_Light_Out; i++)
                                {
                                    Data[pos] = Convert.ToByte(i);
                                    Data[pos + 2] = (byte)(RLCFormRelay_DelayOn[i] / 256);
                                    Data[pos + 1] = (byte)(RLCFormRelay_DelayOn[i] - Data[pos + 2] * 256);
                                    pos = pos + 3;
                                }

                                length = length + pos - 8;

                                Data[5] = (byte)(length / 256);
                                Data[4] = (byte)(length - Data[5] * 256);   // Address:4 ;Length=2 byte; CMD:2, Data:0, CRC:2

                                for (i = 4; i < length + 4; i++)
                                    SumCRC = SumCRC + Data[i];

                                Data[pos + 1] = (byte)(SumCRC / 256);
                                Data[pos] = (byte)(SumCRC - Data[pos + 1] * 256);

                                s.SendTo(Data, length + 6, SocketFlags.None, ep);
                                cnt = s.ReceiveFrom(DuLieuTuBo, ref rm);

                                s.Close();

                                // Send lighting output config 2                        
                                transfer_cmd.set_output_info2(IP, ID, Light_Out_Info2);
                            }

                            if (SL_AC_Out > 0)
                            {
                                transfer_cmd.set_output_local_ac(IP, ID, AC_Out_Configs);
                            }

                            s.Close();
                            //if (unitCnt >= grBoardNetwork.RowCount - 1)
                            //{
                            //    grBoardNetwork.Rows.Clear();
                            //    btn_Scan_Click(null, null);
                            //}

                        }
                        catch
                        {
                            s.Close();
                            //MessageBox.Show("Can't connect to unit IP : " + IP, "Network Error");
                            listReport.Add("Error: Can't connect to unit IP : " + IP + "/" + ID);
                            if (unitCnt >= grBoardNetwork.RowCount - 1)
                            {
                                Report report = new Report(listReport);
                                report.ShowDialog();
                                listReport.Clear();
                                //return;
                            }
                        }
                    }
                }
            }
            if (grBoardNetwork.RowCount > 0)
            {
                if (listReport.Count > 0)
                {
                    Report report = new Report(listReport);
                    report.ShowDialog();
                }
                grBoardNetwork.Rows.Clear();
                btn_Scan_Click(null, null);
            }
            /*
            if (grBoardNetwork[1, index].Value.ToString() != gr_Unit[0, indexDatabase].Value.ToString())
            {
                MessageBox.Show("Different board type. Please choose another one!!!", "Error");
                return;
            }
            for (int i = 0; i < grBoardNetwork.Rows.Count; i++)
            {
                if (i == index) continue;
                if ((grBoardNetwork[3, i].Value.ToString() == gr_Unit[2, indexDatabase].Value.ToString()) && (grBoardNetwork[4, i].Value.ToString() == gr_Unit[3, indexDatabase].Value.ToString()))
                {
                    MessageBox.Show("The IP and ID of device has been in network. Please try another one!!!", "Error");
                    return;
                }
            }

            if ((grBoardNetwork[3, index].Value.ToString() != gr_Unit[2, indexDatabase].Value.ToString()) || ((grBoardNetwork[5, index].Value.ToString() != gr_Unit[4, indexDatabase].Value.ToString()) && (grBoardNetwork[5, index].Value.ToString() != "Slave")))
            {
                for (int i = 0; i < grBoardNetwork.Rows.Count; i++)
                    if ((grBoardNetwork[3, i].Value.ToString() == gr_Unit[2, indexDatabase].Value.ToString()) && (i != index))
                    {
                        MessageBox.Show("There is IP conflict. Please choose another one!!!", "IP Conflict");
                        return;
                    }
            }
            Form CfgUnit = new Input_RLC();            
            int SLin = 0, Sl_Light_Out = 0, SL_AC_Out = 0;
            string board_name = gr_Unit[0, indexDatabase].Value.ToString();
            GetSLIO(board_name, ref SLin, ref Sl_Light_Out, ref SL_AC_Out, ref CfgUnit);             

            InputNetwork = new IOProperty[SLin];
            OutputNetwork = new byte[Sl_Light_Out + SL_AC_Out];
            Load_RS485_from_file(filePath);
            LoadConfig(filePath, SLin, Sl_Light_Out, SL_AC_Out);
            string oldIP = grBoardNetwork[3, index].Value.ToString(); ;
            string oldID = grBoardNetwork[4, index].Value.ToString();

            //string IP = gr_Unit[2, indexDatabase].Value.ToString();
            // Discard the IP of database, still use the IP of the board.
          
            string Act_Mode = gr_Unit[4, indexDatabase].Value.ToString();
            string oldAct_Mode = grBoardNetwork[5, index].Value.ToString();

            ConfigUnit.Ip_Layer_Mask_High = Substring('.', 0, IP);
            ConfigUnit.Ip_Layer_Mask_Low = Substring('.', 1, IP);

            ConfigUnit.IP = Substring('.', 2, IP) + "." + Substring('.', 3, IP);

            int dem = 0;
            ConfigUnit.IDCan = "";
            for (int i = 0; i < oldID.Length; i++)
            {
                if (oldID[i] == '.') dem++;
                ConfigUnit.IDCan = ConfigUnit.IDCan + oldID[i];
                if (dem == 3) break;
            }

            ConfigUnit.IDCan = ConfigUnit.IDCan + Substring('.', 3, gr_Unit[3, indexDatabase].Value.ToString());

            if (Act_Mode == "Master") ConfigUnit.kind = 2;
            else if (Act_Mode == "Slave") ConfigUnit.kind = 1;
            else ConfigUnit.kind = 0;

            if (oldAct_Mode == "Master") oldActMode = 2;
            else if (oldAct_Mode == "Slave") oldActMode = 1;
            else oldActMode = 0;

            ConfigUnit.LoadCan = Convert.ToBoolean(gr_Unit[5, indexDatabase].Value.ToString());
            ConfigUnit.Recovery = Convert.ToBoolean(gr_Unit[9, indexDatabase].Value.ToString());
            transNet = true;
            ConfigUnit.hw_change = true;

            if (EditNetwork(oldIP, oldID)) SaveConfigNetwork(IP, ConfigUnit.IDCan, SLin, SL_AC_Out, Sl_Light_Out);
            */
        }

        private void btn_ConfigUnitNetwork_Click(object sender, EventArgs e)
        {
            int index = grBoardNetwork.CurrentCell.RowIndex;
            Group_Path = treeView1.SelectedNode.FullPath;

            try
            {
                string fw_ver = grBoardNetwork.Rows[index].Cells[7].Value.ToString();
                dev_cfg_fw_version = Convert.ToByte(fw_ver.Substring(0, fw_ver.IndexOf(".")));
            }
            catch
            {
                MessageBox.Show("Firmware version is invalid");
                return;
            }
            confignetwork = true;

            Form CfgUnit = new Input_RLC();
            int SLin = 0, Sl_Light_Out = 0, SL_AC_Out = 0;
            string board_name = grBoardNetwork.Rows[index].Cells[1].Value.ToString();
            GetSLIO(board_name, ref SLin, ref Sl_Light_Out, ref SL_AC_Out, ref CfgUnit);

            if (GetIO_Unit(index, SLin, Sl_Light_Out, SL_AC_Out))
            {
                this.Enabled = false;
                CfgUnit.Show();
                CfgUnit.Focus();
            }

        }

        private void toolStripBackup_Click(object sender, EventArgs e)
        {
            string[] folders = Directory.GetDirectories(directoryDatabase);// lay cac folder

            if (folders.Length == 0)
            {
                MessageBox.Show("There is no project to backup", "Backup");
                return;
            }

            Backup form = new Backup();

            foreach (string folder in folders)
            {
                form.gr_project.Rows.Add(true, folder.Substring(8));
            }
            form.Initialize(this);
            form.Show();

            this.Enabled = false;


        }

        private void toolStripRestoreProject_Click(object sender, EventArgs e)
        {

            OpenFileDialog op = new OpenFileDialog();
            op.Filter = "Backup File|*.RLC";
            //op.FileName = "Backup.RLC";
            op.Title = "Open Project";

            if (op.ShowDialog() == DialogResult.OK)
            {
                Backup form = new Backup();
                form.btn_Ok.Text = "Finish";

                ZipFile zip = new ZipFile(op.FileName);
                string s;
                string filePath;

                for (int i = 0; i < zip.Count; i++)
                {
                    s = zip[i].FileName;
                    if (s.IndexOf('/') == s.Length - 1)
                    {
                        form.gr_project.Rows.Add(true, s.Substring(0, s.Length - 1));
                        filePath = directoryDatabase + "\\" + s.Substring(0, s.Length - 1);
                        if (System.IO.Directory.Exists(filePath))
                        {
                            form.btn_Ok.Text = "Next";
                            form.label_annouce.Visible = true;
                        }
                    }

                }
                form.zipPath = op.FileName;
                form.Initialize(this);
                form.Text = "Restore Project";
                form.labelguide.Text = "Please choose projects that you want to restore";
                form.Show();

                this.Enabled = false;
            }

        }

        private void gr_Unit_RowPostPaint(object sender, DataGridViewRowPostPaintEventArgs e)
        {

            if (gr_Unit.Rows[e.RowIndex].Selected)
            {
                using (Pen pen = new Pen(Color.Blue))
                {
                    int penWidth = 1;

                    pen.Width = penWidth;

                    int x = e.RowBounds.Left + (penWidth / 2);
                    int y = e.RowBounds.Top + (penWidth / 2);
                    int width = e.RowBounds.Width + 1 - penWidth;
                    int height = e.RowBounds.Height - penWidth;

                    e.Graphics.DrawRectangle(pen, x, y, width, height);
                }
            }
        }

        private void grBoardNetwork_RowPostPaint(object sender, DataGridViewRowPostPaintEventArgs e)
        {
            if (grBoardNetwork.Rows[e.RowIndex].Selected)
            {
                using (Pen pen = new Pen(Color.Blue))
                {
                    int penWidth = 1;

                    pen.Width = penWidth;

                    int x = e.RowBounds.Left + (penWidth / 2);
                    int y = e.RowBounds.Top + (penWidth / 2);
                    int width = e.RowBounds.Width + 1 - penWidth;
                    int height = e.RowBounds.Height - penWidth;

                    e.Graphics.DrawRectangle(pen, x, y, width, height);
                }
            }
        }


        private void RLC1_FormClosing(object sender, FormClosingEventArgs e)
        {
            if (btn_Scan.Enabled == false)
            {
                e.Cancel = true;
                return;
            }
        }

        private void gr_Group_RowPostPaint(object sender, DataGridViewRowPostPaintEventArgs e)
        {
            if (gr_Group.Rows[e.RowIndex].Selected)
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

        /** FOR ADMIN APP **/
        private void setupToolStripMenuItem_Click(object sender, EventArgs e)
        {
            try
            {
                int index = grBoardNetwork.CurrentCell.RowIndex;
                ConfigUnit.IDCan = grBoardNetwork[4, index].Value.ToString();
                ConfigUnit.Barcode = grBoardNetwork[2, index].Value.ToString();
                ConfigUnit.IP = Substring('.', 2, grBoardNetwork[3, index].Value.ToString()) + "." + Substring('.', 3, grBoardNetwork[3, index].Value.ToString());
                ConfigUnit.Ip_Layer_Mask_High = Substring('.', 0, grBoardNetwork[3, index].Value.ToString());
                ConfigUnit.Ip_Layer_Mask_Low = Substring('.', 1, grBoardNetwork[3, index].Value.ToString());

                ConfigUnit.Manu_Date = grBoardNetwork[10, index].Value.ToString();

                Tool_Setup ToolSetup = new Tool_Setup();
                ToolSetup.Initialize(this);
                this.Enabled = false;
                ToolSetup.Show();
                ToolSetup.Focus();
            }
            catch
            {
            }
        }

        private void DataGridView_CellClick(object sender, DataGridViewCellEventArgs e)
        {
            int index = grBoardNetwork.CurrentCell.RowIndex;
            if (e.ColumnIndex == 0)
            {
                grBoardNetwork.CurrentCell.Value = grBoardNetwork.CurrentCell.FormattedValue.ToString() == "True" ? false : true;
                //grBoardNetwork.RefreshEdit();
            }
        }

        private void grBoardNetwork_SortCompare(object sender, DataGridViewSortCompareEventArgs e)
        {
            if (e.Column.Index == 3)
            {
                e.Handled = true;
                e.SortResult = IPAddressComparison(e.CellValue1.ToString(), e.CellValue2.ToString());
            }
        }

        private int IPAddressComparison(string IP1, string IP2)
        {
            int IP1_value = 0;
            int IP2_value = 0;

            for (int i = 0; i < 3; i++)
            {
                IP1_value = IP1_value * 10 + Convert.ToByte(IP1.Substring(0, IP1.IndexOf(".")));
                IP1 = IP1.Substring(IP1.IndexOf(".") + 1);

                IP2_value = IP2_value * 10 + Convert.ToByte(IP2.Substring(0, IP2.IndexOf(".")));
                IP2 = IP2.Substring(IP2.IndexOf(".") + 1);
            }
            IP1_value = IP1_value * 10 + Convert.ToByte(IP1);
            IP2_value = IP2_value * 10 + Convert.ToByte(IP2);

            return IP1_value.CompareTo(IP2_value);
        }

        private void panel_firmware_Paint(object sender, PaintEventArgs e)
        {

        }
    }
}
