namespace RLC
{
    partial class Report
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
            this.txtReport = new System.Windows.Forms.RichTextBox();
            this.SuspendLayout();
            // 
            // txtReport
            // 
            this.txtReport.Location = new System.Drawing.Point(1, 2);
            this.txtReport.Name = "txtReport";
            this.txtReport.Size = new System.Drawing.Size(717, 356);
            this.txtReport.TabIndex = 1;
            this.txtReport.Text = "";
            // 
            // Report
            // 
            this.ClientSize = new System.Drawing.Size(718, 358);
            this.Controls.Add(this.txtReport);
            this.Name = "Report";
            this.Text = "Report";
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.RichTextBox txtReport;


    }
}