﻿using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using CaptureAPI.Models;

namespace CaptureAPI.Controllers
{
    public class CaptureController : Controller
    {
        public IActionResult CaptureUI()
        {
            return View();
        }

        public IActionResult TestSession()
        {
            return View();
        }
    }
}
