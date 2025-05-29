namespace RLC
{
    partial class AC_Out_Cfg
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
            this.cbx_fan_type = new System.Windows.Forms.ComboBox();
            this.cbx_windows_mode = new System.Windows.Forms.ComboBox();
            this.cbx_valve_contact = new System.Windows.Forms.ComboBox();
            this.btn_cancel = new System.Windows.Forms.Button();
            this.btn_OK = new System.Windows.Forms.Button();
            this.label1 = new System.Windows.Forms.Label();
            this.cbx_temp_unit = new System.Windows.Forms.ComboBox();
            this.label2 = new System.Windows.Forms.Label();
            this.cbx_temp_type = new System.Windows.Forms.ComboBox();
            this.label3 = new System.Windows.Forms.Label();
            this.chk_enable = new System.Windows.Forms.CheckBox();
            this.label4 = new System.Windows.Forms.Label();
            this.label6 = new System.Windows.Forms.Label();
            this.label7 = new System.Windows.Forms.Label();
            this.panel_ac_cfg = new System.Windows.Forms.Panel();
            this.cbx_heat_close = new System.Windows.Forms.ComboBox();
            this.label26 = new System.Windows.Forms.Label();
            this.cbx_windows = new System.Windows.Forms.ComboBox();
            this.label21 = new System.Windows.Forms.Label();
            this.cbx_heat_open = new System.Windows.Forms.ComboBox();
            this.label18 = new System.Windows.Forms.Label();
            this.cbx_cool_close = new System.Windows.Forms.ComboBox();
            this.label19 = new System.Windows.Forms.Label();
            this.cbx_cool_open = new System.Windows.Forms.ComboBox();
            this.label20 = new System.Windows.Forms.Label();
            this.cbx_analog_heat = new System.Windows.Forms.ComboBox();
            this.label15 = new System.Windows.Forms.Label();
            this.cbx_analog_cool = new System.Windows.Forms.ComboBox();
            this.label16 = new System.Windows.Forms.Label();
            this.cbx_analog_fan = new System.Windows.Forms.ComboBox();
            this.label17 = new System.Windows.Forms.Label();
            this.cbx_high_fan = new System.Windows.Forms.ComboBox();
            this.label14 = new System.Windows.Forms.Label();
            this.cbx_med_fan = new System.Windows.Forms.ComboBox();
            this.label9 = new System.Windows.Forms.Label();
            this.cbx_low_fan = new System.Windows.Forms.ComboBox();
            this.label8 = new System.Windows.Forms.Label();
            this.cbx_dead_band = new System.Windows.Forms.ComboBox();
            this.label5 = new System.Windows.Forms.Label();
            this.cbx_valve_type = new System.Windows.Forms.ComboBox();
            this.label13 = new System.Windows.Forms.Label();
            this.label11 = new System.Windows.Forms.Label();
            this.label10 = new System.Windows.Forms.Label();
            this.label12 = new System.Windows.Forms.Label();
            this.tt_group_inf = new System.Windows.Forms.ToolTip(this.components);
            this.panel_ac_cfg.SuspendLayout();
            this.SuspendLayout();
            // 
            // cbx_fan_type
            // 
            this.cbx_fan_type.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbx_fan_type.FormattingEnabled = true;
            this.cbx_fan_type.Items.AddRange(new object[] {
            "On/Off",
            "Analog"});
            this.cbx_fan_type.Location = new System.Drawing.Point(291, 25);
            this.cbx_fan_type.Margin = new System.Windows.Forms.Padding(4);
            this.cbx_fan_type.Name = "cbx_fan_type";
            this.cbx_fan_type.Size = new System.Drawing.Size(100, 24);
            this.cbx_fan_type.TabIndex = 42;
            // 
            // cbx_windows_mode
            // 
            this.cbx_windows_mode.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbx_windows_mode.FormattingEnabled = true;
            this.cbx_windows_mode.Items.AddRange(new object[] {
            "Off",
            "Save energy"});
            this.cbx_windows_mode.Location = new System.Drawing.Point(109, 25);
            this.cbx_windows_mode.Margin = new System.Windows.Forms.Padding(4);
            this.cbx_windows_mode.Name = "cbx_windows_mode";
            this.cbx_windows_mode.Size = new System.Drawing.Size(85, 24);
            this.cbx_windows_mode.TabIndex = 40;
            // 
            // cbx_valve_contact
            // 
            this.cbx_valve_contact.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbx_valve_contact.FormattingEnabled = true;
            this.cbx_valve_contact.Items.AddRange(new object[] {
            "NO",
            "NC"});
            this.cbx_valve_contact.Location = new System.Drawing.Point(312, 69);
            this.cbx_valve_contact.Margin = new System.Windows.Forms.Padding(4);
            this.cbx_valve_contact.Name = "cbx_valve_contact";
            this.cbx_valve_contact.Size = new System.Drawing.Size(79, 24);
            this.cbx_valve_contact.TabIndex = 47;
            // 
            // btn_cancel
            // 
            this.btn_cancel.Location = new System.Drawing.Point(353, 428);
            this.btn_cancel.Margin = new System.Windows.Forms.Padding(4);
            this.btn_cancel.Name = "btn_cancel";
            this.btn_cancel.Size = new System.Drawing.Size(195, 43);
            this.btn_cancel.TabIndex = 54;
            this.btn_cancel.Text = "Cancel";
            this.btn_cancel.UseVisualStyleBackColor = true;
            this.btn_cancel.Click += new System.EventHandler(this.btn_cancel_Click);
            // 
            // btn_OK
            // 
            this.btn_OK.Location = new System.Drawing.Point(43, 428);
            this.btn_OK.Margin = new System.Windows.Forms.Padding(4);
            this.btn_OK.Name = "btn_OK";
            this.btn_OK.Size = new System.Drawing.Size(195, 43);
            this.btn_OK.TabIndex = 53;
            this.btn_OK.Text = "OK";
            this.btn_OK.UseVisualStyleBackColor = true;
            this.btn_OK.Click += new System.EventHandler(this.btn_OK_Click);
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Location = new System.Drawing.Point(4, 28);
            this.label1.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(103, 17);
            this.label1.TabIndex = 55;
            this.label1.Text = "Windows mode";
            // 
            // cbx_temp_unit
            // 
            this.cbx_temp_unit.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbx_temp_unit.FormattingEnabled = true;
            this.cbx_temp_unit.Items.AddRange(new object[] {
            "°C",
            "°F"});
            this.cbx_temp_unit.Location = new System.Drawing.Point(93, 69);
            this.cbx_temp_unit.Margin = new System.Windows.Forms.Padding(4);
            this.cbx_temp_unit.Name = "cbx_temp_unit";
            this.cbx_temp_unit.Size = new System.Drawing.Size(101, 24);
            this.cbx_temp_unit.TabIndex = 56;
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Location = new System.Drawing.Point(203, 28);
            this.label2.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(63, 17);
            this.label2.TabIndex = 57;
            this.label2.Text = "Fan type";
            // 
            // cbx_temp_type
            // 
            this.cbx_temp_type.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbx_temp_type.FormattingEnabled = true;
            this.cbx_temp_type.Items.AddRange(new object[] {
            "Thermostat",
            "RCU"});
            this.cbx_temp_type.Location = new System.Drawing.Point(489, 25);
            this.cbx_temp_type.Margin = new System.Windows.Forms.Padding(4);
            this.cbx_temp_type.Name = "cbx_temp_type";
            this.cbx_temp_type.Size = new System.Drawing.Size(104, 24);
            this.cbx_temp_type.TabIndex = 58;
            // 
            // label3
            // 
            this.label3.AutoSize = true;
            this.label3.Location = new System.Drawing.Point(307, 98);
            this.label3.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(0, 17);
            this.label3.TabIndex = 59;
            // 
            // chk_enable
            // 
            this.chk_enable.AutoSize = true;
            this.chk_enable.Location = new System.Drawing.Point(8, 17);
            this.chk_enable.Margin = new System.Windows.Forms.Padding(4);
            this.chk_enable.Name = "chk_enable";
            this.chk_enable.Size = new System.Drawing.Size(71, 21);
            this.chk_enable.TabIndex = 60;
            this.chk_enable.Text = "Enable";
            this.chk_enable.UseVisualStyleBackColor = true;
            this.chk_enable.CheckedChanged += new System.EventHandler(this.chk_enable_CheckedChanged);
            // 
            // label4
            // 
            this.label4.AutoSize = true;
            this.label4.Location = new System.Drawing.Point(16, 149);
            this.label4.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label4.Name = "label4";
            this.label4.Size = new System.Drawing.Size(103, 17);
            this.label4.TabIndex = 61;
            this.label4.Text = "Schedule on at";
            // 
            // label6
            // 
            this.label6.AutoSize = true;
            this.label6.Location = new System.Drawing.Point(200, 150);
            this.label6.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label6.Name = "label6";
            this.label6.Size = new System.Drawing.Size(37, 17);
            this.label6.TabIndex = 64;
            this.label6.Text = "hour";
            // 
            // label7
            // 
            this.label7.AutoSize = true;
            this.label7.Location = new System.Drawing.Point(303, 150);
            this.label7.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label7.Name = "label7";
            this.label7.Size = new System.Drawing.Size(30, 17);
            this.label7.TabIndex = 66;
            this.label7.Text = "min";
            // 
            // panel_ac_cfg
            // 
            this.panel_ac_cfg.Controls.Add(this.cbx_heat_close);
            this.panel_ac_cfg.Controls.Add(this.label26);
            this.panel_ac_cfg.Controls.Add(this.cbx_windows);
            this.panel_ac_cfg.Controls.Add(this.label21);
            this.panel_ac_cfg.Controls.Add(this.cbx_heat_open);
            this.panel_ac_cfg.Controls.Add(this.label18);
            this.panel_ac_cfg.Controls.Add(this.cbx_cool_close);
            this.panel_ac_cfg.Controls.Add(this.label19);
            this.panel_ac_cfg.Controls.Add(this.cbx_cool_open);
            this.panel_ac_cfg.Controls.Add(this.label20);
            this.panel_ac_cfg.Controls.Add(this.cbx_analog_heat);
            this.panel_ac_cfg.Controls.Add(this.label15);
            this.panel_ac_cfg.Controls.Add(this.cbx_analog_cool);
            this.panel_ac_cfg.Controls.Add(this.label16);
            this.panel_ac_cfg.Controls.Add(this.cbx_analog_fan);
            this.panel_ac_cfg.Controls.Add(this.label17);
            this.panel_ac_cfg.Controls.Add(this.cbx_high_fan);
            this.panel_ac_cfg.Controls.Add(this.label14);
            this.panel_ac_cfg.Controls.Add(this.cbx_med_fan);
            this.panel_ac_cfg.Controls.Add(this.label9);
            this.panel_ac_cfg.Controls.Add(this.cbx_low_fan);
            this.panel_ac_cfg.Controls.Add(this.label8);
            this.panel_ac_cfg.Controls.Add(this.cbx_dead_band);
            this.panel_ac_cfg.Controls.Add(this.label5);
            this.panel_ac_cfg.Controls.Add(this.cbx_valve_type);
            this.panel_ac_cfg.Controls.Add(this.label13);
            this.panel_ac_cfg.Controls.Add(this.label11);
            this.panel_ac_cfg.Controls.Add(this.cbx_windows_mode);
            this.panel_ac_cfg.Controls.Add(this.cbx_temp_unit);
            this.panel_ac_cfg.Controls.Add(this.cbx_fan_type);
            this.panel_ac_cfg.Controls.Add(this.cbx_temp_type);
            this.panel_ac_cfg.Controls.Add(this.label2);
            this.panel_ac_cfg.Controls.Add(this.label10);
            this.panel_ac_cfg.Controls.Add(this.cbx_valve_contact);
            this.panel_ac_cfg.Controls.Add(this.label12);
            this.panel_ac_cfg.Controls.Add(this.label1);
            this.panel_ac_cfg.Location = new System.Drawing.Point(0, 42);
            this.panel_ac_cfg.Margin = new System.Windows.Forms.Padding(4);
            this.panel_ac_cfg.Name = "panel_ac_cfg";
            this.panel_ac_cfg.Size = new System.Drawing.Size(604, 378);
            this.panel_ac_cfg.TabIndex = 71;
            // 
            // cbx_heat_close
            // 
            this.cbx_heat_close.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbx_heat_close.FormattingEnabled = true;
            this.cbx_heat_close.Location = new System.Drawing.Point(489, 247);
            this.cbx_heat_close.Margin = new System.Windows.Forms.Padding(4);
            this.cbx_heat_close.Name = "cbx_heat_close";
            this.cbx_heat_close.Size = new System.Drawing.Size(104, 24);
            this.cbx_heat_close.TabIndex = 96;
            this.cbx_heat_close.MouseHover += new System.EventHandler(this.Tooltip_description);
            // 
            // label26
            // 
            this.label26.AutoSize = true;
            this.label26.Location = new System.Drawing.Point(404, 251);
            this.label26.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label26.Name = "label26";
            this.label26.Size = new System.Drawing.Size(75, 17);
            this.label26.TabIndex = 95;
            this.label26.Text = "Heat close";
            // 
            // cbx_windows
            // 
            this.cbx_windows.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbx_windows.FormattingEnabled = true;
            this.cbx_windows.Items.AddRange(new object[] {
            "Normal",
            "Bypass"});
            this.cbx_windows.Location = new System.Drawing.Point(289, 114);
            this.cbx_windows.Margin = new System.Windows.Forms.Padding(4);
            this.cbx_windows.Name = "cbx_windows";
            this.cbx_windows.Size = new System.Drawing.Size(100, 24);
            this.cbx_windows.TabIndex = 85;
            // 
            // label21
            // 
            this.label21.AutoSize = true;
            this.label21.Location = new System.Drawing.Point(203, 118);
            this.label21.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label21.Name = "label21";
            this.label21.Size = new System.Drawing.Size(64, 17);
            this.label21.TabIndex = 84;
            this.label21.Text = "Windows";
            // 
            // cbx_heat_open
            // 
            this.cbx_heat_open.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbx_heat_open.FormattingEnabled = true;
            this.cbx_heat_open.Location = new System.Drawing.Point(489, 202);
            this.cbx_heat_open.Margin = new System.Windows.Forms.Padding(4);
            this.cbx_heat_open.Name = "cbx_heat_open";
            this.cbx_heat_open.Size = new System.Drawing.Size(104, 24);
            this.cbx_heat_open.TabIndex = 83;
            this.cbx_heat_open.MouseHover += new System.EventHandler(this.Tooltip_description);
            // 
            // label18
            // 
            this.label18.AutoSize = true;
            this.label18.Location = new System.Drawing.Point(404, 206);
            this.label18.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label18.Name = "label18";
            this.label18.Size = new System.Drawing.Size(74, 17);
            this.label18.TabIndex = 82;
            this.label18.Text = "Heat open";
            // 
            // cbx_cool_close
            // 
            this.cbx_cool_close.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbx_cool_close.FormattingEnabled = true;
            this.cbx_cool_close.Location = new System.Drawing.Point(487, 159);
            this.cbx_cool_close.Margin = new System.Windows.Forms.Padding(4);
            this.cbx_cool_close.Name = "cbx_cool_close";
            this.cbx_cool_close.Size = new System.Drawing.Size(107, 24);
            this.cbx_cool_close.TabIndex = 81;
            this.cbx_cool_close.MouseHover += new System.EventHandler(this.Tooltip_description);
            // 
            // label19
            // 
            this.label19.AutoSize = true;
            this.label19.Location = new System.Drawing.Point(404, 162);
            this.label19.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label19.Name = "label19";
            this.label19.Size = new System.Drawing.Size(73, 17);
            this.label19.TabIndex = 80;
            this.label19.Text = "Cool close";
            // 
            // cbx_cool_open
            // 
            this.cbx_cool_open.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbx_cool_open.FormattingEnabled = true;
            this.cbx_cool_open.Location = new System.Drawing.Point(489, 114);
            this.cbx_cool_open.Margin = new System.Windows.Forms.Padding(4);
            this.cbx_cool_open.Name = "cbx_cool_open";
            this.cbx_cool_open.Size = new System.Drawing.Size(104, 24);
            this.cbx_cool_open.TabIndex = 79;
            this.cbx_cool_open.MouseHover += new System.EventHandler(this.Tooltip_description);
            // 
            // label20
            // 
            this.label20.AutoSize = true;
            this.label20.Location = new System.Drawing.Point(404, 118);
            this.label20.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label20.Name = "label20";
            this.label20.Size = new System.Drawing.Size(72, 17);
            this.label20.TabIndex = 78;
            this.label20.Text = "Cool open";
            // 
            // cbx_analog_heat
            // 
            this.cbx_analog_heat.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbx_analog_heat.FormattingEnabled = true;
            this.cbx_analog_heat.Location = new System.Drawing.Point(289, 247);
            this.cbx_analog_heat.Margin = new System.Windows.Forms.Padding(4);
            this.cbx_analog_heat.Name = "cbx_analog_heat";
            this.cbx_analog_heat.Size = new System.Drawing.Size(101, 24);
            this.cbx_analog_heat.TabIndex = 77;
            this.cbx_analog_heat.MouseHover += new System.EventHandler(this.Tooltip_description);
            // 
            // label15
            // 
            this.label15.AutoSize = true;
            this.label15.Location = new System.Drawing.Point(203, 251);
            this.label15.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label15.Name = "label15";
            this.label15.Size = new System.Drawing.Size(84, 17);
            this.label15.TabIndex = 76;
            this.label15.Text = "Analog heat";
            // 
            // cbx_analog_cool
            // 
            this.cbx_analog_cool.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbx_analog_cool.FormattingEnabled = true;
            this.cbx_analog_cool.Location = new System.Drawing.Point(289, 202);
            this.cbx_analog_cool.Margin = new System.Windows.Forms.Padding(4);
            this.cbx_analog_cool.Name = "cbx_analog_cool";
            this.cbx_analog_cool.Size = new System.Drawing.Size(101, 24);
            this.cbx_analog_cool.TabIndex = 75;
            this.cbx_analog_cool.MouseHover += new System.EventHandler(this.Tooltip_description);
            // 
            // label16
            // 
            this.label16.AutoSize = true;
            this.label16.Location = new System.Drawing.Point(203, 206);
            this.label16.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label16.Name = "label16";
            this.label16.Size = new System.Drawing.Size(82, 17);
            this.label16.TabIndex = 74;
            this.label16.Text = "Analog cool";
            // 
            // cbx_analog_fan
            // 
            this.cbx_analog_fan.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbx_analog_fan.FormattingEnabled = true;
            this.cbx_analog_fan.Location = new System.Drawing.Point(289, 159);
            this.cbx_analog_fan.Margin = new System.Windows.Forms.Padding(4);
            this.cbx_analog_fan.Name = "cbx_analog_fan";
            this.cbx_analog_fan.Size = new System.Drawing.Size(101, 24);
            this.cbx_analog_fan.TabIndex = 73;
            this.cbx_analog_fan.MouseHover += new System.EventHandler(this.Tooltip_description);
            // 
            // label17
            // 
            this.label17.AutoSize = true;
            this.label17.Location = new System.Drawing.Point(203, 162);
            this.label17.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label17.Name = "label17";
            this.label17.Size = new System.Drawing.Size(76, 17);
            this.label17.TabIndex = 72;
            this.label17.Text = "Analog fan";
            // 
            // cbx_high_fan
            // 
            this.cbx_high_fan.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbx_high_fan.FormattingEnabled = true;
            this.cbx_high_fan.Location = new System.Drawing.Point(93, 247);
            this.cbx_high_fan.Margin = new System.Windows.Forms.Padding(4);
            this.cbx_high_fan.Name = "cbx_high_fan";
            this.cbx_high_fan.Size = new System.Drawing.Size(101, 24);
            this.cbx_high_fan.TabIndex = 71;
            this.cbx_high_fan.MouseHover += new System.EventHandler(this.Tooltip_description);
            // 
            // label14
            // 
            this.label14.AutoSize = true;
            this.label14.Location = new System.Drawing.Point(4, 251);
            this.label14.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label14.Name = "label14";
            this.label14.Size = new System.Drawing.Size(61, 17);
            this.label14.TabIndex = 70;
            this.label14.Text = "High fan";
            // 
            // cbx_med_fan
            // 
            this.cbx_med_fan.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbx_med_fan.FormattingEnabled = true;
            this.cbx_med_fan.Location = new System.Drawing.Point(93, 202);
            this.cbx_med_fan.Margin = new System.Windows.Forms.Padding(4);
            this.cbx_med_fan.Name = "cbx_med_fan";
            this.cbx_med_fan.Size = new System.Drawing.Size(101, 24);
            this.cbx_med_fan.TabIndex = 69;
            this.cbx_med_fan.MouseHover += new System.EventHandler(this.Tooltip_description);
            // 
            // label9
            // 
            this.label9.AutoSize = true;
            this.label9.Location = new System.Drawing.Point(4, 206);
            this.label9.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label9.Name = "label9";
            this.label9.Size = new System.Drawing.Size(59, 17);
            this.label9.TabIndex = 67;
            this.label9.Text = "Med fan";
            // 
            // cbx_low_fan
            // 
            this.cbx_low_fan.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbx_low_fan.FormattingEnabled = true;
            this.cbx_low_fan.Location = new System.Drawing.Point(93, 159);
            this.cbx_low_fan.Margin = new System.Windows.Forms.Padding(4);
            this.cbx_low_fan.Name = "cbx_low_fan";
            this.cbx_low_fan.Size = new System.Drawing.Size(101, 24);
            this.cbx_low_fan.TabIndex = 66;
            this.cbx_low_fan.MouseHover += new System.EventHandler(this.Tooltip_description);
            // 
            // label8
            // 
            this.label8.AutoSize = true;
            this.label8.Location = new System.Drawing.Point(4, 162);
            this.label8.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label8.Name = "label8";
            this.label8.Size = new System.Drawing.Size(57, 17);
            this.label8.TabIndex = 65;
            this.label8.Text = "Low fan";
            // 
            // cbx_dead_band
            // 
            this.cbx_dead_band.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbx_dead_band.FormattingEnabled = true;
            this.cbx_dead_band.Items.AddRange(new object[] {
            "1.0",
            "1.5",
            "2.0",
            "2.5",
            "3.0",
            "3.5",
            "4.0",
            "4.5",
            "5.0",
            "5.5",
            "6.0",
            "6.5",
            "7.0",
            "7.5",
            "8.0",
            "8.5",
            "9.0",
            "9.5",
            "10"});
            this.cbx_dead_band.Location = new System.Drawing.Point(93, 114);
            this.cbx_dead_band.Margin = new System.Windows.Forms.Padding(4);
            this.cbx_dead_band.Name = "cbx_dead_band";
            this.cbx_dead_band.Size = new System.Drawing.Size(101, 24);
            this.cbx_dead_band.TabIndex = 64;
            this.cbx_dead_band.SelectedIndexChanged += new System.EventHandler(this.cbx_dead_band_SelectedIndexChanged);
            // 
            // label5
            // 
            this.label5.AutoSize = true;
            this.label5.Location = new System.Drawing.Point(4, 118);
            this.label5.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label5.Name = "label5";
            this.label5.Size = new System.Drawing.Size(78, 17);
            this.label5.TabIndex = 63;
            this.label5.Text = "Dead band";
            // 
            // cbx_valve_type
            // 
            this.cbx_valve_type.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            this.cbx_valve_type.FormattingEnabled = true;
            this.cbx_valve_type.Items.AddRange(new object[] {
            "On/Off",
            "Analog",
            "On and Off"});
            this.cbx_valve_type.Location = new System.Drawing.Point(489, 69);
            this.cbx_valve_type.Margin = new System.Windows.Forms.Padding(4);
            this.cbx_valve_type.Name = "cbx_valve_type";
            this.cbx_valve_type.Size = new System.Drawing.Size(104, 24);
            this.cbx_valve_type.TabIndex = 62;
            // 
            // label13
            // 
            this.label13.AutoSize = true;
            this.label13.Location = new System.Drawing.Point(404, 73);
            this.label13.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label13.Name = "label13";
            this.label13.Size = new System.Drawing.Size(74, 17);
            this.label13.TabIndex = 61;
            this.label13.Text = "Valve type";
            // 
            // label11
            // 
            this.label11.AutoSize = true;
            this.label11.Location = new System.Drawing.Point(4, 73);
            this.label11.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label11.Name = "label11";
            this.label11.Size = new System.Drawing.Size(73, 17);
            this.label11.TabIndex = 59;
            this.label11.Text = "Temp Unit";
            // 
            // label10
            // 
            this.label10.AutoSize = true;
            this.label10.Location = new System.Drawing.Point(404, 28);
            this.label10.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label10.Name = "label10";
            this.label10.Size = new System.Drawing.Size(75, 17);
            this.label10.TabIndex = 58;
            this.label10.Text = "Temp type";
            // 
            // label12
            // 
            this.label12.AutoSize = true;
            this.label12.Location = new System.Drawing.Point(203, 73);
            this.label12.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label12.Name = "label12";
            this.label12.Size = new System.Drawing.Size(93, 17);
            this.label12.TabIndex = 60;
            this.label12.Text = "Valve contact";
            // 
            // AC_Out_Cfg
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(8F, 16F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(600, 486);
            this.Controls.Add(this.panel_ac_cfg);
            this.Controls.Add(this.chk_enable);
            this.Controls.Add(this.label7);
            this.Controls.Add(this.label6);
            this.Controls.Add(this.label4);
            this.Controls.Add(this.label3);
            this.Controls.Add(this.btn_cancel);
            this.Controls.Add(this.btn_OK);
            this.Margin = new System.Windows.Forms.Padding(4);
            this.Name = "AC_Out_Cfg";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "AC output config";
            this.TopMost = true;
            this.Load += new System.EventHandler(this.AC_Out_Cfg_Load);
            this.panel_ac_cfg.ResumeLayout(false);
            this.panel_ac_cfg.PerformLayout();
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.ComboBox cbx_fan_type;
        private System.Windows.Forms.ComboBox cbx_windows_mode;
        private System.Windows.Forms.ComboBox cbx_valve_contact;
        private System.Windows.Forms.Button btn_cancel;
        private System.Windows.Forms.Button btn_OK;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.ComboBox cbx_temp_unit;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.ComboBox cbx_temp_type;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.CheckBox chk_enable;
        private System.Windows.Forms.Label label4;
        private System.Windows.Forms.Label label6;
        private System.Windows.Forms.Label label7;
        private System.Windows.Forms.Panel panel_ac_cfg;
        private System.Windows.Forms.ComboBox cbx_analog_heat;
        private System.Windows.Forms.Label label15;
        private System.Windows.Forms.ComboBox cbx_analog_cool;
        private System.Windows.Forms.Label label16;
        private System.Windows.Forms.ComboBox cbx_analog_fan;
        private System.Windows.Forms.Label label17;
        private System.Windows.Forms.ComboBox cbx_high_fan;
        private System.Windows.Forms.Label label14;
        private System.Windows.Forms.ComboBox cbx_med_fan;
        private System.Windows.Forms.Label label9;
        private System.Windows.Forms.ComboBox cbx_low_fan;
        private System.Windows.Forms.Label label8;
        private System.Windows.Forms.ComboBox cbx_dead_band;
        private System.Windows.Forms.Label label5;
        private System.Windows.Forms.ComboBox cbx_valve_type;
        private System.Windows.Forms.Label label13;
        private System.Windows.Forms.Label label11;
        private System.Windows.Forms.Label label10;
        private System.Windows.Forms.Label label12;
        private System.Windows.Forms.ComboBox cbx_windows;
        private System.Windows.Forms.Label label21;
        private System.Windows.Forms.ComboBox cbx_heat_open;
        private System.Windows.Forms.Label label18;
        private System.Windows.Forms.ComboBox cbx_cool_close;
        private System.Windows.Forms.Label label19;
        private System.Windows.Forms.ComboBox cbx_cool_open;
        private System.Windows.Forms.Label label20;
        private System.Windows.Forms.ComboBox cbx_heat_close;
        private System.Windows.Forms.Label label26;
        private System.Windows.Forms.ToolTip tt_group_inf;
    }
}