using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using System.IO;
using System.Reflection;

namespace RLC
{
    public partial class Report : Form
    {
        public RLC1 XForm;
        public Report(List<string> rp)
        {
            InitializeComponent();
            string text;
            for (int i = 0; i < rp.Count; i++) 
            {
                text = rp.ElementAt(i) + "\r\n";
                if (text.Substring(0, 5) == "Error")
                    txtReport.SelectionColor = System.Drawing.Color.Red;
                else
                    txtReport.SelectionColor = System.Drawing.Color.Green;
                txtReport.SelectedText += text;
            }
        }

        public void Initialize(RLC1 Form)
        {
            this.XForm = Form;
        }
	}
}
