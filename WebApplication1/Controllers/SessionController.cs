using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ARCaptureAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace ARCaptureAPI.Controllers
{
    public class SessionController : Controller
    {
        public static SessionFactory SesFactory = new SessionFactory();

        /// <summary>
        /// 
        /// </summary>
        /// <returns></returns>
        public IActionResult Start()
        {
            return Json(SesFactory.StartSession());
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        public IActionResult Get(Guid id)
        {
            return Json(SesFactory.GetSession(id));
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="id"></param>
        /// <param name="imageData"></param>
        /// <returns></returns>
        public IActionResult UploadImage(Guid id, string imageData)
        {
            SessionModel session = SesFactory.GetSession(id);

            if (session != null)
            {
                session.userImage = imageData;
                session.State = SessionState.ImageReady;
                return Json(true);
            }

            return Json(false);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
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
        /// 
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
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