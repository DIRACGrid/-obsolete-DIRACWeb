import logging, tempfile
from time import time, gmtime, strftime

from DIRAC.Core.Utilities import Time

from dirac.lib.base import *
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import authorizeAction
from DIRAC import gConfig, gLogger
from DIRAC.Core.Utilities.DictCache import DictCache
import dirac.lib.credentials as credentials
from DIRAC.ResourceStatusSystem.Client.ResourceStatusClient import ResourceStatusClient

log = logging.getLogger(__name__)

R_NUMBER = 25
P_NUMBER = 0
globalSort = []
GENERALLIST = ["Site","Service","Resource"]
STORELIST = ["StorageRead","StorageWrite","StorageCheck","StorageRemove"]
MODELIST = GENERALLIST + STORELIST
      
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
    RPC = getRPCClient( "ResourceStatus/ResourceStatus" )
    client = ResourceStatusClient( serviceIn = RPC )
    if not request.params.has_key("mode") or not len(request.params["mode"]) > 0:
      gLogger.error("The parameter 'mode' is absent")
      return {"success":"false","error":"The parameter 'mode' is absent"}
    mode = request.params["mode"]
    gLogger.verbose("Requested mode is %s" % mode)
    if not mode in MODELIST:
      gLogger.error("Parameter 'mode': %s is wrong. Should be one of the list %s" % (mode, MODELIST) )
      return {"success":"false","error":"Parameter 'mode' is wrong"}
    if mode in STORELIST:
      mode = 'StorageElement'
    gLogger.verbose("Selected mode is %s" % mode)
    req = self.__request()
    gLogger.info("Client call getMonitoredsStatusWeb(%s,%s,%s,%s)" % (mode,req,P_NUMBER,R_NUMBER))
    result = client.getMonitoredsStatusWeb(mode,req,P_NUMBER,R_NUMBER)
    gLogger.debug("Call result: %s" % result )    
    if not result["OK"]:
      error = result["Message"]
      gLogger.error( error )
      return {"success":"false","error":error}
    result = result["Value"]
    if not result.has_key("TotalRecords") or not result["TotalRecords"] > 0:
      return {"success":"false","error":"There were no data matching your selection"}    
    if not result.has_key("ParameterNames") or not result.has_key("Records"):
      return {"success":"false","error":"Data structure is corrupted"}
    if not len(result["ParameterNames"]) > 0:
      return {"success":"false","error":"ParameterNames field is undefined"}
    if not len(result["Records"]) > 0:
      return {"success":"false","error":"There are no data to display"}
    c.result = []
    records = result["Records"]
    head = result["ParameterNames"]
    headLength = len(head)
    countryCode = self.__countries()
    for i in records:
      tmp = {}
      for j in range(0,headLength):
        tmp[head[j]] = i[j]
        if mode == "Resource":
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
    return c.result
###############################################################################
  def __request(self):
    req = {}  
    global R_NUMBER
    global P_NUMBER
    global globalSort
    globalSort = []
    R_NUMBER = 25
    gLogger.info("Limit",request.params["limit"])    
    if request.params.has_key("limit") and len(request.params["limit"]) > 0:
      R_NUMBER = int(request.params["limit"])
    gLogger.info("NoJ",R_NUMBER)
    P_NUMBER = 0
    if request.params.has_key("start") and len(request.params["start"]) > 0:
      P_NUMBER = int(request.params["start"])
    if request.params.has_key("getSiteHistory") and len(request.params["getSiteHistory"]) > 0:
        req["ExpandSiteHistory"] = str(request.params["getSiteHistory"])
    elif request.params.has_key("getServiceHistory") and len(request.params["getServiceHistory"]) > 0:
        req["ExpandServiceHistory"] = str(request.params["getServiceHistory"])
    elif request.params.has_key("getResourceHistory") and len(request.params["getResourceHistory"]) > 0:
        req["ExpandResourceHistory"] = str(request.params["getResourceHistory"])
    elif request.params.has_key("getStorageHistory") and len(request.params["getStorageHistory"]) > 0:
        req["ExpandStorageElementHistory"] = str(request.params["getStorageHistory"])
    else:
      result = gConfig.getOption("/Website/ListSeparator")
      if result["OK"]:
        separator = result["Value"]
      else:
        separator = ":::"
      if not request.params.has_key("mode") or not len(request.params["mode"]) > 0:
        return req
      mode = request.params["mode"]
      if not mode in MODELIST:
        return req
      selectors = [
                    "SiteStatus",
                    "ResourceStatus",
                    "ServiceStatus",
                    "StorageStatus",
                    "SiteName",
                    "Status",
                    "SiteType",
                    "ServiceName",
                    "ServiceType",
                    "ResourceName",
                    "ResourceType",
                    "StorageElementName"
                  ]
      gLogger.info("params: ",request.params)
      for i in selectors:
        j = i[0].lower() + i[1:]
        if request.params.has_key(j) and len(request.params[j]) > 0:
          if str(request.params[j]) != "All":
            req[i] = str(request.params[j]).split(separator)
          if "All" in req[i]:
            req[i].remove("All")
      if mode in STORELIST:
        status = mode[7:]
        req['StatusType'] = status
    gLogger.info("Request:",req)
    return req
################################################################################
  def __getSelectionData(self):
    callback = {}
    lhcbGroup = credentials.getSelectedGroup()
    lhcbUser = str(credentials.getUsername())
    RPC = getRPCClient( "ResourceStatus/ResourceStatus" )
    client = ResourceStatusClient( serviceIn = RPC )
    if len(request.params) > 0:
      tmp = {}
      for i in request.params:
        tmp[i] = str(request.params[i])
      callback["extra"] = tmp
####
    result = client.getSitePresent( meta = { 'columns' : 'SiteName' } )
    if result["OK"]:
      sites = result["Value"]
      try:
        sites = list(sites)
      except Exception,x:
        gLogger.error("Exception during convertion to a list: %s" % str(x))
        sites = [] # Will return error on length check
      tier1 = gConfig.getValue("/Website/PreferredSites",[]) # Always return a list
      if len(sites)>0:
        tier1.reverse()
        tier1 = [[x] for x in tier1]
        sites = [x for x in sites if x not in tier1] # Removes sites which are in tier1 list
        for i in tier1:
          sites.insert(0,i)
        sites.insert(0,["All"])
      else:
        sites = [["Nothing to display"]]
    else:
      gLogger.error("client.getSitePresent( meta = { 'columns' : 'SiteName' } ) return error: %s" % result["Message"])
      sites = [["Error happened on service side"]]
    callback["siteName"] = sites
    callback["resourceSiteName"] = sites
    callback["serviceSiteName"] = sites
####
    RPC = getRPCClient("ResourceStatus/ResourceStatus")
    result = client.getStorageElementPresent( meta = { "columns" : "GridSiteName" }, statusType = "Read" )
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
      gLogger.error("RPC.getSESitesList() return error: %s" % result["Message"])
      site = [["Error happened on service side"]]
    callback["storageSiteName"] = site
####
    result = client.getValidSiteTypes()
    stat = []
    if result["OK"]:
      value = result["Value"]
      try:
        value = list(value)
      except Exception,x:
        gLogger.error("Exception during convertion to a list: %s" % str(x))
        value = [] # Will return error on length check
      if len(value)>0:
        stat.append(["All"])
        for i in value:
          stat.append([str(i)])
      else:
        stat = [["Nothing to display"]]
    else:
      gLogger.error("client.getValidSiteTypes() return error: %s" % result["Message"])
      stat = [["Error happened on service side"]]
    callback["siteType"] = stat
####
    stat = []
    result = client.getValidStatuses()
    if result["OK"]:
      value = result["Value"]
      try:
        value = list(value)
      except Exception,x:
        gLogger.error("Exception during convertion to a list: %s" % str(x))
        value = [] # Will return error on length check
      if len(value)>0:
        stat.append(["All"])
        for i in value:
          i = i.replace(",",";")
          stat.append([str(i)])
      else:
        stat = [["Nothing to display"]]
    else:
      gLogger.error("client.getValidStatuses() return error: %s" % result["Message"])
      stat = [["Error happened on service side"]]
    callback["siteStatus"] = stat
    callback["resourceStatus"] = stat
    callback["serviceStatus"] = stat
    callback["storageStatus"] = stat
####
    app = []
    result = client.getValidResourceTypes()
    if result["OK"]:
      value = result["Value"]
      try:
        value = list(value)
      except Exception,x:
        gLogger.error("Exception during convertion to a list: %s" % str(x))
        value = [] # Will return error on length check
      if len(value)>0:
        app.append(["All"])
        for i in value:
          i = i.replace(",",";")
          app.append([str(i)])
      else:
        app = [["Nothing to display"]]
    else:
      gLogger.error("client.getValidResourceTypes() return error: %s" % result["Message"])
      app = [["Error happened on service side"]]
    callback["resourceType"] = app
####
    result = client.getResourcePresent( meta = { 'columns' : 'ResourceName' } )
    if result["OK"]:
      value = result["Value"]
      try:
        value = list(value)
      except Exception,x:
        gLogger.error("Exception during convertion to a list: %s" % str(x))
        value = [] # Will return error on length check
      gLogger.info("\n\nV A L U E: %s" % value)
      if len(value)>0:
        value.insert(0,["All"])
        gLogger.info("Deb: %s \n" % value)
      else:
        value = [["Nothing to display"]]
    else:
      gLogger.error("client.getResourcePresent( meta = { 'columns' : 'ResourceName' } ) return error: %s" % result["Message"])
      value = [["Error happened on service side"]]
    callback["resourceName"] = value
####
    stat = []
    result = client.getValidServiceTypes()
    if result["OK"]:
      value = result["Value"]
      try:
        value = list(value)
      except Exception,x:
        gLogger.error("Exception during convertion to a list: %s" % str(x))
        value = [] # Will return error on length check
      if len(value)>0:
        stat.append(["All"])
        for i in value:
          i = i.replace(",",";")
          stat.append([str(i)])
      else:
        stat = [["Nothing to display"]]
    else:
      gLogger.error("client.getValidServiceTypes() return error: %s" % result["Message"])
      stat = [["Error happened on service side"]]
    callback["serviceType"] = stat
####
    result = client.getServicePresent( meta = { 'columns' : 'ServiceName' } )
    if result["OK"]:
      value = result["Value"]
      try:
        value = list(value)
      except Exception,x:
        gLogger.error("Exception during convertion to a list: %s" % str(x))
        value = [] # Will return error on length check
      if len(value)>0:
        value.insert(0,["All"])
      else:
        value = [["Nothing to display"]]
    else:
      gLogger.error("client.getServicePresent( meta = { 'columns' : 'ServiceName' } ) return error: %s" % result["Message"])
      value = [["Error happened on service side"]]
    callback["serviceName"] = value
####
    result = client.getStorageElementPresent( meta = { 'columns' : 'StorageElementName' }, statusType = 'Read' )
    if result["OK"]:
      value = result["Value"]
      try:
        value = list(value)
      except Exception,x:
        gLogger.error("Exception during convertion to a list: %s" % str(x))
        value = [] # Will return error on length check
      if len(value)>0:
        value.insert(0,["All"])
      else:
        value = [["Nothing to display"]]
    else:
      gLogger.error("client.getStorageElementPresent( meta = { 'columns' : 'StorageElementName' }, statusType = 'Read' ) return error: %s" % result["Message"])
      value = [["Error happened on service side"]]
    callback["storageName"] = value
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
