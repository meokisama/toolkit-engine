namespace RLC
{
    partial class Add_Group
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
            this.cbx_GroupAddress = new System.Windows.Forms.ComboBox();
            this.label1 = new System.Windows.Forms.Label();
            this.label2 = new System.Windows.Forms.Label();
            this.txt_GroupName = new System.Windows.Forms.TextBox();
            this.btn_OK = new System.Windows.Forms.Button();
            this.button2 = new System.Windows.Forms.Button();
            this.label3 = new System.Windows.Forms.Label();
            this.txt_Des = new System.Windows.Forms.TextBox();
            this.lbl_group_type = new System.Windows.Forms.Label();
            this.SuspendLayout();
            // 
            // cbx_GroupAddress
            // 
            this.cbx_GroupAddress.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbx_GroupAddress.FormattingEnabled = true;
            this.cbx_GroupAddress.Location = new System.Drawing.Point(101, 34);
            this.cbx_GroupAddress.Name = "cbx_GroupAddress";
            this.cbx_GroupAddress.Size = new System.Drawing.Size(121, 21);
            this.cbx_GroupAddress.TabIndex = 0;
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Location = new System.Drawing.Point(32, 38);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(48, 13);
            this.label1.TabIndex = 1;
            this.label1.Text = "Address:";
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Location = new System.Drawing.Point(21, 71);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(70, 13);
            this.label2.TabIndex = 2;
            this.label2.Text = "Group Name:";
            // 
            // txt_GroupName
            // 
            this.txt_GroupName.Location = new System.Drawing.Point(101, 68);
            this.txt_GroupName.Name = "txt_GroupName";
            this.txt_GroupName.Size = new System.Drawing.Size(121, 20);
            this.txt_GroupName.TabIndex = 3;
            this.txt_GroupName.Text = "New Group";
            // 
            // btn_OK
            // 
            this.btn_OK.Location = new System.Drawing.Point(24, 139);
            this.btn_OK.Name = "btn_OK";
            this.btn_OK.Size = new System.Drawing.Size(75, 23);
            this.btn_OK.TabIndex = 4;
            this.btn_OK.Text = "OK";
            this.btn_OK.UseVisualStyleBackColor = true;
            this.btn_OK.Click += new System.EventHandler(this.btn_OK_Click);
            // 
            // button2
            // 
            this.button2.Location = new System.Drawing.Point(147, 139);
            this.button2.Name = "button2";
            this.button2.Size = new System.Drawing.Size(75, 23);
            this.button2.TabIndex = 5;
            this.button2.Text = "Cancel";
            this.button2.UseVisualStyleBackColor = true;
            this.button2.Click += new System.EventHandler(this.button2_Click);
            // 
            // label3
            // 
            this.label3.AutoSize = true;
            this.label3.Location = new System.Drawing.Point(25, 106);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(63, 13);
            this.label3.TabIndex = 6;
            this.label3.Text = "Description:";
            // 
            // txt_Des
            // 
            this.txt_Des.Location = new System.Drawing.Point(101, 103);
            this.txt_Des.Name = "txt_Des";
            this.txt_Des.Size = new System.Drawing.Size(121, 20);
            this.txt_Des.TabIndex = 7;
            this.txt_Des.Text = "No Description";
            // 
            // lbl_group_type
            // 
            this.lbl_group_type.Font = new System.Drawing.Font("Microsoft Sans Serif", 14.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lbl_group_type.Location = new System.Drawing.Point(2, 4);
            this.lbl_group_type.Name = "lbl_group_type";
            this.lbl_group_type.Size = new System.Drawing.Size(242, 24);
            this.lbl_group_type.TabIndex = 8;
            this.lbl_group_type.Text = "Lighting Group";
            this.lbl_group_type.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            // 
            // Add_Group
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(244, 168);
            this.Controls.Add(this.lbl_group_type);
            this.Controls.Add(this.txt_Des);
            this.Controls.Add(this.label3);
            this.Controls.Add(this.button2);
            this.Controls.Add(this.btn_OK);
            this.Controls.Add(this.txt_GroupName);
            this.Controls.Add(this.label2);
            this.Controls.Add(this.label1);
            this.Controls.Add(this.cbx_GroupAddress);
            this.Name = "Add_Group";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "Add_Group";
            this.FormClosed += new System.Windows.Forms.FormClosedEventHandler(this.Add_Group_FormClosed);
            this.Load += new System.EventHandler(this.Add_Group_Load);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.ComboBox cbx_GroupAddress;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.TextBox txt_GroupName;
        private System.Windows.Forms.Button btn_OK;
        private System.Windows.Forms.Button button2;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.TextBox txt_Des;
        private System.Windows.Forms.Label lbl_group_type;
    }
}