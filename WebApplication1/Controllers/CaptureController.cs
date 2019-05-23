using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ARCaptureAPI.Models;

namespace ARCaptureAPI.Controllers
{
    public class CaptureController : Controller
    {
        public IActionResult CaptureUI()
        {
            return View();
        }
    }
}
