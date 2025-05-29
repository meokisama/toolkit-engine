namespace RLC
{
    partial class ConfigIO_RCU_9IN_4RL
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.components = new System.ComponentModel.Container();
            this.lst_AvaiGroup = new System.Windows.Forms.ListBox();
            this.labelControl3 = new DevExpress.XtraEditors.LabelControl();
            this.btn_Edit_Group = new System.Windows.Forms.Button();
            this.btn_Add_Group = new System.Windows.Forms.Button();
            this.panel_Mul_Group = new System.Windows.Forms.Panel();
            this.btn_Add_InactiveGroup = new System.Windows.Forms.Button();
            this.btn_AddMul_InactiveGroup = new System.Windows.Forms.Button();
            this.btn_Clr_ActiveGroup = new System.Windows.Forms.Button();
            this.btn_ClrMul_ActiveGroup = new System.Windows.Forms.Button();
            this.btn_Clr_InactiveGroup = new System.Windows.Forms.Button();
            this.btn_ClrMul_InactiveGroup = new System.Windows.Forms.Button();
            this.btn_Add_ActiveGroup = new System.Windows.Forms.Button();
            this.toggle_percent_inactiveGroup = new System.Windows.Forms.CheckBox();
            this.toggle_percent_activeGroup = new System.Windows.Forms.CheckBox();
            this.labelControl10 = new DevExpress.XtraEditors.LabelControl();
            this.gr_InactiveGroup = new System.Windows.Forms.DataGridView();
            this.dataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.dataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.btn_AddMul_ActiveGroup = new System.Windows.Forms.Button();
            this.labelControl9 = new DevExpress.XtraEditors.LabelControl();
            this.gr_ActiveGroup = new System.Windows.Forms.DataGridView();
            this.Group = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.Preset = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.panel1 = new System.Windows.Forms.Panel();
            this.labelControl8 = new DevExpress.XtraEditors.LabelControl();
            this.cbx_sec = new System.Windows.Forms.ComboBox();
            this.labelControl7 = new DevExpress.XtraEditors.LabelControl();
            this.cbx_min = new System.Windows.Forms.ComboBox();
            this.labelControl6 = new DevExpress.XtraEditors.LabelControl();
            this.cbx_hour = new System.Windows.Forms.ComboBox();
            this.labelControl5 = new DevExpress.XtraEditors.LabelControl();
            this.checkBox3 = new System.Windows.Forms.CheckBox();
            this.chk_Backlight = new System.Windows.Forms.CheckBox();
            this.chk_Nightlight = new System.Windows.Forms.CheckBox();
            this.panel2 = new System.Windows.Forms.Panel();
            this.rbtn_2colors = new System.Windows.Forms.RadioButton();
            this.rbtn_OFF = new System.Windows.Forms.RadioButton();
            this.rbtn_ON_OFF = new System.Windows.Forms.RadioButton();
            this.rbtn_ON = new System.Windows.Forms.RadioButton();
            this.labelControl4 = new DevExpress.XtraEditors.LabelControl();
            this.lbl_percent = new DevExpress.XtraEditors.LabelControl();
            this.tbar_Preset = new System.Windows.Forms.TrackBar();
            this.labelControl2 = new DevExpress.XtraEditors.LabelControl();
            this.cbx_Ramp = new System.Windows.Forms.ComboBox();
            this.labelControl1 = new DevExpress.XtraEditors.LabelControl();
            this.btn_Ok = new System.Windows.Forms.Button();
            this.btn_Cancel = new System.Windows.Forms.Button();
            this.timer1 = new System.Windows.Forms.Timer(this.components);
            this.panel_Mul_Group.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.gr_InactiveGroup)).BeginInit();
            ((System.ComponentModel.ISupportInitialize)(this.gr_ActiveGroup)).BeginInit();
            this.panel1.SuspendLayout();
            this.panel2.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.tbar_Preset)).BeginInit();
            this.SuspendLayout();
            // 
            // lst_AvaiGroup
            // 
            this.lst_AvaiGroup.FormattingEnabled = true;
            this.lst_AvaiGroup.Location = new System.Drawing.Point(234, 51);
            this.lst_AvaiGroup.Name = "lst_AvaiGroup";
            this.lst_AvaiGroup.Size = new System.Drawing.Size(113, 160);
            this.lst_AvaiGroup.TabIndex = 22;
            this.lst_AvaiGroup.SelectedIndexChanged += new System.EventHandler(this.lst_AvaiGroup_SelectedIndexChanged);
            // 
            // labelControl3
            // 
            this.labelControl3.Location = new System.Drawing.Point(251, 2);
            this.labelControl3.Name = "labelControl3";
            this.labelControl3.Size = new System.Drawing.Size(75, 13);
            this.labelControl3.TabIndex = 23;
            this.labelControl3.Text = "Available Group";
            // 
            // btn_Edit_Group
            // 
            this.btn_Edit_Group.Image = global::RLC.Properties.Resources.edit_16;
            this.btn_Edit_Group.Location = new System.Drawing.Point(295, 24);
            this.btn_Edit_Group.Name = "btn_Edit_Group";
            this.btn_Edit_Group.Size = new System.Drawing.Size(21, 21);
            this.btn_Edit_Group.TabIndex = 25;
            this.btn_Edit_Group.UseVisualStyleBackColor = true;
            this.btn_Edit_Group.Click += new System.EventHandler(this.btn_Edit_Group_Click);
            // 
            // btn_Add_Group
            // 
            this.btn_Add_Group.Image = global::RLC.Properties.Resources.add1;
            this.btn_Add_Group.Location = new System.Drawing.Point(262, 24);
            this.btn_Add_Group.Name = "btn_Add_Group";
            this.btn_Add_Group.Size = new System.Drawing.Size(21, 21);
            this.btn_Add_Group.TabIndex = 24;
            this.btn_Add_Group.UseVisualStyleBackColor = true;
            this.btn_Add_Group.Click += new System.EventHandler(this.btn_Add_Group_Click);
            // 
            // panel_Mul_Group
            // 
            this.panel_Mul_Group.BackColor = System.Drawing.SystemColors.ActiveCaption;
            this.panel_Mul_Group.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
            this.panel_Mul_Group.Controls.Add(this.btn_Add_InactiveGroup);
            this.panel_Mul_Group.Controls.Add(this.btn_AddMul_InactiveGroup);
            this.panel_Mul_Group.Controls.Add(this.btn_Clr_ActiveGroup);
            this.panel_Mul_Group.Controls.Add(this.btn_ClrMul_ActiveGroup);
            this.panel_Mul_Group.Controls.Add(this.btn_Clr_InactiveGroup);
            this.panel_Mul_Group.Controls.Add(this.btn_ClrMul_InactiveGroup);
            this.panel_Mul_Group.Controls.Add(this.btn_Add_ActiveGroup);
            this.panel_Mul_Group.Controls.Add(this.toggle_percent_inactiveGroup);
            this.panel_Mul_Group.Controls.Add(this.toggle_percent_activeGroup);
            this.panel_Mul_Group.Controls.Add(this.labelControl10);
            this.panel_Mul_Group.Controls.Add(this.gr_InactiveGroup);
            this.panel_Mul_Group.Controls.Add(this.btn_AddMul_ActiveGroup);
            this.panel_Mul_Group.Controls.Add(this.labelControl9);
            this.panel_Mul_Group.Controls.Add(this.gr_ActiveGroup);
            this.panel_Mul_Group.Controls.Add(this.lst_AvaiGroup);
            this.panel_Mul_Group.Controls.Add(this.btn_Edit_Group);
            this.panel_Mul_Group.Controls.Add(this.labelControl3);
            this.panel_Mul_Group.Controls.Add(this.btn_Add_Group);
            this.panel_Mul_Group.Location = new System.Drawing.Point(0, 197);
            this.panel_Mul_Group.Name = "panel_Mul_Group";
            this.panel_Mul_Group.Size = new System.Drawing.Size(592, 228);
            this.panel_Mul_Group.TabIndex = 26;
            // 
            // btn_Add_InactiveGroup
            // 
            this.btn_Add_InactiveGroup.Font = new System.Drawing.Font("Microsoft Sans Serif", 9.75F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btn_Add_InactiveGroup.Location = new System.Drawing.Point(347, 62);
            this.btn_Add_InactiveGroup.Name = "btn_Add_InactiveGroup";
            this.btn_Add_InactiveGroup.Size = new System.Drawing.Size(33, 32);
            this.btn_Add_InactiveGroup.TabIndex = 45;
            this.btn_Add_InactiveGroup.Text = ">";
            this.btn_Add_InactiveGroup.UseVisualStyleBackColor = true;
            this.btn_Add_InactiveGroup.Click += new System.EventHandler(this.btn_Add_InactiveGroup_Click);
            // 
            // btn_AddMul_InactiveGroup
            // 
            this.btn_AddMul_InactiveGroup.Font = new System.Drawing.Font("Microsoft Sans Serif", 9.75F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btn_AddMul_InactiveGroup.Location = new System.Drawing.Point(347, 94);
            this.btn_AddMul_InactiveGroup.Name = "btn_AddMul_InactiveGroup";
            this.btn_AddMul_InactiveGroup.Size = new System.Drawing.Size(33, 32);
            this.btn_AddMul_InactiveGroup.TabIndex = 44;
            this.btn_AddMul_InactiveGroup.Text = ">>";
            this.btn_AddMul_InactiveGroup.UseVisualStyleBackColor = true;
            this.btn_AddMul_InactiveGroup.Click += new System.EventHandler(this.btn_AddMul_InactiveGroup_Click);
            // 
            // btn_Clr_ActiveGroup
            // 
            this.btn_Clr_ActiveGroup.Font = new System.Drawing.Font("Microsoft Sans Serif", 9.75F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btn_Clr_ActiveGroup.Location = new System.Drawing.Point(201, 139);
            this.btn_Clr_ActiveGroup.Name = "btn_Clr_ActiveGroup";
            this.btn_Clr_ActiveGroup.Size = new System.Drawing.Size(33, 32);
            this.btn_Clr_ActiveGroup.TabIndex = 43;
            this.btn_Clr_ActiveGroup.Text = ">";
            this.btn_Clr_ActiveGroup.UseVisualStyleBackColor = true;
            this.btn_Clr_ActiveGroup.Click += new System.EventHandler(this.btn_Clr_ActiveGroup_Click);
            // 
            // btn_ClrMul_ActiveGroup
            // 
            this.btn_ClrMul_ActiveGroup.Font = new System.Drawing.Font("Microsoft Sans Serif", 9.75F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btn_ClrMul_ActiveGroup.Location = new System.Drawing.Point(201, 171);
            this.btn_ClrMul_ActiveGroup.Name = "btn_ClrMul_ActiveGroup";
            this.btn_ClrMul_ActiveGroup.Size = new System.Drawing.Size(33, 32);
            this.btn_ClrMul_ActiveGroup.TabIndex = 42;
            this.btn_ClrMul_ActiveGroup.Text = ">>";
            this.btn_ClrMul_ActiveGroup.UseVisualStyleBackColor = true;
            this.btn_ClrMul_ActiveGroup.Click += new System.EventHandler(this.btn_ClrMul_ActiveGroup_Click);
            // 
            // btn_Clr_InactiveGroup
            // 
            this.btn_Clr_InactiveGroup.Font = new System.Drawing.Font("Microsoft Sans Serif", 9.75F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btn_Clr_InactiveGroup.Location = new System.Drawing.Point(347, 139);
            this.btn_Clr_InactiveGroup.Name = "btn_Clr_InactiveGroup";
            this.btn_Clr_InactiveGroup.Size = new System.Drawing.Size(33, 32);
            this.btn_Clr_InactiveGroup.TabIndex = 41;
            this.btn_Clr_InactiveGroup.Text = "<";
            this.btn_Clr_InactiveGroup.UseVisualStyleBackColor = true;
            this.btn_Clr_InactiveGroup.Click += new System.EventHandler(this.btn_Clr_InactiveGroup_Click);
            // 
            // btn_ClrMul_InactiveGroup
            // 
            this.btn_ClrMul_InactiveGroup.Font = new System.Drawing.Font("Microsoft Sans Serif", 9.75F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btn_ClrMul_InactiveGroup.Location = new System.Drawing.Point(347, 171);
            this.btn_ClrMul_InactiveGroup.Name = "btn_ClrMul_InactiveGroup";
            this.btn_ClrMul_InactiveGroup.Size = new System.Drawing.Size(33, 32);
            this.btn_ClrMul_InactiveGroup.TabIndex = 40;
            this.btn_ClrMul_InactiveGroup.Text = "<<";
            this.btn_ClrMul_InactiveGroup.UseVisualStyleBackColor = true;
            this.btn_ClrMul_InactiveGroup.Click += new System.EventHandler(this.btn_ClrMul_InactiveGroup_Click);
            // 
            // btn_Add_ActiveGroup
            // 
            this.btn_Add_ActiveGroup.Font = new System.Drawing.Font("Microsoft Sans Serif", 9.75F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btn_Add_ActiveGroup.Location = new System.Drawing.Point(201, 62);
            this.btn_Add_ActiveGroup.Name = "btn_Add_ActiveGroup";
            this.btn_Add_ActiveGroup.Size = new System.Drawing.Size(33, 32);
            this.btn_Add_ActiveGroup.TabIndex = 39;
            this.btn_Add_ActiveGroup.Text = "<";
            this.btn_Add_ActiveGroup.UseVisualStyleBackColor = true;
            this.btn_Add_ActiveGroup.Click += new System.EventHandler(this.btn_add_ActiveGroup_Click);
            // 
            // toggle_percent_inactiveGroup
            // 
            this.toggle_percent_inactiveGroup.AutoSize = true;
            this.toggle_percent_inactiveGroup.Location = new System.Drawing.Point(443, 21);
            this.toggle_percent_inactiveGroup.Name = "toggle_percent_inactiveGroup";
            this.toggle_percent_inactiveGroup.Size = new System.Drawing.Size(89, 17);
            this.toggle_percent_inactiveGroup.TabIndex = 38;
            this.toggle_percent_inactiveGroup.Text = "Percent View";
            this.toggle_percent_inactiveGroup.UseVisualStyleBackColor = true;
            this.toggle_percent_inactiveGroup.CheckedChanged += new System.EventHandler(this.toggle_percent_inactiveGroup_CheckedChanged);
            // 
            // toggle_percent_activeGroup
            // 
            this.toggle_percent_activeGroup.AutoSize = true;
            this.toggle_percent_activeGroup.Location = new System.Drawing.Point(58, 21);
            this.toggle_percent_activeGroup.Name = "toggle_percent_activeGroup";
            this.toggle_percent_activeGroup.Size = new System.Drawing.Size(89, 17);
            this.toggle_percent_activeGroup.TabIndex = 27;
            this.toggle_percent_activeGroup.Text = "Percent View";
            this.toggle_percent_activeGroup.UseVisualStyleBackColor = true;
            this.toggle_percent_activeGroup.CheckedChanged += new System.EventHandler(this.toggle_percent_activeGroup_CheckedChanged);
            // 
            // labelControl10
            // 
            this.labelControl10.Location = new System.Drawing.Point(447, 2);
            this.labelControl10.Name = "labelControl10";
            this.labelControl10.Size = new System.Drawing.Size(71, 13);
            this.labelControl10.TabIndex = 33;
            this.labelControl10.Text = "Inactive Group";
            // 
            // gr_InactiveGroup
            // 
            this.gr_InactiveGroup.AllowUserToAddRows = false;
            this.gr_InactiveGroup.AllowUserToDeleteRows = false;
            this.gr_InactiveGroup.BackgroundColor = System.Drawing.SystemColors.ControlLightLight;
            this.gr_InactiveGroup.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            this.gr_InactiveGroup.Columns.AddRange(new System.Windows.Forms.DataGridViewColumn[] {
            this.dataGridViewTextBoxColumn1,
            this.dataGridViewTextBoxColumn2});
            this.gr_InactiveGroup.Location = new System.Drawing.Point(380, 50);
            this.gr_InactiveGroup.Name = "gr_InactiveGroup";
            this.gr_InactiveGroup.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
            this.gr_InactiveGroup.Size = new System.Drawing.Size(200, 161);
            this.gr_InactiveGroup.TabIndex = 32;
            this.gr_InactiveGroup.CellEndEdit += new System.Windows.Forms.DataGridViewCellEventHandler(this.gr_InactiveGroup_CellEndEdit);
            this.gr_InactiveGroup.RowsAdded += new System.Windows.Forms.DataGridViewRowsAddedEventHandler(this.gr_InactiveGroup_RowsAdded);
            this.gr_InactiveGroup.RowsRemoved += new System.Windows.Forms.DataGridViewRowsRemovedEventHandler(this.gr_InactiveGroup_RowsRemoved);
            // 
            // dataGridViewTextBoxColumn1
            // 
            this.dataGridViewTextBoxColumn1.HeaderText = "Group Name";
            this.dataGridViewTextBoxColumn1.Name = "dataGridViewTextBoxColumn1";
            this.dataGridViewTextBoxColumn1.ReadOnly = true;
            this.dataGridViewTextBoxColumn1.Resizable = System.Windows.Forms.DataGridViewTriState.False;
            // 
            // dataGridViewTextBoxColumn2
            // 
            this.dataGridViewTextBoxColumn2.HeaderText = "Preset";
            this.dataGridViewTextBoxColumn2.Name = "dataGridViewTextBoxColumn2";
            this.dataGridViewTextBoxColumn2.Resizable = System.Windows.Forms.DataGridViewTriState.False;
            this.dataGridViewTextBoxColumn2.Width = 40;
            // 
            // btn_AddMul_ActiveGroup
            // 
            this.btn_AddMul_ActiveGroup.Font = new System.Drawing.Font("Microsoft Sans Serif", 9.75F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btn_AddMul_ActiveGroup.Location = new System.Drawing.Point(201, 94);
            this.btn_AddMul_ActiveGroup.Name = "btn_AddMul_ActiveGroup";
            this.btn_AddMul_ActiveGroup.Size = new System.Drawing.Size(33, 32);
            this.btn_AddMul_ActiveGroup.TabIndex = 30;
            this.btn_AddMul_ActiveGroup.Text = "<<";
            this.btn_AddMul_ActiveGroup.UseVisualStyleBackColor = true;
            this.btn_AddMul_ActiveGroup.Click += new System.EventHandler(this.btn_AddMul_ActiveGroup_Click);
            // 
            // labelControl9
            // 
            this.labelControl9.Location = new System.Drawing.Point(67, 2);
            this.labelControl9.Name = "labelControl9";
            this.labelControl9.Size = new System.Drawing.Size(62, 13);
            this.labelControl9.TabIndex = 27;
            this.labelControl9.Text = "Active Group";
            // 
            // gr_ActiveGroup
            // 
            this.gr_ActiveGroup.AllowUserToAddRows = false;
            this.gr_ActiveGroup.AllowUserToDeleteRows = false;
            this.gr_ActiveGroup.BackgroundColor = System.Drawing.SystemColors.ControlLightLight;
            this.gr_ActiveGroup.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            this.gr_ActiveGroup.Columns.AddRange(new System.Windows.Forms.DataGridViewColumn[] {
            this.Group,
            this.Preset});
            this.gr_ActiveGroup.Location = new System.Drawing.Point(1, 50);
            this.gr_ActiveGroup.Name = "gr_ActiveGroup";
            this.gr_ActiveGroup.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
            this.gr_ActiveGroup.Size = new System.Drawing.Size(200, 161);
            this.gr_ActiveGroup.TabIndex = 26;
            this.gr_ActiveGroup.CellEndEdit += new System.Windows.Forms.DataGridViewCellEventHandler(this.gr_ActiveGroup_CellEndEdit);
            this.gr_ActiveGroup.RowsAdded += new System.Windows.Forms.DataGridViewRowsAddedEventHandler(this.gr_ActiveGroup_RowsAdded);
            this.gr_ActiveGroup.RowsRemoved += new System.Windows.Forms.DataGridViewRowsRemovedEventHandler(this.gr_ActiveGroup_RowsRemoved);
            // 
            // Group
            // 
            this.Group.HeaderText = "Group Name";
            this.Group.Name = "Group";
            this.Group.ReadOnly = true;
            this.Group.Resizable = System.Windows.Forms.DataGridViewTriState.False;
            // 
            // Preset
            // 
            this.Preset.HeaderText = "Preset";
            this.Preset.Name = "Preset";
            this.Preset.Resizable = System.Windows.Forms.DataGridViewTriState.False;
            this.Preset.Width = 40;
            // 
            // panel1
            // 
            this.panel1.BackColor = System.Drawing.SystemColors.InactiveBorder;
            this.panel1.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.panel1.Controls.Add(this.labelControl8);
            this.panel1.Controls.Add(this.cbx_sec);
            this.panel1.Controls.Add(this.labelControl7);
            this.panel1.Controls.Add(this.cbx_min);
            this.panel1.Controls.Add(this.labelControl6);
            this.panel1.Controls.Add(this.cbx_hour);
            this.panel1.Controls.Add(this.labelControl5);
            this.panel1.Controls.Add(this.checkBox3);
            this.panel1.Controls.Add(this.chk_Backlight);
            this.panel1.Controls.Add(this.chk_Nightlight);
            this.panel1.Controls.Add(this.panel2);
            this.panel1.Controls.Add(this.labelControl4);
            this.panel1.Controls.Add(this.lbl_percent);
            this.panel1.Controls.Add(this.tbar_Preset);
            this.panel1.Controls.Add(this.labelControl2);
            this.panel1.Controls.Add(this.cbx_Ramp);
            this.panel1.Controls.Add(this.labelControl1);
            this.panel1.Location = new System.Drawing.Point(0, 1);
            this.panel1.Name = "panel1";
            this.panel1.Size = new System.Drawing.Size(592, 194);
            this.panel1.TabIndex = 27;
            this.panel1.Paint += new System.Windows.Forms.PaintEventHandler(this.panel1_Paint);
            // 
            // labelControl8
            // 
            this.labelControl8.Location = new System.Drawing.Point(444, 167);
            this.labelControl8.Name = "labelControl8";
            this.labelControl8.Size = new System.Drawing.Size(21, 13);
            this.labelControl8.TabIndex = 38;
            this.labelControl8.Text = "secs";
            // 
            // cbx_sec
            // 
            this.cbx_sec.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbx_sec.Enabled = false;
            this.cbx_sec.FormattingEnabled = true;
            this.cbx_sec.Items.AddRange(new object[] {
            "0",
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10",
            "11",
            "12",
            "13",
            "14",
            "15",
            "16",
            "17",
            "18",
            "19",
            "20",
            "21",
            "22",
            "23",
            "24",
            "25",
            "26",
            "27",
            "28",
            "29",
            "30",
            "31",
            "32",
            "33",
            "34",
            "35",
            "36",
            "37",
            "38",
            "39",
            "40",
            "41",
            "42",
            "43",
            "44",
            "45",
            "46",
            "47",
            "48",
            "49",
            "50",
            "51",
            "52",
            "53",
            "54",
            "55",
            "56",
            "57",
            "58",
            "59"});
            this.cbx_sec.Location = new System.Drawing.Point(404, 164);
            this.cbx_sec.Name = "cbx_sec";
            this.cbx_sec.Size = new System.Drawing.Size(37, 21);
            this.cbx_sec.TabIndex = 37;
            // 
            // labelControl7
            // 
            this.labelControl7.Location = new System.Drawing.Point(374, 167);
            this.labelControl7.Name = "labelControl7";
            this.labelControl7.Size = new System.Drawing.Size(21, 13);
            this.labelControl7.TabIndex = 36;
            this.labelControl7.Text = "mins";
            // 
            // cbx_min
            // 
            this.cbx_min.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbx_min.Enabled = false;
            this.cbx_min.FormattingEnabled = true;
            this.cbx_min.Items.AddRange(new object[] {
            "0",
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10",
            "11",
            "12",
            "13",
            "14",
            "15",
            "16",
            "17",
            "18"});
            this.cbx_min.Location = new System.Drawing.Point(333, 164);
            this.cbx_min.Name = "cbx_min";
            this.cbx_min.Size = new System.Drawing.Size(37, 21);
            this.cbx_min.TabIndex = 35;
            this.cbx_min.SelectedIndexChanged += new System.EventHandler(this.cbx_min_SelectedIndexChanged);
            // 
            // labelControl6
            // 
            this.labelControl6.Location = new System.Drawing.Point(298, 167);
            this.labelControl6.Name = "labelControl6";
            this.labelControl6.Size = new System.Drawing.Size(27, 13);
            this.labelControl6.TabIndex = 34;
            this.labelControl6.Text = "hours";
            // 
            // cbx_hour
            // 
            this.cbx_hour.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbx_hour.Enabled = false;
            this.cbx_hour.FormattingEnabled = true;
            this.cbx_hour.Items.AddRange(new object[] {
            "0",
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10",
            "11",
            "12",
            "13",
            "14",
            "15",
            "16",
            "17",
            "18"});
            this.cbx_hour.Location = new System.Drawing.Point(258, 164);
            this.cbx_hour.Name = "cbx_hour";
            this.cbx_hour.Size = new System.Drawing.Size(37, 21);
            this.cbx_hour.TabIndex = 33;
            this.cbx_hour.SelectedIndexChanged += new System.EventHandler(this.cbx_hour_SelectedIndexChanged);
            // 
            // labelControl5
            // 
            this.labelControl5.Location = new System.Drawing.Point(150, 167);
            this.labelControl5.Name = "labelControl5";
            this.labelControl5.Size = new System.Drawing.Size(100, 13);
            this.labelControl5.TabIndex = 32;
            this.labelControl5.Text = "Delay off (Time out):";
            // 
            // checkBox3
            // 
            this.checkBox3.AutoSize = true;
            this.checkBox3.Enabled = false;
            this.checkBox3.Location = new System.Drawing.Point(359, 128);
            this.checkBox3.Name = "checkBox3";
            this.checkBox3.Size = new System.Drawing.Size(78, 17);
            this.checkBox3.TabIndex = 31;
            this.checkBox3.Text = "Auto Mode";
            this.checkBox3.UseVisualStyleBackColor = true;
            // 
            // chk_Backlight
            // 
            this.chk_Backlight.AutoSize = true;
            this.chk_Backlight.Enabled = false;
            this.chk_Backlight.Location = new System.Drawing.Point(260, 128);
            this.chk_Backlight.Name = "chk_Backlight";
            this.chk_Backlight.Size = new System.Drawing.Size(74, 17);
            this.chk_Backlight.TabIndex = 30;
            this.chk_Backlight.Text = "BackLight";
            this.chk_Backlight.UseVisualStyleBackColor = true;
            // 
            // chk_Nightlight
            // 
            this.chk_Nightlight.AutoSize = true;
            this.chk_Nightlight.Location = new System.Drawing.Point(163, 129);
            this.chk_Nightlight.Name = "chk_Nightlight";
            this.chk_Nightlight.Size = new System.Drawing.Size(74, 17);
            this.chk_Nightlight.TabIndex = 29;
            this.chk_Nightlight.Text = "NightLight";
            this.chk_Nightlight.UseVisualStyleBackColor = true;
            // 
            // panel2
            // 
            this.panel2.BackColor = System.Drawing.Color.Transparent;
            this.panel2.BackgroundImageLayout = System.Windows.Forms.ImageLayout.None;
            this.panel2.Controls.Add(this.rbtn_2colors);
            this.panel2.Controls.Add(this.rbtn_OFF);
            this.panel2.Controls.Add(this.rbtn_ON_OFF);
            this.panel2.Controls.Add(this.rbtn_ON);
            this.panel2.Location = new System.Drawing.Point(212, 74);
            this.panel2.Name = "panel2";
            this.panel2.Size = new System.Drawing.Size(253, 37);
            this.panel2.TabIndex = 28;
            // 
            // rbtn_2colors
            // 
            this.rbtn_2colors.AutoSize = true;
            this.rbtn_2colors.Enabled = false;
            this.rbtn_2colors.Location = new System.Drawing.Point(169, 9);
            this.rbtn_2colors.Name = "rbtn_2colors";
            this.rbtn_2colors.Size = new System.Drawing.Size(69, 17);
            this.rbtn_2colors.TabIndex = 11;
            this.rbtn_2colors.Text = "2 - Colors";
            this.rbtn_2colors.UseVisualStyleBackColor = true;
            // 
            // rbtn_OFF
            // 
            this.rbtn_OFF.AutoSize = true;
            this.rbtn_OFF.Checked = true;
            this.rbtn_OFF.Location = new System.Drawing.Point(6, 10);
            this.rbtn_OFF.Name = "rbtn_OFF";
            this.rbtn_OFF.Size = new System.Drawing.Size(45, 17);
            this.rbtn_OFF.TabIndex = 8;
            this.rbtn_OFF.TabStop = true;
            this.rbtn_OFF.Text = "OFF";
            this.rbtn_OFF.UseVisualStyleBackColor = true;
            // 
            // rbtn_ON_OFF
            // 
            this.rbtn_ON_OFF.AutoSize = true;
            this.rbtn_ON_OFF.Location = new System.Drawing.Point(99, 10);
            this.rbtn_ON_OFF.Name = "rbtn_ON_OFF";
            this.rbtn_ON_OFF.Size = new System.Drawing.Size(66, 17);
            this.rbtn_ON_OFF.TabIndex = 10;
            this.rbtn_ON_OFF.Text = "ON/OFF";
            this.rbtn_ON_OFF.UseVisualStyleBackColor = true;
            this.rbtn_ON_OFF.CheckedChanged += new System.EventHandler(this.rbtn_ON_OFF_CheckedChanged_1);
            // 
            // rbtn_ON
            // 
            this.rbtn_ON.AutoSize = true;
            this.rbtn_ON.Location = new System.Drawing.Point(54, 10);
            this.rbtn_ON.Name = "rbtn_ON";
            this.rbtn_ON.Size = new System.Drawing.Size(41, 17);
            this.rbtn_ON.TabIndex = 9;
            this.rbtn_ON.Text = "ON";
            this.rbtn_ON.UseVisualStyleBackColor = true;
            // 
            // labelControl4
            // 
            this.labelControl4.Location = new System.Drawing.Point(150, 86);
            this.labelControl4.Name = "labelControl4";
            this.labelControl4.Size = new System.Drawing.Size(58, 13);
            this.labelControl4.TabIndex = 27;
            this.labelControl4.Text = "Led Display:";
            // 
            // lbl_percent
            // 
            this.lbl_percent.Location = new System.Drawing.Point(370, 43);
            this.lbl_percent.Name = "lbl_percent";
            this.lbl_percent.Size = new System.Drawing.Size(17, 13);
            this.lbl_percent.TabIndex = 26;
            this.lbl_percent.Text = "0%";
            this.lbl_percent.Click += new System.EventHandler(this.lbl_percent_Click);
            // 
            // tbar_Preset
            // 
            this.tbar_Preset.Enabled = false;
            this.tbar_Preset.Location = new System.Drawing.Point(215, 40);
            this.tbar_Preset.Maximum = 255;
            this.tbar_Preset.Name = "tbar_Preset";
            this.tbar_Preset.Size = new System.Drawing.Size(148, 45);
            this.tbar_Preset.TabIndex = 25;
            this.tbar_Preset.TickFrequency = 26;
            this.tbar_Preset.ValueChanged += new System.EventHandler(this.tbar_Preset_ValueChanged);
            // 
            // labelControl2
            // 
            this.labelControl2.Location = new System.Drawing.Point(162, 48);
            this.labelControl2.Name = "labelControl2";
            this.labelControl2.Size = new System.Drawing.Size(35, 13);
            this.labelControl2.TabIndex = 24;
            this.labelControl2.Text = "Preset:";
            // 
            // cbx_Ramp
            // 
            this.cbx_Ramp.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbx_Ramp.Enabled = false;
            this.cbx_Ramp.FormattingEnabled = true;
            this.cbx_Ramp.Items.AddRange(new object[] {
            "Instant",
            "1 secs",
            "4 secs",
            "8 secs",
            "12 secs",
            "20 secs",
            "30 secs",
            "40 secs",
            "60 secs",
            "90 secs",
            "120 secs",
            "150 secs",
            "180 secs",
            "210 secs",
            "240 secs",
            "255 secs"});
            this.cbx_Ramp.Location = new System.Drawing.Point(226, 9);
            this.cbx_Ramp.Name = "cbx_Ramp";
            this.cbx_Ramp.Size = new System.Drawing.Size(99, 21);
            this.cbx_Ramp.TabIndex = 23;
            // 
            // labelControl1
            // 
            this.labelControl1.Location = new System.Drawing.Point(163, 12);
            this.labelControl1.Name = "labelControl1";
            this.labelControl1.Size = new System.Drawing.Size(31, 13);
            this.labelControl1.TabIndex = 22;
            this.labelControl1.Text = "Ramp:";
            // 
            // btn_Ok
            // 
            this.btn_Ok.Font = new System.Drawing.Font("Microsoft Sans Serif", 9.75F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btn_Ok.Location = new System.Drawing.Point(157, 433);
            this.btn_Ok.Name = "btn_Ok";
            this.btn_Ok.Size = new System.Drawing.Size(85, 32);
            this.btn_Ok.TabIndex = 46;
            this.btn_Ok.Text = "OK";
            this.btn_Ok.UseVisualStyleBackColor = true;
            this.btn_Ok.Click += new System.EventHandler(this.btn_Ok_Click);
            // 
            // btn_Cancel
            // 
            this.btn_Cancel.Font = new System.Drawing.Font("Microsoft Sans Serif", 9.75F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btn_Cancel.Location = new System.Drawing.Point(327, 433);
            this.btn_Cancel.Name = "btn_Cancel";
            this.btn_Cancel.Size = new System.Drawing.Size(85, 32);
            this.btn_Cancel.TabIndex = 47;
            this.btn_Cancel.Text = "Cancel";
            this.btn_Cancel.UseVisualStyleBackColor = true;
            this.btn_Cancel.Click += new System.EventHandler(this.btn_Cancel_Click);
            // 
            // timer1
            // 
            this.timer1.Tick += new System.EventHandler(this.timer1_Tick);
            // 
            // ConfigIO_RCU_9IN_4RL
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(588, 476);
            this.Controls.Add(this.btn_Cancel);
            this.Controls.Add(this.btn_Ok);
            this.Controls.Add(this.panel1);
            this.Controls.Add(this.panel_Mul_Group);
            this.Name = "ConfigIO_RCU_9IN_4RL";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "ConfigIO";
            this.FormClosing += new System.Windows.Forms.FormClosingEventHandler(this.ConfigIO_FormClosing);
            this.Load += new System.EventHandler(this.ConfigIO_Load);
            this.panel_Mul_Group.ResumeLayout(false);
            this.panel_Mul_Group.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.gr_InactiveGroup)).EndInit();
            ((System.ComponentModel.ISupportInitialize)(this.gr_ActiveGroup)).EndInit();
            this.panel1.ResumeLayout(false);
            this.panel1.PerformLayout();
            this.panel2.ResumeLayout(false);
            this.panel2.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.tbar_Preset)).EndInit();
            this.ResumeLayout(false);

        }

        #endregion

        public System.Windows.Forms.ListBox lst_AvaiGroup;
        private DevExpress.XtraEditors.LabelControl labelControl3;
        private System.Windows.Forms.Button btn_Edit_Group;
        private System.Windows.Forms.Button btn_Add_Group;
        private System.Windows.Forms.Panel panel_Mul_Group;
        private System.Windows.Forms.DataGridView gr_ActiveGroup;
        private System.Windows.Forms.Button btn_AddMul_ActiveGroup;
        private DevExpress.XtraEditors.LabelControl labelControl9;
        private DevExpress.XtraEditors.LabelControl labelControl10;
        private System.Windows.Forms.DataGridView gr_InactiveGroup;
        private System.Windows.Forms.CheckBox toggle_percent_activeGroup;
        private System.Windows.Forms.CheckBox toggle_percent_inactiveGroup;
        private System.Windows.Forms.Button btn_Add_InactiveGroup;
        private System.Windows.Forms.Button btn_AddMul_InactiveGroup;
        private System.Windows.Forms.Button btn_Clr_ActiveGroup;
        private System.Windows.Forms.Button btn_ClrMul_ActiveGroup;
        private System.Windows.Forms.Button btn_Clr_InactiveGroup;
        private System.Windows.Forms.Button btn_ClrMul_InactiveGroup;
        private System.Windows.Forms.Button btn_Add_ActiveGroup;
        private System.Windows.Forms.Panel panel1;
        private DevExpress.XtraEditors.LabelControl labelControl8;
        private System.Windows.Forms.ComboBox cbx_sec;
        private DevExpress.XtraEditors.LabelControl labelControl7;
        private System.Windows.Forms.ComboBox cbx_min;
        private DevExpress.XtraEditors.LabelControl labelControl6;
        private System.Windows.Forms.ComboBox cbx_hour;
        private DevExpress.XtraEditors.LabelControl labelControl5;
        private System.Windows.Forms.CheckBox checkBox3;
        private System.Windows.Forms.CheckBox chk_Backlight;
        private System.Windows.Forms.CheckBox chk_Nightlight;
        private System.Windows.Forms.Panel panel2;
        private System.Windows.Forms.RadioButton rbtn_2colors;
        private System.Windows.Forms.RadioButton rbtn_OFF;
        private System.Windows.Forms.RadioButton rbtn_ON_OFF;
        private System.Windows.Forms.RadioButton rbtn_ON;
        private DevExpress.XtraEditors.LabelControl labelControl4;
        private DevExpress.XtraEditors.LabelControl lbl_percent;
        private System.Windows.Forms.TrackBar tbar_Preset;
        private DevExpress.XtraEditors.LabelControl labelControl2;
        private System.Windows.Forms.ComboBox cbx_Ramp;
        private DevExpress.XtraEditors.LabelControl labelControl1;
        private System.Windows.Forms.Button btn_Ok;
        private System.Windows.Forms.Button btn_Cancel;
        private System.Windows.Forms.DataGridViewTextBoxColumn Group;
        private System.Windows.Forms.DataGridViewTextBoxColumn Preset;
        private System.Windows.Forms.DataGridViewTextBoxColumn dataGridViewTextBoxColumn1;
        private System.Windows.Forms.DataGridViewTextBoxColumn dataGridViewTextBoxColumn2;
        private System.Windows.Forms.Timer timer1;
    }
}