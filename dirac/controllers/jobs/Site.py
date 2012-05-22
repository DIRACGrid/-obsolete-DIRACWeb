import logging, tempfile
from time import time, gmtime, strftime

from DIRAC.Core.Utilities import Time

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import authorizeAction
from DIRAC import gConfig, gLogger
from DIRAC.Core.Utilities.List import sortList
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

class SiteController(BaseController):
################################################################################
  def display(self):
    return render("jobs/Site.mako")
################################################################################
  @jsonify
  def submit(self):
    pagestart = time()
    RPC = getRPCClient("ResourceStatus/ResourceStatus")
    if request.params.has_key("siteName") and len(request.params["siteName"]) > 0:
      siteName = str(request.params["siteName"])
      RPC = getRPCClient("ResourceStatus/ResourceStatus")
      result = RPC.publisher('Site', siteName, 'Site_View')
#      return result
    else:
      result = {}
      result["OK"] = ""
      result["Message"] = "The parameter 'siteName' is absent"
    if result["OK"]:
      tmpResult = result["Value"]
      gLogger.info("\033[0;31m CALL RESPONSE: \033[0m %s" % tmpResult)
      result = {}
#      try:
      for i in tmpResult:
        if i.has_key("Site_Panel"):
          result["Site_Panel"] = {}
          for j in i["Site_Panel"]:
            if j.has_key("Res"):
              result["Site_Panel"]["Stat"] = j["Res"]
            if j.has_key("InfoForPanel"):
              result["Site_Panel"]["Info"] = j["InfoForPanel"]
        if i.has_key("Service_Computing_Panel"):
          result["Computing_Panel"] = {}
          for j in i["Service_Computing_Panel"]:
            if j.has_key("Res"):
              result["Computing_Panel"]["Stat"] = j["Res"]
            if j.has_key("InfoForPanel"):
              result["Computing_Panel"]["Info"] = j["InfoForPanel"]
        if i.has_key("Service_Storage_Panel"):
          result["Storage_Panel"] = {}
          for j in i["Service_Storage_Panel"]:
            if j.has_key("Res"):
              result["Storage_Panel"]["Stat"] = j["Res"]
            if j.has_key("InfoForPanel"):
              result["Storage_Panel"]["Info"] = j["InfoForPanel"]
      if not result.has_key("Storage_Panel"):
        result["Storage_Panel"] = 'None'
#      except:
#        result = {}
#        result["OK"] = ""
#        result["Message"] = "Exception while parsing the service response 47-70"
    if result.has_key("Message"):
      c.result = {"success":"false","error":result["Message"]}
    else:
      c.result = {"success":"true","result":result}
    return c.result
###############################################################################
  @jsonify
  def action(self):
    pagestart = time()
    if request.params.has_key("siteList") and len(request.params["siteList"]) > 0:
      value = str(request.params["siteList"])
      if value == "true":
        return self.__getSiteList()
      else:
        return {"success":"false","result":"","error":"Unknown parameter: " + value}
    elif request.params.has_key("globalStatJob") and len(request.params["globalStatJob"]) > 0:
      if request.params.has_key("site") and len(request.params["site"]) > 0:
        site = str(request.params["site"])
        return self.__globalStatJob(site)
      else:
        return {"success":"false","result":"","error":"Site name is undefined"}
    elif request.params.has_key("nodeName") and len(request.params["nodeName"]) > 0:
      if request.params.has_key("argument") and len(request.params["argument"]) > 0:
        node = str(request.params["nodeName"])
        mode = str(request.params["argument"])
        return self.__showDetails(node,mode)
      else:
        return {"success":"false","result":"","error":"Argument is undefined"}
################################################################################
  def __showDetails(self,node,mode):
    RPC = getRPCClient("ResourceStatus/ResourceStatus")
    if mode == "SE_View":
      result = RPC.publisher('StorageElement',node,'SE_View')
    elif mode == "Resource_View":
      result = RPC.publisher('Resource',node,'Resource_View')
    else:
      return {"success":"false","result":"","error":"Mode definition is wrong"}
    if result["OK"]:
      tmpResult = result["Value"]
      gLogger.info("\033[0;31m CALL RESPONSE: \033[0m %s" % tmpResult)
      c.result = {"success":"true","result":tmpResult}
    else:
      c.result = {"success":"false","error":result["Message"]}
    return c.result
################################################################################
  def __globalStatJob(self,siteName):

    RPC = getRPCClient("WorkloadManagement/JobMonitoring")
    result = RPC.getStates()
    stat = []
    if result["OK"] and len(result["Value"])>0:
      for i in result["Value"]:
        stat.append(str(i))
    result = RPC.getJobPageSummaryWeb({'Site': [siteName]},[["JobID","DESC"]],0,1,False)
    if result["OK"]:
      result = result["Value"]
      back = []
      if result.has_key("Extras"):
        extra = result["Extras"]
        if len(stat) > 0:
          for i in sortList(stat):
            if i in sortList(extra.keys()):
              back.append([i,extra[i]])
            else:
              back.append([i,"-"])
        else:
          for i in sortList(extra.keys()):
            back.append([i,extra[i]])
      c.result = {"success":"true","result":back}
      c.result = back
    else:
      c.result = {"success":"false","error":result["Message"]}
    gLogger.info("\033[0;31m R E S U L T: \033[0m",c.result)
    return c.result
################################################################################
  def __getSiteList(self):
    callback = {}
    RPC = getRPCClient("ResourceStatus/ResourceStatus")
    result = RPC.getSitesStatusList()
    gLogger.info("\033[0;31m LIST: \033[0m %s" % result)
    if result["OK"]:
      response = []
      tier1 = list(["LCG.CERN.ch","LCG.CNAF.it","LCG.GRIDKA.de","LCG.IN2P3.fr","LCG.NIKHEF.nl","LCG.PIC.es","LCG.RAL.uk","LCG.SARA.nl"])
      if len(result["Value"])>0:
        siteTemp = result["Value"]
        site = {}
        for i in siteTemp:
          site[i[0]] = i[1]
        for i in tier1:
          if site.has_key(i):
            countryCode = i.rsplit(".",1)[1]
            response.append({"site":str(i),"code":str(countryCode),"mask":str(site[i])})
            del site[i]
        for key in sorted(site.iterkeys()):
          countryCode = key.rsplit(".",1)[1]
          response.append({"site":str(key),"code":str(countryCode),"mask":str(site[key])})
      else:
        response = [["Nothing to display"]]
    else:
      response = [["Error during RPC call"]]
    return {"success":"true","result":response}
################################################################################
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
    else:
      result = gConfig.getOption("/Website/ListSeparator")
      if result["OK"]:
        separator = result["Value"]
      else:
        separator = ":::"
      if request.params.has_key("siteName") and len(request.params["siteName"]) > 0:
        if str(request.params["siteName"]) != "All":
          req["SiteName"] = str(request.params["siteName"]).split(separator)
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
    RPC = getRPCClient("WorkloadManagement/WMSAdministrator")
    result = RPC.getSiteMaskSummary()
    gLogger.info("\033[0;31m ++ R ++ \033[0m",result)
    if result["OK"]:
      response = []
      tier1 = list(["LCG.CERN.ch","LCG.CNAF.it","LCG.GRIDKA.de","LCG.IN2P3.fr","LCG.NIKHEF.nl","LCG.PIC.es","LCG.RAL.uk","LCG.SARA.nl"])
      if len(result["Value"])>0:
        site = result["Value"]
#        gLogger.info("=====",initSite)
#        for key in sorted(initSite.iterkeys()):
#        keys = initSite.keys()
#        keys.sort()
#        site = map(initSite.get, keys)
#        gLogger.info("+++++",site)
        for i in tier1:
          if site.has_key(i):
            countryCode = i.rsplit(".",1)[1]
            response.append([str(i),str(countryCode),str(site[i])])
            del site[i]
        for key in sorted(site.iterkeys()):
          countryCode = key.rsplit(".",1)[1]
          response.append([str(key),str(countryCode),str(site[key])])
      else:
        response = [["Nothing to display"]]
    else:
      response = [["Error during RPC call"]]
    callback["siteName"] = response
###
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
