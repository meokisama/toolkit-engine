namespace RLC
{
    partial class Tool_Setup
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
            this.chk_Reset = new System.Windows.Forms.CheckBox();
            this.btn_ok = new System.Windows.Forms.Button();
            this.button2 = new System.Windows.Forms.Button();
            this.label5 = new System.Windows.Forms.Label();
            this.masktxt_Can3 = new System.Windows.Forms.MaskedTextBox();
            this.label8 = new System.Windows.Forms.Label();
            this.label6 = new System.Windows.Forms.Label();
            this.label3 = new System.Windows.Forms.Label();
            this.label1 = new System.Windows.Forms.Label();
            this.label2 = new System.Windows.Forms.Label();
            this.label4 = new System.Windows.Forms.Label();
            this.label7 = new System.Windows.Forms.Label();
            this.maskedTextBox1 = new System.Windows.Forms.MaskedTextBox();
            this.maskedTextBox2 = new System.Windows.Forms.MaskedTextBox();
            this.maskedTextBox3 = new System.Windows.Forms.MaskedTextBox();
            this.maskedTextBoxSerial = new System.Windows.Forms.MaskedTextBox();
            this.label9 = new System.Windows.Forms.Label();
            this.Manufacture_Date_picker = new System.Windows.Forms.DateTimePicker();
            this.cbx_Can1 = new System.Windows.Forms.ComboBox();
            this.cbx_Can2 = new System.Windows.Forms.ComboBox();
            this.cbx_Can0 = new System.Windows.Forms.ComboBox();
            this.SuspendLayout();
            // 
            // chk_Reset
            // 
            this.chk_Reset.AutoSize = true;
            this.chk_Reset.Location = new System.Drawing.Point(20, 210);
            this.chk_Reset.Name = "chk_Reset";
            this.chk_Reset.Size = new System.Drawing.Size(137, 17);
            this.chk_Reset.TabIndex = 4;
            this.chk_Reset.Text = "Reset Firmware Version";
            this.chk_Reset.UseVisualStyleBackColor = true;
            // 
            // btn_ok
            // 
            this.btn_ok.Location = new System.Drawing.Point(31, 237);
            this.btn_ok.Name = "btn_ok";
            this.btn_ok.Size = new System.Drawing.Size(75, 23);
            this.btn_ok.TabIndex = 10;
            this.btn_ok.Text = "OK";
            this.btn_ok.UseVisualStyleBackColor = true;
            this.btn_ok.Click += new System.EventHandler(this.btn_ok_Click);
            // 
            // button2
            // 
            this.button2.Location = new System.Drawing.Point(160, 237);
            this.button2.Name = "button2";
            this.button2.Size = new System.Drawing.Size(75, 23);
            this.button2.TabIndex = 11;
            this.button2.Text = "Cancel";
            this.button2.UseVisualStyleBackColor = true;
            this.button2.Click += new System.EventHandler(this.button2_Click);
            // 
            // label5
            // 
            this.label5.AutoSize = true;
            this.label5.Location = new System.Drawing.Point(17, 15);
            this.label5.Name = "label5";
            this.label5.Size = new System.Drawing.Size(46, 13);
            this.label5.TabIndex = 14;
            this.label5.Text = "ID CAN:";
            // 
            // masktxt_Can3
            // 
            this.masktxt_Can3.Enabled = false;
            this.masktxt_Can3.HidePromptOnLeave = true;
            this.masktxt_Can3.Location = new System.Drawing.Point(239, 13);
            this.masktxt_Can3.Mask = "000";
            this.masktxt_Can3.Name = "masktxt_Can3";
            this.masktxt_Can3.ResetOnPrompt = false;
            this.masktxt_Can3.ResetOnSpace = false;
            this.masktxt_Can3.Size = new System.Drawing.Size(25, 20);
            this.masktxt_Can3.SkipLiterals = false;
            this.masktxt_Can3.TabIndex = 36;
            this.masktxt_Can3.Text = "1";
            this.masktxt_Can3.TextAlign = System.Windows.Forms.HorizontalAlignment.Center;
            this.masktxt_Can3.TextMaskFormat = System.Windows.Forms.MaskFormat.ExcludePromptAndLiterals;
            this.masktxt_Can3.TextChanged += new System.EventHandler(this.maskedTextBox1_TextChanged);
            // 
            // label8
            // 
            this.label8.AutoSize = true;
            this.label8.Font = new System.Drawing.Font("Times New Roman", 14.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label8.Location = new System.Drawing.Point(227, 13);
            this.label8.Name = "label8";
            this.label8.Size = new System.Drawing.Size(15, 22);
            this.label8.TabIndex = 33;
            this.label8.Text = ".";
            // 
            // label6
            // 
            this.label6.AutoSize = true;
            this.label6.Font = new System.Drawing.Font("Times New Roman", 14.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label6.Location = new System.Drawing.Point(176, 13);
            this.label6.Name = "label6";
            this.label6.Size = new System.Drawing.Size(15, 22);
            this.label6.TabIndex = 32;
            this.label6.Text = ".";
            // 
            // label3
            // 
            this.label3.AutoSize = true;
            this.label3.Font = new System.Drawing.Font("Times New Roman", 14.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label3.Location = new System.Drawing.Point(126, 13);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(15, 22);
            this.label3.TabIndex = 30;
            this.label3.Text = ".";
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Location = new System.Drawing.Point(17, 48);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(54, 13);
            this.label1.TabIndex = 48;
            this.label1.Text = "UDP port:";
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Location = new System.Drawing.Point(16, 81);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(84, 13);
            this.label2.TabIndex = 49;
            this.label2.Text = "TCP server port:";
            // 
            // label4
            // 
            this.label4.AutoSize = true;
            this.label4.Location = new System.Drawing.Point(17, 114);
            this.label4.Name = "label4";
            this.label4.Size = new System.Drawing.Size(80, 13);
            this.label4.TabIndex = 50;
            this.label4.Text = "TCP client port:";
            // 
            // label7
            // 
            this.label7.AutoSize = true;
            this.label7.Location = new System.Drawing.Point(17, 148);
            this.label7.Name = "label7";
            this.label7.Size = new System.Drawing.Size(96, 13);
            this.label7.TabIndex = 51;
            this.label7.Text = "Manufacture Date:";
            // 
            // maskedTextBox1
            // 
            this.maskedTextBox1.Enabled = false;
            this.maskedTextBox1.HidePromptOnLeave = true;
            this.maskedTextBox1.Location = new System.Drawing.Point(130, 47);
            this.maskedTextBox1.Mask = "00000";
            this.maskedTextBox1.Name = "maskedTextBox1";
            this.maskedTextBox1.ResetOnPrompt = false;
            this.maskedTextBox1.ResetOnSpace = false;
            this.maskedTextBox1.Size = new System.Drawing.Size(133, 20);
            this.maskedTextBox1.SkipLiterals = false;
            this.maskedTextBox1.TabIndex = 52;
            this.maskedTextBox1.Text = "1234";
            this.maskedTextBox1.TextAlign = System.Windows.Forms.HorizontalAlignment.Center;
            this.maskedTextBox1.TextMaskFormat = System.Windows.Forms.MaskFormat.ExcludePromptAndLiterals;
            // 
            // maskedTextBox2
            // 
            this.maskedTextBox2.Enabled = false;
            this.maskedTextBox2.HidePromptOnLeave = true;
            this.maskedTextBox2.Location = new System.Drawing.Point(129, 81);
            this.maskedTextBox2.Mask = "00000";
            this.maskedTextBox2.Name = "maskedTextBox2";
            this.maskedTextBox2.ResetOnPrompt = false;
            this.maskedTextBox2.ResetOnSpace = false;
            this.maskedTextBox2.Size = new System.Drawing.Size(134, 20);
            this.maskedTextBox2.SkipLiterals = false;
            this.maskedTextBox2.TabIndex = 53;
            this.maskedTextBox2.TextAlign = System.Windows.Forms.HorizontalAlignment.Center;
            this.maskedTextBox2.TextMaskFormat = System.Windows.Forms.MaskFormat.ExcludePromptAndLiterals;
            // 
            // maskedTextBox3
            // 
            this.maskedTextBox3.Enabled = false;
            this.maskedTextBox3.HidePromptOnLeave = true;
            this.maskedTextBox3.Location = new System.Drawing.Point(129, 114);
            this.maskedTextBox3.Mask = "00000";
            this.maskedTextBox3.Name = "maskedTextBox3";
            this.maskedTextBox3.ResetOnPrompt = false;
            this.maskedTextBox3.ResetOnSpace = false;
            this.maskedTextBox3.Size = new System.Drawing.Size(134, 20);
            this.maskedTextBox3.SkipLiterals = false;
            this.maskedTextBox3.TabIndex = 54;
            this.maskedTextBox3.TextAlign = System.Windows.Forms.HorizontalAlignment.Center;
            this.maskedTextBox3.TextMaskFormat = System.Windows.Forms.MaskFormat.ExcludePromptAndLiterals;
            // 
            // maskedTextBoxSerial
            // 
            this.maskedTextBoxSerial.HidePromptOnLeave = true;
            this.maskedTextBoxSerial.Location = new System.Drawing.Point(129, 180);
            this.maskedTextBoxSerial.Mask = "00000";
            this.maskedTextBoxSerial.Name = "maskedTextBoxSerial";
            this.maskedTextBoxSerial.ResetOnPrompt = false;
            this.maskedTextBoxSerial.ResetOnSpace = false;
            this.maskedTextBoxSerial.Size = new System.Drawing.Size(134, 20);
            this.maskedTextBoxSerial.SkipLiterals = false;
            this.maskedTextBoxSerial.TabIndex = 57;
            this.maskedTextBoxSerial.TextAlign = System.Windows.Forms.HorizontalAlignment.Center;
            this.maskedTextBoxSerial.TextMaskFormat = System.Windows.Forms.MaskFormat.ExcludePromptAndLiterals;
            // 
            // label9
            // 
            this.label9.AutoSize = true;
            this.label9.Location = new System.Drawing.Point(17, 181);
            this.label9.Name = "label9";
            this.label9.Size = new System.Drawing.Size(76, 13);
            this.label9.TabIndex = 56;
            this.label9.Text = "Serial Number:";
            // 
            // Manufacture_Date_picker
            // 
            this.Manufacture_Date_picker.Checked = false;
            this.Manufacture_Date_picker.CustomFormat = "dd/MM/yyyy";
            this.Manufacture_Date_picker.Format = System.Windows.Forms.DateTimePickerFormat.Custom;
            this.Manufacture_Date_picker.Location = new System.Drawing.Point(129, 146);
            this.Manufacture_Date_picker.Name = "Manufacture_Date_picker";
            this.Manufacture_Date_picker.ShowCheckBox = true;
            this.Manufacture_Date_picker.Size = new System.Drawing.Size(133, 20);
            this.Manufacture_Date_picker.TabIndex = 58;
            // 
            // cbx_Can1
            // 
            this.cbx_Can1.DropDownWidth = 41;
            this.cbx_Can1.FormattingEnabled = true;
            this.cbx_Can1.Location = new System.Drawing.Point(138, 14);
            this.cbx_Can1.Name = "cbx_Can1";
            this.cbx_Can1.Size = new System.Drawing.Size(41, 21);
            this.cbx_Can1.TabIndex = 60;
            this.cbx_Can1.SelectedIndexChanged += new System.EventHandler(this.cbx_Can1_SelectedIndexChanged);
            // 
            // cbx_Can2
            // 
            this.cbx_Can2.FormattingEnabled = true;
            this.cbx_Can2.Location = new System.Drawing.Point(187, 13);
            this.cbx_Can2.Name = "cbx_Can2";
            this.cbx_Can2.Size = new System.Drawing.Size(41, 21);
            this.cbx_Can2.TabIndex = 61;
            // 
            // cbx_Can0
            // 
            this.cbx_Can0.FormattingEnabled = true;
            this.cbx_Can0.Location = new System.Drawing.Point(92, 14);
            this.cbx_Can0.Name = "cbx_Can0";
            this.cbx_Can0.Size = new System.Drawing.Size(35, 21);
            this.cbx_Can0.TabIndex = 62;
            this.cbx_Can0.SelectedIndexChanged += new System.EventHandler(this.cbx_Can0_SelectedIndexChanged);
            // 
            // Tool_Setup
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(284, 266);
            this.Controls.Add(this.cbx_Can0);
            this.Controls.Add(this.cbx_Can2);
            this.Controls.Add(this.cbx_Can1);
            this.Controls.Add(this.Manufacture_Date_picker);
            this.Controls.Add(this.maskedTextBoxSerial);
            this.Controls.Add(this.label9);
            this.Controls.Add(this.maskedTextBox3);
            this.Controls.Add(this.maskedTextBox2);
            this.Controls.Add(this.maskedTextBox1);
            this.Controls.Add(this.label7);
            this.Controls.Add(this.label4);
            this.Controls.Add(this.label2);
            this.Controls.Add(this.label1);
            this.Controls.Add(this.masktxt_Can3);
            this.Controls.Add(this.label8);
            this.Controls.Add(this.label6);
            this.Controls.Add(this.label3);
            this.Controls.Add(this.label5);
            this.Controls.Add(this.button2);
            this.Controls.Add(this.btn_ok);
            this.Controls.Add(this.chk_Reset);
            this.Name = "Tool_Setup";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "Tool Setup";
            this.Load += new System.EventHandler(this.Tool_Setup_Load);
            this.FormClosed += new System.Windows.Forms.FormClosedEventHandler(this.Tool_Setup_FormClosed);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.CheckBox chk_Reset;
        private System.Windows.Forms.Button btn_ok;
        private System.Windows.Forms.Button button2;
        private System.Windows.Forms.Label label5;
        private System.Windows.Forms.MaskedTextBox masktxt_Can3;
        private System.Windows.Forms.Label label8;
        private System.Windows.Forms.Label label6;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.Label label4;
        private System.Windows.Forms.Label label7;
        private System.Windows.Forms.MaskedTextBox maskedTextBox1;
        private System.Windows.Forms.MaskedTextBox maskedTextBox2;
        private System.Windows.Forms.MaskedTextBox maskedTextBox3;
        private System.Windows.Forms.MaskedTextBox maskedTextBoxSerial;
        private System.Windows.Forms.Label label9;
        private System.Windows.Forms.DateTimePicker Manufacture_Date_picker;
        private System.Windows.Forms.ComboBox cbx_Can1;
        private System.Windows.Forms.ComboBox cbx_Can2;
        private System.Windows.Forms.ComboBox cbx_Can0;
    }
}