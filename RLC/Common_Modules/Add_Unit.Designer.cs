namespace RLC
{
    partial class Add_Unit
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
            this.cbx_Unit = new System.Windows.Forms.ComboBox();
            this.label1 = new System.Windows.Forms.Label();
            this.label2 = new System.Windows.Forms.Label();
            this.txt_Des = new System.Windows.Forms.TextBox();
            this.chk_LoadCan = new System.Windows.Forms.CheckBox();
            this.rbtn_Master = new System.Windows.Forms.RadioButton();
            this.rbtn_Slave = new System.Windows.Forms.RadioButton();
            this.rbtn_Stand = new System.Windows.Forms.RadioButton();
            this.btn_ok = new System.Windows.Forms.Button();
            this.button2 = new System.Windows.Forms.Button();
            this.label4 = new System.Windows.Forms.Label();
            this.label5 = new System.Windows.Forms.Label();
            this.masktxt_Can = new System.Windows.Forms.MaskedTextBox();
            this.t3 = new System.Windows.Forms.TextBox();
            this.label8 = new System.Windows.Forms.Label();
            this.label6 = new System.Windows.Forms.Label();
            this.t2 = new System.Windows.Forms.TextBox();
            this.label3 = new System.Windows.Forms.Label();
            this.t1 = new System.Windows.Forms.TextBox();
            this.masktxt_IP_low = new System.Windows.Forms.MaskedTextBox();
            this.label9 = new System.Windows.Forms.Label();
            this.label10 = new System.Windows.Forms.Label();
            this.label11 = new System.Windows.Forms.Label();
            this.masktxt_IP_high = new System.Windows.Forms.MaskedTextBox();
            this.label7 = new System.Windows.Forms.Label();
            this.chk_Recovery = new System.Windows.Forms.CheckBox();
            this.txt_FwVersion = new System.Windows.Forms.TextBox();
            this.label12 = new System.Windows.Forms.Label();
            this.txtIpMaskLayerLow = new System.Windows.Forms.MaskedTextBox();
            this.txtIpMaskLayerHigh = new System.Windows.Forms.MaskedTextBox();
            this.RS485_cfg_btn = new System.Windows.Forms.Button();
            this.SuspendLayout();
            // 
            // cbx_Unit
            // 
            this.cbx_Unit.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbx_Unit.FormattingEnabled = true;
            this.cbx_Unit.Items.AddRange(new object[] {
            "Room Logic Controller",
            "RLC-I16",
            "RLC-I20",
            "Bedside-17T",
            "Bedside-12T",
            "BSP_R14_OL",
            "RCU-32AO",
            "RCU-8RL-24AO",
            "RCU-16RL-16AO",
            "RCU-24RL-8AO",
            "RCU-11IN-4RL",
            "RCU-21IN-8RL",
            "RCU-21IN-8RL-4AO",
            "RCU-21IN-8RL-4AI",
            "RCU-21IN-8RL-K",
            "RCU-21IN-8RL-DL",
            "RCU-21IN-10RL",
            "RCU-30IN-10RL",
            "RCU-48IN-16RL",
            "RCU-48IN-16RL-4AO",
            "RCU-48IN-16RL-4AI",
            "RCU-48IN-16RL-K",
            "RCU-48IN-16RL-DL",
            "GNT-EXT-6RL",
            "GNT-EXT-8RL",
            "GNT-EXT-12RL",
            "GNT-EXT-20RL",
            "GNT-EXT-10AO",
            "GNT-EXT-28AO",
            "GNT-EXT-12RL-12AO",
            "GNT-EXT-24IN",
            "GNT-EXT-48IN",
            "GNT-ETH2KDL"});
            this.cbx_Unit.Location = new System.Drawing.Point(131, 20);
            this.cbx_Unit.Margin = new System.Windows.Forms.Padding(4, 4, 4, 4);
            this.cbx_Unit.Name = "cbx_Unit";
            this.cbx_Unit.Size = new System.Drawing.Size(181, 24);
            this.cbx_Unit.TabIndex = 0;
            this.cbx_Unit.SelectedIndexChanged += new System.EventHandler(this.cbx_Unit_SelectedIndexChanged);
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Location = new System.Drawing.Point(23, 25);
            this.label1.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(37, 17);
            this.label1.TabIndex = 1;
            this.label1.Text = "Unit:";
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Location = new System.Drawing.Point(23, 64);
            this.label2.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(83, 17);
            this.label2.TabIndex = 2;
            this.label2.Text = "Description:";
            // 
            // txt_Des
            // 
            this.txt_Des.Location = new System.Drawing.Point(131, 59);
            this.txt_Des.Margin = new System.Windows.Forms.Padding(4, 4, 4, 4);
            this.txt_Des.Name = "txt_Des";
            this.txt_Des.Size = new System.Drawing.Size(181, 22);
            this.txt_Des.TabIndex = 3;
            this.txt_Des.Text = "No Description";
            // 
            // chk_LoadCan
            // 
            this.chk_LoadCan.AutoSize = true;
            this.chk_LoadCan.Location = new System.Drawing.Point(27, 255);
            this.chk_LoadCan.Margin = new System.Windows.Forms.Padding(4, 4, 4, 4);
            this.chk_LoadCan.Name = "chk_LoadCan";
            this.chk_LoadCan.Size = new System.Drawing.Size(139, 21);
            this.chk_LoadCan.TabIndex = 4;
            this.chk_LoadCan.Text = "Enable Load CAN";
            this.chk_LoadCan.UseVisualStyleBackColor = true;
            // 
            // rbtn_Master
            // 
            this.rbtn_Master.AutoSize = true;
            this.rbtn_Master.Location = new System.Drawing.Point(27, 209);
            this.rbtn_Master.Margin = new System.Windows.Forms.Padding(4, 4, 4, 4);
            this.rbtn_Master.Name = "rbtn_Master";
            this.rbtn_Master.Size = new System.Drawing.Size(69, 21);
            this.rbtn_Master.TabIndex = 5;
            this.rbtn_Master.Text = "Master";
            this.rbtn_Master.UseVisualStyleBackColor = true;
            this.rbtn_Master.CheckedChanged += new System.EventHandler(this.rbtn_Master_CheckedChanged);
            // 
            // rbtn_Slave
            // 
            this.rbtn_Slave.AutoSize = true;
            this.rbtn_Slave.Location = new System.Drawing.Point(132, 209);
            this.rbtn_Slave.Margin = new System.Windows.Forms.Padding(4, 4, 4, 4);
            this.rbtn_Slave.Name = "rbtn_Slave";
            this.rbtn_Slave.Size = new System.Drawing.Size(61, 21);
            this.rbtn_Slave.TabIndex = 6;
            this.rbtn_Slave.Text = "Slave";
            this.rbtn_Slave.UseVisualStyleBackColor = true;
            this.rbtn_Slave.CheckedChanged += new System.EventHandler(this.rbtn_Slave_CheckedChanged);
            // 
            // rbtn_Stand
            // 
            this.rbtn_Stand.AutoSize = true;
            this.rbtn_Stand.Location = new System.Drawing.Point(235, 209);
            this.rbtn_Stand.Margin = new System.Windows.Forms.Padding(4, 4, 4, 4);
            this.rbtn_Stand.Name = "rbtn_Stand";
            this.rbtn_Stand.Size = new System.Drawing.Size(104, 21);
            this.rbtn_Stand.TabIndex = 7;
            this.rbtn_Stand.Text = "Stand-Alone";
            this.rbtn_Stand.UseVisualStyleBackColor = true;
            this.rbtn_Stand.CheckedChanged += new System.EventHandler(this.rbtn_Stand_CheckedChanged);
            // 
            // btn_ok
            // 
            this.btn_ok.Location = new System.Drawing.Point(44, 341);
            this.btn_ok.Margin = new System.Windows.Forms.Padding(4, 4, 4, 4);
            this.btn_ok.Name = "btn_ok";
            this.btn_ok.Size = new System.Drawing.Size(100, 28);
            this.btn_ok.TabIndex = 10;
            this.btn_ok.Text = "OK";
            this.btn_ok.UseVisualStyleBackColor = true;
            this.btn_ok.Click += new System.EventHandler(this.btn_ok_Click);
            // 
            // button2
            // 
            this.button2.Location = new System.Drawing.Point(215, 341);
            this.button2.Margin = new System.Windows.Forms.Padding(4, 4, 4, 4);
            this.button2.Name = "button2";
            this.button2.Size = new System.Drawing.Size(100, 28);
            this.button2.TabIndex = 11;
            this.button2.Text = "Cancel";
            this.button2.UseVisualStyleBackColor = true;
            this.button2.Click += new System.EventHandler(this.button2_Click);
            // 
            // label4
            // 
            this.label4.AutoSize = true;
            this.label4.Location = new System.Drawing.Point(21, 133);
            this.label4.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label4.Name = "label4";
            this.label4.Size = new System.Drawing.Size(79, 17);
            this.label4.TabIndex = 12;
            this.label4.Text = "IP address:";
            // 
            // label5
            // 
            this.label5.AutoSize = true;
            this.label5.Location = new System.Drawing.Point(21, 174);
            this.label5.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label5.Name = "label5";
            this.label5.Size = new System.Drawing.Size(57, 17);
            this.label5.TabIndex = 14;
            this.label5.Text = "ID CAN:";
            // 
            // masktxt_Can
            // 
            this.masktxt_Can.HidePromptOnLeave = true;
            this.masktxt_Can.Location = new System.Drawing.Point(277, 169);
            this.masktxt_Can.Margin = new System.Windows.Forms.Padding(4, 4, 4, 4);
            this.masktxt_Can.Mask = "000";
            this.masktxt_Can.Name = "masktxt_Can";
            this.masktxt_Can.ResetOnPrompt = false;
            this.masktxt_Can.ResetOnSpace = false;
            this.masktxt_Can.Size = new System.Drawing.Size(32, 22);
            this.masktxt_Can.SkipLiterals = false;
            this.masktxt_Can.TabIndex = 36;
            this.masktxt_Can.Text = "1";
            this.masktxt_Can.TextAlign = System.Windows.Forms.HorizontalAlignment.Center;
            this.masktxt_Can.TextMaskFormat = System.Windows.Forms.MaskFormat.ExcludePromptAndLiterals;
            this.masktxt_Can.TextChanged += new System.EventHandler(this.maskedTextBox1_TextChanged);
            // 
            // t3
            // 
            this.t3.Enabled = false;
            this.t3.Location = new System.Drawing.Point(229, 169);
            this.t3.Margin = new System.Windows.Forms.Padding(4, 4, 4, 4);
            this.t3.Name = "t3";
            this.t3.Size = new System.Drawing.Size(32, 22);
            this.t3.TabIndex = 35;
            this.t3.Text = "0";
            this.t3.TextAlign = System.Windows.Forms.HorizontalAlignment.Center;
            // 
            // label8
            // 
            this.label8.AutoSize = true;
            this.label8.Font = new System.Drawing.Font("Times New Roman", 14.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label8.Location = new System.Drawing.Point(261, 169);
            this.label8.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label8.Name = "label8";
            this.label8.Size = new System.Drawing.Size(18, 25);
            this.label8.TabIndex = 33;
            this.label8.Text = ".";
            // 
            // label6
            // 
            this.label6.AutoSize = true;
            this.label6.Font = new System.Drawing.Font("Times New Roman", 14.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label6.Location = new System.Drawing.Point(215, 169);
            this.label6.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label6.Name = "label6";
            this.label6.Size = new System.Drawing.Size(18, 25);
            this.label6.TabIndex = 32;
            this.label6.Text = ".";
            // 
            // t2
            // 
            this.t2.Enabled = false;
            this.t2.Location = new System.Drawing.Point(180, 169);
            this.t2.Margin = new System.Windows.Forms.Padding(4, 4, 4, 4);
            this.t2.Name = "t2";
            this.t2.Size = new System.Drawing.Size(32, 22);
            this.t2.TabIndex = 31;
            this.t2.Text = "0";
            this.t2.TextAlign = System.Windows.Forms.HorizontalAlignment.Center;
            // 
            // label3
            // 
            this.label3.AutoSize = true;
            this.label3.Font = new System.Drawing.Font("Times New Roman", 14.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label3.Location = new System.Drawing.Point(165, 169);
            this.label3.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(18, 25);
            this.label3.TabIndex = 30;
            this.label3.Text = ".";
            // 
            // t1
            // 
            this.t1.Enabled = false;
            this.t1.Location = new System.Drawing.Point(131, 169);
            this.t1.Margin = new System.Windows.Forms.Padding(4, 4, 4, 4);
            this.t1.Name = "t1";
            this.t1.Size = new System.Drawing.Size(32, 22);
            this.t1.TabIndex = 29;
            this.t1.Text = "0";
            this.t1.TextAlign = System.Windows.Forms.HorizontalAlignment.Center;
            // 
            // masktxt_IP_low
            // 
            this.masktxt_IP_low.HidePromptOnLeave = true;
            this.masktxt_IP_low.Location = new System.Drawing.Point(277, 128);
            this.masktxt_IP_low.Margin = new System.Windows.Forms.Padding(4, 4, 4, 4);
            this.masktxt_IP_low.Mask = "000";
            this.masktxt_IP_low.Name = "masktxt_IP_low";
            this.masktxt_IP_low.ResetOnPrompt = false;
            this.masktxt_IP_low.ResetOnSpace = false;
            this.masktxt_IP_low.Size = new System.Drawing.Size(32, 22);
            this.masktxt_IP_low.SkipLiterals = false;
            this.masktxt_IP_low.TabIndex = 43;
            this.masktxt_IP_low.Text = "2";
            this.masktxt_IP_low.TextAlign = System.Windows.Forms.HorizontalAlignment.Center;
            this.masktxt_IP_low.TextMaskFormat = System.Windows.Forms.MaskFormat.ExcludePromptAndLiterals;
            this.masktxt_IP_low.TextChanged += new System.EventHandler(this.masktxt_IP_low_TextChanged);
            // 
            // label9
            // 
            this.label9.AutoSize = true;
            this.label9.Font = new System.Drawing.Font("Times New Roman", 14.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label9.Location = new System.Drawing.Point(261, 128);
            this.label9.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label9.Name = "label9";
            this.label9.Size = new System.Drawing.Size(18, 25);
            this.label9.TabIndex = 41;
            this.label9.Text = ".";
            // 
            // label10
            // 
            this.label10.AutoSize = true;
            this.label10.Font = new System.Drawing.Font("Times New Roman", 14.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label10.Location = new System.Drawing.Point(215, 128);
            this.label10.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label10.Name = "label10";
            this.label10.Size = new System.Drawing.Size(18, 25);
            this.label10.TabIndex = 40;
            this.label10.Text = ".";
            // 
            // label11
            // 
            this.label11.AutoSize = true;
            this.label11.Font = new System.Drawing.Font("Times New Roman", 14.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label11.Location = new System.Drawing.Point(165, 128);
            this.label11.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label11.Name = "label11";
            this.label11.Size = new System.Drawing.Size(18, 25);
            this.label11.TabIndex = 38;
            this.label11.Text = ".";
            // 
            // masktxt_IP_high
            // 
            this.masktxt_IP_high.HidePromptOnLeave = true;
            this.masktxt_IP_high.Location = new System.Drawing.Point(229, 128);
            this.masktxt_IP_high.Margin = new System.Windows.Forms.Padding(4, 4, 4, 4);
            this.masktxt_IP_high.Mask = "000";
            this.masktxt_IP_high.Name = "masktxt_IP_high";
            this.masktxt_IP_high.ResetOnPrompt = false;
            this.masktxt_IP_high.ResetOnSpace = false;
            this.masktxt_IP_high.Size = new System.Drawing.Size(32, 22);
            this.masktxt_IP_high.SkipLiterals = false;
            this.masktxt_IP_high.TabIndex = 44;
            this.masktxt_IP_high.Text = "0";
            this.masktxt_IP_high.TextAlign = System.Windows.Forms.HorizontalAlignment.Center;
            this.masktxt_IP_high.TextMaskFormat = System.Windows.Forms.MaskFormat.ExcludePromptAndLiterals;
            this.masktxt_IP_high.TextChanged += new System.EventHandler(this.masktxt_IP_high_TextChanged);
            // 
            // label7
            // 
            this.label7.AutoSize = true;
            this.label7.Location = new System.Drawing.Point(327, 174);
            this.label7.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label7.Name = "label7";
            this.label7.Size = new System.Drawing.Size(45, 17);
            this.label7.TabIndex = 34;
            this.label7.Text = "1-255";
            // 
            // chk_Recovery
            // 
            this.chk_Recovery.AutoSize = true;
            this.chk_Recovery.Location = new System.Drawing.Point(184, 255);
            this.chk_Recovery.Margin = new System.Windows.Forms.Padding(4, 4, 4, 4);
            this.chk_Recovery.Name = "chk_Recovery";
            this.chk_Recovery.Size = new System.Drawing.Size(185, 21);
            this.chk_Recovery.TabIndex = 45;
            this.chk_Recovery.Text = "Recover when Power Cut";
            this.chk_Recovery.UseVisualStyleBackColor = true;
            // 
            // txt_FwVersion
            // 
            this.txt_FwVersion.Location = new System.Drawing.Point(131, 94);
            this.txt_FwVersion.Margin = new System.Windows.Forms.Padding(4, 4, 4, 4);
            this.txt_FwVersion.Name = "txt_FwVersion";
            this.txt_FwVersion.Size = new System.Drawing.Size(181, 22);
            this.txt_FwVersion.TabIndex = 47;
            this.txt_FwVersion.Text = "2.0.0";
            // 
            // label12
            // 
            this.label12.AutoSize = true;
            this.label12.Location = new System.Drawing.Point(23, 98);
            this.label12.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label12.Name = "label12";
            this.label12.Size = new System.Drawing.Size(85, 17);
            this.label12.TabIndex = 46;
            this.label12.Text = "FW Version:";
            // 
            // txtIpMaskLayerLow
            // 
            this.txtIpMaskLayerLow.HidePromptOnLeave = true;
            this.txtIpMaskLayerLow.Location = new System.Drawing.Point(181, 128);
            this.txtIpMaskLayerLow.Margin = new System.Windows.Forms.Padding(4, 4, 4, 4);
            this.txtIpMaskLayerLow.Mask = "000";
            this.txtIpMaskLayerLow.Name = "txtIpMaskLayerLow";
            this.txtIpMaskLayerLow.ResetOnPrompt = false;
            this.txtIpMaskLayerLow.ResetOnSpace = false;
            this.txtIpMaskLayerLow.Size = new System.Drawing.Size(32, 22);
            this.txtIpMaskLayerLow.SkipLiterals = false;
            this.txtIpMaskLayerLow.TabIndex = 48;
            this.txtIpMaskLayerLow.Text = "0";
            this.txtIpMaskLayerLow.TextAlign = System.Windows.Forms.HorizontalAlignment.Center;
            this.txtIpMaskLayerLow.TextMaskFormat = System.Windows.Forms.MaskFormat.ExcludePromptAndLiterals;
            this.txtIpMaskLayerLow.TextChanged += new System.EventHandler(this.txtIpMaskLayerLow_TextChanged);
            // 
            // txtIpMaskLayerHigh
            // 
            this.txtIpMaskLayerHigh.HidePromptOnLeave = true;
            this.txtIpMaskLayerHigh.Location = new System.Drawing.Point(133, 128);
            this.txtIpMaskLayerHigh.Margin = new System.Windows.Forms.Padding(4, 4, 4, 4);
            this.txtIpMaskLayerHigh.Mask = "000";
            this.txtIpMaskLayerHigh.Name = "txtIpMaskLayerHigh";
            this.txtIpMaskLayerHigh.ResetOnPrompt = false;
            this.txtIpMaskLayerHigh.ResetOnSpace = false;
            this.txtIpMaskLayerHigh.Size = new System.Drawing.Size(32, 22);
            this.txtIpMaskLayerHigh.SkipLiterals = false;
            this.txtIpMaskLayerHigh.TabIndex = 49;
            this.txtIpMaskLayerHigh.Text = "2";
            this.txtIpMaskLayerHigh.TextAlign = System.Windows.Forms.HorizontalAlignment.Center;
            this.txtIpMaskLayerHigh.TextMaskFormat = System.Windows.Forms.MaskFormat.ExcludePromptAndLiterals;
            this.txtIpMaskLayerHigh.TextChanged += new System.EventHandler(this.txtIpMaskLayerHigh_TextChanged);
            // 
            // RS485_cfg_btn
            // 
            this.RS485_cfg_btn.Location = new System.Drawing.Point(27, 283);
            this.RS485_cfg_btn.Margin = new System.Windows.Forms.Padding(4, 4, 4, 4);
            this.RS485_cfg_btn.Name = "RS485_cfg_btn";
            this.RS485_cfg_btn.Size = new System.Drawing.Size(319, 28);
            this.RS485_cfg_btn.TabIndex = 50;
            this.RS485_cfg_btn.Text = "RS485 Config";
            this.RS485_cfg_btn.UseVisualStyleBackColor = true;
            this.RS485_cfg_btn.Click += new System.EventHandler(this.RS485_cfg_btn_Click);
            // 
            // Add_Unit
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(8F, 16F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(380, 389);
            this.Controls.Add(this.RS485_cfg_btn);
            this.Controls.Add(this.txtIpMaskLayerHigh);
            this.Controls.Add(this.txtIpMaskLayerLow);
            this.Controls.Add(this.txt_FwVersion);
            this.Controls.Add(this.label12);
            this.Controls.Add(this.chk_Recovery);
            this.Controls.Add(this.masktxt_IP_high);
            this.Controls.Add(this.masktxt_IP_low);
            this.Controls.Add(this.label9);
            this.Controls.Add(this.label10);
            this.Controls.Add(this.label11);
            this.Controls.Add(this.masktxt_Can);
            this.Controls.Add(this.t3);
            this.Controls.Add(this.label7);
            this.Controls.Add(this.label8);
            this.Controls.Add(this.label6);
            this.Controls.Add(this.t2);
            this.Controls.Add(this.label3);
            this.Controls.Add(this.t1);
            this.Controls.Add(this.label5);
            this.Controls.Add(this.label4);
            this.Controls.Add(this.button2);
            this.Controls.Add(this.btn_ok);
            this.Controls.Add(this.rbtn_Stand);
            this.Controls.Add(this.rbtn_Slave);
            this.Controls.Add(this.rbtn_Master);
            this.Controls.Add(this.chk_LoadCan);
            this.Controls.Add(this.txt_Des);
            this.Controls.Add(this.label2);
            this.Controls.Add(this.label1);
            this.Controls.Add(this.cbx_Unit);
            this.Margin = new System.Windows.Forms.Padding(4, 4, 4, 4);
            this.MaximizeBox = false;
            this.Name = "Add_Unit";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "Add_Unit";
            this.FormClosed += new System.Windows.Forms.FormClosedEventHandler(this.Add_Unit_FormClosed);
            this.Load += new System.EventHandler(this.Add_Unit_Load);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.ComboBox cbx_Unit;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.TextBox txt_Des;
        private System.Windows.Forms.CheckBox chk_LoadCan;
        private System.Windows.Forms.RadioButton rbtn_Master;
        private System.Windows.Forms.RadioButton rbtn_Slave;
        private System.Windows.Forms.RadioButton rbtn_Stand;
        private System.Windows.Forms.Button btn_ok;
        private System.Windows.Forms.Button button2;
        private System.Windows.Forms.Label label4;
        private System.Windows.Forms.Label label5;
        private System.Windows.Forms.MaskedTextBox masktxt_Can;
        private System.Windows.Forms.TextBox t3;
        private System.Windows.Forms.Label label8;
        private System.Windows.Forms.Label label6;
        private System.Windows.Forms.TextBox t2;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.TextBox t1;
        private System.Windows.Forms.MaskedTextBox masktxt_IP_low;
        private System.Windows.Forms.Label label9;
        private System.Windows.Forms.Label label10;
        private System.Windows.Forms.Label label11;
        private System.Windows.Forms.MaskedTextBox masktxt_IP_high;
        private System.Windows.Forms.Label label7;
        private System.Windows.Forms.CheckBox chk_Recovery;
        private System.Windows.Forms.TextBox txt_FwVersion;
        private System.Windows.Forms.Label label12;
        private System.Windows.Forms.MaskedTextBox txtIpMaskLayerLow;
        private System.Windows.Forms.MaskedTextBox txtIpMaskLayerHigh;
        private System.Windows.Forms.Button RS485_cfg_btn;
    }
}