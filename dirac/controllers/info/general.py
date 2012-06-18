import logging
import os

from dirac.lib.base import *
from DIRAC import gConfig, gLogger
from dirac.lib.diset import getRPCClient
from dirac.lib.credentials import getUserDN, getUsername, getAvailableGroups
from dirac.lib.credentials import getProperties
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
  def proxyUpload(self):
    """
    Get p12 file and passwords as input. Split p12 to user key and certificate
    and creating proxy for groups user belongs to. Upload proxy to proxy store
    """
    # Otherwise the browser would offer to download a file
    response.headers['Content-type'] = "text/html"
    username = getUsername()
    gLogger.info("Start upload proxy out of p12 for user: %s" % (username))
    disclaimer  = "\nNo proxy was created\nYour private info was safely deleted"
    disclaimer  = disclaimer + " from DIRAC service"
    if username == "anonymous":
      error = "Please, send a registration request first"
      gLogger.error("Anonymous is not allowed")
      gLogger.debug("Service response: %s" % error)
      return {"success":"false","error":error}
    groupList = getAvailableGroups()
    groups = ", ".join(groupList)
    gLogger.info("Available groups for the user %s: %s" % (username,groups))
    if not len(groupList) > 0:
      gLogger.error("User is not registered in any group")
      error = "Seems that user %s is not register in any group" % username
      error = error + disclaimer
      gLogger.debug("Service response: %s" % error)
      return {"success":"false","error":error}
    store = list()
    gLogger.debug("Request's body:")
    for key in request.params.keys():
      try:
        gLogger.debug("%s - %s" % (key,request.params[key]))
      except Exception,x:
        gLogger.error("Exception: %s" % str(x))
        error  = "An exception has happen '%s'" % str(x)
        error = error + disclaimer
        gLogger.debug("Service response: %s" % error)
        return {"success":"false","error":error}
      try:
        if request.params[key].filename:
          name = request.params[key].filename
          name = name.strip()
          if name[-4:] == ".p12":
            gLogger.info(".p12 in filename detected")
            if request.params["pass_p12"]:
              fileObject = request.params[key]
              fileObject.p12 = str(request.params["pass_p12"])
              gLogger.info(".p12 password detected")
              store.append(fileObject)
              gLogger.info("Certificate object is loaded")
      except Exception,x:
        gLogger.debug("Non fatal for logic, exception happens: %s" % str(x))
        pass
    if not len(store) > 0: # If there is a file(s) to store
      gLogger.error("No file with *.p12 found")
      error = "Failed to find any suitable *.p12 filename in your request"
      error = error + disclaimer
      gLogger.debug("Service response: %s" % error)
      return {"success":"false","error":error}
    gLogger.info("Number of p12 file(s) to process: %s" % len(store))
    import tempfile
    import shutil
    import os
    import random
    import string
    storePath = tempfile.mkdtemp(prefix='DIRAC_')
    gLogger.info("Saving file from request to a tmp directory")
    descriptionList = list()
    try:
      for file in store:
        desc = dict()
        for i in "name","p12","pem":
          tmp = "".join(random.choice(string.letters) for x in range(10))
          desc[i] = os.path.join(storePath,tmp)
        tmpFile = open(desc["name"],"w")
        shutil.copyfileobj(file.file, tmpFile)
        file.file.close()
        tmpFile.close()
        tmpFile = open(desc["p12"],"w")
        tmpFile.write(file.p12)
        tmpFile.close()
        pemPassword = "".join(random.choice(string.letters) for x in range(10))
        tmpFile = open(desc["pem"],"w")
        tmpFile.write(pemPassword)
        tmpFile.close()
        descriptionList.append(desc)
    except Exception,x:
      shutil.rmtree(storePath)
      gLogger.error("Exception: %s" % str(x))
      error  = "An exception has happen '%s'" % str(x)
      error = error + disclaimer
      gLogger.debug("Service response: %s" % error)
      return {"success":"false","error":error}
    if not len(descriptionList) > 0: # If there is a file(s) to store
      shutil.rmtree(storePath)
      gLogger.error("No certificate(s) found")
      error = "List of certificate(s) is empty"
      error = error + disclaimer
      gLogger.debug("Service response: %s" % error)
      return {"success":"false","error":error}
    gLogger.info("Split certificate(s) to public and private keys")
    keyList = list()
    from DIRAC.Core.Utilities import Subprocess
    for i in descriptionList:
      key = dict()
      name = i["name"]
      p12 = i["p12"]
      key["pem"] = i["pem"]
      for j in "pub","private":
        tmp = "".join(random.choice(string.letters) for x in range(10))
        key[j] = os.path.join(storePath,tmp)
      cmdCert = "openssl pkcs12 -clcerts -nokeys -in %s -out %s -password file:%s" % (name,key["pub"],p12)
      cmdKey = "openssl pkcs12 -nocerts -in %s -out %s -passout file:%s -password file:%s" % (name,key["private"],key["pem"],p12)
      for cmd in cmdCert,cmdKey:
        result = Subprocess.shellCall(900,cmd)
        gLogger.debug("Command is: %s" % cmd)
        gLogger.debug("Result is: %s" % result)
        if not result["OK"]:
          shutil.rmtree(storePath)
          gLogger.error(result["Message"])
          error =  "Error while executing SSL command: %s" % result["Message"]
          error = error + disclaimer
          gLogger.debug("Service response: %s" % error)
          return {"success":"false","error":error}
      keyList.append(key)
    if not len(keyList) > 0:
      shutil.rmtree(storePath)
      error = "List of public and private keys is empty"
      gLogger.error(error)
      error = error + disclaimer
      gLogger.debug("Service response: %s" % error)
      return {"success":"false","error":error}
    resultList = list()
    for key in keyList:
      for group in groupList:
        gLogger.info("Uploading proxy for group: %s" % group)
        cmd = "cat %s | dirac-proxy-init -U -g %s -C %s -K %s -p" % (key["pem"],group,key["pub"],key["private"])
        result = Subprocess.shellCall(900,cmd)
        gLogger.debug("Command is: %s" % cmd)
        gLogger.debug("Result is: %s" % result)
        if not result[ 'OK' ]:
          shutil.rmtree(storePath)
          error =  "".join(result["Message"])
          gLogger.error(error)
          if len(resultList) > 0:
            success = "\nHowever some operations has finished successfully:\n"
            success = success + "\n".join(resultList)
            error = error + success
          error = error + disclaimer
          gLogger.debug("Service response: %s" % error)
          return {"success":"false","error":error}
        code = result["Value"][0]
        stdout = result["Value"][1]
        error = result["Value"][2]
        if len(error) > 0:
          error = error.replace(">","")
          error = error.replace("<","")
        if not code == 0:
          if len(resultList) > 0:
            success = "\nHowever some operations has finished successfully:\n"
            success = success + "\n".join(resultList)
            error = error + success
          error = error + disclaimer
          gLogger.debug("Service response: %s" % error)
          return {"success":"false","error":error}
        resultList.append(stdout)
    shutil.rmtree(storePath)
    debug = "\n".join(resultList)
    gLogger.debug(debug)
    groups = ", ".join(groupList)
    result = "Proxy uploaded for user: %s" % username
    if len(groupList) > 0:
      result = result + " in groups: %s" % groups
    else:
      result = result + " in group: %s" % groups
    gLogger.info(result)
    result = "Operation finished successfully\n" + result
    result = result + "\nYour private info was safely deleted from DIRAC server"
    gLogger.debug("Service response: %s" % result)
    return {"success":"true","result":result}
################################################################################
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
    gLogger.info("Start processing a registration request")
    """
    Unfortunately there is no way to get rid of empty text values in JS,
    so i have to hardcode it on server side. Hate it!
    """
    default_values = ["John Smith","jsmith","john.smith@gmail.com","+33 9 10 00 10 00"]
    default_values.append("Select preferred virtual organization(s)")
    default_values.append("Select your country")
    default_values.append("Any additional information you want to provide to administrators")
    # Check for having a DN but no username
    dn = getUserDN()
    username = getUsername()
    gLogger.debug("User's DN: %s and DIRAC username: %s" % (dn, username))
    if not username == "anonymous":
      error = "You are already registered in DIRAC with username: %s" % username
      gLogger.debug("Service response: %s" % error)
      return {"success":"false","error":error}
    else:
      if not dn:
        error = "Certificate is not loaded to a browser or DN is absent"
        gLogger.debug("Service response: %s" % error)
        return {"success":"false","error":error}
    body = ""
    userMail = False
    vo = []
    # Check for user's email, creating mail body
    gLogger.debug("Request's body:")
    for i in paramcopy:
      gLogger.debug("%s - %s" % (i,paramcopy[i]))
      if not paramcopy[i] in default_values:
        if i == "email":
          userMail = paramcopy[i]
        if i == "vo":
          vo = paramcopy[i].split(",")
        body = body + str(i) + ' - "' + str(paramcopy[i]) + '"\n'
    if not userMail:
      error = "Can not get your email address from the request"
      gLogger.debug("Service response: %s" % error)
      return {"success":"false","error":error}
    gLogger.info("User want to be register in VO(s): %s" % vo)
    # TODO Check for previous requests
    # Get admin mail based on requested VO i.e. mail of VO admin
    mails = list()
    gLogger.debug("Trying to get admin username to take care about request")
    for i in vo:
      gLogger.debug("VOAdmin for VO: %s" % i)
      i = i.strip()
      voadm = gConfig.getValue("/Registry/VO/%s/VOAdmin" % i,[])
      gLogger.debug("/Registry/VO/%s/VOAdmin - %s" % (i,voadm))
      for user in voadm:
        mails.append(user)
    # If no VOAdmin - try to get admin mails based on group properties
    if not len(mails) > 0:
      gLogger.debug("No VO admins found. Trying to get something based on group property")
      groupList = list()
      groups = gConfig.getSections("/Registry/Groups")
      gLogger.debug("Group response: %s" % groups)
      if groups["OK"]:
        allGroups = groups["Value"]
        gLogger.debug("Looking for UserAdministrator property")
        for j in allGroups:
          props = getProperties(j)
          gLogger.debug("%s properties: %s" % (j,props)) #1
          if "UserAdministrator" in props: # property which is used for user administration
            groupList.append(j)
      groupList = uniqueElements(groupList)
      gLogger.debug("Chosen group(s): %s" % groupList)
      if len(groupList) > 0:
        for i in groupList:
          users = gConfig.getValue("/Registry/Groups/%s/Users" % i,[])
          gLogger.debug("%s users: %s" % (i,users))
          for user in users:
            mails.append(user)
    # Last stand - Failsafe option
    if not len(mails) > 0:
      gLogger.debug("No suitable groups found. Trying failsafe")
      regAdmin = gConfig.getValue("/Website/UserRegistrationAdmin",[])
      gLogger.debug("/Website/UserRegistrationAdmin - %s" % regAdmin)
      for user in regAdmin:
        mails.append(user)
    mails = uniqueElements(mails)
    gLogger.info("Chosen admin(s): %s" % mails)
    # Final check of usernames
    if not len(mails) > 0:
      error = "Can't get in contact with administrators about your request\n"
      error = error + "Most likely this DIRAC instance is not configured yet"
      gLogger.debug("Service response: %s" % error)
      return {"success":"false","error":error}
    # Convert usernames to { e-mail : full name }
    gLogger.debug("Trying to get admin's mail and associated name")
    sendDict = dict()
    for user in mails:
      email = gConfig.getValue("/Registry/Users/%s/Email" % user,"")
      gLogger.debug("/Registry/Users/%s/Email - '%s'" % (user,email))
      emil = email.strip()
      if not email:
        gLogger.error("Can't find value for option /Registry/Users/%s/Email" % user)
        continue
      fname = gConfig.getValue("/Registry/Users/%s/FullName" % user,"")
      gLogger.debug("/Registry/Users/%s/FullName - '%s'" % (user,fname))
      fname = fname.strip()
      if not fname:
        fname = user
        gLogger.debug("FullName is absent, name to be used: %s" % fname)
      sendDict[email] = fname
    # Final check of mails
    gLogger.debug("Final dictionary with mails to be used %s" % sendDict)
    if not len(sendDict) > 0:
      error = "Can't get in contact with administrators about your request\n"
      error = error + "Most likely this DIRAC instance is not configured yet"
      gLogger.debug("Service response: %s" % error)
      return {"success":"false","error":error}
    # Sending a mail
    sentSuccess = list()
    sentFailed = list()
    gLogger.debug("Initializing Notification client")
    ntc = NotificationClient(lambda x, timeout: getRPCClient(x, timeout=timeout, static = True) )
    gLogger.debug("Sending messages")
    for email,name in sendDict.iteritems():
      gLogger.debug("ntc.sendMail(%s,New user has registered,%s,%s,False" % (email,body,userMail))
      result = ntc.sendMail(email,"New user has registered",body,userMail,False)
      if not result["OK"]:
        error = name + ": " + result["Message"]
        sentFailed.append(error)
        gLogger.error("Sent failure: ", error)
      else:
        gLogger.info("Successfully sent to %s" % name)
        sentSuccess.append(name)
    # Returning results
    sName = ", ".join(sentSuccess)
    gLogger.info("End of processing of a registration request")
    gLogger.debug("Service response sent to a user:")
    if len(sentSuccess) > 0 and len(sentFailed) > 0:
      result = "Your registration request were sent successfully to: "
      result = result + sName + "\n\nFailed to sent it to:\n"
      result = result + "\n".join(sentFailed)
      gLogger.debug(result)
      return {"success":"true","result":result}
    elif len(sentSuccess) > 0 and (not len(sentFailed)) > 0:
      result = "Your registration request were sent successfully to: %s" % sName
      gLogger.debug(result)
      return {"success":"true","result":result}
    elif (not len(sentSuccess)) > 0 and len(sentFailed) > 0:
      result = "Failed to sent your request to:\n"
      result = result + "\n".join(sentFailed)
      gLogger.debug(result)
      return {"success":"false","error":result}
    else:
      result = "No messages were sent to administrator due technical failure"
      gLogger.debug(result)
      return {"success":"false","error":result}

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
