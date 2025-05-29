using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Windows.Forms;

namespace RLC
{
    public partial class ConfigIO_RCU_48IN_16RL : Form
    {
        int act;
        Input_RCU_48IN_16RL RLCForm;


        public bool Ramp_Check, Preset_Check, DelayOff_Check, MulGroup_Check, Keycard_Check, Nightlight_Check = false;
        public string input_func;
        int maxGroup = 60;
        byte[] PresetActGroup, PresetActGroupPercent;
        byte[] PresetInactGroup, PresetInactGroupPercent;
        Board_Attribute board_att = new Board_Attribute();
        string group_type = "";
        BindingList<RLC1.group_def> group_list;
        Byte group_edit_index = 0;

        public ConfigIO_RCU_48IN_16RL()
        {
            InitializeComponent();
        }

        public void Initialize(Input_RCU_48IN_16RL Form)
        {

            this.RLCForm = Form;
            group_type = board_att.get_group_type_from_func(input_func);
            group_list = board_att.Get_group_list_from_type(RLCForm.XForm, group_type);

        }
        private void ConfigIO_Load(object sender, EventArgs e)
        {
            chk_Nightlight.Enabled = Nightlight_Check;
            cbx_Ramp.Enabled = Ramp_Check;
            tbar_Preset.Enabled = Preset_Check;
            cbx_hour.Enabled = DelayOff_Check;
            cbx_min.Enabled = DelayOff_Check;
            cbx_sec.Enabled = DelayOff_Check;
            panel_Mul_Group.Enabled = MulGroup_Check;

            cbx_Ramp.SelectedIndex = 0;
            cbx_hour.SelectedIndex = 0;
            cbx_sec.SelectedIndex = 0;

            cbx_min.Items.Clear();
            for (int i = 0; i < 60; i++)
            {
                cbx_min.Items.Add(i.ToString());
                if ((cbx_hour.SelectedIndex == 18) && (i == 11)) break;
            }
            cbx_min.SelectedIndex = 0;

            toggle_percent_activeGroup.Appearance = System.Windows.Forms.Appearance.Button;
            toggle_percent_inactiveGroup.Appearance = System.Windows.Forms.Appearance.Button;

            gr_InactiveGroup.Enabled = Keycard_Check;
            btn_Add_InactiveGroup.Enabled = Keycard_Check;
            btn_AddMul_InactiveGroup.Enabled = Keycard_Check;
            btn_Clr_InactiveGroup.Enabled = Keycard_Check;
            btn_ClrMul_InactiveGroup.Enabled = Keycard_Check;


            btn_Clr_ActiveGroup.Enabled = false;
            btn_Clr_InactiveGroup.Enabled = false;
            btn_ClrMul_ActiveGroup.Enabled = false;
            btn_ClrMul_InactiveGroup.Enabled = false;

            /* Check the firmware version for max group */
            if (RLCForm.XForm.dev_cfg_fw_version < 2) maxGroup = 20;

            /* Check the wrong firmware version will have the NumGroup > max group */
            if (RLCForm.IO[RLCForm.input_Index].NumGroup > maxGroup)
            {
                RLCForm.IO[RLCForm.input_Index].NumGroup = maxGroup;
            }

            if (Keycard_Check == true) maxGroup = maxGroup / 2;
            PresetActGroup = new byte[maxGroup];
            PresetInactGroup = new byte[maxGroup];
            PresetActGroupPercent = new byte[maxGroup];
            PresetInactGroupPercent = new byte[maxGroup];

            if (RLCForm.IO[RLCForm.input_Index].Ramp != 0)
            {
                for (int i = 1; i < cbx_Ramp.Items.Count; i++)
                {
                    if (cbx_Ramp.Items[i].ToString().Substring(0, cbx_Ramp.Items[i].ToString().Length - 5) == RLCForm.IO[RLCForm.input_Index].Ramp.ToString())
                    {
                        cbx_Ramp.SelectedIndex = i;
                        break;
                    }
                }
            }

            tbar_Preset.Value = RLCForm.IO[RLCForm.input_Index].Preset;
            int led_Stat = RLCForm.IO[RLCForm.input_Index].Led_Status;
            if (led_Stat >= 32)
            {
                chk_Backlight.Checked = true;
                led_Stat = led_Stat - 32;
            }
            if (led_Stat >= 16)
            {
                chk_Nightlight.Checked = true;
                led_Stat = led_Stat - 16;
            }

            if (led_Stat >= 8) led_Stat = led_Stat - 8;
            if (led_Stat >= 4) led_Stat = led_Stat - 4;

            if (led_Stat == 3) rbtn_2colors.Checked = true;
            else if (led_Stat == 2) rbtn_ON_OFF.Checked = true;
            else if (led_Stat == 1) rbtn_ON.Checked = true;
            else rbtn_OFF.Checked = true;

            int delay = RLCForm.IO[RLCForm.input_Index].DelayOff;

            cbx_hour.SelectedIndex = delay / 3600;
            delay = delay - cbx_hour.SelectedIndex * 3600;
            cbx_min.SelectedIndex = delay / 60;
            delay = delay - cbx_min.SelectedIndex * 60;
            cbx_sec.SelectedIndex = delay;

            bool[] KTGroup = new bool[RLCForm.XForm.SLGroup];
            double val;
            int index;

            if (!Keycard_Check)   //Keycard
            {

                for (int i = 0; i < RLCForm.IO[RLCForm.input_Index].NumGroup; i++)
                {
                    Byte group_value = Convert.ToByte(RLCForm.IO[RLCForm.input_Index].Group[i]);
                    string group_name = "";
                    if (group_value == 0) break;

                    if (board_att.Check_value_in_group(RLCForm.XForm, group_value, group_type) == false)
                    {

                        board_att.Recover_Group_To_Database(RLCForm.XForm, group_value, input_func, ref group_name);
                    }

                    Byte group_index = board_att.Get_group_index(RLCForm.XForm, group_value, input_func);

                    group_name = group_list.ElementAt(group_index).name;

                    gr_ActiveGroup.Rows.Add(group_name, RLCForm.IO[RLCForm.input_Index].Preset_Group[i].ToString());
                    KTGroup[RLCForm.IO[RLCForm.input_Index].Group[i]] = true;
                    PresetActGroup[i] = RLCForm.IO[RLCForm.input_Index].Preset_Group[i];
                    val = Convert.ToDouble(PresetActGroup[i]) * 100 / 255;
                    PresetActGroupPercent[i] = Convert.ToByte(val);
                }
            }
            else
            {
                int max = RLCForm.IO[RLCForm.input_Index].NumGroup / 2;
                for (int i = 0; i < max; i++)
                {
                    Byte group_value = Convert.ToByte(RLCForm.IO[RLCForm.input_Index].Group[i]);
                    string group_name = "";
                    if (group_value == 0) break;

                    if (board_att.Check_value_in_group(RLCForm.XForm, group_value, group_type) == false)
                    {

                        board_att.Recover_Group_To_Database(RLCForm.XForm, group_value, input_func, ref group_name);
                    }

                    Byte group_index = board_att.Get_group_index(RLCForm.XForm, group_value, input_func);

                    group_name = group_list.ElementAt(group_index).name;

                    gr_ActiveGroup.Rows.Add(group_name, RLCForm.IO[RLCForm.input_Index].Preset_Group[i].ToString());
                    KTGroup[RLCForm.IO[RLCForm.input_Index].Group[i]] = true;
                    PresetActGroup[i] = RLCForm.IO[RLCForm.input_Index].Preset_Group[i];
                    val = Convert.ToDouble(PresetActGroup[i]) * 100 / 255;
                    PresetActGroupPercent[i] = Convert.ToByte(val);
                }
                for (int i = max; i < max * 2; i++)
                {
                    Byte group_value = Convert.ToByte(RLCForm.IO[RLCForm.input_Index].Group[i]);
                    string group_name = "";
                    if (group_value == 0) break;

                    if (board_att.Check_value_in_group(RLCForm.XForm, group_value, group_type) == false)
                    {

                        board_att.Recover_Group_To_Database(RLCForm.XForm, group_value, input_func, ref group_name);
                    }

                    Byte group_index = board_att.Get_group_index(RLCForm.XForm, group_value, input_func);

                    group_name = group_list.ElementAt(group_index).name;

                    gr_InactiveGroup.Rows.Add(group_name, RLCForm.IO[RLCForm.input_Index].Preset_Group[i].ToString());
                    KTGroup[RLCForm.IO[RLCForm.input_Index].Group[i]] = true;
                    PresetInactGroup[i - max] = RLCForm.IO[RLCForm.input_Index].Preset_Group[i];
                    val = Convert.ToDouble(PresetInactGroup[i - max]) * 100 / 255;
                    PresetInactGroupPercent[i - max] = Convert.ToByte(val);
                }
            }


            for (int i = 1; i < group_list.Count; i++)
            {
                if ((KTGroup[group_list.ElementAt(i).value] == false) || (Keycard_Check))
                    lst_AvaiGroup.Items.Add(group_list.ElementAt(i).name);
            }

            btn_Add_ActiveGroup.Enabled = false;
            btn_AddMul_InactiveGroup.Enabled = false;
            btn_AddMul_ActiveGroup.Enabled = false;
            btn_Add_InactiveGroup.Enabled = false;
            btn_Edit_Group.Enabled = false;

            if (lst_AvaiGroup.Items.Count > 0)
            {
                lst_AvaiGroup.SelectedIndex = 0;
                if (gr_ActiveGroup.Rows.Count < maxGroup)
                {
                    btn_Add_ActiveGroup.Enabled = true;
                    btn_AddMul_ActiveGroup.Enabled = true;
                }
                if (gr_InactiveGroup.Rows.Count < maxGroup)
                {
                    btn_AddMul_InactiveGroup.Enabled = Keycard_Check;
                    btn_Add_InactiveGroup.Enabled = Keycard_Check;
                }
                btn_Edit_Group.Enabled = true;
            }
        }

        private void lbl_percent_Click(object sender, EventArgs e)
        {

            if (lbl_percent.Text[lbl_percent.Text.Length - 1] == '%')
            {
                lbl_percent.Text = tbar_Preset.Value.ToString();
            }
            else
            {
                lbl_percent.Text = (tbar_Preset.Value * 100 / 255).ToString() + "%";
            }
        }


        private void tbar_Preset_ValueChanged(object sender, EventArgs e)
        {
            if (lbl_percent.Text[lbl_percent.Text.Length - 1] == '%') lbl_percent.Text = (tbar_Preset.Value * 100 / 255).ToString() + "%";
            else lbl_percent.Text = tbar_Preset.Value.ToString();
        }

        private void cbx_hour_SelectedIndexChanged(object sender, EventArgs e)
        {
            cbx_min.Items.Clear();
            int SL;

            if (cbx_hour.SelectedIndex == 18) SL = 12;
            else SL = 60;

            for (int i = 0; i < SL; i++)
                cbx_min.Items.Add(i.ToString());

            cbx_min.SelectedIndex = 0;

        }

        private void btn_add_ActiveGroup_Click(object sender, EventArgs e)
        {
            if (gr_ActiveGroup.Rows.Count == maxGroup) return;
            if (!Keycard_Check)
            {
                if (toggle_percent_activeGroup.Checked == false)
                    gr_ActiveGroup.Rows.Add(lst_AvaiGroup.Items[lst_AvaiGroup.SelectedIndex].ToString(), "0");
                else
                    gr_ActiveGroup.Rows.Add(lst_AvaiGroup.Items[lst_AvaiGroup.SelectedIndex].ToString(), "0%");
                lst_AvaiGroup.Items.RemoveAt(lst_AvaiGroup.SelectedIndex);
            }
            else
            {
                for (int i = 0; i < gr_ActiveGroup.Rows.Count; i++)
                {
                    if (lst_AvaiGroup.Items[lst_AvaiGroup.SelectedIndex].ToString() == gr_ActiveGroup[0, i].Value.ToString()) return;
                }
                if (toggle_percent_activeGroup.Checked == false)
                    gr_ActiveGroup.Rows.Add(lst_AvaiGroup.Items[lst_AvaiGroup.SelectedIndex].ToString(), "0");
                else
                    gr_ActiveGroup.Rows.Add(lst_AvaiGroup.Items[lst_AvaiGroup.SelectedIndex].ToString(), "0%");
            }
            if (lst_AvaiGroup.Items.Count > 0) lst_AvaiGroup.SelectedIndex = 0;
            if (gr_ActiveGroup.Rows.Count == maxGroup)
            {
                btn_Add_ActiveGroup.Enabled = false;
                btn_AddMul_ActiveGroup.Enabled = false;
            }
        }

        private void btn_Add_InactiveGroup_Click(object sender, EventArgs e)
        {
            if (gr_InactiveGroup.Rows.Count == maxGroup) return;
            if (!Keycard_Check)
            {
                if (toggle_percent_inactiveGroup.Checked == false)
                    gr_InactiveGroup.Rows.Add(lst_AvaiGroup.Items[lst_AvaiGroup.SelectedIndex].ToString(), "0");
                else
                    gr_InactiveGroup.Rows.Add(lst_AvaiGroup.Items[lst_AvaiGroup.SelectedIndex].ToString(), "0%");
                lst_AvaiGroup.Items.RemoveAt(lst_AvaiGroup.SelectedIndex);
            }
            else
            {
                for (int i = 0; i < gr_InactiveGroup.Rows.Count; i++)
                {
                    if (lst_AvaiGroup.Items[lst_AvaiGroup.SelectedIndex].ToString() == gr_InactiveGroup[0, i].Value.ToString()) return;
                }
                if (toggle_percent_inactiveGroup.Checked == false)
                    gr_InactiveGroup.Rows.Add(lst_AvaiGroup.Items[lst_AvaiGroup.SelectedIndex].ToString(), "0");
                else
                    gr_InactiveGroup.Rows.Add(lst_AvaiGroup.Items[lst_AvaiGroup.SelectedIndex].ToString(), "0%");
            }
            if (lst_AvaiGroup.Items.Count > 0) lst_AvaiGroup.SelectedIndex = 0;
            if (gr_InactiveGroup.Rows.Count == maxGroup)
            {
                btn_Add_InactiveGroup.Enabled = false;
                btn_AddMul_InactiveGroup.Enabled = false;
            }
        }

        private void btn_Clr_ActiveGroup_Click(object sender, EventArgs e)
        {
            if (!Keycard_Check)
            {
                lst_AvaiGroup.Items.Add(gr_ActiveGroup.Rows[gr_ActiveGroup.CurrentCell.RowIndex].Cells[0].Value.ToString());
            }
            if (gr_ActiveGroup.CurrentCell.RowIndex == gr_ActiveGroup.RowCount - 1) //added by Hoai An
            {
                PresetActGroup[gr_ActiveGroup.CurrentCell.RowIndex] = 0;
                PresetActGroupPercent[gr_ActiveGroup.CurrentCell.RowIndex] = 0;
            }
            else
            {
                int i;
                for (i = gr_ActiveGroup.CurrentCell.RowIndex; i < gr_ActiveGroup.RowCount; i++)
                {
                    PresetActGroup[i] = PresetActGroup[i + 1];
                    PresetActGroupPercent[i] = PresetActGroupPercent[i + 1];
                }
                PresetActGroup[i] = PresetActGroupPercent[i] = 0;
            }
            gr_ActiveGroup.Rows.RemoveAt(gr_ActiveGroup.CurrentCell.RowIndex);
            lst_AvaiGroup.SelectedIndex = 0;
            btn_Add_ActiveGroup.Enabled = true;
            btn_AddMul_ActiveGroup.Enabled = true;
        }

        private void lst_AvaiGroup_SelectedIndexChanged(object sender, EventArgs e)
        {
            if (lst_AvaiGroup.Items.Count == 0)
            {
                btn_AddMul_ActiveGroup.Enabled = false;
                btn_Add_ActiveGroup.Enabled = false;
                btn_AddMul_InactiveGroup.Enabled = false;
                btn_Add_InactiveGroup.Enabled = false;
                btn_Edit_Group.Enabled = false;
            }
            else
            {
                if (gr_ActiveGroup.Rows.Count != maxGroup)
                {
                    btn_AddMul_ActiveGroup.Enabled = true;
                    btn_Add_ActiveGroup.Enabled = true;
                }
                if (gr_InactiveGroup.Rows.Count != maxGroup)
                {
                    btn_AddMul_InactiveGroup.Enabled = Keycard_Check;
                    btn_Add_InactiveGroup.Enabled = Keycard_Check;
                }
                btn_Edit_Group.Enabled = true;
            }
        }

        private void gr_ActiveGroup_RowsAdded(object sender, DataGridViewRowsAddedEventArgs e)
        {
            if (btn_Clr_ActiveGroup.Enabled == false)
            {
                btn_Clr_ActiveGroup.Enabled = true;
                btn_ClrMul_ActiveGroup.Enabled = true;
            }
            if (gr_ActiveGroup.Rows.Count == maxGroup)
            {
                btn_Add_ActiveGroup.Enabled = false;
                btn_AddMul_ActiveGroup.Enabled = false;
            }
        }

        private void gr_ActiveGroup_RowsRemoved(object sender, DataGridViewRowsRemovedEventArgs e)
        {
            if (gr_ActiveGroup.Rows.Count == 0)
            {
                btn_Clr_ActiveGroup.Enabled = false;
                btn_ClrMul_ActiveGroup.Enabled = false;
            }
        }

        private void gr_InactiveGroup_RowsAdded(object sender, DataGridViewRowsAddedEventArgs e)
        {
            if (btn_Clr_InactiveGroup.Enabled == false)
            {
                btn_Clr_InactiveGroup.Enabled = true;
                btn_ClrMul_InactiveGroup.Enabled = true;
            }
            if (gr_InactiveGroup.Rows.Count == maxGroup)
            {
                btn_Add_InactiveGroup.Enabled = false;
                btn_AddMul_InactiveGroup.Enabled = false;
            }
        }

        private void gr_InactiveGroup_RowsRemoved(object sender, DataGridViewRowsRemovedEventArgs e)
        {
            if (gr_InactiveGroup.Rows.Count == 0)
            {
                btn_Clr_InactiveGroup.Enabled = false;
                btn_ClrMul_InactiveGroup.Enabled = false;
            }
        }

        private void btn_AddMul_ActiveGroup_Click(object sender, EventArgs e)
        {
            int dem = maxGroup - gr_ActiveGroup.Rows.Count;
            if (!Keycard_Check)
            {
                for (int i = 0; i < dem; i++)
                {
                    if (lst_AvaiGroup.Items.Count == 0) break;
                    else
                    {
                        if (toggle_percent_activeGroup.Checked == false)
                            gr_ActiveGroup.Rows.Add(lst_AvaiGroup.Items[0].ToString(), "0");
                        else
                            gr_ActiveGroup.Rows.Add(lst_AvaiGroup.Items[0].ToString(), "0%");
                        lst_AvaiGroup.Items.RemoveAt(0);
                        if (lst_AvaiGroup.Items.Count > 0) lst_AvaiGroup.SelectedIndex = 0;
                    }
                }
            }
            else
            {
                bool has_added = false;
                int start_group = 0;
                if (lst_AvaiGroup.Items.Count - lst_AvaiGroup.SelectedIndex >= dem)
                {
                    start_group = lst_AvaiGroup.SelectedIndex;
                }
                else
                {
                    if (lst_AvaiGroup.Items.Count - dem > 0)
                        start_group = lst_AvaiGroup.Items.Count - dem;
                }
                for (int i = start_group; i < lst_AvaiGroup.Items.Count; i++)
                {
                    has_added = false;
                    for (int j = 0; j < gr_ActiveGroup.Rows.Count; j++)
                    {
                        if (lst_AvaiGroup.Items[i].ToString() == gr_ActiveGroup[0, j].Value.ToString())
                        {
                            has_added = true;
                            break;
                        }
                    }
                    if (!has_added)
                    {
                        if (toggle_percent_activeGroup.Checked == false)
                            gr_ActiveGroup.Rows.Add(lst_AvaiGroup.Items[i].ToString(), "0");
                        else
                            gr_ActiveGroup.Rows.Add(lst_AvaiGroup.Items[i].ToString(), "0%");
                        dem--;
                    }
                    if (dem == 0) break;
                }
            }
            if (gr_ActiveGroup.Rows.Count == maxGroup)
            {
                btn_Add_ActiveGroup.Enabled = false;
                btn_AddMul_ActiveGroup.Enabled = false;
            }

        }

        private void btn_ClrMul_ActiveGroup_Click(object sender, EventArgs e)
        {
            int dem = gr_ActiveGroup.Rows.Count;
            int i;
            for (i = gr_ActiveGroup.CurrentCell.RowIndex; i < gr_ActiveGroup.RowCount; i++) //added by Hoai An
            {
                PresetActGroup[i] = PresetActGroupPercent[i] = 0;
            }
            if (!Keycard_Check)
            {
                for (i = 0; i < dem; i++)
                {
                    lst_AvaiGroup.Items.Add(gr_ActiveGroup.Rows[0].Cells[0].Value.ToString());
                    gr_ActiveGroup.Rows.RemoveAt(0);

                }
            }
            else
            {
                gr_ActiveGroup.Rows.Clear();
            }
            lst_AvaiGroup.SelectedIndex = 0;
            btn_Add_ActiveGroup.Enabled = true;
            btn_AddMul_ActiveGroup.Enabled = true;
        }

        private void btn_Clr_InactiveGroup_Click(object sender, EventArgs e)
        {
            if (!Keycard_Check)
            {
                lst_AvaiGroup.Items.Add(gr_InactiveGroup.Rows[gr_InactiveGroup.CurrentCell.RowIndex].Cells[0].Value.ToString());
            }
            if (gr_InactiveGroup.CurrentCell.RowIndex == gr_InactiveGroup.RowCount - 1) //added by Hoai An
            {
                PresetActGroup[gr_ActiveGroup.CurrentCell.RowIndex] = 0;
                PresetActGroupPercent[gr_ActiveGroup.CurrentCell.RowIndex] = 0;
            }
            else
            {
                int i;
                for (i = gr_InactiveGroup.CurrentCell.RowIndex; i < gr_InactiveGroup.RowCount; i++)
                {
                    PresetInactGroup[i] = PresetInactGroup[i + 1];
                    PresetInactGroupPercent[i] = PresetInactGroupPercent[i + 1];
                }
                PresetInactGroup[i] = PresetInactGroupPercent[i] = 0;
            }
            gr_InactiveGroup.Rows.RemoveAt(gr_InactiveGroup.CurrentCell.RowIndex);
            lst_AvaiGroup.SelectedIndex = 0;
            btn_Add_InactiveGroup.Enabled = Keycard_Check;
            btn_AddMul_InactiveGroup.Enabled = Keycard_Check;
        }

        private void btn_AddMul_InactiveGroup_Click(object sender, EventArgs e)
        {
            int dem = maxGroup - gr_InactiveGroup.Rows.Count;
            if (!Keycard_Check)
            {
                for (int i = 0; i < dem; i++)
                {
                    if (lst_AvaiGroup.Items.Count == 0) break;
                    else
                    {
                        if (toggle_percent_inactiveGroup.Checked == false)
                            gr_InactiveGroup.Rows.Add(lst_AvaiGroup.Items[0].ToString(), "0");
                        else
                            gr_InactiveGroup.Rows.Add(lst_AvaiGroup.Items[0].ToString(), "0%");
                        lst_AvaiGroup.Items.RemoveAt(0);
                        if (lst_AvaiGroup.Items.Count > 0) lst_AvaiGroup.SelectedIndex = 0;
                    }
                }
            }
            else
            {
                bool has_added = false;
                int start_group = 0;
                if (lst_AvaiGroup.Items.Count - lst_AvaiGroup.SelectedIndex >= dem)
                {
                    start_group = lst_AvaiGroup.SelectedIndex;
                }
                else
                {
                    if (lst_AvaiGroup.Items.Count - dem > 0)
                        start_group = lst_AvaiGroup.Items.Count - dem;
                }
                for (int i = start_group; i < lst_AvaiGroup.Items.Count; i++)
                {
                    has_added = false;
                    for (int j = 0; j < gr_InactiveGroup.Rows.Count; j++)
                    {
                        if (lst_AvaiGroup.Items[i].ToString() == gr_InactiveGroup[0, j].Value.ToString())
                        {
                            has_added = true;
                            break;
                        }
                    }
                    if (!has_added)
                    {
                        if (toggle_percent_inactiveGroup.Checked == false)
                            gr_InactiveGroup.Rows.Add(lst_AvaiGroup.Items[i].ToString(), "0");
                        else
                            gr_InactiveGroup.Rows.Add(lst_AvaiGroup.Items[i].ToString(), "0%");
                        dem--;
                    }
                    if (dem == 0) break;
                }
            }

            if (gr_InactiveGroup.Rows.Count == maxGroup)
            {
                btn_Add_InactiveGroup.Enabled = false;
                btn_AddMul_InactiveGroup.Enabled = false;
            }

        }

        private void btn_ClrMul_InactiveGroup_Click(object sender, EventArgs e)
        {
            int dem = gr_InactiveGroup.Rows.Count;
            int i;
            for (i = gr_InactiveGroup.CurrentCell.RowIndex; i < gr_InactiveGroup.RowCount; i++) //added by Hoai An
            {
                PresetInactGroup[i] = PresetInactGroupPercent[i] = 0;
            }
            if (!Keycard_Check)
            {
                for (i = 0; i < dem; i++)
                {
                    lst_AvaiGroup.Items.Add(gr_InactiveGroup.Rows[0].Cells[0].Value.ToString());
                    gr_InactiveGroup.Rows.RemoveAt(0);

                }
            }
            else
            {
                gr_InactiveGroup.Rows.Clear();
            }
            lst_AvaiGroup.SelectedIndex = 0;
            btn_Add_InactiveGroup.Enabled = Keycard_Check;
            btn_AddMul_InactiveGroup.Enabled = Keycard_Check;
        }


        private void gr_ActiveGroup_CellEndEdit(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex == -1) return;

            if (toggle_percent_activeGroup.Checked == false)
            {
                try
                {
                    int value = Convert.ToInt16(gr_ActiveGroup.Rows[e.RowIndex].Cells[1].Value.ToString());
                    if (value < 0) gr_ActiveGroup.Rows[e.RowIndex].Cells[1].Value = "0";
                    else if (value > 255) gr_ActiveGroup.Rows[e.RowIndex].Cells[1].Value = "255";
                    else gr_ActiveGroup.Rows[e.RowIndex].Cells[1].Value = value.ToString();
                }
                catch
                {
                    gr_ActiveGroup.Rows[e.RowIndex].Cells[1].Value = "0";
                }
                PresetActGroup[e.RowIndex] = Convert.ToByte(gr_ActiveGroup.Rows[e.RowIndex].Cells[1].Value.ToString());
                string s = gr_ActiveGroup.Rows[e.RowIndex].Cells[1].Value.ToString();
                double val = Convert.ToDouble(s) * 100 / 255;
                PresetActGroupPercent[e.RowIndex] = Convert.ToByte(val);
            }
            else
            {
                try
                {
                    int value = Convert.ToInt16(gr_ActiveGroup.Rows[e.RowIndex].Cells[1].Value.ToString());
                    if (value < 0) gr_ActiveGroup.Rows[e.RowIndex].Cells[1].Value = "0%";
                    else if (value > 100) gr_ActiveGroup.Rows[e.RowIndex].Cells[1].Value = "100%";
                    else gr_ActiveGroup.Rows[e.RowIndex].Cells[1].Value = value.ToString() + "%";
                }
                catch
                {
                    gr_ActiveGroup.Rows[e.RowIndex].Cells[1].Value = "0%";
                }
                string s = gr_ActiveGroup.Rows[e.RowIndex].Cells[1].Value.ToString();
                PresetActGroupPercent[e.RowIndex] = Convert.ToByte(s.Substring(0, s.Length - 1));
                double val = Convert.ToDouble(s.Substring(0, s.Length - 1)) * 255 / 100;
                PresetActGroup[e.RowIndex] = Convert.ToByte(val);
            }
        }

        private void toggle_percent_activeGroup_CheckedChanged(object sender, EventArgs e)
        {
            if (toggle_percent_activeGroup.Checked == true)
            {
                for (int i = 0; i < gr_ActiveGroup.Rows.Count; i++)
                {
                    gr_ActiveGroup.Rows[i].Cells[1].Value = PresetActGroupPercent[i].ToString() + "%";
                }
            }
            else
            {
                for (int i = 0; i < gr_ActiveGroup.Rows.Count; i++)
                {

                    gr_ActiveGroup.Rows[i].Cells[1].Value = PresetActGroup[i].ToString();
                }
            }
        }

        private void gr_InactiveGroup_CellEndEdit(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex == -1) return;

            if (toggle_percent_inactiveGroup.Checked == false)
            {
                try
                {
                    int value = Convert.ToInt16(gr_InactiveGroup.Rows[e.RowIndex].Cells[1].Value.ToString());
                    if (value < 0) gr_InactiveGroup.Rows[e.RowIndex].Cells[1].Value = "0";
                    else if (value > 255) gr_InactiveGroup.Rows[e.RowIndex].Cells[1].Value = "255";
                    else gr_InactiveGroup.Rows[e.RowIndex].Cells[1].Value = value.ToString();
                }
                catch
                {
                    gr_InactiveGroup.Rows[e.RowIndex].Cells[1].Value = "0";
                }
                PresetInactGroup[e.RowIndex] = Convert.ToByte(gr_InactiveGroup.Rows[e.RowIndex].Cells[1].Value.ToString());
                string s = gr_InactiveGroup.Rows[e.RowIndex].Cells[1].Value.ToString();
                double val = Convert.ToDouble(s) * 100 / 255;
                PresetInactGroupPercent[e.RowIndex] = Convert.ToByte(val);
            }
            else
            {
                try
                {
                    int value = Convert.ToInt16(gr_InactiveGroup.Rows[e.RowIndex].Cells[1].Value.ToString());
                    if (value < 0) gr_InactiveGroup.Rows[e.RowIndex].Cells[1].Value = "0%";
                    else if (value > 100) gr_InactiveGroup.Rows[e.RowIndex].Cells[1].Value = "100%";
                    else gr_InactiveGroup.Rows[e.RowIndex].Cells[1].Value = value.ToString() + "%";
                }
                catch
                {
                    gr_InactiveGroup.Rows[e.RowIndex].Cells[1].Value = "0%";
                }
                string s = gr_InactiveGroup.Rows[e.RowIndex].Cells[1].Value.ToString();
                PresetInactGroupPercent[e.RowIndex] = Convert.ToByte(s.Substring(0, s.Length - 1));
                double val = Convert.ToDouble(s.Substring(0, s.Length - 1)) * 255 / 100;
                PresetInactGroup[e.RowIndex] = Convert.ToByte(val);
            }
        }

        private void toggle_percent_inactiveGroup_CheckedChanged(object sender, EventArgs e)
        {
            if (toggle_percent_inactiveGroup.Checked == true)
            {
                for (int i = 0; i < gr_InactiveGroup.Rows.Count; i++)
                {
                    gr_InactiveGroup.Rows[i].Cells[1].Value = PresetInactGroupPercent[i].ToString() + "%";
                }
            }
            else
            {
                for (int i = 0; i < gr_InactiveGroup.Rows.Count; i++)
                {

                    gr_InactiveGroup.Rows[i].Cells[1].Value = PresetInactGroup[i].ToString();
                }
            }
        }

        private void btn_Add_Group_Click(object sender, EventArgs e)
        {
            act = 0;
            this.Enabled = false;
            RLCForm.XForm.form = 1;
            timer1.Enabled = true;
            timer1.Start();

            RLCForm.IOcheck = true;
            RLCForm.XForm.add_group(board_att.get_group_type_from_func(input_func));
        }

        private void btn_Edit_Group_Click(object sender, EventArgs e)
        {
            act = 1;
            this.Enabled = false;
            RLCForm.XForm.form = 1;
            timer1.Enabled = true;
            timer1.Start();

            string group_name = lst_AvaiGroup.Items[lst_AvaiGroup.SelectedIndex].ToString();
            Byte group_value = board_att.Get_group_value_from_name(RLCForm.XForm, board_att.get_group_type_from_func(input_func), group_name);
            string group_desc = board_att.Get_group_desc(RLCForm.XForm, board_att.get_group_type_from_func(input_func), group_value);

            group_edit_index = board_att.Get_group_index(RLCForm.XForm, group_value, input_func);

            RLCForm.XForm.edit_group(board_att.get_group_type_from_func(input_func), group_name, group_value, group_desc);
        }

        private void ConfigIO_FormClosing(object sender, FormClosingEventArgs e)
        {
            RLCForm.IOcheck = false;
            RLCForm.Enabled = true;
            RLCForm.XForm.enableGetState = true;
            RLCForm.Focus();
        }

        private void timer1_Tick(object sender, EventArgs e)
        {
            if (RLCForm.XForm.form == 0)
            {
                timer1.Stop();
                timer1.Enabled = false;
                this.Enabled = true;
                this.Focus();

                if (RLCForm.XForm.OK == true)
                {
                    if (act == 0)
                    {
                        lst_AvaiGroup.Items.Add(group_list.ElementAt(group_list.Count - 1).name);
                    }
                    else
                    {
                        int lst_index = lst_AvaiGroup.SelectedIndex;
                        string old_group_name = lst_AvaiGroup.Items[lst_index].ToString();
                        lst_AvaiGroup.Items.RemoveAt(lst_AvaiGroup.SelectedIndex);
                        lst_AvaiGroup.Items.Insert(lst_index, group_list.ElementAt(group_edit_index).name);
                        lst_AvaiGroup.SelectedIndex = lst_index;

                        for (int i = 0; i < gr_ActiveGroup.RowCount; i++)
                        {
                            if (gr_ActiveGroup.Rows[i].Cells[0].Value.ToString() == old_group_name)
                            {
                                gr_ActiveGroup.Rows[i].Cells[0].Value = group_list.ElementAt(group_edit_index).name;
                                break;
                            }
                        }

                        for (int i = 0; i < gr_InactiveGroup.RowCount; i++)
                        {
                            if (gr_InactiveGroup.Rows[i].Cells[0].Value.ToString() == old_group_name)
                            {
                                gr_InactiveGroup.Rows[i].Cells[0].Value = group_list.ElementAt(group_edit_index).name;
                                break;
                            }
                        }
                    }
                }

            }
        }

        private void btn_Cancel_Click(object sender, EventArgs e)
        {
            this.Close();
        }

        private void btn_Ok_Click(object sender, EventArgs e)
        {
            if (cbx_Ramp.SelectedIndex == 0) RLCForm.IO[RLCForm.input_Index].Ramp = 0;
            else RLCForm.IO[RLCForm.input_Index].Ramp = Convert.ToInt16(cbx_Ramp.SelectedItem.ToString().Substring(0, cbx_Ramp.SelectedItem.ToString().Length - 5));

            RLCForm.IO[RLCForm.input_Index].Preset = tbar_Preset.Value;

            int Display = Convert.ToInt16(rbtn_ON.Checked) + Convert.ToInt16(rbtn_ON_OFF.Checked) * 2 + Convert.ToInt16(rbtn_2colors.Checked) * 3;
            RLCForm.IO[RLCForm.input_Index].Led_Status = Display + Convert.ToInt16(chk_Nightlight.Checked) * 16 + Convert.ToInt16(chk_Backlight.Checked) * 32;
            RLCForm.IO[RLCForm.input_Index].DelayOff = Convert.ToInt16(cbx_hour.SelectedItem.ToString()) * 3600 + Convert.ToInt16(cbx_min.SelectedItem.ToString()) * 60 + Convert.ToInt16(cbx_sec.SelectedItem.ToString());

            if (lst_AvaiGroup.Enabled == false) Close();

            if (!Keycard_Check)   //Keycard
            {
                RLCForm.IO[RLCForm.input_Index].NumGroup = gr_ActiveGroup.Rows.Count;

                RLCForm.IO[RLCForm.input_Index].Group = new int[gr_ActiveGroup.Rows.Count];
                RLCForm.IO[RLCForm.input_Index].Preset_Group = new byte[gr_ActiveGroup.Rows.Count];

                for (int k = 0; k < gr_ActiveGroup.Rows.Count; k++)
                {
                    Byte group_val = board_att.Get_group_value_from_name(RLCForm.XForm, group_type, gr_ActiveGroup.Rows[k].Cells[0].Value.ToString());

                    RLCForm.IO[RLCForm.input_Index].Group[k] = group_val;
                    RLCForm.IO[RLCForm.input_Index].Preset_Group[k] = PresetActGroup[k];
                }
            }
            else
            {
                RLCForm.IO[RLCForm.input_Index].NumGroup = maxGroup * 2;
                RLCForm.IO[RLCForm.input_Index].Group = new int[maxGroup * 2];
                RLCForm.IO[RLCForm.input_Index].Preset_Group = new byte[maxGroup * 2];

                for (int k = 0; k < gr_ActiveGroup.Rows.Count; k++)
                {
                    Byte group_val = board_att.Get_group_value_from_name(RLCForm.XForm, group_type, gr_ActiveGroup.Rows[k].Cells[0].Value.ToString());

                    RLCForm.IO[RLCForm.input_Index].Group[k] = group_val;
                    RLCForm.IO[RLCForm.input_Index].Preset_Group[k] = PresetActGroup[k];
                }

                for (int k = maxGroup; k < maxGroup + gr_InactiveGroup.Rows.Count; k++)
                {
                    Byte group_val = board_att.Get_group_value_from_name(RLCForm.XForm, group_type, gr_InactiveGroup.Rows[k - maxGroup].Cells[0].Value.ToString());

                    RLCForm.IO[RLCForm.input_Index].Group[k] = group_val;
                    RLCForm.IO[RLCForm.input_Index].Preset_Group[k] = PresetInactGroup[k - maxGroup];
                }

            }
            Close();
        }


        private void rbtn_ON_OFF_CheckedChanged_1(object sender, EventArgs e)
        {
            chk_Nightlight.Enabled = rbtn_ON_OFF.Checked;
        }

        private void cbx_min_SelectedIndexChanged(object sender, EventArgs e)
        {

        }

        private void panel1_Paint(object sender, PaintEventArgs e)
        {

        }









    }
}

