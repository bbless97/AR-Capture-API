using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ARCaptureAPI.Models;

namespace ARCaptureAPI.Controllers
{
    public class HomeController : Controller
    {

        public IActionResult CaptureUI()
        {
           //sessionModel.ID = new Guid();
            return View();  
        }

        public void UpdateSession(String dataURL)
        {
            //sessionModel.userImage = dataURL;
            //sessionModel.Timestamp = new DateTime();
        }

        public JsonResult ReturnUserImage(String userImageString)
        {
            UpdateSession(userImageString);
            return Json(new
            {
                //sessionModel.userImage
            });
        }
    }
}
