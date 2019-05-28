using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ARCaptureAPI.Models
{
    public class SessionStartModel
    {
        public SessionModel Session { get; set; }
        public string CaptureURL { get; set; }
        public string CaptureQR { get; set; }
    }
}
