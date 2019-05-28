using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ARCaptureAPI.Models;
using Microsoft.AspNetCore.Mvc;
using QRCoder;

namespace ARCaptureAPI.Controllers
{
    public class SessionController : Controller
    {
        public static SessionFactory SesFactory = new SessionFactory();

        /// <summary>
        /// Creates new session instance stores in session factory
        /// </summary>
        /// <returns>returns newly created instance</returns>
        public IActionResult Start()
        {
            //start new session and keep ref
            SessionModel startSession = SesFactory.StartSession();

            //generate url to capture endpoint
            string sessionURL = Url.Action("CaptureUI", "Capture", new { sessionID = startSession.ID });

            //generate QR
            QRCodeGenerator qrGenerator = new QRCodeGenerator();
            QRCodeData qrCodeData = qrGenerator.CreateQrCode(sessionURL, QRCodeGenerator.ECCLevel.Q);
            Base64QRCode qrCode = new Base64QRCode(qrCodeData);
            string qrCodeImageAsBase64 = qrCode.GetGraphic(20);

            //create new session start model, with session model and QR string
            SessionStartModel sessionStartModel = new SessionStartModel();
            sessionStartModel.CaptureQR = qrCodeImageAsBase64;
            sessionStartModel.CaptureURL = sessionURL;
            sessionStartModel.Session = startSession;

            return Json(SesFactory.StartSession());
        }

        /// <summary>
        /// get reference to active session
        /// </summary>
        /// <param name="id">id of session you want to get</param>
        /// <returns>return refrence to session if found in session factory else return null</returns>
        public IActionResult Get(Guid id)
        {
            return Json(SesFactory.GetSession(id));
        }

        /// <summary>
        /// Upload image from user to the session, set state of session to 'ImageReady'
        /// </summary>
        /// <param name="id">id of session you want to store image, and update</param>
        /// <param name="imageData">imageData created from image</param>
        /// <returns>returns true if upload complete, false if upload failed</returns>
        public IActionResult UploadImage(Guid id, string imageData)
        {
            SessionModel session = SesFactory.GetSession(id);

            if (session != null)
            {
                session.UserImage = imageData;
                session.State = SessionState.ImageReady;
                return Json(true);
            }

            return Json(false);
        }

        /// <summary>
        /// Sets state of session to 'WaitingForUpload'
        /// </summary>
        /// <param name="id">id of session you want to update</param>
        /// <returns>is true if session was found and changed, else false</returns>
        public IActionResult ScanStarted(Guid id)
        {
            SessionModel session = SesFactory.GetSession(id);

            if(session != null)
            {
                session.State = SessionState.WaitingForUpload;
                return Json(true);
            }

            return Json(false);
        }

        /// <summary>
        /// Sets state of session to 'Ended'
        /// </summary>
        /// <param name="id">id of session you want to update</param>
        /// <returns>true if state was changed, false if session wasn't found</returns>
        public IActionResult End(Guid id)
        {
            SessionModel session = SesFactory.GetSession(id);

            if (session != null)
            {
                session.State = SessionState.Ended;
                return Json(true);
            }

            return Json(false);
        }

    }
}