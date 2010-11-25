import logging, tempfile
from time import time, gmtime, strftime

from DIRAC.Core.Utilities import Time

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import authorizeAction
from DIRAC import gConfig, gLogger
from DIRAC.Core.Utilities.DictCache import DictCache
import dirac.lib.credentials as credentials

########
from DIRAC.FrameworkSystem.Client.UserProfileClient import UserProfileClient
########

log = logging.getLogger(__name__)

global numberOfJobs
global pageNumber
global globalSort
numberOfJobs = 25
pageNumber = 0
globalSort = None

class SitegatewayController(BaseController):
################################################################################
  def display(self):
    lhcbGroup = credentials.getSelectedGroup()
    if lhcbGroup == "visitor":
      return render("/login.mako")
    c.select = self.__getSelectionData()
    gLogger.info("SELECTION RESULTS:",c.select)
    return render("jobs/SiteGateway.mako")
################################################################################
  @jsonify
  def submit(self):
    pagestart = time()
    RPC = getRPCClient("ResourceStatus/ResourceStatus")
    if request.params.has_key("mode") and len(request.params["mode"]) > 0:
      result = self.__request()
      if request.params["mode"] == "Site":
        result = RPC.getSitesStatusWeb(result,globalSort,pageNumber,numberOfJobs)
      elif request.params["mode"] == "Service":
        result = RPC.getServicesStatusWeb(result,globalSort,pageNumber,numberOfJobs)
        gLogger.info("\033[0;31m YO: \033[0m",result)
      elif request.params["mode"] == "Resource":
        result = RPC.getResourcesStatusWeb(result,globalSort,pageNumber,numberOfJobs)
      elif request.params["mode"] == "Storage":
        gLogger.info("\033[0;31m  RPC.getStorageElementsStatusWeb(%s,%s,%s,%s) \033[0m" % (result,globalSort,pageNumber,numberOfJobs))
        result = RPC.getStorageElementsStatusWeb(result,globalSort,pageNumber,numberOfJobs)
    else:
      result = {}
      result["OK"] = ""
      result["Message"] = "The parameter 'mode' is absent"
    if result["OK"]:
      result = result["Value"]
      gLogger.info("\033[0;31m YO: \033[0m",result)
      if result.has_key("TotalRecords") and  result["TotalRecords"] > 0:
        if result.has_key("ParameterNames") and result.has_key("Records"):
          if len(result["ParameterNames"]) > 0:
            if len(result["Records"]) > 0:
              c.result = []
              jobs = result["Records"]
              head = result["ParameterNames"]
              headLength = len(head)
              countryCode = self.__countries()
              for i in jobs:
                tmp = {}
                for j in range(0,headLength):
                  tmp[head[j]] = i[j]
                if request.params["mode"] == "Resource":
                  if countryCode.has_key(i[4]):
                    tmp["FullCountry"] = countryCode[i[4]]
                  else:
                    tmp["Country"] = "Unknown"
                    tmp["FullCountry"] = "Unknown"
                else:
                  if countryCode.has_key(i[3]):
                    tmp["FullCountry"] = countryCode[i[3]]
                  else:
                    tmp["Country"] = "Unknown"
                    tmp["FullCountry"] = "Unknown"
                c.result.append(tmp)
              total = result["TotalRecords"]
              if result.has_key("Extras"):
                extra = result["Extras"]
                c.result = {"success":"true","result":c.result,"total":total,"extra":extra}
              else:
                c.result = {"success":"true","result":c.result,"total":total}
            else:
              c.result = {"success":"false","result":"","error":"There are no data to display"}
          else:
            c.result = {"success":"false","result":"","error":"ParameterNames field is undefined"}
        else:
          c.result = {"success":"false","result":"","error":"Data structure is corrupted"}
      else:
        c.result = {"success":"false","result":"","error":"There were no data matching your selection"}
    else:
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("\033[0;31m SITEGW INDEX REQUEST: \033[0m %s" % (time() - pagestart))
    return c.result
###############################################################################
  def __request(self):
    req = {}
    global pageNumber
    global globalSort
    global numberOfJobs
    globalSort = []
    numberOfJobs = 500
    pageNumber = 0
    if request.params.has_key("getSiteHistory") and len(request.params["getSiteHistory"]) > 0:
        req["ExpandSiteHistory"] = str(request.params["getSiteHistory"])
    elif request.params.has_key("getServiceHistory") and len(request.params["getServiceHistory"]) > 0:
        req["ExpandServiceHistory"] = str(request.params["getServiceHistory"])
    elif request.params.has_key("getResourceHistory") and len(request.params["getResourceHistory"]) > 0:
        req["ExpandResourceHistory"] = str(request.params["getResourceHistory"])
    elif request.params.has_key("getStorageHistory") and len(request.params["getStorageHistory"]) > 0:
        req["ExpandStorageElementHistory"] = str(request.params["getStorageHistory"])
    else:
      if request.params["mode"] == "Site":
        if request.params.has_key("siteName") and len(request.params["siteName"]) > 0:
          if str(request.params["siteName"]) != "All":
            req["SiteName"] = str(request.params["siteName"]).split('::: ')
        if request.params.has_key("siteStatus") and len(request.params["siteStatus"]) > 0:
          if str(request.params["siteStatus"]) != "All":
            req["Status"] = str(request.params["siteStatus"]).split('::: ')
        if request.params.has_key("siteType") and len(request.params["siteType"]) > 0:
          if str(request.params["siteType"]) != "All":
            req["SiteType"] = str(request.params["siteType"]).split('::: ')
      elif request.params["mode"] == "Service":
        if request.params.has_key("serviceName") and len(request.params["serviceName"]) > 0:
          if str(request.params["serviceName"]) != "All":
            req["ServiceName"] = str(request.params["serviceName"]).split('::: ')
        if request.params.has_key("serviceType") and len(request.params["serviceType"]) > 0:
          if str(request.params["serviceType"]) != "All":
            req["ServiceType"] = str(request.params["serviceType"]).split('::: ')
        if request.params.has_key("serviceSiteName") and len(request.params["serviceSiteName"]) > 0:
          if str(request.params["serviceSiteName"]) != "All":
            req["SiteName"] = str(request.params["serviceSiteName"]).split('::: ')
        if request.params.has_key("serviceStatus") and len(request.params["serviceStatus"]) > 0:
          if str(request.params["serviceStatus"]) != "All":
            req["Status"] = str(request.params["serviceStatus"]).split('::: ')
      elif request.params["mode"] == "Resource":
        if request.params.has_key("resourceName") and len(request.params["resourceName"]) > 0:
          if str(request.params["resourceName"]) != "All":
            req["ResourceName"] = str(request.params["resourceName"]).split('::: ')
        if request.params.has_key("resourceType") and len(request.params["resourceType"]) > 0:
          if str(request.params["resourceType"]) != "All":
            req["ResourceType"] = str(request.params["resourceType"]).split('::: ')
        if request.params.has_key("resourceSiteName") and len(request.params["resourceSiteName"]) > 0:
          if str(request.params["resourceSiteName"]) != "All":
            req["SiteName"] = str(request.params["resourceSiteName"]).split('::: ')
        if request.params.has_key("resourceStatus") and len(request.params["resourceStatus"]) > 0:
          if str(request.params["resourceStatus"]) != "All":
            req["Status"] = str(request.params["resourceStatus"]).split('::: ')
      elif request.params["mode"] == "Storage":
        if request.params.has_key("storageName") and len(request.params["storageName"]) > 0:
          if str(request.params["storageName"]) != "All":
            req["StorageElementName"] = str(request.params["storageName"]).split('::: ')
        if request.params.has_key("storageSiteName") and len(request.params["storageSiteName"]) > 0:
          if str(request.params["storageSiteName"]) != "All":
            req["SiteName"] = str(request.params["storageSiteName"]).split('::: ')
        if request.params.has_key("storageStatus") and len(request.params["storageStatus"]) > 0:
          if str(request.params["storageStatus"]) != "All":
            req["Status"] = str(request.params["storageStatus"]).split('::: ')
      globalSort = []
    gLogger.info("REQUEST:",req)
    return req
################################################################################
  def __getSelectionData(self):
    callback = {}
    lhcbGroup = credentials.getSelectedGroup()
    lhcbUser = str(credentials.getUsername())
    if len(request.params) > 0:
      tmp = {}
      for i in request.params:
        tmp[i] = str(request.params[i])
      callback["extra"] = tmp
###
    RPC = getRPCClient("ResourceStatus/ResourceStatus")
    result = RPC.getSitesList()
    if result["OK"]:
      tier1 = gConfig.getValue("/Website/PreferredSites")
      if tier1:
        try:
          tier1 = tier1.split(", ")
        except:
          tier1 = list()
      else:
        tier1 = list()
      site = []
      if len(result["Value"])>0:
        s = list(result["Value"])
        site.append([str("All")])
        for i in tier1:
          site.append([str(i)])
        for i in s:
          if i not in tier1:
            site.append([str(i)])
      else:
        site = [["Nothing to display"]]
    else:
      site = [["Error during RPC call"]]
    callback["siteName"] = site
    callback["resourceSiteName"] = site
    callback["serviceSiteName"] = site
###
    RPC = getRPCClient("ResourceStatus/ResourceStatus")
    result = RPC.getSESitesList()
    if result["OK"]:
      tier1 = gConfig.getValue("/Website/PreferredSites")
      if tier1:
        try:
          tier1 = tier1.split(", ")
        except:
          tier1 = list()
      else:
        tier1 = list()
      site = []
      if len(result["Value"])>0:
        s = list(result["Value"])
        site.append([str("All")])
        for i in tier1:
          site.append([str(i)])
        for i in s:
          if i not in tier1:
            site.append([str(i)])
      else:
        site = [["Nothing to display"]]
    else:
      site = [["Error during RPC call"]]
    callback["storageSiteName"] = site
###
    result = RPC.getSiteTypeList()
    if result["OK"]:
      stat = []
      if len(result["Value"])>0:
        stat.append([str("All")])
        for i in result["Value"]:
          stat.append([str(i)])
      else:
        stat = [["Nothing to display"]]
    else:
      stat = [["Error during RPC call"]]
    callback["siteType"] = stat
###
    result = RPC.getStatusList()
    if result["OK"]:
      stat = []
      if len(result["Value"])>0:
        stat.append([str("All")])
        for i in result["Value"]:
          i = i.replace(",",";")
          stat.append([i])
      else:
        stat = [["Nothing to display"]]
    else:
      stat = [["Error during RPC call"]]
    callback["siteStatus"] = stat
    callback["resourceStatus"] = stat
    callback["serviceStatus"] = stat
    callback["storageStatus"] = stat
###
    result = RPC.getResourceTypeList()
    if result["OK"]:
      app = []
      if len(result["Value"])>0:
        app.append([str("All")])
        for i in result["Value"]:
          i = i.replace(",",";")
          app.append([i])
      else:
        app = [["Nothing to display"]]
    else:
      app = [["Error during RPC call"]]
    callback["resourceType"] = app
###
    result = RPC.getResourcesList()
    if result["OK"]:
      stat = []
      if len(result["Value"])>0:
        stat.append([str("All")])
        for i in result["Value"]:
          i = i.replace(",",";")
          stat.append([i])
      else:
        stat = [["Nothing to display"]]
    else:
      stat = [["Error during RPC call"]]
    callback["resourceName"] = stat
###
    result = RPC.getServiceTypeList()
    if result["OK"]:
      stat = []
      if len(result["Value"])>0:
        stat.append([str("All")])
        for i in result["Value"]:
          i = i.replace(",",";")
          stat.append([i])
      else:
        stat = [["Nothing to display"]]
    else:
      stat = [["Error during RPC call"]]
    callback["serviceType"] = stat
###
    result = RPC.getServicesList()
    if result["OK"]:
      stat = []
      if len(result["Value"])>0:
        stat.append([str("All")])
        for i in result["Value"]:
          i = i.replace(",",";")
          stat.append([i])
      else:
        stat = [["Nothing to display"]]
    else:
      stat = [["Error during RPC call"]]
    callback["serviceName"] = stat
###
    result = RPC.getStorageElementsList()
    if result["OK"]:
      stat = []
      if len(result["Value"])>0:
        stat.append([str("All")])
        for i in result["Value"]:
          i = i.replace(",",";")
          stat.append([i])
      else:
        stat = [["Nothing to display"]]
    else:
      stat = [["Error during RPC call"]]
    callback["storageName"] = stat
    return callback
################################################################################
  def __reverseCountry(self):
    result = self.__countries()
    name = {}
    for code, country in result.items():
      name[country] = code
    return name
################################################################################
  def __countries(self):
    countries = {
    "af": "Afghanistan",
    "al": "Albania",
    "dz": "Algeria",
    "as": "American Samoa",
    "ad": "Andorra",
    "ao": "Angola",
    "ai": "Anguilla",
    "aq": "Antarctica",
    "ag": "Antigua and Barbuda",
    "ar": "Argentina",
    "am": "Armenia",
    "aw": "Aruba",
    "au": "Australia",
    "at": "Austria",
    "az": "Azerbaijan",
    "bs": "Bahamas",
    "bh": "Bahrain",
    "bd": "Bangladesh",
    "bb": "Barbados",
    "by": "Belarus",
    "be": "Belgium",
    "bz": "Belize",
    "bj": "Benin",
    "bm": "Bermuda",
    "bt": "Bhutan",
    "bo": "Bolivia",
    "ba": "Bosnia and Herzegowina",
    "bw": "Botswana",
    "bv": "Bouvet Island",
    "br": "Brazil",
    "io": "British Indian Ocean Territory",
    "bn": "Brunei Darussalam",
    "bg": "Bulgaria",
    "bf": "Burkina Faso",
    "bi": "Burundi",
    "kh": "Cambodia",
    "cm": "Cameroon",
    "ca": "Canada",
    "cv": "Cape Verde",
    "ky": "Cayman Islands",
    "cf": "Central African Republic",
    "td": "Chad",
    "cl": "Chile",
    "cn": "China",
    "cx": "Christmas Island",
    "cc": "Cocos Islands",
    "co": "Colombia",
    "km": "Comoros",
    "cg": "Congo",
    "cd": "Congo",
    "ck": "Cook Islands",
    "cr": "Costa Rica",
    "ci": "Cote D'Ivoire",
    "hr": "Croatia",
    "cu": "Cuba",
    "cy": "Cyprus",
    "cz": "Czech Republic",
    "dk": "Denmark",
    "dj": "Djibouti",
    "dm": "Dominica",
    "do": "Dominican Republic",
    "tp": "East Timor",
    "ec": "Ecuador",
    "eg": "Egypt",
    "sv": "El Salvador",
    "gq": "Equatorial Guinea",
    "er": "Eritrea",
    "ee": "Estonia",
    "et": "Ethiopia",
    "fk": "Falkland Islands",
    "fo": "Faroe Islands",
    "fj": "Fiji",
    "fi": "Finland",
    "fr": "France",
    "fx": "France, metropolitan",
    "gf": "French Guiana",
    "pf": "French Polynesia",
    "tf": "French Southern Territories",
    "ga": "Gabon",
    "gm": "Gambia",
    "ge": "Georgia",
    "de": "Germany",
    "gh": "Ghana",
    "gi": "Gibraltar",
    "gr": "Greece",
    "gl": "Greenland",
    "gd": "Grenada",
    "gp": "Guadeloupe",
    "gu": "Guam",
    "gt": "Guatemala",
    "gn": "Guinea",
    "gw": "Guinea-Bissau",
    "gy": "Guyana",
    "ht": "Haiti",
    "hm": "Heard and Mc Donald Islands",
    "va": "Vatican City",
    "hn": "Honduras",
    "hk": "Hong Kong",
    "hu": "Hungary",
    "is": "Iceland",
    "in": "India",
    "id": "Indonesia",
    "ir": "Iran",
    "iq": "Iraq",
    "ie": "Ireland",
    "il": "Israel",
    "it": "Italy",
    "jm": "Jamaica",
    "jp": "Japan",
    "jo": "Jordan",
    "kz": "Kazakhstan",
    "ke": "Kenya",
    "ki": "Kiribati",
    "kp": "Korea",
    "kr": "Korea",
    "kw": "Kuwait",
    "kg": "Kyrgyzstan",
    "la": "Lao",
    "lv": "Latvia",
    "lb": "Lebanon",
    "ls": "Lesotho",
    "lr": "Liberia",
    "ly": "Libyan",
    "li": "Liechtenstein",
    "lt": "Lithuania",
    "lu": "Luxembourg",
    "mo": "Macau",
    "mk": "Macedonia",
    "mg": "Madagascar",
    "mw": "Malawi",
    "my": "Malaysia",
    "mv": "Maldives",
    "ml": "Mali",
    "mt": "Malta",
    "mh": "Marshall Islands",
    "mq": "Martinique",
    "mr": "Mauritania",
    "mu": "Mauritius",
    "yt": "Mayotte",
    "mx": "Mexico",
    "fm": "Micronesia",
    "md": "Moldova",
    "mc": "Monaco",
    "mn": "Mongolia",
    "ms": "Montserrat",
    "ma": "Morocco",
    "mz": "Mozambique",
    "mm": "Myanmar",
    "na": "Namibia",
    "nr": "Nauru",
    "np": "Nepal",
    "nl": "Netherlands",
    "an": "Netherlands Antilles",
    "nc": "New Caledonia",
    "nz": "New Zealand",
    "ni": "Nicaragua",
    "ne": "Niger",
    "ng": "Nigeria",
    "nu": "Niue",
    "nf": "Norfolk Island",
    "mp": "Northern Mariana Islands",
    "no": "Norway",
    "om": "Oman",
    "pk": "Pakistan",
    "pw": "Palau",
    "pa": "Panama",
    "pg": "Papua New Guinea",
    "py": "Paraguay",
    "pe": "Peru",
    "ph": "Philippines",
    "pn": "Pitcairn",
    "pl": "Poland",
    "pt": "Portugal",
    "pr": "Puerto Rico",
    "qa": "Qatar",
    "re": "Reunion",
    "ro": "Romania",
    "ru": "Russia",
    "rw": "Rwanda",
    "kn": "Saint Kitts and Nevis",
    "lc": "Saint Lucia",
    "vc": "Saint Vincent and the Grenadines",
    "ws": "Samoa",
    "sm": "San Marino",
    "st": "Sao Tome and Principe",
    "sa": "Saudi Arabia",
    "sn": "Senegal",
    "sc": "Seychelles",
    "sl": "Sierra Leone",
    "sg": "Singapore",
    "sk": "Slovakia",
    "si": "Slovenia",
    "sb": "Solomon Islands",
    "so": "Somalia",
    "za": "South Africa",
    "gs": "South Georgia and the South Sandwich Islands",
    "es": "Spain",
    "lk": "Sri Lanka",
    "sh": "St. Helena",
    "pm": "St. Pierre and Miquelon",
    "sd": "Sudan",
    "sr": "Suriname",
    "sj": "Svalbard and Jan Mayen Islands",
    "sz": "Swaziland",
    "se": "Sweden",
    "ch": "Switzerland",
    "sy": "Syrian Arab Republic",
    "tw": "Taiwan",
    "tj": "Tajikistan",
    "tz": "Tanzania",
    "th": "Thailand",
    "tg": "Togo",
    "tk": "Tokelau",
    "to": "Tonga",
    "tt": "Trinidad and Tobago",
    "tn": "Tunisia",
    "tr": "Turkey",
    "tm": "Turkmenistan",
    "tc": "Turks and Caicos Islands",
    "tv": "Tuvalu",
    "ug": "Uganda",
    "ua": "Ukraine",
    "ae": "United Arab Emirates",
    "gb": "United Kingdom",
    "uk": "United Kingdom",
    "us": "United States",
    "um": "United States Minor Outlying Islands",
    "uy": "Uruguay",
    "uz": "Uzbekistan",
    "vu": "Vanuatu",
    "ve": "Venezuela",
    "vn": "Viet Nam",
    "vg": "Virgin Islands (British)",
    "vi": "Virgin Islands (U.S.)",
    "wf": "Wallis and Futuna Islands",
    "eh": "Western Sahara",
    "ye": "Yemen",
    "yu": "Yugoslavia",
    "zm": "Zambia",
    "zw": "Zimbabwe",
    "su": "Soviet Union"
    }
    return countries
