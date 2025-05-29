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
            for (int i = 0; i < rp.Count; i++) 
            {
                txtReport.Text += rp.ElementAt(i) + "\r\n";
            }
        }

        public void Initialize(RLC1 Form)
        {
            this.XForm = Form;
        }
	}
}
