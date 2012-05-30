import logging
import os

from dirac.lib.base import *
from DIRAC import gConfig, gLogger
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import getUserDN, getUsername, getAvailableGroups, getProperties
from DIRAC.FrameworkSystem.Client.NotificationClient import NotificationClient
from DIRAC.Core.Utilities.List import uniqueElements

log = logging.getLogger( __name__ )

class GeneralController( BaseController ):

  def index( self ):
    return redirect_to( controller = "info/general", action = "diracOverview" )

  def diracOverview( self ):
    return render( "/info/diracOverview.mako" )

  def ext4test( self ):
    return render( "/info/ext4test.mako" )
        
  @jsonify
  def action(self):
    if request.params.has_key("getVOList") and len(request.params["getVOList"]) > 0:
      return {"success":"true","result":self.getVOList()}
    elif request.params.has_key("getCountries") and len(request.params["getCountries"]) > 0:
      return {"success":"true","result":self.getCountries()}
    elif request.params.has_key("registration_request") and len(request.params["registration_request"]) > 0:
      paramcopy = dict()
      for i in request.params:
        if not i == "registration_request" and len(request.params[i]) > 0:
          paramcopy[i] = request.params[i]
      return self.registerUser(paramcopy)
    else:
      return {"success":"false","error":"The request parameters can not be recognized or they are not defined"}

  def registerUser(self,paramcopy):
# Unfortunately there is no way to get rid of empty text values in JS, so i have to hardcode it on server side. Hate it!
    default_values = ["John Smith","jsmith","john.smith@gmail.com","+33 9 10 00 10 00"]
    default_values.append("Select preferred virtual organization(s)")
    default_values.append("Select your country")
    default_values.append("Any additional information you want to provide to administrators")
# Check for having a DN but no username
    dn = getUserDN()
    username = getUsername()
    if not username == "anonymous":
      return {"success":"false","error":"You are already registered in DIRAC with username: %s" % username}
    else:
      if not dn:
        return {"success":"false","error":"You have to load certificate to your browser before trying to register"}
    body = ""
    userMail = False
    vo = []
# Check for user's email, creating mail body
    for i in paramcopy:
      if not paramcopy[i] in default_values:
        if i == "email":
          userMail = paramcopy[i]
        if i == "vo":
          vo = paramcopy[i].split(",")
        body = body + str(i) + ' - "' + str(paramcopy[i]) + '"\n'
    if not userMail:
      return {"success":"false","error":"Can not get your email address from the request"}
    gLogger.info("Ask for VO: %s" % vo)
# TODO Check for previous requests
# Get admin mail based on requested VO i.e. mail of VO admin
    mails = list()
    for i in vo:
      i = i.strip()
      voadm = gConfig.getValue("/Registry/VO/%s/VOAdmin" % i,[])
      for user in voadm:
        mails.append(user)
# If no VOAdmin - try to get admin mails based on group properties
    if not len(mails) > 0:
      groupList = list()
      groups = gConfig.getSections("/Registry/Groups")
      if groups["OK"]:
        allGroups = groups["Value"]
        for j in allGroups:
          props = getProperties(j)
          if "UserAdministrator" in props: # property which is used for user administration
            groupList.append(j)
      groupList = uniqueElements(groupList)
      if len(groupList) > 0:
        for i in groupList:
          users = gConfig.getValue("/Registry/Groups/%s/Users" % i,[])
          for user in users:
            mails.append(user)
    # Last stand - Failsafe option
    if not len(mails) > 0:
      regAdmin = gConfig.getValue("/Website/UserRegistrationAdmin",[])
      for user in regAdmin:
        mails.append(user)
    mails = uniqueElements(mails)
    # Final check of usernames
    if not len(mails) > 0:
      error = "Can't get in contact with administrators about your request\n"
      error = error + "Most likely this DIRAC instance is not configured yet"
      return {"success":"false","error":error}
    # Convert usernames to mail : full name dict
    sendDict = dict()
    for user in mails:
      email = gConfig.getValue("/Registry/Users/%s/Email" % user,"")
      emil = email.strip()
      if not email:
        gLogger.error("Can't find value for option /Registry/Users/%s/Email" % user)
        continue
      fname = gConfig.getValue("/Registry/Users/%s/FullName" % user,"")
      fname = fname.strip()
      if not fname:
        fname = user
      sendDict[email] = fname
    # Final check of mails
    if not len(sendDict) > 0:
      error = "Can't get in contact with administrators about your request\n"
      error = error + "Most likely this DIRAC instance is not configured yet"
      return {"success":"false","error":error}
    # Sending a mail
    sentSuccess = list()
    sentFailed = list()
    ntc = NotificationClient(lambda x, timeout: getRPCClient(x, timeout=timeout, static = True) )
    for email,name in sendDict.iteritems():
      result = ntc.sendMail(email,"New user has registered",body,userMail,False)
      if not result["OK"]:
        error = name + ": " + result["Message"]
        sentFailed.append(error)
        gLogger.error("Sent failure: ", error)
      else:
        sentSuccess.append(name)
    # Returning results
    sName = ", ".join(sentSuccess)
    gLogger.info("Sent success: ",sentSuccess)
    if len(sentSuccess) > 0 and len(sentFailed) > 0:
      result = "Your registration request were sent successfully to: "
      result = result + sName + "\n\nFailed to sent it to:\n"
      result = result + "\n".join(sentFailed)
      return {"success":"true","result":result}
    elif len(sentSuccess) > 0 and (not len(sentFailed)) > 0:
      result = "Your registration request were sent successfully to: %s" % sName
      return {"success":"true","result":result}
    elif (not len(sentSuccess)) > 0 and len(sentFailed) > 0:
      result = "Failed to sent your request to:\n"
      result = result + "\n".join(sentFailed)
      return {"success":"false","error":result}
    else:
      return {"success":"false","error":"No messages were sent to administrator due technical failure"}

  def getVOList(self):
    result = gConfig.getSections("/Registry/VO")
    if result["OK"]:
      vo = result["Value"]
    else:
      vo = ""
    return vo
    
  def getCountries(self):
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
