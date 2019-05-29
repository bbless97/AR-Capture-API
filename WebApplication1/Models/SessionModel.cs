using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ARCaptureAPI.Models
{
    public enum SessionState
    {
        New = 1,
        WaitingForUpload = 2,
        ImageReady = 3,
        Ended = 4
    }

    public class SessionModel
    {
        public SessionState State;
        public DateTime Timestamp = new DateTime();
        public Guid ID;
        public string ImageData;
        public int ImageOrientation;
        public string WheelBoundInformation;
    }
}
