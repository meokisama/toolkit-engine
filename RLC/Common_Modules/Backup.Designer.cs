namespace RLC
{
    partial class Backup
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
            System.Windows.Forms.DataGridViewCellStyle dataGridViewCellStyle1 = new System.Windows.Forms.DataGridViewCellStyle();
            System.Windows.Forms.DataGridViewCellStyle dataGridViewCellStyle2 = new System.Windows.Forms.DataGridViewCellStyle();
            System.Windows.Forms.DataGridViewCellStyle dataGridViewCellStyle3 = new System.Windows.Forms.DataGridViewCellStyle();
            System.Windows.Forms.DataGridViewCellStyle dataGridViewCellStyle4 = new System.Windows.Forms.DataGridViewCellStyle();
            this.labelguide = new System.Windows.Forms.Label();
            this.btn_Ok = new System.Windows.Forms.Button();
            this.btn_Cancel = new System.Windows.Forms.Button();
            this.panel1 = new System.Windows.Forms.Panel();
            this.label_annouce = new System.Windows.Forms.Label();
            this.btn_selectNone = new System.Windows.Forms.Button();
            this.btn_selectALL = new System.Windows.Forms.Button();
            this.gr_project = new System.Windows.Forms.DataGridView();
            this.grid_backup = new System.Windows.Forms.DataGridViewCheckBoxColumn();
            this.ProjectName = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.panel2 = new System.Windows.Forms.Panel();
            this.btn_Back = new System.Windows.Forms.Button();
            this.panel3 = new System.Windows.Forms.Panel();
            this.label_newname = new System.Windows.Forms.Label();
            this.rbtn_Rename = new System.Windows.Forms.RadioButton();
            this.rbtn_replace = new System.Windows.Forms.RadioButton();
            this.grid_RenameProject = new System.Windows.Forms.DataGridView();
            this.dataGridViewCheckBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.dataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
            this.Column1 = new System.Windows.Forms.DataGridViewCheckBoxColumn();
            this.panel1.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.gr_project)).BeginInit();
            this.panel2.SuspendLayout();
            this.panel3.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.grid_RenameProject)).BeginInit();
            this.SuspendLayout();
            // 
            // labelguide
            // 
            this.labelguide.AutoSize = true;
            this.labelguide.Location = new System.Drawing.Point(16, 14);
            this.labelguide.Name = "labelguide";
            this.labelguide.Size = new System.Drawing.Size(235, 13);
            this.labelguide.TabIndex = 2;
            this.labelguide.Text = "Please choose projects that you want to backup";
            // 
            // btn_Ok
            // 
            this.btn_Ok.Location = new System.Drawing.Point(279, 9);
            this.btn_Ok.Name = "btn_Ok";
            this.btn_Ok.Size = new System.Drawing.Size(75, 32);
            this.btn_Ok.TabIndex = 5;
            this.btn_Ok.Text = "OK";
            this.btn_Ok.UseVisualStyleBackColor = true;
            this.btn_Ok.Click += new System.EventHandler(this.btn_Ok_Click);
            // 
            // btn_Cancel
            // 
            this.btn_Cancel.Location = new System.Drawing.Point(370, 9);
            this.btn_Cancel.Name = "btn_Cancel";
            this.btn_Cancel.Size = new System.Drawing.Size(75, 32);
            this.btn_Cancel.TabIndex = 6;
            this.btn_Cancel.Text = "Cancel";
            this.btn_Cancel.UseVisualStyleBackColor = true;
            this.btn_Cancel.Click += new System.EventHandler(this.btn_Cancel_Click);
            // 
            // panel1
            // 
            this.panel1.BackColor = System.Drawing.SystemColors.Control;
            this.panel1.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.panel1.Controls.Add(this.label_annouce);
            this.panel1.Controls.Add(this.btn_selectNone);
            this.panel1.Controls.Add(this.btn_selectALL);
            this.panel1.Controls.Add(this.gr_project);
            this.panel1.Location = new System.Drawing.Point(-1, 40);
            this.panel1.Name = "panel1";
            this.panel1.Size = new System.Drawing.Size(464, 279);
            this.panel1.TabIndex = 7;
            // 
            // label_annouce
            // 
            this.label_annouce.AutoSize = true;
            this.label_annouce.Location = new System.Drawing.Point(175, 247);
            this.label_annouce.Name = "label_annouce";
            this.label_annouce.Size = new System.Drawing.Size(275, 13);
            this.label_annouce.TabIndex = 8;
            this.label_annouce.Text = "There are project name conflicts. Click \"Next\" to resolve.";
            this.label_annouce.Visible = false;
            // 
            // btn_selectNone
            // 
            this.btn_selectNone.Location = new System.Drawing.Point(94, 243);
            this.btn_selectNone.Name = "btn_selectNone";
            this.btn_selectNone.Size = new System.Drawing.Size(75, 23);
            this.btn_selectNone.TabIndex = 7;
            this.btn_selectNone.Text = "Select None";
            this.btn_selectNone.UseVisualStyleBackColor = true;
            this.btn_selectNone.Click += new System.EventHandler(this.btn_selectNone_Click);
            // 
            // btn_selectALL
            // 
            this.btn_selectALL.Location = new System.Drawing.Point(13, 243);
            this.btn_selectALL.Name = "btn_selectALL";
            this.btn_selectALL.Size = new System.Drawing.Size(75, 23);
            this.btn_selectALL.TabIndex = 6;
            this.btn_selectALL.Text = "Select All";
            this.btn_selectALL.UseVisualStyleBackColor = true;
            this.btn_selectALL.Click += new System.EventHandler(this.btn_selectALL_Click);
            // 
            // gr_project
            // 
            this.gr_project.AllowUserToAddRows = false;
            this.gr_project.AllowUserToDeleteRows = false;
            this.gr_project.BackgroundColor = System.Drawing.Color.White;
            this.gr_project.CellBorderStyle = System.Windows.Forms.DataGridViewCellBorderStyle.None;
            dataGridViewCellStyle1.Alignment = System.Windows.Forms.DataGridViewContentAlignment.MiddleLeft;
            dataGridViewCellStyle1.BackColor = System.Drawing.SystemColors.Control;
            dataGridViewCellStyle1.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            dataGridViewCellStyle1.ForeColor = System.Drawing.SystemColors.WindowText;
            dataGridViewCellStyle1.SelectionBackColor = System.Drawing.Color.Transparent;
            dataGridViewCellStyle1.SelectionForeColor = System.Drawing.Color.Transparent;
            dataGridViewCellStyle1.WrapMode = System.Windows.Forms.DataGridViewTriState.True;
            this.gr_project.ColumnHeadersDefaultCellStyle = dataGridViewCellStyle1;
            this.gr_project.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            this.gr_project.Columns.AddRange(new System.Windows.Forms.DataGridViewColumn[] {
            this.grid_backup,
            this.ProjectName});
            dataGridViewCellStyle2.Alignment = System.Windows.Forms.DataGridViewContentAlignment.MiddleLeft;
            dataGridViewCellStyle2.BackColor = System.Drawing.SystemColors.Window;
            dataGridViewCellStyle2.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            dataGridViewCellStyle2.ForeColor = System.Drawing.SystemColors.ControlText;
            dataGridViewCellStyle2.SelectionBackColor = System.Drawing.SystemColors.Window;
            dataGridViewCellStyle2.SelectionForeColor = System.Drawing.SystemColors.ControlText;
            dataGridViewCellStyle2.WrapMode = System.Windows.Forms.DataGridViewTriState.False;
            this.gr_project.DefaultCellStyle = dataGridViewCellStyle2;
            this.gr_project.Location = new System.Drawing.Point(13, 12);
            this.gr_project.MultiSelect = false;
            this.gr_project.Name = "gr_project";
            this.gr_project.RowHeadersVisible = false;
            this.gr_project.RowHeadersWidthSizeMode = System.Windows.Forms.DataGridViewRowHeadersWidthSizeMode.DisableResizing;
            this.gr_project.RowTemplate.Resizable = System.Windows.Forms.DataGridViewTriState.False;
            this.gr_project.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
            this.gr_project.Size = new System.Drawing.Size(432, 224);
            this.gr_project.TabIndex = 5;
            this.gr_project.RowPostPaint += new System.Windows.Forms.DataGridViewRowPostPaintEventHandler(this.gr_project_RowPostPaint);
            this.gr_project.CellContentDoubleClick += new System.Windows.Forms.DataGridViewCellEventHandler(this.gr_project_CellContentDoubleClick);
            this.gr_project.CellContentClick += new System.Windows.Forms.DataGridViewCellEventHandler(this.gr_project_CellContentClick);
            // 
            // grid_backup
            // 
            this.grid_backup.Frozen = true;
            this.grid_backup.HeaderText = "     Backup";
            this.grid_backup.Name = "grid_backup";
            this.grid_backup.Resizable = System.Windows.Forms.DataGridViewTriState.False;
            this.grid_backup.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
            this.grid_backup.Width = 83;
            // 
            // ProjectName
            // 
            this.ProjectName.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.None;
            this.ProjectName.Frozen = true;
            this.ProjectName.HeaderText = "ProjectName";
            this.ProjectName.Name = "ProjectName";
            this.ProjectName.ReadOnly = true;
            this.ProjectName.Resizable = System.Windows.Forms.DataGridViewTriState.False;
            this.ProjectName.Width = 346;
            // 
            // panel2
            // 
            this.panel2.BackColor = System.Drawing.SystemColors.Control;
            this.panel2.Controls.Add(this.btn_Back);
            this.panel2.Controls.Add(this.btn_Ok);
            this.panel2.Controls.Add(this.btn_Cancel);
            this.panel2.Location = new System.Drawing.Point(-1, 319);
            this.panel2.Name = "panel2";
            this.panel2.Size = new System.Drawing.Size(464, 53);
            this.panel2.TabIndex = 8;
            // 
            // btn_Back
            // 
            this.btn_Back.Location = new System.Drawing.Point(187, 9);
            this.btn_Back.Name = "btn_Back";
            this.btn_Back.Size = new System.Drawing.Size(75, 32);
            this.btn_Back.TabIndex = 7;
            this.btn_Back.Text = "Back";
            this.btn_Back.UseVisualStyleBackColor = true;
            this.btn_Back.Visible = false;
            this.btn_Back.Click += new System.EventHandler(this.btn_Back_Click);
            // 
            // panel3
            // 
            this.panel3.BackColor = System.Drawing.SystemColors.Control;
            this.panel3.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            this.panel3.Controls.Add(this.label_newname);
            this.panel3.Controls.Add(this.rbtn_Rename);
            this.panel3.Controls.Add(this.rbtn_replace);
            this.panel3.Controls.Add(this.grid_RenameProject);
            this.panel3.Location = new System.Drawing.Point(-1, 40);
            this.panel3.Name = "panel3";
            this.panel3.Size = new System.Drawing.Size(464, 279);
            this.panel3.TabIndex = 9;
            this.panel3.Visible = false;
            // 
            // label_newname
            // 
            this.label_newname.AutoSize = true;
            this.label_newname.Location = new System.Drawing.Point(12, 66);
            this.label_newname.Name = "label_newname";
            this.label_newname.Size = new System.Drawing.Size(245, 13);
            this.label_newname.TabIndex = 11;
            this.label_newname.Text = "Please choose new names for projects to continue";
            this.label_newname.Visible = false;
            // 
            // rbtn_Rename
            // 
            this.rbtn_Rename.AutoSize = true;
            this.rbtn_Rename.Location = new System.Drawing.Point(13, 35);
            this.rbtn_Rename.Name = "rbtn_Rename";
            this.rbtn_Rename.Size = new System.Drawing.Size(158, 17);
            this.rbtn_Rename.TabIndex = 10;
            this.rbtn_Rename.Text = "Rename Conflicting Projects";
            this.rbtn_Rename.UseVisualStyleBackColor = true;
            this.rbtn_Rename.CheckedChanged += new System.EventHandler(this.rbtn_Rename_CheckedChanged);
            // 
            // rbtn_replace
            // 
            this.rbtn_replace.AutoSize = true;
            this.rbtn_replace.Checked = true;
            this.rbtn_replace.Location = new System.Drawing.Point(13, 9);
            this.rbtn_replace.Name = "rbtn_replace";
            this.rbtn_replace.Size = new System.Drawing.Size(158, 17);
            this.rbtn_replace.TabIndex = 9;
            this.rbtn_replace.TabStop = true;
            this.rbtn_replace.Text = "Replace Conflicting Projects";
            this.rbtn_replace.UseVisualStyleBackColor = true;
            // 
            // grid_RenameProject
            // 
            this.grid_RenameProject.AllowUserToAddRows = false;
            this.grid_RenameProject.AllowUserToDeleteRows = false;
            this.grid_RenameProject.BackgroundColor = System.Drawing.Color.White;
            dataGridViewCellStyle3.Alignment = System.Windows.Forms.DataGridViewContentAlignment.MiddleLeft;
            dataGridViewCellStyle3.BackColor = System.Drawing.SystemColors.Control;
            dataGridViewCellStyle3.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            dataGridViewCellStyle3.ForeColor = System.Drawing.SystemColors.WindowText;
            dataGridViewCellStyle3.SelectionBackColor = System.Drawing.Color.Transparent;
            dataGridViewCellStyle3.SelectionForeColor = System.Drawing.Color.Transparent;
            dataGridViewCellStyle3.WrapMode = System.Windows.Forms.DataGridViewTriState.True;
            this.grid_RenameProject.ColumnHeadersDefaultCellStyle = dataGridViewCellStyle3;
            this.grid_RenameProject.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            this.grid_RenameProject.Columns.AddRange(new System.Windows.Forms.DataGridViewColumn[] {
            this.dataGridViewCheckBoxColumn1,
            this.dataGridViewTextBoxColumn1,
            this.Column1});
            dataGridViewCellStyle4.Alignment = System.Windows.Forms.DataGridViewContentAlignment.MiddleLeft;
            dataGridViewCellStyle4.BackColor = System.Drawing.SystemColors.Window;
            dataGridViewCellStyle4.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            dataGridViewCellStyle4.ForeColor = System.Drawing.SystemColors.ControlText;
            dataGridViewCellStyle4.SelectionBackColor = System.Drawing.SystemColors.Window;
            dataGridViewCellStyle4.SelectionForeColor = System.Drawing.SystemColors.ControlText;
            dataGridViewCellStyle4.WrapMode = System.Windows.Forms.DataGridViewTriState.False;
            this.grid_RenameProject.DefaultCellStyle = dataGridViewCellStyle4;
            this.grid_RenameProject.Enabled = false;
            this.grid_RenameProject.Location = new System.Drawing.Point(13, 92);
            this.grid_RenameProject.MultiSelect = false;
            this.grid_RenameProject.Name = "grid_RenameProject";
            this.grid_RenameProject.RowHeadersVisible = false;
            this.grid_RenameProject.RowHeadersWidthSizeMode = System.Windows.Forms.DataGridViewRowHeadersWidthSizeMode.DisableResizing;
            this.grid_RenameProject.RowTemplate.Resizable = System.Windows.Forms.DataGridViewTriState.False;
            this.grid_RenameProject.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
            this.grid_RenameProject.Size = new System.Drawing.Size(432, 173);
            this.grid_RenameProject.TabIndex = 5;
            this.grid_RenameProject.RowPostPaint += new System.Windows.Forms.DataGridViewRowPostPaintEventHandler(this.grid_RenameProject_RowPostPaint);
            // 
            // dataGridViewCheckBoxColumn1
            // 
            this.dataGridViewCheckBoxColumn1.Frozen = true;
            this.dataGridViewCheckBoxColumn1.HeaderText = "Project Name";
            this.dataGridViewCheckBoxColumn1.Name = "dataGridViewCheckBoxColumn1";
            this.dataGridViewCheckBoxColumn1.ReadOnly = true;
            this.dataGridViewCheckBoxColumn1.Resizable = System.Windows.Forms.DataGridViewTriState.False;
            this.dataGridViewCheckBoxColumn1.Width = 150;
            // 
            // dataGridViewTextBoxColumn1
            // 
            this.dataGridViewTextBoxColumn1.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.None;
            this.dataGridViewTextBoxColumn1.Frozen = true;
            this.dataGridViewTextBoxColumn1.HeaderText = "New Project Name";
            this.dataGridViewTextBoxColumn1.Name = "dataGridViewTextBoxColumn1";
            this.dataGridViewTextBoxColumn1.Resizable = System.Windows.Forms.DataGridViewTriState.False;
            this.dataGridViewTextBoxColumn1.Width = 220;
            // 
            // Column1
            // 
            this.Column1.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.None;
            this.Column1.Frozen = true;
            this.Column1.HeaderText = "Overwrite";
            this.Column1.Name = "Column1";
            this.Column1.Resizable = System.Windows.Forms.DataGridViewTriState.False;
            this.Column1.Width = 60;
            // 
            // Backup
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.ClientSize = new System.Drawing.Size(458, 367);
            this.Controls.Add(this.panel3);
            this.Controls.Add(this.panel2);
            this.Controls.Add(this.panel1);
            this.Controls.Add(this.labelguide);
            this.Name = "Backup";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "Backup Project";
            this.Load += new System.EventHandler(this.Backup_Load);
            this.FormClosing += new System.Windows.Forms.FormClosingEventHandler(this.Backup_FormClosing);
            this.panel1.ResumeLayout(false);
            this.panel1.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.gr_project)).EndInit();
            this.panel2.ResumeLayout(false);
            this.panel3.ResumeLayout(false);
            this.panel3.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.grid_RenameProject)).EndInit();
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        public System.Windows.Forms.Label labelguide;
        public System.Windows.Forms.Button btn_Ok;
        private System.Windows.Forms.Button btn_Cancel;
        private System.Windows.Forms.Panel panel1;
        private System.Windows.Forms.Button btn_selectNone;
        private System.Windows.Forms.Button btn_selectALL;
        public System.Windows.Forms.DataGridView gr_project;
        private System.Windows.Forms.Panel panel2;
        public System.Windows.Forms.Label label_annouce;
        private System.Windows.Forms.DataGridViewCheckBoxColumn grid_backup;
        private System.Windows.Forms.DataGridViewTextBoxColumn ProjectName;
        private System.Windows.Forms.Panel panel3;
        private System.Windows.Forms.RadioButton rbtn_Rename;
        private System.Windows.Forms.RadioButton rbtn_replace;
        public System.Windows.Forms.DataGridView grid_RenameProject;
        public System.Windows.Forms.Label label_newname;
        public System.Windows.Forms.Button btn_Back;
        private System.Windows.Forms.DataGridViewTextBoxColumn dataGridViewCheckBoxColumn1;
        private System.Windows.Forms.DataGridViewTextBoxColumn dataGridViewTextBoxColumn1;
        private System.Windows.Forms.DataGridViewCheckBoxColumn Column1;

    }
}